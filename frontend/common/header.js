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

  // marcação do header (menu simples via dropdown)
  const navHtml = `
  <header class="site-header">
    <div class="site-brand">
      <a href="/menu.html">CandyShop</a>
    </div>

    <div class="site-controls">
      <button id="menuToggle" class="menu-toggle" aria-expanded="false" aria-label="Abrir menu">
        <span class="menu-icon">☰</span>
        <span class="menu-label">Menu</span>
      </button>

      <nav class="site-nav" id="siteNav" role="menu" aria-hidden="true">
        <ul class="dropdown-menu">
          <li><a href="/dashboard/dashboard.html" data-nav data-protected class="nav-item" role="menuitem">📊 Dashboard</a></li>
          <li><a href="/pessoa/pessoa.html" data-nav data-protected class="nav-item" role="menuitem">Pessoa</a></li>
          <li><a href="/produto/produto.html" data-nav data-protected class="nav-item" role="menuitem">Produto</a></li>
          <li><a href="/cargo/cargo.html" data-nav data-protected class="nav-item" role="menuitem">Cargo</a></li>
          <li><a href="/pedido/pedido.html" data-nav data-protected class="nav-item" role="menuitem">Pedido</a></li>
          <li><a href="/pedidoHasProduto/pedidoHasProduto.html" data-nav data-protected class="nav-item" role="menuitem">Pedido_has_Produto</a></li>
          <li><a href="/pagamento/pagamento.html" data-nav data-protected class="nav-item" role="menuitem">Pagamento</a></li>
          <li><a href="/formaPagamento/formaPagamento.html" data-nav data-protected class="nav-item" role="menuitem">Forma de Pagamento</a></li>
        </ul>
      </nav>
    </div>

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
    const existing = document.querySelector('.site-header');
    if (existing) {
      // se já contém nós filhos, assume que o header está completo
      if (existing.children && existing.children.length > 0) {
        // nada a fazer
      } else {
        // substituir header vazio pelo markup enriquecido
        const container = document.createElement('div');
        container.innerHTML = navHtml;
        const newHeader = container.firstElementChild;
        existing.parentNode.replaceChild(newHeader, existing);
      }
    } else {
      const container = document.createElement('div');
      container.innerHTML = navHtml;
      document.body.insertBefore(container.firstElementChild, document.body.firstChild);
    }
    // garantir estado inicial do menu (acessibilidade)
    const btn = document.getElementById('menuToggle');
    const nav = document.getElementById('siteNav');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (nav) nav.setAttribute('aria-hidden', 'true');
  }

  // API helpers
  const API_BASE = '';

  async function fetchUsuario() {
    try {
      const res = await fetch(API_BASE + '/login/verificaSeUsuarioEstaLogado', { method: 'POST', credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      // normalize to camelCase fields expected by frontend
      if (data) {
        if (data.avatar_url && !data.avatarUrl) data.avatarUrl = data.avatar_url;
        if (data.avatarUrl && !data.avatar_url) data.avatar_url = data.avatarUrl;
        // isFuncionario may come as isFuncionario or is_funcionario (rare) — normalize both ways
        if (typeof data.is_funcionario === 'boolean' && typeof data.isFuncionario === 'undefined') data.isFuncionario = data.is_funcionario;
        if (typeof data.isFuncionario === 'boolean' && typeof data.is_funcionario === 'undefined') data.is_funcionario = data.isFuncionario;
      }
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
      // show protected links only if usuário é funcionário
      if (data.isFuncionario) {
        document.querySelectorAll('a[data-protected]').forEach(a => a.style.display = 'inline-block');
      } else {
        // garante que não apareçam links CRUD para usuários não-funcionários
        document.querySelectorAll('a[data-protected]').forEach(a => a.style.display = 'none');
      }

      // show avatar + name + logout
      const nome = data.nome || '';
      userNameEl.textContent = nome;
      userNameEl.style.display = 'inline-block';
      userNameEl.title = nome;
      avatarEl.innerHTML = '';
      if (data.avatarUrl) {
        // show image
        const img = document.createElement('img');
        img.src = data.avatarUrl;
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

  // Menu toggle (dropdown) simples
  function setupMenuToggle() {
    try {
      const btn = document.getElementById('menuToggle');
      const nav = document.getElementById('siteNav');
      if (!btn || !nav) return;

      let menuOpen = false;
      function openMenu() {
        nav.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        nav.setAttribute('aria-hidden', 'false');
        menuOpen = true;
        // foco acessível
        const first = nav.querySelector('a');
        if (first) first.focus();
      }
      function closeMenu() {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        nav.setAttribute('aria-hidden', 'true');
        menuOpen = false;
      }
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (menuOpen) {
          closeMenu();
        } else {
          openMenu();
        }
      });
      // fechar ao clicar fora
      document.addEventListener('mousedown', (e) => {
        if (menuOpen && !nav.contains(e.target) && !btn.contains(e.target)) closeMenu();
      });
      // fechar com ESC
      document.addEventListener('keydown', (e) => {
        if (menuOpen && e.key === 'Escape') closeMenu();
      });
      // fechar ao clicar em link
      nav.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') closeMenu();
      });
      // garantir estado inicial
      closeMenu();
      // ajustar padding-top quando necessário
      if (typeof adjustBodyPadding === 'function') {
        window.addEventListener('resize', adjustBodyPadding);
      }
    } catch (e) {
      console.warn('Menu toggle setup failed:', e);
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
