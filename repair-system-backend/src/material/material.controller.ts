import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Put,
  Delete,
  Query,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MaterialService } from './material.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import {
  CreateMaterialDto,
  MaterialListDto,
  UpdateMaterialDto,
} from './dto/material.dto';

// 定义入库 DTO
interface InboundDto {
  materialId: number;
  quantity: number;
  unitPrice?: number;
  supplierId?: number;
  operatorId?: number;
  remark?: string;
}

// 定义出库 DTO
interface OutboundDto {
  materialId: number;
  quantity: number;
  reason: string;
  repairOrderId?: number;
  applicantId: number;
  approverId?: number;
}

// 扩展请求类型
interface RequestWithUser extends Request {
  user: {
    id: number;
    name: string;
    phone: string;
    role: number;
  };
}

@Controller('material')
export class MaterialController {
  constructor(private materialService: MaterialService) {}
  private readonly logger = new Logger(MaterialController.name);

  @Post('inbound')
  @UseGuards(JwtAuthGuard)
  async inbound(@Body() body: InboundDto) {
    if (!body.materialId || isNaN(body.materialId)) {
      throw new BadRequestException('物料ID无效');
    }
    const result = await this.materialService.inbound(body);
    return { code: 200, data: result };
  }

  @Post('inbound/import')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('file'))
  async importInbound(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: RequestWithUser,
  ) {
    if (!file) throw new BadRequestException('请上传 Excel 文件');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await this.materialService.importInboundFromExcel(
      file.buffer,
      req.user.id,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { code: 200, data: result };
  }
  @Post('import/batch')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('file'))
  async importMaterials(@UploadedFile() file: Express.Multer.File) {
    const data = await this.materialService.importMaterialsFromExcel(
      file.buffer,
    );
    return { code: 200, data };
  }
  @Post('outbound')
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard)
  async outbound(@Body() body: OutboundDto) {
    const result = await this.materialService.outbound(body);
    return { code: 200, data: result };
  }

  // 原有 list 方法可扩展支持查询参数
  @Get('list')
  async list(@Query() allQuery: any) {
    // 提取分页参数
    const page = allQuery.page ? parseInt(allQuery.page, 10) : 1;
    const limit = allQuery.limit ? parseInt(allQuery.limit, 10) : 20;
    // 移除分页参数，剩余为查询条件
    delete allQuery.page;
    delete allQuery.limit;
    const [data, total] = await this.materialService.findAllPaginated(
      allQuery,
      page,
      limit,
    );
    return { code: 200, data, total, page, limit };
  }

  @Get('warning')
  @UseGuards(JwtAuthGuard)
  async warning() {
    const data = await this.materialService.getCurrentWarnings();
    return { code: 200, data };
  }
  @Post('clean')
  @Roles(Role.Admin) // 仅超级管理员可执行
  async executeCleaning() {
    const result = await this.materialService.fullCleaning();
    return { code: 200, data: result };
  }
  @Get('applications')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin, Role.Warehouse) // 确保权限正确
  async getApplications(
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string, // 新增接收 paymentStatus
  ) {
    const list = await this.materialService.getApplications({
      status: status ? +status : undefined,
      paymentStatus: paymentStatus ? +paymentStatus : undefined,
    });
    return { code: 200, data: list };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  async create(@Body() dto: CreateMaterialDto) {
    const material = await this.materialService.create(dto);
    return { code: 200, data: material };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const materialId = Number(id);
    if (isNaN(materialId)) {
      throw new BadRequestException('无效的物料ID');
    }
    const material = await this.materialService.findOne(materialId);
    return { code: 200, data: material };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  async update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    const material = await this.materialService.update(+id, dto);
    return { code: 200, data: material };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  async remove(@Param('id') id: string) {
    await this.materialService.remove(+id);
    return { code: 200 };
  }

  @Post('application/:id/approve')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  async approveApplication(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    await this.materialService.approveApplication(+id, req.user.id);
    return { code: 200 };
  }

  @Post('application/:id/reject')
  @Roles(Role.Admin)
  async rejectApplication(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    await this.materialService.rejectApplication(+id, reason);
    return { code: 200 };
  }
}
