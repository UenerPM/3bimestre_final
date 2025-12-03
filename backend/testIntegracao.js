const { transaction, query } = require('./database');

async function testarIntegracao() {
    console.log('Iniciando teste de integração...');
    
    try {
        await transaction(async (client) => {
            // 1. Criar pessoa base
            const pessoa = {
                cpfpessoa: '99999999999',
                nomepessoa: 'Teste Integrado',
                email: 'teste@mail.com',
                senha_pessoa: '123456',
                datanascimentopessoa: '2000-01-01',
                numero: '123',
                cep: '12345678'
            };

            console.log('Criando pessoa base...');
            const pessoaRes = await client.query(
                `INSERT INTO pessoa 
                (cpfpessoa, nomepessoa, email, senha_pessoa, datanascimentopessoa, numero, cep, data_acesso)
                VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                RETURNING *`,
                [
                    pessoa.cpfpessoa,
                    pessoa.nomepessoa,
                    pessoa.email,
                    pessoa.senha_pessoa,
                    pessoa.datanascimentopessoa,
                    pessoa.numero,
                    pessoa.cep
                ]
            );

            console.log('Pessoa criada:', pessoaRes.rows[0]);

            // 2. Criar cliente
            console.log('Criando cliente...');
            await client.query(
                `INSERT INTO cliente 
                (pessoacpfpessoa, rendacliente, datadecadastrocliente)
                VALUES ($1, $2, $3)`,
                [pessoa.cpfpessoa, 2500.00, '2025-10-24']
            );

            // 3. Criar funcionário (precisa de cargo)
            console.log('Verificando cargo...');
            const cargoRes = await client.query('SELECT idcargo FROM cargo WHERE idcargo = 1');
            if (cargoRes.rows.length === 0) {
                console.log('Criando cargo padrão...');
                await client.query(
                    'INSERT INTO cargo (idcargo, nomecargo) VALUES (1, $1)',
                    ['Atendente']
                );
            }

            console.log('Criando funcionário...');
            await client.query(
                `INSERT INTO funcionario 
                (pessoacpfpessoa, salario, cargosidcargo, porcentagemcomissao)
                VALUES ($1, $2, $3, $4)`,
                [pessoa.cpfpessoa, 3000.00, 1, 2.5]
            );

            // 4. Verificar se tudo foi criado
            console.log('Verificando criação...');
            
            const result = await client.query(
                `SELECT 
                    p.cpfpessoa, p.nomepessoa, p.email,
                    c.rendacliente, c.datadecadastrocliente,
                    f.salario, f.cargosidcargo, f.porcentagemcomissao
                FROM pessoa p
                LEFT JOIN cliente c ON c.pessoacpfpessoa = p.cpfpessoa
                LEFT JOIN funcionario f ON f.pessoacpfpessoa = p.cpfpessoa
                WHERE p.cpfpessoa = $1`,
                [pessoa.cpfpessoa]
            );

            if (result.rows.length === 0) {
                throw new Error('Pessoa não encontrada após criação!');
            }

            console.log('Pessoa criada com sucesso:', result.rows[0]);
            return result.rows[0];
        });

        console.log('Teste concluído com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('Erro no teste:', error);
        process.exit(1);
    }
}

// Rodar o teste
testarIntegracao();