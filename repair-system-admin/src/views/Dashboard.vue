<template>
  <div class="dashboard">
    <el-row :gutter="16">
      <el-col :span="4" v-for="item in coreStats" :key="item.key">
        <div class="stat-card">
          <span class="stat-label">{{ item.title }}</span>
          <span class="stat-value">{{ item.value }}</span>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="6" v-for="item in auxStats" :key="item.key">
        <div class="stat-card stat-card-sm">
          <span class="stat-label-sm">{{ item.title }}</span>
          <span class="stat-value-sm">{{ item.value }}</span>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-title">近30天工单趋势</div>
          <div ref="trendRef" style="height:340px"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-title">故障类型分布</div>
          <div ref="faultTypeRef" style="height:340px"></div>
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-title">楼栋故障分布</div>
          <div ref="heatmapRef" style="height:340px"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-title">工种负载</div>
          <div ref="workloadRef" style="height:340px"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getStats, getOrderTrend, getFaultHeatmap, getFaultTypes, getWorkload } from '@/api/dashboard'

const stats = ref<any>({})
const trendRef = ref<HTMLElement>()
const faultTypeRef = ref<HTMLElement>()
const heatmapRef = ref<HTMLElement>()
const workloadRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let faultTypeChart: echarts.ECharts | null = null
let heatmapChart: echarts.ECharts | null = null
let workloadChart: echarts.ECharts | null = null

const coreStats = computed(() => [
  { key: 'total', title: '总工单', value: stats.value.totalOrders ?? 0 },
  { key: 'completion', title: '完成率', value: `${stats.value.completionRate ?? 0}%` },
  { key: 'response', title: '响应时长', value: `${stats.value.avgResponseTime ?? 0}分钟` },
  { key: 'score', title: '满意度', value: `${stats.value.avgScore ?? 0}分` },
  { key: 'pending', title: '进行中', value: stats.value.pendingOrders ?? 0 },
  { key: 'lowStock', title: '低库存', value: stats.value.lowStockCount ?? 0 },
])

const auxStats = computed(() => [
  { key: 'payment', title: '待支付总额', value: `¥${stats.value.awaitingPaymentTotal ?? 0}` },
  { key: 'urgent', title: '特急达标率', value: `${stats.value.urgentResponseRate ?? 0}%` },
])

const fetchData = async () => {
  stats.value = await getStats()
  const trendData = await getOrderTrend()
  const faultTypes = await getFaultTypes()
  const heatmapData = await getFaultHeatmap()
  const workloadData = await getWorkload()
  trendChart?.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增', '完成'], bottom: 0 },
    grid: { left: 8, right: 16, top: 8, bottom: 28 },
    xAxis: { type: 'category', data: trendData.map((i: any) => i.date), axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value' },
    series: [
      { name: '新增', type: 'line', data: trendData.map((i: any) => i.count), smooth: true, lineStyle: { color: '#0f766e' }, itemStyle: { color: '#0f766e' }, symbol: 'none' },
      { name: '完成', type: 'line', data: trendData.map((i: any) => i.completed), smooth: true, lineStyle: { color: '#38a89d' }, itemStyle: { color: '#38a89d' }, symbol: 'none' },
    ],
  })
  faultTypeChart?.setOption({
    tooltip: { trigger: 'item' },
    series: [{ type: 'pie', radius: ['50%', '75%'], center: ['50%', '55%'], data: faultTypes.map((i: any) => ({ name: i.type, value: i.count })), label: { show: false }, emphasis: { scale: true } }],
  })
  heatmapChart?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 8, right: 8, top: 8, bottom: 8 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: heatmapData.map((i: any) => i.buildingName), axisLabel: { fontSize: 11 } },
    series: [{ type: 'bar', data: heatmapData.map((i: any) => i.count), color: '#14b8a6', barWidth: 16 }],
  })
  workloadChart?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 8, right: 8, top: 8, bottom: 8 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: workloadData.map((i: any) => i.skill) },
    series: [{ type: 'bar', data: workloadData.map((i: any) => i.count), color: '#64748b', barWidth: 16 }],
  })
}

onMounted(() => {
  trendChart = echarts.init(trendRef.value!)
  faultTypeChart = echarts.init(faultTypeRef.value!)
  heatmapChart = echarts.init(heatmapRef.value!)
  workloadChart = echarts.init(workloadRef.value!)
  fetchData()
  window.addEventListener('resize', () => {
    trendChart?.resize()
    faultTypeChart?.resize()
    heatmapChart?.resize()
    workloadChart?.resize()
  })
})

onUnmounted(() => {
  trendChart?.dispose()
  faultTypeChart?.dispose()
  heatmapChart?.dispose()
  workloadChart?.dispose()
})
</script>

<style scoped lang="scss">
.stat-card {
  background: #fff;
  border: 1px solid #f0f2f5;
  border-radius: 16px;
  padding: 22px 18px;
  text-align: center;
  transition: background-color 0.2s;
  cursor: default;
  &:hover { background: #f8fafc; }
}
.stat-label {
  display: block;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
}
.stat-value {
  display: block;
  font-size: 30px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.1;
  &.highlight {
    color: #0f766e;
  }
}
.stat-card-sm { padding: 16px 14px; }
.stat-label-sm { font-size: 13px; color: #64748b; display: block; margin-bottom: 10px; font-weight: 500; }
.stat-value-sm { font-size: 22px; font-weight: 700; color: #0f172a; }

.chart-card {
  background: #fff;
  border: 1px solid #f0f2f5;
  border-radius: 16px;
  padding: 20px 22px;
  height: 420px;
}
.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>