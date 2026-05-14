import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  status?: number;
}

export class UpdateSupplierDto extends CreateSupplierDto {}
