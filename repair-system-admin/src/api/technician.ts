import request from '@/utils/request';
import { register } from '@/api/auth';

// 获取师傅列表
export const getTechnicianList = () => {
  return request.get('/technician/list');
};

// 创建师傅（先注册用户，再创建技师记录）
// 注意：若注册成功但创建师傅失败，会导致数据不一致
// 建议后端提供统一事务接口 /technician/create-with-user
export const createTechnician = async (data) => {
  const userRes = await register({
    username: data.username,
    password: data.password,
    name: data.name,
    phone: data.phone,
    role: 1,
  });
  return request.post('/technician/create', {
    userId: userRes.data.id,
    areaId: data.areaId,
    skills: data.skills,
  });
};