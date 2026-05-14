import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Faq } from './faq.entity';
import { CreateFaqDto, UpdateFaqDto, FaqQueryDto } from './dto/faq.dto';

@Injectable()
export class FaqService implements OnModuleInit {
  private activeFaqCache: Faq[] = [];

  constructor(
    @InjectRepository(Faq)
    private faqRepo: Repository<Faq>,
  ) {}

  async onModuleInit() {
    await this.refreshCache();
  }

  // 刷新缓存（在增删改时调用）
  private async refreshCache() {
    this.activeFaqCache = await this.faqRepo.find({
      where: { status: 1 },
      order: { sortOrder: 'ASC' },
    });
  }

  async create(dto: CreateFaqDto): Promise<Faq> {
    const existing = await this.faqRepo.findOne({
      where: { keyword: dto.keyword },
    });
    if (existing) throw new BadRequestException('关键词已存在');
    const faq = this.faqRepo.create(dto);
    const saved = await this.faqRepo.save(faq);
    await this.refreshCache();
    return saved;
  }
  async findAllEnabled(): Promise<Faq[]> {
    return this.faqRepo.find({
      where: { status: 1 },
      order: { sortOrder: 'ASC' },
    });
  }
  async update(id: number, dto: UpdateFaqDto): Promise<Faq> {
    const faq = await this.findOne(id);
    if (dto.keyword && dto.keyword !== faq.keyword) {
      const existing = await this.faqRepo.findOne({
        where: { keyword: dto.keyword },
      });
      if (existing) throw new BadRequestException('关键词已存在');
    }
    Object.assign(faq, dto);
    const saved = await this.faqRepo.save(faq);
    await this.refreshCache();
    return saved;
  }

  async delete(id: number): Promise<void> {
    const result = await this.faqRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('FAQ 不存在');
    await this.refreshCache();
  }

  async findOne(id: number): Promise<Faq> {
    const faq = await this.faqRepo.findOne({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ 不存在');
    return faq;
  }

  async findAll(query: FaqQueryDto): Promise<{ data: Faq[]; total: number }> {
    const { keyword, status, page = 1, limit = 20 } = query;
    const where: FindOptionsWhere<Faq> = {};
    if (keyword) where.keyword = Like(`%${keyword}%`);
    if (status !== undefined) where.status = status;

    const [data, total] = await this.faqRepo.findAndCount({
      where,
      order: { sortOrder: 'ASC', id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async predict(keyword: string): Promise<Faq | null> {
    if (!keyword) return null;

    // 1. 精确匹配
    const exact = this.activeFaqCache.find((f) => f.keyword === keyword);
    if (exact) return exact;

    // 2. 包含匹配
    const matches = this.activeFaqCache.filter(
      (f) => keyword.includes(f.keyword) || f.keyword.includes(keyword),
    );
    if (matches.length > 0) {
      matches.sort((a, b) => a.sortOrder - b.sortOrder);
      return matches[0];
    }

    // 3. 分词匹配
    const words = keyword.split(/[\s,，、。；;]+/);
    for (const word of words) {
      if (word.length < 2) continue;
      const match = this.activeFaqCache.find((f) => f.keyword.includes(word));
      if (match) return match;
    }

    return null;
  }
}
