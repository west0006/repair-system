// material/stock-check.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StockCheckService } from './stock-check.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

interface RequestWithUser {
  user: {
    id: number;
    name: string;
    phone: string;
    role: number;
  };
}

interface CreateCheckBody {
  items: {
    materialId: number;
    actualQuantity: number;
    note?: string;
  }[];
}

@Controller('stock-check')
@UseGuards(JwtAuthGuard)
export class StockCheckController {
  constructor(private stockCheckService: StockCheckService) {}

  @Post()
  @Roles(Role.Admin)
  async createCheck(
    @Body() body: CreateCheckBody,
    @Request() req: RequestWithUser,
  ) {
    const result = await this.stockCheckService.createCheck({
      items: body.items,
      operatorId: req.user.id,
    });
    return { code: 200, data: result };
  }

  @Get('pending')
  @Roles(Role.Admin)
  async getPending() {
    const list = await this.stockCheckService.getPendingChecks();
    return { code: 200, data: list };
  }

  @Post(':id/approve')
  @Roles(Role.Admin)
  async approve(@Param('id') id: string, @Request() req: RequestWithUser) {
    await this.stockCheckService.approveCheck(+id, req.user.id);
    return { code: 200 };
  }

  @Post(':id/reject')
  @Roles(Role.Admin)
  async reject(@Param('id') id: string, @Body('reason') reason: string) {
    await this.stockCheckService.rejectCheck(+id, reason);
    return { code: 200 };
  }
}
