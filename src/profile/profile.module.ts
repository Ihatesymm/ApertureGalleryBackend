import { Module } from '@nestjs/common';
import { ProfileController } from '@profile/profile.controllet';
import { ProfileService } from '@profile/profile.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@user/user.entity';
import { FollowEntity } from '@profile/follow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, FollowEntity])],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
