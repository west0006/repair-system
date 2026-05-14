import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FaqService } from './faq.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { Public } from '../auth/public.decorator';
import { CreateFaqDto, UpdateFaqDto, FaqQueryDto } from './dto/faq.dto';

@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  // 公开接口：智能预测
  @Public()
  @Post('predict')
  async predict(@Body('keyword') keyword: string) {
    const result = await this.faqService.predict(keyword);
    return { code: 200, data: result };
  }

  // 新增：公开获取所有启用的 FAQ 列表
  @Public()
  @Get('public-list')
  async publicList() {
    const data = await this.faqService.findAllEnabled();
    return { code: 200, data };
  }

  // 以下接口仅管理员可访问
  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  async create(@Body() dto: CreateFaqDto) {
    const data = await this.faqService.create(dto);
    return { code: 200, data };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  async update(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    const data = await this.faqService.update(+id, dto);
    return { code: 200, data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  async delete(@Param('id') id: string) {
    await this.faqService.delete(+id);
    return { code: 200 };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  async findOne(@Param('id') id: string) {
    const data = await this.faqService.findOne(+id);
    return { code: 200, data };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  async findAll(@Query() query: FaqQueryDto) {
    const { data, total } = await this.faqService.findAll(query);
    return { code: 200, data, total, page: query.page, limit: query.limit };
  }
}
