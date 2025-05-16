import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  Query,
  UnauthorizedException,
  Session,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserDecorator } from '../common/decorators/user.decorator';
import { UserInterface } from 'src/common/interfaces/user.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('login')
  @ApiOperation({ summary: 'Start OIDC login flow' })
  @ApiResponse({ status: 302, description: 'Redirect to OIDC provider' })
  login(@Session() session: Record<string, any>, @Res() res: Response) {
    const { url, state, nonce } = this.authService.getLoginUrl(session.id);

    // Store state and nonce in session for verification during callback
    session.oidc = { state, nonce };

    // Redirect to Identity Provider login page
    return res.redirect(url);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle OIDC callback' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with token' })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Session()
    session: {
      id: string;
      oidc?: { state: string; nonce: string };
      jwt?: string;
    },
    @Res() res: Response,
  ) {
    try {
      if (!session.oidc) {
        throw new UnauthorizedException('Invalid session');
      }

      const { state: savedState, nonce } = session.oidc;

      const result = await this.authService.handleCallback(
        code,
        state,
        savedState,
        nonce,
      );

      // Clear OIDC data from session
      delete session.oidc;

      // Store the access token in session
      session.jwt = result.accessToken;

      // Redirect to frontend with success flag
      const clientUrl = this.configService.get<string>('clientUrl');
      return res.redirect(`${clientUrl}/auth/callback?success=true`);
    } catch (error) {
      const clientUrl = this.configService.get<string>('clientUrl');
      return res.redirect(
        `${clientUrl}/auth/callback?success=false&error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  @Get('logout')
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 302, description: 'Redirect to OIDC provider logout' })
  logout(@Session() session: any, @Res() res: Response) {
    // Clear session
    session.destroy();

    // Redirect to frontend
    const clientUrl = this.configService.get<string>('clientUrl');
    return res.redirect(clientUrl || '/');
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@UserDecorator() user: UserInterface) {
    return this.authService.getUserProfile(user);
  }

  @Get('session')
  @ApiOperation({ summary: 'Get session info' })
  @ApiResponse({ status: 200, description: 'Session info' })
  async getSession(@Session() session: any, @Req() req: Request) {
    return {
      isAuthenticated: !!session.jwt,
      sessionId: session.id,
    };
  }
}
