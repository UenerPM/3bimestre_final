const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudPessoa = (req, res) => {
//  console.log('pessoaController - Rota /abrirCrudPessoa - abrir o crudPessoa');
  res.sendFile(path.join(__dirname, '../../frontend/pessoa/pessoa.html'));
}

exports.listarPessoas = async (req, res) => {
  try {
    const result = await query(
      'SELECT cpfpessoa, nomepessoa, email, senha_pessoa, data_acesso, datanascimentopessoa, numero, cep FROM pessoa ORDER BY cpfpessoa'
    );
    console.log('Resultado do SELECT:', result.rows); // Log para depuração
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error && error.stack ? error.stack : error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Adicionando tratamento de erros detalhado
exports.criarPessoa = async (req, res) => {
  try {
    console.log('Dados recebidos para criar pessoa:', req.body);
    // Frontend envia: cpfpessoa, nomepessoa, email, senha_pessoa, primeiro_acesso_pessoa, datanascimentopessoa, numero, cep
    const { cpfpessoa, nomepessoa, email, senha_pessoa, primeiro_acesso_pessoa, datanascimentopessoa, numero, cep } = req.body;

    // Validação básica
    if (!cpfpessoa || !nomepessoa || !email || !senha_pessoa) {
      console.warn('Dados obrigatórios ausentes:', { cpfpessoa, nomepessoa, email, senha_pessoa });
      return res.status(400).json({ error: 'CPF, nome, email e senha são obrigatórios' });
    }

    // Adicionando logs para depuração
    console.log('CPF recebido:', cpfpessoa);
    console.log('Email recebido:', email);
    console.log('Número recebido:', numero);
    console.log('CEP recebido:', cep);

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn('Email inválido:', email);
      return res.status(400).json({ error: 'Email inválido' });
    }

    // converter primeiro_acesso_pessoa -> data_acesso (timestamp)
    const dataAcessoFormatada = primeiro_acesso_pessoa ? new Date().toISOString() : new Date().toISOString();

    // converter datanascimentopessoa se fornecido
    let dataNascimentoFormatada = null;
    if (datanascimentopessoa) {
      const parsed = new Date(datanascimentopessoa);
      if (isNaN(parsed.getTime())) return res.status(400).json({ error: 'Formato inválido para datanascimentopessoa' });
      dataNascimentoFormatada = parsed.toISOString().split('T')[0];
    }

    try {
      const result = await query(
        'INSERT INTO pessoa (cpfpessoa, nomepessoa, email, senha_pessoa, data_acesso, datanascimentopessoa, numero, cep) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [cpfpessoa, nomepessoa, email, senha_pessoa, dataAcessoFormatada, dataNascimentoFormatada, numero, cep]
      );

      console.log('Pessoa criada com sucesso:', result.rows[0]);
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar pessoa:', error && error.stack ? error.stack : error);
      return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);

    if (error.code === '23505' && error.constraint && error.constraint.includes('email')) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    if (error.code === '23502') {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }

    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
}

exports.obterPessoa = async (req, res) => {
  try {
    const cpfpessoa = req.params.cpfpessoa || req.body.cpfpessoa; // Verifica tanto params quanto body
    console.log('CPF recebido para obter pessoa:', cpfpessoa);

    if (!cpfpessoa) {
      console.warn('CPF inválido ou não fornecido:', req.params.cpfpessoa, req.body.cpfpessoa);
      return res.status(400).json({ error: 'CPF deve ser válido e fornecido' });
    }

  const result = await query('SELECT cpfpessoa, nomepessoa, email, senha_pessoa, data_acesso, datanascimentopessoa, numero, cep FROM pessoa WHERE cpfpessoa = $1', [cpfpessoa]);

    if (result.rows.length === 0) {
      console.warn('Pessoa não encontrada para CPF:', cpfpessoa);
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    console.log('Pessoa encontrada:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
}

exports.atualizarPessoa = async (req, res) => {
  try {
    console.log('Requisição recebida para atualizar pessoa:', req.body);
    const cpfpessoa = req.params.cpfpessoa;
    if (!cpfpessoa) return res.status(400).json({ error: 'CPF obrigatório na rota' });

    const { nomepessoa, email, senha_pessoa, datanascimentopessoa, numero, cep, primeiro_acesso_pessoa } = req.body;

    // converter data se fornecida
    let dataNascimentoFormatada = null;
    if (datanascimentopessoa) {
      const parsed = new Date(datanascimentopessoa);
      if (isNaN(parsed.getTime())) return res.status(400).json({ error: 'Formato inválido para datanascimentopessoa' });
      dataNascimentoFormatada = parsed.toISOString().split('T')[0];
    }

    const dataAcessoFormatada = primeiro_acesso_pessoa ? new Date().toISOString() : null;

    const sql = `UPDATE pessoa SET nomepessoa = $1, email = $2, senha_pessoa = $3, datanascimentopessoa = $4, numero = $5, cep = $6 ${dataAcessoFormatada ? ', data_acesso = $7' : ''} WHERE cpfpessoa = $${dataAcessoFormatada ? '8' : '7'} RETURNING cpfpessoa, nomepessoa, email, datanascimentopessoa, numero, cep`;

    const params = [nomepessoa, email, senha_pessoa, dataNascimentoFormatada, numero, cep];
    if (dataAcessoFormatada) params.push(dataAcessoFormatada);
    params.push(cpfpessoa);

    const result = await query(sql, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pessoa não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar pessoa:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Erro ao atualizar pessoa' });
  }
}

exports.deletarPessoa = async (req, res) => {
  try {
    let cpfpessoa = req.params.cpfpessoa;
    if (!cpfpessoa) return res.status(400).json({ error: 'CPF obrigatório na rota' });

    cpfpessoa = String(cpfpessoa).trim();
    console.log('Requisição DELETE /pessoa/:cpfpessoa recebida para CPF:', cpfpessoa);

    // Normaliza CPF (remove quaisquer caracteres não numéricos) para evitar diferenças de formatação
    const normalizedCpf = cpfpessoa.replace(/\D/g, '');

    // Verifica se a pessoa existe comparando CPF normalizado no banco
    const existingPersonResult = await query(
      "SELECT * FROM pessoa WHERE regexp_replace(cpfpessoa, '\\D', '', 'g') = $1",
      [normalizedCpf]
    );

    console.log('Resultado verificação existência (rows):', existingPersonResult.rows.length);
    if (existingPersonResult.rows.length === 0) {
      // Não encontrou — retorna 404 (frontend pode tratar como idempotente) ou considerar 204.
      console.warn('Pessoa não encontrada para exclusão. CPF pesquisado (normalizado):', normalizedCpf);
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    // Deleta usando a mesma comparação por CPF normalizado e retorna o registro excluído
    const deleteResult = await query(
      "DELETE FROM pessoa WHERE regexp_replace(cpfpessoa, '\\D', '', 'g') = $1 RETURNING cpfpessoa",
      [normalizedCpf]
    );

    console.log('Resultado delete (rows):', deleteResult.rowCount || (deleteResult.rows && deleteResult.rows.length));
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pessoa:', error && error.stack ? error.stack : error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Não é possível deletar pessoa com dependências associadas' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função adicional para buscar pessoa por email
exports.obterPessoaPorEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const result = await query(
      'SELECT * FROM pessoa WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa por email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função para atualizar apenas a senha
exports.atualizarSenha = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { senha_atual, nova_senha } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    if (!senha_atual || !nova_senha) {
      return res.status(400).json({
        error: 'Senha atual e nova senha são obrigatórias'
      });
    }

    // Verifica se a pessoa existe e a senha atual está correta
    const personResult = await query(
      'SELECT * FROM pessoa WHERE cpfpessoa = $1',
      [id]
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
    const updateResult = await query(
      'UPDATE pessoa SET senha_pessoa = $1 WHERE cpfpessoa = $2 RETURNING cpfpessoa, nomepessoa, email, data_acesso, dataNascimentoPessoa',
      [nova_senha, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

function converterDataParaISO(dataString) {
    if (!dataString) return null;
    return new Date(dataString).toISOString().split('T')[0];
}