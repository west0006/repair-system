import {
  IsInt,
  IsArray,
  ValidateNested,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

class MaterialItemDto {
  @IsInt() materialId: number;
  @IsInt() quantity: number;
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== null ? Number(value) : undefined,
  )
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  discount?: number;
}

export class MaterialApplyDto {
  @IsInt() orderId: number;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialItemDto)
  items: MaterialItemDto[];
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional() @IsNumber() serviceFee?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  totalDiscount?: number;
}
