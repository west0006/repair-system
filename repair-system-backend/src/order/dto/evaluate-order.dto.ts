import { IsInt, Min, Max, IsString } from 'class-validator';
export class EvaluateOrderDto {
  @IsInt() orderId: number;
  @IsInt() @Min(1) @Max(5) score: number;
  @IsString() comment: string;
}
