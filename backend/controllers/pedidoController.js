// Controller para a tabela pedido
const path = require('path');
const db = require('../database');

exports.listarPedidos = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Pedido');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.criarPedido = async (req, res) => {
  const { dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa } = req.body;
  // Validação básica
  if (!dataDoPedido || !ClientePessoaCpfPessoa || !FuncionarioPessoaCpfPessoa) {
    return res.status(400).json({ error: 'dataDoPedido, ClientePessoaCpfPessoa e FuncionarioPessoaCpfPessoa são obrigatórios' });
  }

  try {
    const result = await db.query(
      'INSERT INTO Pedido (dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa) VALUES ($1, $2, $3) RETURNING *',
      [dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    // Tratar violação de chave estrangeira de forma amigável
    if (error && error.code === '23503') {
      return res.status(400).json({ error: 'Cliente ou Funcionário não encontrado (violação de chave estrangeira)' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.atualizarPedido = async (req, res) => {
  const { id } = req.params;
  const { dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa } = req.body;
  if (!dataDoPedido || !ClientePessoaCpfPessoa || !FuncionarioPessoaCpfPessoa) {
    return res.status(400).json({ error: 'dataDoPedido, ClientePessoaCpfPessoa e FuncionarioPessoaCpfPessoa são obrigatórios' });
  }

  try {
    const result = await db.query(
      'UPDATE Pedido SET dataDoPedido = $1, ClientePessoaCpfPessoa = $2, FuncionarioPessoaCpfPessoa = $3 WHERE idPedido = $4 RETURNING *',
      [dataDoPedido, ClientePessoaCpfPessoa, FuncionarioPessoaCpfPessoa, id]
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    if (error && error.code === '23503') {
      return res.status(400).json({ error: 'Cliente ou Funcionário não encontrado (violação de chave estrangeira)' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.deletarPedido = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM Pedido WHERE idPedido = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.abrirCrudPedido = (req, res) => {
  const caminhoArquivo = path.join(__dirname, '../../frontend/pedido/pedido.html');
  res.sendFile(caminhoArquivo);
};