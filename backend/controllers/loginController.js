const db = require('../database.js');

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
  if (!nome) return res.json({ status: 'nao_logado' });
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

    return res.json({ status: 'ok', nome, avatar_url, isFuncionario });
  } catch (err) {
    console.error('Erro ao buscar dados do usuário:', err.message || err);
    return res.json({ status: 'ok', nome });
  }
}


// Funções do controller
exports.listarPessoas = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pessoa ORDER BY cpfpessoa');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: 'Erro interno do servcpfpessoaor' });
  }
};

exports.verificarEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const cols = ['nomepessoa'];
    if (await hasAvatarColumn()) cols.push('avatar_url');
    const sql = `SELECT ${cols.join(', ')} FROM pessoa WHERE email = $1`;
    console.log('rota verificarEmail:', sql, email);
    const result = await db.query(sql, [email]);
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return res.json({ status: 'existe', nome: row.nomepessoa, avatar_url: row.avatar_url || null });
    }
    res.json({ status: 'nao_encontrado' });
  } catch (err) {
    console.error('Erro em verificarEmail:', err);
    res.status(500).json({ status: 'erro', mensagem: err.message });
  }
};


// Verificar senha (busca por email e compara no servidor com trim para evitar problemas de espaços)
exports.verificarSenha = async (req, res) => {
  const { email, senha } = req.body || {};

  if (!email || !senha) {
    return res.status(400).json({ status: 'erro', mensagem: 'Email e senha são obrigatórios' });
  }

  try {
    // prepara colunas a selecionar
    const cols = ['cpfpessoa', 'nomepessoa', 'senha_pessoa'];
    if (await hasAvatarColumn()) cols.push('avatar_url');
    const sqlPessoa = `SELECT ${cols.join(', ')} FROM pessoa WHERE email = $1 LIMIT 1`;

    console.log('Rota verificarSenha (busca por email):', sqlPessoa, email);

    const result = await db.query(sqlPessoa, [email]);
    if (result.rows.length === 0) {
      console.log('DEBUG: nenhum usuário encontrado para email', email);
      return res.json({ status: 'senha_incorreta' });
    }

    const person = result.rows[0];
    const storedSenha = person.senha_pessoa == null ? '' : String(person.senha_pessoa);
    console.log('DEBUG stored senha_pessoa for', email, ':', storedSenha);

    // compara aplicando trim em ambos os lados
    if (storedSenha.trim() !== String(senha).trim()) {
      return res.json({ status: 'senha_incorreta' });
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

    return res.json({ status: 'ok', nome: nomepessoa, avatar_url: avatar_url || null });
  } catch (err) {
    console.error('Erro ao verificar senha:', err);
    return res.status(500).json({ status: 'erro', mensagem: err.message });
  }
}


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
  res.json({ status: 'deslogado' });
}


exports.criarPessoa = async (req, res) => {
  //  console.log('Criando pessoa com dados:', req.body);
  try {
    const { cpfpessoa, nomepessoa, email, senha_pessoa, primeiro_acesso_pessoa = true, data_nascimento } = req.body;

    // Valcpfpessoaação básica
    if (!nomepessoa || !email || !senha_pessoa) {
      return res.status(400).json({
        error: 'Nome, email e senha são obrigatórios'
      });
    }

    // Valcpfpessoaação de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Formato de email inválcpfpessoao'
      });
    }

    const result = await db.query(
      'INSERT INTO pessoa (cpfpessoa, nomepessoa, email, senha_pessoa, primeiro_acesso_pessoa, data_nascimento) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [cpfpessoa, nomepessoa, email, senha_pessoa, primeiro_acesso_pessoa, data_nascimento]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);

    // Verifica se é erro de email duplicado (constraint unique violation)
    if (error.code === '23505' && error.constraint === 'pessoa_email_key') {
      return res.status(400).json({
        error: 'Email já está em uso'
      });
    }

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não forneccpfpessoaos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servcpfpessoaor' });
  }
};

exports.obterPessoa = async (req, res) => {
  try {
    const cpfpessoa = req.params.cpfpessoa;

    // Verifica se o CPFPESSOA é numérico
    if (!/^[0-9]+$/.test(cpfpessoa)) {
      return res.status(400).json({ error: 'CPFPESSOA deve ser um número válcpfpessoao' });
    }

    const result = await db.query(
      'SELECT * FROM pessoa WHERE cpfpessoa = $1',
      [cpfpessoa]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servcpfpessoaor' });
  }
};


// Função adicional para buscar pessoa por email
exports.obterPessoaPorEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const result = await db.query(
      'SELECT * FROM pessoa WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa por email:', error);
    res.status(500).json({ error: 'Erro interno do servcpfpessoaor' });
  }
};

// Função para atualizar apenas a senha
exports.atualizarSenha = async (req, res) => {
  try {
    const cpfpessoa = parseInt(req.params.cpfpessoa);
    const { senha_atual, nova_senha } = req.body;

    if (isNaN(cpfpessoa)) {
      return res.status(400).json({ error: 'CPFPESSOA deve ser um número válcpfpessoao' });
    }

    if (!senha_atual || !nova_senha) {
      return res.status(400).json({
        error: 'Senha atual e nova senha são obrigatórias'
      });
    }

    // Verifica se a pessoa existe e a senha atual está correta
    const personResult = await db.query(
      'SELECT * FROM pessoa WHERE cpfpessoa = $1',
      [cpfpessoa]
    );

    if (personResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    const person = personResult.rows[0];

    // Verificação básica da senha atual (em produção, use hash)
    if (person.senha_pessoa !== senha_atual) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    // Atualiza apenas a senha
    const updateResult = await db.query(
      'UPDATE pessoa SET senha_pessoa = $1 WHERE cpfpessoa = $2 RETURNING cpfpessoa, nomepessoa, email, primeiro_acesso_pessoa, data_nascimento',
      [nova_senha, cpfpessoa]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro interno do servcpfpessoaor' });
  }
};

