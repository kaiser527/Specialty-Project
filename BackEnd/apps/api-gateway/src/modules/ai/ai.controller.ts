import { Controller, Get, Param, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import {
  ResponseMessage,
  SkipPermission,
  User,
} from '../../utils/decorator.customize';
import { IUser } from 'libs/utils/interface';
import { AiMessagePaginateDto } from 'libs/dtos/ai/message.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('/conversation')
  @SkipPermission()
  @ResponseMessage('Fetch chat conversation by user')
  findAllConversation(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @User() user: IUser,
  ) {
    return this.aiService.findAllConversation({
      currentPage: +currentPage,
      limit: +limit,
      userId: user._id.toString(),
    });
  }

  @Get('/message/:conversationId')
  @SkipPermission()
  findAllMessage(
    @Param('conversationId') conversationId: string,
    @Query() query: Omit<AiMessagePaginateDto, 'conversationId'>,
  ) {
    return this.aiService.findAllMessage({
      ...query,
      conversationId,
    });
  }
}
