const API = 'http://localhost:3001';

// Elementos estáticos
const form = document.getElementById('formaForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');
const nomeInput = document.getElementById('nomeformapagamento');
const formasTableBody = document.getElementById('formasTableBody');
const messageContainer = document.getElementById('messageContainer');

// escapeHtml: protege contra injeção de HTML (mesmo padrão usado em outros CRUDs)
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
let canIncludeForma = false;

document.addEventListener('DOMContentLoaded', () => carregarFormas());
// estado inicial
document.addEventListener('DOMContentLoaded', () => {
	mostrarBotoes(true, false, false, false, false, false);
	bloquearCampos(false);
	canIncludeForma = false;
});

btnBuscar.addEventListener('click', buscarForma);
btnIncluir.addEventListener('click', incluirForma);
btnAlterar.addEventListener('click', alterarForma);
btnExcluir.addEventListener('click', excluirForma);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

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

function bloquearCampos(bloquearPrimeiro) {
	const inputs = form.querySelectorAll('input, select');
	inputs.forEach((input, index) => {
		if (index === 0) input.disabled = bloquearPrimeiro; else input.disabled = !bloquearPrimeiro;
	});
}

function limparFormulario() { form.reset(); }

async function carregarFormas() {
	try {
		const res = await fetch(API + '/formaPagamento');
		if (!res.ok) throw new Error('Erro ao carregar formas');
		const list = await res.json();
		renderizarTabela(list);
	} catch (err) {
		console.error(err);
		mostrarMensagem('Erro ao carregar formas', 'error');
	}
}

function renderizarTabela(list) {
	formasTableBody.innerHTML = '';
	list.forEach(f => {
		const tr = document.createElement('tr');
		const fid = f.idFormaPagamento ?? f.idformadepagamento ?? f.idformapagamento ?? f.id;
		const fname = f.nomeFormaPagamento ?? f.nomeformapagamento ?? f.nomeformapagamento ?? f.nome;
		// proteger valores para evitar XSS e garantir que o onclick receba string
		const safeId = String(fid ?? '');
		const safeName = String(fname ?? '');
		tr.innerHTML = `<td><button class="btn-id" onclick="selecionarForma('${safeId}')">${escapeHtml(safeId)}</button></td><td>${escapeHtml(safeName)}</td>`;
			const tdActions = document.createElement('td');
			tdActions.innerHTML = `<button data-id="${fid}" class="editar">Editar</button> <button data-id="${fid}" class="excluir">Excluir</button>`;
		tr.appendChild(tdActions);
		formasTableBody.appendChild(tr);
	});

	}

	// Listener único para ações na tabela (evita múltiplos handlers)
	formasTableBody.onclick = async (e) => {
		if (e.target.classList.contains('editar')) {
			const id = e.target.dataset.id;
			const res = await fetch(API + '/formaPagamento/' + id);
			if (res.ok) {
				const data = await res.json();
				preencherFormulario(data);
				mostrarBotoes(true, false, true, true, false, false);
				canIncludeForma = false;
			} else {
				mostrarMensagem('Erro ao carregar forma', 'error');
			}
		} else if (e.target.classList.contains('excluir')) {
			const id = e.target.dataset.id;
			if (!confirm('Deseja excluir a forma ' + id + '?')) return;
			const res = await fetch(API + '/formaPagamento/' + id, { method: 'DELETE' });
			if (res.ok || res.status === 204) {
				mostrarMensagem('Forma excluída', 'success');
				carregarFormas();
			} else {
				mostrarMensagem('Erro ao excluir forma', 'error');
			}
		}
	};

function preencherFormulario(f) {
	nomeInput.value = f.nomeFormaPagamento ?? f.nomeformapagamento ?? '';
	currentId = f.idFormaPagamento ?? f.idformadepagamento ?? f.idformapagamento ?? f.id;
}

function incluirForma() { 
	if (!canIncludeForma) { mostrarMensagem('Busque antes para poder incluir', 'warning'); return; }
	limparFormulario(); 
	// habilita os campos para edição ao incluir
	bloquearCampos(true);
	mostrarBotoes(false, false, false, false, true, true); 
	operacao = 'incluir'; 
}
function alterarForma() { 
	// habilita os campos para edição ao alterar
	bloquearCampos(true);
	mostrarBotoes(false, false, false, false, true, true); 
	operacao = 'alterar'; 
}
function excluirForma() { if (!confirm('Deseja excluir esta forma?')) return; operacao = 'excluir'; salvarOperacao(); }

async function salvarOperacao() {
	// o backend espera o campo `nomeformapagamento` (snake_case)
	const payload = { nomeformapagamento: nomeInput.value };
	try {
		// prevenir cliques múltiplos
		btnSalvar.disabled = true;
		btnCancelar.disabled = true;
		let res;
	if (operacao === 'incluir') res = await fetch(API + '/formaPagamento', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
	else if (operacao === 'alterar') res = await fetch(API + '/formaPagamento/' + currentId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
		else if (operacao === 'excluir') res = await fetch(API + '/formaPagamento/' + currentId, { method: 'DELETE' });

		if (res && (res.ok || res.status === 204)) { mostrarMensagem('Operação realizada', 'success'); limparFormulario(); carregarFormas(); }
		else { const err = res ? await res.json().catch(()=>({ error: res.statusText })) : { error: 'Sem resposta' }; mostrarMensagem(err.error || 'Erro', 'error'); }
	} catch (err) { console.error(err); mostrarMensagem('Erro ao salvar', 'error'); }
	finally {
		btnSalvar.disabled = false;
		btnCancelar.disabled = false;
		operacao = null; mostrarBotoes(true, false, false, false, false, false); bloquearCampos(false);
		// após salvar/operacao concluída, não permitir incluir sem nova busca
		canIncludeForma = false;
	}
}

function cancelarOperacao() { 
	limparFormulario(); 
	mostrarBotoes(true, false, false, false, false, false); 
	bloquearCampos(false); 
	// não permitir incluir sem nova busca
	canIncludeForma = false;
}


window.selecionarForma = function(id) { searchId.value = id; buscarForma(); }

async function buscarForma() {
	const id = searchId.value.trim(); if (!id) { mostrarMensagem('Digite um ID para buscar', 'warning'); return; }
	try { 
		const res = await fetch(API + '/formaPagamento/' + id);
		if (res.ok) {
			const data = await res.json();
			preencherFormulario(data);
			mostrarBotoes(true, false, true, true, false, false);
			canIncludeForma = false;
			mostrarMensagem('Forma encontrada', 'success');
		} else if (res.status === 404) {
			// Não limpar todo o formulário para não perder o ID buscado
			nomeInput.value = '';
			currentId = null;
			searchId.value = id;
			mostrarBotoes(true, true, false, false, false, false);
			canIncludeForma = true;
			mostrarMensagem('Forma não encontrada - pode incluir', 'info');
		} else throw new Error('Erro');
	} catch (err) { console.error(err); mostrarMensagem('Erro ao buscar', 'error'); }
}