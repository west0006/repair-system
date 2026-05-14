import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Patch,
  NotFoundException,
  Request,
  Put,
  Param,
} from '@nestjs/common';
import { TechnicianService } from './technician.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import {
  CreateTechnicianDto,
  UpdateTechnicianStatusDto,
} from './dto/technician.dto';
import { RequestWithUser } from '../types/request-with-user';

@Controller('technician')
@UseGuards(JwtAuthGuard)
export class TechnicianController {
  constructor(private techService: TechnicianService) {}

  @Get('list')
  @Roles(Role.Admin) // 仅管理员可查看所有技师列表
  async list() {
    const list = await this.techService.findAll();
    return { code: 200, data: list };
  }

  @Post('create')
  @Roles(Role.Admin) // 仅管理员可创建技师
  async create(@Body() dto: CreateTechnicianDto) {
    const tech = await this.techService.create(dto);
    return { code: 200, data: tech };
  }

  @Get('profile')
  async getProfile(@Request() req: RequestWithUser) {
    const technician = await this.techService.findByUserId(req.user.id);
    if (!technician) throw new NotFoundException('未找到师傅信息');
    return { code: 200, data: technician };
  }

  @Patch('status')
  async updateStatus(
    @Body() dto: UpdateTechnicianStatusDto,
    @Request() req: RequestWithUser,
  ) {
    const technician = await this.techService.findByUserId(req.user.id);
    if (!technician) throw new NotFoundException('未找到师傅信息');
    await this.techService.updateStatus(technician.id, dto.status);
    return { code: 200 };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Technician)
  async getMyStats(@Request() req: RequestWithUser) {
    const stats = await this.techService.getTechnicianStats(req.user.id);
    return { code: 200, data: stats };
  }

  @Put(':id/buildings')
  @Roles(Role.Admin)
  async updateBuildings(
    @Param('id') id: string,
    @Body('buildingIds') buildingIds: number[],
  ) {
    await this.techService.updateBuildings(+id, buildingIds);
    return { code: 200 };
  }

  @Get(':id/buildings')
  @Roles(Role.Admin)
  async getBuildings(@Param('id') id: string) {
    const tech = await this.techService.findById(+id);
    return {
      code: 200,
      data: tech?.buildingMappings.map((m) => m.buildingId) || [],
    };
  }
}
