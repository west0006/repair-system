import type { PiniaPluginContext } from 'pinia'

export function createUnistorage() {
  return (context : PiniaPluginContext) => {
    const store = context.store
    const storeKey = `pinia__${store.$id}`

    // 只对指定的 stores 进行持久化
    const persistStores = ['user'] // 需要持久化的 store id
    if (!persistStores.includes(store.$id)) return

    // 恢复
    const storedValue = uni.getStorageSync(storeKey)
    if (storedValue) {
      try {
        store.$patch(JSON.parse(storedValue))
      } catch (e) {
        uni.removeStorageSync(storeKey)
      }
    }

    // 订阅变更并持久化（仅持久化关键字段，并节流）
    let timer : number | null = null
    store.$subscribe((_mutation, state) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        // 仅持久化必要字段，避免全量写入
        const payload = {
          token: state.token,
          userInfo: state.userInfo,
          role: state.role
        }
        uni.setStorageSync(storeKey, JSON.stringify(payload))
        timer = null
      }, 300)
    })
  }
}