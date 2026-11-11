import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from './auth.constants';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { AuthenticatedUser, RefreshTokenPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException('Unable to register with these credentials');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await argon2.hash(dto.password),
      },
    });

    return this.createSession({ id: user.id, email: user.email });
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    const isValidPassword = user ? await argon2.verify(user.passwordHash, dto.password) : false;

    if (!user || !isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createSession({ id: user.id, email: user.email });
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });

    const isValidSession =
      session &&
      session.userId === payload.sub &&
      !session.revokedAt &&
      session.expiresAt > new Date() &&
      (await argon2.verify(session.refreshTokenHash, refreshToken));

    if (!isValidSession) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    const tokens = await this.issueTokens(session.user.id, session.id);
    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { refreshTokenHash: await argon2.hash(tokens.refreshToken) },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: session.user.id, email: session.user.email },
    };
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;

    try {
      const payload = await this.jwt.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
      if (payload.type === 'refresh') {
        await this.prisma.authSession.updateMany({
          where: { id: payload.sid, userId: payload.sub, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    } catch {
      // Logout is intentionally idempotent when the cookie is already invalid or expired.
    }
  }

  async getUserById(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User no longer exists');
    return { id: user.id, email: user.email };
  }

  private async createSession(user: AuthenticatedUser) {
    const sessionId = randomUUID();
    const tokens = await this.issueTokens(user.id, sessionId);

    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: await argon2.hash(tokens.refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    });

    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user };
  }

  private async issueTokens(userId: string, sessionId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, sid: sessionId, type: 'access' },
        { secret: this.accessSecret, expiresIn: ACCESS_TOKEN_TTL_SECONDS },
      ),
      this.jwt.signAsync(
        { sub: userId, sid: sessionId, type: 'refresh' },
        { secret: this.refreshSecret, expiresIn: REFRESH_TOKEN_TTL_SECONDS },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private get accessSecret() {
    return process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? 'development-access-secret';
  }

  private get refreshSecret() {
    return process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'development-refresh-secret';
  }
}
