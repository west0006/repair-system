import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  DashboardService,
  StatsResponse,
  OrderTrendItem,
  FaultHeatmapItem,
  FaultTypeItem,
} from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@Roles(Role.Admin, Role.Accountant)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(): Promise<{ code: number; data: StatsResponse }> {
    const data = await this.dashboardService.getStats();
    return { code: 200, data };
  }

  @Get('trend')
  async getTrend(): Promise<{ code: number; data: OrderTrendItem[] }> {
    const data = await this.dashboardService.getOrderTrend();
    return { code: 200, data };
  }

  @Get('fault-heatmap')
  async getFaultHeatmap(): Promise<{ code: number; data: FaultHeatmapItem[] }> {
    const data = await this.dashboardService.getFaultHeatmap();
    return { code: 200, data };
  }

  @Get('fault-types')
  async getFaultTypes(): Promise<{ code: number; data: FaultTypeItem[] }> {
    const data = await this.dashboardService.getFaultTypeDistribution();
    return { code: 200, data };
  }

  @Get('workload')
  async getWorkload(): Promise<{
    code: number;
    data: { skill: string; count: number }[];
  }> {
    const stats = await this.dashboardService.getStats();
    return { code: 200, data: stats.workloadBySkill };
  }
}
