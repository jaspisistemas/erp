import { apiClient } from './client'

export interface RotinaDto {
  rotCod: number
  rotNom: string
  rotLin: string
  rotImgFav: string | null
  rotOrd: number | null
}

export interface SubMenuDto {
  subMenCod: number
  subMenNom: string
  subMenOrd: number | null
  rotinas: RotinaDto[]
}

export interface MenuDto {
  menCod: number
  menNom: string
  menOrd: number | null
  subMenus: SubMenuDto[]
}

export interface SideMenuItemDto {
  key: string
  label: string
  link: string
  icon: string | null
  order: number
  fixed?: boolean
}

export const fetchMenu = async (): Promise<MenuDto[]> => {
  const { data } = await apiClient.get<MenuDto[]>('/menu')
  return data
}

export const fetchSideMenu = async (): Promise<SideMenuItemDto[]> => {
  const { data } = await apiClient.get<SideMenuItemDto[]>('/menu/side')
  return data
}
