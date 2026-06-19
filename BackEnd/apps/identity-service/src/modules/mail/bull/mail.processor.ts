import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from '../mail.service';
import { JOBS } from 'libs/utils/constants';

@Processor('mail-queue')
export class MailProcessor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job) {
    const { email, name, otp } = job.data;

    switch (job.name) {
      case JOBS.REGISTER:
        await this.mailService.sendEmail(email, name, otp, 'register');
        break;

      case JOBS.RESET:
        await this.mailService.sendEmail(email, name, otp, 'reset');
        break;
    }
  }
}
