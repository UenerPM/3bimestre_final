// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPedidoId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('pedidoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pedidosTableBody = document.getElementById('pedidosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de pedidos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarPedidos();
    // agora usamos /pessoa para popular os selects de cliente e funcionário (consolidação)
    carregarPessoasParaPedido();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPedido);
btnIncluir.addEventListener('click', incluirPedido);
btnAlterar.addEventListener('click', alterarPedido);
btnExcluir.addEventListener('click', excluirPedido);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(desbloquear) {
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        if (input === searchId) {
            // searchId sempre desabilitado durante edição (para não mudar o ID)
            input.disabled = desbloquear;
        } else {
            // Outros campos habilitados quando desbloquear = true
            input.disabled = !desbloquear;
        }
    });
}

// Função para limpar formulário
function limparFormulario() {
    form.reset();
}

// Carregar pessoas para popular os comboboxes de Cliente e Funcionário no pedido
async function carregarPessoasParaPedido() {
    try {
        const response = await fetch(`${API_BASE_URL}/pessoa`);
        if (!response.ok) {
            console.warn('Não foi possível carregar pessoas:', response.statusText);
            return;
        }
        const pessoas = await response.json();
        console.log('pessoas recebidas:', pessoas);

        // Popula ambos selects (cliente e funcionário) com a mesma base de pessoas.
        const selectCliente = document.getElementById('ClientePessoaCpfPessoa');
        const selectFuncionario = document.getElementById('FuncionarioPessoaCpfPessoa');
        if (selectCliente) selectCliente.innerHTML = '<option value="">-- selecione um cliente --</option>';
        if (selectFuncionario) selectFuncionario.innerHTML = '<option value="">-- selecione um funcionário --</option>';

        pessoas.forEach(p => {
            const cpf = (p.cpfpessoa || p.cpf || p.pessoacpfpessoa || p.pessoaCpfPessoa) && String(p.cpfpessoa || p.cpf || p.pessoacpfpessoa || p.pessoaCpfPessoa).trim();
            const name = (p.nomepessoa || p.nome || p.name) && String(p.nomepessoa || p.nome || p.name).trim();
            if (!cpf) return;
            const option = document.createElement('option');
            option.value = cpf;
            option.textContent = `${cpf}${name ? ' - ' + name : ''}`;
            if (selectCliente) selectCliente.appendChild(option.cloneNode(true));
            if (selectFuncionario) selectFuncionario.appendChild(option.cloneNode(true));
        });
    } catch (err) {
        console.error('Erro ao carregar pessoas para pedido:', err);
    }
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Função para buscar pedido por ID
async function buscarPedido() {
    const idPedido = searchId.value.trim();

    if (!idPedido) {
        mostrarMensagem('O campo ID está vazio. Por favor, preencha antes de buscar.', 'warning');
        return;
    }

    bloquearCampos(false);
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/pedido/${idPedido}`);

        if (response.ok) {
            const pedido = await response.json();
            preencherFormulario(pedido);

            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pedido encontrado!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = idPedido;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Pedido não encontrado. Você pode incluir um novo pedido.', 'info');
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar pedido');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar pedido', 'error');
    }
}

// Função para preencher formulário com dados do pedido
function preencherFormulario(pedido) {
    currentPedidoId = pedido.idpedido || pedido.idPedido;
    document.getElementById('idPedido').value = pedido.idpedido || pedido.idPedido || '';
    document.getElementById('dataDoPedido').value = pedido.datadopedido || pedido.dataDoPedido || '';
    document.getElementById('ClientePessoaCpfPessoa').value = pedido.clientepessoacpfpessoa || pedido.ClientePessoaCpfPessoa || '';
    document.getElementById('FuncionarioPessoaCpfPessoa').value = pedido.funcionariopessoacpfpessoa || pedido.FuncionarioPessoaCpfPessoa || '';
}

// Função para incluir pedido
async function incluirPedido() {
    mostrarMensagem('Digite os dados!', 'success');
    currentPedidoId = searchId.value;
    limparFormulario();
    searchId.value = currentPedidoId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('dataDoPedido').focus();
    operacao = 'incluir';
}

// Função para alterar pedido
async function alterarPedido() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('dataDoPedido').focus();
    operacao = 'alterar';
}

// Função para excluir pedido
async function excluirPedido() {
    mostrarMensagem('Excluindo pedido...', 'info');
    currentPedidoId = searchId.value;
    searchId.disabled = true;
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

async function salvarOperacao() {
    const formData = new FormData(form);
    const pedido = {
        idpedido: searchId.value.trim(),
        dataDoPedido: formData.get('dataDoPedido') || '',
        ClientePessoaCpfPessoa: formData.get('ClientePessoaCpfPessoa') || '',
        FuncionarioPessoaCpfPessoa: formData.get('FuncionarioPessoaCpfPessoa') || ''
    };

    // Validação cliente/funcionário selecionados
    if (!pedido.ClientePessoaCpfPessoa) {
        mostrarMensagem('Selecione um cliente antes de salvar.', 'warning');
        return;
    }
    if (!pedido.FuncionarioPessoaCpfPessoa) {
        mostrarMensagem('Selecione um funcionário antes de salvar.', 'warning');
        return;
    }

    try {
        let responsePedido;

        if (operacao === 'incluir') {
            responsePedido = await fetch(`${API_BASE_URL}/pedido`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pedido)
            });
        } else if (operacao === 'alterar') {
            responsePedido = await fetch(`${API_BASE_URL}/pedido/${currentPedidoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pedido)
            });
        } else if (operacao === 'excluir') {
            responsePedido = await fetch(`${API_BASE_URL}/pedido/${currentPedidoId}`, {
                method: 'DELETE'
            });
        }

        if (responsePedido.ok && (operacao === 'incluir' || operacao === 'alterar')) {
            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
            carregarPedidos();
        } else if (operacao === 'excluir') {
            mostrarMensagem('Pedido excluído com sucesso!', 'success');
            limparFormulario();
            carregarPedidos();
        } else {
            const error = await responsePedido.json();
            mostrarMensagem(error.error || 'Erro ao incluir pedido', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao incluir ou alterar o pedido', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    document.getElementById('searchId').focus();
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para carregar lista de pedidos
async function carregarPedidos() {
    try {
        const response = await fetch(`${API_BASE_URL}/pedido`);

        if (response.ok) {
            const pedidos = await response.json();
            console.log('Pedidos carregados com sucesso:', pedidos); // Log detalhado
            if (pedidos.length === 0) {
                mostrarMensagem('Nenhum pedido encontrado.', 'info');
            }
            renderizarTabelaPedidos(pedidos);
        } else {
            throw new Error(`Erro ao carregar pedidos: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error); // Log detalhado
        mostrarMensagem('Erro ao carregar lista de pedidos', 'error');
    }
}

// Função para renderizar tabela de pedidos
function renderizarTabelaPedidos(pedidos) {
    console.log('Renderizando tabela com pedidos:', pedidos); // Log detalhado
    pedidosTableBody.innerHTML = '';

    if (!pedidos || pedidos.length === 0) {
        pedidosTableBody.innerHTML = '<tr><td colspan="4">Nenhum pedido encontrado.</td></tr>';
        return;
    }

    pedidos.forEach(pedido => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarPedido('${pedido.idpedido || ''}')">
                    ${pedido.idpedido || 'N/A'}
                </button>
            </td>
            <td>${pedido.datadopedido || 'N/A'}</td>
            <td>${pedido.clientepessoacpfpessoa || 'N/A'}</td>
            <td>${pedido.funcionariopessoacpfpessoa || 'N/A'}</td>
        `;
        pedidosTableBody.appendChild(row);
    });
}

// Função para selecionar pedido da tabela
async function selecionarPedido(id) {
    searchId.value = id;
    await buscarPedido();
}
