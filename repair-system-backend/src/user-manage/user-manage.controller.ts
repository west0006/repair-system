import {
  Controller,
  Get,
  Query,
  Put,
  Body,
  Param,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { UserManageService } from './user-manage.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard)
@Roles(Role.Admin)
export class UserManageController {
  constructor(private readonly userManageService: UserManageService) {}

  @Get()
  async findAll(@Query() query: UserQueryDto) {
    const [users, total] = await this.userManageService.findAll(query);
    return { code: 200, data: users, total };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.userManageService.update(+id, dto);
    return { code: 200, data: user };
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请上传 Excel 文件');
    const result = await this.userManageService.importFromExcel(file.buffer);
    return { code: 200, data: result };
  }
}
