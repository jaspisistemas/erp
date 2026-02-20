import { apiClient } from './client'

export interface MenuItemDto {
  caption: string
  link: string
  iconClass: string | null
  subItems?: MenuItemDto[]
}

export const fetchMenu = async (moduleId?: string): Promise<MenuItemDto[]> => {
  const params = moduleId ? { moduleId } : {}
  const { data } = await apiClient.get<MenuItemDto[]>('/menu', { params })
  return data
}
