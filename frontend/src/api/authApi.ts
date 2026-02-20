import { apiClient } from './client'

export const selectModule = async (moduleId: string): Promise<{ accessToken: string; refreshToken: string }> => {
  const { data } = await apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/select-module', {
    moduleId: moduleId || '',
  })
  return data
}
