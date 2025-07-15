import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { join } from 'path';

import * as Joi from 'joi';

import { SorteosModule } from './sorteo/sorteo.module';
import { DatabaseModule } from './database/database.module';
import { UtilsModule } from './utils/utils.module';
import config from './config/config';
import { Request } from 'express';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [config],
      validationSchema: Joi.object({
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        GRAPHQL_PLAYGROUND: Joi.number(),
      }),
    }),
    GraphQLModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      driver: ApolloDriver,
      useFactory: (configService: ConfigService) => ({
        playground: Boolean(configService.get('GRAPHQL_PLAYGROUND')),
        autoSchemaFile: join(process.cwd(), 'src/schema.graphql'),
        sortSchema: true,
        watch: true,
        context: ({ req }: { req: Request }) => ({ req }),
        cors: { origin: true, credentials: true },
        persistedQueries: false,
        subscriptions: {
          'graphql-ws': true,
          keepAlive: 10000,
        },
        plugins: [],
      }),
    }),
    DatabaseModule,
    UtilsModule,
    SorteosModule,
  ],
  providers: [],
})
export class AppModule {}
