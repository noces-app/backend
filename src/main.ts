import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as session from 'express-session';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS for the frontend
  app.enableCors({
    origin: configService.get<string>('clientUrl'),
    credentials: true,
  });

  // Setup cookie parser
  app.use(cookieParser());

  // Setup session
  app.use(
    session({
      secret: configService.get<string>('session.secret'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: configService.get<number>('session.cookieMaxAge'),
        sameSite: 'lax',
        secure: configService.get<string>('nodeEnv') === 'production',
      },
      name: configService.get<string>('session.cookieName'),
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Noces API')
    .setDescription('The Noces.app API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/docs', app, document);

  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
