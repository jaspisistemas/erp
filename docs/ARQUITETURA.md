# Arquitetura do Projeto SEJA

Documento que descreve a arquitetura completa do sistema SEJA - Gestão de Cooperativas e Créditos de Energia.

---

## 1. Visão Geral

O SEJA é um **monorepo** para gestão de cooperativas de energia, desenvolvido com foco em migração e evolução a partir de um ERP legado (Genexus). A aplicação é dividida em:

- **Backend**: API REST em NestJS
- **Frontend**: SPA em React
- **Shared**: Código compartilhado entre backend e frontend
- **ERP/Genexus**: Definições e SDTs do sistema legado para referência e integração

---

## 2. Estrutura do Projeto

```
seja/
├── package.json                 # Monorepo root (npm workspaces)
├── backend/                     # API NestJS + Prisma
├── frontend/                    # SPA React + Vite
├── packages/
│   └── shared/                  # @seja/shared - enums, tipos
├── template/                    # Base para novos projetos/migração
├── scripts/                     # Scripts de automação
├── docs/                        # Documentação
├── ERP/
│   └── Genexus/                 # Integração com ERP legado
└── API Cobranca - Collection Geral.postman_collection.json
```

### 2.1. Backend

```
backend/
├── prisma/
│   ├── schema.prisma            # Modelos (SQL Server)
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── prisma/                  # PrismaService
│   ├── auth/                    # Login, JWT, refresh, select-company/module
│   ├── menu/                    # Menus dinâmicos por módulo
│   ├── modules/                 # Módulos/rotinas por perfil
│   ├── unidade-consumidora/
│   ├── nota/                    # NF-e de energia
│   ├── medidor/
│   ├── associado/
│   ├── funcionario/
│   ├── vinculo-beneficiaria/
│   ├── leitura-grupo-b/
│   ├── conta-bancaria/
│   ├── local-cobranca/           # Cobrança + Sicredi
│   ├── webhook-retorno/         # Webhooks externos
│   ├── pendencia/
│   ├── tarifa/
│   ├── bandeira-tarifaria/       # Integração ANEEL
│   ├── cep/                     # ViaCEP
│   ├── bancos/
│   ├── grava-log-dev/
│   └── [cadastros auxiliares: estado, cidade, feriado, classe, contrato, etc.]
└── package.json
```

### 2.2. Frontend

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/                     # Axios, tokenManager, APIs por domínio
│   ├── components/              # AuthGuard, Navbar, Prompts, Modais
│   ├── features/                # Uma pasta por domínio (feature-based)
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── unidade-consumidora/
│   │   ├── medidor/
│   │   ├── nota/
│   │   ├── local-cobranca/
│   │   └── ...
│   ├── layouts/
│   ├── redux/                   # Store, authSlice, hooks
│   └── shared/                  # Estilos, utils, enums
├── vite.config.ts
└── package.json
```

### 2.3. Packages Shared

```
packages/shared/
├── src/
│   └── index.ts                 # APP_NAME, TipoPerfil, StatusCredito, Cooperado
└── package.json
```

---

## 3. Stack Tecnológica

### 3.1. Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| NestJS | 11 | Framework da API |
| Prisma | 6.19 | ORM |
| SQL Server | - | Banco de dados |
| Passport + JWT | - | Autenticação |
| bcrypt | 6 | Hash de senhas |
| class-validator | 0.14 | Validação de DTOs |
| class-transformer | 0.5 | Transformação de objetos |
| pdfkit / @react-pdf/renderer | - | Geração de PDFs |
| qrcode / bwip-js | - | QR Code em boletos |

### 3.2. Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 19 | UI |
| Vite | 7 | Build e dev server |
| React Router | 7 | Roteamento |
| Redux Toolkit | 2.11 | Estado global |
| Axios | 1.13 | HTTP |
| Leaflet | 1.9 | Mapas |
| FontAwesome | 7 | Ícones |

---

## 4. Autenticação e Autorização

### 4.1. Fluxo de Login

1. **POST /auth/login** (`user`, `password`)
2. Backend valida em `Suporte` ou `Pessoa`
3. Retorno: `{ accessToken, refreshToken, user }`
4. Tokens salvos em `localStorage` via `tokenManager`
5. Axios interceptor adiciona `Authorization: Bearer <accessToken>`

### 4.2. Seleção de Contexto (Empresa e Módulo)

Após o login, o usuário precisa selecionar:

1. **Empresa** → `POST /auth/select-company` (`empCod`) → novo token com `empCod` no payload
2. **Módulo** → `POST /auth/select-module` (`moduleId`) → novo token com `activeModuleId` no payload
3. Redirecionamento para `/dashboard` ou rota inicial

### 4.3. Refresh Token

- Em caso de **401**, o interceptor chama `POST /auth/refresh` com o refresh token
- Novo par de tokens é obtido e a requisição original é reenviada
- Se o refresh falhar → logout e redirecionamento para `/login`

### 4.4. Guards no Frontend

| Guard | Exige | Rota exemplo |
|-------|-------|--------------|
| `AuthGuardToken` | Token válido | `/select-empresa` |
| `AuthGuardWithEmpresa` | Token + `empCod` | `/select-module` |
| `AuthGuardFull` | Token + empresa + `activeModuleId` | `/dashboard`, CRUDs |

### 4.5. Autorização no Backend

- **JwtAuthGuard** protege rotas que exigem autenticação
- **JwtPayload** contém: `sub`, `empCod`, `activeCompanyId`, `activeModuleId`, `prfTip`, `prfGamId`
- Perfis: `PerfilAcesso`, `PerfilAcessoUsuarios`
- Rotinas: `Autorizacao` → `Rotina` → `RotinaModulo`
- Menus dinâmicos baseados em `Rotina`, `Menu`, `MenuSubMenu`

### 4.6. Tipos de Perfil (@seja/shared)

```typescript
enum TipoPerfil {
  USUARIO_SISTEMA = 1,
  SUPORTE_USUARIOS = 2,
  SUPORTE_SISTEMA = 3,
}
```

---

## 5. Banco de Dados

### 5.1. Provider

- **SQL Server**
- URL configurada em `SEJA_DATABASE_URL`

### 5.2. Modelos Principais

| Modelo | Descrição |
|--------|-----------|
| `Empresa` | Cooperativas |
| `Pessoa` | Pessoas (usuários, associados) |
| `Suporte` | Usuários de suporte |
| `UnidadeConsumidora` | UCs |
| `Medidor` | Medidores |
| `Nota`, `NotaItem`, `NotaMedidor` | NF-e de energia |
| `Demonstrativo`, `Fatura`, `Faturamento` | Demonstrações e faturas |
| `BandeiraTarifaria` | Bandeiras tarifárias |
| `ContaBancaria`, `LocalCobranca` | Contas e locais de cobrança |
| `PerfilAcesso`, `Autorizacao`, `Rotina`, `Modulo` | Autorização |
| `RefreshToken` | Tokens de refresh |
| `WebhookRetorno` | Webhooks recebidos |
| `EmpresaUsuarios`, `PerfilAcessoUsuarios` | Vínculos de acesso |
| `Cidade`, `Estado`, `Classe`, `Contrato`, etc. | Cadastros auxiliares |

---

## 6. Integrações Externas

### 6.1. APIs Públicas

| Integração | Uso | Endpoint |
|------------|-----|----------|
| **ViaCEP** | Consulta de CEP | `https://viacep.com.br/ws/{cep}/json/` |
| **ANEEL** | Bandeiras tarifárias | API de dados abertos |

### 6.2. Webhooks Recebidos

| Webhook | Uso |
|---------|-----|
| `POST /webhook` | Genérico (parâmetro `tipo`) |
| `POST /webhook/sicredi` | Sicredi (boleto/PIX) |

- Endpoints públicos (sem autenticação)
- Registro em `WebhookRetorno`

---

## 7. Padrões de Código

### 7.1. Módulos NestJS

- Cada domínio em módulo próprio (`*.module.ts`)
- Controller + Service por módulo
- DTOs com `class-validator`
- Prisma como camada de dados

### 7.2. Frontend por Features

- Uma pasta por domínio em `features/`
- Padrão: `NomeFeature.tsx` (listagem) + `NomeFeatureForm.tsx` (formulário)
- Rotas no padrão `*WW` para manter compatibilidade com nomenclatura Genexus

### 7.3. Rotas do Frontend

| Padrão | Exemplo |
|--------|---------|
| Listagem | `/UnidadeConsumidoraWW` |
| Novo | `/UnidadeConsumidoraWW/novo` |
| Edição | `/UnidadeConsumidoraWW/:id` |
| Detalhe | `/NotaWW/:nfeCod` |
| Subrotas | `/LocalCobrancaWW/:empCod/:cbrCod/webhook-sicredi` |

### 7.4. API Client (Axios)

- `apiClient` configurado com `baseURL` e interceptors
- Token adicionado automaticamente em todas as requisições
- Refresh automático em 401
- APIs separadas por domínio: `authApi`, `empresasApi`, `modulesApi`, `menuApi`, etc.

---

## 8. Geração de Relatórios em PDF

Os relatórios em PDF seguem a arquitetura **React + @react-pdf/renderer** no backend: o layout é definido como componentes React e convertido em PDF via `renderToBuffer`.

### 8.1. Padrão Arquitetural

- **Componente React** (`*.tsx`): define o layout usando primitivas `Document`, `Page`, `View`, `Text`, `Image`, `StyleSheet` e `Svg`.
- **Service**: orquestra a busca de dados, geração de imagens (QR Code, código de barras) e chama `React.createElement()` + `renderToBuffer()`.
- **Controller**: expõe o endpoint de download e retorna o buffer ao cliente.

### 8.2. Fluxo

1. Controller recebe a requisição.
2. Service busca dados, prepara assets (logos, QR, barcode) e cria o componente com `React.createElement()`.
3. `renderToBuffer()` converte para PDF.
4. Buffer retornado ao cliente.

---

## 9. Build e Deploy

### 9.1. Scripts (Raiz)

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `concurrently "dev:backend" "dev:frontend"` | Backend + frontend em paralelo |
| `dev:backend` | `nest start --watch` | API em modo watch |
| `dev:frontend` | `vite` | SPA em modo dev |
| `build` | shared → backend → frontend | Build completo |
| `gerar-tela` | `node scripts/gerar-tela.js` | Geração de telas |
| `extrair-ww` | `node scripts/extrair-genexus-ww.js` | Extração de WorkWith |

### 9.2. Portas

| Serviço | Porta |
|---------|-------|
| Backend (API) | 3456 |
| Frontend (dev) | 3457 |

### 9.3. Variáveis de Ambiente

**Backend**

| Variável | Descrição |
|----------|-----------|
| `SEJA_DATABASE_URL` | Connection string SQL Server |
| `JWT_ACCESS_SECRET` | Chave de assinatura do access token |
| `JWT_ACCESS_TTL` | Validade do access token (ex.: 8h) |
| `JWT_REFRESH_TTL` | Validade do refresh token em segundos |
| `PORT` | Porta da API |
| `CORS_ORIGIN` | Origem permitida para CORS |

**Frontend**

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base da API |

---

## 10. Integração com ERP Genexus

- Pasta `ERP/Genexus/` contém SDTs, procedimentos e definições do sistema legado
- Scripts `extrair-genexus-ww.js` e `gerar-tela.js` auxiliam na migração de telas
- Documentos em `docs/` descrevem metodologia de migração:
  - `TELAS_MIGRACAO.md`
  - `AGENT_MIGRACAO_TELAS.md`
  - `METODOLOGIA_MIGRACAO_TELAS.md`
  - `TEMPLATE_ANALISE_TELA.md`

---

## 11. Resumo

| Aspecto | Tecnologia/Abordagem |
|---------|----------------------|
| **Tipo** | Monorepo (npm workspaces) |
| **Backend** | NestJS + Prisma + SQL Server |
| **Frontend** | React + Vite + Redux + React Router |
| **Auth** | JWT + refresh + empresa/módulo no token |
| **Banco** | SQL Server |
| **Integrações** | ViaCEP, ANEEL, Sicredi (webhook) |
| **ERP** | Genexus (referência e migração) |
