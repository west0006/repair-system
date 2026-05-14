import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MaterialBillStatus, RepairOrder } from './order.entity';
import { OrderLog } from './order-log.entity';
import { Technician } from '../technician/technician.entity';
import { AutoDispatchService } from './auto-dispatch.service';
import { OrderStatus } from './order-status.enum';
import { User } from '../auth/user.entity';
import { NotificationService } from '../common/notification.service';
import { Role } from '../auth/roles.enum';
import {
  MaterialApplication,
  MaterialApplicationStatus,
} from '../material/material-application.entity';
import { Material } from '../material/material.entity';
import { StockOut } from '../material/stock-out.entity';
import { SetMaterialBillDTO } from './dto/set-material-bill.dto';
import { WechatService } from '../wechat/wechat.service';

export interface FindAllParams {
  status?: number;
  orderNo?: string;
  userName?: string;
  startDate?: Date;
  endDate?: Date;
}

interface CreateOrderData {
  scheduledTime?: Date | string;
  orderNo: string;
  userId: number;
  userName: string;
  userPhone: string;
  faultType?: string;
  faultDesc?: string;
  images?: string[];
  locationBuilding?: string;
  locationFloor?: string;
  locationRoom?: string;
  urgency: number;
  status: OrderStatus;
}

export interface CompleteOrderData {
  repairContent: string;
  materials: { name: string; quantity: number }[];
  afterPhotos?: string[];
}

interface PendingOrderFilters {
  area?: string;
  faultType?: string;
  urgency?: number;
}

@Injectable()
class OrderService {
  constructor(
    @InjectRepository(RepairOrder)
    private orderRepo: Repository<RepairOrder>,
    @InjectRepository(OrderLog)
    private logRepo: Repository<OrderLog>,
    @InjectRepository(Technician)
    private techRepo: Repository<Technician>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Material)
    private materialRepo: Repository<Material>,
    @InjectRepository(MaterialApplication)
    private materialAppRepo: Repository<MaterialApplication>,

    private autoDispatchService: AutoDispatchService,
    private notificationService: NotificationService,
    private dataSource: DataSource,
    private wechatService: WechatService,
  ) {}

  // 简单日期格式化
  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${mi}`;
  }

  async create(data: CreateOrderData): Promise<RepairOrder> {
    const user = await this.userRepo.findOne({ where: { id: data.userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const urgency =
      data.urgency === 1
        ? this.evaluateUrgency(data.faultDesc || '', data.faultType || '')
        : data.urgency;
    let scheduledTime: Date | undefined;
    if (data.scheduledTime) {
      const parsed = new Date(data.scheduledTime);
      if (!isNaN(parsed.getTime())) {
        scheduledTime = parsed;
      }
    }
    const orderData = {
      ...data,
      userName: data.userName || user.name,
      userPhone: data.userPhone || user.phone,
      urgency,
      scheduledTime,
    };

    const order = this.orderRepo.create(orderData);
    await this.orderRepo.save(order);
    await this.logRepo.save({
      orderId: order.id,
      userName: order.userName,
      userPhone: order.userPhone,
      toStatus: order.status,
      operatorId: data.userId,
      remark: '创建工单',
    });

    // 发送订阅消息
    if (user.openid) {
      void this.wechatService.sendSubscribeMessage({
        touser: user.openid,
        templateId: 'q_RnrEAiPozaFQuQYWmgtgQi1tS6gtYSew4HlWpT-Vo',
        page: `/pages/user/orderDetail?id=${order.id}`,
        data: {
          订单编号: { value: order.orderNo },
          下单时间: { value: this.formatDate(order.createdAt) },
          报修项目: { value: order.faultType || '故障报修' },
        },
      });
    }
    return order;
  }

  private evaluateUrgency(faultDesc: string, faultType: string): number {
    const text = (faultDesc + ' ' + faultType).toLowerCase();
    const criticalKeywords = [
      '漏电',
      '触电',
      '短路',
      '起火',
      '着火',
      '冒烟',
      '烧焦',
      '爆管',
      '水管爆裂',
      '喷水',
      '水柱',
      '跑水',
      '大面积淹水',
      '水漫',
      '淹了',
      '发大水',
      '化粪池',
      '粪水',
      '污水外溢',
      '粪便倒灌',
      '下水道反水',
      '电梯',
      '被困',
    ];
    for (const keyword of criticalKeywords) {
      if (text.includes(keyword)) return 3;
    }
    const urgentKeywords = ['严重漏水', '大面积停电', '空调不制冷'];
    for (const keyword of urgentKeywords) {
      if (text.includes(keyword)) return 2;
    }
    return 1;
  }

  async findById(id: number): Promise<RepairOrder | null> {
    return this.orderRepo.findOne({
      where: { id },
      relations: ['technician', 'technician.user'],
    });
  }

  async findByUser(userId: number): Promise<RepairOrder[]> {
    return this.orderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByTechnician(technicianId: number): Promise<RepairOrder[]> {
    return this.orderRepo.find({
      where: { technicianId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    id: number,
    status: OrderStatus,
    remark?: string,
    operatorId?: number,
  ) {
    const oldOrder = await this.findById(id);
    if (!oldOrder) throw new NotFoundException('工单不存在');
    await this.orderRepo.update(id, { status });
    await this.logRepo.save({
      orderId: id,
      fromStatus: oldOrder.status,
      toStatus: status,
      operatorId,
      remark,
    });
    return true;
  }

  async setMaterialBill(
    technicianId: number,
    dto: SetMaterialBillDTO & { serviceFee?: number },
  ) {
    const order = await this.orderRepo.findOneBy({ id: dto.repair_order_id });
    if (!order) throw new NotFoundException('工单不存在');
    const tech = await this.techRepo.findOne({
      where: { userId: technicianId },
      select: ['id'],
    });
    if (!tech) throw new ForbiddenException('技师信息不存在');
    if (order.technicianId !== tech.id)
      throw new ForbiddenException('无权限操作此工单');
    if (![OrderStatus.ON_WAY, OrderStatus.REPAIRING].includes(order.status))
      throw new BadRequestException('状态不允许设定账单');

    const totalPay = (dto.pay_amount || 0) + (dto.serviceFee || 0);
    order.material_bill = dto.items;
    order.material_bill_amount = dto.total_amount;
    order.material_bill_discount = dto.discount;
    order.material_bill_pay_amount = totalPay;
    order.serviceFee = dto.serviceFee || 0;
    order.material_bill_status = MaterialBillStatus.PENDING_REVIEW;
    order.status = OrderStatus.REPAIRING;
    await this.orderRepo.save(order);

    const admins = await this.userRepo.find({ where: { role: Role.Admin } });
    for (const admin of admins) {
      await this.notificationService.create({
        userId: admin.id,
        title: '物料账单待审核',
        content: `工单 ${order.orderNo} 提交了物料账单，请审核`,
        link: `/order/detail/${order.id}`,
      });
    }
    return order;
  }

  async payMaterialBill(userId: number, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
    });
    if (!order) throw new ForbiddenException('无权操作此工单');
    if (order.material_bill_status !== 2)
      throw new BadRequestException('订单状态不可支付');

    const application = await this.materialAppRepo.findOne({
      where: { orderId, status: MaterialApplicationStatus.PENDING_PAYMENT },
    });
    if (!application) throw new BadRequestException('未找到有效的物料申领单');

    if (application.lockExpiresAt && application.lockExpiresAt < new Date()) {
      await this.releaseLockedStock(application);
      application.status = MaterialApplicationStatus.CANCELLED;
      application.paymentStatus = 2;
      await this.materialAppRepo.save(application);
      throw new BadRequestException('支付超时，请重新申领');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const item of application.items) {
        const material = await queryRunner.manager.findOne(Material, {
          where: { id: item.materialId },
          lock: { mode: 'pessimistic_write' },
        });
        if (material) {
          material.stock -= item.quantity;
          material.lockedStock = Math.max(
            0,
            material.lockedStock - item.quantity,
          );
          await queryRunner.manager.save(material);
        }
        const outbound = queryRunner.manager.create(StockOut, {
          orderNo: `OUT${Date.now()}`,
          materialId: item.materialId,
          quantity: item.quantity,
          reason: '工单消耗',
          repairOrderId: orderId,
          applicantId: application.applicantId,
          status: 1,
          outboundType: 'order',
        });
        await queryRunner.manager.save(outbound);
      }

      application.status = MaterialApplicationStatus.PAID;
      application.paymentStatus = 1;
      await queryRunner.manager.save(application);

      order.material_bill_status = 3;
      order.status = OrderStatus.REPAIRING;
      order.payTime = new Date();
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      // 发送支付成功通知
      const payer = await this.userRepo.findOne({
        where: { id: order.userId },
      });
      if (payer?.openid) {
        void this.wechatService.sendSubscribeMessage({
          touser: payer.openid,
          templateId: '3GREsjBgAnEl_Zzwy8LhYVvUOcV3cZIceZ1vTRDZPfc',
          page: `/pages/user/orderDetail?id=${orderId}`,
          data: {
            订单编号: { value: order.orderNo },
            支付金额: { value: `${order.material_bill_pay_amount}元` },
            支付时间: { value: this.formatDate(new Date()) },
          },
        });
      }
      return { success: true };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async releaseLockedStock(application: MaterialApplication) {
    for (const item of application.items) {
      const material = await this.materialRepo.findOne({
        where: { id: item.materialId },
      });
      if (material) {
        material.lockedStock = Math.max(
          0,
          material.lockedStock - item.quantity,
        );
        await this.materialRepo.save(material);
      }
    }
  }

  async approve(id: number, operatorId: number, autoDispatch: boolean = true) {
    await this.updateStatus(id, OrderStatus.APPROVED, '审批通过', operatorId);
    const order = await this.findById(id);
    if (order && autoDispatch) {
      await this.autoDispatchService.autoDispatch(order);
    }
  }

  async reject(id: number, reason: string, operatorId: number) {
    await this.updateStatus(id, OrderStatus.REJECTED, reason, operatorId);
  }

  async accept(orderId: number, technicianId: number) {
    const order = await this.findById(orderId);
    if (!order) throw new NotFoundException('工单不存在');
    if (order.technicianId !== technicianId)
      throw new BadRequestException(
        `无权接单：工单分配师傅 ID=${order.technicianId}，您师傅 ID=${technicianId}`,
      );
    if (order.status !== OrderStatus.DISPATCHED)
      throw new BadRequestException(`工单状态不正确：当前状态=${order.status}`);
    await this.updateStatus(
      orderId,
      OrderStatus.ACCEPTED,
      '师傅接单',
      technicianId,
    );
    await this.orderRepo.update(orderId, { acceptTime: new Date() });

    // 通知学生
    const tech = await this.techRepo.findOne({
      where: { id: technicianId },
      relations: ['user'],
    });
    const reporter = await this.userRepo.findOne({
      where: { id: order.userId },
    });
    if (reporter?.openid && tech?.user) {
      void this.wechatService.sendSubscribeMessage({
        touser: reporter.openid,
        templateId: 'lzkE05FYfkkzNuexlcimo7nrdchlF5u2DOkOvovF59s',
        page: `/pages/user/orderDetail?id=${orderId}`,
        data: {
          订单编号: { value: order.orderNo },
          接单时间: { value: this.formatDate(new Date()) },
          师傅姓名: { value: tech.user.name },
          师傅电话: { value: tech.user.phone },
        },
      });
    }
  }

  async complete(
    orderId: number,
    technicianId: number,
    data: CompleteOrderData,
  ) {
    const order = await this.findById(orderId);
    if (!order) throw new NotFoundException('工单不存在');
    if (order.technicianId !== technicianId)
      throw new BadRequestException('无权操作');
    if (order.material_bill_status === 2)
      throw new BadRequestException('物料费用未支付，无法完成维修');
    if (![OrderStatus.REPAIRING, OrderStatus.ON_WAY].includes(order.status))
      throw new BadRequestException('工单状态不正确，无法完成');

    await this.updateStatus(
      orderId,
      OrderStatus.COMPLETED,
      '维修完成',
      technicianId,
    );

    const repairRecord: any = {
      repairContent: data.repairContent,
      materials: data.materials,
      duration: data.afterPhotos ? 0 : undefined,
    };
    await this.orderRepo.update(orderId, {
      endTime: new Date(),
      repairRecord,
      afterPhotos: data.afterPhotos || [],
    });

    const admins = await this.userRepo.find({ where: { role: Role.Admin } });
    for (const admin of admins) {
      await this.notificationService.create({
        userId: admin.id,
        title: '工单已完成',
        content: `工单 ${order.orderNo} 已完成维修，请知悉。`,
        link: `/order/detail/${order.id}`,
      });
    }

    // 提醒评价
    const tech = await this.techRepo.findOne({
      where: { id: technicianId },
      relations: ['user'],
    });
    const reporter = await this.userRepo.findOne({
      where: { id: order.userId },
    });
    if (reporter?.openid && tech?.user) {
      void this.wechatService.sendSubscribeMessage({
        touser: reporter.openid,
        templateId: 'MBqBQha-AJxBW6Gne4FNbkBmF-ld5XlysMv4dUeOLUs',
        page: `/pages/user/orderDetail?id=${orderId}`,
        data: {
          订单编号: { value: order.orderNo },
          报修原因: { value: order.faultType || '故障报修' },
          服务人员: { value: tech.user.name },
          完成时间: { value: this.formatDate(new Date()) },
        },
      });
    }
  }

  async updateEvaluation(orderId: number, score: number, comment: string) {
    const order = await this.findById(orderId);
    if (!order) throw new NotFoundException('工单不存在');
    if (order.status !== OrderStatus.COMPLETED)
      throw new BadRequestException('只能评价已完成工单');
    await this.orderRepo.update(orderId, {
      evaluationScore: score,
      evaluationComment: comment,
    });
  }

  async getPendingOrders(
    technicianId: number,
    filters: PendingOrderFilters,
  ): Promise<RepairOrder[]> {
    const technician = await this.techRepo.findOne({
      where: { id: technicianId },
    });
    if (!technician) throw new NotFoundException('师傅不存在');
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .where('o.status = :status', { status: OrderStatus.DISPATCHED })
      .andWhere('o.technicianId = :technicianId', { technicianId });
    if (filters.area)
      qb.andWhere('o.locationBuilding = :area', { area: filters.area });
    if (filters.faultType)
      qb.andWhere('o.faultType = :type', { type: filters.faultType });
    if (filters.urgency)
      qb.andWhere('o.urgency = :urgency', { urgency: filters.urgency });
    qb.orderBy('o.urgency', 'DESC').addOrderBy('o.createdAt', 'ASC');
    return qb.getMany();
  }

  async rejectOrder(orderId: number, reason: string, operatorId: number) {
    const order = await this.findById(orderId);
    if (!order) throw new NotFoundException('工单不存在');
    if (order.technicianId !== operatorId)
      throw new BadRequestException('无权操作此工单');
    if (order.status !== OrderStatus.DISPATCHED)
      throw new BadRequestException('只能拒绝已派单的工单');
    await this.updateStatus(orderId, OrderStatus.REJECTED, reason, operatorId);
    await this.orderRepo.update(orderId, { technicianId: undefined });
    const updatedOrder = await this.findById(orderId);
    if (updatedOrder) {
      await this.autoDispatchService.autoDispatch(updatedOrder);
    }
    // 拒单通知用户
    const orderUser = await this.userRepo.findOne({
      where: { id: order.userId },
    });
    if (orderUser?.openid) {
      void this.wechatService.sendSubscribeMessage({
        touser: orderUser.openid,
        templateId: 'mVtYMTsEZsjooCJxKnfJIWX4VaG7vInoMoC8TytCZBQ',
        page: `/pages/user/orderDetail?id=${orderId}`,
        data: {
          订单编号: { value: order.orderNo },
          拒单理由: { value: reason },
        },
      });
    }
  }

  async updateTechnicianStatus(
    orderId: number,
    status: OrderStatus,
    technicianId: number,
  ) {
    const order = await this.findById(orderId);
    if (!order) throw new NotFoundException('工单不存在');
    if (order.technicianId !== technicianId)
      throw new BadRequestException('无权操作此工单');
    const allowed = [
      OrderStatus.ON_WAY,
      OrderStatus.REPAIRING,
      OrderStatus.WAITING_PARTS,
    ];
    if (!allowed.includes(status))
      throw new BadRequestException('不允许更新为此状态');
    await this.updateStatus(
      orderId,
      status,
      `师傅更新状态为${status}`,
      technicianId,
    );
    if (status === OrderStatus.ON_WAY && !order.startTime) {
      await this.orderRepo.update(orderId, { startTime: new Date() });
    }
  }

  async findAllWithPagination(
    filters: FindAllParams,
    page: number,
    limit: number,
  ): Promise<[RepairOrder[], number]> {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.technician', 'tech')
      .leftJoinAndSelect('tech.user', 'techUser');
    if (filters.status)
      qb.andWhere('o.status = :status', { status: filters.status });
    if (filters.orderNo)
      qb.andWhere('o.orderNo LIKE :orderNo', {
        orderNo: `%${filters.orderNo}%`,
      });
    if (filters.userName)
      qb.andWhere('o.userName LIKE :userName', {
        userName: `%${filters.userName}%`,
      });
    if (filters.startDate && filters.endDate)
      qb.andWhere('o.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    const [list, total] = await qb
      .orderBy('o.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return [list, total];
  }

  async findPendingOrders(
    technicianId: number,
    filters: { area?: string; faultType?: string; urgency?: number },
    page: number,
    limit: number,
  ): Promise<[RepairOrder[], number]> {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.technician', 'tech')
      .leftJoinAndSelect('tech.user', 'techUser')
      .where('o.status = :status', { status: OrderStatus.DISPATCHED })
      .andWhere('o.technicianId = :technicianId', { technicianId });
    if (filters.area)
      qb.andWhere('o.locationBuilding = :area', { area: filters.area });
    if (filters.faultType)
      qb.andWhere('o.faultType = :type', { type: filters.faultType });
    if (filters.urgency)
      qb.andWhere('o.urgency = :urgency', { urgency: filters.urgency });
    const [list, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return [list, total];
  }

  async findByTechnicianWithPagination(
    technicianId: number,
    page: number,
    limit: number,
  ): Promise<[RepairOrder[], number]> {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.technician', 'tech')
      .leftJoinAndSelect('tech.user', 'techUser')
      .where('o.technicianId = :technicianId', { technicianId })
      .orderBy('o.createdAt', 'DESC');
    const [list, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return [list, total];
  }

  async manualDispatch(
    orderId: number,
    technicianId: number,
    operatorId: number,
  ) {
    const order = await this.findById(orderId);
    if (!order) throw new NotFoundException('工单不存在');
    if (order.status !== OrderStatus.APPROVED)
      throw new BadRequestException('工单状态不正确，无法派单');
    const technician = await this.techRepo.findOne({
      where: { id: technicianId },
      relations: ['user'],
    });
    if (!technician) throw new NotFoundException('师傅不存在');
    await this.orderRepo.update(orderId, {
      technicianId,
      status: OrderStatus.DISPATCHED,
    });
    await this.logRepo.save({
      orderId,
      fromStatus: order.status,
      toStatus: OrderStatus.DISPATCHED,
      operatorId,
      remark: `手动派单给 ${technician.user.name}`,
    });

    // 通知师傅
    const techUser = await this.userRepo.findOne({
      where: { id: technician.userId },
    });
    if (techUser?.openid) {
      void this.wechatService.sendSubscribeMessage({
        touser: techUser.openid,
        templateId: 'yq3uejcDX0ASu5XaBU8S2gwUQFcfl9yGr1dSOTQVujY',
        page: `/pages/technician/orderDetail?id=${order.id}`,
        data: {
          工单编号: { value: order.orderNo },
          报修内容: { value: order.faultDesc || '无' },
          报修地点: {
            value: `${order.locationBuilding} ${order.locationFloor} ${order.locationRoom}`,
          },
          预约时间: {
            value: order.scheduledTime
              ? this.formatDate(new Date(order.scheduledTime))
              : '尽快上门',
          },
        },
      });
    }
  }

  async getLogs(orderId: number): Promise<OrderLog[]> {
    return this.logRepo.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }
}

export default OrderService;
