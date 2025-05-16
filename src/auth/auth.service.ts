import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenSet } from 'openid-client';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { OidcService } from './oidc.service';
import { UserInterface } from 'src/common/interfaces/user.interface';

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
        tokenSet.access_token!,
      );

      // Get or create user in our database
      const userData = {
        email: userInfo.email,
        firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || '',
        lastName:
          userInfo.family_name ||
          userInfo.name?.split(' ').slice(1).join(' ') ||
          '',
        roles: userInfo.realm_access?.roles || ['user'],
        keycloakId: userInfo.sub,
      };

      const user = await this.usersService.createOrUpdateUser(userData);

      // Create our own JWT for API access
      const payload: JwtPayload = {
        sub: user._id as string,
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
      this.logger.error('Authentication callback failed', error.stack);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Get logout URL
   */
  getLogoutUrl(idToken: string): string {
    return this.oidcService.getEndSessionUrl(idToken);
  }

  /**
   * Get user profile
   */
  getUserProfile(user: any) {
    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
    };
  }
}
