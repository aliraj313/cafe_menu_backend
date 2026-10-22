import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

/**
 * Dedicated theme update body.
 * `theme` may be any JSON value (object, array, string, number, boolean) or null.
 */
export class UpdateThemeDto {
  @ApiProperty({
    nullable: true,
    description: 'Arbitrary theme JSON payload, or null to clear the theme',
    example: { primaryColor: '#8B4513', mode: 'dark' },
  })
  @Allow()
  theme!: unknown;
}
