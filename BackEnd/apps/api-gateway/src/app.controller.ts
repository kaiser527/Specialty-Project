import { Controller, Get, Res, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './utils/decorator.customize';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @Version(VERSION_NEUTRAL)
  getHello(@Res() res: Response) {
    return this.appService.getHome(res);
  }
}
