import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAppDispatch } from '../redux/hooks'
import { syncFromToken } from '../redux/slices/authSlice'
import Navbar from '../components/Navbar/Navbar'
import './DashboardLayout.css'

const DashboardLayout: React.FC = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(syncFromToken())
  }, [dispatch])

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-layout-body">
        <main className="dashboard-layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
