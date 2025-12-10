const API = 'http://localhost:3001';

// Elementos estáticos
const form = document.getElementById('pagamentoHasFormaPagamentoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');
const idPagamentoSelect = document.getElementById('idPagamento');
const idFormaPagamentoSelect = document.getElementById('idFormaPagamento');
const valorInput = document.getElementById('valor');
const tableBody = document.getElementById('pagamentoHasFormaPagamentoTableBody');
const messageContainer = document.getElementById('messageContainer');

function escapeHtml(unsafe) {
	return String(unsafe)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

let operacao = null;
let currentId = null;
let canInclude = false;

document.addEventListener('DOMContentLoaded', () => {
	carregarDados();
	mostrarBotoes(true, false, false, false, false, false);
	bloquearCampos(false);
	canInclude = false;
});

btnBuscar.addEventListener('click', buscar);
btnIncluir.addEventListener('click', incluir);
btnAlterar.addEventListener('click', alterar);
btnExcluir.addEventListener('click', excluir);
btnCancelar.addEventListener('click', cancelar);
btnSalvar.addEventListener('click', salvar);

function mostrarMensagem(texto, tipo = 'info') {
	messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
	setTimeout(() => { messageContainer.innerHTML = ''; }, 3000);
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
	btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
	btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
	btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
	btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
	btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
	btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

function bloquearCampos(bloquear) {
	idPagamentoSelect.disabled = bloquear;
	idFormaPagamentoSelect.disabled = bloquear;
	valorInput.disabled = !bloquear;
}

function limparFormulario() {
	form.reset();
}

async function carregarDados() {
	try {
		// Carregar pagamentos
		const resPagamentos = await fetch(API + '/pagamento');
		if (resPagamentos.ok) {
			const pagamentos = await resPagamentos.json();
			idPagamentoSelect.innerHTML = '<option value="">-- selecione um pagamento --</option>';
			pagamentos.forEach(p => {
				const option = document.createElement('option');
				option.value = p.idpedido || p.idPedido || p.id;
				option.textContent = `Pagamento #${p.idpedido || p.idPedido || p.id}`;
				idPagamentoSelect.appendChild(option);
			});
		}

		// Carregar formas de pagamento
		const resFormas = await fetch(API + '/formaPagamento');
		if (resFormas.ok) {
			const formas = await resFormas.json();
			idFormaPagamentoSelect.innerHTML = '<option value="">-- selecione uma forma de pagamento --</option>';
			formas.forEach(f => {
				const option = document.createElement('option');
				option.value = f.idformapagamento || f.idFormaPagamento || f.id;
				option.textContent = f.nomeformapagamento || f.nomeFormaPagamento || f.nome;
				idFormaPagamentoSelect.appendChild(option);
			});
		}

		// Carregar tabela
		carregarTabela();
	} catch (err) {
		console.error(err);
		mostrarMensagem('Erro ao carregar dados iniciais', 'error');
	}
}

async function carregarTabela() {
	try {
		const res = await fetch(API + '/pagamentoHasFormaPagamento');
		if (!res.ok) throw new Error('Erro ao carregar tabela');
		const list = await res.json();
		renderizarTabela(list);
	} catch (err) {
		console.error(err);
		mostrarMensagem('Erro ao carregar tabela', 'error');
	}
}

function renderizarTabela(list) {
	tableBody.innerHTML = '';
	list.forEach(item => {
		const tr = document.createElement('tr');
		const idPag = item.idpagamento || item.idPagamento || item.id;
		const idForma = item.idformapagamento || item.idFormaPagamento;
		const valor = item.valor || 0;
		tr.innerHTML = `
			<td>${escapeHtml(idPag)}</td>
			<td>${escapeHtml(idForma)}</td>
			<td>R$ ${parseFloat(valor).toFixed(2)}</td>
			<td>
				<button class="btn-edit" data-id="${idPag}-${idForma}">Editar</button>
				<button class="btn-delete" data-id="${idPag}-${idForma}">Excluir</button>
			</td>
		`;
		tableBody.appendChild(tr);
	});

	tableBody.onclick = async (e) => {
		if (e.target.classList.contains('btn-edit')) {
			const id = e.target.dataset.id;
			const res = await fetch(API + '/pagamentoHasFormaPagamento/' + id);
			if (res.ok) {
				const data = await res.json();
				preencherFormulario(data);
				mostrarBotoes(true, false, true, true, false, false);
				canInclude = false;
			} else {
				mostrarMensagem('Erro ao carregar item', 'error');
			}
		} else if (e.target.classList.contains('btn-delete')) {
			const id = e.target.dataset.id;
			if (!confirm('Deseja excluir este item?')) return;
			const res = await fetch(API + '/pagamentoHasFormaPagamento/' + id, { method: 'DELETE' });
			if (res.ok || res.status === 204) {
				mostrarMensagem('Item excluído', 'success');
				carregarTabela();
			} else {
				mostrarMensagem('Erro ao excluir item', 'error');
			}
		}
	};
}

function preencherFormulario(item) {
	idPagamentoSelect.value = item.idpagamento || item.idPagamento || item.id || '';
	idFormaPagamentoSelect.value = item.idformapagamento || item.idFormaPagamento || '';
	valorInput.value = item.valor || '';
	currentId = `${item.idpagamento || item.idPagamento || item.id}-${item.idformapagamento || item.idFormaPagamento}`;
}

function incluir() {
	if (!canInclude) {
		mostrarMensagem('Busque antes para poder incluir', 'warning');
		return;
	}
	limparFormulario();
	bloquearCampos(true);
	mostrarBotoes(false, false, false, false, true, true);
	operacao = 'incluir';
}

function alterar() {
	bloquearCampos(true);
	mostrarBotoes(false, false, false, false, true, true);
	operacao = 'alterar';
}

function excluir() {
	if (!confirm('Deseja excluir este item?')) return;
	operacao = 'excluir';
	salvar();
}

async function salvar() {
	const idPag = idPagamentoSelect.value;
	const idForma = idFormaPagamentoSelect.value;
	const valor = valorInput.value;

	if (!idPag || !idForma || !valor) {
		mostrarMensagem('Preencha todos os campos', 'warning');
		return;
	}

	const payload = {
		idpagamento: idPag,
		idformapagamento: idForma,
		valor: parseFloat(valor)
	};

	try {
		btnSalvar.disabled = true;
		btnCancelar.disabled = true;
		let res;

		if (operacao === 'incluir') {
			res = await fetch(API + '/pagamentoHasFormaPagamento', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
		} else if (operacao === 'alterar') {
			res = await fetch(API + '/pagamentoHasFormaPagamento/' + currentId, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
		} else if (operacao === 'excluir') {
			res = await fetch(API + '/pagamentoHasFormaPagamento/' + currentId, {
				method: 'DELETE'
			});
		}

		if (res && (res.ok || res.status === 204)) {
			mostrarMensagem('Operação realizada', 'success');
			limparFormulario();
			carregarTabela();
		} else {
			const err = res ? await res.json().catch(() => ({ error: res.statusText })) : { error: 'Sem resposta' };
			mostrarMensagem(err.error || 'Erro', 'error');
		}
	} catch (err) {
		console.error(err);
		mostrarMensagem('Erro ao salvar', 'error');
	} finally {
		btnSalvar.disabled = false;
		btnCancelar.disabled = false;
		operacao = null;
		mostrarBotoes(true, false, false, false, false, false);
		bloquearCampos(false);
		canInclude = false;
	}
}

function cancelar() {
	limparFormulario();
	mostrarBotoes(true, false, false, false, false, false);
	bloquearCampos(false);
	canInclude = false;
}

async function buscar() {
	const id = searchId.value.trim();
	if (!id) {
		mostrarMensagem('Digite um ID para buscar', 'warning');
		return;
	}
	try {
		const res = await fetch(API + '/pagamentoHasFormaPagamento/' + id);
		if (res.ok) {
			const data = await res.json();
			preencherFormulario(data);
			mostrarBotoes(true, false, true, true, false, false);
			canInclude = false;
			mostrarMensagem('Item encontrado', 'success');
		} else if (res.status === 404) {
			limparFormulario();
			searchId.value = id;
			mostrarBotoes(true, true, false, false, false, false);
			canInclude = true;
			mostrarMensagem('Item não encontrado - pode incluir', 'info');
		} else {
			throw new Error('Erro');
		}
	} catch (err) {
		console.error(err);
		mostrarMensagem('Erro ao buscar', 'error');
	}
}