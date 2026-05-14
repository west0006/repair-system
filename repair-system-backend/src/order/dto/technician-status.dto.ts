import { IsInt, IsIn } from 'class-validator';
import { OrderStatus } from '../order-status.enum';

export class TechnicianStatusDto {
  @IsInt()
  @IsIn([
    OrderStatus.ON_WAY,
    OrderStatus.REPAIRING,
    OrderStatus.COMPLETED,
    OrderStatus.WAITING_PARTS,
  ])
  status: number;
}
