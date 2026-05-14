import {
  IsString,
  MinLength,
  IsPhoneNumber,
  IsIn,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsString() @MinLength(3) username: string;
  @IsString() @MinLength(6) password: string;
  @IsString() name: string;
  @IsPhoneNumber('CN') phone: string;
  @IsOptional() @IsIn([0, 1, 2]) role?: number;
}
