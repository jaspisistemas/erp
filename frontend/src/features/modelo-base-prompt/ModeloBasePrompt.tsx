import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ModeloBasePrompt.css'

type PromptRow = {
  codigo: string
  razaoSocial: string
  cli: boolean
  ufCidade: string
  cpfCnpj: string
  fone: string
  status: 'Ativo' | 'Inativo'
}

type SortBy = 'codigo' | 'razaoSocial' | 'ufCidade' | 'cpfCnpj' | 'fone'
type SortDir = 'asc' | 'desc'

const PROMPT_ROWS: PromptRow[] = [
  { codigo: '0001', razaoSocial: 'JANAINA DE SOUZA SANTOS PEREIRA', cli: true, ufCidade: 'PR / PARANAVAI', cpfCnpj: '50.738.680/0001-13', fone: '(44) 99741-0338', status: 'Ativo' },
  { codigo: '0002', razaoSocial: 'HENRIQUE M.', cli: true, ufCidade: 'PR / MARINGA', cpfCnpj: '---', fone: '(44) 3031-2744', status: 'Ativo' },
  { codigo: '0003', razaoSocial: 'JABAMIL EMBARQUE E LOGISTICA LTDA', cli: false, ufCidade: 'PR / MARINGA', cpfCnpj: '08.995.122/0001-77', fone: '(44) 99832-6096', status: 'Ativo' },
  { codigo: '0004', razaoSocial: 'JACILDA DA SILVA SA', cli: true, ufCidade: 'PR / SARANDI', cpfCnpj: '021.053.529-60', fone: '(44) 3046-1711', status: 'Ativo' },
  { codigo: '0005', razaoSocial: 'JADM BIKES LTDA', cli: true, ufCidade: 'PR / MARINGA', cpfCnpj: '42.921.195/0001-52', fone: '(44) 3431-1570', status: 'Inativo' },
  { codigo: '0006', razaoSocial: 'JAF PECAS INDUSTRIAIS LTDA', cli: true, ufCidade: 'PR / MARINGA', cpfCnpj: '38.408.995/0001-05', fone: '(44) 3272-8000', status: 'Ativo' },
]

type ModeloBasePromptProps = {
  asModal?: boolean
  onClose?: () => void
  onSelectCode?: (codigo: string) => void
}

const ModeloBasePrompt: React.FC<ModeloBasePromptProps> = ({ asModal = false, onClose, onSelectCode }) => {
  const navigate = useNavigate()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('razaoSocial')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showPageControl, setShowPageControl] = useState(false)
  const [gotoPageInput, setGotoPageInput] = useState('1')

  const [quickCodigo, setQuickCodigo] = useState('')
  const [quickNome, setQuickNome] = useState('')
  const [quickCidade, setQuickCidade] = useState('')
  const [quickCpf, setQuickCpf] = useState('')
  const [quickFone, setQuickFone] = useState('')

  const effectiveRows = useMemo(() => {
    const textIncludes = (value: string, filter: string) => value.toLowerCase().includes(filter.trim().toLowerCase())

    const rows = PROMPT_ROWS.filter((row) => {
      if (!textIncludes(row.codigo, quickCodigo)) return false
      if (!textIncludes(row.razaoSocial, quickNome)) return false
      if (!textIncludes(row.ufCidade, quickCidade)) return false
      if (!textIncludes(row.cpfCnpj, quickCpf)) return false
      if (!textIncludes(row.fone, quickFone)) return false
      return true
    })

    rows.sort((a, b) => {
      const leftValue = a[sortBy]
      const rightValue = b[sortBy]
      const cmp = String(leftValue).toLowerCase().localeCompare(String(rightValue).toLowerCase())
      if (cmp === 0) return 0
      return sortDir === 'asc' ? cmp : -cmp
    })

    return rows
  }, [quickCodigo, quickNome, quickCidade, quickCpf, quickFone, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(effectiveRows.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStart = (safeCurrentPage - 1) * pageSize
  const pagedRows = effectiveRows.slice(pageStart, pageStart + pageSize)

  const normalizedGotoPage = useMemo(() => {
    const target = Number(gotoPageInput)
    if (!Number.isFinite(target)) return ''
    const clamped = Math.min(Math.max(target, 1), totalPages)
    return String(clamped)
  }, [gotoPageInput, totalPages])

  useEffect(() => {
    if (showPageControl) {
      setGotoPageInput(String(safeCurrentPage))
    }
  }, [showPageControl, safeCurrentPage])

  const visiblePages = useMemo(() => {
    const pages: number[] = []
    const maxButtons = 5
    const start = Math.max(1, safeCurrentPage - 2)
    const end = Math.min(totalPages, start + maxButtons - 1)
    const adjustedStart = Math.max(1, end - maxButtons + 1)
    for (let i = adjustedStart; i <= end; i += 1) pages.push(i)
    return pages
  }, [safeCurrentPage, totalPages])


  const handleApplyGotoPage = () => {
    if (!normalizedGotoPage) return
    setCurrentPage(Number(normalizedGotoPage))
    setShowPageControl(false)
  }

  const handleClose = () => {
    if (onClose) {
      onClose()
      return
    }
    navigate('/modelo-base')
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleSelectCode = (codigo: string) => {
    if (onSelectCode) {
      onSelectCode(codigo)
      return
    }
    navigate(`/modelo-base?promptCode=${encodeURIComponent(codigo)}`)
  }

  const promptPanel = (
    <div className={`modelo-prompt-page ${asModal ? 'modal' : ''}`}>
      <section className="modelo-prompt-panel">
        <div className="modelo-prompt-header">
          <h1 className="modelo-prompt-title">Prompt de Consulta</h1>
          <button
            type="button"
            className="modelo-prompt-close"
            onClick={handleClose}
            aria-label="Fechar prompt"
          >
            ×
          </button>
        </div>

        <div className="modelo-prompt-toolbar">
          <div className="modelo-prompt-filter">
            <label htmlFor="prompt-codigo">Codigo</label>
            <input
              id="prompt-codigo"
              type="text"
              value={quickCodigo}
              onChange={(e) => {
                setQuickCodigo(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="modelo-prompt-filter">
            <label htmlFor="prompt-razao">Razao Social</label>
            <input
              id="prompt-razao"
              type="text"
              value={quickNome}
              onChange={(e) => {
                setQuickNome(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="modelo-prompt-filter">
            <label htmlFor="prompt-cidade">UF/Cidade</label>
            <input
              id="prompt-cidade"
              type="text"
              value={quickCidade}
              onChange={(e) => {
                setQuickCidade(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="modelo-prompt-filter">
            <label htmlFor="prompt-cpf">CPF/CNPJ</label>
            <input
              id="prompt-cpf"
              type="text"
              value={quickCpf}
              onChange={(e) => {
                setQuickCpf(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="modelo-prompt-filter">
            <label htmlFor="prompt-fone">Fone</label>
            <input
              id="prompt-fone"
              type="text"
              value={quickFone}
              onChange={(e) => {
                setQuickFone(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
        </div>

        <div className="modelo-prompt-topbar">
          <span className="modelo-prompt-ord">Ord.</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as SortBy)
              setCurrentPage(1)
            }}
          >
            <option value="razaoSocial">Razao Social</option>
            <option value="codigo">Codigo</option>
            <option value="ufCidade">UF/Cidade</option>
            <option value="cpfCnpj">CPF/CNPJ</option>
            <option value="fone">Fone</option>
          </select>
          <select
            value={sortDir}
            onChange={(e) => {
              setSortDir(e.target.value as SortDir)
              setCurrentPage(1)
            }}
          >
            <option value="asc">Crescente</option>
            <option value="desc">Decrescente</option>
          </select>
        </div>

        <div className="modelo-prompt-grid-wrap">
          <table className="modelo-prompt-grid">
            <thead>
              <tr>
                <th className="modelo-prompt-col-action" />
                <th>Codigo</th>
                <th>Razao Social</th>
                <th>Cli.</th>
                <th>UF/Cidade</th>
                <th>Cpf/Cnpj</th>
                <th>Fone</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => (
                <tr
                  key={row.codigo}
                  className={selectedCode === row.codigo ? 'selected' : ''}
                  onClick={() => setSelectedCode(row.codigo)}
                  onDoubleClick={() => handleSelectCode(row.codigo)}
                >
                  <td>
                    <button
                      type="button"
                      className="modelo-prompt-action"
                      aria-label={`Selecionar ${row.codigo}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectCode(row.codigo)
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 4 4 10-10" />
                      </svg>
                    </button>
                  </td>
                  <td>{row.codigo}</td>
                  <td>{row.razaoSocial}</td>
                  <td><input type="checkbox" checked={row.cli} readOnly className="modelo-grid-readonly-check" /></td>
                  <td>{row.ufCidade}</td>
                  <td>{row.cpfCnpj}</td>
                  <td>{row.fone}</td>
                </tr>
              ))}
              {pagedRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="modelo-prompt-empty">Nenhum registro encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="modelo-prompt-footer">
          <div className="modelo-prompt-page-summary-wrap">
            <button type="button" className="modelo-prompt-page-summary" onClick={() => setShowPageControl((v) => !v)}>
              Pagina {safeCurrentPage} de {totalPages}
            </button>
            {showPageControl && (
              <>
                <div className="modelo-prompt-page-control-overlay" onClick={() => setShowPageControl(false)} />
                <div className="modelo-prompt-page-control-popover">
                  <div className="modelo-prompt-page-control-title">Registros por pagina:</div>
                  <div className="modelo-prompt-page-size-list">
                    {[5, 10, 15, 20, 50].map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={size === pageSize ? 'active' : ''}
                        onClick={() => {
                          setPageSize(size)
                          setCurrentPage(1)
                          setGotoPageInput('1')
                          setShowPageControl(false)
                        }}
                      >
                        {size} linhas
                      </button>
                    ))}
                  </div>
                  <div className="modelo-prompt-goto">
                    <span>Va para a pagina:</span>
                    <div>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={gotoPageInput}
                        onChange={(e) => setGotoPageInput(e.target.value)}
                      />
                      <button type="button" onClick={handleApplyGotoPage}>
                        Ir
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="modelo-prompt-pager">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              |&lt;
            </button>
            {visiblePages.map((page) => (
              <button
                key={page}
                type="button"
                className={page === safeCurrentPage ? 'active' : ''}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              &gt;|
            </button>
          </div>
        </div>
      </section>
    </div>
  )

  if (asModal) {
    return (
      <div className="modelo-prompt-overlay" role="dialog" aria-modal="true" aria-label="Prompt de consulta">
        {promptPanel}
      </div>
    )
  }

  return promptPanel
}

export default ModeloBasePrompt
