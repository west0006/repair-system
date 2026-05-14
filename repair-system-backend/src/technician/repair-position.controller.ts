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
import { RepairPositionService } from './repair-position.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import {
  CreateRepairPositionDto,
  UpdateRepairPositionDto,
} from './dto/repair-position.dto';

@Controller('repair-position')
@UseGuards(JwtAuthGuard)
export class RepairPositionController {
  constructor(private service: RepairPositionService) {}

  @Get()
  @Roles(Role.Admin)
  findAll() {
    return this.service.findAll();
  }

  @Get('visible')
  @Roles(Role.User, Role.Technician, Role.Admin)
  findVisible() {
    return this.service.findVisible();
  }

  @Post()
  @Roles(Role.Admin)
  create(@Body() dto: CreateRepairPositionDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles(Role.Admin)
  update(@Param('id') id: string, @Body() dto: UpdateRepairPositionDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
