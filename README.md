# naglity
Crane trucks app

## Stack

- **API** — NestJS · `apps/api` · runs on `http://localhost:3001`
- **Web** — Next.js · `apps/web` · runs on `http://localhost:3000`

## Running

Install dependencies (once):
```sh
pnpm install
```

Run both services in parallel:
```sh
pnpm dev
```

Or run individually:
```sh
pnpm dev:api   # NestJS only
pnpm dev:web   # Next.js only
```

Build for production:
```sh
pnpm build
```
