import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UserEntity } from '@user/user.entity';
import { CreateArticleDto } from '@article/dto/createArticle.dto';
import { ArticleEntity } from '@article/article.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository, getRepository } from 'typeorm';
import { ArticleResponseInterface } from '@article/types/articleResponse.interface';
import slugify from 'slugify';
import { ArticlesResponseInterface } from '@article/types/articlesResponse.Interface';
import { FollowEntity } from '@profile/follow.entity';
import { CommentEntity } from '@article/comment.entity';
import { CommentResponseInterface } from '@article/types/commentResponse.interface';
import { CreateCommentDto } from '@article/dto/createComment.dto';
import { CommentsResponseInterface } from '@article/types/commentsResponse.interface';

@Injectable()
export class ArticleService {
  [x: string]: any;
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
  ) {}

  async findAll(
    currentUserId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const queryBuilder = getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author');

    queryBuilder.orderBy('articles.createdAt', 'DESC');

    const articlesCount = await queryBuilder.getCount();

    const author = await this.userRepository.findOne({
      username: query.author,
    });

    if (query.tag) {
      queryBuilder.andWhere('articles.tagList LIKE :tag', {
        tag: `%${query.tag}%`,
      });
    }

    if (query.author) {
      queryBuilder.andWhere('articles.authorId = :id', {
        id: author.id,
      });
    }

    if (query.favorited) {
      const user = await this.userRepository.findOne(
        {
          username: query.favorited,
        },
        { relations: ['favorites'] },
      );
      const ids = user.favorites.map((el) => el.id);

      if (ids.length > 0) {
        queryBuilder.andWhere('articles.id IN (:...ids)', { ids });
      } else {
        queryBuilder.andWhere('10=1');
      }
    }

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    let favoriteIds: number[] = [];

    if (currentUserId) {
      const currentUser = await this.userRepository.findOne(currentUserId, {
        relations: ['favorites'],
      });
      favoriteIds = currentUser.favorites.map((favorite) => favorite.id);
    }

    const articles = await queryBuilder.getMany();
    const articlesWithFavorites = articles.map((article) => {
      const favorited = favoriteIds.includes(article.id);
      return { ...article, favorited };
    });

    return { articles: articlesWithFavorites, articlesCount };
  }

  async getFeed(
    currentUserId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const follows = await this.followRepository.find({
      followerId: currentUserId,
    });

    if (follows.length === 0) {
      return { articles: [], articlesCount: 0 };
    }

    const followingUserIds = follows.map((follow) => follow.followingId);
    const queryBuilder = getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author')
      .where('articles.authorId IN (:...ids)', { ids: followingUserIds });

    queryBuilder.orderBy('articles.createdAt', 'DESC');

    const articlesCount = await queryBuilder.getCount();

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    const articles = await queryBuilder.getMany();

    return { articles, articlesCount };
  }

  async createArticle(
    currentUser: UserEntity,
    createArticleDto: CreateArticleDto,
  ): Promise<ArticleEntity> {
    const article = new ArticleEntity();
    Object.assign(article, createArticleDto);

    if (!article.tagList) {
      article.tagList = [];
    }

    article.slug = this.getSlug(createArticleDto.title);

    article.author = currentUser;

    return await this.articleRepository.save(article);
  }

  async findBySlug(slug: string): Promise<ArticleEntity> {
    return await this.articleRepository.findOne({ slug });
  }

  async deleteArticle(
    slug: string,
    currentUserId: number,
  ): Promise<DeleteResult> {
    const errorResponse = {
      errors: {},
    };

    const article = await this.findBySlug(slug);

    if (!article) {
      errorResponse.errors['article'] = 'does not exist';
      throw new HttpException(errorResponse, HttpStatus.NOT_FOUND);
    }

    if (article.author.id !== currentUserId) {
      errorResponse.errors['author'] = 'you are not an author';
      throw new HttpException(errorResponse, HttpStatus.FORBIDDEN);
    }

    await this.commentRepository.delete({ article });

    return await this.articleRepository.delete({ slug });
  }

  async updateArticle(
    slug: string,
    updateArticleDto: CreateArticleDto,
    currentUserId: number,
  ): Promise<ArticleEntity> {
    const errorResponse = {
      errors: {},
    };

    const article = await this.findBySlug(slug);

    if (!article) {
      errorResponse.errors['article'] = 'does not exist';
      throw new HttpException(errorResponse, HttpStatus.NOT_FOUND);
    }

    if (article.author.id !== currentUserId) {
      errorResponse.errors['author'] = 'not an author';
      throw new HttpException(errorResponse, HttpStatus.FORBIDDEN);
    }

    Object.assign(article, updateArticleDto);

    return await this.articleRepository.save(article);
  }

  async addArticleToFavorites(
    slug: string,
    currentUserId: number,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    const user = await this.userRepository.findOne(currentUserId, {
      relations: ['favorites'],
    });

    const isNotFavorited =
      user.favorites.findIndex(
        (articleInFavorites) => articleInFavorites.id === article.id,
      ) === -1;

    if (isNotFavorited) {
      user.favorites.push(article);
      article.favoritesCount++;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }

  async deleteArticleFromFavorites(
    slug: string,
    currentUserId: number,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    const user = await this.userRepository.findOne(currentUserId, {
      relations: ['favorites'],
    });

    const articleIndex = user.favorites.findIndex(
      (articleInFavorites) => articleInFavorites.id === article.id,
    );

    if (articleIndex >= 0) {
      user.favorites.splice(articleIndex, 1);
      article.favoritesCount--;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }

  async addComment(
    slug: string,
    createCommentDto: CreateCommentDto,
    currentUser: UserEntity,
  ): Promise<CommentEntity> {
    const comment = new CommentEntity();
    Object.assign(comment, createCommentDto);

    const article = await this.findBySlug(slug);

    comment.author = currentUser;

    comment.article = article;

    return await this.commentRepository.save(comment);
  }

  async getComments(slug: string): Promise<CommentsResponseInterface> {
    const article = await this.articleRepository.findOne(
      { slug },
      {
        relations: ['comments'],
      },
    );

    const comments = article.comments;

    return { comments };
  }

  async deleteComment(
    slug: string,
    currentUserId: number,
    commentId: number,
  ): Promise<DeleteResult> {
    const errorResponse = {
      errors: {},
    };

    const article = await this.findBySlug(slug);

    const comment = await this.commentRepository.findOne(commentId);

    if (!article) {
      errorResponse.errors['article'] = 'does not exist';
      throw new HttpException(errorResponse, HttpStatus.NOT_FOUND);
    }

    if (!comment) {
      errorResponse.errors['comment'] = 'does not exist';
      throw new HttpException(errorResponse, HttpStatus.NOT_FOUND);
    }

    if (comment.author.id !== currentUserId) {
      errorResponse.errors['author'] = 'you are not an author of comment';
      throw new HttpException(errorResponse, HttpStatus.FORBIDDEN);
    }

    return await this.commentRepository.delete(commentId);
  }

  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return { article };
  }

  buildCommentResponse(comment: CommentEntity): CommentResponseInterface {
    return { comment };
  }

  private getSlug(title: string): string {
    return (
      slugify(title, { lower: true }) +
      '-' +
      ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
    );
  }
}
