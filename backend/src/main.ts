import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Enable CORS for localhost and Railway production
    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://unflapping-marcelle-particularistically.ngrok-free.dev/',
        'https://unflapping-marcelle-particularistically.ngrok-free.dev',
        'https://urban-app-managments-production.up.railway.app',
        /^https:\/\/.*\.railway\.app$/,
        /^https:\/\/.*\.ngrok\.(io|app)$/,
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Global error handler to prevent crashes
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(`❌ [UNHANDLED REJECTION] Unhandled Rejection at: ${promise}, reason: ${reason}`);
      // Don't exit, just log
    });

    process.on('uncaughtException', (error) => {
      logger.error(`❌ [UNCAUGHT EXCEPTION] Uncaught Exception: ${error.message}`, error.stack);
      // Don't exit, just log for now (in production, you might want to restart)
    });

    // IMPORTANT: Railway provides PORT, fallback to 3000 for local
    const port = process.env.PORT || 3000;

    // IMPORTANT: listen on 0.0.0.0 for Railway (allows external connections)
    await app.listen(port, '0.0.0.0');

    logger.log(`✅ [BOOTSTRAP] Backend running on port ${port}`);
    logger.log(`✅ [BOOTSTRAP] Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`✅ [BOOTSTRAP] Health check: http://0.0.0.0:${port}/health`);
  } catch (error) {
    logger.error(`❌ [BOOTSTRAP] Failed to start application: ${error.message}`, error.stack);
    process.exit(1);
  }
}

bootstrap();
