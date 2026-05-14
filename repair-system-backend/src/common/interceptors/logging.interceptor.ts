import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: number;
    name?: string;
    role?: number;
    phone?: string;
  };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, user } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `${method} ${url} ${response.statusCode} ${Date.now() - now}ms - user=${user?.id ?? 'guest'}`,
        );
      }),
    );
  }
}
