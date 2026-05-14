<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>后勤维修管理系统</h2>
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" />
        </el-form-item>
        <el-button type="primary" @click="submit" :loading="loading">登录</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();
const form = ref({ username: '', password: '' });
const formRef = ref();
const loading = ref(false);

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const submit = async () => {
   try {
    await formRef.value.validate();
  } catch {
    // 验证失败不继续
    return;
  }
  loading.value = true;
  try {
    await userStore.login(form.value.username, form.value.password);
    console.log('登录成功');
    ElMessage.success('登录成功');
    router.push('/');
  } catch (error) {
    console.error('登录失败', error);
    ElMessage.error('登录失败，请检查用户名和密码');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f0f2f6;
}
.login-card {
  width: 400px;
  text-align: center;
}
h2 {
  margin-bottom: 20px;
}
.el-button {
  width: 100%;
}
</style>