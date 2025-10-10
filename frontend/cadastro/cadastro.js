const API_BASE_URL = 'http://localhost:3001';
const form = document.getElementById('cadastroForm');
const msgEl = document.getElementById('msg');
const btnCancelar = document.getElementById('btnCancelar');

btnCancelar.addEventListener('click', () => {
  form.reset();
  msgEl.textContent = '';
});

function validarCPF(cpf) {
  cpf = cpf.replace(/[.-]/g, ''); // Remove pontos e traços
  if (cpf.length !== 11 || /^\d{11}$/.test(cpf) === false) return false;

  let soma = 0;
  let resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  msgEl.className = 'msg';
  msgEl.textContent = '';

  const payload = {
    cpfpessoa: (document.getElementById('cpfpessoa').value || '').trim(),
    nomepessoa: (document.getElementById('nomepessoa').value || '').trim(),
    datanascimentopessoa: document.getElementById('datanascimentopessoa').value || null,
    numero: (document.getElementById('numero').value || '').trim(),
    cep: (document.getElementById('cep').value || '').trim(),
    email: (document.getElementById('email').value || '').trim(),
    senha_pessoa: (document.getElementById('senha_pessoa').value || '').trim()
  };

  // Validações detalhadas
  if (!payload.cpfpessoa) {
    showError('CPF é obrigatório.');
    return;
  }
  if (!validarCPF(payload.cpfpessoa)) {
    showError('CPF inválido.');
    return;
  }
  if (!payload.nomepessoa) {
    showError('Nome é obrigatório.');
    return;
  }
  // datanascimentopessoa e cep tornados opcionais — não bloquear cadastro se ausentes
  if (!payload.email) {
    showError('E-mail é obrigatório.');
    return;
  }
  if (!validarEmail(payload.email)) {
    showError('E-mail inválido.');
    return;
  }

  if (!payload.senha_pessoa) {
    showError('Senha é obrigatória.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/cadastro`, { // Corrige a rota para /cadastro
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    if (res.ok) {
      showSuccess('Pessoa cadastrada com sucesso!');
      form.reset();
    } else {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      showError(body.error || 'Erro ao cadastrar pessoa');
    }
  } catch (err) {
    showError('Erro de conexão com o servidor.');
    console.error(err);
  }
});

function showError(text) {
  msgEl.textContent = text;
  msgEl.className = 'msg error';
}

function showSuccess(text) {
  msgEl.textContent = text;
  msgEl.className = 'msg success';
}