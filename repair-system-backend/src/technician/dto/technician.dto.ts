import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsArray,
} from 'class-validator';

export class CreateTechnicianDto {
  @IsInt()
  userId: number;

  @IsOptional()
  @IsInt()
  areaId?: number;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  buildingIds?: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  status?: number; // 1-空闲 2-忙碌 3-休假
}

export class UpdateTechnicianStatusDto {
  @IsInt()
  @Min(1)
  @Max(3)
  status: number;
}
