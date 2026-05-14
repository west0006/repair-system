// types/request-with-user.ts
import { Request } from 'express';
import { UserWithoutPassword } from '../auth/auth.service';

export interface RequestWithUser extends Request {
  user: UserWithoutPassword;
}
