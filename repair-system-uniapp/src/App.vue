<script setup lang="ts">
  import { onLaunch, onShow, onHide, onLoad } from '@dcloudio/uni-app'
  import { useUserStore } from '@/store/user'
  import { bindOpenid } from '@/api/auth'

  // 应用启动初始化
  onLaunch(() => {
    // console.log('报修系统启动')
    const userStore = useUserStore()
    userStore.initUserInfo()

    // 自动绑定微信 openid
    if (userStore.token) {
      uni.login({
        provider: 'weixin',
        success: async (loginRes) => {
          try {
            await bindOpenid(loginRes.code)
          } catch (e) {
            console.log('绑定 openid 失败', e)
          }
        }
      })
    }
  })

  // 应用显示
  onShow(() => {
    // console.log('应用进入前台')
  })

  // 应用隐藏
  onHide(() => {
    // console.log('应用进入后台')
  })
</script>

<style>
  /* 全局扁平化，无阴影，柔和边框 */
  page {
    background: #f5f6f8;
    color: #1e293b;
    font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .container {
    padding: 24rpx 28rpx 42rpx;
  }

  /* 卡片——扁平，仅靠边框 */
  .card {
    background: #ffffff;
    border: 1px solid #eef0f3;
    border-radius: 24rpx;
    padding: 28rpx;
    margin-bottom: 24rpx;
  }

  .card.no-padding {
    padding: 0;
  }

  /* 英雄卡——微弱的背景区分 */
  .hero,
  .hero-tech,
  .broadcast-card {
    background: #fafbfc;
    border: 1px solid #eef0f3;
  }

  .eyebrow {
    font-size: 22rpx;
    color: #64748b;
    letter-spacing: 3rpx;
    margin-bottom: 12rpx;
  }

  .title {
    font-size: 38rpx;
    font-weight: 700;
    line-height: 1.3;
  }

  .name {
    font-size: 30rpx;
    font-weight: 700;
  }

  .subtle,
  .desc,
  .section-subtle {
    color: #64748b;
    font-size: 24rpx;
    line-height: 1.6;
  }

  .section-subtle {
    margin-top: 8rpx;
  }

  /* 行、网格 */
  .row,
  .form-actions,
  .tab-strip,
  .line-row,
  .list-head,
  .meta-row,
  .btn-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18rpx;
  }

  .form-actions,
  .btn-row,
  .meta-row {
    flex-wrap: wrap;
  }

  .metrics-grid,
  .action-grid,
  .info-grid,
  .grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .metrics-grid,
  .action-grid,
  .info-grid {
    margin-top: 24rpx;
  }

  .grid {
    margin-top: -18rpx;
  }

  /* 统计卡片——扁平 */
  .metric-card,
  .action-tile,
  .info-item,
  .grid .field {
    width: calc(50% - 10rpx);
    box-sizing: border-box;
  }

  .metric-card {
    margin-top: 16rpx;
    padding: 24rpx;
    border-radius: 24rpx;
    background: #ffffff;
    border: 1px solid #eef0f3;
  }

  .metric-label {
    display: block;
    color: #64748b;
    font-size: 24rpx;
    font-weight: 500;
  }

  .metric-value {
    display: block;
    margin-top: 12rpx;
    font-size: 42rpx;
    font-weight: 800;
    color: #1e293b;
  }

  /* 快捷入口 */
  .action-tile {
    margin-top: 16rpx;
    min-height: 172rpx;
    padding: 24rpx;
    border-radius: 28rpx;
    background: #ffffff;
    color: #1e293b;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border: 1px solid #eef0f3;
  }

  .action-strong {
    background: #0f766e;
    color: #ffffff;
    border-color: #0f766e;
  }

  .action-title {
    font-size: 30rpx;
    font-weight: 700;
  }

  .action-desc {
    font-size: 24rpx;
    line-height: 1.5;
    opacity: 0.85;
  }

  /* 按钮 */
  .btn-primary,
  .btn-ghost,
  .btn-danger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 48rpx;
    padding: 0 30rpx;
    font-size: 28rpx;
    line-height: 80rpx;
    height: 80rpx;
    border: 1px solid transparent;
    text-decoration: none;
    box-sizing: border-box;
  }

  .btn-primary {
    background: #0f766e;
    color: #fff;
  }

  .btn-ghost {
    background: #f8fafc;
    border-color: #dce1e8;
    color: #1e293b;
  }

  .btn-danger {
    background: #ef4444;
    color: #fff;
  }

  /* 标签、分段 */
  .pill,
  .tab-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6rpx 18rpx;
    border-radius: 999rpx;
    font-size: 22rpx;
    font-weight: 600;
  }

  .tab-chip {
    background: #f4f6f8;
    color: #475569;
    border: 1px solid #e5e9f0;
  }

  .tab-chip-active {
    background: #e8f4f2;
    color: #0f766e;
    border-color: #c7e5de;
  }

  /* 状态 */
  .status-wait {
    background: #fef3c7;
    color: #92400e;
  }

  .status-run {
    background: #dbeafe;
    color: #1e40af;
  }

  .status-done {
    background: #d1fae5;
    color: #065f46;
  }

  .status-muted {
    background: #f4f6f8;
    color: #475569;
  }

  /* 表单 */
  .field {
    width: 100%;
    margin-top: 18rpx;
  }

  .field.full {
    width: 100%;
  }

  .field-label {
    display: block;
    color: #475569;
    font-size: 24rpx;
    font-weight: 500;
    margin-bottom: 10rpx;
  }

  .input,
  .textarea,
  .picker {
    width: 100%;
    border-radius: 22rpx;
    background: #f8fafc;
    padding: 24rpx;
    font-size: 28rpx;
    min-height: 88rpx;
    box-sizing: border-box;
    border: 1px solid #e2e8f0;
  }

  .textarea {
    min-height: 180rpx;
  }

  /* 列表项 */
  .list-item,
  .approval-card,
  .soft-card {
    border-radius: 24rpx;
    padding: 24rpx;
    background: #ffffff;
    margin-bottom: 18rpx;
    border: 1px solid #eef0f3;
  }

  /* 标题 */
  .section-title {
    font-size: 30rpx;
    font-weight: 700;
    color: #1e293b;
  }

  /* 图片预览 */
  .preview-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 16rpx;
  }

  .preview-item {
    width: 144rpx;
    height: 144rpx;
    border-radius: 22rpx;
    background: #f4f6f8;
    overflow: hidden;
  }

  .preview-item image,
  .qr-box image {
    width: 100%;
    height: 100%;
  }

  /* 空状态 */
  .empty {
    text-align: center;
    color: #64748b;
    padding: 48rpx 0;
  }

  /* 标签栏 */
  .tab-strip-nowrap {
    justify-content: flex-start;
    flex-wrap: nowrap;
    gap: 14rpx;
    overflow-x: auto;
    padding: 16rpx 24rpx;
    background: #ffffff;
    border-bottom: 1px solid #eef0f3;
  }

  .tab-chip-wide {
    min-width: 120rpx;
    padding: 12rpx 24rpx;
    white-space: nowrap;
  }

  /* 分段 */
  .segment-bar {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 10rpx;
    border-radius: 999rpx;
    background: #f4f6f8;
    margin: 18rpx 24rpx 24rpx;
  }

  .segment-item {
    flex: 1;
    min-width: 0;
    padding: 14rpx 0;
    border-radius: 999rpx;
    text-align: center;
    font-size: 26rpx;
    font-weight: 600;
    color: #64748b;
    white-space: nowrap;
  }

  .segment-item-active {
    background: #ffffff;
    color: #0f766e;
  }
</style>