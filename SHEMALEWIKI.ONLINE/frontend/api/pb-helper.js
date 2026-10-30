// Acceso directo al VPS (salta Cloudflare: el 403 de Bot Fight Mode rompia los fetchs
// server-to-server Vercel -> api.shemalewiki.online). TLS con SNI del dominio.
import https from 'https';

const PB_DIRECT_HOST = '187.77.68.200';
const PB_SNI = 'api.shemalewiki.online';

export function pbFetch(pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const base = pathname.startsWith('http') ? new URL(pathname) : new URL(pathname, `https://${PB_SNI}`);
    const req = https.request({
      host: PB_DIRECT_HOST,
      port: 443,
      servername: PB_SNI,
      path: base.pathname + base.search,
      method: options.method || 'GET',
      headers: { Host: PB_SNI, ...(options.headers || {}) },
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: async () => JSON.parse(body),
          text: async () => body,
        });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

export const PB_BASE = `https://${PB_SNI}`;
