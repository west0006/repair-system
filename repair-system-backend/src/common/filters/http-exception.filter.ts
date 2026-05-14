import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const result = {
      code: status,
      message:
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as any).message || '请求失败'
          : exceptionResponse,
      data: null,
    };

    response.status(200).json(result);
  }
}
