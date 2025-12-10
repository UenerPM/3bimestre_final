const { query, transaction } = require('../database');
const helper = require('../utils/controllerHelper');
// Funções do controller
const path = require('path');

exports.abrirCrudPessoa = (req, res) => {
//  console.log('pessoaController - Rota /abrirCrudPessoa - abrir o crudPessoa');
  res.sendFile(path.join(__dirname, '../../frontend/pessoa/pessoa.html'));
}

exports.listarPessoas = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        p.cpfpessoa, 
        p.nomepessoa, 
        p.email, 
        p.senha_pessoa, 
        p.data_acesso, 
        p.datanascimentopessoa, 
        p.numero, 
        p.cep,
        CASE WHEN c.pessoacpfpessoa IS NOT NULL THEN true ELSE false END as is_cliente,
        CASE WHEN f.pessoacpfpessoa IS NOT NULL THEN true ELSE false END as is_funcionario
      FROM pessoa p
      LEFT JOIN cliente c ON c.pessoacpfpessoa = p.cpfpessoa
      LEFT JOIN funcionario f ON f.pessoacpfpessoa = p.cpfpessoa
      ORDER BY p.cpfpessoa`
    );
    console.log('Resultado do SELECT:', result.rows);
    return helper.respondList(res, result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error && error.stack ? error.stack : error);
    return helper.respondServerError(res, error);
  }
}

// Adicionando tratamento de erros detalhado
exports.criarPessoa = async (req, res) => {
  try {
    // Log dos dados recebidos
    console.log('Dados recebidos para criar pessoa:', req.body);

    // O frontend envia tudo em um payload só:
    // - cpfpessoa, nomepessoa, email, senha_pessoa, primeiro_acesso_pessoa, datanascimentopessoa, numero, cep (básico)
    // - isCliente, rendaCliente, dataDeCadastroCliente (dados do papel cliente)
    // - isFuncionario, salario, cargosIdCargo, porcentagemComissao (dados do papel funcionário)
    const pessoa = { ...req.body };

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(pessoa.email)) {
      console.warn('Email inválido:', pessoa.email);
      return helper.respondBadRequest(res, 'Email inválido');
    }

    try {
      const created = await require('../services/personService').createWithRoles(pessoa);
      console.log('Pessoa criada com sucesso:', created);
      return helper.respondCreated(res, created);

    } catch (error) {
      console.error('Erro ao criar pessoa:', error && error.stack ? error.stack : error);

      if (error.message && error.message.includes('obrigatório')) {
        return helper.respondBadRequest(res, error.message);
      }

      if (error.code === '23505' && error.constraint && error.constraint.includes('email')) {
        return helper.respondBadRequest(res, 'Email já está em uso');
      }

      if (error.code === '23502') {
        return helper.respondBadRequest(res, 'Dados obrigatórios não fornecidos');
      }

      if (error.code === '23503') {
        return helper.respondBadRequest(res, 'Erro de referência: verifique se o cargo informado existe');
      }

      return helper.respondServerError(res, error);
    }
  } catch (error) {
    console.error('Erro ao processar requisição de criar pessoa:', error);
    return helper.respondServerError(res, error);
  }
}

exports.obterPessoa = async (req, res) => {
  try {
    // Verificar params e body para suportar ambos os patterns de uso
    const cpfpessoa = req.params.cpfpessoa || req.body.cpfpessoa;
    console.log('CPF recebido para obter pessoa:', cpfpessoa);

    if (!cpfpessoa) {
      console.warn('CPF inválido ou não fornecido:', req.params.cpfpessoa, req.body.cpfpessoa);
      return helper.respondBadRequest(res, 'CPF deve ser válido e fornecido');
    }

    // Usar getWithRoles do service para trazer todos os papéis de uma vez
    const pessoa = await require('../services/personService').getWithRoles(cpfpessoa);
    if (!pessoa) {
      console.warn('Pessoa não encontrada para CPF:', cpfpessoa);
      return helper.respondNotFound(res, 'Pessoa não encontrada');
    }

    console.log('Pessoa encontrada com papéis:', pessoa);
    return helper.respondJson(res, pessoa);
  } catch (error) {
    console.error('Erro ao obter pessoa:', error);
    return helper.respondServerError(res, error);
  }
}

exports.atualizarPessoa = async (req, res) => {
  try {
    console.log('Requisição recebida para atualizar pessoa:', req.body);
    const cpfpessoa = req.params.cpfpessoa;
    if (!cpfpessoa) return helper.respondBadRequest(res, 'CPF obrigatório na rota');

    const pessoa = { ...req.body, cpfpessoa };

    // Validar se existe
    const current = await require('../services/personService').getWithRoles(cpfpessoa);
    if (!current) return helper.respondNotFound(res, 'Pessoa não encontrada');

    // converter data se fornecida
    if (pessoa.datanascimentopessoa) {
      const parsed = new Date(pessoa.datanascimentopessoa);
      if (isNaN(parsed.getTime())) return helper.respondBadRequest(res, 'Formato inválido para datanascimentopessoa');
      pessoa.datanascimentopessoa = parsed.toISOString().split('T')[0];
    }

    // Validar email se fornecido
    if (pessoa.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(pessoa.email)) {
        return helper.respondBadRequest(res, 'Email inválido');
      }
    }

    // Atualizar usando transaction para manter consistência
    return await transaction(async (client) => {
      // Atualiza dados básicos da pessoa primeiro
      const updatePessoaRes = await client.query(
        `UPDATE pessoa SET
          nomepessoa = COALESCE($1, nomepessoa),
          email = COALESCE($2, email),
          senha_pessoa = COALESCE($3, senha_pessoa),
          datanascimentopessoa = COALESCE($4, datanascimentopessoa),
          numero = COALESCE($5, numero),
          cep = COALESCE($6, cep)
        WHERE cpfpessoa = $7
        RETURNING *`,
        [
          pessoa.nomepessoa,
          pessoa.email,
          pessoa.senha_pessoa,
          pessoa.datanascimentopessoa,
          pessoa.numero,
          pessoa.cep,
          cpfpessoa
        ]
      );

      if (updatePessoaRes.rows.length === 0) return helper.respondNotFound(res, 'Pessoa não encontrada');

      // Atualizar papéis usando mesmo client da transação
      await require('../services/personService').updateRoles(pessoa, client.query.bind(client));

      // Retornar pessoa atualizada com papéis
      const updated = await require('../services/personService').getWithRoles(cpfpessoa);
      return helper.respondJson(res, updated);
    });

  } catch (err) {
    console.error('Erro ao atualizar pessoa:', err && err.stack ? err.stack : err);

    if (err.message && err.message.includes('obrigatório')) {
      return helper.respondBadRequest(res, err.message);
    }

    // Erro de dependências ao tentar remover papel de funcionário
    if (err.code === 'DEPENDENT_RECORDS' || (err.message && err.message.includes('pedidos vinculados'))) {
      return helper.respondBadRequest(res, err.message);
    }

    if (err.code === '23505' && err.constraint && err.constraint.includes('email')) {
      return helper.respondBadRequest(res, 'Email já está em uso');
    }

    if (err.code === '23503') {
      return helper.respondBadRequest(res, 'Erro de referência: verifique se o cargo informado existe');
    }

    return helper.respondServerError(res, err);
  }
}

exports.deletarPessoa = async (req, res) => {
  try {
    let cpfpessoa = req.params.cpfpessoa;
    if (!cpfpessoa) return helper.respondBadRequest(res, 'CPF obrigatório na rota');

    cpfpessoa = String(cpfpessoa).trim();
    console.log('Requisição DELETE /pessoa/:cpfpessoa recebida para CPF:', cpfpessoa);

    // Normaliza CPF (remove quaisquer caracteres não numéricos) para evitar diferenças de formatação
    const normalizedCpf = cpfpessoa.replace(/\D/g, '');

    // Busca pessoa completa com papéis (para log)
    const existing = await require('../services/personService').getWithRoles(normalizedCpf);
    if (!existing) {
      console.warn('Pessoa não encontrada para exclusão. CPF normalizado:', normalizedCpf);
      return helper.respondNotFound(res, 'Pessoa não encontrada');
    }

    // Pessoa existe; deletar usando transaction
    return await transaction(async (client) => {
      // ON DELETE CASCADE nas tabelas cliente e funcionário vai apagar os papéis automaticamente
      const deleteResult = await client.query(
        "DELETE FROM pessoa WHERE regexp_replace(cpfpessoa, '\\D', '', 'g') = $1 RETURNING cpfpessoa",
        [normalizedCpf]
      );

      if (deleteResult.rowCount > 0) {
        console.log('Pessoa deletada com sucesso. Tinha papéis:', {
          wasCliente: existing.isCliente,
          wasFuncionario: existing.isFuncionario
        });
        return helper.respondNoContent(res);
      }

      console.warn('Pessoa não encontrada no momento do DELETE. CPF normalizado:', normalizedCpf);
      return helper.respondNotFound(res, 'Pessoa não encontrada');
    });

  } catch (error) {
    console.error('Erro ao deletar pessoa:', error && error.stack ? error.stack : error);
    if (error.code === '23503') {
      return helper.respondBadRequest(res, 'Não é possível deletar pessoa com dependências associadas');
    }
    return helper.respondServerError(res, error);
  }
}

// Função adicional para buscar pessoa por email
exports.obterPessoaPorEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return helper.respondBadRequest(res, 'Email é obrigatório');
    }

    const result = await query(
      'SELECT * FROM pessoa WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return helper.respondNotFound(res, 'Pessoa não encontrada');
    }

    return helper.respondJson(res, result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa por email:', error);
    return helper.respondServerError(res, error);
  }
}

// Função para atualizar apenas a senha
exports.atualizarSenha = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { senha_atual, nova_senha } = req.body;

    if (isNaN(id)) {
      return helper.respondBadRequest(res, 'ID deve ser um número válido');
    }

    if (!senha_atual || !nova_senha) {
      return controllerHelper.respondBadRequest(res, 'Senha atual e nova senha são obrigatórias');
    }

    // Verifica se a pessoa existe e a senha atual está correta
    const personResult = await query(
      'SELECT * FROM pessoa WHERE cpfpessoa = $1',
      [id]
    );

    if (personResult.rows.length === 0) {
      return helper.respondNotFound(res, 'Pessoa não encontrada');
    }

    const person = personResult.rows[0];

    // Verificação básica da senha atual (em produção, use hash)
    if (person.senha_pessoa !== senha_atual) {
  return helper.respondBadRequest(res, 'Senha atual incorreta');
    }

    // Atualiza apenas a senha
    const updateResult = await query(
      'UPDATE pessoa SET senha_pessoa = $1 WHERE cpfpessoa = $2 RETURNING cpfpessoa, nomepessoa, email, data_acesso, dataNascimentoPessoa',
      [nova_senha, id]
    );

    return helper.respondJson(res, updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return helper.respondServerError(res, error);
  }
}

function converterDataParaISO(dataString) {
    if (!dataString) return null;
    return new Date(dataString).toISOString().split('T')[0];
}