import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        // 如果数据已经是标准响应格式（包含 code 和 data），则直接返回
        if (
          data &&
          typeof data === 'object' &&
          'code' in data &&
          'data' in data
        ) {
          return data;
        }
        // 否则包装为标准格式
        return {
          code: 200,
          message: '请求成功',
          data: data ?? null,
        };
      }),
    );
  }
}
