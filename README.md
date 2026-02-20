# Template ERP - Migração

Template de projeto para migração do ERP principal. Mesma estrutura, tecnologias e fluxo de autenticação do SEJA.

## Estrutura

```
template/
├── backend/          # API NestJS + Prisma
├── frontend/         # React + Vite + Redux
├── packages/
│   └── shared/       # Código compartilhado
└── package.json      # Workspace raiz
```

## Tecnologias

- **Backend:** NestJS 11, Prisma (SQLite para dev), JWT, bcrypt
- **Frontend:** React 19, Vite 7, React Router 7, Redux Toolkit, Axios

## Como rodar

### 1. Instalar dependências

```bash
cd template
npm install
```

### 2. Configurar banco (Backend)

O template usa SQLite por padrão para desenvolvimento.

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

**Usuário de teste:** `admin` / `admin`

### 3. Iniciar aplicação

```bash
# Na raiz do template
npm run dev
```

- **Backend:** http://localhost:3668
- **Frontend:** http://localhost:3669

## Fluxo de autenticação

1. **Login** (`/login`) → usuário e senha
2. **Selecionar Empresa** (`/select-empresa`) → empresas com acesso
3. **Selecionar Módulo** (`/select-module`) → módulos disponíveis
4. **Dashboard** (`/dashboard`) → área autenticada

## Migração para SQL Server

Para usar SQL Server (como no SEJA original):

1. Atualize o `prisma/schema.prisma`:
   - `provider = "sqlserver"`
   - `url = env("SEJA_DATABASE_URL")`

2. Adicione os modelos conforme o schema do ERP principal.

3. Ajuste as queries raw se necessário (sintaxe SQL Server).
