import {
  IsOptional,
  IsString,
  IsPhoneNumber,
  IsIn,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsPhoneNumber('CN')
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsIn([0, 1, 2, 3, 4])
  role?: number;
}
