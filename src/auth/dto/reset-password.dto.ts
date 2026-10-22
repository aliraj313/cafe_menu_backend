import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: '09123456789' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, { message: 'mobile must be a valid Iranian number (09xxxxxxxxx)' })
  mobile!: string;

  @ApiProperty({ example: '123456', description: 'OTP received via SMS' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'otp must be a 6-digit code' })
  otp!: string;

  @ApiProperty({ example: 'newSecurePass1' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
