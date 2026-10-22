import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: '09123456789' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, { message: 'mobile must be a valid Iranian number (09xxxxxxxxx)' })
  mobile!: string;
}
