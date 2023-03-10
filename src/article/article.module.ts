import { Module } from '@nestjs/common';
import { ArticleController } from '@article/article.controller';
import { ArticleService } from '@article/article.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from '@article/article.entity';
import { UserEntity } from '@user/user.entity';
import { FollowEntity } from '@profile/follow.entity';
import { CommentEntity } from '@article/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ArticleEntity,
      UserEntity,
      FollowEntity,
      CommentEntity,
    ]),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
