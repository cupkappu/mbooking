import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserSeedService } from './admin-user-seed.service';
import { User } from '../../auth/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [AdminUserSeedService],
  exports: [AdminUserSeedService],
})
export class SeedsModule {}
