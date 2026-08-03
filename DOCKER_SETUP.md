# 🐳 Docker Compose Setup - GoWiFi

Guia completo para rodar GoWiFi com Docker Compose.

---

## 📋 O que é incluído

- **Node.js 20 Alpine**: Aplicação GoWiFi
- **Nginx Alpine**: Reverse proxy com suporte a HTTP/HTTPS
- **MySQL 8.0** (Opcional): Banco de dados local

---

## 🛠️ Pré-requisitos

### Instalar Docker e Docker Compose

**Ubuntu/Debian:**
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker --version
docker-compose --version
```

**macOS (com Homebrew):**
```bash
brew install docker docker-compose
```

**Windows:**
- Baixar [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

## 🚀 Quick Start

### 1. Preparar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com seus valores
nano .env
```

**Variáveis obrigatórias:**
```bash
DATABASE_URL=mysql://user:password@host:3306/database
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-secreta
JWT_SECRET=sua-chave-jwt-32-caracteres
VITE_APP_ID=seu-app-id
```

### 2. Build e Iniciar

```bash
# Build da imagem Docker
docker-compose build

# Iniciar serviços
docker-compose up -d

# Verificar status
docker-compose ps
```

### 3. Acessar Aplicação

- **HTTP**: http://localhost
- **HTTPS**: https://localhost (se configurado)
- **Aplicação**: http://localhost:3000

---

## 📦 Estrutura de Serviços

### App (Node.js)
- **Porta**: 3000 (interna)
- **Imagem**: Build local (Dockerfile)
- **Restart**: unless-stopped
- **Health Check**: A cada 30s

```bash
# Ver logs
docker-compose logs -f app

# Executar comando no container
docker-compose exec app sh
```

### Nginx (Reverse Proxy)
- **Porta**: 80 (HTTP), 443 (HTTPS)
- **Imagem**: nginx:alpine
- **Config**: ./nginx.conf
- **Logs**: ./logs/nginx/

```bash
# Ver logs
docker-compose logs -f nginx

# Testar configuração
docker-compose exec nginx nginx -t
```

### MySQL (Opcional)
- **Porta**: 3306
- **Imagem**: mysql:8.0
- **Volume**: mysql_data (persistente)

Para ativar MySQL, descomente no `docker-compose.yml`:

```yaml
mysql:
  image: mysql:8.0
  environment:
    MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    MYSQL_DATABASE: ${MYSQL_DATABASE}
    MYSQL_USER: ${MYSQL_USER}
    MYSQL_PASSWORD: ${MYSQL_PASSWORD}
```

---

## 🔧 Comandos Úteis

### Gerenciar Serviços

```bash
# Iniciar
docker-compose up -d

# Parar
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Reiniciar
docker-compose restart

# Rebuild
docker-compose build --no-cache
```

### Monitorar

```bash
# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f app
docker-compose logs -f nginx

# Monitorar em tempo real
docker stats
```

### Executar Comandos

```bash
# Shell no container app
docker-compose exec app sh

# Executar comando
docker-compose exec app pnpm test

# Shell no container nginx
docker-compose exec nginx sh
```

### Limpar

```bash
# Remover containers parados
docker-compose down

# Remover imagens
docker image prune -a

# Remover volumes não usados
docker volume prune

# Limpeza completa
docker system prune -a --volumes
```

---

## 🔐 Configuração HTTPS

### 1. Gerar Certificado SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Gerar certificado
sudo certbot certonly --standalone -d seu-dominio.com

# Certificados estarão em:
# /etc/letsencrypt/live/seu-dominio.com/
```

### 2. Copiar Certificados

```bash
# Criar diretório
mkdir -p ssl

# Copiar certificados
sudo cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem ssl/key.pem

# Ajustar permissões
sudo chown $USER:$USER ssl/*
chmod 600 ssl/*
```

### 3. Ativar HTTPS no Nginx

Descomente a seção HTTPS no `nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ...
}
```

### 4. Redirecionar HTTP para HTTPS

Descomente no `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}
```

### 5. Reiniciar Nginx

```bash
docker-compose restart nginx
```

---

## 📊 Monitoramento e Health Checks

### Health Check Endpoint

```bash
# Testar saúde da aplicação
curl http://localhost:3000/health

# Resposta esperada
curl -I http://localhost/health
# HTTP/1.1 200 OK
```

### Verificar Status

```bash
# Status dos containers
docker-compose ps

# Logs de erro
docker-compose logs app | grep -i error

# Verificar conectividade
docker-compose exec app curl http://localhost:3000
```

---

## 🆘 Troubleshooting

### Porta já em uso

```bash
# Encontrar processo usando porta
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000

# Matar processo
sudo kill -9 <PID>

# Ou usar porta diferente no docker-compose.yml
ports:
  - "8080:80"  # Porta externa:interna
```

### Erro de permissão

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Aplicar novo grupo
newgrp docker

# Verificar
docker ps
```

### Erro de conexão com banco

```bash
# Verificar variáveis de ambiente
docker-compose exec app env | grep DATABASE

# Testar conexão
docker-compose exec app mysql -h mysql -u user -p database

# Verificar logs
docker-compose logs mysql
```

### Nginx não redireciona

```bash
# Testar configuração
docker-compose exec nginx nginx -t

# Recarregar configuração
docker-compose exec nginx nginx -s reload

# Ver logs
docker-compose logs nginx
```

### Aplicação lenta

```bash
# Aumentar recursos
# Editar docker-compose.yml:
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

# Reiniciar
docker-compose up -d
```

---

## 📁 Estrutura de Diretórios

```
gowifi-app-v2/
├── Dockerfile                 # Build da aplicação
├── docker-compose.yml         # Orquestração de containers
├── nginx.conf                 # Configuração Nginx
├── .env                       # Variáveis de ambiente (não commitar)
├── .env.example               # Exemplo de variáveis
├── ssl/                       # Certificados SSL (opcional)
│   ├── cert.pem
│   └── key.pem
├── logs/                      # Logs dos serviços
│   ├── nginx/
│   └── app/
└── ...
```

---

## 🔄 Atualizar Aplicação

### Build com mudanças de código

```bash
# Parar serviços
docker-compose down

# Build novo
docker-compose build --no-cache

# Iniciar
docker-compose up -d
```

### Sem rebuild (apenas config)

```bash
# Parar
docker-compose stop

# Iniciar
docker-compose start
```

---

## 📝 Variáveis de Ambiente Importantes

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NODE_ENV` | Ambiente | production |
| `PORT` | Porta da app | 3000 |
| `DATABASE_URL` | Conexão BD | mysql://user:pass@host/db |
| `JWT_SECRET` | Chave JWT | (32+ caracteres) |
| `SUPABASE_URL` | URL Supabase | https://xxx.supabase.co |

---

## 🚀 Deploy em Produção

### 1. Preparar Servidor

```bash
# Atualizar sistema
sudo apt-get update && sudo apt-get upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clonar Projeto

```bash
git clone <seu-repositorio> /opt/gowifi
cd /opt/gowifi
```

### 3. Configurar Ambiente

```bash
cp .env.example .env
nano .env  # Editar com valores reais
```

### 4. Iniciar

```bash
docker-compose up -d
```

### 5. Configurar Firewall

```bash
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
```

---

## 📞 Suporte

- **Documentação Docker**: https://docs.docker.com
- **Documentação Docker Compose**: https://docs.docker.com/compose
- **Documentação Nginx**: https://nginx.org/en/docs

---

**Última atualização**: Fevereiro 2026
