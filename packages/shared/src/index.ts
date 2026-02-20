export const APP_NAME = 'Template ERP - Gestão';
export { DEV_PORTS } from './dev-ports.js';

export enum TipoPerfil {
  USUARIO_SISTEMA = 1,
  SUPORTE_USUARIOS = 2,
  SUPORTE_SISTEMA = 3,
}

export enum StatusCredito {
  DISPONIVEL = 'DISPONIVEL',
  CONSUMIDO = 'CONSUMIDO',
  EXPIRADO = 'EXPIRADO',
}

export interface Cooperado {
  id: string;
  nome: string;
  unidadeConsumidora: string;
}
