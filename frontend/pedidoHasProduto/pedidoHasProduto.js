/*
    Script para a página PedidoHasProduto
    - Carrega pedidos, produtos e itens do pedido
    - Permite selecionar pedido e produto, criar/editar/deletar itens do pedido
    - Compatível com as rotas do backend em /pedidoHasProduto, /pedido e /produto
*/

const API_BASE_URL = 'http://localhost:3001';

// DOM
const form = document.getElementById('pedidoHasProdutoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');
const pedidoHasProdutoTableBody = document.getElementById('pedidoHasProdutoTableBody');
const pedidosTableBody = document.getElementById('pedidosTableBody');
const produtosTableBody = document.getElementById('produtosTableBody');
const btnConfirmarSelecao = document.getElementById('btnConfirmarSelecao');
const messageContainer = document.getElementById('messageContainer');

// campos do form
const idPedidoInput = document.getElementById('idPedido');
const idProdutoInput = document.getElementById('idProduto');
const quantidadeInput = document.getElementById('quantidade');
const pedidoSearch = document.getElementById('pedidoSearch');
const produtoSearch = document.getElementById('produtoSearch');
const pedidoDropdown = document.getElementById('pedidoDropdown');
const produtoDropdown = document.getElementById('produtoDropdown');
const btnAddItem = document.getElementById('btnAddItem');
const itensSelecionadosBody = document.getElementById('itensSelecionadosBody');

let allPedidos = [];
let allProdutos = [];
let itensSelecionados = []; // { produtoId, nomeproduto, quantidade, preco }

let operacao = null; // 'incluir' | 'alterar' | 'excluir'
let selectedPedido = null;
let selectedProduto = null; // objeto { id, nome, precounitario }

document.addEventListener('DOMContentLoaded', init);

btnBuscar && btnBuscar.addEventListener('click', buscarItensDoPedido);
btnIncluir && btnIncluir.addEventListener('click', iniciarInclusao);
btnAlterar && btnAlterar.addEventListener('click', iniciarAlteracao);
btnExcluir && btnExcluir.addEventListener('click', iniciarExclusao);
btnSalvar && btnSalvar.addEventListener('click', salvarOperacao);
btnCancelar && btnCancelar.addEventListener('click', cancelarOperacao);
btnConfirmarSelecao && btnConfirmarSelecao.addEventListener('click', confirmarSelecao);

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => { messageContainer.innerHTML = ''; }, 3000);
}

function limparFormulario() {
    if (form) form.reset();
    selectedProduto = null;
}

function setModo(modo) {
    operacao = modo;
    // Comportamento de botões alinhado ao cargo.js
    // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    switch (modo) {
        case 'novo':
        case 'editar':
        case 'excluir':
            mostrarBotoes(false, false, false, false, true, true);
            break;
        case 'itemsLoaded':
            mostrarBotoes(true, true, false, false, false, false);
            break;
        case 'itemSelected':
            mostrarBotoes(true, false, true, true, false, false);
            break;
        default:
            mostrarBotoes(true, false, false, false, false, false);
            break;
    }
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    if (btnBuscar) btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    if (btnIncluir) btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    if (btnAlterar) btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    if (btnExcluir) btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    if (btnSalvar) btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    if (btnCancelar) btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

async function init() {
    setModo('default');
    await carregarPedidos();
    await carregarProdutos();
    setupCombos();
}

// Carrega todos os pedidos para seleção
async function carregarPedidos() {
    try {
        const res = await fetch(`${API_BASE_URL}/pedido`);
        if (!res.ok) throw new Error('Erro ao carregar pedidos');
        const pedidos = await res.json();
        renderizarTabelaPedidos(pedidos);
        // garantir array disponível para os combos
        allPedidos = pedidos || [];
    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro ao carregar pedidos', 'error');
    }
}

async function carregarProdutos() {
    try {
        const res = await fetch(`${API_BASE_URL}/produto`);
        if (!res.ok) throw new Error('Erro ao carregar produtos');
        const produtos = await res.json();
        renderizarTabelaProdutos(produtos);
        // garantir array disponível para os combos
        allProdutos = produtos || [];
    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro ao carregar produtos', 'error');
    }
}

// Implementações substitutas para as funções removidas anteriormente.
// Elas preenchem os arrays usados pelos comboboxes e, se existirem
// as tabelas de seleção no DOM, também as renderizam para compatibilidade.
function renderizarTabelaPedidos(pedidos) {
    // garantir formato
    allPedidos = pedidos || [];
    if (!pedidosTableBody) return;
    pedidosTableBody.innerHTML = '';
    allPedidos.forEach(p => {
        const tr = document.createElement('tr');
        const id = p.idpedido ?? p.idpedido ?? p.PedidoIdPedido ?? '';
        const date = p.datadopedido ? new Date(p.datadopedido).toLocaleDateString('pt-BR') : '';
        tr.innerHTML = `<td>${id}</td><td>${date}</td>`;
        tr.addEventListener('click', () => selecionarPedido(id));
        pedidosTableBody.appendChild(tr);
    });
}

function renderizarTabelaProdutos(produtos) {
    allProdutos = produtos || [];
    if (!produtosTableBody) return;
    produtosTableBody.innerHTML = '';
    allProdutos.forEach(p => {
        const tr = document.createElement('tr');
        const id = p.idproduto ?? p.idproduto ?? '';
        const nome = p.nomeproduto ?? p.nome ?? '';
        const preco = p.precounitario ?? p.precoUnitario ?? '';
        tr.innerHTML = `<td>${id}</td><td>${nome}</td><td>${preco}</td>`;
        tr.addEventListener('click', () => selecionarProduto({ id: id, nomeproduto: nome, precounitario: preco }));
        produtosTableBody.appendChild(tr);
    });
}

// Carrega todos os itens de PedidoHasProduto
async function carregarItens() {
    try {
        const res = await fetch(`${API_BASE_URL}/pedidoHasProduto`);
        if (!res.ok) throw new Error('Erro ao carregar itens');
        const itens = await res.json();
        renderizarTabelaItens(itens);
    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro ao carregar itens do pedido', 'error');
    }
}

// Tabelas de seleção removidas — usamos combobox pesquisável e lista local de itens

function renderizarTabelaItens(itens) {
    pedidoHasProdutoTableBody.innerHTML = '';
    itens.forEach((item, index) => {
        // suportar diferentes formatos retornados pelo backend
        const pedidoId = item.pedidoId ?? item.PedidoIdPedido ?? item.pedidoidpedido ?? item.pedidoid ?? item.pedidoId ?? '';
        const produtoId = item.produtoId ?? item.ProdutoIdProduto ?? item.produtoidproduto ?? item.produtoid ?? item.produtoId ?? '';
        const quantidade = item.quantidade ?? item.qtd ?? '';
        const preco = item.precoUnitario ?? item.precounitario ?? item.preco ?? 0;
        const nomeProduto = item.nomeProduto ?? item.nomeproduto ?? item.nome ?? '';
        const dataDoPedido = item.dataDoPedido ?? item.datadopedido ?? item.dataDoPedido ?? '';
        const dataFmt = dataDoPedido ? new Date(dataDoPedido).toLocaleDateString('pt-BR') : '';
        const subtotal = (Number(preco) * Number(quantidade)) ? (Number(preco) * Number(quantidade)).toFixed(2) : '';

        const tr = document.createElement('tr');
        tr.dataset.pedido = pedidoId;
        tr.dataset.produto = produtoId;
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${pedidoId}${dataFmt ? ' - ' + dataFmt : ''}</td>
            <td>${produtoId}${nomeProduto ? ' - ' + nomeProduto : ''}</td>
            <td>${quantidade}</td>
            <td>${preco !== null ? Number(preco).toFixed(2) : ''}</td>
            <td>${subtotal}</td>
            <td><button type="button" class="btn-delete-item" data-pedido="${pedidoId}" data-produto="${produtoId}">Excluir</button></td>
        `;
        // ao clicar na linha, seleciona o item e habilita botões de ação
        tr.addEventListener('click', () => {
            // highlight
            pedidoHasProdutoTableBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
            tr.classList.add('selected');
            prepararEdicao(pedidoId, produtoId);
        });
        pedidoHasProdutoTableBody.appendChild(tr);
        // ação excluir por linha
        tr.querySelectorAll('.btn-delete-item').forEach(btn => btn.addEventListener('click', ev => {
            const p = btn.getAttribute('data-pedido');
            const pr = btn.getAttribute('data-produto');
            deletarItem(p, pr);
        }));
    });
}

function selecionarPedido(id) {
    selectedPedido = id;
    idPedidoInput.value = id;
    // preencher o search e esconder dropdown
    if (pedidoSearch) pedidoSearch.value = id;
    if (pedidoDropdown) pedidoDropdown.innerHTML = '';
    mostrarMensagem(`Pedido ${id} selecionado`, 'success');
}

function selecionarProduto(prod) {
    selectedProduto = prod;
    // preencher o search e esconder dropdown
    if (produtoSearch) produtoSearch.value = prod.id + ' - ' + (prod.nomeproduto || '');
    if (produtoDropdown) produtoDropdown.innerHTML = '';
    idProdutoInput.value = prod.id;
    mostrarMensagem(`Produto ${prod.id} selecionado (preço ${prod.precounitario})`, 'success');
}

function iniciarInclusao() {
    limparFormulario();
    setModo('novo');
    operacao = 'incluir';
}

function iniciarAlteracao() {
    if (!idPedidoInput.value || !idProdutoInput.value) {
        mostrarMensagem('Selecione um pedido e um produto para alterar', 'warning');
        return;
    }
    setModo('editar');
    operacao = 'alterar';
}

function iniciarExclusao() {
    if (!idPedidoInput.value || !idProdutoInput.value) {
        mostrarMensagem('Selecione um pedido e um produto para excluir', 'warning');
        return;
    }
    setModo('excluir');
    operacao = 'excluir';
}

function cancelarOperacao() {
    limparFormulario();
    setModo('default');
    operacao = null;
}

async function buscarItensDoPedido() {
    const pedidoId = searchId.value.trim();
    if (!pedidoId) {
        mostrarMensagem('Digite o ID do pedido para buscar', 'warning');
        return;
    }
    try {
        const res = await fetch(`${API_BASE_URL}/pedidoHasProduto/${pedidoId}`);
        if (res.status === 404) {
            mostrarMensagem('Pedido não encontrado ou sem itens', 'info');
            pedidoHasProdutoTableBody.innerHTML = '';
            return;
        }
        if (!res.ok) throw new Error('Erro ao buscar itens do pedido');
        const itens = await res.json();
        renderizarTabelaItens(itens);
        // após busca feita pelo usuário, permitir inclusão de itens para este pedido
        setModo('itemsLoaded');
    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro ao buscar itens do pedido', 'error');
    }
}

async function salvarOperacao() {
    // Enviar todos os itens selecionados em batch (caso haja itens na lista)
    const pedidoId = idPedidoInput.value.trim();
    if (!pedidoId) return mostrarMensagem('Selecione um pedido antes de salvar', 'warning');
    if (!itensSelecionados || itensSelecionados.length === 0) return mostrarMensagem('Adicione pelo menos um item antes de salvar', 'warning');

    try {
        const payload = itensSelecionados.map(it => ({ ProdutoIdProduto: Number(it.produtoId), PedidoIdPedido: Number(pedidoId), quantidade: Number(it.quantidade), precoUnitario: it.preco }));
        const res = await fetch(`${API_BASE_URL}/pedidoHasProduto/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itens: payload })
        });
        if (res.ok) {
            mostrarMensagem('Itens adicionados com sucesso', 'success');
            itensSelecionados = [];
            renderizarItensSelecionados();
            await carregarItens();
            setModo('default');
        } else {
            const body = await res.json().catch(() => ({}));
            mostrarMensagem(body.error || 'Erro ao salvar itens', 'error');
        }
    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro ao salvar itens', 'error');
    }
}

// adicionar item localmente à lista de itensSelecionados
function adicionarItemLista() {
    const produtoId = idProdutoInput.value.trim();
    const quantidade = Number(quantidadeInput.value);
    if (!produtoId || !quantidade) return mostrarMensagem('Produto e quantidade são obrigatórios', 'warning');
    const produto = allProdutos.find(p => String(p.idproduto) === String(produtoId) || String(p.idproduto) === String(produtoId));
    const preco = produto ? (produto.precounitario || produto.precoUnitario || 0) : 0;
    const nome = produto ? (produto.nomeproduto || produto.nome || '') : '';
    itensSelecionados.push({ produtoId: Number(produtoId), nomeproduto: nome, quantidade: Number(quantidade), preco });
    renderizarItensSelecionados();
}

function renderizarItensSelecionados() {
    itensSelecionadosBody.innerHTML = '';
    itensSelecionados.forEach((it, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${it.nomeproduto || it.produtoId}</td><td>${it.quantidade}</td><td>${it.preco || ''}</td><td><button type="button" data-idx="${idx}" class="btn-remove-item">Remover</button></td>`;
        itensSelecionadosBody.appendChild(tr);
    });
    itensSelecionadosBody.querySelectorAll('.btn-remove-item').forEach(btn => btn.addEventListener('click', ev => {
        const idx = Number(btn.getAttribute('data-idx'));
        itensSelecionados.splice(idx, 1);
        renderizarItensSelecionados();
    }));
}

function setupCombos() {
    // filtro simples para pedidos
    if (pedidoSearch) {
        pedidoSearch.addEventListener('input', () => {
            const q = String(pedidoSearch.value || '').trim().toLowerCase();
            pedidoDropdown.innerHTML = '';
            if (!q) return;
            const matches = allPedidos.filter(p => String(p.idpedido).includes(q) || (p.datadopedido && new Date(p.datadopedido).toLocaleDateString('pt-BR').includes(q)) ).slice(0, 10);
            matches.forEach(m => {
                const d = document.createElement('div');
                d.className = 'combo-item';
                d.textContent = `${m.idpedido} - ${m.datadopedido ? new Date(m.datadopedido).toLocaleDateString('pt-BR') : ''}`;
                d.addEventListener('click', () => {
                    selecionarPedido(m.idpedido);
                });
                pedidoDropdown.appendChild(d);
            });
        });
    }
    // filtro simples para produtos
    if (produtoSearch) {
        produtoSearch.addEventListener('input', () => {
            const q = String(produtoSearch.value || '').trim().toLowerCase();
            produtoDropdown.innerHTML = '';
            if (!q) return;
            const matches = allProdutos.filter(p => String(p.idproduto).includes(q) || (p.nomeproduto && p.nomeproduto.toLowerCase().includes(q))).slice(0, 10);
            matches.forEach(m => {
                const d = document.createElement('div');
                d.className = 'combo-item';
                d.textContent = `${m.idproduto} - ${m.nomeproduto || ''} (${m.precounitario || ''})`;
                d.addEventListener('click', () => {
                    selecionarProduto({ id: m.idproduto, nomeproduto: m.nomeproduto, precounitario: m.precounitario });
                });
                produtoDropdown.appendChild(d);
            });
        });
    }
    if (btnAddItem) btnAddItem.addEventListener('click', adicionarItemLista);
}

async function prepararEdicao(pedidoId, produtoId) {
    // preenche o formulário com os dados do item selecionado
    try {
        const res = await fetch(`${API_BASE_URL}/pedidoHasProduto/${pedidoId}`);
        if (!res.ok) throw new Error('Erro ao buscar itens');
        const itens = await res.json();
        const item = itens.find(it => String(it.ProdutoIdProduto || it.produtoid || it.produtoId) === String(produtoId));
        if (!item) {
            mostrarMensagem('Item não encontrado', 'error');
            return;
        }
        idPedidoInput.value = pedidoId;
        idProdutoInput.value = produtoId;
        quantidadeInput.value = item.quantidade;
        selectedProduto = { id: Number(produtoId), precounitario: item.precounitario ?? item.precoUnitario };
        // agora que um item foi selecionado, habilita alterar/excluir
        setModo('itemSelected');
        operacao = null; // espera usuário escolher alterar ou excluir
    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro ao preparar edição', 'error');
    }
}

async function deletarItem(pedidoId, produtoId) {
    if (!confirm('Confirma exclusão deste item do pedido?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/pedidoHasProduto/${pedidoId}?produto=${produtoId}`, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            mostrarMensagem('Item excluído', 'success');
            await carregarItens();
        } else {
            const body = await res.json().catch(() => ({}));
            mostrarMensagem(body.error || 'Erro ao excluir item', 'error');
        }
    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro ao excluir item', 'error');
    }
}

function confirmarSelecao() {
    // função auxiliar caso queira confirmar seleção pedidos/produtos
    if (idPedidoInput.value) selecionarPedido(idPedidoInput.value);
    if (idProdutoInput.value) selecionarProduto({ id: Number(idProdutoInput.value), precounitario: selectedProduto ? selectedProduto.precounitario : null });
}

