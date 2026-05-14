import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepairOrder } from './order.entity';
import { Technician } from '../technician/technician.entity';
import { TechnicianBuilding } from '../technician/technician-building.entity';
import { OrderLog } from './order-log.entity';
import { NotificationService } from '../common/notification.service';
import { OrderStatus } from './order-status.enum';
import { Role } from '../auth/roles.enum';
import { User } from '../auth/user.entity';
import { Building } from '../building/building.entity';
import { RepairPositionService } from '../technician/repair-position.service';
import { TechnicianService } from '../technician/technician.service';

@Injectable()
export class AutoDispatchService {
  private readonly logger = new Logger(AutoDispatchService.name);

  constructor(
    @InjectRepository(RepairOrder) private orderRepo: Repository<RepairOrder>,
    @InjectRepository(Technician) private techRepo: Repository<Technician>,
    @InjectRepository(TechnicianBuilding)
    private techBuildingRepo: Repository<TechnicianBuilding>,
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
    @InjectRepository(OrderLog) private logRepo: Repository<OrderLog>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private notificationService: NotificationService,
    private repairPositionService: RepairPositionService,
    private technicianService: TechnicianService, // 新增
  ) {}

  async autoDispatch(order: RepairOrder): Promise<void> {
    if (order.faultType == null) {
      this.logger.warn(`工单 ${order.orderNo} 未指定故障类型，无法自动派单`);
      return;
    }
    this.logger.log(
      `开始自动派单，工单号: ${order.orderNo}, 故障类型: ${order.faultType}`,
    );
    const position = await this.repairPositionService.findByName(
      order.faultType,
    );
    if (!position) {
      this.logger.warn(
        `工单 ${order.orderNo} 无对应岗位配置: ${order.faultType}`,
      );
      await this.notifyAdmins(
        '派单失败',
        `工单 ${order.orderNo} 无对应岗位配置，请手动派单`,
        order.id,
      );
      return;
    }

    let selected: Technician | null = null;
    switch (position.dispatchType) {
      case 'area':
        selected = await this.dispatchByArea(order, position.name);
        break;
      case 'round_robin':
        selected = await this.dispatchRoundRobin(order);
        break;
      case 'direct':
      default:
        selected = await this.dispatchDirect(order, position.name);
        break;
    }

    if (!selected) {
      this.logger.warn(`工单 ${order.orderNo} 无可用师傅`);
      await this.notifyAdmins(
        '派单失败',
        `工单 ${order.orderNo} 无可用师傅，请手动派单`,
        order.id,
      );
      return;
    }
    this.logger.log(`工单 ${order.orderNo} 派单给师傅 ${selected.user.name}`);
    await this.assignOrder(order, selected);
  }

  private async dispatchDirect(
    order: RepairOrder,
    skill: string,
  ): Promise<Technician | null> {
    const technicians = await this.findAvailableTechnicians(skill);
    return this.selectBest(technicians);
  }

  private async dispatchByArea(
    order: RepairOrder,
    skill: string,
  ): Promise<Technician | null> {
    const building = await this.buildingRepo.findOne({
      where: { name: order.locationBuilding },
    });
    if (!building) {
      const techs = await this.findAvailableTechnicians(skill);
      return this.selectBest(techs);
    }

    const mappings = await this.techBuildingRepo.find({
      where: { buildingId: building.id },
      relations: ['technician', 'technician.user'],
    });

    const candidateIds = mappings.map((m) => m.technicianId);
    if (candidateIds.length === 0) {
      const techs = await this.findAvailableTechnicians(skill);
      return this.selectBest(techs);
    }

    const qb = this.techRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.user', 'user')
      .where('t.id IN (:...ids)', { ids: candidateIds })
      .andWhere('t.status = 1')
      .andWhere('t.skills LIKE :skill', { skill: `%${skill}%` });

    const techs = await qb.getMany();

    const techsWithLoad = await Promise.all(
      techs.map(async (t) => ({
        tech: t,
        load: await this.technicianService.getCurrentOrderCount(t.id),
      })),
    );
    techsWithLoad.sort((a, b) => a.load - b.load);
    return techsWithLoad[0]?.tech ?? null;
  }

  private async dispatchRoundRobin(
    order: RepairOrder,
  ): Promise<Technician | null> {
    const lastDredge = await this.orderRepo.findOne({
      where: { faultType: '疏通' },
      order: { createdAt: 'DESC' },
    });
    let nextSkill = '水电维修';
    if (lastDredge?.technicianId) {
      const lastTech = await this.techRepo.findOne({
        where: { id: lastDredge.technicianId },
      });
      if (lastTech?.skills?.includes('水电维修')) nextSkill = '木工维修';
    }
    const techs = await this.findAvailableTechnicians(nextSkill);
    return this.selectBest(techs);
  }

  private async findAvailableTechnicians(skill: string): Promise<Technician[]> {
    return this.techRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.user', 'user')
      .where('t.status = 1')
      .andWhere('t.skills LIKE :skill', { skill: `%${skill}%` })
      .getMany();
  }

  private async selectBest(techs: Technician[]): Promise<Technician | null> {
    if (techs.length === 0) return null;
    const techsWithLoad = await Promise.all(
      techs.map(async (t) => ({
        tech: t,
        load: await this.technicianService.getCurrentOrderCount(t.id),
      })),
    );
    techsWithLoad.sort((a, b) => a.load - b.load);
    return techsWithLoad[0]?.tech ?? null;
  }

  private async assignOrder(
    order: RepairOrder,
    tech: Technician,
  ): Promise<void> {
    await this.orderRepo.update(order.id, {
      technicianId: tech.id,
      status: OrderStatus.DISPATCHED,
    });

    await this.logRepo.save({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: OrderStatus.DISPATCHED,
      operatorId: 0,
      remark: `系统自动派单给 ${tech.user.name}`,
    });

    await this.notificationService.create({
      userId: tech.userId,
      title: '新工单',
      content: `工单 ${order.orderNo} 已派发给您，请及时处理`,
      link: `/order/detail/${order.id}`,
    });

    if (order.urgency === 3) {
      await this.notifyAdmins(
        '紧急工单已派单',
        `工单 ${order.orderNo} 已自动派给 ${tech.user.name}，请关注进度`,
        order.id,
      );
    }
  }

  private async notifyAdmins(
    title: string,
    content: string,
    orderId: number,
  ): Promise<void> {
    const admins = await this.userRepo.find({ where: { role: Role.Admin } });
    for (const admin of admins) {
      await this.notificationService.create({
        userId: admin.id,
        title,
        content,
        link: `/order/detail/${orderId}`,
      });
    }
  }
}
