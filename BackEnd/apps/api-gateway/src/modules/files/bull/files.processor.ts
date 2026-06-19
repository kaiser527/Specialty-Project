import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { FilesService } from '../files.service';
import { JOBS } from 'libs/utils/constants';

@Processor('file-cleanup-queue', { concurrency: 5 })
export class FileProcessor extends WorkerHost {
  constructor(private readonly filesService: FilesService) {
    super();
  }

  async process(job: Job) {
    if (job.name === JOBS.CLEANUP) {
      await this.filesService.deleteUnusedFiles();
    }
  }
}
