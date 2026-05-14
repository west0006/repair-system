const BASE_URL = 'http://localhost:3000'; // 开发环境，生产替换

const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token');
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...options.header
      },
      success(res) {
        if (res.statusCode === 200 || res.statusCode === 201) {
          // 统一处理后端返回格式 { code, data, message }
          if (res.data.code === 200) {
            resolve(res.data.data);
          } else if (res.data.code === 401) {
            uni.removeStorageSync('token');
            uni.reLaunch({ url: '/pages/login/login' });
            reject(new Error('登录已过期'));
          } else {
            uni.showToast({ title: res.data.message || '请求失败', icon: 'none' });
            reject(new Error(res.data.message));
          }
        } else {
          uni.showToast({ title: '网络错误', icon: 'none' });
          reject(res);
        }
      },
      fail(err) {
        uni.showToast({ title: '网络连接失败', icon: 'none' });
        reject(err);
      }
    });
  });
};

export default request;