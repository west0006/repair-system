import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from './building.entity';
import { BuildingService } from './building.service';
import { BuildingController } from './building.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Building])],
  providers: [BuildingService],
  controllers: [BuildingController],
  exports: [TypeOrmModule.forFeature([Building]), BuildingService],
})
export class BuildingModule {}
