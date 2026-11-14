// Servidor do site institucional da Fio (usefio.com.br).
// Entrega os arquivos da pasta "public". Sem dependências: só Node.js.
// O HTTPS fica com o Caddy, que repassa os pedidos para esta porta.
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const PORTA = Number(process.env.PORT) || 3010;
const HOST = process.env.HOST || '0.0.0.0'; // o Caddy (no Docker) chega por host.docker.internal; o firewall bloqueia acesso externo
const RAIZ = path.join(__dirname, 'public');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
};
const COMPRIMIR = new Set(['.html', '.css', '.js', '.json', '.svg', '.txt', '.xml']);

const SEGURANCA = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

// Guarda a versão comprimida de cada arquivo na memória (o site é pequeno)
const cacheGzip = new Map();

function cabecalhosCache(ext) {
  if (ext === '.html') return 'no-cache';
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.woff2'].includes(ext)) return 'public, max-age=86400';
  return 'public, max-age=3600';
}

function responder(req, res, arquivo, status = 200) {
  fs.stat(arquivo, (err, st) => {
    if (err || !st.isFile()) return naoEncontrado(req, res);
    const ext = path.extname(arquivo).toLowerCase();
    const etag = `"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
    const cab = {
      ...SEGURANCA,
      'Content-Type': TIPOS[ext] || 'application/octet-stream',
      'Cache-Control': cabecalhosCache(ext),
      'ETag': etag,
      'Last-Modified': st.mtime.toUTCString(),
      'Vary': 'Accept-Encoding',
    };
    if (status === 200 && req.headers['if-none-match'] === etag) {
      res.writeHead(304, cab);
      return res.end();
    }
    const querGzip = COMPRIMIR.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    if (querGzip) {
      const chave = arquivo + etag;
      let corpo = cacheGzip.get(chave);
      if (!corpo) {
        try { corpo = zlib.gzipSync(fs.readFileSync(arquivo)); } catch { return erro(res); }
        cacheGzip.set(chave, corpo);
      }
      cab['Content-Encoding'] = 'gzip';
      cab['Content-Length'] = corpo.length;
      res.writeHead(status, cab);
      return res.end(req.method === 'HEAD' ? undefined : corpo);
    }
    cab['Content-Length'] = st.size;
    res.writeHead(status, cab);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(arquivo).on('error', () => res.destroy()).pipe(res);
  });
}

function naoEncontrado(req, res) {
  const pagina = path.join(RAIZ, '404.html');
  if (fs.existsSync(pagina)) return responder(req, res, pagina, 404);
  res.writeHead(404, { ...SEGURANCA, 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Página não encontrada');
}

function erro(res) {
  if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Erro no servidor');
}

// Link na bio (usefio.com.br/@perfil): quem monta a página é o painel da Fio, que tem os
// dados do perfil. O site só repassa o pedido para ele, na mesma máquina.
const PAINEL_PORTA = Number(process.env.PAINEL_PORTA) || 3001;
function repassarParaPainel(req, res) {
  const ip = req.socket.remoteAddress;
  const pedido = http.request({
    host: '127.0.0.1', port: PAINEL_PORTA, method: req.method, path: req.url,
    headers: {
      ...req.headers,
      'x-forwarded-for': req.headers['x-forwarded-for'] ? `${req.headers['x-forwarded-for']}, ${ip}` : ip,
      'x-forwarded-proto': req.headers['x-forwarded-proto'] || 'https',
    },
    timeout: 15000,
  }, (resposta) => {
    res.writeHead(resposta.statusCode, resposta.headers);
    resposta.pipe(res);
  });
  pedido.on('timeout', () => pedido.destroy(new Error('tempo esgotado')));
  pedido.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('A página está indisponível agora. Tente de novo em instantes.');
  });
  req.pipe(pedido);
}

const servidor = http.createServer((req, res) => {
  if (req.url.startsWith('/@')) return repassarParaPainel(req, res);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }

  let caminho;
  try {
    caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400); return res.end();
  }

  // Verificação simples de que o site está no ar
  if (caminho === '/saude') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end('ok');
  }

  // Impede sair da pasta "public" (ex.: /../server.js) e arquivos ocultos
  const arquivo = path.normalize(path.join(RAIZ, caminho));
  if ((arquivo !== RAIZ && !arquivo.startsWith(RAIZ + path.sep)) || caminho.split('/').some((p) => p.startsWith('.'))) return naoEncontrado(req, res);

  fs.stat(arquivo, (err, st) => {
    if (!err && st.isDirectory()) {
      // /recursos vira /recursos/ (para os links relativos funcionarem)
      if (!caminho.endsWith('/')) {
        const busca = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        res.writeHead(301, { Location: caminho + '/' + busca });
        return res.end();
      }
      return responder(req, res, path.join(arquivo, 'index.html'));
    }
    if (!err && st.isFile()) return responder(req, res, arquivo);
    return naoEncontrado(req, res);
  });
});

servidor.listen(PORTA, HOST, () => {
  console.log(`Site da Fio no ar em http://${HOST}:${PORTA}`);
});

// Desliga com calma quando o PM2 pede para parar
for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => servidor.close(() => process.exit(0)));
}
