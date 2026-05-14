import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
// import { join } from 'path';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // 全局前缀
  // app.setGlobalPrefix('api');

  // 跨域配置
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 静态资源托管
  // app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  //   prefix: '/uploads',
  // });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 全局拦截器/过滤器
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3000);
}

bootstrap().catch((err) => {
  console.error('应用启动失败:', err);
  process.exit(1);
});
//npm run start:dev
