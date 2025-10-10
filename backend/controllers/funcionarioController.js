const { query } = require('../database');
const path = require('path');

exports.abrirCrudFuncionario = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/funcionario/funcionario.html'));
}

exports.listarFuncionarios = async (req, res) => {
  try {
    // Retorna CPF do funcionário e nome da pessoa vinculada, além de outros campos
    const sql = `SELECT f.PessoaCpfPessoa as pessoacpfpessoa, p.nomepessoa as nomepessoa, f.salario, f.CargosIdCargo as idcargo, f.porcentagemComissao as porcentagemcomissao FROM funcionario f LEFT JOIN pessoa p ON p.cpfpessoa = f.PessoaCpfPessoa ORDER BY p.nomepessoa NULLS LAST, f.PessoaCpfPessoa`;
    const result = await query(sql);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar funcionarios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarFuncionario = async (req, res) => {
  try {
    const { PessoaCpfPessoa, salario, CargosIdCargo, porcentagemComissao } = req.body;
    if (!PessoaCpfPessoa) return res.status(400).json({ error: 'PessoaCpfPessoa é obrigatório' });

    // normalizar e validar campos numéricos
    const salarioNum = salario !== undefined && salario !== null && salario !== '' ? Number(salario) : null;
    const porcentagemNum = porcentagemComissao !== undefined && porcentagemComissao !== null && porcentagemComissao !== '' ? Number(porcentagemComissao) : null;
    const cargoNum = CargosIdCargo !== undefined && CargosIdCargo !== null && CargosIdCargo !== '' ? Number(CargosIdCargo) : null;

    if (salarioNum !== null && Number.isNaN(salarioNum)) return res.status(400).json({ error: 'Salário inválido' });
    if (porcentagemNum !== null && Number.isNaN(porcentagemNum)) return res.status(400).json({ error: 'Porcentagem de comissão inválida' });
    if (cargoNum !== null && !Number.isInteger(cargoNum)) return res.status(400).json({ error: 'ID de cargo inválido' });

    // verificar existência da Pessoa
    const pessoaRes = await query('SELECT cpfPessoa FROM pessoa WHERE cpfPessoa = $1', [PessoaCpfPessoa]);
    if (pessoaRes.rows.length === 0) return res.status(400).json({ error: 'Pessoa não encontrada. Cadastre a pessoa antes de tornar-se funcionário.' });

    // verificar existência do cargo, se informado
    if (cargoNum !== null) {
      const cargoRes = await query('SELECT idCargo FROM cargo WHERE idCargo = $1', [cargoNum]);
      if (cargoRes.rows.length === 0) return res.status(400).json({ error: 'Cargo informado não existe' });
    }

    try {
      const result = await query(
        'INSERT INTO funcionario (PessoaCpfPessoa, salario, CargosIdCargo, porcentagemComissao) VALUES ($1, $2, $3, $4) RETURNING PessoaCpfPessoa',
        [PessoaCpfPessoa, salarioNum, cargoNum, porcentagemNum]
      );
      // retornar com nome via join
      const created = await query(`SELECT f.PessoaCpfPessoa as pessoacpfpessoa, p.nomepessoa as nomepessoa, f.salario, f.CargosIdCargo as idcargo, f.porcentagemComissao as porcentagemcomissao FROM funcionario f LEFT JOIN pessoa p ON p.cpfpessoa = f.PessoaCpfPessoa WHERE f.PessoaCpfPessoa = $1`, [PessoaCpfPessoa]);
      res.status(201).json(created.rows[0]);
    } catch (error) {
      // tratar erro de constraint de FK com mensagem amigável
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Referência inválida: verifique se Pessoa e Cargo existem' });
      }
      console.error('Erro ao criar funcionario:', error);
      return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
  } catch (error) {
    console.error('Erro ao criar funcionario:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
}

exports.obterFuncionario = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório' });
    const sql = `SELECT f.PessoaCpfPessoa as pessoacpfpessoa, p.nomepessoa as nomepessoa, f.salario, f.CargosIdCargo as idcargo, f.porcentagemComissao as porcentagemcomissao FROM funcionario f LEFT JOIN pessoa p ON p.cpfpessoa = f.PessoaCpfPessoa WHERE f.PessoaCpfPessoa = $1`;
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Funcionario não encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter funcionario:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarFuncionario = async (req, res) => {
  try {
    const id = req.params.id;
    const { salario, CargosIdCargo, porcentagemComissao } = req.body;

    const salarioNum = salario !== undefined && salario !== null && salario !== '' ? Number(salario) : null;
    const porcentagemNum = porcentagemComissao !== undefined && porcentagemComissao !== null && porcentagemComissao !== '' ? Number(porcentagemComissao) : null;
    const cargoNum = CargosIdCargo !== undefined && CargosIdCargo !== null && CargosIdCargo !== '' ? Number(CargosIdCargo) : null;

    if (salarioNum !== null && Number.isNaN(salarioNum)) return res.status(400).json({ error: 'Salário inválido' });
    if (porcentagemNum !== null && Number.isNaN(porcentagemNum)) return res.status(400).json({ error: 'Porcentagem de comissão inválida' });
    if (cargoNum !== null && !Number.isInteger(cargoNum)) return res.status(400).json({ error: 'ID de cargo inválido' });

    // verificar existência do funcionario
    const existing = await query('SELECT PessoaCpfPessoa FROM funcionario WHERE PessoaCpfPessoa = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Funcionario não encontrado' });

    // verificar cargo existe
    if (cargoNum !== null) {
      const cargoRes = await query('SELECT idCargo FROM cargo WHERE idCargo = $1', [cargoNum]);
      if (cargoRes.rows.length === 0) return res.status(400).json({ error: 'Cargo informado não existe' });
    }

    try {
      await query('UPDATE funcionario SET salario = $1, CargosIdCargo = $2, porcentagemComissao = $3 WHERE PessoaCpfPessoa = $4', [salarioNum, cargoNum, porcentagemNum, id]);
      const updated = await query(`SELECT f.PessoaCpfPessoa as pessoacpfpessoa, p.nomepessoa as nomepessoa, f.salario, f.CargosIdCargo as idcargo, f.porcentagemComissao as porcentagemcomissao FROM funcionario f LEFT JOIN pessoa p ON p.cpfpessoa = f.PessoaCpfPessoa WHERE f.PessoaCpfPessoa = $1`, [id]);
      res.json(updated.rows[0]);
    } catch (error) {
      if (error.code === '23503') return res.status(400).json({ error: 'Referência inválida ao atualizar' });
      console.error('Erro ao atualizar funcionario:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } catch (error) {
    console.error('Erro ao atualizar funcionario:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarFuncionario = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await query('DELETE FROM funcionario WHERE PessoaCpfPessoa = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Funcionario não encontrado' });
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar funcionario:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

function converterDataParaISO(dataString) {
    if (!dataString) return null;
    return new Date(dataString).toISOString().split('T')[0];
}