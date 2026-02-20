import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

export interface ModuloDto {
  modCod: string;
  modNom: string | null;
  modIconClass: string | null;
  modLin: string | null;
  modCaption: string | null;
  modOrd: number | null;
}

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  async getModulesForUser(_payload: JwtPayload): Promise<ModuloDto[]> {
    const modulos = await this.prisma.modulo.findMany({
      orderBy: { ModOrd: 'asc' },
    });
    return modulos.map((m) => ({
      modCod: m.ModCod,
      modNom: m.ModNom,
      modIconClass: null,
      modLin: m.ModLin,
      modCaption: m.ModCaption,
      modOrd: m.ModOrd,
    }));
  }
}
