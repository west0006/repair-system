// order/dto/approve-order.dto.ts
import { IsBoolean, IsOptional } from 'class-validator';

export class ApproveOrderDto {
  @IsOptional()
  @IsBoolean()
  autoDispatch?: boolean;
}
