import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: { id: number; role: number };
}

@Controller('notification')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get('list')
  async getMyNotifications(@Request() req: RequestWithUser) {
    const list = await this.notificationService.findByUserId(req.user.id);
    return { code: 200, data: list };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: RequestWithUser) {
    await this.notificationService.markAsRead(+id, req.user.id);
    return { code: 200 };
  }
}
