import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ChatEFService } from 'libs/utils/interface';
import { grpcCall } from '../../utils/helper';
import {
  AiConversationPaginateDto,
  AiMessagePaginateDto,
} from 'libs/dtos/ai/message.dto';

@Injectable()
export class AiService implements OnModuleInit {
  private chatEFService: ChatEFService;

  constructor(@Inject('MESSAGE_SERVICE') private clientMessage: ClientGrpc) {}

  onModuleInit() {
    this.chatEFService =
      this.clientMessage.getService<ChatEFService>('ChatEFService');
  }

  async findAllMessage(dto: AiMessagePaginateDto) {
    const data: any = await grpcCall(this.chatEFService.findAllMessage(dto));

    return {
      ...data,
      result: (data?.result ?? []).map((x: any) => ({
        ...x,
        data: x.data ? JSON.parse(x.data) : [],
      })),
    };
  }

  async findAllConversation(dto: AiConversationPaginateDto) {
    return await grpcCall(this.chatEFService.findAllConversation(dto));
  }
}
