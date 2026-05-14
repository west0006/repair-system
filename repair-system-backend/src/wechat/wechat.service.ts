// src/wechat/wechat.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// 1. 定义微信 API 返回的数据结构
interface WxTokenResponse {
  access_token: string;
  expires_in: number;
  errcode?: number;
  errmsg?: string;
}

interface WxSendResponse {
  errcode: number;
  errmsg: string;
}

interface WxCode2SessionResponse {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

// 2. 缓存类型
interface AccessTokenCache {
  token: string;
  expiresAt: number;
}

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);
  private accessTokenCache: AccessTokenCache | null = null;

  constructor(private configService: ConfigService) {}

  async getAccessToken(): Promise<string> {
    // 检查缓存
    if (this.accessTokenCache && Date.now() < this.accessTokenCache.expiresAt) {
      return this.accessTokenCache.token;
    }

    const appId = this.configService.get<string>('WECHAT_APPID');
    const secret = this.configService.get<string>('WECHAT_SECRET');
    if (!appId || !secret) {
      throw new Error('未配置微信 AppID 或 AppSecret');
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${secret}`;
    const res = await axios.get<WxTokenResponse>(url);
    const data = res.data;

    if (data.errcode && data.errcode !== 0) {
      this.logger.error(`获取 access_token 失败: ${data.errmsg}`);
      throw new Error(`获取 access_token 失败: ${data.errmsg}`);
    }

    // 缓存（提前5分钟过期）
    this.accessTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    };
    return this.accessTokenCache.token;
  }

  async sendSubscribeMessage(params: {
    touser: string;
    templateId: string;
    page?: string;
    data: Record<string, { value: string }>;
  }): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;
      const body = {
        touser: params.touser,
        template_id: params.templateId,
        page: params.page || '/pages/index/index',
        data: params.data,
        miniprogram_state: 'developer', // 上线后改为 formal
      };
      const res = await axios.post<WxSendResponse>(url, body);
      const result = res.data;

      if (result.errcode === 0) {
        this.logger.log(`订阅消息发送成功`);
        return true;
      } else {
        this.logger.warn(
          `发送失败: ${result.errmsg} (code: ${result.errcode})`,
        );
        return false;
      }
    } catch (error) {
      this.logger.error('发送订阅消息异常:', error);
      return false;
    }
  }

  async getOpenidByCode(code: string): Promise<string> {
    const appId = this.configService.get<string>('WECHAT_APPID');
    const secret = this.configService.get<string>('WECHAT_SECRET');
    if (!appId || !secret) {
      throw new Error('未配置微信 AppID 或 AppSecret');
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
    const res = await axios.get<WxCode2SessionResponse>(url);
    const data = res.data;

    if (data.errcode && data.errcode !== 0) {
      this.logger.error(`获取 openid 失败: ${data.errmsg}`);
      throw new Error('获取 openid 失败: ' + data.errmsg);
    }
    return data.openid;
  }
}
