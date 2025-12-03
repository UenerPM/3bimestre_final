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
// Tipo de pessoa - novos elementos (checkbox-based)
const chkTipoCliente = document.getElementById('chkTipoCliente');
const chkTipoFuncionario = document.getElementById('chkTipoFuncionario');
const clienteFields = document.getElementById('clienteFields');
const funcionarioFields = document.getElementById('funcionarioFields');
const isClienteHidden = document.getElementById('isClienteHidden');
const isFuncionarioHidden = document.getElementById('isFuncionarioHidden');
const selectCargos = document.getElementById('cargosIdCargo');

// Carregar lista de pessoas ao inicializar
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([carregarPessoas(), carregarCargosForSelect()]);
    // sincroniza estado inicial dos checkboxes com hidden fields
    if (chkTipoCliente) chkTipoCliente.checked = (isClienteHidden && isClienteHidden.value === 'true');
    if (chkTipoFuncionario) chkTipoFuncionario.checked = (isFuncionarioHidden && isFuncionarioHidden.value === 'true');
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPessoa);
btnIncluir.addEventListener('click', incluirPessoa);
btnAlterar.addEventListener('click', alterarPessoa);
btnExcluir.addEventListener('click', excluirPessoa);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);
// listeners para checkboxes de tipo (permitir ambos simultâneos)
if (chkTipoCliente) chkTipoCliente.addEventListener('change', () => setPersonTypeToggle('cliente'));
if (chkTipoFuncionario) chkTipoFuncionario.addEventListener('change', () => setPersonTypeToggle('funcionario'));

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
    // esconder campos específicos e resetar flags
    if (clienteFields) clienteFields.style.display = 'none';
    if (funcionarioFields) funcionarioFields.style.display = 'none';
    if (isClienteHidden) isClienteHidden.value = 'false';
    if (isFuncionarioHidden) isFuncionarioHidden.value = 'false';
    if (chkTipoCliente) chkTipoCliente.checked = false;
    if (chkTipoFuncionario) chkTipoFuncionario.checked = false;
    // limpar campos específicos
    const fTel = document.getElementById('telefone'); if (fTel) fTel.value = '';
    const fEnd = document.getElementById('endereco'); if (fEnd) fEnd.value = '';
    const fCargo = document.getElementById('cargo'); if (fCargo) fCargo.value = '';
    const fSal = document.getElementById('salario'); if (fSal) fSal.value = '';
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
                // aceitar camelCase ou snake_case
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
    // suporte camelCase e snake_case
    currentPersonId = pessoa.cpfPessoa ?? pessoa.cpfpessoa;
    document.getElementById('cpfpessoa').value = pessoa.cpfPessoa ?? pessoa.cpfpessoa ?? '';
    document.getElementById('nomepessoa').value = pessoa.nomePessoa ?? pessoa.nomepessoa ?? '';
    document.getElementById('email').value = pessoa.email ?? '';
    document.getElementById('senha_pessoa').value = pessoa.senhaPessoa ?? pessoa.senha_pessoa ?? '';
    document.getElementById('data_acesso').value = (pessoa.primeiroAcessoPessoa ?? pessoa.primeiro_acesso_pessoa) ? 'true' : 'false';

    // Formatação da data para input type="date"
    const dataStr = pessoa.dataNascimentoPessoa ?? pessoa.datanascimentopessoa;
    if (dataStr) {
        const data = new Date(dataStr);
        const dataFormatada = data.toISOString().split('T')[0];
        document.getElementById('datanascimentopessoa').value = dataFormatada;
    } else {
        document.getElementById('datanascimentopessoa').value = '';
    }

    // preencher flags de tipo (Cliente / Funcionário) quando disponíveis
    try {
        const isCliente = pessoa.isCliente ?? pessoa.is_cliente ?? pessoa.cliente ?? false;
        const isFuncionario = pessoa.isFuncionario ?? pessoa.is_funcionario ?? pessoa.funcionario ?? false;
        // aplicar visual (botões) e campos
    // permite ambos: aplica toggles conforme flags retornadas
    if (isCliente) setPersonTypeToggleApply('cliente', true);
    if (isFuncionario) setPersonTypeToggleApply('funcionario', true);
    if (!isCliente && !isFuncionario) setPersonTypeToggleApply(null, false);
        // popular campos específicos quando disponíveis
        // popular campos cliente/funcionario com nomes compatíveis ao service
        if (document.getElementById('rendaCliente')) document.getElementById('rendaCliente').value = pessoa.rendaCliente ?? '';
        if (document.getElementById('dataDeCadastroCliente')) document.getElementById('dataDeCadastroCliente').value = pessoa.dataDeCadastroCliente ?? '';
        if (document.getElementById('cargosIdCargo')) document.getElementById('cargosIdCargo').value = pessoa.cargosIdCargo ?? '';
        if (document.getElementById('salario')) document.getElementById('salario').value = pessoa.salario ?? '';
        if (document.getElementById('porcentagemComissao')) document.getElementById('porcentagemComissao').value = pessoa.porcentagemComissao ?? '';
    } catch (e) {
        // não crítico
    }

    document.getElementById('numero').value = pessoa.numero ?? '';
    document.getElementById('cep').value = pessoa.cep ?? '';
}

// ----- Funções para alternância de tipo de pessoa -----
// toggle independente para permitir ambos os papéis
function setPersonTypeToggle(type) {
    if (type === 'cliente') {
        const now = chkTipoCliente && chkTipoCliente.checked;
        if (clienteFields) clienteFields.style.display = now ? 'block' : 'none';
        if (isClienteHidden) isClienteHidden.value = now ? 'true' : 'false';
        console.log('Tipo cliente toggled:', now);
    } else if (type === 'funcionario') {
        const now = chkTipoFuncionario && chkTipoFuncionario.checked;
        if (funcionarioFields) funcionarioFields.style.display = now ? 'block' : 'none';
        if (isFuncionarioHidden) isFuncionarioHidden.value = now ? 'true' : 'false';
        console.log('Tipo funcionario toggled:', now);
    }
}

// aplicar estado programaticamente (usar ao preencher formulário)
function setPersonTypeToggleApply(type, value) {
    if (type === 'cliente') {
        if (chkTipoCliente) chkTipoCliente.checked = Boolean(value);
        if (clienteFields) clienteFields.style.display = value ? 'block' : 'none';
        if (isClienteHidden) isClienteHidden.value = value ? 'true' : 'false';
    } else if (type === 'funcionario') {
        if (chkTipoFuncionario) chkTipoFuncionario.checked = Boolean(value);
        if (funcionarioFields) funcionarioFields.style.display = value ? 'block' : 'none';
        if (isFuncionarioHidden) isFuncionarioHidden.value = value ? 'true' : 'false';
    } else {
        if (chkTipoCliente) chkTipoCliente.checked = false;
        if (chkTipoFuncionario) chkTipoFuncionario.checked = false;
        if (clienteFields) clienteFields.style.display = 'none';
        if (funcionarioFields) funcionarioFields.style.display = 'none';
        if (isClienteHidden) isClienteHidden.value = 'false';
        if (isFuncionarioHidden) isFuncionarioHidden.value = 'false';
    }
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
    // enviar em camelCase; backend aceita vários formatos
    // Montar payload com nomes exatos esperados pelo backend (snake/camel conforme serviço)
    const pessoa = {
        cpfpessoa: searchId.value.trim(),
        nomepessoa: formData.get('nomepessoa') || '',
        email: formData.get('email') || '',
        senha_pessoa: formData.get('senha_pessoa') || '',
        data_acesso: formData.get('data_acesso') === 'true',
        datanascimentopessoa: formData.get('datanascimentopessoa') || null,
        numero: formData.get('numero') || '',
        cep: formData.get('cep') || ''
    };

    // incluir flags de tipo (cliente / funcionário) no payload (baseado em hidden fields set pelos botões)
    const isClienteFlag = isClienteHidden ? isClienteHidden.value === 'true' : false;
    const isFuncionarioFlag = isFuncionarioHidden ? isFuncionarioHidden.value === 'true' : false;
    pessoa.isCliente = !!isClienteFlag;
    pessoa.isFuncionario = !!isFuncionarioFlag;

    // incluir campos específicos apenas quando relevantes
    if (isClienteFlag) {
        // nomes esperados pelo serviço
        pessoa.rendaCliente = formData.get('rendaCliente') ? parseFloat(formData.get('rendaCliente')) : null;
        pessoa.dataDeCadastroCliente = formData.get('dataDeCadastroCliente') || null;
    }
    if (isFuncionarioFlag) {
        pessoa.salario = formData.get('salario') ? parseFloat(formData.get('salario')) : null;
        pessoa.cargosIdCargo = formData.get('cargosIdCargo') || null;
        pessoa.porcentagemComissao = formData.get('porcentagemComissao') ? parseFloat(formData.get('porcentagemComissao')) : null;
    }

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

// Carregar lista de cargos para o select de funcionário
async function carregarCargosForSelect() {
    if (!selectCargos) return;
    try {
        const response = await fetch(`${API_BASE_URL}/cargo`);
        if (!response.ok) return;
        const cargos = await response.json();
        // limpar e popular
        selectCargos.innerHTML = '<option value="">-- selecione um cargo --</option>';
        cargos.forEach(c => {
            const id = c.idcargo || c.id || '';
            const nome = c.nomecargo || c.nome || `Cargo ${id}`;
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = `${id} - ${nome}`;
            selectCargos.appendChild(opt);
        });
    } catch (err) {
        console.error('Erro ao carregar cargos para select:', err);
    }
}

// Função para renderizar tabela de pessoas
function renderizarTabelaPessoas(pessoas) {
    pessoasTableBody.innerHTML = '';

    pessoas.forEach(pessoa => {
        const row = document.createElement('tr');
        
        // Formatar badges de tipo (Cliente/Funcionário)
        const tipos = [];
        if (pessoa.isCliente || pessoa.is_cliente || pessoa.cliente) {
            tipos.push('<span class="badge badge-cliente">Cliente</span>');
        }
        if (pessoa.isFuncionario || pessoa.is_funcionario || pessoa.funcionario) {
            tipos.push('<span class="badge badge-funcionario">Funcionário</span>');
        }

        // Formatar valores monetários
        const formatMoney = (value) => {
            if (value == null) return '-';
            return new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(value);
        };

        row.innerHTML = `
            <td>
                <button class="btn-action" onclick="selecionarPessoa('${pessoa.cpfpessoa}')">
                    ${pessoa.cpfpessoa}
                </button>
            </td>
            <td>${pessoa.nomepessoa || '-'}</td>
            <td>${pessoa.email || '-'}</td>
            <td>${tipos.join(' ')}</td>
            <td>${pessoa.cargo?.nomecargo || pessoa.cargosIdCargo || '-'}</td>
            <td>${formatMoney(pessoa.salario)}</td>
            <td>${pessoa.porcentagemComissao ? pessoa.porcentagemComissao + '%' : '-'}</td>
            <td>${formatMoney(pessoa.rendaCliente)}</td>
            <td>${pessoa.dataDeCadastroCliente ? formatarData(pessoa.dataDeCadastroCliente) : '-'}</td>
            <td>${formatarData(pessoa.datanascimentopessoa) || '-'}</td>
            <td>${pessoa.cep || '-'}</td>
            <td>${pessoa.numero || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="visualizarPessoa('${pessoa.cpfpessoa}')" title="Visualizar">
                        👁️
                    </button>
                    <button class="btn-action btn-edit" onclick="editarPessoa('${pessoa.cpfpessoa}')" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-action btn-delete" onclick="confirmarExclusao('${pessoa.cpfpessoa}')" title="Excluir">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        pessoasTableBody.appendChild(row);
    });
}

// Funções auxiliares para ações da tabela
function visualizarPessoa(cpf) {
    searchId.value = cpf;
    buscarPessoa();
}

function editarPessoa(cpf) {
    searchId.value = cpf;
    buscarPessoa().then(() => alterarPessoa());
}

function confirmarExclusao(cpf) {
    if (confirm(`Tem certeza que deseja excluir a pessoa com CPF ${cpf}?`)) {
        searchId.value = cpf;
        buscarPessoa().then(() => excluirPessoa());
    }
}

function getPersonTypeLabel(pessoa) {
    const isCliente = pessoa.isCliente ?? pessoa.is_cliente ?? pessoa.cliente;
    const isFuncionario = pessoa.isFuncionario ?? pessoa.is_funcionario ?? pessoa.funcionario;
    const types = [];
    if (isCliente) types.push('Cliente');
    if (isFuncionario) types.push('Funcionário');
    return types.length ? types.join(', ') : '';
}

// Função para selecionar pessoa da tabela
async function selecionarPessoa(id) {
    searchId.value = id;
    await buscarPessoa();
}
