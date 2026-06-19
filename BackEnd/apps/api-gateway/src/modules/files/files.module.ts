import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { MulterConfigService } from './multer.config';
import { FileScheduler } from './bull/files.scheduler';
import { FileProcessor } from './bull/files.processor';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: MulterConfigService,
    }),
    UsersModule,
    ProductsModule,
  ],
  controllers: [FilesController],
  providers: [FilesService, FileScheduler, FileProcessor],
})
export class FilesModule {}
