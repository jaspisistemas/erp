export interface JwtPayload {
  sub: number;
  email: string;
  empCod: number;
  activeCompanyId?: number;
  sessionId: string;
  isSuporte?: boolean;
  prfTip: number;
  prfGamId?: string;
  activeModuleId?: string;
}
