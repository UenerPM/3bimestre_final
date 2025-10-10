const API = '';

// Padrão estático: usa os elementos já presentes em cliente.html (igual cargo/pessoa)
const form = document.getElementById('clienteForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');
const clientesTableBody = document.getElementById('clientesTableBody');
const messageContainer = document.getElementById('messageContainer');

let operacao = null;
let currentId = null;
let canInclude = false; // só permite Incluir depois de Buscar e não achar

document.addEventListener('DOMContentLoaded', () => {
	carregarClientes();
	// estado inicial: só Buscar visível, campos bloqueados exceto PK/search
	mostrarBotoes(true, false, false, false, false, false);
	bloquearCampos(false);
});

btnBuscar.addEventListener('click', buscarCliente);
btnIncluir.addEventListener('click', incluirCliente);
btnAlterar.addEventListener('click', alterarCliente);
btnExcluir.addEventListener('click', excluirCliente);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

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
		if (index === 0) {
			input.disabled = bloquearPrimeiro;
		} else {
			input.disabled = !bloquearPrimeiro;
		}
	});
}

function limparFormulario() {
	form.reset();
}

function mostrarMensagem(texto, tipo = 'info') {
	messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
	setTimeout(() => { messageContainer.innerHTML = ''; }, 3000);
}

async function buscarCliente() {
	const id = searchId.value.trim();
	if (!id) { mostrarMensagem('Digite um CPF para buscar', 'warning'); return; }
	try {
		const res = await fetch(API + '/cliente/' + id);
		if (res.ok) {
			const data = await res.json();
			preencherFormulario(data);
			mostrarBotoes(true, false, true, true, false, false);
			mostrarMensagem('Cliente encontrado', 'success');
			canInclude = false;
		} else if (res.status === 404) {
			// Não limpar todo o formulário para não perder o CPF buscado
			document.getElementById('pessoacpfpessoa').value = id;
			document.getElementById('rendacliente').value = '';
			document.getElementById('datadecadastracliente').value = '';
			currentId = null;
			searchId.value = id;
			mostrarBotoes(true, true, false, false, false, false);
			mostrarMensagem('Cliente não encontrado - pode incluir', 'info');
			canInclude = true;
		} else {
			throw new Error('Erro ao buscar cliente');
		}
	} catch (err) {
		console.error(err);
		mostrarMensagem('Erro ao buscar cliente', 'error');
	}
}

function preencherFormulario(c) {
	document.getElementById('pessoacpfpessoa').value = c.pessoacpfpessoa || '';
	document.getElementById('rendacliente').value = c.rendacliente || '';
	if (c.datadecadastracliente) document.getElementById('datadecadastracliente').value = c.datadecadastracliente.split('T')[0];
	currentId = c.pessoacpfpessoa;
}

function incluirCliente() {
	if (!canInclude) { mostrarMensagem('Para incluir, primeiro busque um CPF não existente.', 'warning'); return; }
	limparFormulario();
	// preenche o CPF com o que foi buscado
	document.getElementById('pessoacpfpessoa').value = searchId.value.trim();
	bloquearCampos(true);
	mostrarBotoes(false, false, false, false, true, true);
	operacao = 'incluir';
	canInclude = false; // reset
}

function alterarCliente() {
	bloquearCampos(true);
	mostrarBotoes(false, false, false, false, true, true);
	operacao = 'alterar';
}

function excluirCliente() {
	if (!confirm('Deseja excluir este cliente?')) return;
	operacao = 'excluir';
	salvarOperacao();
}

async function salvarOperacao() {
	const fd = new FormData(form);
	const payload = Object.fromEntries(fd.entries());
	try {
		// prevenir cliques múltiplos
		btnSalvar.disabled = true;
		btnCancelar.disabled = true;
		let res;
		if (operacao === 'incluir') {
			res = await fetch(API + '/cliente', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
		} else if (operacao === 'alterar') {
			const id = currentId || searchId.value;
			res = await fetch(API + '/cliente/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
		} else if (operacao === 'excluir') {
			const id = currentId || searchId.value;
			res = await fetch(API + '/cliente/' + id, { method: 'DELETE' });
		}

		if (res && (res.ok || res.status === 204)) {
			mostrarMensagem('Operação realizada', 'success');
			limparFormulario();
			carregarClientes();
		} else {
			const err = res ? await res.json().catch(()=>({ error: res.statusText })) : { error: 'Sem resposta' };
			mostrarMensagem(err.error || 'Erro', 'error');
		}
	} catch (err) {
		console.error(err);
		mostrarMensagem('Erro ao salvar', 'error');
	}
	finally {
		// reativar botões independente do resultado
		btnSalvar.disabled = false;
		btnCancelar.disabled = false;
		operacao = null;
		bloquearCampos(false);
		mostrarBotoes(true, false, false, false, false, false);
		// reset estado
		canInclude = false;
	}
}

function cancelarOperacao() {
	limparFormulario();
	mostrarBotoes(true, false, false, false, false, false);
	bloquearCampos(false);
}

async function carregarClientes() {
	try {
		const res = await fetch(API + '/cliente');
		if (!res.ok) throw new Error('Erro ao carregar clientes');
		const list = await res.json();
		renderizarTabela(list);
	} catch (err) {
		console.error(err);
		mostrarMensagem('Erro ao carregar clientes', 'error');
	}
}

function renderizarTabela(list) {
	clientesTableBody.innerHTML = '';
	list.forEach(c => {
		const tr = document.createElement('tr');
		tr.innerHTML = `<td><button class="btn-id" onclick="selecionarCliente('${c.pessoacpfpessoa}')">${c.pessoacpfpessoa}</button></td><td>${c.rendacliente || ''}</td><td>${c.datadecadastracliente ? c.datadecadastracliente.split('T')[0] : ''}</td>`;
		const tdActions = document.createElement('td');
		tdActions.innerHTML = `<button data-cpf="${c.pessoacpfpessoa}" class="editar">Editar</button> <button data-cpf="${c.pessoacpfpessoa}" class="excluir">Excluir</button>`;
		tr.appendChild(tdActions);
		clientesTableBody.appendChild(tr);
	});

}

// Listener único para ações na tabela (evita múltiplos handlers)
clientesTableBody.onclick = async (e) => {
    if (e.target.classList.contains('editar')) {
        const cpf = e.target.dataset.cpf;
        const res = await fetch(API + '/cliente/' + cpf);
        if (res.ok) {
            const data = await res.json();
            preencherFormulario(data);
            mostrarBotoes(true, false, true, true, false, false);
        } else {
            mostrarMensagem('Erro ao carregar cliente', 'error');
        }
    } else if (e.target.classList.contains('excluir')) {
        const cpf = e.target.dataset.cpf;
        if (!confirm('Deseja excluir o cliente ' + cpf + '?')) return;
        const res = await fetch(API + '/cliente/' + cpf, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            mostrarMensagem('Cliente excluído', 'success');
            carregarClientes();
        } else {
            mostrarMensagem('Erro ao excluir cliente', 'error');
        }
    }
};

window.selecionarCliente = function(id) {
	searchId.value = id;
	buscarCliente();
}