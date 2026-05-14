// src/types/express.d.ts
import { UserWithoutPassword } from '../../auth/auth.service';

declare global {
  namespace Express {
    interface Request {
      user: UserWithoutPassword;
    }
  }
}
