import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenSet } from 'openid-client';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { User } from '../common/interfaces/user.interface';
import { OidcService } from './oidc.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly oidcService: OidcService,
  ) {}

  /**
   * Get login URL for client redirect
   */
  getLoginUrl(sessionId: string): {
    url: string;
    state: string;
    nonce: string;
  } {
    const state = this.oidcService.generateState();
    const nonce = this.oidcService.generateNonce();
    const url = this.oidcService.getAuthorizationUrl(state, nonce);

    return { url, state, nonce };
  }

  /**
   * Handle OIDC callback
   */
  async handleCallback(
    code: string,
    state: string,
    savedState: string,
    nonce: string,
  ): Promise<{ accessToken: string; user: any }> {
    try {
      // Exchange code for tokens
      const tokenSet = await this.oidcService.handleCallback(
        code,
        state,
        savedState,
        nonce,
      );

      // Get user info
      const userInfo = await this.oidcService.getUserInfo(
        tokenSet.access_token || '',
      );

      // Get or create user in our database
      let user = await this.usersService.findByEmail(userInfo.email);

      if (!user) {
        user = await this.usersService.create({
          email: userInfo.email,
          firstName: userInfo.given_name,
          lastName: userInfo.family_name,
          roles: userInfo.realm_access?.roles || ['user'],
          keycloakId: userInfo.sub,
        });
      }

      // Create our own JWT for API access
      const payload: JwtPayload = {
        sub: (user._id as string).toString(),
        email: user.email,
        roles: user.roles,
      };

      return {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
        },
      };
    } catch (error) {
      this.logger.error('Authentication callback failed', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Validate a user from a JWT payload
   */
  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      keycloakId: user.keycloakId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
  }

  /**
   * Get logout URL
   */
  getLogoutUrl(idToken: string): string {
    return this.oidcService.getEndSessionUrl(idToken);
  }
}
