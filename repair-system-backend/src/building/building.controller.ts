import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BuildingService } from './building.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { CreateBuildingDto, UpdateBuildingDto } from './dto/building.dto';
import { Public } from '../auth/public.decorator';

@Controller('building')
@UseGuards(JwtAuthGuard)
export class BuildingController {
  constructor(private service: BuildingService) {}

  @Public() // 任何人都可查看楼栋列表
  @Get('list')
  async list() {
    const list = await this.service.findAll();
    return { code: 200, data: list };
  }

  @Post()
  @Roles(Role.Admin)
  async create(@Body() dto: CreateBuildingDto) {
    const data = await this.service.create(dto);
    return { code: 200, data };
  }

  @Put(':id')
  @Roles(Role.Admin)
  async update(@Param('id') id: string, @Body() dto: UpdateBuildingDto) {
    const data = await this.service.update(+id, dto);
    return { code: 200, data };
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async remove(@Param('id') id: string) {
    await this.service.remove(+id);
    return { code: 200 };
  }
}
