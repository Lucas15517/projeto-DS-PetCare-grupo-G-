FROM node:24-alpine

RUN apk add --no-cache tzdata
WORKDIR /app

COPY package.json server.js auth.js db.js test.js ./
COPY storage/ ./storage/
COPY routes/ ./routes/
COPY public/ ./public/

ENV NODE_ENV=production
ENV PETCARE_STORAGE=sqlite
ENV HOST=0.0.0.0
ENV TRUST_PROXY=1
ENV TZ=America/Sao_Paulo

EXPOSE 3000
CMD ["node", "server.js"]
