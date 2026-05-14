import { IsNumber, IsString, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsNumber()
  order_id?: number; // 工单ID（消息与工单绑定）

  @IsNumber()
  receiver_id: number; // 接收者ID

  @IsNumber()
  sender_type: number; // 0-用户  1-师傅  2-管理员

  @IsString()
  content: string; // 内容或图片URL

  @IsOptional()
  @IsNumber()
  type?: number; // 0-文本  1-图片
}
