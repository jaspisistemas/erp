import { apiClient } from './client'

export interface EmpresaComAcesso {
  empCod: number
  empRaz: string | null
}

export const fetchEmpresasComAcesso = async (): Promise<EmpresaComAcesso[]> => {
  const { data } = await apiClient.get<EmpresaComAcesso[]>('/auth/empresas-com-acesso')
  return data
}

export const selectCompany = async (empCod: number): Promise<{ accessToken: string; refreshToken: string }> => {
  const { data } = await apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/select-company', {
    empCod,
  })
  return data
}
