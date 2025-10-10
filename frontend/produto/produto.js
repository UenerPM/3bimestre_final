// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentProductId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('produtoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const produtosTableBody = document.getElementById('produtosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de produtos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarProduto);
btnIncluir.addEventListener('click', incluirProduto);
btnAlterar.addEventListener('click', alterarProduto);
btnExcluir.addEventListener('click', excluirProduto);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
bloquearCampos(false);//libera pk e bloqueia os demais campos

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        input.disabled = index === 0 ? bloquearPrimeiro : !bloquearPrimeiro;
    });
}

// Função para limpar formulário
function limparFormulario() {
    form.reset();
}


function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Função para formatar data para exibição
function formatarData(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// Função para buscar produto por ID
async function buscarProduto() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    try {
        const response = await fetch(`${API_BASE_URL}/produto/${id}`);
        if (response.ok) {
            const produto = await response.json();
            preencherFormulario(produto);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Produto encontrado!', 'success');
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Produto não encontrado.', 'info');
        } else {
            throw new Error('Erro ao buscar produto');
        }
    } catch (error) {
        mostrarMensagem('Erro ao buscar produto', 'error');
    }
}

// Função para preencher formulário com dados da produto
async function preencherFormulario(produto) {
    currentProductId = produto.idproduto;
    searchId.value = produto.idproduto;
    document.getElementById('noemproduto').value = produto.nomeproduto || '';
    document.getElementById('quantidadeemestoque').value = produto.quantidadeemestoque || '';
    document.getElementById('precounitario').value = produto.precounitario || '';
}



// Função para incluir produto
async function incluirProduto() {

    mostrarMensagem('Digite os dados!', 'success');
    currentProductId = searchId.value;
    limparFormulario();
    searchId.value = currentProductId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('noemproduto').focus();
    operacao = 'incluir';
}

// Função para alterar produto
async function alterarProduto() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('noemproduto').focus();
    operacao = 'alterar';
}

// Função para excluir produto
async function excluirProduto() {
    mostrarMensagem('Excluindo produto...', 'info');
    currentPersonId = searchId.value;
    //bloquear searchId
    searchId.disabled = true;
    bloquearCampos(false); // libera os demais campos
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)           
    operacao = 'excluir';
}

async function salvarOperacao() {
    const produto = {
        idproduto: searchId.value,
        nomeproduto: form.noemproduto.value,
        quantidadeemestoque: form.quantidadeemestoque.value,
        precounitario: form.precounitario.value,
    };
    console.log('Dados enviados para o backend:', produto); // Log para depuração
    let response = null;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/produto`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(produto)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/produto/${currentProductId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(produto)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/produto/${currentProductId}`, {
                method: 'DELETE'
            });
        }

        // Log detalhado da resposta do servidor
        console.log('Resposta do servidor:', response);
        if (response.ok) {
            const responseData = await response.json();
            console.log('Dados retornados pelo servidor:', responseData);
            mostrarMensagem('Operação realizada com sucesso!', 'success');
            limparFormulario();
            carregarProdutos();
        } else {
            const errorData = await response.json();
            console.error('Erro retornado pelo servidor:', errorData);
            mostrarMensagem(`Erro ao realizar operação: ${errorData.error || 'Erro desconhecido'}`, 'error');
        }
    } catch (error) {
        console.error('Erro ao realizar operação:', error);
        mostrarMensagem('Erro ao realizar operação', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    document.getElementById('searchId').focus();
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false);//libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para carregar lista de produto
async function carregarProdutos() {
    try {
        const response = await fetch(`${API_BASE_URL}/produto`);
        //    debugger
        if (response.ok) {
            const produtos = await response.json();
            renderizarTabelaProdutos(produtos);
        } else {
            throw new Error('Erro ao carregar produtos');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de produtos', 'error');
    }
}

// Função para renderizar tabela de produtos
function renderizarTabelaProdutos(produtos) {
    produtosTableBody.innerHTML = '';

    produtos.forEach(produto => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>
                        <button class="btn-id" onclick="selecionarProduto(${produto.idproduto})">
                            ${produto.idproduto}
                        </button>
                    </td>
                    <td>${produto.nomeproduto}</td>
                    <td> ${formatarData(produto.quantidadeemestoque)}</td>
                    <td>${produto.precounitario}</td>
                `;
        produtosTableBody.appendChild(row);
    });
}

// Função para selecionar produto da tabela
async function selecionarProduto(id) {
    searchId.value = id;
    await buscarProduto();
}
