// Configuração do PM2 para o site da Fio.
// Uso na VPS: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'fio-site',
      script: 'server.js',
      env: { PORT: 3002 },
      max_memory_restart: '150M',
    },
  ],
};
