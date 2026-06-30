import { Controller, Post, UseGuards } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('scheduler')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SchedulerController {
  constructor(private schedulerService: SchedulerService) {}

  @Post('trigger-alerts')
  async triggerAlertsManual() {
    const report = await this.schedulerService.dispatchAlertsToAllUsers();
    return {
      message: 'Weather alert sync completed successfully.',
      report,
    };
  }
}
