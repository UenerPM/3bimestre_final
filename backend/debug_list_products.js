const db = require('./database');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const produtos = await db.query(`
      SELECT p.idproduto, p.nomeproduto, p.id_imagem, i.caminho as imagem_caminho
      FROM produto p
      LEFT JOIN imagem i ON p.id_imagem = i.id
      ORDER BY p.idproduto DESC
      LIMIT 50
    `);
    console.log('Produtos (últimos 50):');
    console.table(produtos.rows);

    const imgDir = path.join(__dirname, '../frontend/img/produtos');
    console.log('\nArquivos em frontend/img/produtos:');
    if (fs.existsSync(imgDir)) {
      const files = fs.readdirSync(imgDir);
      console.log(files.join('\n'));
    } else {
      console.log('Diretório não existe:', imgDir);
    }

    process.exit(0);
  } catch (err) {
    console.error('Erro ao consultar DB:', err);
    process.exit(1);
  }
})();