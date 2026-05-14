// store/orderConfig.ts
import { defineStore } from 'pinia';

export const useOrderConfigStore = defineStore('orderConfig', {
  state: () => ({
    autoDispatch: true, // 默认自动派单
  }),
  actions: {
    toggleAutoDispatch(value: boolean) {
      this.autoDispatch = value;
    },
  },
  persist: {
    enabled: true,
    strategies: [{ storage: localStorage }],
  },
});