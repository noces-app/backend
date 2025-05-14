import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import { UsersService } from '../users/users.service';
import { Request } from 'express';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  private readonly logger = new Logger(KeycloakStrategy.name);
  private publicKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super();
    // Prepare the public key for token verification
    this.publicKey = this.configService.get<string>('keycloak.publicKey');
    if (!this.publicKey.startsWith('-----BEGIN PUBLIC KEY-----')) {
      this.publicKey = `-----BEGIN PUBLIC KEY-----\n${this.publicKey}\n-----END PUBLIC KEY-----`;
    }
  }

  async validate(request: Request): Promise<any> {
    try {
      // Extract token from request header
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Missing token');
      }

      const token = authHeader.split(' ')[1];

      // Verify token using Keycloak's public key
      const decodedToken: any = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        audience: this.configService.get<string>('keycloak.clientId'),
        issuer: `${this.configService.get<string>('keycloak.url')}/realms/${this.configService.get<string>('keycloak.realm')}`,
      });

      // Check if token is active by calling Keycloak introspection endpoint
      await this.validateTokenWithKeycloak(token);

      // Get or create user in our database
      let user = await this.usersService.findByKeycloakId(decodedToken.sub);

      if (!user) {
        // Try to find by email
        user = await this.usersService.findByEmail(decodedToken.email);

        // If still not found, create the user
        if (!user) {
          user = await this.usersService.create({
            email: decodedToken.email,
            firstName: decodedToken.given_name,
            lastName: decodedToken.family_name,
            roles: decodedToken.realm_access.roles,
            keycloakId: decodedToken.sub,
          });
        } else {
          // Update the keycloak ID if it's missing
          if (!user.keycloakId) {
            user = await this.usersService.update(user._id.toString(), {
              keycloakId: decodedToken.sub,
            });
          }
        }
      }

      return user;
    } catch (error) {
      this.logger.error('Token validation failed', error?.message || error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Validate the token with Keycloak's introspection endpoint
   */
  private async validateTokenWithKeycloak(token: string): Promise<void> {
    try {
      const introspectionEndpoint = `${this.configService.get<string>('keycloak.url')}/realms/${this.configService.get<string>('keycloak.realm')}/protocol/openid-connect/token/introspect`;

      const response = await axios.post(
        introspectionEndpoint,
        new URLSearchParams({
          token,
          client_id: this.configService.get<string>('keycloak.clientId'),
          client_secret: this.configService.get<string>(
            'keycloak.clientSecret',
          ),
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (!response.data.active) {
        throw new UnauthorizedException('Token is inactive');
      }
    } catch (error) {
      this.logger.error('Token introspection failed', error?.message || error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
