import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UserRole } from '../generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { StorageService, UploadedFileResult } from './storage.service';

/** Must match ConfigsService.STORAGE.MAX_FILE_BYTES and FIELD_NAME */
const STORAGE_FIELD = 'file';
const STORAGE_MAX_BYTES = 5 * 1024 * 1024;

@ApiTags('storage')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @ApiOperation({ summary: 'Upload an image to disk under /storage' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [STORAGE_FIELD],
      properties: {
        [STORAGE_FIELD]: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpeg, png, webp, gif)',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor(STORAGE_FIELD, {
      storage: memoryStorage(),
      limits: { fileSize: STORAGE_MAX_BYTES },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File): Promise<UploadedFileResult> {
    return this.storageService.saveImage(file);
  }
}
