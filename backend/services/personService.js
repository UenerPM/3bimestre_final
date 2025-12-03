const { query, transaction } = require('../database');

/**
 * Serviço pequeno para centralizar operações relacionadas a pessoa.
 * Objetivo: reduzir duplicação entre controllers (pessoa, cliente, funcionario)
 */
async function getPersonByCpf(cpf) {
  if (!cpf) return null;
  const result = await query('SELECT cpfpessoa, nomepessoa, email, senha_pessoa, data_acesso, datanascimentopessoa, numero, cep FROM pessoa WHERE cpfpessoa = $1', [cpf]);
  return result.rows[0] || null;
}

async function exists(cpf) {
  if (!cpf) return false;
  const p = await getPersonByCpf(cpf);
  return !!p;
}

async function list() {
  const result = await query('SELECT cpfpessoa, nomepessoa, email, senha_pessoa, data_acesso, datanascimentopessoa, numero, cep FROM pessoa ORDER BY cpfpessoa');
  return result.rows;
}

// Busca pessoa e seus papéis (cliente, funcionário) — evita N+1 queries
async function getWithRoles(cpf) {
  if (!cpf) return null;

  const pessoaRes = await query(
    `SELECT 
      p.cpfpessoa, p.nomepessoa, p.email, p.senha_pessoa, p.data_acesso,
      p.datanascimentopessoa, p.numero, p.cep,
      CASE WHEN c.pessoacpfpessoa IS NOT NULL THEN true ELSE false END as is_cliente,
      CASE WHEN f.pessoacpfpessoa IS NOT NULL THEN true ELSE false END as is_funcionario,
      -- adiciona campos extras das tabelas relacionadas
      c.rendacliente, c.datadecadastrocliente,
      f.salario, f.cargosidcargo, f.porcentagemcomissao
    FROM pessoa p
    LEFT JOIN cliente c ON c.pessoacpfpessoa = p.cpfpessoa
    LEFT JOIN funcionario f ON f.pessoacpfpessoa = p.cpfpessoa
    WHERE p.cpfpessoa = $1`,
    [cpf]
  );

  if (pessoaRes.rows.length === 0) return null;

  // Normaliza para camelCase em vez de snake_case mantendo compatibilidade
  const pessoa = pessoaRes.rows[0];
  return {
    cpfpessoa: pessoa.cpfpessoa,
    nomepessoa: pessoa.nomepessoa,
    email: pessoa.email,
    senha_pessoa: pessoa.senha_pessoa,
    data_acesso: pessoa.data_acesso,
    datanascimentopessoa: pessoa.datanascimentopessoa,
    numero: pessoa.numero,
    cep: pessoa.cep,
    isCliente: pessoa.is_cliente,
    isFuncionario: pessoa.is_funcionario,
    // Campos extras só incluídos se a pessoa tiver o papel
    ...(pessoa.is_cliente ? {
      rendaCliente: pessoa.rendacliente,
      dataDeCadastroCliente: pessoa.datadecadastrocliente
    } : {}),
    ...(pessoa.is_funcionario ? {
      salario: pessoa.salario,
      cargosIdCargo: pessoa.cargosidcargo,
      porcentagemComissao: pessoa.porcentagemcomissao
    } : {})
  };
}

// Função utilitária para gerenciar papéis da pessoa
async function updateRoles(pessoa, client) {
  if (!pessoa || !pessoa.cpfpessoa) return null;
  const dbClient = client || query; // Usar client de transaction se fornecido

  // Verificar papéis atuais
  const current = await getWithRoles(pessoa.cpfpessoa);

  // Se os papéis mudaram, atualizar...
  const isCliente = !!pessoa.isCliente;
  const isFuncionario = !!pessoa.isFuncionario;

  // Se era cliente e não deve mais ser
  if (current && current.isCliente && !isCliente) {
    await dbClient('DELETE FROM cliente WHERE pessoacpfpessoa = $1', [pessoa.cpfpessoa]);
  }

  // Se era funcionário e não deve mais ser
  if (current && current.isFuncionario && !isFuncionario) {
    await dbClient('DELETE FROM funcionario WHERE pessoacpfpessoa = $1', [pessoa.cpfpessoa]);
  }

  // Se não era cliente e agora deve ser
  if ((!current || !current.isCliente) && isCliente) {
    // Campos opcionais
    const { rendaCliente, dataDeCadastroCliente } = pessoa;
    await dbClient(
      'INSERT INTO cliente (pessoacpfpessoa, rendacliente, datadecadastrocliente) VALUES ($1, $2, $3)',
      [pessoa.cpfpessoa, rendaCliente || null, dataDeCadastroCliente || null]
    );
  }

  // Se não era funcionário e agora deve ser
  if ((!current || !current.isFuncionario) && isFuncionario) {
    if (!pessoa.cargosIdCargo) {
      throw new Error('CargosIdCargo é obrigatório para funcionários');
    }
    // Campos obrigatórios e opcionais
    const { salario, cargosIdCargo, porcentagemComissao } = pessoa;
    await dbClient(
      'INSERT INTO funcionario (pessoacpfpessoa, salario, cargosidcargo, porcentagemcomissao) VALUES ($1, $2, $3, $4)',
      [pessoa.cpfpessoa, salario || null, cargosIdCargo, porcentagemComissao || null]
    );
  }

  // Atualiza dados extras se ainda é cliente ou funcionário
  if (isCliente && current && current.isCliente) {
    const { rendaCliente, dataDeCadastroCliente } = pessoa;
    await dbClient(
      'UPDATE cliente SET rendacliente = $1, datadecadastrocliente = $2 WHERE pessoacpfpessoa = $3',
      [rendaCliente || null, dataDeCadastroCliente || null, pessoa.cpfpessoa]
    );
  }

  if (isFuncionario && current && current.isFuncionario) {
    const { salario, cargosIdCargo, porcentagemComissao } = pessoa;
    if (!cargosIdCargo) {
      throw new Error('CargosIdCargo é obrigatório para funcionários');
    }
    await dbClient(
      'UPDATE funcionario SET salario = $1, cargosidcargo = $2, porcentagemcomissao = $3 WHERE pessoacpfpessoa = $4',
      [salario || null, cargosIdCargo, porcentagemComissao || null, pessoa.cpfpessoa]
    );
  }
}

// Cria pessoa com papéis em uma única transação
async function createWithRoles(pessoa) {
  if (!pessoa) throw new Error('Dados da pessoa não fornecidos');

  return await transaction(async (client) => {
    // Inserir pessoa primeiro
    const { cpfpessoa, nomepessoa, email, senha_pessoa, datanascimentopessoa, numero, cep } = pessoa;
    
    // Validações básicas
    if (!cpfpessoa || !nomepessoa || !email || !senha_pessoa) {
      throw new Error('CPF, nome, email e senha são obrigatórios');
    }

    const dataAcesso = new Date().toISOString();
    const dataNascimentoFormatada = datanascimentopessoa ? new Date(datanascimentopessoa).toISOString().split('T')[0] : null;

    // Inserir pessoa base primeiro
    const pessoaRes = await client.query(
      'INSERT INTO pessoa (cpfpessoa, nomepessoa, email, senha_pessoa, data_acesso, datanascimentopessoa, numero, cep) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [cpfpessoa, nomepessoa, email, senha_pessoa, dataAcesso, dataNascimentoFormatada, numero || null, cep || null]
    );

    // Atualizar papéis usando a mesma transação
    await updateRoles(pessoa, client.query.bind(client));

    // Retornar pessoa completa com papéis
    return await getWithRoles(cpfpessoa);
  });
}

module.exports = {
  getPersonByCpf,
  exists,
  list,
  getWithRoles,
  updateRoles,
  createWithRoles
};
