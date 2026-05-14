// src/order/dto/set-material-bill.dto.ts

import { IsNumber, IsArray, IsOptional, IsString } from 'class-validator';

export class MaterialBillItemDTO {
  @IsNumber()
  material_id: number;

  @IsString()
  material_name: string;

  @IsString()
  spec: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unit_price: number;

  @IsNumber()
  discount: number; // 如 0.8 为八折

  @IsOptional()
  @IsString()
  remark?: string;
}

export class SetMaterialBillDTO {
  @IsNumber()
  repair_order_id: number;

  @IsArray()
  items: MaterialBillItemDTO[]; // 备件明细

  @IsNumber()
  total_amount: number; // 合计金额

  @IsNumber()
  discount: number; // 全单折扣，1为不打折

  @IsNumber()
  pay_amount: number; // 实付金额

  @IsOptional()
  @IsNumber()
  service_fee?: number; //服务费
}
