# ipstack Proxy Backend

This Express server proxies requests to the [ipstack API](https://api.ipstack.com/) so that clients do not need direct access to your secret API key.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set your ipstack key:

   ```bash
   cp .env.example .env
   # edit .env and set IPSTACK_API_KEY=...
   ```

3. Start the server:

   ```bash
   npm run start
   # or for auto-reload during development
   npm run dev
   ```

The default port is `3001`. Override by setting `PORT` in the environment.

## Endpoints

### `GET /health`
Simple liveness probe returning `{ "status": "ok" }`.

### `GET /lookup`
Proxy to ipstack. Supported query parameters:

- `ip` – IP address to look up. Defaults to `check`, which makes ipstack detect the caller IP.
- Any additional ipstack query parameters, e.g. `fields`, `output`, etc. (see `_assets/docs.txt`).

> **Note:** The response fields consumed by this project rely on ipstack's **Connection** and **Time Zone** modules, which are available starting from the Starter plan.

#### Example

```http
GET /lookup?ip=134.201.250.155
```

Response mirrors the ipstack JSON payload or an error if the upstream call fails. Upstream ipstack errors are returned with HTTP 502 and include the original `error` details.

### `GET /lookup/sample`
Returns a static sample payload that mirrors the ipstack response schema. Useful for development and frontend testing when the real API or proxy key is unavailable.
