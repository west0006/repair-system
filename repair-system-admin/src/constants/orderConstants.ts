// 工单状态
export const ORDER_STATUS: Record<number, { text: string; type: string }> = {
  1: { text: '待受理', type: 'warning' },
  2: { text: '待派单', type: 'info' },
  3: { text: '已派单(待接单)', type: 'info' },
  4: { text: '已接单', type: 'primary' },
  5: { text: '上门中', type: 'primary' },
  6: { text: '维修中', type: 'primary' },
  7: { text: '需备件', type: 'warning' },
  8: { text: '已完成', type: 'success' },
  9: { text: '待支付', type: 'warning' },
  10: { text: '已取消', type: 'info' },
  11: { text: '已驳回', type: 'danger' },
};

// 紧急程度
export const URGENCY_MAP: Record<number, { text: string; type: string }> = {
  1: { text: '一般', type: 'info' },
  2: { text: '紧急', type: 'warning' },
  3: { text: '特急', type: 'danger' },
};

// 账单状态
export const BILL_STATUS: Record<number, { text: string; type: string }> = {
  0: { text: '未出单', type: 'info' },
  2: { text: '待支付', type: 'warning' },
  3: { text: '已支付', type: 'success' },
  4: { text: '免费', type: 'info' },
};