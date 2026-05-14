// material/category.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepo.create(dto);
    return this.categoryRepo.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepo.find();
  }

  async getTree(): Promise<Category[]> {
    const categories = await this.categoryRepo.find();
    // 构建树形结构
    const map = new Map<number, Category & { children?: Category[] }>();
    categories.forEach((c) => map.set(c.id, { ...c, children: [] }));
    const roots: (Category & { children?: Category[] })[] = [];
    categories.forEach((c) => {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children!.push(map.get(c.id)!);
      } else {
        roots.push(map.get(c.id)!);
      }
    });
    return roots;
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('分类不存在');
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    await this.findOne(id);
    await this.categoryRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.categoryRepo.delete(id);
  }

  async updateStatus(id: number, status: number): Promise<void> {
    await this.categoryRepo.update(id, { status });
  }
}
