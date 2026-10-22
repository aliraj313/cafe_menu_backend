import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '09123456789', description: 'Iranian mobile 09xxxxxxxxx' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, { message: 'mobile must be a valid Iranian number (09xxxxxxxxx)' })
  mobile!: string;

  @ApiProperty({ example: 'changeme123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
