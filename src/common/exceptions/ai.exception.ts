import { HttpException, HttpStatus } from '@nestjs/common';

export class AIProviderException extends HttpException {
  constructor(provider: string, message: string) {
    super(
      {
        message: `AI 제공자 오류 (${provider}): ${message}`,
        error: 'AI_PROVIDER_ERROR',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class InvalidPromptException extends HttpException {
  constructor(reason: string) {
    super(
      {
        message: `유효하지 않은 요청입니다: ${reason}`,
        error: 'INVALID_PROMPT',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class AIQuotaExceededException extends HttpException {
  constructor(provider: string) {
    super(
      {
        message: `AI 사용량 한도를 초과했습니다 (${provider})`,
        error: 'AI_QUOTA_EXCEEDED',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
