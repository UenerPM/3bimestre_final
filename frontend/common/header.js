// header.js — injeta um header com navegação em todas as páginas
(function() {
  // adicionar CSS do header
  const cssHref = '/common/header.css';
  if (!document.querySelector(`link[href="${cssHref}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssHref;
    document.head.appendChild(link);
  }

  // marcação do header
  const navHtml = `
  <header class="site-header">
    <div class="site-brand"><a href="/menu.html">CandyShop</a></div>
    <button id="menuToggle" class="menu-toggle" aria-expanded="false" aria-label="Abrir menu">☰</button>
    <nav class="site-nav" id="siteNav">
      <a href="/menu.html" data-nav>Menu</a>
      <a href="/pessoa/pessoa.html" data-nav data-protected>Pessoa</a>
      <a href="/cargo/cargo.html" data-nav data-protected>Cargo</a>
      <a href="/produto/produto.html" data-nav data-protected>Produto</a>
      <a href="/pedido/pedido.html" data-nav data-protected>Pedido</a>
      <a href="/pedidoHasProduto/pedidoHasProduto.html" data-nav data-protected>Pedido-Produtos</a>
      <a href="/funcionario/funcionario.html" data-nav data-protected>Funcionário</a>
      <a href="/pagamento/pagamento.html" data-nav data-protected>Pagamento</a>
      <a href="/formaPagamento/formaPagamento.html" data-nav data-protected>Forma Pagto</a>
      <a href="/cliente/cliente.html" data-nav data-protected>Cliente</a>
    </nav>
    <div class="site-user" aria-live="polite">
      <div id="siteAvatar" class="site-avatar" style="display:none" title=""></div>
      <span id="siteUserName" style="display:none;"></span>
      <button id="btnLogin" style="display:none;">Login</button>
      <button id="btnLogout" style="display:none;">Sair</button>
    </div>
  </header>`;

  // inserir no topo do body se não existir
  function insertHeader() {
    if (!document.body) return;
    if (document.querySelector('.site-header')) return; // já injetado
    const container = document.createElement('div');
    container.innerHTML = navHtml;
    document.body.insertBefore(container.firstElementChild, document.body.firstChild);
    // garantir estado inicial do menu
    const btn = document.getElementById('menuToggle');
    const nav = document.getElementById('siteNav');
    if (btn) btn.textContent = '☰';
    if (nav) nav.style.display = 'none';
  }

  // API helpers
  const API_BASE = '';

  async function fetchUsuario() {
    try {
      const res = await fetch(API_BASE + '/login/verificaSeUsuarioEstaLogado', { method: 'POST', credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Erro ao buscar usuário:', err);
      return null;
    }
  }

  async function setupUserArea() {
    const userNameEl = document.getElementById('siteUserName');
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const avatarEl = document.getElementById('siteAvatar');

    // Default: show Login button and hide protected links
    btnLogin.style.display = 'inline-block';
    btnLogin.addEventListener('click', () => window.location.href = '/login/login.html');
    document.querySelectorAll('a[data-protected]').forEach(a => a.style.display = 'none');

    const data = await fetchUsuario();
    if (data && data.status === 'ok') {
      // show protected links
      document.querySelectorAll('a[data-protected]').forEach(a => a.style.display = 'inline-block');

      // show avatar + name + logout
      const nome = data.nome || '';
      userNameEl.textContent = nome;
      userNameEl.style.display = 'inline-block';
      userNameEl.title = nome;
      avatarEl.innerHTML = '';
      if (data.avatar_url) {
        // show image
        const img = document.createElement('img');
        img.src = data.avatar_url;
        img.alt = nome;
        img.className = 'site-avatar-img';
        img.onerror = () => {
          // fallback to initials
          avatarEl.textContent = getInitials(nome);
          avatarEl.style.display = 'inline-flex';
        };
        avatarEl.appendChild(img);
        avatarEl.style.display = 'inline-flex';
      } else {
        avatarEl.textContent = getInitials(nome);
        avatarEl.title = nome;
        avatarEl.style.display = 'inline-flex';
      }

      btnLogin.style.display = 'none';
      btnLogout.style.display = 'inline-block';
      btnLogout.addEventListener('click', async () => {
        try {
          await fetch('/login/logout', { method: 'POST', credentials: 'include' });
        } catch (e) {
          console.error('Erro no logout:', e);
        }
        // reload para atualizar UI
        window.location.reload();
      });
    }
  }

  function getInitials(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      insertHeader();
      setupUserArea().catch(() => {});
      setupMenuToggle();
      adjustBodyPadding();
      highlightActiveLink();
    });
  } else {
    insertHeader();
    setupUserArea().catch(() => {});
    setupMenuToggle();
    adjustBodyPadding();
    highlightActiveLink();
  }

  // highlight link
  function highlightActiveLink() {
    try {
      const links = document.querySelectorAll('a[data-nav]');
      const current = window.location.pathname.replace(/\/+$/, '');
      links.forEach(a => {
        const href = new URL(a.href, window.location.origin).pathname.replace(/\/+$/, '');
        if (href === current || (href === '/menu.html' && (current === '/' || current === '/menu.html'))) {
          a.classList.add('active-nav');
        }
      });
    } catch (e) {
      // non-critical
    }
  }

  // Menu toggle for small screens
  function setupMenuToggle() {
    try {
      const btn = document.getElementById('menuToggle');
      const nav = document.getElementById('siteNav');
      if (!btn || !nav) return;
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        if (expanded) {
          nav.style.display = '';
        } else {
          nav.style.display = 'flex';
        }
      });
      // close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!btn.contains(e.target) && !nav.contains(e.target)) {
          btn.setAttribute('aria-expanded', 'false');
          if (window.innerWidth <= 768) nav.style.display = 'none';
        }
      });
      // initial responsive state
      if (window.innerWidth <= 768) nav.style.display = 'none';
      window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
          nav.style.display = 'flex';
          btn.setAttribute('aria-expanded', 'false');
        } else {
          nav.style.display = 'none';
        }
        // recompute padding when layout may change
        if (typeof adjustBodyPadding === 'function') adjustBodyPadding();
      });
    } catch (e) {
      // non-critical
    }
  }

  // ajusta o padding-top do body para corresponder à altura do header (evita sobreposição)
  function adjustBodyPadding() {
    try {
      const header = document.querySelector('.site-header');
      if (!header) return;
      const h = header.offsetHeight || 64;
      document.body.style.paddingTop = h + 'px';
    } catch (e) {
      // ignore
    }
  }
})();
