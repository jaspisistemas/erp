import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

export interface MenuItemDto {
  caption: string;
  link: string;
  iconClass: string | null;
  subItems?: MenuItemDto[];
}

@Injectable()
export class MenuService {
  async getMenuForModule(_payload: JwtPayload, moduleId: string): Promise<MenuItemDto[]> {
    const items: MenuItemDto[] = [
      { caption: 'Home', link: '/dashboard', iconClass: 'menu-icon fa fa-home' },
    ];
    if (moduleId) {
      items.push({
        caption: 'Módulo',
        link: `/dashboard`,
        iconClass: null,
      });
    }
    return items;
  }
}
