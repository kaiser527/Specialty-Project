import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  MulterModuleOptions,
  MulterOptionsFactory,
} from '@nestjs/platform-express';
import fs from 'fs';
import { diskStorage } from 'multer';
import path, { join } from 'path';

@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
  getRootPath = () => {
    return process.cwd();
  };

  ensureExists(targetDirectory: string) {
    fs.mkdir(targetDirectory, { recursive: true }, (error) => {
      if (!error) {
        console.log('Directory successfully created, or it already exists.');
        return;
      }
      switch (error.code) {
        case 'EEXIST':
          // Error:
          // Requested location already exists, but it's not a directory.
          break;
        case 'ENOTDIR':
          // Error:
          // The parent hierarchy contains a file with the same name as the dir
          // you're trying to create.
          break;
        default:
          // Some other error like permission denied.
          console.error(error);
          break;
      }
    });
  }

  createMulterOptions(): MulterModuleOptions {
    return {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const folder = req?.headers?.folder_type ?? 'default';
          this.ensureExists(`apps/api-gateway/public/images/${folder}`);
          cb(
            null,
            join(
              this.getRootPath(),
              `apps/api-gateway/public/images/${folder}`,
            ),
          );
        },
        filename: (req, file, cb) => {
          const extName = path.extname(file.originalname).toLowerCase();

          let baseName = path
            .basename(file.originalname, extName)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');

          if (!baseName) {
            baseName = 'file';
          }

          const finalName = `${baseName}-${Date.now()}${extName}`;
          cb(null, finalName);
        },
      }),
      fileFilter: (req, file, cb) => {
        const typeMap = {
          jpg: ['image/jpeg'],
          jpeg: ['image/jpeg'],
          png: ['image/png'],
          pdf: ['application/pdf'],
        };

        const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
        const validMime = typeMap[ext];

        if (!validMime || !validMime.includes(file.mimetype)) {
          return cb(
            new UnprocessableEntityException('Invalid file type'),
            false,
          );
        }

        cb(null, true);
      },
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
      },
    };
  }
}
