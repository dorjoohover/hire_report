import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { Request } from 'express';
import { FileErrorLogService } from 'src/base/error-log.service';
import { AppLogger } from 'src/base/logger';
const logger = new AppLogger();

@Catch(Error)
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly fileLog: FileErrorLogService,
  ) {}

  async catch(exception: Error, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    let message;
    try {
      message = 'Internal server error';
      const request = ctx.getRequest<Request>();
      const clientIp = request.ip || '';
      let status = 500;

      console.log(exception.message);
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        message = exception.message as string;
      } else if (exception instanceof Error) {
        message = exception.message;
      }
      if (message != 'Forbidden resource' && status != 404 && status != 400) {
        await this.fileLog.log({
          ts: new Date().toISOString(),
          status,
          message,
          name: exception.name,
          stack: exception.stack,
          method: (request as any)?.method,
          url: (request as any)?.url,
          ip: (request as any)?.ip ?? '',
          user: (request as any)?.user ?? undefined,
        });
      }
      // await this.errorLogService.logError(
      //   exception,
      //   message,
      //   status,
      //   clientIp,
      //   request,
      // );
      logger.error({
        message: message,
        event: exception.name,
        client: ctx.getRequest()?.user,
        stack: exception.stack,
        url: request.url,
      });
    } catch (error) {
      console.log(error);
    }

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      succeed: false,
      message: exception.message || 'Системийн алдаа',
      statusCode: httpStatus,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
