import React, { useEffect, useMemo, useRef, useState } from 'react'
import ModeloBasePrompt from '../modelo-base-prompt'
import './ModeloBase.css'

type GridRow = {
  id: number
  razaoSocial: string
  razaoSocialLink?: string
  cli: boolean
  ufCidade: string
  cpfCnpj: string
  fone: string
  status: 'Ativo' | 'Inativo'
}

type PhoneLevelRow = {
  id: number
  tipoTelefone: string
  operadora: string
  numero: string
  departamento: string
  contato: string
  dataNascimento: string
  financ: boolean
  comer: boolean
  nota: boolean
  locked: boolean
}

type SortBy = 'razaoSocial' | 'ufCidade' | 'cpfCnpj' | 'fone' | 'id'
type SortDir = 'asc' | 'desc'
type ColumnFilterKey = 'razaoSocial' | 'ufCidade' | 'cpfCnpj' | 'fone' | 'id'
type ColumnOrderDraft = 'none' | 'asc' | 'desc'

const GRID_ROWS: GridRow[] = [
  { id: 1, razaoSocial: '50.738.680 JANAINA DE SOUZA SANTOS PEREIRA', razaoSocialLink: 'https://example.com/cliente/1', cli: true, ufCidade: 'PR / PARANAVAI', cpfCnpj: '50.738.680/0001-13', fone: '(44) 99741-0338', status: 'Ativo' },
  { id: 2, razaoSocial: 'HENRIQUE M.', cli: true, ufCidade: 'PR / MARINGA', cpfCnpj: '---', fone: '(44) 3031-2744', status: 'Ativo' },
  { id: 3, razaoSocial: 'JABAMIL EMBARQUE E LOGISTICA LTDA', cli: false, ufCidade: 'PR / MARINGA', cpfCnpj: '08.995.122/0001-77', fone: '(44) 99832-6096', status: 'Ativo' },
  { id: 4, razaoSocial: 'JACILDA DA SILVA SA', cli: true, ufCidade: 'PR / SARANDI', cpfCnpj: '021.053.529-60', fone: '(44) 3046-1711', status: 'Ativo' },
  { id: 5, razaoSocial: 'JADM BIKES LTDA', cli: true, ufCidade: 'PR / MARINGA', cpfCnpj: '42.921.195/0001-52', fone: '(44) 3431-1570', status: 'Inativo' },
  { id: 6, razaoSocial: 'JADSON JUNIO FAGUNDES TRANSPORTES', cli: true, ufCidade: 'PR / PARAISO DO NORTE', cpfCnpj: '33.436.661/0001-13', fone: '(44) 3024-5766', status: 'Ativo' },
  { id: 7, razaoSocial: 'JAF PECAS INDUSTRIAIS LTDA', cli: true, ufCidade: 'PR / MARINGA', cpfCnpj: '38.408.995/0001-05', fone: '(44) 3272-8000', status: 'Ativo' },
  { id: 8, razaoSocial: 'JAGUAFRANGOS IND E COM. ALIMENTOS LTDA', cli: true, ufCidade: 'PR / JAGUAPITA', cpfCnpj: '85.090.033/0001-22', fone: '4391097164', status: 'Inativo' },
  { id: 9, razaoSocial: 'JAIME ALVES DA SILVA', cli: true, ufCidade: 'PR / MARINGA', cpfCnpj: '604.925.039-15', fone: '(44) 99136-1321', status: 'Ativo' },
  { id: 10, razaoSocial: 'JAIME PEREIRA DA CONCEICAO SILVA', cli: true, ufCidade: 'PR / MARINGA', cpfCnpj: '885.042.559-72', fone: '(44) 99926-3452', status: 'Ativo' },
  { id: 11, razaoSocial: 'JAIR PAVESI', cli: true, ufCidade: 'PR / MARINGA', cpfCnpj: '325.511.779-87', fone: '(44) 3056-4069', status: 'Ativo' },
  { id: 12, razaoSocial: 'JAIR PEREIRA RODRIGUES E CIA LTDA', cli: true, ufCidade: 'PR / ARAPONGAS', cpfCnpj: '14.695.645/0001-09', fone: '(44) 3056-4069', status: 'Ativo' },
]

const PHONE_LEVEL_INITIAL_ROWS: PhoneLevelRow[] = [
  {
    id: 1,
    tipoTelefone: 'COMERCIAL',
    operadora: 'FIXO',
    numero: '(44) 99741-0338',
    departamento: 'Geral (Ambos)',
    contato: 'Ex. Sr Afonso',
    dataNascimento: '',
    financ: true,
    comer: true,
    nota: true,
    locked: false,
  },
  {
    id: 2,
    tipoTelefone: 'COMERCIAL',
    operadora: 'FIXO',
    numero: '(99) 99999-9999',
    departamento: 'Geral (Ambos)',
    contato: 'Ex. Sr Afonso',
    dataNascimento: '',
    financ: true,
    comer: true,
    nota: true,
    locked: false,
  },
]

const SUGGEST_OPTIONS = ['Exemplo 1', 'Exemplo 2', 'Exemplo 3', 'Teste Operacional']

const columnLabel: Record<ColumnFilterKey, string> = {
  id: 'Cli.',
  razaoSocial: 'Razao Social',
  ufCidade: 'UF/Cidade',
  cpfCnpj: 'Cpf/Cnpj',
  fone: 'Fone',
}

const NON_REMOVABLE_COLUMNS: ColumnFilterKey[] = ['razaoSocial']

const ModeloBase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cadastro' | 'grid' | 'step'>('cadastro')
  const [currentStep, setCurrentStep] = useState(1)
  const [showEditPrompt, setShowEditPrompt] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [suggestValue, setSuggestValue] = useState('Exemplo 1')
  const [suggestPanelOpen, setSuggestPanelOpen] = useState(false)
  const [suggestDirty, setSuggestDirty] = useState(false)
  const [comboValue, setComboValue] = useState('ativo')
  const [checked, setChecked] = useState(true)
  const [dateValue, setDateValue] = useState('2026-03-13')
  const [cadastroLeftText, setCadastroLeftText] = useState('')
  const [cadastroLeftRequired, setCadastroLeftRequired] = useState('')
  const [cadastroTopRequired, setCadastroTopRequired] = useState('')
  const [requiredTouched, setRequiredTouched] = useState({ left: false, top: false })
  const [phoneRows, setPhoneRows] = useState<PhoneLevelRow[]>(PHONE_LEVEL_INITIAL_ROWS)
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)

  const [sortBy, setSortBy] = useState<SortBy>('razaoSocial')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [quickNome, setQuickNome] = useState('')
  const [quickCidade, setQuickCidade] = useState('')
  const [quickCpf, setQuickCpf] = useState('')
  const [quickFone, setQuickFone] = useState('')
  const [quickIdInput, setQuickIdInput] = useState('')
  const [quickId, setQuickId] = useState('')
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [actionsMenuPosition, setActionsMenuPosition] = useState({ top: 0, left: 0 })

  const [columnFilters, setColumnFilters] = useState<Record<ColumnFilterKey, string>>({
    id: '',
    razaoSocial: '',
    ufCidade: '',
    cpfCnpj: '',
    fone: '',
  })

  const [columnFilterModal, setColumnFilterModal] = useState<{
    column: ColumnFilterKey
    searchDraft: string
    orderDraft: ColumnOrderDraft
  } | null>(null)
  const [columnFilterPosition, setColumnFilterPosition] = useState({ top: 0, left: 0 })

  const [showMoreFiltersModal, setShowMoreFiltersModal] = useState(false)
  const [moreFiltersPosition, setMoreFiltersPosition] = useState({ top: 0, left: 0 })
  const [showColumnSelectorModal, setShowColumnSelectorModal] = useState(false)
  const [columnSelectorPosition, setColumnSelectorPosition] = useState({ top: 0, left: 0 })
  const [advancedStatusDraft, setAdvancedStatusDraft] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos')
  const [advancedCliDraft, setAdvancedCliDraft] = useState<'Todos' | 'Sim' | 'Nao'>('Todos')
  const [advancedStatus, setAdvancedStatus] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos')
  const [advancedCli, setAdvancedCli] = useState<'Todos' | 'Sim' | 'Nao'>('Todos')
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnFilterKey, boolean>>({
    id: true,
    razaoSocial: true,
    ufCidade: true,
    cpfCnpj: true,
    fone: true,
  })
  const [visibleColumnsDraft, setVisibleColumnsDraft] = useState<Record<ColumnFilterKey, boolean>>({
    id: true,
    razaoSocial: true,
    ufCidade: true,
    cpfCnpj: true,
    fone: true,
  })

  const columnPopoverRef = useRef<HTMLDivElement | null>(null)
  const moreFiltersPopoverRef = useRef<HTMLDivElement | null>(null)
  const columnSelectorPopoverRef = useRef<HTMLDivElement | null>(null)
  const actionsMenuPopoverRef = useRef<HTMLDivElement | null>(null)
  const suggestPanelRef = useRef<HTMLDivElement | null>(null)
  const suggestInputRef = useRef<HTMLInputElement | null>(null)
  const columnTriggerRef = useRef<HTMLElement | null>(null)
  const moreFiltersTriggerRef = useRef<HTMLElement | null>(null)
  const actionsTriggerRef = useRef<HTMLElement | null>(null)

  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [showPageControl, setShowPageControl] = useState(false)
  const [gotoPageInput, setGotoPageInput] = useState('1')

  const normalizeNumericFilterValue = (value: string) => {
    const trimmed = value.trim()
    if (trimmed === '0') return ''
    return trimmed
  }

  const effectiveRows = useMemo(() => {
    const textIncludes = (value: string, filter: string) => value.toLowerCase().includes(filter.trim().toLowerCase())
    const matchId = (rowId: number, filter: string) => {
      const normalized = normalizeNumericFilterValue(filter)
      if (!normalized) return true
      return String(rowId) === normalized
    }

    const rows = GRID_ROWS.filter((row) => {
      if (!matchId(row.id, quickId)) return false
      if (!textIncludes(row.razaoSocial, quickNome)) return false
      if (!textIncludes(row.ufCidade, quickCidade)) return false
      if (!textIncludes(row.cpfCnpj, quickCpf)) return false
      if (!textIncludes(row.fone, quickFone)) return false

      if (!matchId(row.id, columnFilters.id)) return false
      if (!textIncludes(row.razaoSocial, columnFilters.razaoSocial)) return false
      if (!textIncludes(row.ufCidade, columnFilters.ufCidade)) return false
      if (!textIncludes(row.cpfCnpj, columnFilters.cpfCnpj)) return false
      if (!textIncludes(row.fone, columnFilters.fone)) return false

      if (advancedStatus !== 'Todos' && row.status !== advancedStatus) return false
      if (advancedCli !== 'Todos') {
        const shouldCli = advancedCli === 'Sim'
        if (row.cli !== shouldCli) return false
      }

      return true
    })

    rows.sort((a, b) => {
      const leftValue = a[sortBy]
      const rightValue = b[sortBy]

      const cmp = sortBy === 'id'
        ? Number(leftValue) - Number(rightValue)
        : String(leftValue).toLowerCase().localeCompare(String(rightValue).toLowerCase())

      if (cmp === 0) return 0
      return sortDir === 'asc' ? cmp : -cmp
    })

    return rows
  }, [
    quickId,
    quickNome,
    quickCidade,
    quickCpf,
    quickFone,
    columnFilters,
    advancedStatus,
    advancedCli,
    sortBy,
    sortDir,
  ])

  const totalPages = Math.max(1, Math.ceil(effectiveRows.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStart = (safeCurrentPage - 1) * pageSize
  const pagedRows = effectiveRows.slice(pageStart, pageStart + pageSize)

  const visiblePages = useMemo(() => {
    const pages: number[] = []
    const maxButtons = 5
    const start = Math.max(1, safeCurrentPage - 2)
    const end = Math.min(totalPages, start + maxButtons - 1)
    const adjustedStart = Math.max(1, end - maxButtons + 1)
    for (let i = adjustedStart; i <= end; i += 1) pages.push(i)
    return pages
  }, [safeCurrentPage, totalPages])

  const appliedAdvancedFilters = useMemo(() => {
    const chips: { label: string; key: 'status' | 'cli' }[] = []
    if (advancedStatus !== 'Todos') chips.push({ label: `Status: ${advancedStatus}`, key: 'status' })
    if (advancedCli !== 'Todos') chips.push({ label: `Cli: ${advancedCli}`, key: 'cli' })
    return chips
  }, [advancedStatus, advancedCli])

  const suggestGridItems = useMemo(() => {
    if (!suggestDirty) return []
    const term = suggestValue.trim().toLowerCase()
    if (!term) return []
    return SUGGEST_OPTIONS
      .filter((item) => item.toLowerCase().includes(term))
      .map((item, index) => ({
        id: index + 1,
        codigo: `OP${String(index + 1).padStart(2, '0')}`,
        descricao: item,
      }))
  }, [suggestDirty, suggestValue])

  const openColumnFilter = (column: ColumnFilterKey, trigger: HTMLElement) => {
    const rect = trigger.getBoundingClientRect()
    const popoverWidth = 420
    const margin = 10
    const left = Math.min(Math.max(rect.left, margin), window.innerWidth - popoverWidth - margin)

    columnTriggerRef.current = trigger
    setColumnFilterPosition({ top: rect.bottom + 6, left })
    setColumnFilterModal({
      column,
      searchDraft: columnFilters[column],
      orderDraft: sortBy === column ? sortDir : 'none',
    })
  }

  const exportGridToExcel = () => {
    const headers: string[] = []
    if (visibleColumns.razaoSocial) headers.push('Razao Social')
    if (visibleColumns.id) headers.push('Cli.')
    if (visibleColumns.ufCidade) headers.push('UF/Cidade')
    if (visibleColumns.cpfCnpj) headers.push('Cpf/Cnpj')
    if (visibleColumns.fone) headers.push('Fone')

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`
    const lines = [headers.map(escapeCsv).join(';')]

    effectiveRows.forEach((row) => {
      const values: string[] = []
      if (visibleColumns.razaoSocial) values.push(row.razaoSocial)
      if (visibleColumns.id) values.push(row.cli ? 'Sim' : 'Nao')
      if (visibleColumns.ufCidade) values.push(row.ufCidade)
      if (visibleColumns.cpfCnpj) values.push(row.cpfCnpj)
      if (visibleColumns.fone) values.push(row.fone)
      lines.push(values.map(escapeCsv).join(';'))
    })

    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'grid-export.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportGridToPdf = () => {
    const headers: string[] = []
    if (visibleColumns.razaoSocial) headers.push('Razao Social')
    if (visibleColumns.id) headers.push('Cli.')
    if (visibleColumns.ufCidade) headers.push('UF/Cidade')
    if (visibleColumns.cpfCnpj) headers.push('Cpf/Cnpj')
    if (visibleColumns.fone) headers.push('Fone')

    const rowsHtml = effectiveRows.map((row) => {
      const values: string[] = []
      if (visibleColumns.razaoSocial) values.push(row.razaoSocial)
      if (visibleColumns.id) values.push(row.cli ? 'Sim' : 'Nao')
      if (visibleColumns.ufCidade) values.push(row.ufCidade)
      if (visibleColumns.cpfCnpj) values.push(row.cpfCnpj)
      if (visibleColumns.fone) values.push(row.fone)
      return `<tr>${values.map((v) => `<td>${v}</td>`).join('')}</tr>`
    }).join('')

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(`
      <html>
      <head>
        <title>Exportacao Grid</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #999; padding: 6px 8px; font-size: 12px; }
          th { background: #f2f2f2; }
        </style>
      </head>
      <body>
        <h3>Exportacao da Grid</h3>
        <table>
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  const openColumnSelector = (trigger: HTMLElement) => {
    const rect = trigger.getBoundingClientRect()
    const popoverWidth = 420
    const margin = 10
    const left = Math.min(Math.max(rect.left, margin), window.innerWidth - popoverWidth - margin)
    actionsTriggerRef.current = trigger
    setColumnSelectorPosition({ top: rect.bottom + 6, left })
    setVisibleColumnsDraft(visibleColumns)
    setShowColumnSelectorModal(true)
  }

  useEffect(() => {
    const onDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        columnFilterModal
        && columnPopoverRef.current
        && !columnPopoverRef.current.contains(target)
        && (!columnTriggerRef.current || !columnTriggerRef.current.contains(target))
      ) {
        setColumnFilterModal(null)
      }

      if (
        showMoreFiltersModal
        && moreFiltersPopoverRef.current
        && !moreFiltersPopoverRef.current.contains(target)
        && (!moreFiltersTriggerRef.current || !moreFiltersTriggerRef.current.contains(target))
      ) {
        setShowMoreFiltersModal(false)
      }

      if (
        showColumnSelectorModal
        && columnSelectorPopoverRef.current
        && !columnSelectorPopoverRef.current.contains(target)
        && (!actionsTriggerRef.current || !actionsTriggerRef.current.contains(target))
      ) {
        setShowColumnSelectorModal(false)
      }

      if (
        showActionsMenu
        && actionsMenuPopoverRef.current
        && !actionsMenuPopoverRef.current.contains(target)
        && (!actionsTriggerRef.current || !actionsTriggerRef.current.contains(target))
      ) {
        setShowActionsMenu(false)
      }

      if (
        suggestPanelOpen
        && suggestPanelRef.current
        && !suggestPanelRef.current.contains(target)
        && (!suggestInputRef.current || !suggestInputRef.current.contains(target))
      ) {
        setSuggestPanelOpen(false)
      }
    }

    document.addEventListener('mousedown', onDocumentMouseDown)
    return () => document.removeEventListener('mousedown', onDocumentMouseDown)
  }, [columnFilterModal, showMoreFiltersModal, showColumnSelectorModal, showActionsMenu, suggestPanelOpen])

  const hasColumnFilter = (column: ColumnFilterKey) => {
    return columnFilters[column].trim() !== ''
  }

  const isSortedColumn = (column: ColumnFilterKey) => sortBy === column

  const handleEnterFieldNavigation = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter' || e.defaultPrevented || e.shiftKey) return

    const target = e.target as HTMLElement
    const tag = target.tagName.toLowerCase()

    if (tag === 'textarea' || tag === 'button') return

    if (tag === 'input') {
      const inputType = (target as HTMLInputElement).type
      if (['checkbox', 'radio', 'submit', 'button', 'file'].includes(inputType)) return
    }

    const container = target.closest('.modelo-base-page')
    if (!container) return

    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>('input, select, textarea, button, [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null)

    const currentIndex = focusable.indexOf(target)
    if (currentIndex < 0) return

    const next = focusable[currentIndex + 1]
    if (!next) return

    e.preventDefault()
    next.focus()
    if (next instanceof HTMLInputElement && ['text', 'number', 'date'].includes(next.type)) {
      next.select()
    }
  }

  const handleEditLookup = () => {
    setShowEditPrompt(true)
  }

  const handleSuggestLookup = () => {
    console.log('Lookup do campo Suggest executado')
  }

  const updatePhoneRow = (rowId: number, updates: Partial<PhoneLevelRow>) => {
    setPhoneRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...updates } : row)))
  }

  const togglePhoneRowLock = (rowId: number) => {
    setPhoneRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, locked: !row.locked } : row)))
  }

  const addPhoneRow = () => {
    const nextId = phoneRows.length > 0 ? Math.max(...phoneRows.map((row) => row.id)) + 1 : 1
    setPhoneRows((prev) => [
      ...prev,
      {
        id: nextId,
        tipoTelefone: 'COMERCIAL',
        operadora: 'FIXO',
        numero: '',
        departamento: 'Geral (Ambos)',
        contato: '',
        dataNascimento: '',
        financ: false,
        comer: false,
        nota: false,
        locked: false,
      },
    ])
  }

  return (
    <div className="modelo-base-page" onKeyDownCapture={handleEnterFieldNavigation}>
      <h1 className="modelo-base-title">Modelo Base</h1>

      <section className="modelo-base-panel">
        <div className="modelo-base-panel-title">Acoes</div>
        <div className="modelo-base-actions">
          <button type="button" className="modelo-btn modelo-btn-primary modelo-btn-action-size">Primario (confirmacao)</button>
          <button type="button" className="modelo-btn modelo-btn-cancel-dark modelo-btn-action-size">Secundario (cancelamento)</button>
          <button type="button" className="modelo-btn modelo-btn-tertiary modelo-btn-action-size">Terciario (acoes)</button>
        </div>
      </section>

      <section className="modelo-base-panel">
        <div className="modelo-base-panel-title">Aba</div>
        <div className="modelo-base-tabs" role="tablist" aria-label="Exemplo de abas">
          <button
            type="button"
            className={`modelo-base-tab ${activeTab === 'cadastro' ? 'active' : ''}`}
            onClick={() => setActiveTab('cadastro')}
            role="tab"
            aria-selected={activeTab === 'cadastro'}
          >
            Cadastro
          </button>
          <button
            type="button"
            className={`modelo-base-tab ${activeTab === 'grid' ? 'active' : ''}`}
            onClick={() => setActiveTab('grid')}
            role="tab"
            aria-selected={activeTab === 'grid'}
          >
            Grid Cadastro sem Scroll
          </button>
          <button
            type="button"
            className={`modelo-base-tab ${activeTab === 'step' ? 'active' : ''}`}
            onClick={() => setActiveTab('step')}
            role="tab"
            aria-selected={activeTab === 'step'}
          >
            Step
          </button>
        </div>

        {activeTab === 'cadastro' && (
          <div className="modelo-base-content modelo-cadastro-content">
            <div className="modelo-cadastro-topbar">
              <h2 className="modelo-grid-screen-title">Exemplo de Cadastro</h2>
              <div className="modelo-cadastro-topbar-actions">
                <button type="button" className="modelo-btn modelo-btn-tertiary modelo-btn-sm modelo-cadastro-topbar-btn modelo-group-left">Sair</button>
                <button type="button" className="modelo-btn modelo-btn-tertiary modelo-btn-sm modelo-cadastro-topbar-btn modelo-group-right">Exemplo botao</button>
              </div>
            </div>

            <div className="modelo-cadastro-fields">
              <div className="modelo-toolbar-filter modelo-toolbar-filter-left modelo-cadastro-filter-left">
                <label htmlFor="cadastro-edit-left">Text</label>
                <input
                  id="cadastro-edit-left"
                  type="text"
                  value={cadastroLeftText}
                  onChange={(e) => setCadastroLeftText(e.target.value)}
                  placeholder="Digite o texto"
                />
              </div>

              <div className="modelo-toolbar-filter modelo-toolbar-filter-left modelo-cadastro-filter-left">
                <label htmlFor="cadastro-edit-required" className="required">Text obrigatorio</label>
                <input
                  id="cadastro-edit-required"
                  type="text"
                  value={cadastroLeftRequired}
                  className={requiredTouched.left && !cadastroLeftRequired.trim() ? 'modelo-required-invalid' : ''}
                  onBlur={() => setRequiredTouched((prev) => ({ ...prev, left: true }))}
                  onChange={(e) => setCadastroLeftRequired(e.target.value)}
                  placeholder="Campo obrigatorio"
                />
                {requiredTouched.left && !cadastroLeftRequired.trim() && (
                  <span className="modelo-required-message">Text obrigatorio Obrigatorio</span>
                )}
              </div>

              <div className="modelo-toolbar-filter modelo-toolbar-filter-top modelo-cadastro-filter-top">
                <label htmlFor="cadastro-edit-top-required" className="required">Text em cima obrigatorio</label>
                <input
                  id="cadastro-edit-top-required"
                  type="text"
                  value={cadastroTopRequired}
                  className={requiredTouched.top && !cadastroTopRequired.trim() ? 'modelo-required-invalid' : ''}
                  onBlur={() => setRequiredTouched((prev) => ({ ...prev, top: true }))}
                  onChange={(e) => setCadastroTopRequired(e.target.value)}
                  placeholder="Campo obrigatorio"
                />
                {requiredTouched.top && !cadastroTopRequired.trim() && (
                  <span className="modelo-required-message">Text em cima obrigatorio Obrigatorio</span>
                )}
              </div>
            </div>

            <div className="modelo-base-form-grid modelo-cadastro-legacy-fields">
              <div className="modelo-field">
                <label htmlFor="modelo-edit">Edit</label>
                <div className="modelo-input-with-action">
                  <input
                    id="modelo-edit"
                    type="text"
                    value={editValue}
                    onKeyDown={(e) => {
                      if (e.key === 'F4') {
                        e.preventDefault()
                        handleEditLookup()
                      }
                    }}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Digite um valor"
                  />
                  <button
                    type="button"
                    className="modelo-icon-btn"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleEditLookup}
                    aria-label="Consultar prompt do campo edit"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="modelo-field">
                <label htmlFor="modelo-suggest">Suggest</label>
                <div className="modelo-input-with-action">
                  <input
                    id="modelo-suggest"
                    ref={suggestInputRef}
                    type="text"
                    value={suggestValue}
                    onKeyDown={(e) => {
                      if (e.key === 'F4') {
                        e.preventDefault()
                        handleSuggestLookup()
                      }
                    }}
                    onFocus={() => {
                      if (suggestDirty && suggestGridItems.length > 0) setSuggestPanelOpen(true)
                    }}
                    onChange={(e) => {
                      const next = e.target.value
                      setSuggestValue(next)
                      setSuggestDirty(true)
                      setSuggestPanelOpen(next.trim().length > 0)
                    }}
                    placeholder="Valores de exemplo"
                  />
                  <button
                    type="button"
                    className="modelo-icon-btn"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleSuggestLookup}
                    aria-label="Consultar prompt do campo suggest"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                  </button>
                  {suggestPanelOpen && suggestGridItems.length > 0 && (
                    <div className="modelo-suggest-grid-popover" ref={suggestPanelRef}>
                      <div className="modelo-suggest-grid-head">
                        <span>Codigo</span>
                        <span>Descricao</span>
                      </div>
                      <div className="modelo-suggest-grid-body">
                        {suggestGridItems.map((item) => (
                          <button
                            key={`${item.codigo}-${item.id}`}
                            type="button"
                            className="modelo-suggest-grid-row"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setSuggestValue(item.descricao)
                              setSuggestDirty(false)
                              setSuggestPanelOpen(false)
                            }}
                          >
                            <span>{item.codigo}</span>
                            <span>{item.descricao}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modelo-field">
                <label htmlFor="modelo-combo">Combo</label>
                <select id="modelo-combo" value={comboValue} onChange={(e) => setComboValue(e.target.value)}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="bloqueado">Bloqueado</option>
                </select>
              </div>

              <div className="modelo-field modelo-field-inline">
                <label htmlFor="modelo-checkbox">Checkbox</label>
                <input
                  id="modelo-checkbox"
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                />
              </div>

              <div className="modelo-field">
                <label htmlFor="modelo-data">Campo data</label>
                <input
                  id="modelo-data"
                  type="date"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                />
              </div>
            </div>

            <div className="modelo-base-panel modelo-cadastro-phone-panel">
              <div className="modelo-base-panel-title">Telefone/Contato</div>
              <div className="modelo-cadastro-phone-panel-body">
                <div className="modelo-cadastro-grid-wrap">
                  <table className="modelo-grid modelo-cadastro-grid-level">
                    <thead>
                      <tr>
                        <th className="modelo-cadastro-col-action" />
                        <th className="modelo-cadastro-col-id">ID</th>
                        <th>Tipo Telefone</th>
                        <th>Operadora</th>
                        <th>Numero</th>
                        <th>Departamento</th>
                        <th>Contato</th>
                        <th>Data Nascimento</th>
                        <th>Financ.</th>
                        <th>Comer.</th>
                        <th>Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phoneRows.map((row) => (
                        <tr key={row.id} className={row.locked ? 'is-locked' : ''}>
                          <td>
                            <button
                              type="button"
                              className={`modelo-row-toggle-btn ${row.locked ? 'is-restore' : 'is-remove'}`}
                              onClick={() => togglePhoneRowLock(row.id)}
                              aria-label={row.locked ? `Restaurar linha ${row.id}` : `Remover linha ${row.id}`}
                            >
                              {row.locked ? '+' : '×'}
                            </button>
                          </td>
                          <td>{row.id}</td>
                          <td>
                            <select
                              value={row.tipoTelefone}
                              disabled={row.locked}
                              onChange={(e) => updatePhoneRow(row.id, { tipoTelefone: e.target.value })}
                            >
                              <option value="COMERCIAL">COMERCIAL</option>
                              <option value="RESIDENCIAL">RESIDENCIAL</option>
                              <option value="CELULAR">CELULAR</option>
                            </select>
                          </td>
                          <td>
                            <select
                              value={row.operadora}
                              disabled={row.locked}
                              onChange={(e) => updatePhoneRow(row.id, { operadora: e.target.value })}
                            >
                              <option value="FIXO">FIXO</option>
                              <option value="MOVEL">MOVEL</option>
                              <option value="VOIP">VOIP</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.numero}
                              disabled={row.locked}
                              onChange={(e) => updatePhoneRow(row.id, { numero: e.target.value })}
                              placeholder="(99) 99999-9999"
                            />
                          </td>
                          <td>
                            <select
                              value={row.departamento}
                              disabled={row.locked}
                              onChange={(e) => updatePhoneRow(row.id, { departamento: e.target.value })}
                            >
                              <option value="Geral (Ambos)">Geral (Ambos)</option>
                              <option value="Financeiro">Financeiro</option>
                              <option value="Comercial">Comercial</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.contato}
                              disabled={row.locked}
                              onChange={(e) => updatePhoneRow(row.id, { contato: e.target.value })}
                              placeholder="Ex. Sr Afonso"
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              value={row.dataNascimento}
                              disabled={row.locked}
                              onChange={(e) => updatePhoneRow(row.id, { dataNascimento: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={row.financ}
                              disabled={row.locked}
                              onChange={(e) => updatePhoneRow(row.id, { financ: e.target.checked })}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={row.comer}
                              disabled={row.locked}
                              onChange={(e) => updatePhoneRow(row.id, { comer: e.target.checked })}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={row.nota}
                              disabled={row.locked}
                              onChange={(e) => updatePhoneRow(row.id, { nota: e.target.checked })}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="modelo-cadastro-grid-actions">
                  <button
                    type="button"
                    className="modelo-cadastro-add-row"
                    onClick={addPhoneRow}
                  >
                    [Adicionar Fone]
                  </button>
                </div>
              </div>
            </div>

            <div className="modelo-cadastro-footer-actions">
              <button type="button" className="modelo-btn modelo-btn-primary modelo-cadastro-footer-btn">Confirmar</button>
              <button type="button" className="modelo-btn modelo-btn-cancel-dark modelo-cadastro-footer-btn">Fechar</button>
            </div>
          </div>
        )}

        {activeTab === 'grid' && (
          <div className="modelo-base-content modelo-grid-section">
              <div className="modelo-grid-topbar">
                <div className="modelo-grid-title-actions-left">
                  <h2 className="modelo-grid-screen-title">Grid sem Scroll</h2>
                  <div className="modelo-grid-action-group">
                    <button type="button" className="modelo-btn modelo-btn-primary modelo-btn-sm modelo-group-left">Inserir</button>
                    <button
                      type="button"
                      className="modelo-btn modelo-btn-secondary modelo-btn-sm modelo-group-right modelo-actions-trigger"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const popoverWidth = 220
                        const margin = 10
                        const left = Math.min(Math.max(rect.left, margin), window.innerWidth - popoverWidth - margin)
                        actionsTriggerRef.current = e.currentTarget
                        setActionsMenuPosition({ top: rect.bottom + 4, left })
                        setShowActionsMenu((prev) => !prev)
                      }}
                    >
                      Ações
                    </button>
                  </div>
                </div>

                <div className="modelo-grid-title-actions-right">
                  <span className="modelo-ord-label">Ord.</span>
                  <select className="modelo-compact-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
                    <option value="razaoSocial">Razao Social</option>
                    <option value="ufCidade">UF/Cidade</option>
                    <option value="cpfCnpj">CPF/CNPJ</option>
                    <option value="fone">Fone</option>
                    <option value="id">Cli.</option>
                  </select>
                  <select className="modelo-compact-select" value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)}>
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                  </select>
                </div>
              </div>

              <div className="modelo-grid-toolbar">
                <div className="modelo-grid-toolbar-filters">
                  <div className="modelo-toolbar-filter modelo-toolbar-filter-top">
                    <label htmlFor="quick-nome">Razao Social</label>
                    <input
                      id="quick-nome"
                      type="text"
                      value={quickNome}
                      onChange={(e) => {
                        setQuickNome(e.target.value)
                        setCurrentPage(1)
                      }}
                      placeholder="Filtro Razao Social"
                    />
                  </div>

                  <div className="modelo-toolbar-filter modelo-toolbar-filter-top">
                    <label htmlFor="quick-cidade">UF/Cidade</label>
                    <input
                      id="quick-cidade"
                      type="text"
                      value={quickCidade}
                      onChange={(e) => {
                        setQuickCidade(e.target.value)
                        setCurrentPage(1)
                      }}
                      placeholder="Filtro UF/Cidade"
                    />
                  </div>

                  <div className="modelo-toolbar-filter modelo-toolbar-filter-left">
                    <label htmlFor="quick-cpf">CPF/CNPJ</label>
                    <input
                      id="quick-cpf"
                      type="text"
                      value={quickCpf}
                      onChange={(e) => {
                        setQuickCpf(e.target.value)
                        setCurrentPage(1)
                      }}
                      placeholder="Filtro CPF/CNPJ"
                    />
                  </div>

                  <div className="modelo-toolbar-filter modelo-toolbar-filter-left">
                    <label htmlFor="quick-fone">Fone</label>
                    <input
                      id="quick-fone"
                      type="text"
                      value={quickFone}
                      onChange={(e) => {
                        setQuickFone(e.target.value)
                        setCurrentPage(1)
                      }}
                      placeholder="Filtro Fone"
                    />
                  </div>

                  <div className="modelo-toolbar-filter modelo-toolbar-filter-top">
                    <label htmlFor="quick-id">Cli. (numerico)</label>
                    <input
                      id="quick-id"
                      type="number"
                      value={quickIdInput}
                      onChange={(e) => setQuickIdInput(e.target.value)}
                      onBlur={() => {
                        const normalized = normalizeNumericFilterValue(quickIdInput)
                        setQuickIdInput(normalized)
                        setQuickId(normalized)
                        setCurrentPage(1)
                      }}
                      placeholder="Id"
                    />
                  </div>
                </div>
              </div>

              <div className="modelo-grid-more-row">
                <button
                  type="button"
                  className="modelo-btn modelo-btn-secondary modelo-btn-sm modelo-more-filters-btn"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const popoverWidth = 440
                    const margin = 10
                    const left = Math.min(Math.max(rect.left, margin), window.innerWidth - popoverWidth - margin)
                    moreFiltersTriggerRef.current = e.currentTarget
                    setMoreFiltersPosition({ top: rect.bottom + 6, left })
                    setShowMoreFiltersModal(true)
                  }}
                >
                  Mais filtros
                </button>

                {appliedAdvancedFilters.length > 0 && (
                  <div className="modelo-applied-filters-list">
                    {appliedAdvancedFilters.map((chip) => (
                      <span key={chip.key} className="modelo-applied-filter-chip">
                        {chip.label}
                        <button
                          type="button"
                          className="modelo-chip-remove"
                          onClick={() => {
                            if (chip.key === 'status') { setAdvancedStatus('Todos'); setAdvancedStatusDraft('Todos') }
                            else { setAdvancedCli('Todos'); setAdvancedCliDraft('Todos') }
                            setCurrentPage(1)
                          }}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="modelo-grid-wrap">
                <table className="modelo-grid">
                  <thead>
                    <tr>
                      <th className="modelo-grid-col-edit" />
                      {visibleColumns.razaoSocial && (
                      <th>
                        <div className="modelo-grid-head-content">
                          <span>Razao Social</span>
                          <button type="button" className={`modelo-grid-filter-icon ${hasColumnFilter('razaoSocial') ? 'active' : ''} ${isSortedColumn('razaoSocial') ? 'sorted' : ''}`} onClick={(e) => openColumnFilter('razaoSocial', e.currentTarget)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16l-6 7v6l-4 1v-7z" /></svg>
                            {isSortedColumn('razaoSocial') && <span className="modelo-grid-sort-indicator">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                          </button>
                        </div>
                      </th>
                      )}
                      {visibleColumns.id && (
                      <th>
                        <div className="modelo-grid-head-content">
                          <span>Cli.</span>
                          <button type="button" className={`modelo-grid-filter-icon ${hasColumnFilter('id') ? 'active' : ''} ${isSortedColumn('id') ? 'sorted' : ''}`} onClick={(e) => openColumnFilter('id', e.currentTarget)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16l-6 7v6l-4 1v-7z" /></svg>
                            {isSortedColumn('id') && <span className="modelo-grid-sort-indicator">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                          </button>
                        </div>
                      </th>
                      )}
                      {visibleColumns.ufCidade && (
                      <th>
                        <div className="modelo-grid-head-content">
                          <span>UF/Cidade</span>
                          <button type="button" className={`modelo-grid-filter-icon ${hasColumnFilter('ufCidade') ? 'active' : ''} ${isSortedColumn('ufCidade') ? 'sorted' : ''}`} onClick={(e) => openColumnFilter('ufCidade', e.currentTarget)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16l-6 7v6l-4 1v-7z" /></svg>
                            {isSortedColumn('ufCidade') && <span className="modelo-grid-sort-indicator">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                          </button>
                        </div>
                      </th>
                      )}
                      {visibleColumns.cpfCnpj && (
                      <th>
                        <div className="modelo-grid-head-content">
                          <span>Cpf/Cnpj</span>
                          <button type="button" className={`modelo-grid-filter-icon ${hasColumnFilter('cpfCnpj') ? 'active' : ''} ${isSortedColumn('cpfCnpj') ? 'sorted' : ''}`} onClick={(e) => openColumnFilter('cpfCnpj', e.currentTarget)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16l-6 7v6l-4 1v-7z" /></svg>
                            {isSortedColumn('cpfCnpj') && <span className="modelo-grid-sort-indicator">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                          </button>
                        </div>
                      </th>
                      )}
                      {visibleColumns.fone && (
                      <th>
                        <div className="modelo-grid-head-content">
                          <span>Fone</span>
                          <button type="button" className={`modelo-grid-filter-icon ${hasColumnFilter('fone') ? 'active' : ''} ${isSortedColumn('fone') ? 'sorted' : ''}`} onClick={(e) => openColumnFilter('fone', e.currentTarget)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16l-6 7v6l-4 1v-7z" /></svg>
                            {isSortedColumn('fone') && <span className="modelo-grid-sort-indicator">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                          </button>
                        </div>
                      </th>
                      )}
                      <th className="modelo-grid-col-action" />
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map((row) => (
                      <tr
                        key={row.id}
                        className={selectedRowId === row.id ? 'selected' : ''}
                        onClick={() => setSelectedRowId(row.id)}
                      >
                        <td>
                          <button type="button" className="modelo-edit-icon" aria-label={`Editar ${row.razaoSocial}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>
                        </td>
                        {visibleColumns.razaoSocial && (
                          <td>
                            {row.razaoSocialLink ? (
                              <a
                                href={row.razaoSocialLink}
                                target="_blank"
                                rel="noreferrer"
                                className="modelo-grid-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {row.razaoSocial}
                              </a>
                            ) : (
                              row.razaoSocial
                            )}
                          </td>
                        )}
                        {visibleColumns.id && (
                        <td>
                          <input type="checkbox" checked={row.cli} readOnly className="modelo-grid-readonly-check" />
                        </td>
                        )}
                        {visibleColumns.ufCidade && <td>{row.ufCidade}</td>}
                        {visibleColumns.cpfCnpj && <td>{row.cpfCnpj}</td>}
                        {visibleColumns.fone && <td>{row.fone}</td>}
                        <td>
                          <select defaultValue="" onClick={(e) => e.stopPropagation()}>
                            <option value="" disabled hidden>O que Fazer</option>
                            <option value="editar">Editar</option>
                            <option value="detalhes">Ver detalhes</option>
                            <option value="inativar">Inativar</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {pagedRows.length === 0 && (
                      <tr>
                        <td colSpan={2 + Number(visibleColumns.razaoSocial) + Number(visibleColumns.id) + Number(visibleColumns.ufCidade) + Number(visibleColumns.cpfCnpj) + Number(visibleColumns.fone)} className="modelo-grid-empty">Nenhum registro encontrado</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="modelo-grid-footer">
                <div className="modelo-grid-page-summary-wrap">
                  <button type="button" className="modelo-grid-page-summary" onClick={() => setShowPageControl((v) => !v)}>
                    Pagina {safeCurrentPage} de {totalPages}
                  </button>
                  {showPageControl && (
                    <>
                    <div className="modelo-page-control-overlay" onClick={() => setShowPageControl(false)} />
                    <div className="modelo-grid-page-control-popover">
                      <div className="modelo-grid-page-control-title">Registros por pagina:</div>
                      <div className="modelo-grid-page-size-list">
                        {[5, 10, 15, 20, 50].map((size) => (
                          <button
                            key={size}
                            type="button"
                            className={size === pageSize ? 'active' : ''}
                            onClick={() => {
                              setPageSize(size)
                              setCurrentPage(1)
                              setShowPageControl(false)
                            }}
                          >
                            {size} linhas
                          </button>
                        ))}
                      </div>
                      <div className="modelo-grid-goto">
                        <span>Va para a pagina:</span>
                        <div>
                          <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={gotoPageInput}
                            onChange={(e) => setGotoPageInput(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const target = Number(gotoPageInput)
                              if (!Number.isFinite(target)) return
                              const clamped = Math.min(Math.max(target, 1), totalPages)
                              setCurrentPage(clamped)
                              setShowPageControl(false)
                            }}
                          >
                            Ir
                          </button>
                        </div>
                      </div>
                    </div>
                    </>
                  )}
                </div>

                <div className="modelo-grid-pager">
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
          </div>
        )}

        {activeTab === 'step' && (
          <div className="modelo-base-content modelo-step-content">
            <div className="modelo-step-track">
              {[
                { num: 1, label: 'Destino / Transp.' },
                { num: 2, label: 'Produtos' },
                { num: 3, label: 'Cobranca / Totais' },
                { num: 4, label: 'Transmissao' },
              ].map((step) => (
                <div
                  key={step.num}
                  className={`modelo-step-item ${
                    currentStep === step.num ? 'active' : currentStep > step.num ? 'done' : ''
                  }`}
                >
                  <span className="modelo-step-circle">
                    {currentStep > step.num ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 4 4 10-10" />
                      </svg>
                    ) : (
                      step.num
                    )}
                  </span>
                  <span className="modelo-step-label">{step.label}</span>
                </div>
              ))}
            </div>

            <div className="modelo-step-panel">
              {currentStep === 1 && (
                <div className="modelo-step-panel-body">
                  <h3 className="modelo-step-panel-title">Destino / Transportadora</h3>
                  <p className="modelo-step-panel-desc">Informe o destinatario e os dados de transporte.</p>
                </div>
              )}
              {currentStep === 2 && (
                <div className="modelo-step-panel-body">
                  <h3 className="modelo-step-panel-title">Produtos</h3>
                  <p className="modelo-step-panel-desc">Adicione os itens e quantidades do pedido.</p>
                </div>
              )}
              {currentStep === 3 && (
                <div className="modelo-step-panel-body">
                  <h3 className="modelo-step-panel-title">Cobranca / Totais</h3>
                  <p className="modelo-step-panel-desc">Confira os totais, impostos e condicoes de pagamento.</p>
                </div>
              )}
              {currentStep === 4 && (
                <div className="modelo-step-panel-body">
                  <h3 className="modelo-step-panel-title">Transmissao</h3>
                  <p className="modelo-step-panel-desc">Revise e transmita o documento fiscal.</p>
                </div>
              )}
            </div>

            <div className="modelo-step-footer">
              <button
                type="button"
                className="modelo-btn modelo-btn-cancel-dark modelo-btn-action-size"
                disabled={currentStep <= 1}
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              >
                Anterior
              </button>
              <button
                type="button"
                className="modelo-btn modelo-btn-primary modelo-btn-action-size"
                disabled={currentStep >= 4}
                onClick={() => setCurrentStep((s) => Math.min(4, s + 1))}
              >
                Proximo
              </button>
            </div>
          </div>
        )}
      </section>

      {columnFilterModal && (
        <div
          className="modelo-popover-window"
          style={{ top: columnFilterPosition.top, left: columnFilterPosition.left, width: 'min(420px, calc(100vw - 20px))' }}
          ref={columnPopoverRef}
        >
            <div className="modelo-modal-title">Filtro da coluna: {columnLabel[columnFilterModal.column]}</div>
            <div className="modelo-modal-body">
              <div className="modelo-field">
                <label htmlFor="modal-col-search">Pesquisar</label>
                <input
                  id="modal-col-search"
                  type={columnFilterModal.column === 'id' ? 'number' : 'text'}
                  value={columnFilterModal.searchDraft}
                  onChange={(e) => {
                    const value = e.target.value
                    setColumnFilterModal((prev) => (prev ? { ...prev, searchDraft: value } : prev))
                  }}
                />
              </div>
              <div className="modelo-field">
                <label>Ordenacao</label>
                <div className="modelo-order-toggle" role="radiogroup" aria-label="Ordenacao da coluna">
                  <button
                    type="button"
                    className={columnFilterModal.orderDraft === 'asc' ? 'active' : ''}
                    role="radio"
                    aria-checked={columnFilterModal.orderDraft === 'asc'}
                    onClick={() => setColumnFilterModal((prev) => (prev ? { ...prev, orderDraft: 'asc' } : prev))}
                  >
                    ↑ Crescente
                  </button>
                  <button
                    type="button"
                    className={columnFilterModal.orderDraft === 'desc' ? 'active' : ''}
                    role="radio"
                    aria-checked={columnFilterModal.orderDraft === 'desc'}
                    onClick={() => setColumnFilterModal((prev) => (prev ? { ...prev, orderDraft: 'desc' } : prev))}
                  >
                    ↓ Decrescente
                  </button>
                </div>
              </div>
            </div>
            <div className="modelo-modal-actions">
              <button
                type="button"
                className="modelo-btn modelo-btn-primary"
                onClick={() => {
                  if (!columnFilterModal) return
                  const normalizedSearch = columnFilterModal.column === 'id'
                    ? normalizeNumericFilterValue(columnFilterModal.searchDraft)
                    : columnFilterModal.searchDraft
                  setColumnFilters((prev) => ({ ...prev, [columnFilterModal.column]: normalizedSearch }))
                  if (columnFilterModal.orderDraft !== 'none') {
                    setSortBy(columnFilterModal.column as SortBy)
                    setSortDir(columnFilterModal.orderDraft)
                  }
                  setCurrentPage(1)
                  setColumnFilterModal(null)
                }}
              >
                Confirmar
              </button>
              <button
                type="button"
                className="modelo-btn modelo-btn-secondary"
                onClick={() => {
                  if (!columnFilterModal) return
                  setColumnFilterModal((prev) => (prev ? { ...prev, searchDraft: '', orderDraft: 'none' } : prev))
                  setColumnFilters((prev) => ({ ...prev, [columnFilterModal.column]: '' }))
                  setCurrentPage(1)
                }}
              >
                Limpar
              </button>
            </div>
        </div>
      )}

      {showMoreFiltersModal && (
        <div
          className="modelo-popover-window"
          style={{ top: moreFiltersPosition.top, left: moreFiltersPosition.left, width: 'min(440px, calc(100vw - 20px))' }}
          ref={moreFiltersPopoverRef}
        >
            <div className="modelo-modal-title">Mais filtros</div>
            <div className="modelo-modal-body modelo-advanced-filters-grid">
              <div className="modelo-field">
                <label htmlFor="adv-status">Status</label>
                <select
                  id="adv-status"
                  value={advancedStatusDraft}
                  onChange={(e) => setAdvancedStatusDraft(e.target.value as 'Todos' | 'Ativo' | 'Inativo')}
                >
                  <option value="Todos">Todos</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
              <div className="modelo-field">
                <label htmlFor="adv-cli">Cli</label>
                <select
                  id="adv-cli"
                  value={advancedCliDraft}
                  onChange={(e) => setAdvancedCliDraft(e.target.value as 'Todos' | 'Sim' | 'Nao')}
                >
                  <option value="Todos">Todos</option>
                  <option value="Sim">Sim</option>
                  <option value="Nao">Nao</option>
                </select>
              </div>
            </div>
            <div className="modelo-modal-actions">
              <button
                type="button"
                className="modelo-btn modelo-btn-primary"
                onClick={() => {
                  setAdvancedStatus(advancedStatusDraft)
                  setAdvancedCli(advancedCliDraft)
                  setCurrentPage(1)
                  setShowMoreFiltersModal(false)
                }}
              >
                Confirmar
              </button>
              <button
                type="button"
                className="modelo-btn modelo-btn-secondary"
                onClick={() => {
                  setAdvancedStatusDraft('Todos')
                  setAdvancedCliDraft('Todos')
                  setAdvancedStatus('Todos')
                  setAdvancedCli('Todos')
                  setCurrentPage(1)
                }}
              >
                Limpar
              </button>
            </div>
        </div>
      )}

      {showColumnSelectorModal && (
        <div
          className="modelo-popover-window"
          style={{ top: columnSelectorPosition.top, left: columnSelectorPosition.left, width: 'min(420px, calc(100vw - 20px))' }}
          ref={columnSelectorPopoverRef}
        >
          <div className="modelo-modal-title">Seletor de colunas</div>
          <div className="modelo-modal-body modelo-column-selector-grid">
            {(Object.keys(columnLabel) as ColumnFilterKey[]).map((column) => {
              const locked = NON_REMOVABLE_COLUMNS.includes(column)
              return (
                <label key={column} className={`modelo-column-selector-item ${locked ? 'locked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={visibleColumnsDraft[column]}
                    disabled={locked}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setVisibleColumnsDraft((prev) => ({ ...prev, [column]: checked || locked }))
                    }}
                  />
                  <span>{columnLabel[column]}{locked ? ' (fixa)' : ''}</span>
                </label>
              )
            })}
          </div>
          <div className="modelo-modal-actions">
            <button
              type="button"
              className="modelo-btn modelo-btn-primary"
              onClick={() => {
                setVisibleColumns(visibleColumnsDraft)
                setShowColumnSelectorModal(false)
              }}
            >
              Confirmar
            </button>
            <button
              type="button"
              className="modelo-btn modelo-btn-secondary"
              onClick={() => {
                setVisibleColumnsDraft({
                  id: true,
                  razaoSocial: true,
                  ufCidade: true,
                  cpfCnpj: true,
                  fone: true,
                })
              }}
            >
              Limpar
            </button>
          </div>
        </div>
      )}

      {showActionsMenu && (
        <div
          className="modelo-actions-menu-popover"
          style={{ top: actionsMenuPosition.top, left: actionsMenuPosition.left }}
          ref={actionsMenuPopoverRef}
        >
          <button
            type="button"
            className="modelo-actions-menu-item"
            onClick={() => {
              exportGridToExcel()
              setShowActionsMenu(false)
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 7a2 2 0 0 1 2-2h7l5 5v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7z" /><path d="M9 12h6M9 16h6" /></svg>
            Exportar Excel
          </button>
          <button
            type="button"
            className="modelo-actions-menu-item"
            onClick={() => {
              exportGridToPdf()
              setShowActionsMenu(false)
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5" /><path d="M6 18h12" /><path d="M6 14h12" /><rect x="4" y="9" width="16" height="10" rx="2" /></svg>
            Exportar PDF
          </button>
          <button
            type="button"
            className="modelo-actions-menu-item"
            onClick={() => {
              if (!actionsTriggerRef.current) return
              openColumnSelector(actionsTriggerRef.current)
              setShowActionsMenu(false)
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h10" /><circle cx="18" cy="18" r="2" /></svg>
            Seletor de colunas
          </button>
        </div>
      )}

      {showEditPrompt && (
        <ModeloBasePrompt
          asModal
          onClose={() => setShowEditPrompt(false)}
          onSelectCode={(codigo: string) => {
            setEditValue(codigo)
            setShowEditPrompt(false)
          }}
        />
      )}
    </div>
  )
}

export default ModeloBase
