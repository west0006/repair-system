import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairPosition } from './repair-position.entity';
import { RepairPositionService } from './repair-position.service';
import { RepairPositionController } from './repair-position.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RepairPosition])],
  providers: [RepairPositionService],
  controllers: [RepairPositionController],
  exports: [RepairPositionService],
})
export class RepairPositionModule {}
