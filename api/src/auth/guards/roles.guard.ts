import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<('ADMIN' | 'USER')[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified on the handler/controller, allow access
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request['user'];

    if (!user) {
      throw new ForbiddenException('User session details missing');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('Access denied: Insufficient privileges');
    }

    return true;
  }
}
