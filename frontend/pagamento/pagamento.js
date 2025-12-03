// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPagamentoId = null;
let operacao = null;
// cache das formas de pagamento: { id: nome }
const formasMap = new Map();

// Funções de utilidade
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Formatação de valores monetários
function formatMoney(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '-';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(num);
}

// Formata data para exibição
function formatDate(isoDate) {
    if (!isoDate) return '';
    try {
        const d = new Date(isoDate);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('pt-BR');
    } catch (e) {
        console.error('Erro ao formatar data:', e);
        return isoDate;
    }
}

// util: tenta várias chaves possíveis em um objeto e retorna o primeiro valor definido
function pickField(obj, keys) {
    if (!obj || !keys || !Array.isArray(keys)) return undefined;
    for (const k of keys) {
        if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) return obj[k];
        // também checar case-insensitive
        const low = k.toLowerCase();
        for (const prop of Object.keys(obj)) {
            if (prop.toLowerCase() === low && obj[prop] != null) return obj[prop];
        }
    }
    return undefined;
}

// Elementos do DOM
const form = document.getElementById('pagamentoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pagamentosTableBody = document.getElementById('pagamentosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de pagamentos ao inicializar
document.addEventListener('DOMContentLoaded', async () => {
    // carregar formas e pedidos primeiro (para popular selects), depois carregar pagamentos
    await carregarFormasPagamentos();
    await carregarPedidosParaSelect();
    await carregarPagamentos();
    mostrarBotoes(true, true, false, false, false, false);
    bloquearCampos(false);
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPagamento);
btnIncluir.addEventListener('click', incluirPagamento);
btnAlterar.addEventListener('click', alterarPagamento);
btnExcluir.addEventListener('click', excluirPagamento);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);



// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `
        <div class="message message-${tipo}">
            ${escapeHtml(texto)}
        </div>
    `;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 5000);
}

function bloquearCampos(desbloquear) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input === searchId) {
            input.disabled = desbloquear;
        } else {
            input.disabled = !desbloquear;
        }
    });
}

// Função para limpar formulário
function limparFormulario() {
    form.reset();
}

// (select de pedidos removido) Antes carregávamos a lista de pedidos; agora usamos o campo `pedidoId` manual.

async function carregarFormasPagamentos() {
    // Carrega as formas de pagamento do backend e popula o select + cache (formasMap)
    try {
        const res = await fetch(`${API_BASE_URL}/formaPagamento`);
        if (!res.ok) throw new Error('Falha ao carregar formas de pagamento');
        const list = await res.json();

        const select = document.getElementById('formaPagamento');
        if (!select) return;

        // limpar e inserir opção padrão
        select.innerHTML = '<option value="">Selecione...</option>';

        formasMap.clear();

        list.forEach(f => {
            // backend retorna alias idformadepagamento e nomeformapagamento
            const id = f.idformadepagamento ?? f.id ?? f.idFormaPagamento;
            const nome = f.nomeformapagamento ?? f.nome ?? f.nomeFormaPagamento ?? String(id);
            if (id == null) return;
            formasMap.set(String(id), nome);

            const option = document.createElement('option');
            option.value = String(id);
            option.textContent = nome;
            select.appendChild(option);
        });

        console.log('Formas de pagamento carregadas:', formasMap.size);
    } catch (err) {
        console.error('Erro ao carregar formas de pagamento:', err);
        mostrarMensagem('Não foi possível carregar formas de pagamento', 'error');
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

// Função para buscar pagamento por ID
async function buscarPagamento() {
    const idpedido = searchId.value.trim();

    if (!idpedido) {
        mostrarMensagem('O campo ID está vazio. Por favor, preencha antes de buscar.', 'warning');
        return;
    }

    bloquearCampos(false);
    searchId.focus();
    try {
        // backend usa PedidoIdPedido como chave
        const response = await fetch(`${API_BASE_URL}/pagamento/${idpedido}`);

        if (response.ok) {
            const pagamento = await response.json();
            preencherFormulario(pagamento);

            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pagamento encontrado!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = idpedido;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Pagamento não encontrado. Você pode incluir um novo pagamento.', 'info');
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar pagamento');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar pagamento', 'error');
    }
}

// Função para preencher formulário com dados do pagamento
function preencherFormulario(pagamento) {
    // extrair campos considerando diferentes convenções de nome
    currentPagamentoId = pickField(pagamento, ['pedidoidpedido','PedidoIdPedido','idpedido','idPedido','pedidoid','id']) || '';

    const selectPedido = document.getElementById('idpedido');
    if (selectPedido) selectPedido.value = String(currentPagamentoId);

    const dataInput = document.getElementById('dataDopagamento');
    const rawDate = pickField(pagamento, ['dataDoPagamento','datadopagamento','data_pagamento','datapagamento','data']);
    if (dataInput) {
        dataInput.value = formatIsoToDateInput(rawDate);
    }

    const selectForma = document.getElementById('formaPagamento');
    const rawForma = pickField(pagamento, ['forma_pagamento_id','formapagamentoid','idformapagamento','formaPagamentoId','forma','forma_id']);
    if (selectForma) {
        selectForma.value = rawForma != null ? String(rawForma) : '';
    }

    const valorInput = document.getElementById('valorTotalPagamento');
    const rawValor = pickField(pagamento, ['valorTotalPagamento','valortotalpagamento','valor','valorTotal','valorpagamento','total']);
    if (valorInput) {
        valorInput.value = rawValor != null ? String(rawValor) : '';
    }
}

function formatIsoToDateInput(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().slice(0, 10);
    } catch (e) {
        console.error('Erro ao formatar ISO para input:', e);
        return '';
    }
}

// Função para incluir pagamento
async function incluirPagamento() {
    mostrarMensagem('Digite os dados!', 'success');
    currentPagamentoId = searchId.value;
    limparFormulario();
    searchId.value = currentPagamentoId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true);
        const f = document.getElementById('dataDopagamento'); if (f) f.focus();
    operacao = 'incluir';
}

// Função para alterar pagamento
async function alterarPagamento() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
        const f = document.getElementById('dataDopagamento'); if (f) f.focus();
    operacao = 'alterar';
}

// Função para excluir pagamento
async function excluirPagamento() {
    mostrarMensagem('Excluindo pagamento...', 'info');
    currentPagamentoId = searchId.value;
    searchId.disabled = true;
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

// Validação dos campos do formulário (cliente/servidor redundante)
async function validarCampos() {
    const errors = [];
    const formData = new FormData(form);

    // Pedido
    const pedidoId = formData.get('idpedido') || (document.getElementById('pedidoId') ? document.getElementById('pedidoId').value : '') || searchId.value.trim();
    if (!pedidoId) errors.push('Selecione um pedido');

    // Valor
    const valor = parseFloat(formData.get('valorTotalPagamento'));
    if (isNaN(valor) || valor <= 0) errors.push('O valor total deve ser maior que zero');

    // Data
    const data = formData.get('dataDopagamento');
    if (data) {
        const hoje = new Date();
        const d = new Date(data);
        if (isNaN(d.getTime())) errors.push('Data do pagamento inválida');
        else if (d > hoje) errors.push('A data do pagamento não pode ser futura');
    }

    // Forma de pagamento
    const formaPagamento = formData.get('formaPagamento');
    if (!formaPagamento) errors.push('Selecione uma forma de pagamento');

    return errors;
}

async function salvarOperacao() {
    try {
        const errors = await validarCampos();
        if (errors.length > 0) {
            mostrarMensagem(errors.join('\n'), 'error');
            return;
        }

        const formData = new FormData(form);
        const pagamento = {
            pedidoId: formData.get('idpedido') || searchId.value.trim(),
            valorTotalPagamento: parseFloat(formData.get('valorTotalPagamento')),
            forma_pagamento_id: formData.get('formaPagamento')
        };

        let response;

        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/pagamento`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pagamento)
            });
        } else if (operacao === 'alterar') {
            const url = `${API_BASE_URL}/pagamento/${currentPagamentoId}`;
            console.log('PUT ->', url, pagamento);
            response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pagamento)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/pagamento/${currentPagamentoId}`, {
                method: 'DELETE'
            });
        }

        if (!response?.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro na operação');
        }

        // Recarrega a tabela antes de mostrar a mensagem
        await carregarPagamentos();
        
        mostrarMensagem(`Pagamento ${operacao === 'excluir' ? 'excluído' : 'salvo'} com sucesso!`, 'success');
        limparFormulario();
        searchId.value = '';
        currentPagamentoId = null;
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        mostrarMensagem(error.message || 'Erro ao salvar pagamento', 'error');
        
    } finally {
        operacao = null;
        bloquearCampos(false);
        mostrarBotoes(true, true, false, false, false, false);
    }
}

async function carregarPedidosParaSelect() {
    try {
        const response = await fetch(`${API_BASE_URL}/pedido`);
        if (!response.ok) throw new Error(response.statusText);
        
        const pedidos = await response.json();
        const select = document.getElementById('idpedido');
        if (!select) return;

        select.innerHTML = '<option value="">-- selecione um pedido --</option>';
        
        pedidos.forEach(pedido => {
            const id = pedido.idpedido || pedido.id || '';
            const valor = pedido.valortotalpedido || pedido.valor || 0;
            
            if (id) {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = `Pedido ${id} - ${formatMoney(valor)}`;
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        mostrarMensagem('Erro ao carregar lista de pedidos', 'error');
    }
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
}

async function carregarPagamentos() {
    try {
        const response = await fetch(`${API_BASE_URL}/pagamento`);
        if (!response.ok) throw new Error(response.statusText);
        
        const pagamentos = await response.json();
        renderizarTabelaPagamentos(pagamentos);
    } catch (error) {
        console.error('Erro ao carregar pagamentos:', error);
        mostrarMensagem('Erro ao carregar lista de pagamentos', 'error');
    }
}

function renderizarTabelaPagamentos(pagamentos) {
    if (!pagamentosTableBody) return;
    
    pagamentosTableBody.innerHTML = '';
    
    if (!pagamentos?.length) {
        pagamentosTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">Nenhum pagamento encontrado</td>
            </tr>
        `;
        return;
    }

    pagamentos.forEach(pagamento => {
        const row = document.createElement('tr');
        // extrair campos com tolerância a diferentes nomes que o backend pode retornar
        const rawId = pickField(pagamento, ['pedidoidpedido','PedidoIdPedido','idpedido','idPedido','pedidoid','id']);
        const id = escapeHtml(String(rawId ?? 'N/A'));

        const rawDate = pickField(pagamento, ['dataDoPagamento','datadopagamento','data_pagamento','datapagamento','data']);
        const data = formatDate(rawDate);

        const rawValor = pickField(pagamento, ['valorTotalPagamento','valortotalpagamento','valor','valorTotal','valorpagamento','total']);
        const valor = formatMoney(rawValor);

        let formaNome = 'N/A';
        const rawFormaId = pickField(pagamento, ['forma_pagamento_id','formapagamentoid','idformapagamento','formaPagamentoId','forma','forma_id']);
        if (rawFormaId != null) {
            formaNome = formasMap.get(String(rawFormaId)) || String(rawFormaId);
        }
        
        row.innerHTML = `
            <td>
                <button class="btn btn-link" onclick="selecionarPagamento('${id}')">
                    ${id}
                </button>
            </td>
            <td data-label="Data">${data}</td>
            <td data-label="Valor" class="text-right">${valor}</td>
            <td data-label="Forma">${escapeHtml(formaNome)}</td>
            <td class="actions">
                <button class="btn btn-sm btn-ghost" title="Editar" onclick="selecionarPagamento('${id}')">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        
        pagamentosTableBody.appendChild(row);
    });
}

// Função para selecionar pagamento da tabela
async function selecionarPagamento(id) {
    searchId.value = id;
    await buscarPagamento();
}
