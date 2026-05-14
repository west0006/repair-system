import http from '@/utils/request';

export const login = (username, password) => {
  return http.post('/auth/login', {
    username,
    password
  });
};
// 绑定 openid
export const bindOpenid = (code) => http.post('/auth/bind-openid', {
  code
})