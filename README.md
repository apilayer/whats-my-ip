# WhatsMyIp

A full-stack IP lookup tool that combines a secured backend proxy for ipstack with a polished React frontend. Use this document as the entry point for local setup, deployment guidance, and documentation links.

## Project Layout

```
WhatsMyIp/
├── backend/     # Express proxy to ipstack
└── frontend/    # React + Tailwind UI
```

- [`backend/README.md`](backend/README.md) – Setup instructions, environment configuration, and available proxy endpoints.
- [`frontend/README.md`](frontend/README.md) – UI architecture, data flow, theming, and development workflow.

## Getting Started

1. **Install dependencies** in both workspaces:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. **Configure ipstack** in `backend/.env` using the sample file for guidance.
3. **Run the backend** (default port: 3001):
   ```bash
   npm run dev
   ```
4. **Run the frontend** (default port: 5173) in a separate terminal:
   ```bash
   npm run dev
   ```
5. Visit the frontend URL. Requests to `/api/lookup` will be proxied to the backend.

> **Plan requirement:** Both services rely on ipstack's **Connection** and **Time Zone** modules, which are included starting with the Starter plan.

## Deployment Notes

- Ensure the backend is deployed with the required ipstack API key and appropriate security controls; the frontend never exposes the key directly.
- Configure the frontend's `VITE_LOOKUP_PATH` at build time if your proxy uses a non-default route.
- Consider deploying both services behind a reverse proxy that routes `/api` to the backend and static assets to the frontend build output.

## Additional Resources

- ipstack docs: https://ipstack.com/documentation
- Tailwind CSS: https://tailwindcss.com/docs
- Vite: https://vitejs.dev/guide/
