import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'کافه‌ی نور' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  cafeName?: string;

  @ApiPropertyOptional({ example: 'طعم واقعی قهوه' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  slogan?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUrl({ require_tld: false })
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: 'کافه تخصصی قهوه و دسر' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({ example: '02112345678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional({ example: 'همه‌روزه ۸ صبح تا ۱۱ شب' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  workingHours?: string | null;

  @ApiPropertyOptional({ example: 'تهران، خیابان ولیعصر' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string | null;

  @ApiPropertyOptional({ example: 'https://instagram.com/mycafe' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUrl({ require_tld: false })
  instagramUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://t.me/mycafe' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUrl({ require_tld: false })
  telegramUrl?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Zarinpal merchant id',
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  zarinpalMerchant?: string | null;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the cafe/restaurant is currently open for orders',
  })
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;
}
