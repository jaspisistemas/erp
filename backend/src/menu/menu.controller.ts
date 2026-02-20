import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { MenuService, MenuItemDto } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private menu: MenuService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMenu(
    @Query('moduleId') moduleId: string,
    @Req() req: Request & { user: JwtPayload },
  ): Promise<MenuItemDto[]> {
    const modId = req.user.activeModuleId ?? moduleId ?? '';
    return this.menu.getMenuForModule(req.user, modId);
  }
}
