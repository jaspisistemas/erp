import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAppDispatch } from '../redux/hooks'
import { syncFromToken } from '../redux/slices/authSlice'
import { fetchMenu, fetchSideMenu } from '../redux/slices/menuSlice'
import Navbar from '../components/Navbar/Navbar'
import SideMenu from '../components/SideMenu/SideMenu'
import './DashboardLayout.css'

const DashboardLayout: React.FC = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(syncFromToken())
    // Restores menu from session cache on page refresh; no-op if already loaded
    dispatch(fetchMenu())
    dispatch(fetchSideMenu())
  }, [dispatch])

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-layout-body">
        <SideMenu />
        <main className="dashboard-layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
