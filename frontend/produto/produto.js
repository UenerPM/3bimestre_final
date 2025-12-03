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
const imagemSelect = document.getElementById('imagemSelect');
const imagemPath = document.getElementById('imagemPath');
const imagemFile = document.getElementById('imagemFile');
const imagePreview = document.getElementById('imagePreview');

// Carregar lista de produtos e imagens ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    carregarImagens();
});

// Função auxiliar para escapar HTML (evitar XSS)
function escapeHtml(unsafe) {
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Default image (inline SVG) used when product has no image
const DEFAULT_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
);

function getImagemCaminho(produto) {
    return produto.imagem_caminho ?? produto.imagemCaminho ?? produto.imagem ?? null;
}

// Carregar lista de imagens no select
async function carregarImagens() {
    try {
        const response = await fetch(`${API_BASE_URL}/imagem`);
        if (response.ok) {
            const imagens = await response.json();
            imagemSelect.innerHTML = '<option value="">Selecione uma imagem</option>';
            imagens.forEach(img => {
                imagemSelect.innerHTML += `<option value="${escapeHtml(img.caminho)}">${escapeHtml(img.caminho)}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar imagens:', error);
        mostrarMensagem('Erro ao carregar lista de imagens', 'error');
    }
}

// Atualizar preview quando mudar select ou input
imagemSelect.addEventListener('change', (e) => atualizarPreview(e));
imagemPath.addEventListener('input', (e) => atualizarPreview(e));
imagemFile?.addEventListener('change', (e) => atualizarPreview(e));

function atualizarPreview(e) {
    // prioridade: arquivo selecionado > caminho digitado > select
    const file = imagemFile?.files && imagemFile.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (ev) {
            imagePreview.src = ev.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
        // limpar select/path to avoid confusion
        imagemSelect.value = '';
        imagemPath.value = '';
        return;
    }

    const caminho = imagemPath.value || imagemSelect.value;
    if (caminho && (caminho.match(/\.(jpg|jpeg|png|gif|webp)$/i) || caminho.startsWith('http') )) {
        // exibir via URL relativo ou absoluto
        imagePreview.src = caminho.startsWith('http') ? caminho : '/' + caminho;
        imagePreview.style.display = 'block';
        if (e?.target === imagemSelect && imagemSelect.value) {
            imagemPath.value = imagemSelect.value;
        }
        if (e?.target === imagemPath) {
            imagemSelect.value = '';
        }
    } else {
        imagePreview.style.display = 'none';
        imagePreview.src = '';
    }
}

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
                // aceitar tanto camelCase quanto snake_case (compatibilidade)
                const p = produto && (produto.idProduto || produto.idproduto) ? produto : produto;
                preencherFormulario(p);
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
    currentProductId = produto.idProduto ?? produto.idproduto;
    searchId.value = produto.idProduto ?? produto.idproduto;
    document.getElementById('noemproduto').value = produto.nomeProduto ?? produto.nomeproduto ?? '';
    document.getElementById('quantidadeemestoque').value = produto.quantidadeEmEstoque ?? produto.quantidadeemestoque ?? '';
    document.getElementById('precounitario').value = produto.precoUnitario ?? produto.precounitario ?? '';
    
    // Preencher campo de imagem e mostrar preview (arquivo input permanece vazio por segurança)
    const caminho = getImagemCaminho(produto);
    if (caminho) {
        imagemPath.value = caminho;
        imagemSelect.value = caminho;
        imagePreview.src = caminho.startsWith('http') ? caminho : '/' + caminho;
        imagePreview.style.display = 'block';
    } else {
        imagemPath.value = '';
        imagemSelect.value = '';
        imagePreview.src = DEFAULT_IMAGE;
        imagePreview.style.display = 'block';
    }
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
    // Validar caminho da imagem se fornecido
    const imagemCaminho = imagemPath.value.trim();
    if (imagemCaminho && !imagemCaminho.match(/^img\/produtos\/[^\/]+\.(jpg|jpeg|png|gif)$/i)) {
        mostrarMensagem('Caminho de imagem inválido. Use formato: img/produtos/nome.jpg', 'error');
        return;
    }
    // verificar se há arquivo selecionado
    const arquivo = imagemFile?.files && imagemFile.files[0];

    const produto = {
        idproduto: searchId.value || null,
        nomeproduto: form.noemproduto.value,
        quantidadeemestoque: form.quantidadeemestoque.value,
        precounitario: form.precounitario.value,
        // se houver arquivo, deixamos imagem_caminho nulo e faremos upload depois
        imagem_caminho: arquivo ? null : (imagemCaminho || null)
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

            if (response.ok && arquivo) {
                const created = await response.json();
                const prodId = created.idproduto ?? created.idProduto ?? created.id;
                // upload do arquivo associado ao produto
                try {
                    await uploadFileForProduct(prodId, arquivo);
                } catch (err) {
                    console.error('Erro ao fazer upload da imagem:', err);
                    mostrarMensagem('Produto criado mas falha ao enviar imagem', 'warning');
                }
            }
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/produto/${currentProductId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(produto)
            });

            if (response.ok && arquivo) {
                const prodId = currentProductId;
                try {
                    await uploadFileForProduct(prodId, arquivo);
                } catch (err) {
                    console.error('Erro ao fazer upload da imagem:', err);
                    mostrarMensagem('Produto atualizado mas falha ao enviar imagem', 'warning');
                }
            }
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
        const caminho = getImagemCaminho(produto);
        const thumbSrc = caminho ? (caminho.startsWith('http') ? caminho : ('/' + caminho)) : DEFAULT_IMAGE;
        row.innerHTML = `
                    <td>
                        <button class="btn-id" onclick="selecionarProduto(${produto.idProduto ?? produto.idproduto})">
                            ${produto.idProduto ?? produto.idproduto}
                        </button>
                    </td>
                    <td class="product-thumb-cell">
                        <img class="product-thumb" src="${escapeHtml(thumbSrc)}" alt="thumb">
                    </td>
                    <td>${escapeHtml(produto.nomeProduto ?? produto.nomeproduto)}</td>
                    <td>${produto.quantidadeEmEstoque ?? produto.quantidadeemestoque}</td>
                    <td>R$ ${Number(produto.precoUnitario ?? produto.precounitario).toFixed(2)}</td>
                `;
        produtosTableBody.appendChild(row);
    });
}

// Função para selecionar produto da tabela
async function selecionarProduto(id) {
    searchId.value = id;
    await buscarProduto();
}

// Faz upload do arquivo para o produto
async function uploadFileForProduct(produtoId, file) {
    const fd = new FormData();
    fd.append('imagem', file);
    console.log('Enviando arquivo para /imagem/upload/', produtoId, file.name, file.type, file.size);
    const res = await fetch(`${API_BASE_URL}/imagem/upload/${produtoId}`, {
        method: 'POST',
        body: fd
    });
    const text = await res.text().catch(()=>null);
    console.log('Resposta upload status:', res.status, 'body:', text);
    if (!res.ok) {
        // tentar parsear JSON
        let parsed = null;
        try { parsed = JSON.parse(text); } catch(e) { /* ignore */ }
        throw new Error((parsed && parsed.error) ? parsed.error : text || 'Falha no upload');
    }
    // após upload, recarregar listas
    await carregarImagens();
    await carregarProdutos();
}
