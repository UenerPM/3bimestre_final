const db = require('../database');
const helper = require('../utils/controllerHelper');

// Função para criar um novo cadastro
exports.criarCadastro = async (req, res) => {
  try {
    console.log('DEBUG /cadastro body:', JSON.stringify(req.body));
    const {
      cpfpessoa,
      nomepessoa,
      datanascimentopessoa,
      numero,
      cep,
      email,
      senha_pessoa
    } = req.body;

    // Validação básica
    if (!cpfpessoa || !nomepessoa || !email || !senha_pessoa) {
      return helper.respondBadRequest(res, 'CPF, Nome, E-mail e Senha são obrigatórios');
    }

    // Validação de comprimento dos campos
    if (cpfpessoa.length > 20) {
      return helper.respondBadRequest(res, 'CPF excede o limite de 20 caracteres');
    }
    // Logradouro removido do cadastro; não validar aqui
    if (cep && cep.length > 9) {
      return helper.respondBadRequest(res, 'CEP excede o limite de 9 caracteres');
    }
    if (email.length > 255) {
      return helper.respondBadRequest(res, 'E-mail excede o limite de 255 caracteres');
    }

    // Monta INSERT dinamicamente: inclui primeiro_acesso_pessoa apenas se existir na tabela
    const colCheck = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='pessoa' AND column_name='primeiro_acesso_pessoa'");
    const hasPrimeiroAcesso = colCheck.rows && colCheck.rows.length > 0;

    let cols = ['cpfpessoa', 'nomepessoa', 'datanascimentopessoa', 'numero', 'cep', 'email', 'senha_pessoa'];
    let values = [cpfpessoa, nomepessoa, datanascimentopessoa, numero, cep, email, senha_pessoa];

    if (hasPrimeiroAcesso) {
      // inserir primeiro_acesso_pessoa = TRUE
      cols = ['cpfpessoa', 'nomepessoa', 'datanascimentopessoa', 'primeiro_acesso_pessoa', 'numero', 'cep', 'email', 'senha_pessoa'];
      values = [cpfpessoa, nomepessoa, datanascimentopessoa, true, numero, cep, email, senha_pessoa];
    }

    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO pessoa (${cols.join(',')}) VALUES (${placeholders}) RETURNING *`;
    const result = await db.query(sql, values);

      return helper.respondCreated(res, { message: 'Cadastro realizado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar cadastro:', error);
    return helper.respondServerError(res, error);
  }
};