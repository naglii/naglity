// Allowed CORS origins, shared by HTTP (main.ts) and Socket.IO (jobs.gateway.ts).
// FRONTEND_URL may be a single origin or a comma-separated list, so a deployed
// dev/staging web URL and http://localhost:3000 can both be allowed at once.
export function corsOrigins(): string[] {
  return (process.env['FRONTEND_URL'] ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}
