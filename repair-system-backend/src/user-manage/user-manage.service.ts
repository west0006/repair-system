import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as XLSX from 'xlsx';
import { User } from '../auth/user.entity';
import { UserQueryDto } from './dto/user-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserManageService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findAll(query: UserQueryDto): Promise<[User[], number]> {
    const { page = 1, limit = 20, username, name, phone, role } = query;
    const qb = this.userRepo.createQueryBuilder('u');

    if (username) {
      qb.andWhere('u.username LIKE :username', { username: `%${username}%` });
    }
    if (name) {
      qb.andWhere('u.name LIKE :name', { name: `%${name}%` });
    }
    if (phone) {
      qb.andWhere('u.phone LIKE :phone', { phone: `%${phone}%` });
    }
    if (role !== undefined && role !== null) {
      qb.andWhere('u.role = :role', { role });
    }

    qb.orderBy('u.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return qb.getManyAndCount();
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    } else {
      delete dto.password;
    }

    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async importFromExcel(
    buffer: Buffer,
  ): Promise<{ total: number; errors: string[] }> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const errors: string[] = [];
    const toImport: Partial<User>[] = [];

    // 先收集所有要导入的用户名和手机号
    const usernames = new Set<string>();
    const phones = new Set<string>();
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const username = row[0]?.toString().trim();
      const phone = row[2]?.toString().trim();
      if (username && !usernames.has(username)) usernames.add(username);
      if (phone && !phones.has(phone)) phones.add(phone);
    }

    // 批量查询已存在的用户名和手机号
    const existingUsers = await this.userRepo.find({
      where: [
        ...(usernames.size ? [{ username: In([...usernames]) }] : []),
        ...(phones.size ? [{ phone: In([...phones]) }] : []),
      ] as any,
      select: ['username', 'phone'],
    });
    const existingUsernames = new Set(existingUsers.map((u) => u.username));
    const existingPhones = new Set(existingUsers.map((u) => u.phone));

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const username = row[0]?.toString().trim();
      const name = row[1]?.toString().trim();
      const phone = row[2]?.toString().trim();
      const password = row[3]?.toString().trim() || '123456';
      const role = parseInt(row[4]?.toString() || '0', 10);

      if (!username || !name || !phone) {
        errors.push(`第 ${i + 1} 行: 用户名/姓名/手机号不能为空`);
        continue;
      }
      if (existingUsernames.has(username) || existingPhones.has(phone)) {
        errors.push(`第 ${i + 1} 行: 用户名或手机号已存在`);
        continue;
      }

      toImport.push({
        username,
        name,
        phone,
        password: await bcrypt.hash(password, 10),
        role: role === 0 || role === 1 ? role : 0,
      });
    }

    if (toImport.length > 0) {
      await this.userRepo.save(toImport);
    }
    return { total: toImport.length, errors };
  }
}
