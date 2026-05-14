// order/order-status.enum.ts
export enum OrderStatus {
  PENDING = 1, // 待受理
  APPROVED = 2, // 审批通过（待派单）
  DISPATCHED = 3, // 已派单
  ACCEPTED = 4, // 师傅接单
  ON_WAY = 5, // 上门中
  REPAIRING = 6, // 维修中
  WAITING_PARTS = 7, // 待备件
  COMPLETED = 8, // 已完成
  AWAITING_PAYMENT = 9, // 待支付
  CANCELLED = 10, //已取消
  REJECTED = 11, // 已驳回
}
