// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('pessoaForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pessoasTableBody = document.getElementById('pessoasTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de pessoas ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarPessoas();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPessoa);
btnIncluir.addEventListener('click', incluirPessoa);
btnAlterar.addEventListener('click', alterarPessoa);
btnExcluir.addEventListener('click', excluirPessoa);
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
    const inputs = document.querySelectorAll('input, select, textarea'); // Seleciona todos os inputs, selects e textareas do documento
    inputs.forEach((input, index) => {
        // console.log(`Input ${index}: ${input.name}, disabled: ${input.disabled}`);
        if (index === 0) {
            // Primeiro elemento - bloqueia se bloquearPrimeiro for true, libera se for false
            input.disabled = bloquearPrimeiro;
        } else {
            // Demais elementos - faz o oposto do primeiro
            input.disabled = !bloquearPrimeiro;
        }
    });
}

// Função para limpar formulário
function limparFormulario() {
    form.reset();
    const cbAvaliador = document.getElementById('checkboxAvaliador');
    if (cbAvaliador) cbAvaliador.checked = false;
    const cbAvaliado = document.getElementById('checkboxAvaliado');
    if (cbAvaliado) cbAvaliado.checked = false;
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

// Função para converter data para formato ISO
function converterDataParaISO(dataString) {
    if (!dataString) return null;
    return new Date(dataString).toISOString().split('T')[0];
}




// Função para buscar pessoa por CPF
async function buscarPessoa() {
    const cpfpessoa = searchId.value.trim();

    // Validação do CPF
    if (!cpfpessoa) {
        mostrarMensagem('O campo CPF está vazio. Por favor, preencha antes de buscar.', 'warning');
        return;
    }

    bloquearCampos(false);
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/pessoa/${cpfpessoa}`);

        if (response.ok) {
            const pessoa = await response.json();
            preencherFormulario(pessoa);

            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pessoa encontrada!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = cpfpessoa;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Pessoa não encontrada. Você pode incluir uma nova pessoa.', 'info');
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar pessoa');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar pessoa', 'error');
    }
}

// Função para preencher formulário com dados da pessoa
function preencherFormulario(pessoa) {
    currentPersonId = pessoa.cpfpessoa; // Corrigido para usar cpfpessoa
    document.getElementById('cpfpessoa').value = pessoa.cpfpessoa; // Corrigido para exibir o CPF no campo correto
    document.getElementById('nomepessoa').value = pessoa.nomepessoa || '';
    document.getElementById('email').value = pessoa.email || '';
    document.getElementById('senha_pessoa').value = pessoa.senha_pessoa || '';
    document.getElementById('data_acesso').value = pessoa.primeiro_acesso_pessoa ? 'true' : 'false';

    // Formatação da data para input type="date"
    if (pessoa.datanascimentopessoa) {
        const data = new Date(pessoa.datanascimentopessoa);
        const dataFormatada = data.toISOString().split('T')[0];
        document.getElementById('datanascimentopessoa').value = dataFormatada;
    } else {
        document.getElementById('datanascimentopessoa').value = '';
    }

    document.getElementById('numero').value = pessoa.numero || ''; // Corrigido para preencher o campo número
    document.getElementById('cep').value = pessoa.cep || ''; // Corrigido para preencher o campo CEP
}


// Função para incluir pessoa
async function incluirPessoa() {

    mostrarMensagem('Digite os dados!', 'success');
    currentPersonId = searchId.value;
    // console.log('Incluir nova pessoa - currentPersonId: ' + currentPersonId);
    limparFormulario();
    searchId.value = currentPersonId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nomepessoa').focus();
    operacao = 'incluir';
    // console.log('fim nova pessoa - currentPersonId: ' + currentPersonId);
}

// Função para alterar pessoa
async function alterarPessoa() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nomepessoa').focus();
    operacao = 'alterar';
}

// Função para excluir pessoa
async function excluirPessoa() {
    mostrarMensagem('Excluindo pessoa...', 'info');
    currentPersonId = searchId.value;
    //bloquear searchId
    searchId.disabled = true;
    bloquearCampos(false); // libera os demais campos
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)           
    operacao = 'excluir';
}

async function salvarOperacao() {
    const formData = new FormData(form);
    const pessoa = {
        cpfpessoa: searchId.value.trim(),
        nomepessoa: formData.get('nomepessoa') || '',
        email: formData.get('email') || '',
        senha_pessoa: formData.get('senha_pessoa') || '',
        primeiro_acesso_pessoa: formData.get('data_acesso') === 'true',
        datanascimentopessoa: formData.get('datanascimentopessoa') || null,
        numero: formData.get('numero') || '',
        cep: formData.get('cep') || ''
    };

    // Truncar numero e cep para 10 caracteres
    pessoa.numero = pessoa.numero.slice(0, 10); // Trunca para 10 caracteres
    pessoa.cep = pessoa.cep.slice(0, 10); // Trunca para 10 caracteres

    // Conversão do campo datanascimentopessoa para o formato ISO
    pessoa.datanascimentopessoa = pessoa.datanascimentopessoa ? converterDataParaISO(pessoa.datanascimentopessoa) : null;

    console.log('Dados capturados do formulário:', pessoa); // Log para depuração

    try {
        let responsePessoa;

        if (operacao === 'incluir') {
            responsePessoa = await fetch(`${API_BASE_URL}/pessoa`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pessoa)
            });
        } else if (operacao === 'alterar') {
            console.log('Enviando dados para atualização:', pessoa); // Log para depuração
            responsePessoa = await fetch(`${API_BASE_URL}/pessoa/${currentPersonId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pessoa)
            });
        } else if (operacao === 'excluir') {
            // Garantir que temos um CPF para deletar
            if (!currentPersonId) currentPersonId = searchId.value.trim();
            console.log('Solicitando DELETE para pessoa:', currentPersonId);
            responsePessoa = await fetch(`${API_BASE_URL}/pessoa/${currentPersonId}`, {
                method: 'DELETE'
            });
        }
        console.log('Resposta do servidor (status):', responsePessoa ? responsePessoa.status : 'nenhuma');

        // Tratamento para incluir/alterar
        if (responsePessoa && responsePessoa.ok && (operacao === 'incluir' || operacao === 'alterar')) {
            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
            carregarPessoas();

        // Tratamento específico para exclusão (DELETE costuma retornar 204 No Content)
        } else if (operacao === 'excluir') {
            // Tratar 204/200/404 como sucesso (idempotente)
            if (responsePessoa && (responsePessoa.status === 204 || responsePessoa.status === 200 || responsePessoa.status === 404)) {
                if (responsePessoa.status === 404) {
                    mostrarMensagem('Pessoa não encontrada — considerada excluída (idempotente).', 'info');
                } else {
                    mostrarMensagem('Pessoa excluída com sucesso!', 'success');
                }
                limparFormulario();
                carregarPessoas();
            } else {
                // Tentar ler corpo de erro JSON, mas com parsing seguro
                let errorBody = { error: responsePessoa ? responsePessoa.statusText : 'Erro desconhecido' };
                try {
                    if (responsePessoa) {
                        const txt = await responsePessoa.text();
                        errorBody = txt ? JSON.parse(txt) : errorBody;
                    }
                } catch (parseErr) {
                    console.warn('Não foi possível parsear JSON do erro:', parseErr);
                }
                mostrarMensagem(errorBody.error || `Erro ao excluir pessoa (status ${responsePessoa ? responsePessoa.status : '??'})`, 'error');
            }

        // Outros erros para incluir/alterar
        } else {
            let errorBody = { error: 'Erro desconhecido' };
            try {
                if (responsePessoa) {
                    const txt = await responsePessoa.text();
                    errorBody = txt ? JSON.parse(txt) : errorBody;
                }
            } catch (parseErr) {
                console.warn('Não foi possível parsear JSON do erro:', parseErr);
            }
            mostrarMensagem(errorBody.error || 'Erro ao incluir pessoa', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao incluir ou alterar a pessoa', 'error');
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

// Função para carregar lista de pessoas
async function carregarPessoas() {
    try {
        const response = await fetch(`${API_BASE_URL}/pessoa`);

        if (response.ok) {
            const pessoas = await response.json();
            renderizarTabelaPessoas(pessoas);
        } else {
            throw new Error('Erro ao carregar pessoas');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de pessoas', 'error');
    }
}

// Função para renderizar tabela de pessoas
function renderizarTabelaPessoas(pessoas) {
    pessoasTableBody.innerHTML = '';

    pessoas.forEach(pessoa => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarPessoa('${pessoa.cpfpessoa}')">
                    ${pessoa.cpfpessoa}
                </button>
            </td>
            <td>${pessoa.nomepessoa}</td>
            <td>${pessoa.email}</td>
            <td>${pessoa.data_acesso ? 'Sim' : 'Não'}</td>
            <td>${formatarData(pessoa.datanascimentopessoa)}</td>
            <td>${pessoa.cep}</td>
            <td>${pessoa.numero}</td>
        `;
        pessoasTableBody.appendChild(row);
    });
}

// Função para selecionar pessoa da tabela
async function selecionarPessoa(id) {
    searchId.value = id;
    await buscarPessoa();
}
