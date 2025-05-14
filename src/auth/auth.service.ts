import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as qs from 'qs';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { User } from '../common/interfaces/user.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Authenticate a user with Keycloak
   */
  async login(username: string, password: string) {
    try {
      // Exchange credentials for Keycloak token
      const tokenEndpoint = `${this.configService.get<string>('keycloak.url')}/realms/${this.configService.get<string>('keycloak.realm')}/protocol/openid-connect/token`;

      const data = qs.stringify({
        grant_type: 'password',
        client_id: this.configService.get<string>('keycloak.clientId'),
        client_secret: this.configService.get<string>('keycloak.clientSecret'),
        username,
        password,
      });

      const response = await axios.post(tokenEndpoint, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, refresh_token, expires_in } = response.data;

      // Decode the token to get user info
      const decodedToken: any = this.jwtService.decode(access_token);

      // Get or create user in our database
      let user = await this.usersService.findByEmail(decodedToken.email);

      if (!user) {
        user = await this.usersService.create({
          email: decodedToken.email,
          firstName: decodedToken.given_name,
          lastName: decodedToken.family_name,
          roles: decodedToken.realm_access.roles,
          keycloakId: decodedToken.sub,
        });
      }

      // Create our own JWT
      const payload: JwtPayload = {
        sub: user._id.toString(),
        email: user.email,
        roles: user.roles,
      };

      return {
        accessToken: this.jwtService.sign(payload),
        refreshToken: refresh_token,
        expiresIn: expires_in,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
        },
      };
    } catch (error) {
      this.logger.error('Authentication failed', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  /**
   * Refresh an access token using a refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      const tokenEndpoint = `${this.configService.get<string>('keycloak.url')}/realms/${this.configService.get<string>('keycloak.realm')}/protocol/openid-connect/token`;

      const data = qs.stringify({
        grant_type: 'refresh_token',
        client_id: this.configService.get<string>('keycloak.clientId'),
        client_secret: this.configService.get<string>('keycloak.clientSecret'),
        refresh_token: refreshToken,
      });

      const response = await axios.post(tokenEndpoint, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, refresh_token, expires_in } = response.data;

      // Decode the token to get user info
      const decodedToken: any = this.jwtService.decode(access_token);

      // Get user from our database
      const user = await this.usersService.findByEmail(decodedToken.email);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Create our own JWT
      const payload: JwtPayload = {
        sub: user._id.toString(),
        email: user.email,
        roles: user.roles,
      };

      return {
        accessToken: this.jwtService.sign(payload),
        refreshToken: refresh_token,
        expiresIn: expires_in,
      };
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw new UnauthorizedException('Invalid refresh token');
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

    return user;
  }

  /**
   * Logout a user
   */
  async logout(token: string) {
    try {
      const logoutEndpoint = `${this.configService.get<string>('keycloak.url')}/realms/${this.configService.get<string>('keycloak.realm')}/protocol/openid-connect/logout`;

      await axios.post(
        logoutEndpoint,
        qs.stringify({
          client_id: this.configService.get<string>('keycloak.clientId'),
          client_secret: this.configService.get<string>(
            'keycloak.clientSecret',
          ),
          refresh_token: token,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return { message: 'Logout successful' };
    } catch (error) {
      this.logger.error('Logout failed', error);
      return { message: 'Logout successful' }; // Return success anyway to client
    }
  }
}
