import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ProfileType } from '@profile/types/profile.type';
import { ProfileResponseInterface } from '@profile/types/profileResponse.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@user/user.entity';
import { Repository } from 'typeorm';
import { FollowEntity } from '@profile/follow.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}
  async getProfile(
    currentUserId: number,
    profileUsername: string,
  ): Promise<ProfileType> {
    const errorResponse = {
      errors: {},
    };

    const user = await this.userRepository.findOne({
      username: profileUsername,
    });

    if (!user) {
      errorResponse.errors['profile'] = 'does not exis';
      throw new HttpException(errorResponse, HttpStatus.NOT_FOUND);
    }

    const follow = await this.followRepository.findOne({
      followerId: currentUserId,
      followingId: user.id,
    });

    return { ...user, folloving: Boolean(follow) };
  }

  async followProfile(
    currentUserId: number,
    profileUsername: string,
  ): Promise<ProfileType> {
    const errorResponse = {
      errors: {},
    };

    const user = await this.userRepository.findOne({
      username: profileUsername,
    });

    if (!user) {
      errorResponse.errors['profile'] = 'does not exis';
      throw new HttpException(errorResponse, HttpStatus.NOT_FOUND);
    }

    if (currentUserId === user.id) {
      errorResponse.errors['user'] = 'cannot follow himself';
      throw new HttpException(errorResponse, HttpStatus.BAD_REQUEST);
    }

    const follow = await this.followRepository.findOne({
      followerId: currentUserId,
      followingId: user.id,
    });

    if (!follow) {
      const followToFollowing = new FollowEntity();
      followToFollowing.followerId = currentUserId;
      followToFollowing.followingId = user.id;

      await this.followRepository.save(followToFollowing);
    }

    return { ...user, folloving: true };
  }

  async unfollowProfile(
    currentUserId: number,
    profileUsername: string,
  ): Promise<ProfileType> {
    const errorResponse = {
      errors: {},
    };

    const user = await this.userRepository.findOne({
      username: profileUsername,
    });

    if (!user) {
      errorResponse.errors['profile'] = 'does not exis';
      throw new HttpException(errorResponse, HttpStatus.NOT_FOUND);
    }

    if (currentUserId === user.id) {
      errorResponse.errors['user'] = 'cannot follow himself';
      throw new HttpException(errorResponse, HttpStatus.BAD_REQUEST);
    }

    await this.followRepository.delete({
      followerId: currentUserId,
      followingId: user.id,
    });

    return { ...user, folloving: false };
  }

  buildProfileResponse(profile: ProfileType): ProfileResponseInterface {
    delete profile.email;
    return { profile };
  }
}
