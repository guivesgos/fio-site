# Fio · site institucional

Site de **usefio.com.br**: conversas que vendem.

Site estático (HTML, CSS e JavaScript puros), sem etapa de build. Um servidor Node bem simples (`server.js`, sem dependências) entrega os arquivos da pasta `public/`.

## Estrutura

```
public/
  index.html                      Início
  recursos/index.html             Recursos
  tutoriais/index.html            Central de ajuda
  tutoriais/<tutorial>/index.html Um tutorial por pasta
  contato/index.html              Contato
  404.html                        Página não encontrada
  assets/site.css                 Visual de todas as páginas
  assets/site.js                  Interações (cursor, menu, demonstração)
  assets/img/                     Imagens
server.js                         Servidor (porta 3002)
ecosystem.config.js               Configuração do PM2
```

Para mudar um texto, edite o `index.html` da página. Ao mudar o `site.css` ou o `site.js`, aumente o número em `?v=` nos links dessas páginas (ex.: `?v=2` para `?v=3`), para os navegadores baixarem a versão nova. O cabeçalho e o rodapé se repetem em cada página: uma mudança neles precisa ser feita em todos os arquivos.

## Rodar no computador

Precisa do Node.js 18 ou mais novo.

```
node server.js
```

Abra http://localhost:3002.

## Na VPS

O site roda com o PM2, no processo `fio-site`, na porta 3002. O Caddy (no Docker do projeto `/opt/whatsapp-escritorio`) recebe o HTTPS de `usefio.com.br` e repassa para essa porta. O firewall bloqueia o acesso externo às portas 3001–3099.

Primeira instalação:

```
cd /opt
git clone https://github.com/guivesgos/fio-site.git
cd fio-site
pm2 start ecosystem.config.js
pm2 save
```

Atualizar depois de uma mudança no GitHub:

```
cd /opt/fio-site
git pull
pm2 restart fio-site
```

Conferir se está no ar: `curl http://127.0.0.1:3002/saude` deve responder `ok`.
