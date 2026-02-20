import React from 'react'
import { useAppSelector } from '../../redux/hooks'

const Dashboard: React.FC = () => {
  const activeModuleId = useAppSelector((state) => state.auth.activeModuleId)

  return (
    <div className="dashboard-page">
      <div className="dashboard-placeholder">
        <p>Módulo: <strong>{activeModuleId ?? '-'}</strong></p>
        <p className="dashboard-placeholder-hint">Área em desenvolvimento. Adicione seus módulos aqui durante a migração.</p>
      </div>
    </div>
  )
}

export default Dashboard
