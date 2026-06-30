import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: ('ADMIN' | 'USER')[]) => SetMetadata('roles', roles);
