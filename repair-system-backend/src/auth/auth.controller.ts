import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserService } from './user.service';
import { RequestWithUser } from '../types/request-with-user';
import { Public } from './public.decorator';
import { WechatService } from '../wechat/wechat.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private wechatService: WechatService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() dto: { username: string; password: string }) {
    const user = await this.authService.validateUser(
      dto.username,
      dto.password,
    );
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    return this.authService.login(user);
  }
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(
      dto.username,
      dto.password,
      dto.name,
      dto.phone,
      dto.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() body: { name?: string; phone?: string },
  ) {
    const userId = req.user.id;
    const updatedUser = await this.userService.update(userId, body);
    // 返回更新后的用户信息（可选）
    return {
      code: 200,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('bind-openid')
  async bindOpenid(
    @Request() req: RequestWithUser,
    @Body('code') code: string,
  ) {
    const openid = await this.wechatService.getOpenidByCode(code);
    await this.authService.bindOpenid(req.user.id, openid);
    return { code: 200 };
  }
}
