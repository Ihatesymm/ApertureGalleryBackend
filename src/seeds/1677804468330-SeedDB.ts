import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDB1677804468330 implements MigrationInterface {
  name = 'SeedDB1677804468330';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO tags (name) VALUES ('dragons'), ('coffe'), ('cat'), ('white')`,
    );

    //password 123
    await queryRunner.query(
      `INSERT INTO users (username, email, password) VALUES ('ihatesymm', 'realworld@gmail.com', '$2b$10$gVswRjj9vwnnq0x/WLGdxevX7poo.aIIN20WWpqoNumCbuYi.cDWu')`,
    );

    //password 123
    await queryRunner.query(
      `INSERT INTO users (username, email, password) VALUES ('NewUsername', 'NewEmail@gmail.com', '$2b$10$uUse3ma57hLM3Mtzkdj2w.4XyyzPbCDysjObcW0kRXB9hhVuOoN.y')`,
    );

    await queryRunner.query(
      `INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('i-love-my-cat-yuj6ti', 'I love my cat!', 'description about my cat', 'body in article', 'cat,white', 1)`,
    );

    await queryRunner.query(
      `INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('i-love-my-cat-again-qws1ti', 'I love my cat again!', 'second description about my cat', 'new body', 'cat,white', 1)`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(): Promise<void> {}
}
