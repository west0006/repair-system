import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { RepairOrder } from '../order/order.entity';
import { Material } from '../material/material.entity';
import { OrderStatus } from '../order/order-status.enum';
import { Technician } from '../technician/technician.entity';

export interface StatsResponse {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  completionRate: string;
  avgResponseTime: number;
  avgScore: string;
  lowStockCount: number;
  awaitingPaymentTotal: number;
  urgentResponseRate: string;
  workloadBySkill: { skill: string; count: number }[];
}

export interface OrderTrendItem {
  date: string;
  count: number;
  completed: number;
}

export interface FaultTypeItem {
  type: string;
  count: number;
}

export interface FaultHeatmapItem {
  buildingName: string;
  count: number;
}

// 原始查询结果的接口
interface AvgResponseTimeRaw {
  avg: number | null;
}

interface AvgScoreRaw {
  avg: number | null;
}

interface AwaitingPaymentTotalRaw {
  total: number | null;
}

interface OrderTrendRaw {
  date: string;
  count: string | number;
  completed: string | number;
}

interface FaultHeatmapRaw {
  buildingName: string;
  count: string | number;
}

interface FaultTypeRaw {
  type: string;
  count: string | number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(RepairOrder)
    private orderRepo: Repository<RepairOrder>,
    @InjectRepository(Material)
    private materialRepo: Repository<Material>,
    @InjectRepository(Technician)
    private techRepo: Repository<Technician>,
  ) {}

  async getStats(): Promise<StatsResponse> {
    // 基础统计
    const totalOrders = await this.orderRepo.count();
    const completedOrders = await this.orderRepo.count({
      where: { status: OrderStatus.COMPLETED },
    });
    const pendingOrders = await this.orderRepo.count({
      where: {
        status: In([
          OrderStatus.PENDING,
          OrderStatus.APPROVED,
          OrderStatus.DISPATCHED,
          OrderStatus.ACCEPTED,
          OrderStatus.ON_WAY,
          OrderStatus.REPAIRING,
          OrderStatus.WAITING_PARTS,
          OrderStatus.AWAITING_PAYMENT,
        ]),
      },
    });

    // 完成率
    const completionRate = totalOrders
      ? ((completedOrders / totalOrders) * 100).toFixed(2)
      : '0.00';

    // 平均响应时长（分钟）
    const avgResponseTimeRaw = await this.orderRepo
      .createQueryBuilder('o')
      .select('AVG(TIMESTAMPDIFF(MINUTE, o.createdAt, o.acceptTime))', 'avg')
      .where('o.acceptTime IS NOT NULL')
      .getRawOne<AvgResponseTimeRaw>();
    const avgResponseTime = avgResponseTimeRaw?.avg
      ? Math.round(Number(avgResponseTimeRaw.avg))
      : 0;

    // 平均评分
    const avgScoreRaw = await this.orderRepo
      .createQueryBuilder('o')
      .select('AVG(o.evaluationScore)', 'avg')
      .where('o.evaluationScore IS NOT NULL')
      .getRawOne<AvgScoreRaw>();
    const avgScore = avgScoreRaw?.avg
      ? Number(avgScoreRaw.avg).toFixed(1)
      : '0.0';

    // 库存不足数量
    const lowStockCount = await this.materialRepo
      .createQueryBuilder('m')
      .where('m.stock < m.minStock')
      .getCount();

    // 待支付总金额（material_bill_status = 2 且未支付）
    const awaitingPaymentTotalRaw = await this.orderRepo
      .createQueryBuilder('o')
      .select('SUM(o.material_bill_pay_amount)', 'total')
      .where('o.material_bill_status = 2')
      .getRawOne<AwaitingPaymentTotalRaw>();
    const awaitingPaymentTotal = awaitingPaymentTotalRaw?.total
      ? Number(awaitingPaymentTotalRaw.total)
      : 0;

    // 特急响应达标率（特急工单且 acceptTime - createdAt <= 15分钟）
    const urgentOrders = await this.orderRepo.find({
      where: { urgency: 3, acceptTime: Not(IsNull()) },
      select: ['createdAt', 'acceptTime'],
    });
    let urgentQualified = 0;
    urgentOrders.forEach((o) => {
      if (o.acceptTime && o.createdAt) {
        const diff = (o.acceptTime.getTime() - o.createdAt.getTime()) / 60000;
        if (diff <= 15) urgentQualified++;
      }
    });
    const urgentResponseRate = urgentOrders.length
      ? ((urgentQualified / urgentOrders.length) * 100).toFixed(2)
      : '0.00';

    // 工种负载分布（按 skills 分组统计进行中工单数）
    const techs = await this.techRepo.find();
    const workloadMap = new Map<string, number>();
    for (const tech of techs) {
      const skills = tech.skills?.split(',') || ['未知'];
      const count = await this.orderRepo.count({
        where: {
          technicianId: tech.id,
          status: In([
            OrderStatus.DISPATCHED,
            OrderStatus.ACCEPTED,
            OrderStatus.ON_WAY,
            OrderStatus.REPAIRING,
            OrderStatus.WAITING_PARTS,
          ]),
        },
      });
      skills.forEach((skill) => {
        const key = skill.trim();
        workloadMap.set(key, (workloadMap.get(key) || 0) + count);
      });
    }
    const workloadBySkill = Array.from(workloadMap.entries()).map(
      ([skill, count]) => ({ skill, count }),
    );

    return {
      totalOrders,
      completedOrders,
      pendingOrders,
      completionRate,
      avgResponseTime,
      avgScore,
      lowStockCount,
      awaitingPaymentTotal,
      urgentResponseRate,
      workloadBySkill,
    };
  }

  // 工单日均趋势
  async getOrderTrend(days: number = 30): Promise<OrderTrendItem[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const result = await this.orderRepo
      .createQueryBuilder('o')
      .select("DATE_FORMAT(o.createdAt, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        'SUM(CASE WHEN o.status = :completed THEN 1 ELSE 0 END)',
        'completed',
      )
      .where('o.createdAt >= :startDate', { startDate })
      .setParameter('completed', OrderStatus.COMPLETED)
      .groupBy("DATE_FORMAT(o.createdAt, '%Y-%m-%d')")
      .orderBy('date', 'ASC')
      .getRawMany<OrderTrendRaw>();

    return result.map((item) => ({
      date: item.date,
      count: Number(item.count),
      completed: Number(item.completed),
    }));
  }

  // 按楼栋统计工单数量
  async getFaultHeatmap(): Promise<FaultHeatmapItem[]> {
    const result = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.locationBuilding', 'buildingName')
      .addSelect('COUNT(*)', 'count')
      .where('o.locationBuilding IS NOT NULL')
      .groupBy('o.locationBuilding')
      .orderBy('count', 'DESC')
      .getRawMany<FaultHeatmapRaw>();

    return result.map((item) => ({
      buildingName: item.buildingName,
      count: Number(item.count),
    }));
  }

  // 故障类型分布
  async getFaultTypeDistribution(): Promise<FaultTypeItem[]> {
    const result = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.faultType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('o.faultType IS NOT NULL')
      .groupBy('o.faultType')
      .orderBy('count', 'DESC')
      .getRawMany<FaultTypeRaw>();

    return result.map((item) => ({
      type: item.type,
      count: Number(item.count),
    }));
  }
}
