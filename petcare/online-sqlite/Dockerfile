FROM node:24-alpine
WORKDIR /app
COPY package.json ./
COPY server.js test.js ./
COPY public/ ./public/
RUN mkdir -p /app/data
ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 3000
CMD ["node", "server.js"]
