## Description

Это бэкенд-часть приложения Realworld, созданного на фреймворке NestJS. Это RESTful API, который взаимодействует с базой данных и предоставляет ряд эндпоинтов для работы с пользовательскими профилями, статьями, комментариями, тэгами и т.д. Все запросы к API защищены авторизацией через JWT-токены.

Приложение использует TypeScript для типизации данных и PostgreSQL в качестве базы данных. В коде реализована работа с базой данных через TypeORM, а также ряд middleware для проверки авторизации и обработки ошибок. Также в проекте есть файл конфигурации, в котором указаны настройки для базы данных и JWT-токенов.

Все API эндпоинты написаны с использованием декораторов NestJS, что облегчает создание и настройку API. В коде также присутствуют модели данных, интерфейсы и DTO-объекты для обработки и передачи данных.
В дальнейшем проект будет развиваться для сайта Aperture Gallery для возможности делиться игровыми скриншотами, комментировать и оценивать их, а также хранить скриншоты в своем профиле.

https://github.com/gothinkster/realworld

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# watch mode
$ yarn start

# production mode
$ yarn start:prod
```

## Work with DataBase 

```bash
# drop all tables 
$ yarn db:drop

# create migration
$ yarn db:create

# applying migrations
$ yarn db:migrate

# load seeds
$ yarn db:seed
```
