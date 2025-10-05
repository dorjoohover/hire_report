import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';

@Module({
  providers: [AssetsService],
  exports: [AssetsService], // бусад service, controller-д ашиглах боломжтой
})
export class AssetsModule {}
