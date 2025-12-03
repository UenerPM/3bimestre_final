const express = require('express');
const app = express();
const path = require('path');

const cookieParser = require('cookie-parser');

// Importar a configuração do banco PostgreSQL
const db = require('./database'); // Ajuste o caminho conforme necessário

// Configurações do servidor - quando em produção, você deve substituir o IP e a porta pelo do seu servidor remoto
//const HOST = '192.168.1.100'; // Substitua pelo IP do seu servidor remoto
const HOST = 'localhost'; // Para desenvolvimento local
const PORT_FIXA = 3001; // Porta fixa

// serve a pasta frontend como arquivos estáticos

// serve a pasta frontend como arquivos estáticos

const caminhoFrontend = path.join(__dirname, '../frontend');
console.log('Caminho frontend:', caminhoFrontend);

app.use(express.static(caminhoFrontend));



app.use(cookieParser());

// Middleware para permitir CORS (Cross-Origin Resource Sharing)
// Isso é útil se você estiver fazendo requisições de um frontend que está rodando em um domínio diferente
// ou porta do backend.
// Em produção, você deve restringir isso para domínios específicos por segurança.
// Aqui, estamos permitindo qualquer origem, o que é útil para desenvolvimento, mas deve ser ajustado em produção.
app.use((req, res, next) => {
  const allowedOrigins = ['http://127.0.0.1:5500','http://localhost:5500', 'http://127.0.0.1:5501', 'http://localhost:3000', 'http://localhost:3001'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200); // <-- responde ao preflight
  }

  next();
});

// Middleware para adicionar a instância do banco de dados às requisições
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Middlewares
app.use(express.json());

// Middleware de tratamento de erros JSON malformado
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON malformado',
      message: 'Verifique a sintaxe do JSON enviado'
    });
  }
  next(err);
});

// só mexa nessa parte
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Importando as rotas
const loginRoutes = require('./routes/loginRoutes');
app.use('/login', loginRoutes);

const menuRoutes = require('./routes/menuRoutes');
app.use('/menu', menuRoutes);

const pessoaRoutes = require('./routes/pessoaRoutes');
app.use('/pessoa', pessoaRoutes);

const cargoRoutes = require('./routes/cargoRoutes');
app.use('/cargo', cargoRoutes);

const produtoRoutes = require('./routes/produtoRoutes');
app.use('/produto', produtoRoutes);

const cadastroRoutes = require('./routes/cadastroRoutes');
app.use('/cadastro', cadastroRoutes);

const pedidoRoutes = require('./routes/pedidoRoutes');
app.use('/pedido', pedidoRoutes);

const pedidoHasProdutoRoutes = require('./routes/pedidoHasProdutoRoutes');
app.use('/pedidoHasProduto', pedidoHasProdutoRoutes);
const funcionarioRoutes = require('./routes/funcionarioRoutes');
app.use('/funcionario', funcionarioRoutes);
// rotas adicionadas: cliente e formaPagamento
const clienteRoutes = require('./routes/clienteRoutes');
app.use('/cliente', clienteRoutes);
const formaPagamentoRoutes = require('./routes/formaPagamentoRoutes');
app.use('/formaPagamento', formaPagamentoRoutes);

const imagemRoutes = require('./routes/imagemRoutes');
app.use('/imagem', imagemRoutes);
// rotas de pagamento
try {
  const pagamentoRoutes = require('./routes/pagamentoRoutes');
  app.use('/pagamento', pagamentoRoutes);
} catch (e) {
  console.warn('Pagamento routes não registradas:', e.message || e);
}
// rotas de relatórios
try {
  const relatoriosRoutes = require('./routes/relatoriosRoutes');
  app.use('/api/relatorios', relatoriosRoutes);
} catch (e) {
  console.warn('Relatórios routes não registradas:', e.message || e);
}
// rota administrativa para aplicar migrações (dev only)
try {
  const adminRoutes = require('./routes/adminRoutes');
  // exponha apenas em development para evitar riscos em produção
  if ((process.env.NODE_ENV || 'development') === 'development') {
    app.use('/admin', adminRoutes);
  }
} catch (e) {
  console.warn('Admin routes não registradas:', e.message || e);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Rota padrão
// Rota raiz: redireciona para a página de login do frontend
app.get('/', (req, res) => {
  // usar redirect para garantir que navegadores caiam na tela de login
  res.redirect('/login/login.html');
});

// Adiciona rota específica para servir a página de cadastro
app.get('/cadastro/cadastro.html', (req, res) => {
  res.sendFile(path.join(caminhoFrontend, 'cadastro', 'cadastro.html'));
});

// Rota para testar a conexão com o banco
app.get('/health', async (req, res) => {
  try {
    const connectionTest = await db.testConnection();

    if (connectionTest) {
      res.status(200).json({
        status: 'OK',
        message: 'Servidor e banco de dados funcionando',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'ERROR',
        message: 'Problema na conexão com o banco de dados',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro interno do servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware global de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);

  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rotas não encontradas (404)
app.all('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe`,
    timestamp: new Date().toISOString()
  });
});



// Ajustando o servidor para sempre usar a porta 3001
const PORT = 3001;

const startServer = async () => {
  try {
    console.log('Iniciando verificação do banco de dados...');
    console.log(caminhoFrontend);
    console.log('Testando conexão com PostgreSQL...');
    const connectionTest = await db.testConnection();

    if (!connectionTest) {
      console.error('❌ Falha na conexão com PostgreSQL');
      process.exit(1);
    }

    console.log('✅ PostgreSQL conectado com sucesso');

    try {
      const sql = `
        SELECT setval(
          pg_get_serial_sequence('cargo','idcargo'),
          COALESCE((SELECT MAX(idcargo) FROM cargo), 0) + 1,
          false
        );
      `;
      await db.query(sql);
      console.log('Sequência cargo.idcargo realinhada com sucesso');
    } catch (err) {
      console.error('Erro ao resetar sequência cargo.idcargo:', err.message || err);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
      console.log(`📊 Health check disponível em http://${HOST}:${PORT}/health`);
      console.log(`🗄️ Banco de dados: PostgreSQL`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log('Servidor inicializado com sucesso. Aguardando conexões...');
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`A porta ${PORT} já está em uso. Não foi possível iniciar o servidor.`);
        process.exit(1);
      } else {
        throw err;
      }
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Tratamento de sinais para encerramento graceful
process.on('SIGINT', async () => {
  console.log('\n🔄 Encerrando servidor...');

  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 SIGTERM recebido, encerrando servidor...');

  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

// Iniciar o servidor
startServer();