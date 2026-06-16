# KidsGarden Client

KidsGarden-client is the Next.js frontend for the KidsGarden kindergarten marketplace, parent application flow, role dashboards, private chat, notifications, uploads, maps, and social login.

## Prerequisites

- Node.js compatible with the project dependencies
- Yarn or npm
- Running KidsGarden backend API
- MongoDB and Redis through the backend
- Provider setup for enabled social login and maps

## Install

```bash
yarn install
```

or:

```bash
npm install
```

## Environment

Create `.env.local` from `.env.example` and fill in local or deployment values.

```bash
cp .env.example .env.local
```

Do not commit `.env.local`. Use placeholder values in committed examples only.

## Local Startup

The development script runs Next.js on port `7007`.

```bash
yarn dev
```

Open:

```text
http://127.0.0.1:7007
```

Expected local backend:

```text
http://127.0.0.1:3000
```

Expected local GraphQL endpoint:

```text
http://127.0.0.1:3000/graphql
```

## Build And Start

```bash
yarn build
yarn start
```

If the deployment platform controls the port, configure it there. For local development, use `yarn dev`.

## API And Upload URLs

Set:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:3000
NEXT_PUBLIC_API_GRAPHQL_URL=http://127.0.0.1:3000/graphql
```

Uploaded files render from backend `/uploads`, for example:

```text
http://127.0.0.1:3000/uploads/...
```

Do not point API URLs to the frontend port.

## Realtime

The private realtime gateway is exposed by the backend at `/realtime`.

Usually this can be derived from `NEXT_PUBLIC_API_URL`. Set `NEXT_PUBLIC_REALTIME_WS_URL` only when the websocket URL differs from the API base URL.

Local example:

```env
NEXT_PUBLIC_REALTIME_WS_URL=ws://127.0.0.1:3000/realtime
```

MongoDB and GraphQL remain the source of truth. Realtime events are hints for refetch/update behavior.

## Social Login Frontend Setup

Google:

- Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- The frontend sends only the Google ID token to the backend.

Kakao:

- Set `NEXT_PUBLIC_KAKAO_REST_API_KEY`.
- Set `NEXT_PUBLIC_KAKAO_REDIRECT_URI`.
- The redirect URI must exactly match the Kakao Developers setting.
- Local redirect URI:
  - `http://127.0.0.1:7007/account/kakao/callback`
- Optional ngrok redirect URI:
  - `https://YOUR_NGROK_DOMAIN/account/kakao/callback`
- Do not expose Kakao Client Secret or Admin key in frontend env.

Telegram:

- Set `NEXT_PUBLIC_TELEGRAM_BOT_NAME`, for example `kidsgarden_login_bot`.
- Configure the BotFather Web Login domain with `/setdomain`.
- For ngrok testing, the BotFather domain must match the active ngrok host.
- The frontend sends only the classic Telegram Login Widget payload to the backend.

Frontend social login must never send `memberType` or role.

## Kakao Map Setup

Set:

```env
NEXT_PUBLIC_KAKAO_MAP_JS_KEY=replace-with-kakao-javascript-key
```

Kakao Map frontend code uses the JavaScript key only.

Register JavaScript SDK domains in Kakao Developers:

- Local/ngrok testing domain as needed.
- Production frontend domain.

Do not put Kakao REST API keys or Admin keys into map frontend code.

## SEO URL

Set `NEXT_PUBLIC_SITE_URL` to the public frontend origin so canonical and Open Graph URLs can be generated.

Local example:

```env
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:7007
```

## Ngrok Testing

Kakao and Telegram provider settings often require a public domain.

Example frontend tunnel:

```bash
ngrok http 7007
```

Then update provider dashboards:

- Kakao Login redirect URI: `https://YOUR_NGROK_DOMAIN/account/kakao/callback`
- Kakao Map JavaScript SDK domain: `YOUR_NGROK_DOMAIN`
- Telegram BotFather domain: `YOUR_NGROK_DOMAIN`

Do not commit ngrok URLs as permanent production configuration.

## Security Notes

- Never commit `.env.local`.
- Never expose backend secrets, OAuth client secrets, Telegram bot tokens, or Kakao Admin keys in frontend code.
- Rotate exposed keys or tokens immediately.
- Social signup creates `PARENT` users only.
- Existing social login preserves the database role returned by the backend.

## Useful Commands

```bash
yarn dev
yarn build
yarn start
git diff --check
```
