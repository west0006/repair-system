import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { Public } from '../auth/public.decorator';

// 定义请求用户类型
interface RequestWithUser extends Request {
  user: { id: number; name: string; phone: string; role: number };
}

@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  @Post('create')
  @Roles(Role.User)
  async createPayment(
    @Request() _req: RequestWithUser,
    @Body('orderId') orderId: number,
  ) {
    // 预留：调用微信支付统一下单接口
    // TODO: 集成微信支付，根据 orderId 生成支付链接
    await Promise.resolve(); // 模拟异步操作，避免 ESLint 警告
    return {
      code: 200,
      data: { paymentUrl: `https://pay.example.com?orderId=${orderId}` },
    };
  }
  @Public()
  @Post('callback')
  async wechatCallback(@Body() _body: any) {
    // 支付结果通知
    // TODO: 解析微信支付回调，更新订单支付状态
    await Promise.resolve();
    return 'SUCCESS';
  }
}
