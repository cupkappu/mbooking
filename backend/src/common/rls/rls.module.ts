import { Module, Global } from '@nestjs/common';
import { RlsService } from './rls.service';

@Global()
@Module({
  providers: [RlsService],
  exports: [RlsService],
})
export class RlsModule {}
