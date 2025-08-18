import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'string') {
        message = errorResponse;
        error = exception.name;
      } else {
        message = (errorResponse as any).message || exception.message;
        error = (errorResponse as any).error || exception.name;
      }
    } else if (exception instanceof Error) {
      // 예상치 못한 에러
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '서버 내부 오류가 발생했습니다';
      error = 'Internal Server Error';

      // 개발 환경에서는 실제 에러 메시지 노출
      if (process.env.NODE_ENV === 'development') {
        message = exception.message;
      }
    } else {
      // 알 수 없는 에러
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '알 수 없는 오류가 발생했습니다';
      error = 'Unknown Error';
    }

    // 에러 로깅
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : exception,
    );

    // 표준화된 에러 응답
    response.status(status).json({
      success: false,
      error: {
        code: status,
        message,
        type: error,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
