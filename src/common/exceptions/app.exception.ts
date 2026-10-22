import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  public readonly code: string;
  public readonly details: unknown[];

  constructor(
    code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details: unknown[] = [],
  ) {
    super({ success: false, error: { code, message, details } }, status);
    this.code = code;
    this.details = details;
  }
}

export class NotFoundException extends AppException {
  constructor(code: string, message: string, details: unknown[] = []) {
    super(code, message, HttpStatus.NOT_FOUND, details);
  }
}

export class ConflictException extends AppException {
  constructor(code: string, message: string, details: unknown[] = []) {
    super(code, message, HttpStatus.CONFLICT, details);
  }
}

export class BusinessRuleException extends AppException {
  constructor(code: string, message: string, details: unknown[] = []) {
    super(code, message, HttpStatus.UNPROCESSABLE_ENTITY, details);
  }
}

export class UnauthorizedException extends AppException {
  constructor(code: string, message: string, details: unknown[] = []) {
    super(code, message, HttpStatus.UNAUTHORIZED, details);
  }
}

export class ForbiddenException extends AppException {
  constructor(code: string, message: string, details: unknown[] = []) {
    super(code, message, HttpStatus.FORBIDDEN, details);
  }
}
