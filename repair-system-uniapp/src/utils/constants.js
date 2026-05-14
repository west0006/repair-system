export const OrderStatus = {
  PENDING: 1,
  APPROVED: 2,
  DISPATCHED: 3,
  ACCEPTED: 4,
  ON_WAY: 5,
  REPAIRING: 6,
  WAITING_PARTS: 7,
  COMPLETED: 8,
  AWAITING_PAYMENT: 9,
  CANCELLED: 10,
  REJECTED: 11
}

export const statusText = {
  1: '待受理',
  2: '待派单',
  3: '待接单',
  4: '已接单',
  5: '上门中',
  6: '维修中',
  7: '需备件',
  8: '已完成',
  9: '待支付',
  10: '已取消',
  11: '已驳回'
}

export const MaterialBillStatus = {
  NOT_CREATED: 0,
  PENDING_REVIEW: 1,
  AWAITING_PAYMENT: 2,
  PAID: 3,
  FREE: 4
}

export const faultTypes = [{
    value: '水电维修',
    label: '水电故障'
  },
  {
    value: '木工维修',
    label: '木工维修'
  },
  {
    value: '热水维修',
    label: '热水维修'
  },
  {
    value: '直饮水维修',
    label: '直饮水维修'
  },
  {
    value: '门禁维修',
    label: '门禁维修'
  },
  {
    value: '绿化',
    label: '绿化'
  },
  {
    value: '消防维修',
    label: '消防维修'
  },
  {
    value: '疏通',
    label: '疏通'
  }
]

export const faultTypeI18nMap = {
  '水电维修': 'fault_types.water_electric',
  '木工维修': 'fault_types.carpenter',
  '热水维修': 'fault_types.hot_water',
  '直饮水维修': 'fault_types.drinking_water',
  '门禁维修': 'fault_types.access_control',
  '绿化': 'fault_types.greening',
  '消防维修': 'fault_types.fire_fighting',
  '疏通': 'fault_types.dredge'
}