import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB per file
const ALLOWED_PREFIXES = ['image/', 'application/pdf'];

@Injectable()
export class UploadsService {
  private readonly photosDir = path.join(process.cwd(), '..', '..', 'uploads', 'photos');

  constructor() {
    fs.mkdirSync(this.photosDir, { recursive: true });
  }

  savePhotos(files: Express.Multer.File[]): { urls: string[]; filenames: string[] } {
    if (!files?.length) {
      throw new BadRequestException('At least one file is required');
    }

    const urls: string[] = [];
    const filenames: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file?.buffer?.length) {
        throw new BadRequestException(`Empty file: ${file?.originalname ?? i}`);
      }
      if (file.size > MAX_BYTES) {
        throw new BadRequestException(`File too large (max 12MB): ${file.originalname}`);
      }
      const mime = (file.mimetype || '').toLowerCase();
      if (!ALLOWED_PREFIXES.some((p) => mime.startsWith(p))) {
        throw new BadRequestException(
          `Unsupported file type (${file.mimetype || 'unknown'}). Use images or PDF.`,
        );
      }

      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${Date.now()}-${i}-${safe}`;
      fs.writeFileSync(path.join(this.photosDir, filename), file.buffer);
      urls.push(`/uploads/photos/${filename}`);
      filenames.push(filename);
    }

    return { urls, filenames };
  }
}
