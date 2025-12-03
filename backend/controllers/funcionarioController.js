const { query } = require('../database');
const path = require('path');
const helper = require('../utils/controllerHelper');
const personService = require('../services/personService');

// Controller: Funcionario (versão limpa pronta para substituição)

exports.abrirCrudFuncionario = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/funcionario/funcionario.html'));
};

exports.listarFuncionarios = async (req, res) => {
  try {
    const sql = `SELECT f.PessoaCpfPessoa as pessoacpfpessoa,
      p.nomepessoa as nomepessoa,
      f.salario,
      f.CargosIdCargo as idcargo,
      f.porcentagemComissao as porcentagemcomissao
      FROM funcionario f
      LEFT JOIN pessoa p ON p.cpfpessoa = f.PessoaCpfPessoa
      ORDER BY p.nomepessoa NULLS LAST, f.PessoaCpfPessoa`;
    const result = await query(sql);
    return helper.respondList(res, result.rows);
  } catch (error) {
    console.error('Erro ao listar funcionarios:', error);
    return helper.respondServerError(res, error);
  }
};

exports.criarFuncionario = async (req, res) => {
  try {
    const { PessoaCpfPessoa, salario, CargosIdCargo, porcentagemComissao } = req.body;
    if (!PessoaCpfPessoa) return helper.respondBadRequest(res, 'PessoaCpfPessoa é obrigatório');

    const salarioNum = salario !== undefined && salario !== null && salario !== '' ? Number(salario) : null;
    const porcentagemNum = porcentagemComissao !== undefined && porcentagemComissao !== null && porcentagemComissao !== '' ? Number(porcentagemComissao) : null;
    const cargoNum = CargosIdCargo !== undefined && CargosIdCargo !== null && CargosIdCargo !== '' ? Number(CargosIdCargo) : null;

    if (salarioNum !== null && Number.isNaN(salarioNum)) return helper.respondBadRequest(res, 'Salário inválido');
    if (porcentagemNum !== null && Number.isNaN(porcentagemNum)) return helper.respondBadRequest(res, 'Porcentagem de comissão inválida');
    if (cargoNum !== null && !Number.isInteger(cargoNum)) return helper.respondBadRequest(res, 'ID de cargo inválido');

  const exists = await personService.exists(PessoaCpfPessoa);
  if (!exists) return helper.respondBadRequest(res, 'Pessoa não encontrada. Cadastre a pessoa antes de tornar-se funcionário.');

    if (cargoNum === null) return helper.respondBadRequest(res, 'CargosIdCargo é obrigatório');
    const cargoRes = await query('SELECT idcargo FROM cargo WHERE idcargo = $1', [cargoNum]);
    if (cargoRes.rows.length === 0) return helper.respondBadRequest(res, 'Cargo informado não existe');

    try {
      await query('INSERT INTO funcionario (PessoaCpfPessoa, salario, CargosIdCargo, porcentagemComissao) VALUES ($1, $2, $3, $4)', [PessoaCpfPessoa, salarioNum, cargoNum, porcentagemNum]);
      const created = await query(`SELECT f.PessoaCpfPessoa as pessoacpfpessoa, p.nomepessoa as nomepessoa, f.salario, f.CargosIdCargo as idcargo, f.porcentagemComissao as porcentagemcomissao FROM funcionario f LEFT JOIN pessoa p ON p.cpfpessoa = f.PessoaCpfPessoa WHERE f.PessoaCpfPessoa = $1`, [PessoaCpfPessoa]);
      return helper.respondCreated(res, created.rows[0]);
    } catch (error) {
      if (error && error.code === '23503') return helper.respondBadRequest(res, 'Referência inválida: verifique se Pessoa e Cargo existem');
      console.error('Erro ao criar funcionario:', error);
      return helper.respondServerError(res, error);
    }
  } catch (error) {
    console.error('Erro ao criar funcionario:', error);
    return helper.respondServerError(res, error);
  }
};

exports.obterFuncionario = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return helper.respondBadRequest(res, 'ID é obrigatório');
    const sql = `SELECT f.PessoaCpfPessoa as pessoacpfpessoa, p.nomepessoa as nomepessoa, f.salario, f.CargosIdCargo as idcargo, f.porcentagemComissao as porcentagemcomissao FROM funcionario f LEFT JOIN pessoa p ON p.cpfpessoa = f.PessoaCpfPessoa WHERE f.PessoaCpfPessoa = $1`;
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return helper.respondNotFound(res, 'Funcionario não encontrado');
    return helper.respondJson(res, result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter funcionario:', error);
    return helper.respondServerError(res, error);
  }
};

exports.atualizarFuncionario = async (req, res) => {
  try {
    const id = req.params.id;
    const { salario, CargosIdCargo, porcentagemComissao } = req.body;
    const salarioNum = salario !== undefined && salario !== null && salario !== '' ? Number(salario) : null;
    const porcentagemNum = porcentagemComissao !== undefined && porcentagemComissao !== null && porcentagemComissao !== '' ? Number(porcentagemComissao) : null;
    const cargoNum = CargosIdCargo !== undefined && CargosIdCargo !== null && CargosIdCargo !== '' ? Number(CargosIdCargo) : null;

    if (salarioNum !== null && Number.isNaN(salarioNum)) return helper.respondBadRequest(res, 'Salário inválido');
    if (porcentagemNum !== null && Number.isNaN(porcentagemNum)) return helper.respondBadRequest(res, 'Porcentagem de comissão inválida');
    if (cargoNum !== null && !Number.isInteger(cargoNum)) return helper.respondBadRequest(res, 'ID de cargo inválido');

    const existing = await query('SELECT PessoaCpfPessoa, salario, CargosIdCargo, porcentagemComissao FROM funcionario WHERE PessoaCpfPessoa = $1', [id]);
    if (existing.rows.length === 0) return helper.respondNotFound(res, 'Funcionario não encontrado');
    const current = existing.rows[0];

    if (cargoNum !== null) {
      const cargoRes2 = await query('SELECT idcargo FROM cargo WHERE idcargo = $1', [cargoNum]);
      if (cargoRes2.rows.length === 0) return helper.respondBadRequest(res, 'Cargo informado não existe');
    }

    try {
      const finalSalario = salarioNum !== null ? salarioNum : current.salario;
      const finalCargo = cargoNum !== null ? cargoNum : current.CargosIdCargo || current.idcargo;
      const finalPorcentagem = porcentagemNum !== null ? porcentagemNum : current.porcentagemComissao || current.porcentagemcomissao;

      await query('UPDATE funcionario SET salario = $1, CargosIdCargo = $2, porcentagemComissao = $3 WHERE PessoaCpfPessoa = $4', [finalSalario, finalCargo, finalPorcentagem, id]);
      const updated = await query('SELECT f.PessoaCpfPessoa as pessoacpfpessoa, p.nomepessoa as nomepessoa, f.salario, f.CargosIdCargo as idcargo, f.porcentagemComissao as porcentagemcomissao FROM funcionario f LEFT JOIN pessoa p ON p.cpfpessoa = f.PessoaCpfPessoa WHERE f.PessoaCpfPessoa = $1', [id]);
      return helper.respondJson(res, updated.rows[0]);
    } catch (error) {
      if (error && error.code === '23503') return helper.respondBadRequest(res, 'Referência inválida ao atualizar');
      console.error('Erro ao atualizar funcionario:', error && (error.stack || error.message || error));
      return helper.respondServerError(res, error);
    }
  } catch (error) {
    console.error('Erro ao atualizar funcionario (externo):', error && (error.stack || error.message || error));
    return helper.respondServerError(res, error);
  }
};

exports.deletarFuncionario = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await query('DELETE FROM funcionario WHERE PessoaCpfPessoa = $1', [id]);
    if (result.rowCount === 0) return helper.respondNotFound(res, 'Funcionario não encontrado');
    return helper.respondNoContent(res);
  } catch (error) {
    console.error('Erro ao deletar funcionario:', error);
    return helper.respondServerError(res, error);
  }
};

function converterDataParaISO(dataString) {
  if (!dataString) return null;
  return new Date(dataString).toISOString().split('T')[0];
}