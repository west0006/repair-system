import { createI18n } from 'vue-i18n';
import zh from './zh.json';
import en from './en.json';
import ko from './ko.json';

const messages = { zh, en, ko };

const i18n = createI18n({
  legacy: false,
  locale: 'zh', // 默认中文
  fallbackLocale: 'zh',
  messages
});

export default i18n;