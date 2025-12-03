-- Criar tabela imagem
CREATE TABLE imagem (
    id SERIAL PRIMARY KEY,
    caminho VARCHAR(255) NOT NULL UNIQUE -- UNIQUE garante que não teremos caminhos duplicados
);

-- Adicionar coluna id_imagem em produto com FK
ALTER TABLE produto
ADD COLUMN id_imagem INT,
ADD CONSTRAINT fk_produto_imagem 
    FOREIGN KEY (id_imagem) 
    REFERENCES imagem(id)
    ON DELETE SET NULL; -- Permite deletar imagem sem afetar produtos

-- Criar índice para otimizar buscas por caminho
CREATE INDEX idx_imagem_caminho ON imagem(caminho);

-- Comentários nas colunas para documentação
COMMENT ON TABLE imagem IS 'Armazena caminhos de imagens para produtos';
COMMENT ON COLUMN imagem.caminho IS 'Caminho relativo do arquivo de imagem (ex: img/produtos/produto.jpg)';
COMMENT ON COLUMN produto.id_imagem IS 'Referência à imagem associada ao produto';