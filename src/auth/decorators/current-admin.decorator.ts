import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedAdmin {
  id: number;
  username: string;
}

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedAdmin => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedAdmin }>();
    return request.user;
  },
);
