import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../redux/hooks'
import { selectModule } from '../../redux/slices/authSlice'
import { fetchModules } from '../../api/modulesApi'
import type { ModuloDto } from '../../api/modulesApi'
import './ModuleSelector.css'

const DefaultModuleIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

const ModuleSelector: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [modules, setModules] = useState<ModuloDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchModules()
      .then((data) => {
        if (!cancelled) {
          setModules(data)
          setError(null)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const err = e as { response?: { data?: { message?: string } }; message?: string }
          setError(err.response?.data?.message || err.message || 'Erro ao carregar módulos')
          setModules([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleSelect = async (modCod: string) => {
    await dispatch(selectModule(modCod))
    navigate('/dashboard')
  }

  return (
    <div className="module-selector-page">
        <div className="module-header">
          <h1>Selecione o Módulo</h1>
          <p>Escolha o sistema que deseja acessar.</p>
        </div>

        {loading && (
          <div className="module-loading">Carregando módulos...</div>
        )}

        {error && (
          <div className="module-error">{error}</div>
        )}

        {!loading && !error && modules.length === 0 && (
          <div className="module-empty">Nenhum módulo disponível para seu acesso.</div>
        )}

        {!loading && !error && modules.length > 0 && (
          <div className="module-grid">
            {modules.map((mod) => (
              <div
                key={mod.modCod}
                className="module-card"
                onClick={() => handleSelect(mod.modCod)}
                onKeyDown={(e) => e.key === 'Enter' && handleSelect(mod.modCod)}
                role="button"
                tabIndex={0}
              >
                <div className="module-icon-container">
                  {DefaultModuleIcon}
                </div>
                <h3 className="module-title">
                  {mod.modCaption ?? mod.modNom ?? mod.modCod}
                </h3>
                <p className="module-description">
                  {mod.modNom ?? mod.modCaption ?? `Módulo ${mod.modCod}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
  )
}

export default ModuleSelector
