import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Issuer, Client, TokenSet, generators } from 'openid-client';

@Injectable()
export class OidcService implements OnModuleInit {
  private client: Client;
  private readonly logger = new Logger(OidcService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      // Initialize OpenID Client
      const issuerUrl = this.configService.get<string>('oidc.issuer');
      const issuer = await Issuer.discover(issuerUrl!);

      this.logger.log(`Discovered issuer ${issuer.metadata.issuer}`);

      this.client = new issuer.Client({
        client_id: this.configService.get<string>('oidc.clientId')!,
        client_secret: this.configService.get<string>('oidc.clientSecret'),
        redirect_uris: [this.configService.get<string>('oidc.redirectUri')!],
        post_logout_redirect_uris: [
          this.configService.get<string>('oidc.postLogoutRedirectUri')!,
        ],
        response_types: ['code'],
      });
    } catch (error) {
      this.logger.error('Failed to initialize OIDC client', error);
      throw error;
    }
  }

  /**
   * Generate authorization URL for login
   */
  getAuthorizationUrl(state: string, nonce: string): string {
    return this.client.authorizationUrl({
      scope: this.configService.get<string>('oidc.scope'),
      state,
      nonce,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async handleCallback(
    code: string,
    state: string,
    savedState: string,
    nonce: string,
  ): Promise<TokenSet> {
    if (state !== savedState) {
      throw new Error('State mismatch');
    }

    return this.client.callback(
      this.configService.get<string>('oidc.redirectUri'),
      { code, state },
      { nonce },
    );
  }

  /**
   * Get user info using access token
   */
  async getUserInfo(accessToken: string): Promise<any> {
    return this.client.userinfo(accessToken);
  }

  /**
   * Get end session URL for logout
   */
  getEndSessionUrl(idToken: string): string {
    return this.client.endSessionUrl({
      id_token_hint: idToken,
      post_logout_redirect_uri: this.configService.get<string>(
        'oidc.postLogoutRedirectUri',
      ),
    });
  }

  /**
   * Generate state for CSRF protection
   */
  generateState(): string {
    return generators.state();
  }

  /**
   * Generate nonce for replay protection
   */
  generateNonce(): string {
    return generators.nonce();
  }
}
