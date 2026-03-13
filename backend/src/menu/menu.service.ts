import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

export interface RotinaDto {
  rotCod: number;
  rotNom: string;
  rotLin: string;
  rotImgFav: string | null;
  rotOrd: number | null;
}

export interface SubMenuDto {
  subMenCod: number;
  subMenNom: string;
  subMenOrd: number | null;
  rotinas: RotinaDto[];
}

export interface MenuDto {
  menCod: number;
  menNom: string;
  menOrd: number | null;
  subMenus: SubMenuDto[];
}

export interface SideMenuItemDto {
  key: string;
  label: string;
  link: string;
  icon: string | null;
  order: number;
  fixed?: boolean;
}

// Keep backward-compat alias
export type MenuItemDto = MenuDto;

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async getSideMenu(payload: JwtPayload): Promise<SideMenuItemDto[]> {
    const empCod = payload.empCod ?? payload.activeCompanyId;
    const pesCod = payload.sub;

    const baseItems: SideMenuItemDto[] = [
      {
        key: 'dashboard',
        label: 'Dashboard',
        link: '/dashboard',
        icon: 'house',
        order: -1,
        fixed: true,
      },
    ];

    if (!empCod || !pesCod) {
      return baseItems;
    }

    const favoritos = await this.prisma.pessoaFavoritos.findMany({
      where: { EmpCod: empCod, PesCod: pesCod },
      orderBy: [{ FavOrd: 'asc' }, { FavRotAutNom: 'asc' }],
      select: { FavRotAutCod: true, FavRotAutNom: true, FavOrd: true },
    });

    if (favoritos.length === 0) {
      return baseItems;
    }

    const rotAutCodes = favoritos.map((f) => f.FavRotAutCod);
    const rotinas = await this.prisma.rotina.findMany({
      where: {
        EmpCod: empCod,
        RotAutCod: { in: rotAutCodes },
      },
      select: { RotAutCod: true, RotImgFav: true, RotLin: true, RotNom: true },
    });

    const rotinaMap = new Map(rotinas.map((r) => [r.RotAutCod ?? '', r]));

    const favItems: SideMenuItemDto[] = favoritos.map((fav, idx) => {
      const rotina = rotinaMap.get(fav.FavRotAutCod);
      const label = fav.FavRotAutNom?.trim() || rotina?.RotNom || fav.FavRotAutCod;
      const linkRaw = rotina?.RotLin?.trim() || '';
      const link = linkRaw.startsWith('/') ? linkRaw : `/${linkRaw}`;
      const icon = rotina?.RotImgFav?.trim() || null;

      return {
        key: `fav-${fav.FavRotAutCod}`,
        label,
        link: linkRaw ? link : '/dashboard',
        icon,
        order: fav.FavOrd ?? idx,
      };
    });

    return [...baseItems, ...favItems];
  }

  async getMenuForModule(payload: JwtPayload, _moduleId: string): Promise<MenuDto[]> {
    const empCod = payload.empCod ?? payload.activeCompanyId;
    if (!empCod) {
      console.warn('[MenuService] empCod ausente no payload', {
        sub: payload.sub,
        activeCompanyId: payload.activeCompanyId,
        empCod: payload.empCod,
      });
      return [];
    }

    // Suporte users have full admin access (GrupoAutorizacao.AutIsAdm = true)
    // Load all menus/submenus/rotinas for this company where RotLin is filled
    const [menus, subMenus, rotinas] = await Promise.all([
      this.prisma.menu.findMany({
        where: { EmpCod: empCod },
        orderBy: { MenOrd: 'asc' },
        select: { MenCod: true, MenNom: true, MenOrd: true },
      }),
      this.prisma.menuSubMenu.findMany({
        where: { EmpCod: empCod },
        orderBy: { SubMenOrd: 'asc' },
        select: { MenCod: true, SubMenCod: true, SubMenNom: true, SubMenOrd: true },
      }),
      this.prisma.rotina.findMany({
        where: {
          EmpCod: empCod,
          RotLin: { not: '' },
        },
        orderBy: { RotOrd: 'asc' },
        select: { RotCod: true, RotNom: true, MenCod: true, SubMenCod: true, RotLin: true, RotImgFav: true, RotOrd: true },
      }),
    ]);

    console.log('[MenuService] dados base carregados', {
      empCod,
      menus: menus.length,
      subMenus: subMenus.length,
      rotinasComRotLin: rotinas.length,
    });

    const result: MenuDto[] = menus
      .map((menu) => {
        const subs: SubMenuDto[] = subMenus
          .filter((s) => s.MenCod === menu.MenCod)
          .map((sub) => {
            const rots: RotinaDto[] = rotinas
              .filter((r) => r.MenCod === menu.MenCod && r.SubMenCod === sub.SubMenCod)
              .map((r) => ({
                rotCod: r.RotCod,
                rotNom: r.RotNom,
                rotLin: r.RotLin,
                rotImgFav: r.RotImgFav ?? null,
                rotOrd: r.RotOrd ?? null,
              }));
            return { subMenCod: sub.SubMenCod, subMenNom: sub.SubMenNom, subMenOrd: sub.SubMenOrd ?? null, rotinas: rots };
          })
          .filter((s) => s.rotinas.length > 0);

        return { menCod: menu.MenCod, menNom: menu.MenNom, menOrd: menu.MenOrd ?? null, subMenus: subs };
      })
      .filter((m) => m.subMenus.length > 0);

    console.log('[MenuService] menu final montado', {
      empCod,
      menus: result.length,
      subMenus: result.reduce((acc, m) => acc + m.subMenus.length, 0),
      rotinas: result.reduce((acc, m) => acc + m.subMenus.reduce((sAcc, s) => sAcc + s.rotinas.length, 0), 0),
    });

    return result;
  }
}
