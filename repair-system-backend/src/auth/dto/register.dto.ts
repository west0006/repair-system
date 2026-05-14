// auth/dto/register.dto.ts
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsPhoneNumber,
  IsIn,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsPhoneNumber('CN')
  phone: string;

  @IsOptional()
  @IsIn([0, 1, 2])
  role?: number;
}
