import io from 'socket.io-client'
import {
  useUserStore
} from '@/store/user'

// WebSocket 也通过代理，路径为 /socket.io（Vite 代理会自动处理）
const WS_URL = '' // 使用相对路径，socket.io 默认连接路径会被正确处理
let socket = null
let reconnectTimer = null

function createSocket(token) {
  if (socket) {
    socket.disconnect()
    socket = null
  }
  socket = io(WS_URL, {
    transports: ['websocket'],
    auth: {
      token
    },
    autoConnect: false,
    reconnection: false
  })
  socket.on('connect', () => {
    console.log('WebSocket 已连接')
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  })
  socket.on('disconnect', (reason) => {
    console.warn('WebSocket 断开:', reason)
    attemptReconnect(token)
  })
  socket.on('connect_error', (err) => {
    console.error('WebSocket 连接错误:', err.message)
    attemptReconnect(token)
  })
}

function attemptReconnect(token) {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    if (socket) {
      socket.connect()
    } else {
      createSocket(token)
    }
  }, 5000)
}

export const useSocket = () => {
  const userStore = useUserStore()
  const token = userStore.token
  if (!token) return null
  if (!socket) createSocket(token)
  if (!socket.connected) socket.connect()
  return socket
}

export const updateSocketToken = (newToken) => {
  if (socket) {
    socket.auth = {
      token: newToken
    }
    socket.disconnect().connect()
  }
}

export const disconnectSocket = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (socket) {
    socket.disconnect()
    socket = null
  }
}