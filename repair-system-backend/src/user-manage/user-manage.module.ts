import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/user.entity';
import { UserManageController } from './user-manage.controller';
import { UserManageService } from './user-manage.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserManageController],
  providers: [UserManageService],
})
export class UserManageModule {}
