import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Technician } from './technician.entity';
import { TechnicianBuilding } from './technician-building.entity';
import { CreateTechnicianDto } from './dto/technician.dto';
import { RepairOrder } from '../order/order.entity';
import { OrderStatus } from '../order/order-status.enum';
// import { Building } from '../building/building.entity';

@Injectable()
export class TechnicianService {
  constructor(
    @InjectRepository(Technician)
    private techRepo: Repository<Technician>,
    @InjectRepository(TechnicianBuilding)
    private techBuildingRepo: Repository<TechnicianBuilding>,
    @InjectRepository(RepairOrder)
    private repairOrderRepo: Repository<RepairOrder>,
    // @InjectRepository(Building)
    // private buildingRepo: Repository<Building>,
  ) {}

  async findAll(): Promise<Technician[]> {
    return this.techRepo.find({
      relations: ['user', 'buildingMappings', 'buildingMappings.building'],
    });
  }

  async findByUserId(userId: number): Promise<Technician | null> {
    return this.techRepo.findOne({
      where: { userId },
      relations: ['user', 'buildingMappings', 'buildingMappings.building'],
    });
  }

  async findById(id: number): Promise<Technician | null> {
    return this.techRepo.findOne({
      where: { id },
      relations: ['user', 'buildingMappings', 'buildingMappings.building'],
    });
  }

  async create(
    dto: CreateTechnicianDto & { buildingIds?: number[] },
  ): Promise<Technician> {
    const existing = await this.techRepo.findOne({
      where: { userId: dto.userId },
    });
    if (existing) throw new BadRequestException('该用户已是技师');

    const tech = this.techRepo.create({
      userId: dto.userId,
      areaId: dto.areaId,
      skills: dto.skills,
      status: dto.status ?? 1,
    });
    const savedTech = await this.techRepo.save(tech);

    // 保存责任楼栋关联
    if (dto.buildingIds && dto.buildingIds.length > 0) {
      const mappings = dto.buildingIds.map((buildingId) => ({
        technicianId: savedTech.id,
        buildingId,
      }));
      await this.techBuildingRepo.save(mappings);
    }

    const result = await this.findById(savedTech.id);
    if (!result) {
      throw new NotFoundException('创建后无法获取技师信息');
    }
    return result;
  }

  async updateStatus(technicianId: number, status: number): Promise<void> {
    await this.techRepo.update(technicianId, { status });
  }

  async getCurrentOrderCount(technicianId: number): Promise<number> {
    return this.repairOrderRepo.count({
      where: {
        technicianId,
        status: In([
          OrderStatus.DISPATCHED,
          OrderStatus.ACCEPTED,
          OrderStatus.ON_WAY,
          OrderStatus.REPAIRING,
          OrderStatus.WAITING_PARTS,
        ]),
      },
    });
  }

  async getTechnicianStats(userId: number) {
    const tech = await this.techRepo.findOne({ where: { userId } });
    if (!tech) throw new NotFoundException('技师信息不存在');

    const completedOrders = await this.repairOrderRepo.find({
      where: { technicianId: tech.id, status: OrderStatus.COMPLETED },
      select: ['id', 'createdAt', 'acceptTime', 'evaluationScore'],
    });

    let totalResponseMinutes = 0;
    let countWithResponse = 0;
    let totalScore = 0;
    let countWithScore = 0;
    for (const order of completedOrders) {
      if (order.acceptTime && order.createdAt) {
        totalResponseMinutes +=
          (order.acceptTime.getTime() - order.createdAt.getTime()) / 60000;
        countWithResponse++;
      }
      if (order.evaluationScore) {
        totalScore += order.evaluationScore;
        countWithScore++;
      }
    }
    return {
      totalCompleted: completedOrders.length,
      avgResponseMinutes: countWithResponse
        ? Math.round(totalResponseMinutes / countWithResponse)
        : 0,
      avgScore: countWithScore
        ? Math.round((totalScore / countWithScore) * 10) / 10
        : 0,
      currentOrderCount: await this.getCurrentOrderCount(tech.id),
    };
  }

  async updateBuildings(
    technicianId: number,
    buildingIds: number[],
  ): Promise<void> {
    await this.techBuildingRepo.delete({ technicianId });
    if (buildingIds.length > 0) {
      const mappings = buildingIds.map((buildingId) => ({
        technicianId,
        buildingId,
      }));
      await this.techBuildingRepo.save(mappings);
    }
  }
}
