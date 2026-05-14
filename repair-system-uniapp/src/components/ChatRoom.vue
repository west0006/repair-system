<template>
  <view class="chat-room">
    <scroll-view class="message-list" scroll-y :scroll-into-view="scrollToView" @scroll="onScroll">
      <view v-for="msg in messages" :key="msg.id" :id="'msg-'+msg.id" class="chat-row"
        :class="isMyMessage(msg) ? 'chat-row-mine' : 'chat-row-other'">
        <view class="chat-bubble" :class="isMyMessage(msg) ? 'chat-bubble-mine' : 'chat-bubble-other'">
          <view class="chat-meta">
            <text class="chat-sender">{{ getSenderName(msg) }}</text>
            <text class="chat-time">{{ formatTime(msg.createdAt) }}</text>
          </view>
          <view v-if="msg.type === 0" class="chat-text">{{ msg.content }}</view>
          <image v-else-if="msg.type === 1" class="chat-image" :src="msg.content" mode="widthFix"
            @click="previewImage(msg.content)" />
        </view>
      </view>
      <view v-if="loadingMore" class="loading-more">{{ t('message.load_earlier') }}</view>
      <view v-if="noMore" class="no-more">{{ t('message.no_more_messages') }}</view>
    </scroll-view>

    <view v-if="showScrollToBottom" class="scroll-to-bottom" @click="scrollToBottom">
      <text class="icon">↓</text>
    </view>

    <view class="chat-composer">
      <view class="input-area">
        <input v-model="inputText" type="text" :placeholder="t('message.input_placeholder')" :disabled="!connected"
          class="chat-input" confirm-type="send" @confirm="sendMessage" />
        <view class="toolbar">
          <view class="tool-icon" @click="chooseImage">📷</view>
          <view class="send-btn" @click="sendMessage" :disabled="!connected">{{ t('message.send') }}</view>
        </view>
      </view>
    </view>

    <view v-if="!connected" class="connection-status">{{ t('message.connecting') }}</view>
  </view>
</template>

<script setup>
  import {
    ref,
    onMounted,
    onUnmounted,
    nextTick,
    computed
  } from 'vue'
  import {
    getMessages,
    getMessagesByUser,
    markMessagesAsRead
  } from '@/api/chat'
  import {
    uploadFile
  } from '@/api/upload'
  import {
    useSocket
  } from '@/utils/socket'
  import {
    formatTime
  } from '@/utils/format'
  import {
    useUserStore
  } from '@/store/user'
  import {
    useI18n
  } from 'vue-i18n'
  const {
    t
  } = useI18n()
  const props = defineProps({
    orderId: Number,
    otherUserId: Number,
    otherRole: Number
  })
  const userStore = useUserStore()
  const currentRole = computed(() => userStore.userInfo?.role)
  const messages = ref([])
  const inputText = ref('')
  const scrollToView = ref('')
  let socket = null
  const connected = ref(false)
  let retryCount = 0
  const maxRetries = 3
  const loadingMore = ref(false)
  const noMore = ref(false)
  const showScrollToBottom = ref(false)

  const isMyMessage = (msg) => msg.senderType === currentRole.value
  const getSenderName = (msg) => {
    if (isMyMessage(msg)) return ''
    if (msg.senderType === 0) return t('message.user')
    if (msg.senderType === 1) return t('message.technician')
    return t('message.admin')
  }
  const loadMessages = async (isLoadMore = false) => {
    if (!props.orderId && !props.otherUserId) return
    if (loadingMore.value) return
    loadingMore.value = true
    try {
      let data
      if (props.orderId) {
        data = await getMessages(props.orderId)
      } else {
        data = await getMessagesByUser(props.otherUserId)
      }
      const newMessages = data || []
      if (isLoadMore) {
        messages.value = [...newMessages, ...messages.value]
        if (newMessages.length === 0) noMore.value = true
      } else {
        messages.value = newMessages
        // scrollToBottom()
      }
    } catch (err) {
      console.error('加载消息失败', err)
    } finally {
      if (props.otherUserId) {
        await markMessagesAsRead(props.otherUserId)
        uni.$emit('messagesRead', props.otherUserId);
      }
      loadingMore.value = false
    }
  }

  const scrollToBottom = () => {
    nextTick(() => {
      if (messages.value.length) {
        scrollToView.value = 'msg-' + messages.value[messages.value.length - 1].id
        showScrollToBottom.value = false
      }
    })
  }
  const onScroll = (e) => {
    const {
      scrollTop,
      scrollHeight
    } = e.detail
    const isNearBottom = scrollHeight - scrollTop - 500 < 0
    showScrollToBottom.value = !isNearBottom
  }

  const sendMessage = () => {
    if (!inputText.value.trim()) return
    if (!socket || !connected.value) {
      uni.showToast({
        title: t('message.connection_failed'),
        icon: 'none'
      });
      return
    }
    socket.emit('sendMessage', {
      receiverId: props.otherUserId,
      content: inputText.value,
      type: 'text'
    })
    inputText.value = ''
  }

  const chooseImage = () => {
    uni.chooseImage({
      count: 1,
      success: async (res) => {
        uni.showLoading({
          title: '上传中...'
        })
        try {
          const url = await uploadFile(res.tempFilePaths[0])
          uni.hideLoading()
          if (socket && connected.value) {
            socket.emit('sendMessage', {
              receiverId: props.otherUserId,
              content: url,
              type: 'image'
            })
          }
        } catch (err) {
          uni.hideLoading()
          uni.showToast({
            title: t('message.upload_failed'),
            icon: 'none'
          })
        }
      }
    })
  }

  const onNewMessage = (msg) => {
    // console.log('收到新消息:', msg);
    const isRelated =
      (msg.senderId === userStore.userInfo.id && msg.receiverId === props.otherUserId) ||
      (msg.senderId === props.otherUserId && msg.receiverId === userStore.userInfo.id);
    if (isRelated) {
      messages.value.push(msg);
      scrollToBottom();
      if (msg.senderId === props.otherUserId) {
        markMessagesAsRead(props.otherUserId);
        uni.$emit('messagesRead', props.otherUserId);
      }
    }
  }

  const previewImage = (url) => {
    // 收集当前聊天中的所有图片URL，方便左右滑动预览
    const urls = messages.value
      .filter(msg => msg.type === 1)
      .map(msg => msg.content);
    uni.previewImage({
      urls: urls.length ? urls : [url],
      current: url
    });
  }

  const initSocket = () => {
    socket = useSocket()
    if (!socket && retryCount < maxRetries) {
      retryCount++;
      setTimeout(initSocket, 1000);
      return
    }
    if (socket) {
      socket.on('connect', () => {
        connected.value = true;
      })
      socket.on('disconnect', () => {
        connected.value = false
      })
      socket.on('newMessage', onNewMessage)
      if (socket.connected) {
        connected.value = true;
      } else {
        socket.connect()
      }
    }
  }

  onMounted(() => {
    if (props.orderId || props.otherUserId) {
      loadMessages()
      initSocket()
    }
  })
  onUnmounted(() => {
    if (socket) {
      socket.off('newMessage', onNewMessage);
      socket.emit('leave', props.orderId)
    }
  })
</script>

<style scoped>
  .chat-room {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    background: #f8fafc;
    overflow: hidden;
    position: relative;
  }

  .message-list {
    flex: 1;
    padding: 24rpx;
    box-sizing: border-box;
    overflow-y: auto;
  }

  .scroll-to-bottom {
    position: absolute;
    bottom: 160rpx;
    right: 30rpx;
    width: 72rpx;
    height: 72rpx;
    background: #0f766e;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 40rpx;
    z-index: 10;
  }

  .chat-composer {
    background: #ffffff;
    border-top: 1px solid #f0f2f5;
    padding: 16rpx 24rpx;
    box-sizing: border-box;
  }

  .chat-input {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 48rpx;
    padding: 16rpx 24rpx;
    font-size: 28rpx;
    background: #ffffff;
  }

  .send-btn {
    background: #0f766e;
    color: #fff;
    border-radius: 48rpx;
    padding: 12rpx 30rpx;
    font-size: 28rpx;
  }

  .connection-status {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(30, 41, 59, 0.8);
    padding: 12rpx;
    text-align: center;
    color: #fff;
    font-size: 24rpx;
    z-index: 20;
  }
</style>