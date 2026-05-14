import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class SubmitOrderDto {
  @IsString() faultType: string;
  @IsOptional() @IsString() desc?: string;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @IsString() locationBuilding?: string;
  @IsOptional() @IsString() locationFloor?: string;
  @IsOptional() @IsString() locationRoom?: string;
  @IsOptional() @IsInt() @Min(1) @Max(3) urgency?: number;
  @IsOptional()
  @IsString()
  scheduledTime?: string;
}
