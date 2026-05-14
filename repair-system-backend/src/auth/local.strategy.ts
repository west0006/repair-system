// auth/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService, UserWithoutPassword } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({ usernameField: 'username' });
  }

  async validate(
    username: string,
    password: string,
  ): Promise<UserWithoutPassword> {
    const user = await this.authService.validateUser(username, password);
    if (!user) throw new UnauthorizedException('用户名或密码错误');
    return user;
  }
}
