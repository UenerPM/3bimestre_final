// Arquivo legado: página Cliente consolidada no CRUD `pessoa`
document.addEventListener('DOMContentLoaded', () => {
	console.info('cliente.js: CRUD Cliente consolidado em /pessoa/pessoa.html');
	if (window.location.pathname.indexOf('/cliente') !== -1) {
		// redireciona suavemente para o novo CRUD
		setTimeout(() => window.location.href = '/pessoa/pessoa.html', 800);
	}
});

// Nota: toda a lógica de CRUD foi consolidada em `frontend/pessoa/pessoa.js`.