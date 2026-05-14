// material/dto/category.dto.ts
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  status?: number;
}

export class UpdateCategoryDto extends CreateCategoryDto {}
