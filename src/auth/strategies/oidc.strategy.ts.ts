import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { OidcService } from '../oidc.service';

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  constructor(
    private readonly configService: ConfigService,
    private readonly oidcService: OidcService,
  ) {
    super({
      authorizationURL: oidcService.getAuthorizationUrl(
        oidcService.generateState(),
        oidcService.generateNonce(),
      ),
      tokenURL: `${configService.get<string>('oidc.issuer')}/protocol/openid-connect/token`,
      clientID: configService.get<string>('oidc.clientId'),
      clientSecret: configService.get<string>('oidc.clientSecret'),
      callbackURL: configService.get<string>('oidc.redirectUri'),
      scope: configService.get<string>('oidc.scope'),
    });
  }

  async validate(accessToken: string): Promise<any> {
    const userInfo = await this.oidcService.getUserInfo(accessToken);
    return userInfo;
  }
}
