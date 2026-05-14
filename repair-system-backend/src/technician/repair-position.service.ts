import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepairPosition } from './repair-position.entity';
import {
  CreateRepairPositionDto,
  UpdateRepairPositionDto,
} from './dto/repair-position.dto';

@Injectable()
export class RepairPositionService {
  constructor(
    @InjectRepository(RepairPosition)
    private repo: Repository<RepairPosition>,
  ) {}

  async findAll(): Promise<RepairPosition[]> {
    return this.repo.find({ order: { sortOrder: 'ASC' } });
  }

  async findVisible(): Promise<RepairPosition[]> {
    return this.repo.find({
      where: { visibleToUser: true, status: 1 },
      order: { sortOrder: 'ASC' },
    });
  }

  async create(dto: CreateRepairPositionDto): Promise<RepairPosition> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(
    id: number,
    dto: UpdateRepairPositionDto,
  ): Promise<RepairPosition> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async findOne(id: number): Promise<RepairPosition> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('岗位不存在');
    return entity;
  }
  async findByName(name: string): Promise<RepairPosition | null> {
    return this.repo.findOne({ where: { name, status: 1 } });
  }
}
