# Comandos do Agente: Migração de Telas

Documento orientado a **agentes de IA** que executam a migração de telas GeneXus para React + NestJS. Consulte também `METODOLOGIA_MIGRACAO_TELAS.md` e `TEMPLATE_ANALISE_TELA.md`.

---

## 1. Princípio fundamental

**Sempre que migrarmos uma tela, localizamos sua correspondente no legado GeneXus.** A tela nova (React) deve refletir a mesma estrutura, campos, filtros, validações e regras de negócio da tela legada. O legado é a fonte de verdade.

---

## 2. Comandos do fluxo de migração

### 2.1 Localizar a tela no legado

```
COMANDO: Localizar arquivos GeneXus correspondentes à tela XxxWW

AÇÕES:
1. Procurar em Genexus/telas/ por:
   - XxxWW.xml              (listagem)
   - XxxWWWorkWithPlus.xml  (config da listagem)
   - wpXxx.xml             (formulário de cadastro)
   - wpXxxWorkWithPlus.xml (config do formulário)
2. Procurar em Genexus/procedimentos/ por prcWWXxx.gx (regras Insert/Update/Delete)
3. Procurar em Genexus/transacoes/ por Xxx.xml (atributos da entidade)
4. Procurar prompts em Genexus/telas/ (ex: XxxPrompt*.xml)

MAPEAMENTO COMUM:
- AssociadoWW → wpPessoa (form) + Pessoa (tabela)
- MedidorWW → wpMedidor + Medidor
- CidadeWW → wpCidade + Cidade
- WorkWithPlus usa prefixo "WW", formulários usam "wp"
```


### 2.2 Analisar telas e formulários XML

```
COMANDO: Analisar wpXxx.xml e wpXxxWorkWithPlus.xml

AÇÕES:
1. Identificar todas as variáveis/atributos no formulário
2. Identificar abas (tabs) e painéis (panels)
3. Identificar campos obrigatórios (RequiredDataContentCell, inviteMessage)
4. Identificar prompts (xCellUserActionPrompt, controlType="Dynamic Combo Box")
5. Mapear domínios para enums (ex: PesTip F/J → TIPO_PESSOA_OPTS)
6. Verificar labels e placeholders
```

### 2.3 Implementar backend

```
COMANDO: Implementar ou estender backend para a entidade Xxx

ARQUIVOS:
- backend/src/xxx/xxx.controller.ts  (GET, POST, PUT, DELETE)
- backend/src/xxx/xxx.service.ts     (list, getById, create, update, delete)
- backend/src/xxx/xxx.module.ts      (importa PrismaModule)

REGRAS:
- Usar empCod do JWT para isolamento por empresa
- List com filtros, paginação, ordenação
- getById retorna todos os campos necessários no formulário
- create/update: mapear DTO para model Prisma
- delete: hard ou soft conforme prcWWXxx.gx
- JOIN com tabelas relacionadas quando necessário (ex: Cidade para cidNom)
```

### 2.4 Implementar API e tipos no frontend

```
COMANDO: Implementar frontend/src/api/xxxApi.ts

INCLUIR:
- Interfaces: XxxRow, XxxFormDto, XxxListParams, XxxListResult
- Funções: fetchXxxList, fetchXxxById, createXxx, updateXxx, deleteXxx
- Usar pesCod/cidCod/etc (chave real) em rotas, não "id" genérico
```

### 2.5 Implementar listagem

```
COMANDO: Implementar Xxx.tsx (listagem)

REFERÊNCIA: frontend/src/features/unidade-consumidora/UnidadeConsumidora.tsx

CHECKLIST:
- Header com botão "Nova X" e título
- Painel de filtros com todos os atributos do legado
- Persistir filtros em localStorage (empCod + pesGamGUID)
- Grid com colunas na ordem do GeneXus
- Paginação
- Botão editar com encodeId(row.xxxCod)
- Linha vazia quando não houver registros
```

### 2.6 Implementar formulário

```
COMANDO: Implementar XxxForm.tsx (cadastro)

REFERÊNCIA: frontend/src/features/unidade-consumidora/UnidadeConsumidoraForm.tsx
OU: frontend/src/features/associado/AssociadoForm.tsx (quando houver tabs e painéis)

CHECKLIST:
- Breadcrumb + Header com título e status
- Tabs verticais se houver seções no GeneXus
- Painéis (form-panel) para grupos de campos
- Campos condicionais (ex: PF vs PJ, conforme PesTip)
- FormFieldPrompt para CEP, Banco, Pessoa, etc.
- decodeId com fallback numérico para URLs
- handleFormKeyDown (Enter = próximo campo)
- Botões: Voltar (fa-arrow-left), Confirmar (fa-check), Excluir (fa-trash, form-btn-danger)
- Validações alinhadas ao procedimento
```

### 2.7 Registrar rotas e atualizar status

```
COMANDO: Registrar tela no App e marcar como concluída

AÇÕES:
1. Em frontend/src/App.tsx: adicionar Route para /XxxWW (index + novo + :id)
2. Em docs/TELAS_MIGRACAO.md: atualizar status da tela para ✅
```

---

## 3. Alterações frequentes durante a migração

| Situação | Ação |
|----------|------|
| **Campo no formulário legado não existe no Prisma** | Verificar schema; adicionar coluna ou omitir no MVP |
| **Filtro por ID numérico na URL** | Usar `encodeId`/`decodeId` (não expor ID bruto) |
| **Fallback para URL numérica** | `decodeId` + `numericFallback` quando param é `^\d+$` |
| **Data YYYY-MM-DD como UTC** | Em `formatDateDisplay`, tratar `YYYY-MM-DD` sem conversão de timezone |
| **Botão Excluir sem cor vermelha** | Usar `form-btn-danger`; excluir de override no DashboardLayout (`:not(.form-btn-danger)`) |
| **Combo sem API (ex: GrupoImposto)** | Input numérico temporário ou criar endpoint de listagem |
| **PK composta (EmpCod + XxxCod)** | Backend filtra por empCod; rota usa xxxCod |
| **JOIN para exibir nome (ex: Cidade)** | Incluir no SELECT do list e getById |
| **Campos condicionais (PF vs PJ)** | Mostrar/ocultar conforme tipo; validação diferenciada |
| **Prompts (CEP, Banco, Pessoa)** | FormFieldPrompt + componente PromptXxx existente |
| **Erro \|\| e ?? misturados** | Usar parênteses: `(a \|\| b) ?? c` ou `(a \|\| b) \|\| c` |

---

## 4. Padrões de nomenclatura

| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| Rotas | /XxxWW, /XxxWW/novo, /XxxWW/:id | /AssociadoWW, /AssociadoWW/1 |
| Componentes | Xxx.tsx, XxxForm.tsx | Associado.tsx, AssociadoForm.tsx |
| API | /xxx (plural) | /associado |
| Chave na URL | xxxCod, pesCod, cidCod | pesCod para Pessoa |
| localStorage filtros | seja:xxx-ww-filters:empCod:pesGamGUID | seja:list-ww-filters:1:mod-1 |

---

## 5. Ordem sugerida de execução (por tela)

1. **Localizar** → Arquivos GeneXus (XxxWW, wpXxx, prcWWXxx)
2. **Analisar** → Campos, filtros, validações, prompts
3. **Backend** → Service, Controller, Module
4. **API** → xxxApi.ts com tipos
5. **Listagem** → Xxx.tsx
6. **Formulário** → XxxForm.tsx (com tabs/painéis se necessário)
7. **Registrar** → App.tsx, TELAS_MIGRACAO.md

---

## 6. Referências rápidas

- **Metodologia completa:** `docs/METODOLOGIA_MIGRACAO_TELAS.md`
- **Template de análise:** `docs/TEMPLATE_ANALISE_TELA.md`
- **Listagem de telas:** `docs/TELAS_MIGRACAO.md`
- **Listagem referência:** `frontend/src/features/unidade-consumidora/UnidadeConsumidora.tsx`
- **Formulário referência:** `frontend/src/features/associado/AssociadoForm.tsx` ou `UnidadeConsumidoraForm.tsx`