import { HttpException, HttpStatus } from '@nestjs/common';

export class UserAlreadyExistsException extends HttpException {
  constructor(email: string) {
    super(
      {
        message: `이미 존재하는 이메일입니다: ${email}`,
        error: 'USER_ALREADY_EXISTS',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor() {
    super(
      {
        message: '이메일 또는 비밀번호가 올바르지 않습니다',
        error: 'INVALID_CREDENTIALS',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class UserNotFoundException extends HttpException {
  constructor(userId: number) {
    super(
      {
        message: `사용자를 찾을 수 없습니다: ${userId}`,
        error: 'USER_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
