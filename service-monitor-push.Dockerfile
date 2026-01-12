FROM docker.io/node:24 AS build-env

WORKDIR /app/
COPY package.json .
COPY package-lock.json .
RUN npm ci --omit=dev

WORKDIR /app/service-monitor-push/
COPY service-monitor-push/package.json .
COPY service-monitor-push/package-lock.json .
RUN npm ci --omit=dev

FROM gcr.io/distroless/nodejs24-debian12
#FROM docker.io/node:24 
COPY --from=build-env /app /app/

WORKDIR /app/src/

COPY src/aws-connect-with-secret.js .
COPY src/decode-*.js .

WORKDIR /app/service-monitor-push
COPY service-monitor-push/ .

CMD ["index.mjs"]
