import { Injectable } from '@nestjs/common';
import path from 'path';
import fs from 'fs';
import { UsersService } from '../users/users.service';
import { protectFiles } from 'libs/utils/constants';
import { ProductsService } from '../products/products.service';

@Injectable()
export class FilesService {
  private readonly protectedFiles = new Set(protectFiles);
  private readonly rootPath = path.join(
    process.cwd(),
    'apps/api-gateway/public/images',
  );

  constructor(
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}

  async deleteUnusedFiles() {
    const diskFiles = this.getAllFiles();

    const usersFiles = await this.usersService.getAllFiles();
    const productsFiles = await this.productsService.getAllFiles();

    if (!usersFiles?.length || !productsFiles?.length) return;

    const userSet = new Set(usersFiles);
    const productSet = new Set(productsFiles);

    const deleted: string[] = [];

    for (const folder in diskFiles) {
      const files = diskFiles[folder];

      // Skip unknown folders (safety)
      if (!['user', 'product'].includes(folder)) {
        console.warn(`Skipping unknown folder: ${folder}`);
        continue;
      }

      for (const file of files) {
        if (
          (folder === 'user' || folder === 'product') &&
          this.protectedFiles.has(file)
        ) {
          continue;
        }

        let existsInDb = false;

        if (folder === 'user') {
          existsInDb = userSet.has(file);
        }

        if (folder === 'product') {
          existsInDb = productSet.has(file);
        }

        if (!existsInDb) {
          const fullPath = path.join(this.rootPath, folder, file);
          await fs.promises.unlink(fullPath);
          deleted.push(`${folder}/${file}`);
        }
      }
    }

    console.log(`Deleted ${deleted.length} files`);
    return deleted;
  }

  getAllFiles() {
    const result: Record<string, string[]> = {};

    if (!fs.existsSync(this.rootPath)) return result;

    const folders = fs.readdirSync(this.rootPath);

    for (const folder of folders) {
      const folderPath = path.join(this.rootPath, folder);

      if (!fs.statSync(folderPath).isDirectory()) continue;

      const files = fs.readdirSync(folderPath);

      result[folder] = files;
    }

    return result;
  }
}
