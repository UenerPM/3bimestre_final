// Arquivo legado: redireciona para o CRUD unificado de Pessoa
document.addEventListener('DOMContentLoaded', () => {
  console.log('funcionario.js: página consolidada para /pessoa/pessoa.html');
  if (window.location.pathname.indexOf('/funcionario') !== -1) {
    setTimeout(() => window.location.href = '/pessoa/pessoa.html', 1000);
  }
});

// Nota: Lógica específica de funcionário foi consolidada em `pessoa/pessoa.js`.
