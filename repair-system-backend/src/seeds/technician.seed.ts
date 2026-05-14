import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { UserService } from '../auth/user.service';
import { TechnicianService } from '../technician/technician.service';
import { CreateUserDto } from '../auth/dto/create-user.dto';

@Injectable()
export class TechnicianSeed implements OnApplicationBootstrap {
  private readonly logger = new Logger(TechnicianSeed.name);
  constructor(
    private userService: UserService,
    private techService: TechnicianService,
  ) {}

  async onApplicationBootstrap() {
    const techs = [
      {
        username: 'fangwenjun',
        password: '123456',
        name: '方文君',
        phone: '13212779056',
        role: 1,
        areaId: 1,
        skills: '电工',
      },
      {
        username: 'chenhongshan',
        password: '123456',
        name: '陈洪山',
        phone: '15071276205',
        role: 1,
        areaId: 2,
        skills: '电工',
      },
      {
        username: 'denghuicong',
        password: '123456',
        name: '邓慧聪',
        phone: '18062691021',
        role: 1,
        areaId: 3,
        skills: '电工',
      },
      {
        username: 'caozhongyi',
        password: '123456',
        name: '曹中意',
        phone: '13377862938',
        role: 1,
        areaId: 4,
        skills: '木工',
      },
      {
        username: 'huangchuande',
        password: '123456',
        name: '黄传德',
        phone: '18007182688',
        role: 1,
        areaId: 5,
        skills: '木工',
      },
      {
        username: 'mei',
        password: '123456',
        name: '梅师傅',
        phone: '18163515773',
        role: 1,
        areaId: 99,
        skills: '热水维修',
      },
      {
        username: 'zhang',
        password: '123456',
        name: '张师傅',
        phone: '13797370088',
        role: 1,
        areaId: 99,
        skills: '直饮水维修',
      },
      {
        username: 'menjin',
        password: '123456',
        name: '门禁师傅',
        phone: '13800000000',
        role: 1,
        areaId: 6,
        skills: '门禁维修',
      },
    ];

    for (const t of techs) {
      let user = await this.userService.findByUsername(t.username);
      if (!user) {
        const createDto: CreateUserDto = {
          username: t.username,
          password: t.password,
          name: t.name,
          phone: t.phone,
          role: t.role,
        };
        user = await this.userService.createUser(createDto);
        this.logger.log(`创建用户: ${t.username}`);
      }
      const existingTech = await this.techService.findByUserId(user.id);
      if (!existingTech) {
        await this.techService.create({
          userId: user.id,
          areaId: t.areaId,
          skills: t.skills,
          status: 1,
        });
        this.logger.log(`创建师傅记录: ${t.name}`);
      }
    }
  }
}
