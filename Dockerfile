FROM node:20-bookworm-slim AS deps

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
# --network-timeout raises yarn's 30s per-request default. The @next/swc-*
# optional binaries are 35-50 MB each and yarn 1 fetches every platform's copy,
# so a merely slow edge would otherwise surface as ESOCKETTIMEDOUT.
RUN yarn install --frozen-lockfile --network-timeout 600000

# Production-only node_modules, derived from the deps stage instead of a second
# network install. The runner stage used to run its own `yarn install
# --production` from scratch; with no dependency on deps, BuildKit ran both
# installs in parallel, doubling registry traffic and the chance of a stall.
# FROM deps inherits the populated yarn cache, so this resolves offline.
FROM deps AS prod-deps
RUN yarn install --frozen-lockfile --production=true --prefer-offline --network-timeout 600000

FROM node:20-bookworm-slim AS build

WORKDIR /usr/src/app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_GRAPHQL_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_NAVER_MAPS_KEY_ID
ARG NEXT_PUBLIC_KAKAO_MAP_JS_KEY
ARG NEXT_PUBLIC_KAKAO_REST_API_KEY
ARG NEXT_PUBLIC_KAKAO_REDIRECT_URI
ARG NEXT_PUBLIC_TELEGRAM_BOT_NAME
ARG NEXT_PUBLIC_TELEGRAM_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_API_GRAPHQL_URL=${NEXT_PUBLIC_API_GRAPHQL_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_NAVER_MAPS_KEY_ID=${NEXT_PUBLIC_NAVER_MAPS_KEY_ID}
ENV NEXT_PUBLIC_KAKAO_MAP_JS_KEY=${NEXT_PUBLIC_KAKAO_MAP_JS_KEY}
ENV NEXT_PUBLIC_KAKAO_REST_API_KEY=${NEXT_PUBLIC_KAKAO_REST_API_KEY}
ENV NEXT_PUBLIC_KAKAO_REDIRECT_URI=${NEXT_PUBLIC_KAKAO_REDIRECT_URI}
ENV NEXT_PUBLIC_TELEGRAM_BOT_NAME=${NEXT_PUBLIC_TELEGRAM_BOT_NAME}
ENV NEXT_PUBLIC_TELEGRAM_CLIENT_ID=${NEXT_PUBLIC_TELEGRAM_CLIENT_ID}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:20-bookworm-slim AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY package.json yarn.lock ./
COPY --from=prod-deps /usr/src/app/node_modules ./node_modules

COPY --from=build /usr/src/app/.next ./.next
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/next.config.js ./next.config.js
COPY --from=build /usr/src/app/next-i18next.config.js ./next-i18next.config.js

EXPOSE 3000

CMD ["yarn", "start", "-p", "3000"]
