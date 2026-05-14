import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from './building.entity';
import { CreateBuildingDto, UpdateBuildingDto } from './dto/building.dto';

@Injectable()
export class BuildingService {
  constructor(@InjectRepository(Building) private repo: Repository<Building>) {}

  async create(dto: CreateBuildingDto): Promise<Building> {
    const building = this.repo.create(dto);
    return this.repo.save(building);
  }

  async findAll(): Promise<Building[]> {
    return this.repo.find({ order: { sortOrder: 'ASC' } });
  }

  async findOne(id: number): Promise<Building> {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('楼栋不存在');
    return b;
  }

  async update(id: number, dto: UpdateBuildingDto): Promise<Building> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
