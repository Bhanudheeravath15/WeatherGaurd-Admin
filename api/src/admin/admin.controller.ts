import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  async getUsers(@Query('status') status?: string) {
    return this.adminService.getAllUsers(status);
  }

  @Patch('users/:id/approve')
  async approveUser(@Param('id') id: string) {
    return this.adminService.approveUser(id);
  }

  @Patch('users/:id/reject')
  async rejectUser(@Param('id') id: string) {
    return this.adminService.rejectUser(id);
  }

  @Get('metrics')
  async getMetrics() {
    return this.adminService.getDashboardMetrics();
  }
}
