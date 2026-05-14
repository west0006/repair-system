import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { MaterialService } from '../material/material.service';
import OrderService, { FindAllParams } from './order.service';
import { TechnicianService } from '../technician/technician.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import type { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { OrderStatus } from './order-status.enum';
import { SubmitOrderDto } from './dto/submit-order.dto';
import { EvaluateOrderDto } from './dto/evaluate-order.dto';
import { TechnicianStatusDto } from './dto/technician-status.dto';
import { MaterialApplyDto } from './dto/material-apply.dto';
import { CompleteOrderDto } from './dto/complete-order.dto';
import { SetMaterialBillDTO } from './dto/set-material-bill.dto';
import { ApproveOrderDto } from './dto/approve-order.dto';

interface RequestWithUser extends Request {
  user: { id: number; name: string; phone: string; role: number };
}
// interface PendingOrderFilters {
//   area?: string;
//   faultType?: string;
//   urgency?: number;
// }
interface AdminListFilters {
  status?: string;
  orderNo?: string;
  userName?: string;
  startDate?: string;
  endDate?: string;
}

function convertFilters(filters: AdminListFilters): FindAllParams {
  return {
    status: filters.status ? parseInt(filters.status, 10) : undefined,
    orderNo: filters.orderNo,
    userName: filters.userName,
    startDate: filters.startDate ? new Date(filters.startDate) : undefined,
    endDate: filters.endDate ? new Date(filters.endDate) : undefined,
  };
}

@Controller('order')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private orderService: OrderService,
    private materialService: MaterialService,
    private technicianService: TechnicianService,
  ) {}

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  async submit(@Request() req: RequestWithUser, @Body() dto: SubmitOrderDto) {
    const orderNo = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const order = await this.orderService.create({
      orderNo,
      userId: req.user.id,
      userName: req.user.name,
      userPhone: req.user.phone,
      faultType: dto.faultType,
      faultDesc: dto.desc,
      images: dto.images,
      locationBuilding: dto.locationBuilding,
      locationFloor: dto.locationFloor,
      locationRoom: dto.locationRoom,
      urgency: dto.urgency ?? 1,
      status: OrderStatus.PENDING,
      scheduledTime: dto.scheduledTime,
    });
    return { code: 200, data: order };
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async list(@Request() req: RequestWithUser) {
    const orders = await this.orderService.findByUser(req.user.id);
    return { code: 200, data: orders };
  }

  @Get('detail/:id')
  @UseGuards(JwtAuthGuard)
  async detail(@Param('id') id: number) {
    const order = await this.orderService.findById(+id);
    return { code: 200, data: order };
  }

  @Post('evaluate')
  @UseGuards(JwtAuthGuard)
  async evaluate(
    @Request() req: RequestWithUser,
    @Body() dto: EvaluateOrderDto,
  ) {
    await this.orderService.updateEvaluation(
      dto.orderId,
      dto.score,
      dto.comment,
    );
    return { code: 200 };
  }

  @Post('accept/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Technician)
  async accept(@Param('id') id: string, @Request() req: RequestWithUser) {
    const userId = req.user.id;
    // 通过 userId 查找技师记录
    const technician = await this.technicianService.findByUserId(userId);
    if (!technician) throw new NotFoundException('您不是技师用户');
    await this.orderService.accept(+id, technician.id);
    return { code: 200 };
  }

  @Post('reject/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Technician)
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    // 通过 userId 查找技师记录
    const technician = await this.technicianService.findByUserId(userId);
    if (!technician) throw new NotFoundException('您不是技师用户');
    await this.orderService.rejectOrder(+id, reason, technician.id);
    return { code: 200 };
  }

  @Post('status/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Technician)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: TechnicianStatusDto,
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    // 通过 userId 查找技师记录
    const technician = await this.technicianService.findByUserId(userId);
    if (!technician) throw new NotFoundException('您不是技师用户');
    await this.orderService.updateTechnicianStatus(
      +id,
      dto.status,
      technician.id,
    );
    return { code: 200 };
  }

  // 师傅设定物料账单
  @Post(':id/set-bill')
  @UseGuards(JwtAuthGuard)
  async setBill(
    @Param('id') id: number,
    @Body() dto: SetMaterialBillDTO,
    @Request() req: RequestWithUser,
  ) {
    // 这里保证 setMaterialBill 获取 technicianId，dto内repair_order_id要和id一致
    return this.orderService.setMaterialBill(req.user.id, dto);
  }

  // 用户支付账单（模拟支付）
  @Post(':id/pay')
  @UseGuards(JwtAuthGuard)
  async payBill(@Param('id') id: number, @Request() req: RequestWithUser) {
    return this.orderService.payMaterialBill(req.user.id, +id);
  }

  @Post('complete/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Technician)
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteOrderDto,
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    const technician = await this.technicianService.findByUserId(userId);
    if (!technician) throw new NotFoundException('您不是技师用户');
    await this.orderService.complete(+id, technician.id, {
      repairContent: dto.repairContent,
      materials: dto.materials,
      afterPhotos: dto.afterPhotos,
    });
    return { code: 200 };
  }

  @Post('material-apply')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Technician)
  async applyMaterial(
    @Body() dto: MaterialApplyDto,
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    const technician = await this.technicianService.findByUserId(userId);
    if (!technician) throw new NotFoundException('您不是技师用户');
    const result = await this.materialService.apply(dto, technician.id);
    return { code: 200, data: result };
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin, Role.Accountant)
  async adminList(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query() filters: AdminListFilters,
  ) {
    const convertedFilters = convertFilters(filters);
    const [list, total] = await this.orderService.findAllWithPagination(
      convertedFilters,
      page,
      limit,
    );
    return { code: 200, data: list, total, page, limit };
  }

  @Post('admin/dispatch/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  async manualDispatch(
    @Param('id') id: string,
    @Body('technicianId') technicianId: number,
    @Request() req: RequestWithUser,
  ) {
    await this.orderService.manualDispatch(+id, technicianId, req.user.id);
    return { code: 200 };
  }

  @Get('admin/export')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin, Role.Accountant)
  async exportOrders(@Res() res: Response, @Query() filters: AdminListFilters) {
    const convertedFilters = convertFilters(filters);
    const [orders] = await this.orderService.findAllWithPagination(
      convertedFilters,
      1,
      10000,
    );
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('工单列表');
    worksheet.columns = [
      { header: '工单号', key: 'orderNo', width: 20 },
      { header: '用户', key: 'userName', width: 15 },
      { header: '故障类型', key: 'faultType', width: 20 },
      { header: '状态', key: 'status', width: 15 },
      { header: '创建时间', key: 'createdAt', width: 20 },
    ];
    orders.forEach((order) => {
      worksheet.addRow({
        orderNo: order.orderNo,
        userName: order.userName,
        faultType: order.faultType,
        status: order.status,
        createdAt: order.createdAt,
      });
    });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Technician)
  async getPendingOrders(
    @Request() req: RequestWithUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('area') area?: string,
    @Query('faultType') faultType?: string,
    @Query('urgency') urgency?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const technician = await this.technicianService.findByUserId(req.user.id);
    if (!technician) throw new NotFoundException('师傅信息不存在');
    const [list, total] = await this.orderService.findPendingOrders(
      technician.id,
      { area, faultType, urgency: urgency ? parseInt(urgency, 10) : undefined },
      pageNum,
      limitNum,
    );
    return { code: 200, data: list, total, page: pageNum, limit: limitNum };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Technician)
  async getMyOrders(
    @Request() req: RequestWithUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const technician = await this.technicianService.findByUserId(req.user.id);
    if (!technician) throw new NotFoundException('师傅信息不存在');
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const [list, total] =
      await this.orderService.findByTechnicianWithPagination(
        technician.id,
        pageNum,
        limitNum,
      );
    return { code: 200, data: list, total, page: pageNum, limit: limitNum };
  }

  @Post('admin/approve/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  async approveOrder(
    @Param('id') id: string,
    @Body() dto: ApproveOrderDto,
    @Request() req: RequestWithUser,
  ) {
    await this.orderService.approve(+id, req.user.id, dto.autoDispatch ?? true);
    return { code: 200 };
  }

  @Post('admin/reject/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  async rejectOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: RequestWithUser,
  ) {
    await this.orderService.reject(+id, reason, req.user.id);
    return { code: 200 };
  }

  @Get('logs/:id')
  @UseGuards(JwtAuthGuard)
  async getOrderLogs(@Param('id') id: string) {
    const logs = await this.orderService.getLogs(+id);
    return { code: 200, data: logs };
  }
}
