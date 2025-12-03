function handleUserAction(action) {
  if (action === "gerenciar-conta") {
    alert("Redirecionando para a página de Gerenciar Conta...");
    // window.location.href = "/gerenciar-conta";
  } else if (action === "sair") {
    alert("Desconectando...");
    // logout();
  }
}

// A função 'logout' original
function logout() {
  alert("Desconectando...");
  // window.location.href = "/login";
}

const API_BASE_URL = 'http://localhost:3001';
let ehProfessor = false;



//essa função só existe para teste inicial
function nomeUsuario() {
  const combobox = document.getElementById("oUsuario");
  // Se a combobox não existir nesta página, apenas retorna (script pode ser incluído globalmente)
  if (!combobox) return;
  if (!combobox.options || combobox.options.length === 0) return;
  const primeiraOpcao = combobox.options[0];
  primeiraOpcao.text = "Berola da Silva";

  //  usuarioAutorizado();


}

// Chame a função quando a página carregar
window.onload = nomeUsuario;

async function usuarioAutorizado() {
  const rota = API_BASE_URL + '/login/verificaSeUsuarioEstaLogado';
  alert('Rota: ' + rota);

  const res = await fetch(rota, { method: 'POST', credentials: 'include' });
  const data = await res.json();

  if (data && data.status === 'ok') {
    document.getElementById('boasVindas').innerText =
      `${data.nome} - ${data.mnemonicoProfessor ? `Professor: ${data.mnemonicoProfessor}` : ''}`;
    if (data.mnemonicoProfessor) ehProfessor = true;
  } else {
    alert('Você precisa fazer login.');
    window.location.href = './login/login.html';
  }
}

async function logout2() {
  await fetch('http://localhost:3001/logout', {
    method: 'POST',
    credentials: 'include'
  });
  window.location.href = "/menu.html";
}

// Adicionando funcionalidade para gerenciar pedidos
function gerenciarPedidos() {
  window.location.href = './pedido/pedido.html';
}

// Adicionando botão para gerenciar pedidos (só se o elemento 'menu' existir na página)
const menu = document.getElementById('menu');
if (menu) {
  const botaoPedidos = document.createElement('button');
  botaoPedidos.innerText = 'Gerenciar Pedidos';
  botaoPedidos.onclick = gerenciarPedidos;
  menu.appendChild(botaoPedidos);
}

// usuarioAutorizado();