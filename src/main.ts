import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';
import { LoggerConfig } from './logger/logger.service';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: LoggerConfig,
  });

  app.use(CorrelationIdMiddleware);
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Banco API')
    .setDescription('API para sistema bancário')
    .setVersion('1.0')
    .addBearerAuth()
    .addBasicAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
