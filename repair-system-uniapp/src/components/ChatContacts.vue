<template>
  <view>
    <scroll-view scroll-y class="contacts-list" refresher-enabled @refresherrefresh="onRefresh">
      <view v-for="contact in contacts" :key="contact.id" class="list-item" @click="toChat(contact)">
        <view class="row">
          <view class="avatar" @click.stop="callPhone(contact.phone)">
            <text class="avatar-text">{{ contact.name.charAt(0) }}</text>
          </view>
          <view class="info">
            <text class="name">{{ contact.name }}</text>
            <text class="last-msg">{{ contact.lastMessage || t('message.no_messages') }}</text>
          </view>
          <view class="right">
            <text class="time">{{ formatTime(contact.lastTime) }}</text>
            <view v-if="contact.unreadCount > 0" class="badge">
              {{ contact.unreadCount > 99 ? '99+' : contact.unreadCount }}
            </view>
          </view>
        </view>
      </view>
      <empty-state v-if="contacts.length === 0 && !loading" :text="t('message.no_contacts')" />
      <view v-if="loading" class="loading">{{ t('common.loading') }}</view>
    </scroll-view>
  </view>
</template>

<script setup>
  import {
    ref,
    onMounted,
    onUnmounted
  } from 'vue'
  import {
    getContacts
  } from '@/api/chat'
  import {
    formatTime
  } from '@/utils/format'
  import EmptyState from '@/components/EmptyState.vue'
  import {
    useSocket
  } from '@/utils/socket'
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
    role: Number
  }) // 0:用户端,1:师傅端
  const contacts = ref([])
  const loading = ref(false)
  const userStore = useUserStore()
  let socket = null

  const loadContacts = async () => {
    loading.value = true
    try {
      const res = await getContacts()
      contacts.value = res
    } catch (err) {
      console.error('加载联系人失败', err)
    } finally {
      loading.value = false
    }
  }
  const onRefresh = () => loadContacts()
  const toChat = (contact) => {
    uni.navigateTo({
      url: `/pages/chat/detail?userId=${contact.id}&role=${contact.role}`
    })
  }
  const callPhone = (phone) => {
    if (phone) uni.makePhoneCall({
      phoneNumber: phone
    })
  }
  // 收到新消息时，更新联系人列表中的预览和未读数
  const handleNewMessage = (msg) => {
    const currentUserId = userStore.userInfo.id
    const contactId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId
    const contact = contacts.value.find(c => c.id === contactId)

    const previewText = msg.type === 1 ? t('message.image_placeholder') : msg.content
    if (contact) {
      contact.lastMessage = previewText
      contact.lastTime = msg.createdAt
      if (msg.receiverId === currentUserId) {
        contact.unreadCount = (contact.unreadCount || 0) + 1
      }
      contacts.value = [...contacts.value]
    } else {
      loadContacts()
    }
  }

  const initSocket = () => {
    socket = useSocket()
    if (socket) {
      socket.on('newMessage', handleNewMessage)
    }
  }

  const handleMessagesRead = (userId) => {
    const contact = contacts.value.find(c => c.id === userId)
    if (contact && contact.unreadCount > 0) {
      contact.unreadCount = 0
      // 强制刷新视图
      contacts.value = [...contacts.value]
    }
  }

  onMounted(() => {
    loadContacts()
    initSocket()
    uni.$on('messagesRead', handleMessagesRead)
  })

  onUnmounted(() => {
    if (socket) {
      socket.off('newMessage', handleNewMessage)
    }
    uni.$on('messagesRead', handleMessagesRead)
  })
</script>

<style scoped>
  .contacts-list {
    height: calc(100vh - 100rpx);
    padding: 20rpx 0;
    background: transparent;
  }

  .avatar {
    width: 88rpx;
    height: 88rpx;
    border-radius: 50%;
    background: #dbeafe;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
  }

  .avatar-text {
    font-size: 36rpx;
    font-weight: 700;
    color: #1e40af;
  }

  .info {
    flex: 1;
  }

  .name {
    font-weight: 600;
    font-size: 30rpx;
    display: block;
    margin-bottom: 8rpx;
    color: #1e293b;
  }

  .last-msg {
    font-size: 24rpx;
    color: #64748b;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 400rpx;
  }

  .right {
    text-align: right;
  }

  .time {
    font-size: 22rpx;
    color: #94a3b8;
    display: block;
    margin-bottom: 12rpx;
  }

  .badge {
    background: #ef4444;
    color: #fff;
    border-radius: 32rpx;
    padding: 4rpx 12rpx;
    font-size: 22rpx;
    display: inline-block;
  }

  .loading {
    text-align: center;
    padding: 20rpx;
    color: #94a3b8;
  }
</style>