<template>
  <el-card>
    <template #header>工单详情</template>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="工单号">{{ order.orderNo }}</el-descriptions-item>
      <el-descriptions-item label="状态"><OrderStatusTag :status="order.status" /></el-descriptions-item>
      <el-descriptions-item label="报修人">{{ order.userName }}</el-descriptions-item>
      <el-descriptions-item label="联系电话">{{ order.userPhone }}</el-descriptions-item>
      <el-descriptions-item label="故障类型">{{ order.faultType }}</el-descriptions-item>
      <el-descriptions-item label="紧急程度"><UrgencyStatus :status="order.urgency" /></el-descriptions-item>
      <el-descriptions-item label="位置">{{ order.locationBuilding }}{{ order.locationFloor }}{{ order.locationRoom }}</el-descriptions-item>
      <el-descriptions-item label="故障描述" :span="2">{{ order.faultDesc }}</el-descriptions-item>
      <el-descriptions-item label="故障图片" :span="2">
        <el-image v-for="img in order.images" :key="img" :src="img" style="width: 100px; margin-right: 10px" />
      </el-descriptions-item>
      <el-descriptions-item label="维修师傅">{{ order.technician?.user?.name || '未分配' }}</el-descriptions-item>
      <el-descriptions-item label="预约时间"> {{ order.scheduledTime ? formatDate(order.scheduledTime) : '未指定' }} </el-descriptions-item>
      <el-descriptions-item label="开始时间">{{ order.startTime || '-' }}</el-descriptions-item>
      <el-descriptions-item label="完成时间">{{ order.endTime || '-' }}</el-descriptions-item>
      <el-descriptions-item label="维修内容" :span="2">
        {{ order.repairRecord?.repairContent || '无' }}
      </el-descriptions-item>
      
      <el-descriptions-item label="维修后照片" :span="2">
        <el-image v-for="img in order.afterPhotos" :key="img" :src="img" style="width: 100px" />
      </el-descriptions-item>
      <!-- 物料明细 -->
<el-descriptions-item label="物料明细" :span="2">
  <div v-if="order.material_bill && order.material_bill.length">
    <div v-for="item in order.material_bill" :key="item.material_id" class="bill-item">
      <span>{{ item.material_name }}</span>
      <span>{{ item.quantity }} × ¥{{ item.unit_price }}</span>
      <span>折扣: {{ (item.discount * 10).toFixed(1) }}折</span>
      <span class="amount">¥{{ (item.unit_price * item.quantity * item.discount).toFixed(2) }}</span>
    </div>
  </div>
  <span v-else>无</span>
</el-descriptions-item>

<!-- 费用汇总 -->
<el-descriptions-item label="物料折后合计">¥{{ order.material_bill_amount ?? 0 }}</el-descriptions-item>
<el-descriptions-item label="整单折扣">{{ order.material_bill_discount ? (order.material_bill_discount * 10).toFixed(1) + '折' : '无' }}</el-descriptions-item>
<el-descriptions-item label="服务费">¥{{ order.serviceFee ?? 0 }}</el-descriptions-item>
<el-descriptions-item label="应付总额">
  <span class="pay-amount">¥{{ order.material_bill_pay_amount ?? 0 }}</span>
</el-descriptions-item>
<el-descriptions-item label="缴费状态"><BillStatus :status="order.material_bill_status" /></el-descriptions-item>
      <el-descriptions-item label="评价分数">{{ order.evaluationScore ?order.evaluationScore+"分": '无' }}</el-descriptions-item>
      <el-descriptions-item label="评价内容" :span="2">{{ order.evaluationComment || '无' }}</el-descriptions-item>
    </el-descriptions>
    <el-divider>操作日志</el-divider>
    <el-timeline>
      <el-timeline-item v-for="log in logs" :key="log.id" :timestamp="formatDate(log.createdAt)">
        {{ log.remark }}
      </el-timeline-item>
    </el-timeline>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getOrderDetail, getOrderLogs } from '@/api/order';
import { formatDate } from '@/utils/format';
import OrderStatusTag from '@/components/OrderStatusTag.vue';
import BillStatus from '@/components/billStatus.vue';
import UrgencyStatus from '@/components/urgencyStatus.vue';

const route = useRoute();
const order = ref<any>({});
const logs = ref<any[]>([]);

const fetchData = async () => {
  const id = route.params.id as string;
  const res = await getOrderDetail(id);
  order.value = res.data;
  console.log('工单详情数据：', res.data);
  const logRes = await getOrderLogs(id);
  logs.value = logRes.data;
};

onMounted(() => fetchData());
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}
.tech-name {
  font-weight: 600;
  color: #0f766e;
}
.desc-text {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #334155;
}
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.fee-block, .repair-block {
  margin-top: 24px;
}
.fee-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 4px solid #0f766e;
}
.amount {
  font-weight: 600;
  &.highlight {
    color: #0f766e;
    font-size: 16px;
    font-weight: 700;
  }
}
.eval-block {
  margin-top: 20px;
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.eval-label { font-weight: 600; }
.eval-score { font-size: 18px; font-weight: 700; color: #f59e0b; }
.eval-comment { color: #475569; }
.bill-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}
.amount {
  font-weight: 600;
  color: #0f766e;
}
.pay-amount {
  font-size: 16px;
  font-weight: 700;
  color: #f97316;
}
</style>