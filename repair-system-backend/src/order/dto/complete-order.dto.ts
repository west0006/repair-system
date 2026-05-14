import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

class MaterialItemDto {
  @IsString() name: string;
  @IsInt() quantity: number;
}

export class CompleteOrderDto {
  @IsString() repairContent: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialItemDto)
  materials: MaterialItemDto[];
  @IsOptional()
  @IsArray()
  afterPhotos?: string[];
}
