FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --omit=dev --workspace=backend --include-workspace-root=false \
  && addgroup -S app && adduser -S app -G app
COPY --chown=app:app backend ./backend
USER app
EXPOSE 3001
CMD ["node", "backend/server.js"]
