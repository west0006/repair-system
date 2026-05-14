import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateBuildingDto {
  @IsString() name: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsOptional() @IsInt() areaId?: number;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsInt() @Min(1) @Max(2) status?: number;
}
export class UpdateBuildingDto extends CreateBuildingDto {}
