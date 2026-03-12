import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { v4 as uuid } from 'uuid';
// import { TipoPerfil } from '@seja/shared';
import { PrismaService } from '../prisma/prisma.service';
// import { ModulesService } from '../modules/modules.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

interface UsuarioRow {
  UserGuid: string;
  UserNam: string;
  UserSen: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    // private modules: ModulesService,
  ) {}

  private accessToken(payload: JwtPayload) {
    return this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
      expiresIn: process.env.JWT_ACCESS_TTL || '8h' as any,
    });
  }

  private hashUserPassword(userGuid: string, password: string): string {
    return createHash('sha512').update(userGuid + password, 'utf8').digest('base64');
  }

  /** Busca usuário em Usuario por UserNam (case-insensitive) e valida hash no padrão UserGuid+senha. */
  private async validateUserFromUsuario(username: string, password: string): Promise<{ userGuid: string; userName: string }> {
    const rows = await this.prisma.$queryRaw<
      UsuarioRow[]
    >`SELECT CONVERT(NVARCHAR(36), [UserGuid]) AS [UserGuid], [UserNam], [UserSen] FROM [Usuario] WHERE LOWER([UserNam]) = LOWER(${username})`;

    if (!rows?.length) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    for (const row of rows) {
      const userGuid = (row.UserGuid ?? '').trim();
      const userName = (row.UserNam ?? username).trim();
      const storedPwd = (row.UserSen ?? '').trim();
      const inputHash = this.hashUserPassword(userGuid, password);
      if (inputHash === storedPwd) {
        return { userGuid, userName };
      }
    }

    throw new UnauthorizedException('Usuário ou senha inválidos');
  }

  private refreshSecret() {
    return process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
  }

  private issueRefreshTokenGam(userGuid: string, empCod: number) {
    const refreshTtlSec = parseInt(process.env.JWT_REFRESH_TTL || '86400', 10);
    return this.jwt.sign(
      { userGuid, empCod, type: 'gam_refresh' },
      {
        secret: this.refreshSecret(),
        expiresIn: refreshTtlSec,
      },
    );
  }

  private async validateRefreshToken(refreshToken: string): Promise<{
    empCod: number;
    pesCod: number;
    userGuid?: string;
  }> {
    try {
      const payload = this.jwt.verify(refreshToken, { secret: this.refreshSecret() }) as {
        userGuid?: string;
        empCod?: number;
        type?: string;
      };
      if (payload?.type === 'gam_refresh' && payload.userGuid != null && payload.empCod != null) {
        return {
          empCod: payload.empCod,
          pesCod: 0,
          userGuid: payload.userGuid,
        };
      }
    } catch {
      // não é JWT de refresh GAM
    }
    throw new UnauthorizedException('Sessão inválida ou expirada. Faça login novamente.');
  }

  async login(identifier: { user: string }, password: string) {
    const { userGuid, userName } = await this.validateUserFromUsuario(identifier.user, password);
    const sessionId = uuid();
    const empCod = 1;

    const payload: JwtPayload = {
      sub: 0,
      email: '',
      empCod,
      activeCompanyId: empCod,
      sessionId,
      // prfTip: TipoPerfil.USUARIO_SISTEMA,
      prfGamId: userGuid,
    };

    const accessToken = this.accessToken(payload);
    const refreshToken = this.issueRefreshTokenGam(userGuid, empCod);

    return {
      accessToken,
      refreshToken,
      user: {
        pesCod: 0,
        empCod,
        name: userName,
        email: null,
        // prfTip: TipoPerfil.USUARIO_SISTEMA,
      },
    };
  }

  async refresh(refreshToken: string, activeModuleId?: string) {
    const stored = await this.validateRefreshToken(refreshToken);

    const sessionId = uuid();
    const payload: JwtPayload = {
      sub: 0,
      email: '',
      empCod: stored.empCod,
      activeCompanyId: stored.empCod,
      sessionId,
      // prfTip: TipoPerfil.USUARIO_SISTEMA,
      prfGamId: stored.userGuid,
      activeModuleId: activeModuleId,
    };

    const accessToken = this.accessToken(payload);
    const newRefresh = this.issueRefreshTokenGam(stored.userGuid ?? '', stored.empCod);

    return { accessToken, refreshToken: newRefresh };
  }

  async selectModule(user: JwtPayload, moduleId: string) {
    if (!moduleId) {
      return this.issueNewTokens(user, undefined, undefined);
    }
    // const modulos = await this.modules.getModulesForUser(user);
    // const hasAccess = modulos.some((m) => m.modCod === moduleId);
    // if (!hasAccess) {
    //   throw new UnauthorizedException('Módulo não disponível para este usuário');
    // }
    return this.issueNewTokens(user, moduleId, undefined);
  }

  async getEmpresasComAcesso(user: JwtPayload): Promise<Array<{ empCod: number; empRaz: string | null }>> {
    const empresas = await this.prisma.empresa.findMany({
      where: user.empCod ? { EmpCod: user.empCod } : undefined,
      orderBy: { EmpCod: 'asc' },
      select: { EmpCod: true, EmpRaz: true },
    });
    if (empresas.length === 0 && user.empCod) {
      return [{ empCod: user.empCod, empRaz: 'Empresa' }];
    }
    return empresas.map((e) => ({ empCod: e.EmpCod, empRaz: e.EmpRaz }));
  }

  async selectCompany(user: JwtPayload, empCod: number) {
    const empresas = await this.getEmpresasComAcesso(user);
    const hasAccess = empresas.some((e) => e.empCod === empCod);
    if (!hasAccess) {
      throw new UnauthorizedException('Empresa não disponível para este usuário');
    }
    return this.issueNewTokens(user, undefined, empCod);
  }

  private async issueNewTokens(user: JwtPayload, activeModuleId?: string, activeCompanyId?: number) {
    const sessionId = uuid();
    const newEmpCod = activeCompanyId ?? user.activeCompanyId ?? user.empCod ?? 1;

    const payload: JwtPayload = {
      ...user,
      empCod: newEmpCod,
      activeCompanyId: newEmpCod,
      sessionId,
      activeModuleId: activeModuleId ?? user.activeModuleId,
    };

    const accessToken = this.accessToken(payload);
    const refreshToken = user.prfGamId
      ? this.issueRefreshTokenGam(user.prfGamId, newEmpCod)
      : this.issueRefreshTokenGam('', newEmpCod);
    return { accessToken, refreshToken };
  }
}
