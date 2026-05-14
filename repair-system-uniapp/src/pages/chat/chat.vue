<template>
  <view class="chat-list">
    <view v-for="contact in contacts" :key="contact.id" class="contact-item" @click="toChat(contact)">
      <view class="avatar" @click.stop="callPhone(contact.phone)">
        <text class="avatar-text">{{ contact.name.charAt(0) }}</text>
      </view>
      <view class="info">
        <text class="name">{{ contact.name }}</text>
        <text class="role">{{ contact.role === 0 ? '用户' : '师傅' }}</text>
      </view>
      <text class="phone" @click.stop="callPhone(contact.phone)">📞</text>
    </view>
  </view>
</template>

<script setup>
  import {
    ref
  } from 'vue'
  import {
    onLoad
  } from '@dcloudio/uni-app'
  import {
    http
  } from '@/utils/request';

  const contacts = ref([]);

  const loadContacts = async () => {
    const res = await http.get('/message/contacts');
    contacts.value = res;
  };

  const toChat = (contact) => {
    // 需要找到与该联系人关联的工单ID，通常取最近的工单
    uni.navigateTo({
      url: `/pages/chat/detail?userId=${contact.id}&role=${contact.role}`
    });
  };

  const callPhone = (phone) => {
    if (phone) uni.makePhoneCall({
      phoneNumber: phone
    });
  };

  onMounted(loadContacts);
</script>