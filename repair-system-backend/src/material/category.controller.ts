// material/category.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Controller('category')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Post()
  @Roles(Role.Admin)
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get('tree')
  getTree() {
    return this.categoryService.getTree();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }

  @Put(':id')
  @Roles(Role.Admin)
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(+id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }

  @Patch(':id/status')
  @Roles(Role.Admin)
  updateStatus(@Param('id') id: string, @Body('status') status: number) {
    return this.categoryService.updateStatus(+id, status);
  }
}
