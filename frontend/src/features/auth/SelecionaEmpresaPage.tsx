import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import { useAppDispatch } from '../../redux/hooks'
import { selectCompany } from '../../redux/slices/authSlice'
import { fetchEmpresasComAcesso } from '../../api/empresasApi'
import type { EmpresaComAcesso } from '../../api/empresasApi'
import './SelecionaEmpresaPage.css'

const SelecionaEmpresaPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [empresas, setEmpresas] = useState<EmpresaComAcesso[]>([])
  const [selectedEmpCod, setSelectedEmpCod] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autoSelectDone = useRef(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchEmpresasComAcesso()
      .then((data) => {
        if (!cancelled) {
          setEmpresas(data)
          if (data.length === 1) {
            setSelectedEmpCod(data[0].empCod)
          } else {
            setSelectedEmpCod('')
          }
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const err = e as { response?: { data?: { message?: string } }; message?: string }
          setError(err.response?.data?.message || err.message || 'Erro ao carregar empresas')
          setEmpresas([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (autoSelectDone.current || loading || empresas.length !== 1) return
    const empCod = empresas[0].empCod
    autoSelectDone.current = true
    setSubmitting(true)
    dispatch(selectCompany(empCod))
      .unwrap()
      .then(() => navigate('/select-module'))
      .catch((e: unknown) => {
        setError((e as string) || 'Erro ao selecionar empresa')
        autoSelectDone.current = false
      })
      .finally(() => setSubmitting(false))
  }, [loading, empresas, dispatch, navigate])

  const handleEntrar = async () => {
    if (selectedEmpCod === '' || typeof selectedEmpCod !== 'number') return
    setSubmitting(true)
    setError(null)
    try {
      await dispatch(selectCompany(selectedEmpCod)).unwrap()
      navigate('/select-module')
    } catch (e: unknown) {
      setError((e as string) || 'Erro ao selecionar empresa')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="seleciona-empresa-page">
        <div className="seleciona-empresa-page-header">
          <h1>Selecione a Empresa</h1>
          <p>Escolha a empresa que deseja acessar.</p>
        </div>

        {loading && (
          <div className="seleciona-empresa-page-loading">Carregando empresas...</div>
        )}

        {error && (
          <div className="seleciona-empresa-page-error">{error}</div>
        )}

        {!loading && empresas.length === 0 && !error && (
          <div className="seleciona-empresa-page-empty">
            Você não possui acesso a nenhuma empresa.
          </div>
        )}

        {!loading && empresas.length > 0 && empresas.length > 1 && (
          <div className="seleciona-empresa-page-card">
            <div className="seleciona-empresa-page-field">
              <label htmlFor="empresa-select-page">Empresa</label>
              <select
                id="empresa-select-page"
                value={selectedEmpCod}
                onChange={(e) => setSelectedEmpCod(e.target.value ? Number(e.target.value) : '')}
                disabled={submitting}
              >
                <option value="">Selecione uma empresa</option>
                {empresas.map((e) => (
                  <option key={e.empCod} value={e.empCod}>
                    {e.empRaz || `Empresa ${e.empCod}`}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="seleciona-empresa-page-btn"
              onClick={handleEntrar}
              disabled={selectedEmpCod === '' || submitting}
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default SelecionaEmpresaPage
