import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthenticatedUser, AccessTokenPayload } from './auth.types';
import { AuthService } from './auth.service';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);
    if (!token) throw new UnauthorizedException('Access token is missing');

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret:
          process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? 'development-access-secret',
      });
      if (payload.type !== 'access') throw new UnauthorizedException('Invalid access token');
      request.user = await this.authService.getUserById(payload.sub);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private extractBearerToken(request: Request) {
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    return scheme === 'Bearer' ? token : undefined;
  }
}

export const getAuthenticatedUser = (request: Request) => {
  const user = (request as AuthenticatedRequest).user;
  if (!user) throw new UnauthorizedException('User is not authenticated');
  return user;
};
