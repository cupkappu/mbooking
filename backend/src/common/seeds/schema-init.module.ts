import { Module } from '@nestjs/common';
import { SchemaInitService } from './schema-init.service';

@Module({
  providers: [SchemaInitService],
  exports: [SchemaInitService],
})
export class SchemaInitModule {}
