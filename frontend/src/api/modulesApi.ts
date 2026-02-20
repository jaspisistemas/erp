import { apiClient } from './client'

export interface ModuloDto {
  modCod: string
  modNom: string | null
  modIconClass: string | null
  modLin: string | null
  modCaption: string | null
  modOrd: number | null
}

export const fetchModules = async (): Promise<ModuloDto[]> => {
  const { data } = await apiClient.get<ModuloDto[]>('/modules')
  return data
}
