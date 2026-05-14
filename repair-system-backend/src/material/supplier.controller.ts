import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Controller('supplier')
@UseGuards(JwtAuthGuard)
@Roles(Role.Admin)
export class SupplierController {
  constructor(private supplierService: SupplierService) {}

  @Post()
  create(@Body() dto: CreateSupplierDto) {
    return this.supplierService.create(dto);
  }

  @Get()
  findAll() {
    return this.supplierService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supplierService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.supplierService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supplierService.remove(+id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: number) {
    return this.supplierService.updateStatus(+id, status);
  }
}
