import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../redux/hooks'
import { selectCompany } from '../../redux/slices/authSlice'
import { fetchMenu, fetchSideMenu } from '../../redux/slices/menuSlice'
import { fetchCompanyBranchOptions } from '../../api/empresasApi'
import type { CompanyBranchOption } from '../../api/empresasApi'
import './SelecionaEmpresaPage.css'

const SelecionaEmpresaPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [empresas, setEmpresas] = useState<CompanyBranchOption[]>([])
  const [selectedEmpCod, setSelectedEmpCod] = useState<number | ''>('')
  const [selectedFilCod, setSelectedFilCod] = useState<number | ''>('')
  const [empresaInput, setEmpresaInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autoSelectDone = useRef(false)
  const suggestRef = useRef<HTMLDivElement | null>(null)
  const [showEmpresaSuggestions, setShowEmpresaSuggestions] = useState(false)

  const getEmpresaOptionLabel = (empresa: CompanyBranchOption) => `${empresa.empCod} - ${empresa.empRaz || `Empresa ${empresa.empCod}`}`
  const empresaSuggestions = empresas.filter((empresa) => {
    const label = getEmpresaOptionLabel(empresa).toLowerCase()
    const term = empresaInput.trim().toLowerCase()
    if (!term) return true
    return label.includes(term)
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchCompanyBranchOptions()
      .then((data) => {
        if (!cancelled) {
          setEmpresas(data)
          if (data.length > 0) {
            const firstEmpresa = data[0]
            setSelectedEmpCod(firstEmpresa.empCod)
            setEmpresaInput(getEmpresaOptionLabel(firstEmpresa))
            setSelectedFilCod(firstEmpresa.filiais[0]?.filCod ?? '')
          } else {
            setSelectedEmpCod('')
            setSelectedFilCod('')
            setEmpresaInput('')
          }
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const err = e as { response?: { data?: { message?: string } }; message?: string }
          setError(err.response?.data?.message || err.message || 'Erro ao carregar empresas e filiais')
          setEmpresas([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (selectedEmpCod === '' || typeof selectedEmpCod !== 'number') {
      setSelectedFilCod('')
      return
    }
    const empresa = empresas.find((e) => e.empCod === selectedEmpCod)
    if (!empresa) {
      setSelectedFilCod('')
      return
    }
    if (empresa.filiais.length === 0) {
      setSelectedFilCod('')
      return
    }
    if (!empresa.filiais.some((f) => f.filCod === selectedFilCod)) {
      setSelectedFilCod(empresa.filiais[0].filCod)
    }
  }, [selectedEmpCod, selectedFilCod, empresas])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(event.target as Node)) {
        setShowEmpresaSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEmpresaInputChange = (value: string) => {
    setEmpresaInput(value)
    setShowEmpresaSuggestions(true)

    const normalized = value.trim().toLowerCase()
    if (!normalized) return

    const matched = empresas.find((empresa) => {
      const label = getEmpresaOptionLabel(empresa).toLowerCase()
      return label === normalized
    })

    if (matched) {
      setSelectedEmpCod(matched.empCod)
      return
    }

    const startsWithMatch = empresas.find((empresa) => {
      const label = getEmpresaOptionLabel(empresa).toLowerCase()
      return label.startsWith(normalized)
    })

    if (startsWithMatch) {
      setSelectedEmpCod(startsWithMatch.empCod)
    }
  }

  const handleEmpresaSelect = (empresa: CompanyBranchOption) => {
    setSelectedEmpCod(empresa.empCod)
    setEmpresaInput(getEmpresaOptionLabel(empresa))
    setShowEmpresaSuggestions(false)
  }

  useEffect(() => {
    if (autoSelectDone.current || loading || empresas.length !== 1) return
    const empCod = empresas[0].empCod
    const filiais = empresas[0].filiais
    if (filiais.length !== 1) return
    autoSelectDone.current = true
    setSubmitting(true)
    dispatch(selectCompany({ empCod, filCod: filiais[0].filCod }))
      .unwrap()
      .then(() => Promise.all([dispatch(fetchMenu()), dispatch(fetchSideMenu())]))
      .then(() => navigate('/dashboard'))
      .catch((e: unknown) => {
        setError((e as string) || 'Erro ao selecionar empresa')
        autoSelectDone.current = false
      })
      .finally(() => setSubmitting(false))
  }, [loading, empresas, dispatch, navigate])

  const handleEntrar = async () => {
    if (selectedEmpCod === '' || typeof selectedEmpCod !== 'number') return
    if (selectedFilCod === '' || typeof selectedFilCod !== 'number') return
    setSubmitting(true)
    setError(null)
    try {
      await dispatch(selectCompany({ empCod: selectedEmpCod, filCod: selectedFilCod })).unwrap()
      await Promise.all([dispatch(fetchMenu()), dispatch(fetchSideMenu())])
      navigate('/dashboard')
    } catch (e: unknown) {
      setError((e as string) || 'Erro ao selecionar empresa')
    } finally {
      setSubmitting(false)
    }
  }

  return (
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

        {!loading && empresas.length > 0 && (
          <div className="seleciona-empresa-page-card">
            <div className="seleciona-empresa-page-field">
              <label htmlFor="empresa-suggest-page">Empresa</label>
              <div className="seleciona-empresa-page-suggest" ref={suggestRef}>
                <input
                  id="empresa-suggest-page"
                  value={empresaInput}
                  onChange={(e) => handleEmpresaInputChange(e.target.value)}
                  onFocus={() => setShowEmpresaSuggestions(true)}
                  disabled={submitting}
                  autoComplete="off"
                />

                {showEmpresaSuggestions && empresaSuggestions.length > 0 && (
                  <ul className="seleciona-empresa-page-suggest-list" role="listbox" aria-label="Sugestões de empresa">
                    {empresaSuggestions.map((empresa) => (
                      <li key={empresa.empCod}>
                        <button
                          type="button"
                          className="seleciona-empresa-page-suggest-item"
                          onClick={() => handleEmpresaSelect(empresa)}
                        >
                          {getEmpresaOptionLabel(empresa)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="seleciona-empresa-page-field">
              <label htmlFor="filial-select-page">Filial</label>
              <select
                id="filial-select-page"
                value={selectedFilCod}
                onChange={(e) => setSelectedFilCod(e.target.value ? Number(e.target.value) : '')}
                disabled={submitting || selectedEmpCod === ''}
              >
                {(empresas.find((e) => e.empCod === selectedEmpCod)?.filiais ?? []).map((f) => (
                  <option key={f.filCod} value={f.filCod}>
                    {f.filRaz || `Filial ${f.filCod}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="seleciona-empresa-page-btn"
              onClick={handleEntrar}
              disabled={selectedEmpCod === '' || selectedFilCod === '' || submitting}
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        )}
      </div>
  )
}

export default SelecionaEmpresaPage
