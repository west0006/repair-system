export const formatDate = (date, fmt = 'yyyy-MM-dd HH:mm') => {
  if (!date) return '';
  const d = new Date(date);
  const o = {
    'M+': d.getMonth() + 1,
    'd+': d.getDate(),
    'H+': d.getHours(),
    'm+': d.getMinutes(),
    's+': d.getSeconds()
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (d.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
    }
  }
  return fmt;
};

export const formatDateTime = (date) => formatDate(date, 'yyyy-MM-dd HH:mm');
export const formatTime = (date) => formatDate(date, 'HH:mm');