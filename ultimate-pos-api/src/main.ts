import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression');
import { AppModule } from './app.module';

// BigInt values (used by AssetMaintenance.id) cannot be serialized by JSON.stringify
// by default. Patch the prototype once at startup so NestJS responses work correctly.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // Gzip compress all responses — reduces JSON payload size ~60-80%
  app.use(compression());

  // Enable CORS — allow direct Angular dev server + Nginx proxied origins
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:4200',
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'https://localhost:8443',
    'https://ultimatepos.local:8443',
    'http://ultimatepos.local:8080',
  ];
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger / OpenAPI docs
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Ultimate POS API')
      .setDescription('REST API for Ultimate POS — NestJS + Prisma')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    // GET /api/docs-json — returns the raw OpenAPI spec for Postman import
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/api/docs-json', (_req: any, res: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(document);
    });

    console.log(`📖 Swagger docs: http://localhost:${process.env.PORT || 3000}/api/docs`);
    console.log(`📄 OpenAPI spec: http://localhost:${process.env.PORT || 3000}/api/docs-json`);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
}
bootstrap();
