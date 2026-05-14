// auth/auth.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

export type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    username: string,
    pass: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.userRepo.findOne({ where: { username } });
    // console.log(user && user.password === pass);
    if (!user) {
      return null;
    }

    // 使用 bcrypt 比较密码
    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (isPasswordValid) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: UserWithoutPassword) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async register(
    username: string,
    password: string,
    name: string,
    phone: string,
    role: number = 0,
  ) {
    // 分别检查用户名和手机号是否已存在，以便提供明确的错误提示
    const existingUsername = await this.userRepo.findOne({
      where: { username },
    });
    if (existingUsername) {
      throw new BadRequestException('用户名已存在');
    }

    const existingPhone = await this.userRepo.findOne({ where: { phone } });
    if (existingPhone) {
      throw new BadRequestException('手机号已被注册');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({
      username,
      password: hashed,
      name,
      phone,
      role,
    });
    return this.userRepo.save(user);
  }

  // 已有用户绑定 openid
  async bindOpenid(userId: number, openid: string): Promise<void> {
    await this.userRepo.update(userId, { openid });
  }
}
