FROM docker.io/node:24 AS build-env

WORKDIR /app/
COPY package.json .
COPY package-lock.json .
RUN npm ci --omit=dev

FROM gcr.io/distroless/nodejs24-debian12

WORKDIR /app/

COPY --from=build-env /app /app/

COPY . .

CMD ["pull-mode.mjs"]
