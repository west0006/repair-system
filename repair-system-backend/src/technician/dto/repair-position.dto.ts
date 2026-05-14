import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateRepairPositionDto {
  @IsString() name: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsOptional() @IsString() nameKo?: string;
  @IsOptional() @IsBoolean() visibleToUser?: boolean;
  @IsOptional() @IsIn(['direct', 'area', 'round_robin']) dispatchType?: string;
  @IsOptional() @IsBoolean() allowTransfer?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsInt() @Min(0) @Max(1) status?: number;
}

export class UpdateRepairPositionDto extends CreateRepairPositionDto {}
