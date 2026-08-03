FROM node:22-alpine

WORKDIR /app

# Desativa o auto-switch/instalação dinâmica do pnpm que gera o erro de EACCES
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_AUTO_PIN=0

# Instalar o pnpm globalmente
RUN npm install -g pnpm@10.4.1

# Copiar apenas o arquivo de dependências inicial
COPY package.json ./

# Copia o código fonte
COPY . .

# Instala os pacotes
RUN pnpm install --no-frozen-lockfile --force

# Criar as subpastas e garantir que o drizzle.config.ts esteja em ambos os escopos de execução
RUN mkdir -p database && chmod 777 database
RUN mkdir -p server/_core
RUN cp drizzle.config.ts server/_core/drizzle.config.ts || true

# Expor as portas do Backend e do Vite Dev Server
EXPOSE 3000
EXPOSE 5173

# Iniciar no modo DEV
CMD ["pnpm", "run", "dev"]