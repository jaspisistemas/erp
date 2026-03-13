import { apiClient } from './client'

export interface EmpresaComAcesso {
  empCod: number
  empRaz: string | null
}

export interface FilialOption {
  filCod: number
  filRaz: string | null
}

export interface CompanyBranchOption {
  empCod: number
  empRaz: string | null
  filiais: FilialOption[]
}

export const fetchEmpresasComAcesso = async (): Promise<EmpresaComAcesso[]> => {
  const { data } = await apiClient.get<EmpresaComAcesso[]>('/auth/empresas-com-acesso')
  return data
}

export const fetchCompanyBranchOptions = async (): Promise<CompanyBranchOption[]> => {
  const { data } = await apiClient.get<CompanyBranchOption[]>('/auth/company-branch-options')
  return data
}

export const selectCompany = async (payload: { empCod: number; filCod?: number }): Promise<{ accessToken: string; refreshToken: string }> => {
  const { data } = await apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/select-company', {
    empCod: payload.empCod,
    filCod: payload.filCod,
  })
  return data
}
