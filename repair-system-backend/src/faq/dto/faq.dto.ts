import { IsString, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFaqDto {
  @IsString()
  keyword: string;

  @IsString()
  solution: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsIn([1, 2])
  status?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateFaqDto extends CreateFaqDto {}

export class FaqQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}
