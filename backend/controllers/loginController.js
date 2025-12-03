const db = require('../database.js');
const controllerHelper = require('../utils/controllerHelper');
const pessoaController = require('./pessoaController');

// helper: verifica se a coluna avatar_url existe na tabela pessoa
let _hasAvatarColumn = null;
async function hasAvatarColumn() {
  if (_hasAvatarColumn !== null) return _hasAvatarColumn;
  try {
    const sql = `SELECT column_name FROM information_schema.columns WHERE table_name='pessoa' AND column_name='avatar_url'`;
    const r = await db.query(sql);
    _hasAvatarColumn = r.rows.length > 0;
  } catch (e) {
    console.error('Erro verificando coluna avatar_url:', e.message || e);
    _hasAvatarColumn = false;
  }
  return _hasAvatarColumn;
}

exports.verificaSeUsuarioEstaLogado = async (req, res) => {
  console.log('loginController - Acessando rota /verificaSeUsuarioEstaLogado');
  const nome = req.cookies && req.cookies.usuarioLogado;
  console.log('Cookie usuarioLogado:', nome);
  if (!nome) return controllerHelper.respondJson(res, { status: 'nao_logado' });
  try {
    // buscar pessoa (para obter cpf e avatar, se existir)
    const cols = ['cpfpessoa'];
    if (await hasAvatarColumn()) cols.push('avatar_url');
    const sql = `SELECT ${cols.join(', ')} FROM pessoa WHERE nomepessoa = $1 LIMIT 1`;
    const result = await db.query(sql, [nome]);

    const cpf = result.rows.length > 0 ? result.rows[0].cpfpessoa : null;
    const avatar_url = result.rows.length > 0 && result.rows[0].avatar_url ? result.rows[0].avatar_url : null;

    // verificar se é funcionario
    let isFuncionario = false;
    if (cpf) {
      const r2 = await db.query('SELECT 1 FROM funcionario WHERE pessoacpfpessoa = $1 LIMIT 1', [cpf]);
      isFuncionario = r2.rows.length > 0;
    }

    return controllerHelper.respondJson(res, { status: 'ok', nome, avatar_url, isFuncionario });
  } catch (err) {
    console.error('Erro ao buscar dados do usuário:', err.message || err);
    return controllerHelper.respondJson(res, { status: 'ok', nome });
  }
};

exports.listarPessoas = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pessoa ORDER BY cpfpessoa');
    return controllerHelper.respondList(res, result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    return controllerHelper.respondServerError(res, error);
  }
};

// Delega criação de pessoa ao controller de pessoa para manter contrato de rotas
exports.criarPessoa = pessoaController.criarPessoa;

exports.verificarEmail = async (req, res) => {
  const { email } = req.body || {};
  try {
    const cols = ['nomepessoa'];
    if (await hasAvatarColumn()) cols.push('avatar_url');
    const sql = `SELECT ${cols.join(', ')} FROM pessoa WHERE email = $1`;
    console.log('rota verificarEmail:', sql, email);
    const result = await db.query(sql, [email]);
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return controllerHelper.respondJson(res, { status: 'existe', nome: row.nomepessoa, avatar_url: row.avatar_url || null });
    }
    return controllerHelper.respondJson(res, { status: 'nao_encontrado' });
  } catch (err) {
    console.error('Erro em verificarEmail:', err);
    return controllerHelper.respondServerError(res, err);
  }
};

// Verificar senha (busca por email e compara no servidor com trim para evitar problemas de espaços)
exports.verificarSenha = async (req, res) => {
  const { email, senha } = req.body || {};

  if (!email || !senha) {
    return controllerHelper.respondBadRequest(res, 'Email e senha são obrigatórios');
  }

  try {
    const cols = ['cpfpessoa', 'nomepessoa', 'senha_pessoa'];
    if (await hasAvatarColumn()) cols.push('avatar_url');
    const sqlPessoa = `SELECT ${cols.join(', ')} FROM pessoa WHERE email = $1 LIMIT 1`;

    console.log('Rota verificarSenha (busca por email):', sqlPessoa, email);

    const result = await db.query(sqlPessoa, [email]);
    if (result.rows.length === 0) {
      console.log('DEBUG: nenhum usuário encontrado para email', email);
      return controllerHelper.respondJson(res, { status: 'senha_incorreta' });
    }

    const person = result.rows[0];
    const storedSenha = person.senha_pessoa == null ? '' : String(person.senha_pessoa);
    console.log('DEBUG stored senha_pessoa for', email, ':', storedSenha);

    // compara aplicando trim em ambos os lados
    if (storedSenha.trim() !== String(senha).trim()) {
      return controllerHelper.respondJson(res, { status: 'senha_incorreta' });
    }

    const { cpfpessoa, nomepessoa, avatar_url } = person;
    console.log('Usuário encontrado:', { cpfpessoa, nomepessoa, avatar_url });

    // Define cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('usuarioLogado', nomepessoa, {
      sameSite: isProduction ? 'None' : 'Lax',
      secure: isProduction, // somente secure em produção (HTTPS)
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
    });

    console.log("Cookie 'usuarioLogado' definido com sucesso");

    // verificar se é funcionario
    let isFuncionario = false;
    try {
      const r = await db.query('SELECT 1 FROM funcionario WHERE pessoacpfpessoa = $1 LIMIT 1', [cpfpessoa]);
      isFuncionario = r.rows.length > 0;
    } catch (e) {
      console.error('Erro verificando funcionário:', e.message || e);
    }

    return controllerHelper.respondJson(res, { status: 'ok', nome: nomepessoa, avatar_url: avatar_url || null, isFuncionario });
  } catch (err) {
    console.error('Erro ao verificar senha:', err);
    return controllerHelper.respondServerError(res, err);
  }
};

// Logout
exports.logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('usuarioLogado', {
    sameSite: isProduction ? 'None' : 'Lax',
    secure: isProduction,
    httpOnly: true,
    path: '/',
  });
  console.log("Cookie 'usuarioLogado' removido com sucesso");
  return controllerHelper.respondJson(res, { status: 'deslogado' });
};

exports.obterPessoa = async (req, res) => {
  try {
    const cpfpessoa = req.params.cpfpessoa;

    // Verifica se o CPFPESSOA é numérico
    if (!/^[0-9]+$/.test(String(cpfpessoa))) {
      return controllerHelper.respondBadRequest(res, 'CPFPESSOA deve ser um número válido');
    }

    // Consulta pessoa pelo CPF
    const result = await db.query(
      'SELECT * FROM pessoa WHERE cpfpessoa = $1',
      [cpfpessoa]
    );

    if (result.rows.length === 0) {
      return controllerHelper.respondNotFound(res, 'Pessoa não encontrada');
    }

    return controllerHelper.respondJson(res, result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa:', error);
    return controllerHelper.respondServerError(res, error);
  }
};

// Função adicional para buscar pessoa por email
exports.obterPessoaPorEmail = async (req, res) => {
  try {
    const email = req.params.email;

    if (!email) {
      return controllerHelper.respondBadRequest(res, 'Email é obrigatório');
    }

    const result = await db.query(
      'SELECT * FROM pessoa WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return controllerHelper.respondNotFound(res, 'Pessoa não encontrada');
    }
    return controllerHelper.respondJson(res, result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa por email:', error);
    return controllerHelper.respondServerError(res, error);
  }
};

// Função para atualizar apenas a senha
exports.atualizarSenha = async (req, res) => {
  try {
    const cpfpessoa = parseInt(req.params.cpfpessoa);
    const { senha_atual, nova_senha } = req.body || {};

    if (isNaN(cpfpessoa)) {
      return controllerHelper.respondBadRequest(res, 'CPFPESSOA deve ser um número válido');
    }
    if (!senha_atual || !nova_senha) {
      return controllerHelper.respondBadRequest(res, 'Senha atual e nova senha são obrigatórias');
    }
    // Verifica se a pessoa existe e a senha atual está correta
    const personResult = await db.query(
      'SELECT * FROM pessoa WHERE cpfpessoa = $1',
      [cpfpessoa]
    );

    if (personResult.rows.length === 0) {
      return controllerHelper.respondNotFound(res, 'Pessoa não encontrada');
    }
    const person = personResult.rows[0];

    // Verificação básica da senha atual (em produção, use hash)
    if (person.senha_pessoa !== senha_atual) {
      return controllerHelper.respondBadRequest(res, 'Senha atual incorreta');
    }
    // Atualiza apenas a senha
    const updateResult = await db.query(
      'UPDATE pessoa SET senha_pessoa = $1 WHERE cpfpessoa = $2 RETURNING cpfpessoa, nomepessoa, email, primeiro_acesso_pessoa, data_nascimento',
      [nova_senha, cpfpessoa]
    );

    return controllerHelper.respondJson(res, updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return controllerHelper.respondServerError(res, error);
  }
};
