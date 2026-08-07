# 🌐 GoWiFi - Gerenciamento de Solicitações Técnicas

Sistema completo de gerenciamento de solicitações técnicas com dashboard interativo, filtros avançados, busca geográfica de técnicos e relatórios em tempo real.

**Versão**: 3.3.0 | **Status**: ✅ Produção-Ready | **Última Atualização**: 06 Agosto 2026

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
9. [Histórico de Desenvolvimento & Changelog](#-histórico-de-desenvolvimento--changelog)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

GoWiFi é uma plataforma web full-stack para gerenciar solicitações técnicas de forma eficiente. Construída com **React 19**, **Node.js/Express**, **tRPC**, **Tailwind CSS** e **Supabase**, oferece uma experiência moderna e responsiva.

**Stack Tecnológico:**
- **Frontend**: React 19 + Tailwind CSS 4 + Recharts
- **Backend**: Express.js + tRPC + Node.js
- **Banco de Dados**: Supabase (MySQL/PostgreSQL)
- **Autenticação**: Supabase Auth (Email + Senha)
- **Storage**: AWS S3 / Supabase Storage
- **Busca & Geolocalização**: Fuse.js (fuzzy search) + Haversine Distance (Atribuição geográfica)

---

## ✨ Funcionalidades

### 📍 Atribuição Inteligente de Técnicos Por Geolocalização
- **Cálculo de Distância em Tempo Real**: Atribuição baseada na fórmula Haversine entre as coordenadas da solicitação e a posição dos técnicos.
- **Busca Pré-Salvar**: Permite geocodificar o endereço e consultar técnicos mais próximos diretamente na tela de **Nova Solicitação** antes da gravação no banco de dados.
- **Ordenação por Distância e Avaliação**: Filtros rápidos para "Mais Próximos" (em km) e "Maior Avaliação".

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

### 👥 Gestão de Usuários e Auditoria
- **Autenticação segura** nativa via Supabase Auth
- **Perfis de acesso**: Admin, Usuário
- **Histórico de ações** (audit logs de criação, atualização e exclusão)

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
| **Node.js** | 22.x+ (recomendado 20.x LTS) | [nodejs.org](https://nodejs.org) ou `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo -E bash - && sudo apt-get install -y nodejs` |
| **pnpm** | 10.4.1+ | `npm install -g pnpm` |
| **Git** | Qualquer | `sudo apt-get install -y git` |

### Opcional (Recomendado)
- **PM2**: Gerenciador de processos (`npm install -g pm2`)
- **Nginx**: Reverse proxy para HTTPS
- **Certbot**: SSL/TLS com Let's Encrypt

### Verificar Instalação
```bash
node --version      # v22.x.x
npm --version       # 10.x.x
pnpm --version      # 10.4.1+
git --version       # git version 2.x.x