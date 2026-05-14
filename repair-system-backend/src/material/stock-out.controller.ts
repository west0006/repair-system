import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { StockOutService } from './stock-out.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('stock-out')
@UseGuards(JwtAuthGuard)
export class StockOutController {
  constructor(private readonly stockOutService: StockOutService) {}

  @Get('pending')
  @Roles(Role.Admin)
  async getPending() {
    const list = await this.stockOutService.findPending();
    return { code: 200, data: list };
  }

  @Post(':id/approve')
  @Roles(Role.Admin)
  async approve(@Param('id') id: string) {
    await this.stockOutService.approve(+id);
    return { code: 200 };
  }

  @Post(':id/reject')
  @Roles(Role.Admin)
  async reject(@Param('id') id: string, @Body('reason') reason: string) {
    await this.stockOutService.reject(+id, reason);
    return { code: 200 };
  }
}
