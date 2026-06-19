import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: 'mail-queue' })],
  exports: [BullModule],
})
export class QueueModule {}
