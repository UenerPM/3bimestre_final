const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

(async () => {
  try {
    console.log("Criando pessoa...");
    let response = await fetch("http://localhost:3001/pessoa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cpfpessoa: "12345678901",
        nomepessoa: "Teste Pessoa",
        email: "teste@exemplo.com",
        senha_pessoa: "senha123",
        datanascimentopessoa: "1990-01-01",
        numero: "123",
        cep: "12345-678",
      }),
    });
    console.log("Resposta:", await response.json());

    console.log("Alterando pessoa...");
    response = await fetch("http://localhost:3001/pessoa/12345678901", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nomepessoa: "Pessoa Alterada",
        email: "alterado@exemplo.com",
        datanascimentopessoa: "1991-02-02",
        numero: "456",
        cep: "98765-432",
      }),
    });
    console.log("Resposta:", await response.json());

    console.log("Deletando pessoa...");
    response = await fetch("http://localhost:3001/pessoa/12345678901", {
      method: "DELETE",
    });
    console.log("Pessoa deletada, status:", response.status);
  } catch (error) {
    console.error("Erro ao testar CRUD:", error);
  }
})();