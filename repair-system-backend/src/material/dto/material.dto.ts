// material/dto/material.dto.ts
import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateMaterialDto {
  @IsInt()
  categoryId?: number;

  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  spec?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  standardDiscount?: number;

  @IsOptional()
  @IsInt()
  supplierId?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxStock?: number;

  @IsOptional()
  expiryDate?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  status?: number;
}

export class MaterialListDto {
  categoryId?: number;
  name?: string;
  supplierId?: number;
}

export class UpdateMaterialDto extends CreateMaterialDto {}
