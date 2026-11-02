/* Fio · site institucional. Sem bibliotecas. */
(function () {
  'use strict';
  var calmo = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Menu do celular: usa a Popover API; em navegadores antigos, abre e fecha com uma classe
  var menu = document.getElementById('menu');
  if (menu && !HTMLElement.prototype.hasOwnProperty('popover')) {
    document.querySelectorAll('[popovertarget="menu"]').forEach(function (b) {
      b.addEventListener('click', function () {
        var abrir = b.getAttribute('popovertargetaction') !== 'hide' && !menu.classList.contains('aberto');
        menu.classList.toggle('aberto', abrir);
      });
    });
  }
  if (menu) menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      if (menu.hidePopover && menu.matches(':popover-open')) menu.hidePopover();
      menu.classList.remove('aberto');
    });
  });

  // Manifesto: separa as palavras para acenderem com a rolagem
  var man = document.getElementById('manifesto');
  if (man) (function separa(no) {
    Array.prototype.slice.call(no.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
          var s = document.createElement('span'); s.className = 'p'; s.textContent = w; frag.appendChild(s);
        });
        n.parentNode.replaceChild(frag, n);
      } else separa(n);
    });
  })(man);

  // Demonstração no celular (início)
  var tela = document.getElementById('tela');
  if (tela) {
    var logo = '<svg viewBox="15 7 200 200" aria-hidden="true"><path d="M150 40 L 66 40 Q 36 40 36 70 L 36 118 Q 36 148 66 148 L 84 148 L 72 176 L 110 148 L 134 148 Q 164 148 164 118 L 164 84" fill="none" stroke="#F2F3F5" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/><path d="M164 84 C 164 62, 174 46, 194 38" fill="none" stroke="#E0312B" stroke-width="18" stroke-linecap="round"/></svg>';
    var cab = '<div class="tela-cab"><div class="av">' + logo + '</div>suamarca</div>';
    var cenas = {
      comentario: cab +
        '<div class="etq">No post</div>' +
        '<div class="post"><div class="av cli"></div><div><b>ana.musica</b> quero! <span class="chave">GUIA</span></div></div>' +
        '<div class="post resp"><div class="av">' + logo + '</div><div><b>suamarca</b> Te mandei no direct, Ana!</div></div>' +
        '<div class="etq">No direct</div>' +
        '<div class="m fio">Oi, Ana! Aqui está o seu guia gratuito.<span class="bt">Receber o guia</span></div>',
      story: cab +
        '<div class="etq">ana.musica mencionou você no story</div>' +
        '<div class="m fio">Que alegria ver você me marcando! Separei um presente pra você.<span class="bt">Abrir presente</span></div>' +
        '<div class="m ela">ahh obrigada!!</div>',
      direct: cab +
        '<div class="etq">Primeira conversa</div>' +
        '<div class="m fio">Oi! Como posso te ajudar?<span class="bt">Quero saber os valores</span><span class="bt">Como funciona a consulta?</span></div>' +
        '<div class="m ela">Quero saber os valores</div>' +
        '<div class="m fio">Claro! Antes, me conta seu melhor e-mail que eu te mando a tabela completa.</div>' +
        '<div class="m ela">ana@email.com</div>',
      venda: cab +
        '<div class="m fio">O Guia Completo sai por R$ 47,00. É só tocar aqui embaixo.<span class="bt pago">Comprar · R$ 47,00</span></div>' +
        '<div class="etq">Pagou com Pix no Mercado Pago</div>' +
        '<div class="m fio">Pagamento aprovado! Enviei o guia para o seu e-mail.<span class="bt">Abrir o guia</span></div>'
    };
    var abas = document.querySelectorAll('.aba');
    var mostra = function (c) { tela.innerHTML = cenas[c]; };
    mostra('comentario');
    abas.forEach(function (a) {
      a.addEventListener('click', function () {
        abas.forEach(function (b) { b.setAttribute('aria-selected', b === a ? 'true' : 'false'); });
        var c = a.getAttribute('data-cena');
        if (document.startViewTransition && !calmo) document.startViewTransition(function () { mostra(c); });
        else mostra(c);
      });
    });
  }

  // Tutoriais: marca no índice a etapa que está na tela
  var links = document.querySelectorAll('.tut-indice ol a');
  if (links.length && 'IntersectionObserver' in window) {
    var mapa = {};
    links.forEach(function (a) { mapa[a.getAttribute('href').slice(1)] = a; });
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting && mapa[e.target.id]) {
          links.forEach(function (a) { a.classList.remove('atual'); });
          mapa[e.target.id].classList.add('atual');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(mapa).forEach(function (id) { var el = document.getElementById(id); if (el) obs.observe(el); });
  }

  // Copiar e-mail
  document.querySelectorAll('[data-copiar]').forEach(function (b) {
    b.addEventListener('click', function (ev) {
      ev.preventDefault();
      var texto = b.getAttribute('data-copiar'), orig = b.textContent;
      var ok = function () { b.textContent = 'Copiado'; setTimeout(function () { b.textContent = orig; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(ok, function () {});
    });
  });

  // Cursor e botões magnéticos (só com mouse)
  if (window.matchMedia && matchMedia('(pointer:fine)').matches && !calmo) {
    var cur = document.getElementById('cursor');
    if (cur) {
      var lab = cur.querySelector('span'), x = -100, y = -100, cx = x, cy = y;
      addEventListener('pointermove', function (e) { x = e.clientX; y = e.clientY; cur.classList.add('on'); });
      document.addEventListener('pointerleave', function () { cur.classList.remove('on'); });
      (function loop() { cx += (x - cx) * 0.2; cy += (y - cy) * 0.2; cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; requestAnimationFrame(loop); })();
      document.querySelectorAll('a,button,.peca,.lista-hover li').forEach(function (el) {
        el.addEventListener('pointerenter', function () { cur.classList.add('grande'); lab.textContent = el.getAttribute('data-cursor') || (el.matches('.peca,.lista-hover li') && !el.querySelector('a') ? 'ver' : 'abrir'); });
        el.addEventListener('pointerleave', function () { cur.classList.remove('grande'); });
      });
    }
    document.querySelectorAll('[data-mag]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.25) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.35) + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform .4s cubic-bezier(.3,1.8,.5,1)'; el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 400);
      });
    });
  }
})();
