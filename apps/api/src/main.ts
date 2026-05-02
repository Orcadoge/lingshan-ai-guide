import { NestFactory } from '@nestjs/core';

import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { RequestContextInterceptor } from './common/interceptors/request-context.interceptor';
import { AppModule } from './app.module';
import { registerRealtimeVoiceGateway } from './modules/voice/realtime-voice-gateway';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new RequestContextInterceptor());
  registerRealtimeVoiceGateway(app.getHttpServer());
  await app.listen(Number(process.env.API_PORT ?? 3001));
}

bootstrap();
