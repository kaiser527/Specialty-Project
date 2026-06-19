import { Catch, ArgumentsHost } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Catch(WsException)
export class WsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();

    const message = exception.getError();

    client.emit('auth_error', {
      message: typeof message === 'string' ? message : message['message'],
    });
  }
}
