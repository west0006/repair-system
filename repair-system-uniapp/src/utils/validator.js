export const validatePhone = (phone) => /^1[3-9]\d{9}$/.test(phone);
export const validateUsername = (name) => /^[a-zA-Z0-9\u4e00-\u9fa5]{2,20}$/.test(name);
export const validatePassword = (pwd) => pwd.length >= 6;