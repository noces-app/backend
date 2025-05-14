import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // No roles requirement
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      throw new ForbiddenException('User has no roles');
    }

    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some((role) =>
      user.roles.includes(role),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `User does not have the required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
