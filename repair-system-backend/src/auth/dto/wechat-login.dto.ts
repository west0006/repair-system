import { IsString, IsOptional } from 'class-validator';

export class WechatLoginDto {
  @IsString()
  code: string; // 微信登录 code

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;
}
