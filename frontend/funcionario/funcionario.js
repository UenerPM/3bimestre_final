// JS para a tabela funcionario
const API_BASE_URL = 'http://localhost:3001';
let currentFuncionarioId = null;
let operacao = null;

// DOM
const form = document.getElementById('funcionarioForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const funcionariosTableBody = document.getElementById('funcionariosTableBody') || document.getElementById('pessoasTableBody');
const messageContainer = document.getElementById('messageContainer');

document.addEventListener('DOMContentLoaded', () => {
    carregarFuncionarios();
    setModo('default');
    setInputsDisabled(true);
});

// Event listeners
btnBuscar && btnBuscar.addEventListener('click', buscarFuncionario);
btnIncluir && btnIncluir.addEventListener('click', incluirFuncionario);
btnAlterar && btnAlterar.addEventListener('click', alterarFuncionario);
btnExcluir && btnExcluir.addEventListener('click', excluirFuncionario);
btnCancelar && btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar && btnSalvar.addEventListener('click', salvarOperacao);

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => { messageContainer.innerHTML = ''; }, 3000);
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    if (btnBuscar) btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    if (btnIncluir) btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    if (btnAlterar) btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    if (btnExcluir) btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    if (btnSalvar) btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    if (btnCancelar) btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

function setModo(modo) {
    // modos: default, found, notFound, novo, editar
    switch (modo) {
        case 'novo':
        case 'editar':
            mostrarBotoes(false, false, false, false, true, true);
            setInputsDisabled(false);
            break;
        case 'found':
            mostrarBotoes(true, false, true, true, false, false);
            setInputsDisabled(true);
            break;
        case 'notFound':
            mostrarBotoes(true, true, false, false, false, false);
            setInputsDisabled(false);
            break;
        default:
            mostrarBotoes(true, false, false, false, false, false);
            setInputsDisabled(true);
            break;
    }
}

function setInputsDisabled(disabled) {
    const fields = ['PessoaCpfPessoa','salario','CargosIdCargo','porcentagemComissao'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
    });
}

function limparFormulario() {
    if (form) form.reset();
}

async function carregarFuncionarios() {
    try {
        const res = await fetch(`${API_BASE_URL}/funcionario`);
        if (!res.ok) throw new Error('Erro ao carregar funcionarios');
        const funcionarios = await res.json();
        renderizarTabelaFuncionarios(funcionarios);
    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro ao carregar funcionarios', 'error');
    }
}

function renderizarTabelaFuncionarios(funcionarios) {
    funcionariosTableBody.innerHTML = '';
    funcionarios.forEach(f => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button class="btn-id" onclick="selecionarFuncionario('${f.cpf}')">${f.cpf}</button></td>
            <td>${f.salario ?? ''}</td>
            <td>${f.idcargo ?? ''}</td>
            <td>${f.porcentagemcomissao ?? ''}</td>
        `;
        funcionariosTableBody.appendChild(row);
    });
}

async function buscarFuncionario() {
    const id = searchId.value.trim();
    if (!id) { mostrarMensagem('Digite CPF para buscar', 'warning'); return; }
    try {
        const res = await fetch(`${API_BASE_URL}/funcionario/${id}`);
        if (res.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Funcionário não encontrado. Você pode incluir.', 'info');
            return;
        }
        if (!res.ok) throw new Error('Erro ao buscar funcionario');
        const f = await res.json();
        preencherFormulario(f);
        mostrarBotoes(true, false, true, true, false, false);
        mostrarMensagem('Funcionário encontrado', 'success');
    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro ao buscar funcionário', 'error');
    }
}

function preencherFormulario(f) {
    currentFuncionarioId = f.cpf;
    document.getElementById('PessoaCpfPessoa').value = f.cpf || '';
    document.getElementById('salario').value = f.salario ?? '';
    document.getElementById('CargosIdCargo').value = f.idcargo ?? '';
    document.getElementById('porcentagemComissao').value = f.porcentagemcomissao ?? '';
    setModo('found');
}

function selecionarFuncionario(id) {
    searchId.value = id;
    buscarFuncionario();
}

function incluirFuncionario() {
    limparFormulario();
    searchId.value = currentFuncionarioId || '';
    setModo('novo');
    operacao = 'incluir';
    // foco no campo CPF da pessoa
    const cpfField = document.getElementById('PessoaCpfPessoa');
    if (cpfField) cpfField.focus();
}

function alterarFuncionario() {
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'alterar';
}

async function excluirFuncionario() {
    // confirmar exclusão
    const id = currentFuncionarioId || searchId.value.trim();
    if (!id) { mostrarMensagem('Selecione um funcionário para excluir', 'warning'); return; }
    if (!confirm('Confirma exclusão deste funcionário?')) return;
    operacao = 'excluir';
    // executar exclusão
    await salvarOperacao();
}

function cancelarOperacao() {
    limparFormulario();
    setModo('default');
    operacao = null;
}

async function salvarOperacao() {
    const payload = {
        PessoaCpfPessoa: document.getElementById('PessoaCpfPessoa').value.trim(),
        salario: document.getElementById('salario').value || null,
        CargosIdCargo: document.getElementById('CargosIdCargo').value || null,
        porcentagemComissao: document.getElementById('porcentagemComissao').value || null
    };
    // converter valores numéricos
    const salarioNum = payload.salario ? Number(payload.salario) : null;
    const cargoNum = payload.CargosIdCargo ? Number(payload.CargosIdCargo) : null;
    const porcentNum = payload.porcentagemComissao ? Number(payload.porcentagemComissao) : null;

    // validações básicas no cliente
    if (operacao === 'incluir') {
        if (!payload.PessoaCpfPessoa) { mostrarMensagem('Informe o CPF da Pessoa', 'warning'); return; }
        // checar se Pessoa existe
        try {
            const pessoaRes = await fetch(`${API_BASE_URL}/pessoa/${payload.PessoaCpfPessoa}`);
            if (pessoaRes.status === 404) { mostrarMensagem('Pessoa não encontrada. Cadastre a pessoa antes.', 'warning'); return; }
            if (!pessoaRes.ok) { mostrarMensagem('Erro ao validar pessoa', 'error'); return; }
        } catch (err) {
            console.error('Erro ao validar pessoa:', err);
            mostrarMensagem('Erro ao validar pessoa', 'error');
            return;
        }
    }

    if (salarioNum !== null && Number.isNaN(salarioNum)) { mostrarMensagem('Salário inválido', 'warning'); return; }
    if (cargoNum !== null && !Number.isInteger(cargoNum)) { mostrarMensagem('ID de cargo inválido', 'warning'); return; }
    if (porcentNum !== null && Number.isNaN(porcentNum)) { mostrarMensagem('Porcentagem inválida', 'warning'); return; }

    // montar payload coerente com backend
    const bodyPayload = {
        PessoaCpfPessoa: payload.PessoaCpfPessoa,
        salario: salarioNum,
        CargosIdCargo: cargoNum,
        porcentagemComissao: porcentNum
    };

    // bloquear botões para evitar múltiplos cliques
    const prevDisabled = [];
    [btnBuscar, btnIncluir, btnAlterar, btnExcluir, btnSalvar, btnCancelar].forEach(b => { if (b) { prevDisabled.push(b.disabled); b.disabled = true; } });

    try {
        let res;
        if (operacao === 'incluir') {
            res = await fetch(`${API_BASE_URL}/funcionario`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyPayload) });
        } else if (operacao === 'alterar') {
            const id = currentFuncionarioId || searchId.value.trim();
            res = await fetch(`${API_BASE_URL}/funcionario/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyPayload) });
        } else if (operacao === 'excluir') {
            const id = currentFuncionarioId || searchId.value.trim();
            res = await fetch(`${API_BASE_URL}/funcionario/${id}`, { method: 'DELETE' });
        } else {
            mostrarMensagem('Operação inválida', 'error');
            return;
        }

        if (res && (res.ok || res.status === 204)) {
            mostrarMensagem('Operação realizada com sucesso', 'success');
            limparFormulario();
            operacao = null;
            setModo('default');
            await carregarFuncionarios();
        } else {
            const body = await res.json().catch(() => ({}));
            mostrarMensagem(body.error || body.message || 'Erro na operação', 'error');
        }
    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro ao salvar operação', 'error');
    } finally {
        // restaurar estado dos botões
        [btnBuscar, btnIncluir, btnAlterar, btnExcluir, btnSalvar, btnCancelar].forEach((b, i) => { if (b) b.disabled = prevDisabled[i]; });
    }
}
