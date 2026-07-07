FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY tsconfig.json next.config.mjs tailwind.config.ts postcss.config.js ./
COPY public/ ./public/
COPY src/ ./src/

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup --system --no-create-home nodejs && \
    adduser --system --ingroup nodejs nodeuser

COPY package.json package-lock.json ./
RUN npm ci && npm i -g tsx

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/src ./src

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && chown nodeuser:nodejs docker-entrypoint.sh

RUN chown -R nodeuser:nodejs /app
USER nodeuser

EXPOSE 60002

ENV NODE_ENV=production

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "start"]
