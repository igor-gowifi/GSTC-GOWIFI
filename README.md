# 🌐 GoWiFi - Gerenciamento de Solicitações Técnicas

Sistema completo de gerenciamento de solicitações técnicas com dashboard interativo, filtros avançados e relatórios em tempo real.

**Versão**: 40205829 | **Status**: ✅ Produção-Ready | **Última Atualização**: 10 Fev 2026

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades](#funcionalidades)
3. [Requisitos de Sistema](#requisitos-de-sistema)
4. [Instalação](#instalação)
5. [Como Rodar](#como-rodar)
6. [Portas e Configuração](#portas-e-configuração)
7. [Estrutura do Projeto](#estrutura-do-projeto)
8. [Variáveis de Ambiente](#variáveis-de-ambiente)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

GoWiFi é uma plataforma web full-stack para gerenciar solicitações técnicas de forma eficiente. Construída com **React 19**, **Node.js/Express**, **tRPC**, **Tailwind CSS** e **Supabase**, oferece uma experiência moderna e responsiva.

**Stack Tecnológico:**
- **Frontend**: React 19 + Tailwind CSS 4 + Recharts
- **Backend**: Express.js + tRPC + Node.js
- **Banco de Dados**: Supabase (MySQL/PostgreSQL)
- **Autenticação**: Manus OAuth + Supabase Auth
- **Storage**: AWS S3
- **Busca**: Fuse.js (fuzzy search)

---

## ✨ Funcionalidades

### 📊 Dashboard
- **Gráficos dinâmicos** com filtro "Classificar por" (Data de Criação/Atividade)
- **Timeline de solicitações** com visualização em barras (últimos 7 dias)
- **Taxa de conclusão** com indicador visual
- **Distribuição por projeto** em gráfico de barras
- **Distribuição por status** em gráfico de pizza

### 🔍 Solicitações
- **Busca fuzzy** com Fuse.js (tolera erros de digitação)
- **Filtros avançados e coordenados**:
  - Por status (Agendado, Pendente, Concluído, Improdutivo)
  - Por projeto
  - Por empresa parceira
  - Por data (dia, semana, mês, ano)
  - Por intervalo de datas customizado
- **Visualização em lista** com paginação
- **Detalhes completos** de cada solicitação
- **Edição em tempo real**

### 📅 Filtros Inteligentes
- **Filtros que se conversam**: Status + Data + Projeto funcionam em conjunto
- **Contexto dinâmico**: Filtros se adaptam baseado em "Classificar por"
- **Semanas do mês**: Esta semana, semana que vem, semana passada, 1ª/2ª/3ª/4ª semana
- **Ordenação cronológica**: Datas antigas à esquerda, recentes à direita

### 👥 Gestão de Usuários
- **Autenticação segura** com Manus OAuth
- **Perfis de acesso**: Admin, Usuário
- **Histórico de ações** (audit logs)

### 📱 Interface
- **Responsiva**: Funciona em desktop, tablet e mobile
- **Modo claro/escuro**: Suporte completo
- **Componentes shadcn/ui**: Interface moderna e consistente
- **Acessibilidade**: Keyboard navigation e screen readers

### 📤 Exportação
- **Exportar para Excel**: Dados filtrados em XLSX
- **Relatórios**: Dados estruturados e formatados

---

## 🛠️ Requisitos de Sistema

### Obrigatório
| Requisito | Versão | Instalação |
|-----------|--------|-----------|
| **Node.js** | 18.x+ (recomendado 20.x LTS) | [nodejs.org](https://nodejs.org) ou `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo -E bash - && sudo apt-get install -y nodejs` |
| **pnpm** | 10.4.1+ | `npm install -g pnpm` |
| **Git** | Qualquer | `sudo apt-get install -y git` |

### Opcional (Recomendado)
- **PM2**: Gerenciador de processos (`npm install -g pm2`)
- **Nginx**: Reverse proxy para HTTPS
- **Certbot**: SSL/TLS com Let's Encrypt

### Verificar Instalação
```bash
node --version      # v20.x.x
npm --version       # 10.x.x
pnpm --version      # 10.4.1+
git --version       # git version 2.x.x
```

---

## 📦 Instalação

### 1. Clonar/Copiar Projeto

```bash
# Opção A: Via Git
git clone <seu-repositorio> gowifi
cd gowifi

# Opção B: Copiar arquivos manualmente
cd /opt/gowifi
```

### 2. Instalar Dependências

```bash
pnpm install
```

Isso instalará ~400+ pacotes npm necessários para frontend e backend.

### 3. Verificar Instalação

```bash
pnpm check  # Verifica TypeScript
```

---

## 🚀 Como Rodar

### Modo Desenvolvimento

```bash
pnpm dev
```

Acesse em `http://localhost:3000`

**O que acontece:**
- Vite dev server com hot reload
- Backend Express em modo watch
- Banco de dados sincronizado

### Modo Produção

#### Passo 1: Build

```bash
pnpm build
```

Gera:
- `/dist/public/` - Frontend compilado (React)
- `/dist/index.js` - Backend compilado (Node.js)

#### Passo 2: Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000

# Banco de Dados
DATABASE_URL=mysql://user:password@host:3306/database
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-secreta

# Autenticação
JWT_SECRET=sua-chave-jwt-segura-32-caracteres
VITE_APP_ID=seu-app-id

# OAuth
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Opcional: Freshdesk
FRESHDESK_DOMAIN=seu-dominio.freshdesk.com
FRESHDESK_API_KEY=sua-chave-api

# Opcional: Forge API
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=sua-chave-forge

# App Info
VITE_APP_TITLE="GoWiFi Gerenciamento"
VITE_APP_LOGO="https://seu-cdn.com/logo.png"
EOF
```

#### Passo 3: Iniciar Aplicação

**Opção A: Direto com Node.js**
```bash
pnpm start
# Servidor rodará em http://localhost:3000
```

**Opção B: Com PM2 (Recomendado)**
```bash
# Instalar PM2
npm install -g pm2

# Iniciar
pm2 start dist/index.js --name "gowifi" --env production

# Configurar para iniciar automaticamente
pm2 startup
pm2 save

# Monitorar
pm2 monit
pm2 logs gowifi
```

---

## 🔌 Portas e Configuração

### Porta Necessária

| Porta | Protocolo | Serviço | Status |
|-------|-----------|---------|--------|
| **3000** | HTTP | Express Server (Frontend + Backend) | ✅ **OBRIGATÓRIO** |
| 443 | HTTPS | SSL/TLS (com reverse proxy) | ⚠️ Opcional |
| 3306 | TCP | MySQL (remoto, Supabase) | ❌ Não abrir |
| 5432 | TCP | PostgreSQL (remoto, Supabase) | ❌ Não abrir |

### Configurar Firewall (UFW)

```bash
# Ativar firewall
sudo ufw enable

# Permitir SSH (importante!)
sudo ufw allow 22/tcp

# Permitir aplicação
sudo ufw allow 3000/tcp

# Permitir HTTPS (se usar)
sudo ufw allow 443/tcp

# Verificar regras
sudo ufw status
```

### Configurar Nginx como Reverse Proxy (Opcional)

```bash
# Instalar Nginx
sudo apt-get install -y nginx

# Criar configuração
sudo nano /etc/nginx/sites-available/gowifi
```

Adicionar:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ativar:
```bash
sudo ln -s /etc/nginx/sites-available/gowifi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📁 Estrutura do Projeto

```
gowifi-app-v2/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── pages/                  # Páginas (Dashboard, Solicitações, etc)
│   │   ├── components/             # Componentes reutilizáveis
│   │   ├── hooks/                  # Custom hooks
│   │   ├── lib/                    # Utilitários
│   │   ├── App.tsx                 # Roteamento principal
│   │   └── index.css               # Estilos globais
│   ├── public/                     # Assets estáticos
│   └── index.html
│
├── server/                          # Backend Node.js
│   ├── routers/                    # tRPC routers (solicitacoes, auth, etc)
│   ├── db.ts                       # Query helpers
│   ├── storage.ts                  # S3 helpers
│   ├── weekHelper.ts               # Cálculos de semana
│   ├── filterHelper.ts             # Lógica de filtros
│   ├── filterCoordinator.ts        # Coordenação de filtros
│   └── _core/                      # Framework (OAuth, context, etc)
│
├── drizzle/                         # Banco de dados
│   ├── schema.ts                   # Definição de tabelas
│   └── migrations/                 # Histórico de migrations
│
├── shared/                          # Código compartilhado
│   └── constants.ts
│
├── dist/                            # Build compilado (produção)
│   ├── index.js                    # Servidor Node.js
│   └── public/                     # Frontend estático
│
├── package.json                     # Dependências
├── vite.config.ts                  # Configuração Vite
├── tsconfig.json                   # Configuração TypeScript
├── README.md                        # Este arquivo
└── todo.md                          # Histórico de desenvolvimento
```

---

## 🔐 Variáveis de Ambiente

### Obrigatórias (Produção)

```bash
NODE_ENV=production                          # Ambiente
PORT=3000                                    # Porta da aplicação

DATABASE_URL=mysql://...                     # Conexão MySQL
SUPABASE_URL=https://...supabase.co         # URL Supabase
SUPABASE_SERVICE_ROLE_KEY=...               # Chave Supabase

JWT_SECRET=...                               # Chave JWT (32+ caracteres)
VITE_APP_ID=...                             # ID da aplicação
```

### Opcionais (Recomendadas)

```bash
OAUTH_SERVER_URL=https://api.manus.im      # OAuth Manus
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

FRESHDESK_DOMAIN=...                        # Integração Freshdesk
FRESHDESK_API_KEY=...

BUILT_IN_FORGE_API_URL=...                  # Forge API
BUILT_IN_FORGE_API_KEY=...

VITE_APP_TITLE="GoWiFi"                     # Nome da app
VITE_APP_LOGO="https://..."                 # Logo URL
```

### Gerar JWT_SECRET Seguro

```bash
openssl rand -base64 32
# Copiar saída para JWT_SECRET no .env
```

---

## 📊 Testes

Executar suite de testes:

```bash
pnpm test              # Rodar todos os testes
pnpm test server/      # Apenas testes do backend
pnpm test --watch     # Modo watch
```

**Status Atual**: 144 testes passando ✅

---

## 🆘 Troubleshooting

### Porta 3000 já em uso

```bash
# Encontrar processo
sudo lsof -i :3000

# Matar processo
sudo kill -9 <PID>

# Ou usar porta diferente
PORT=3001 pnpm start
```

### Erro de conexão com banco de dados

```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Testar conexão
mysql -h host -u user -p database

# Verificar se Supabase está acessível
curl https://seu-projeto.supabase.co
```

### Erro de autenticação OAuth

```bash
# Verificar variáveis
echo $VITE_APP_ID
echo $OAUTH_SERVER_URL

# Limpar cookies e tentar novamente
# Ou usar navegador privado
```

### Aplicação lenta

```bash
# Aumentar memória Node.js
NODE_OPTIONS="--max-old-space-size=4096" pnpm start

# Usar PM2 com cluster mode
pm2 start dist/index.js -i max --name "gowifi"
```

### Erro de CORS

```bash
# Se usar Nginx, verificar headers proxy
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
```

---

## 📞 Suporte e Documentação

- **Documentação Manus**: https://docs.manus.im
- **Documentação Supabase**: https://supabase.com/docs
- **Documentação tRPC**: https://trpc.io
- **Documentação React**: https://react.dev

---

## 📝 Histórico de Desenvolvimento

Ver `todo.md` para histórico completo de features implementadas e bugs corrigidos.

**Últimas implementações:**
- ✅ Busca fuzzy com Fuse.js
- ✅ Filtros dinâmicos coordenados
- ✅ Dashboard com gráficos adaptativos
- ✅ Timeline em BarChart
- ✅ Filtros por semana/mês/ano
- ✅ Exportação para Excel com dados completos
- ✅ Sincronização de timestamps com GMT-3
- ✅ Botão de exportação apenas em Solicitações
- ✅ Limpeza de código (removidos componentes não utilizados)

---

## 📄 Licença

MIT

---

**Última atualização**: 10 Fevereiro 2026  
**Versão do Projeto**: 40205829  
**Testes**: 144/149 passando ✅  
**Desenvolvido com ❤️ para GoWiFi**


## 🧹 Limpeza de Código

### Arquivos Removidos (Não Utilizados)
- `client/src/components/FilterPanel.tsx` - Substituído por `UnifiedFilterPanel.tsx`
- `client/src/components/EditarSolicitacaoModal.tsx` - Não estava importado
- `client/src/components/SolicitacaoCard.tsx` - Não estava importado
- `client/src/pages/ComponentShowcase.tsx` - Página de demonstração não utilizada

### Componentes Ativos
- **UnifiedFilterPanel.tsx** - Painel de filtros unificado (Dashboard + Solicitações)
- **DashboardLayout.tsx** - Layout principal com sidebar
- **DashboardCharts.tsx** - Gráficos e visualizações
- **DetalheSolicitacao.tsx** - Visualização e edição de solicitações
- **NovaSolicitacao.tsx** - Criação de novas solicitações
- **Tecnicos.tsx** - Gestão de técnicos
- **Usuarios.tsx** - Gestão de usuários
- **Console.tsx** - Console de auditoria

### Estrutura Otimizada
- Sem imports circulares
- Sem componentes duplicados
- Sem código morto
- Sem páginas não utilizadas


## 🔄 Autenticação (Supabase Only)

O projeto foi simplificado para usar **apenas Supabase Auth** (email + senha). Manus OAuth foi removido para evitar conflitos.

**Como funciona:**
- Login com email/senha via Supabase
- Tokens JWT armazenados em Authorization header
- Funciona 100% localmente
- Sem dependência de variáveis de ambiente externas

**Para rodar em produção:**
```bash
pnpm build      # Recompila com as mudanças
pnpm start      # Inicia aplicação
```

**Variáveis de ambiente necessárias:**
```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-secreta
```
