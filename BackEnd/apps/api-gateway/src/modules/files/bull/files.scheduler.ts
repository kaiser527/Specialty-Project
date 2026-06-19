import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOBS } from 'libs/utils/constants';
import { randomUUID } from 'crypto';

@Injectable()
export class FileScheduler implements OnModuleInit {
  constructor(
    @InjectQueue('file-cleanup-queue')
    private readonly fileQueue: Queue,
  ) {}

  async onModuleInit() {
    const repeatableJobs = await this.fileQueue.getJobSchedulers();

    for (const job of repeatableJobs) {
      if (job.name === JOBS.CLEANUP) {
        await this.fileQueue.removeJobScheduler(job.key);
      }
    }

    await this.fileQueue.add(
      JOBS.CLEANUP,
      {},
      {
        jobId: `${JOBS.CLEANUP}-job-${randomUUID()}`,
        repeat: {
          every: 10 * 60 * 1000,
        },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
      },
    );

    console.log('Redis repeatable cleanup job registered');
  }
}
