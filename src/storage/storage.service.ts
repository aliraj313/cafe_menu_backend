import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createWriteStream, promises as fs } from 'fs';
import { extname, join } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { BusinessRuleException } from '../common/exceptions/app.exception';
import { ConfigsService } from '../config/configs.service';

export interface UploadedFileResult {
  /** Public path, e.g. /storage/uuid.jpg */
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private rootAbsolute: string;

  constructor(private readonly configs: ConfigsService) {
    this.rootAbsolute = join(process.cwd(), this.configs.STORAGE.ROOT_DIR);
  }

  async onModuleInit(): Promise<void> {
    await fs.mkdir(this.rootAbsolute, { recursive: true });
  }

  getRootAbsolute(): string {
    return this.rootAbsolute;
  }

  async saveImage(file: Express.Multer.File): Promise<UploadedFileResult> {
    if (!file) {
      throw new BusinessRuleException('FILE_REQUIRED', 'File is required.');
    }

    const allowed = this.configs.STORAGE.ALLOWED_MIME_TYPES as readonly string[];
    if (!allowed.includes(file.mimetype)) {
      throw new BusinessRuleException(
        'INVALID_FILE_TYPE',
        `Only image uploads are allowed (${allowed.join(', ')}).`,
      );
    }

    if (file.size > this.configs.STORAGE.MAX_FILE_BYTES) {
      throw new BusinessRuleException(
        'FILE_TOO_LARGE',
        `File exceeds maximum size of ${this.configs.STORAGE.MAX_FILE_BYTES} bytes.`,
      );
    }

    const ext = this.resolveExtension(file.originalname, file.mimetype);
    const filename = `${randomUUID()}${ext}`;
    const absolutePath = join(this.rootAbsolute, filename);

    if (file.buffer && file.buffer.length > 0) {
      await fs.writeFile(absolutePath, file.buffer);
    } else if (file.path) {
      await fs.rename(file.path, absolutePath);
    } else if (file.stream) {
      await pipeline(file.stream as Readable, createWriteStream(absolutePath));
    } else {
      throw new BusinessRuleException('FILE_EMPTY', 'Uploaded file is empty.');
    }

    const publicPath = `${this.configs.STORAGE.PUBLIC_PATH}/${filename}`;

    return {
      url: publicPath,
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  private resolveExtension(originalName: string, mimeType: string): string {
    const fromName = extname(originalName).toLowerCase();
    if (fromName && fromName.length <= 10) {
      return fromName;
    }
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    return map[mimeType] ?? '.bin';
  }
}
