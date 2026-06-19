import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';

@Injectable()
export class AppService {
  getHome(res: Response) {
    const indexPath = path.join(
      process.cwd(),
      'apps/api-gateway/public/index.html',
    );
    res.sendFile(indexPath);
  }
}
