import { Injectable } from '@nestjs/common';

// 定义支持的语言类型
export type Language = 'zh' | 'en' | 'ko';

// 定义翻译条目类型
type TranslationMap = Record<string, string>;

// 定义所有语言的翻译字典类型
type Translations = Record<Language, TranslationMap>;

@Injectable()
export class I18nService {
  private readonly translations: Translations = {
    zh: {
      welcome: '欢迎',
      order_submitted: '工单已提交',
      order_created: '工单创建成功',
      order_accepted: '工单已被接单',
      order_completed: '维修已完成',
      notification_title: '通知',
      error_occurred: '发生错误',
      // 可根据需要添加更多键值对
    },
    en: {
      welcome: 'Welcome',
      order_submitted: 'Order submitted',
      order_created: 'Order created successfully',
      order_accepted: 'Order has been accepted',
      order_completed: 'Repair completed',
      notification_title: 'Notification',
      error_occurred: 'An error occurred',
    },
    ko: {
      welcome: '환영합니다',
      order_submitted: '주문이 제출되었습니다',
      order_created: '주문이 성공적으로 생성되었습니다',
      order_accepted: '주문이 접수되었습니다',
      order_completed: '수리가 완료되었습니다',
      notification_title: '알림',
      error_occurred: '오류가 발생했습니다',
    },
  };

  /**
   * 根据语言和键获取翻译文本
   * @param lang 语言代码 (zh/en/ko)
   * @param key 翻译键
   * @returns 翻译后的字符串，若未找到则返回键名
   */
  translate(lang: string, key: string): string {
    // 类型守卫：确保 lang 是有效的语言代码
    const validLang = this.isValidLanguage(lang) ? lang : 'zh';
    const translation = this.translations[validLang][key];
    return translation ?? key;
  }

  /**
   * 检查语言代码是否有效
   */
  private isValidLanguage(lang: string): lang is Language {
    return lang === 'zh' || lang === 'en' || lang === 'ko';
  }

  /**
   * 获取当前支持的语言列表
   */
  getSupportedLanguages(): Language[] {
    return ['zh', 'en', 'ko'];
  }

  /**
   * 获取所有翻译（供调试或管理用）
   */
  getAllTranslations(): Translations {
    return { ...this.translations };
  }
}
