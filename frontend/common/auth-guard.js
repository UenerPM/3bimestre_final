// auth-guard.js — include this script in protected pages to redirect to login when unauthenticated
(async function() {
  const API = '';
  try {
  const res = await fetch(API + '/login/verificaSeUsuarioEstaLogado', { method: 'POST', credentials: 'include' });
    if (!res.ok) {
      // redirect to login
      window.location.href = '/login/login.html';
      return;
    }
    const data = await res.json();
    if (!data || data.status !== 'ok') {
      // not logged in -> redirect
      window.location.href = '/login/login.html';
      return;
    }
    // logged in -> do nothing
  } catch (err) {
    console.error('Erro auth-guard:', err);
    window.location.href = '/login/login.html';
  }
})();
