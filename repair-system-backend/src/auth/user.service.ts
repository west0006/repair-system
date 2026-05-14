import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      where: [{ username: dto.username }, { phone: dto.phone }],
    });
    if (existing) throw new BadRequestException('用户名或手机号已存在');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ ...dto, password: hashed });
    return this.userRepo.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async update(
    userId: number,
    data: { name?: string; phone?: string },
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('用户不存在');

    if (data.phone && data.phone !== user.phone) {
      const existing = await this.userRepo.findOne({
        where: { phone: data.phone },
      });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('手机号已被其他用户使用');
      }
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(data.phone)) {
        throw new BadRequestException('手机号格式不正确');
      }
    }

    if (data.name !== undefined && data.name.trim() === '') {
      throw new BadRequestException('姓名不能为空');
    }

    await this.userRepo.update(userId, data);
    const updated = await this.findById(userId);
    if (!updated) throw new NotFoundException('更新后用户不存在');
    return updated;
  }
}
