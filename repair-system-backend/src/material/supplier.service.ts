import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepo: Repository<Supplier>,
  ) {}

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.supplierRepo.create(dto);
    return this.supplierRepo.save(supplier);
  }

  async findAll(): Promise<Supplier[]> {
    return this.supplierRepo.find();
  }

  async findOne(id: number): Promise<Supplier> {
    const supplier = await this.supplierRepo.findOne({ where: { id } });
    if (!supplier) throw new NotFoundException('供应商不存在');
    return supplier;
  }

  async update(id: number, dto: UpdateSupplierDto): Promise<Supplier> {
    await this.findOne(id);
    await this.supplierRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.supplierRepo.delete(id);
  }

  async updateStatus(id: number, status: number): Promise<void> {
    await this.supplierRepo.update(id, { status });
  }
}
