# ---------- Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer toutes les dépendances (inclut dev pour le build)
RUN npm ci

# Copier le code source
COPY . .

# Build Next.js
RUN npm run build

# ---------- Runtime ----------
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copier package.json et installer uniquement les dépendances de production
# (better-sqlite3 est compilé pour Alpine/musl à cette étape)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copier le build Next.js
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Conserver aussi package.json côté runtime pour les scripts/npm metadata
COPY --from=builder /app/package.json ./package.json

# Créer le dossier de données SQLite (sera monté en volume)
RUN mkdir -p /app/data

# Utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Health check : vérifie que le serveur répond
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "start"]
