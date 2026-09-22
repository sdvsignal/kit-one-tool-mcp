# Runs the one tool over stdio, which is all an MCP host (or Glama's
# introspection) asks of it. No port, no server process to keep alive.
FROM node:20-alpine

WORKDIR /app

# Lockfile first, so a source edit does not reinstall.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production

# THING_API_KEY is passed in at run time (-e), never baked into the image.
CMD ["node", "src/index.js"]
