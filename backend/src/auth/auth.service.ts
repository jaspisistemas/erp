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
  UserPesExtCod: number | null;
}

interface LoginResolution {
  userKind: 'usuario' | 'suporte';
  pesCod: number;
  empCod: number;
  filCod?: number;
  isSuporte: boolean;
  nextStep: 'dashboard' | 'select-company';
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
  private async validateUserFromUsuario(username: string, password: string): Promise<{ userGuid: string; userName: string; userPesExtCod: number }> {
    const rows = await this.prisma.$queryRaw<
      UsuarioRow[]
    >`SELECT CONVERT(NVARCHAR(36), [UserGuid]) AS [UserGuid], [UserNam], [UserSen], [UserPesExtCod] FROM [Usuario] WHERE LOWER([UserNam]) = LOWER(${username})`;

    if (!rows?.length) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    for (const row of rows) {
      const userGuid = (row.UserGuid ?? '').trim();
      const userName = (row.UserNam ?? username).trim();
      const storedPwd = (row.UserSen ?? '').trim();
      const inputHash = this.hashUserPassword(userGuid, password);
      if (inputHash === storedPwd && row.UserPesExtCod != null) {
        return { userGuid, userName, userPesExtCod: row.UserPesExtCod };
      }
    }

    throw new UnauthorizedException('Usuário ou senha inválidos');
  }

  private async getDefaultFilial(empCod: number): Promise<number | undefined> {
    const filial = await this.prisma.filial.findFirst({
      where: { EmpCod: empCod },
      orderBy: { FilCod: 'asc' },
      select: { FilCod: true },
    });
    return filial?.FilCod;
  }

  private async resolveLoginByPesExtCod(userPesExtCod: number): Promise<LoginResolution> {
    const pessoa = await this.prisma.pessoa.findFirst({
      where: { PesExtCod: userPesExtCod },
      select: { PesCod: true, EmpCod: true },
      orderBy: [{ EmpCod: 'asc' }, { PesCod: 'asc' }],
    });

    if (pessoa) {
      return {
        userKind: 'usuario',
        pesCod: pessoa.PesCod,
        empCod: pessoa.EmpCod,
        filCod: await this.getDefaultFilial(pessoa.EmpCod),
        isSuporte: false,
        nextStep: 'dashboard',
      };
    }

    const suporte = await this.prisma.suporte.findFirst({
      where: { SupExtID: userPesExtCod },
      select: { SupCod: true },
    });

    if (!suporte) {
      throw new UnauthorizedException('Usuário sem vínculo em Pessoa/Suporte');
    }

    const empresas = await this.prisma.empresa.findMany({
      orderBy: { EmpCod: 'asc' },
      select: { EmpCod: true },
    });

    if (empresas.length === 1) {
      const empCod = empresas[0].EmpCod;
      return {
        userKind: 'suporte',
        pesCod: 0,
        empCod,
        filCod: await this.getDefaultFilial(empCod),
        isSuporte: true,
        nextStep: 'dashboard',
      };
    }

    return {
      userKind: 'suporte',
      pesCod: 0,
      empCod: 0,
      isSuporte: true,
      nextStep: 'select-company',
    };
  }

  private refreshSecret() {
    return process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
  }

  private issueRefreshTokenGam(userGuid: string, empCod: number, isSuporte?: boolean, filCod?: number) {
    const refreshTtlSec = parseInt(process.env.JWT_REFRESH_TTL || '86400', 10);
    return this.jwt.sign(
      { userGuid, empCod, isSuporte: isSuporte === true, filCod, type: 'gam_refresh' },
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
    isSuporte?: boolean;
    filCod?: number;
  }> {
    try {
      const payload = this.jwt.verify(refreshToken, { secret: this.refreshSecret() }) as {
        userGuid?: string;
        empCod?: number;
        isSuporte?: boolean;
        filCod?: number;
        type?: string;
      };
      if (payload?.type === 'gam_refresh' && payload.userGuid != null && payload.empCod != null) {
        return {
          empCod: payload.empCod,
          pesCod: 0,
          userGuid: payload.userGuid,
          isSuporte: payload.isSuporte,
          filCod: payload.filCod,
        };
      }
    } catch {
      // não é JWT de refresh GAM
    }
    throw new UnauthorizedException('Sessão inválida ou expirada. Faça login novamente.');
  }

  async login(identifier: { user: string }, password: string) {
    const { userGuid, userName, userPesExtCod } = await this.validateUserFromUsuario(identifier.user, password);
    const resolved = await this.resolveLoginByPesExtCod(userPesExtCod);
    const sessionId = uuid();

    const payload: JwtPayload = {
      sub: resolved.pesCod,
      email: '',
      empCod: resolved.empCod,
      activeCompanyId: resolved.empCod,
      filCod: resolved.filCod,
      sessionId,
      isSuporte: resolved.isSuporte,
      // prfTip: TipoPerfil.USUARIO_SISTEMA,
      prfGamId: userGuid,
      activeModuleId: 'dashboard',
    };

    const accessToken = this.accessToken(payload);
    const refreshToken = this.issueRefreshTokenGam(userGuid, resolved.empCod, resolved.isSuporte, resolved.filCod);

    return {
      accessToken,
      refreshToken,
      nextStep: resolved.nextStep,
      user: {
        pesCod: resolved.pesCod,
        empCod: resolved.empCod,
        filCod: resolved.filCod,
        name: userName,
        email: null,
        userKind: resolved.userKind,
        userPesExtCod,
        isSuporte: resolved.isSuporte,
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
      filCod: stored.filCod,
      sessionId,
      isSuporte: stored.isSuporte,
      // prfTip: TipoPerfil.USUARIO_SISTEMA,
      prfGamId: stored.userGuid,
      activeModuleId: activeModuleId ?? 'dashboard',
    };

    const accessToken = this.accessToken(payload);
    const newRefresh = this.issueRefreshTokenGam(stored.userGuid ?? '', stored.empCod, stored.isSuporte, stored.filCod);

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
      where: user.isSuporte === true
        ? undefined
        : (user.empCod ? { EmpCod: user.empCod } : undefined),
      orderBy: { EmpCod: 'asc' },
      select: { EmpCod: true, EmpRaz: true },
    });
    if (empresas.length === 0 && user.empCod) {
      return [{ empCod: user.empCod, empRaz: 'Empresa' }];
    }
    return empresas.map((e) => ({ empCod: e.EmpCod, empRaz: e.EmpRaz }));
  }

  async getCompanyBranchOptions(user: JwtPayload): Promise<Array<{ empCod: number; empRaz: string | null; filiais: Array<{ filCod: number; filRaz: string | null }> }>> {
    const whereEmpresa = user.isSuporte === true
      ? undefined
      : (user.empCod ? { EmpCod: user.empCod } : undefined);

    const empresas = await this.prisma.empresa.findMany({
      where: whereEmpresa,
      orderBy: { EmpCod: 'asc' },
      select: { EmpCod: true, EmpRaz: true },
    });

    const empCods = empresas.map((e) => e.EmpCod);
    if (empCods.length === 0) {
      return [];
    }

    const filiais = await this.prisma.filial.findMany({
      where: { EmpCod: { in: empCods } },
      orderBy: [{ EmpCod: 'asc' }, { FilCod: 'asc' }],
      select: { EmpCod: true, FilCod: true, FilRaz: true },
    });

    return empresas.map((empresa) => ({
      empCod: empresa.EmpCod,
      empRaz: empresa.EmpRaz,
      filiais: filiais
        .filter((f) => f.EmpCod === empresa.EmpCod)
        .map((f) => ({ filCod: f.FilCod, filRaz: f.FilRaz })),
    }));
  }

  async selectCompany(user: JwtPayload, empCod: number, filCod?: number) {
    const options = await this.getCompanyBranchOptions(user);
    const companyOption = options.find((e) => e.empCod === empCod);
    if (!companyOption) {
      throw new UnauthorizedException('Empresa não disponível para este usuário');
    }

    const selectedFilCod = filCod
      ?? companyOption.filiais[0]?.filCod
      ?? await this.getDefaultFilial(empCod);

    if (filCod != null && !companyOption.filiais.some((f) => f.filCod === filCod)) {
      throw new UnauthorizedException('Filial não disponível para a empresa selecionada');
    }

    return this.issueNewTokens(user, undefined, empCod, selectedFilCod);
  }

  private async issueNewTokens(user: JwtPayload, activeModuleId?: string, activeCompanyId?: number, filCod?: number) {
    const sessionId = uuid();
    const newEmpCod = activeCompanyId ?? user.activeCompanyId ?? user.empCod ?? 1;
    const newFilCod = filCod ?? user.filCod;

    // Strip JWT-registered claims (exp, iat) so jsonwebtoken can add them fresh
    const { exp: _exp, iat: _iat, ...userClaims } = user as JwtPayload & { exp?: number; iat?: number };

    const payload: JwtPayload = {
      ...userClaims,
      empCod: newEmpCod,
      activeCompanyId: newEmpCod,
      filCod: newFilCod,
      sessionId,
      activeModuleId: activeModuleId ?? user.activeModuleId ?? 'dashboard',
    };

    const accessToken = this.accessToken(payload);
    const refreshToken = user.prfGamId
      ? this.issueRefreshTokenGam(user.prfGamId, newEmpCod, user.isSuporte, newFilCod)
      : this.issueRefreshTokenGam('', newEmpCod, user.isSuporte, newFilCod);
    return { accessToken, refreshToken };
  }
}
