# Design System - AVAP Frontend

Este documento descreve o design system utilizado no frontend do sistema AVAP.

## Estrutura de Arquivos

- `styles/`
  - `global.css` - Variáveis CSS e estilos base
  - `buttons.css` - Componentes de botões
  - `forms.css` - Estilos de formulários
  - `tables.css` - Estilos de tabelas
  - `messages.css` - Sistema de mensagens/notificações
  - `layout.css` - Estrutura de layout e navegação

## Cores

### Principais
- Primária: `#2d4a2d` (Verde escuro)
- Secundária: `aquamarine`
- Terciária: `#4a7c59` (Verde médio)

### Tons de Verde
- Verde Claro: `#f0fff0`
- Verde Médio: `#6fa06f`
- Verde Escuro: `#2d4a2d`

### Estados
- Sucesso: `#155724`
- Erro: `#721c24`
- Alerta: `#856404`
- Info: `#0c5460`

## Tipografia

- Família principal: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`
- Hierarquia:
  - H1: 1.8rem
  - H2: 1.5rem
  - H3: 1.3rem
  - H4: 1.1rem
- Texto base: 1rem (16px)

## Espaçamento

- XS: 0.5rem (8px)
- SM: 1rem (16px)
- MD: 1.5rem (24px)
- LG: 2rem (32px)

## Border Radius

- SM: 4px
- MD: 6px
- LG: 8px
- XL: 12px

## Componentes

### Botões

Classes disponíveis:
- `.btn` - Classe base
- `.btn-primary` - Ação principal
- `.btn-secondary` - Ação secundária
- `.btn-save` - Salvar/confirmar
- `.btn-danger` - Ações destrutivas
- `.btn-cancel` - Cancelar/voltar
- `.btn-small` - Botão menor
- `.btn-id` - Botão de ID/referência

### Formulários

- `.form-group` - Container de campo
- `.search-container` - Container de busca
- `fieldset` - Agrupamento de campos

### Tabelas

- `.table-container` - Wrapper com scroll
- Cabeçalho fixo com gradient
- Linhas alternadas
- Hover states

### Mensagens

- `.message.success` - Sucesso
- `.message.error` - Erro
- `.message.warning` - Alerta
- `.message.info` - Informação

## Classes Utilitárias

### Margens
- `.m-0`
- `.mt-1` a `.mt-4`
- `.mb-1` a `.mb-4`

### Padding
- `.p-0`
- `.p-1` a `.p-4`

### Texto
- `.text-center`
- `.text-left`
- `.text-right`

### Display
- `.d-flex`
- `.d-block`
- `.d-none`
- `.justify-center`
- `.justify-between`
- `.align-center`

## Responsividade

Breakpoints:
- Mobile: 480px
- Tablet: 768px
- Desktop: > 768px

## Como Usar

1. Inclua os arquivos CSS necessários no seu HTML:

```html
<link rel="stylesheet" href="/frontend/styles/global.css">
<link rel="stylesheet" href="/frontend/styles/buttons.css">
<link rel="stylesheet" href="/frontend/styles/forms.css">
<link rel="stylesheet" href="/frontend/styles/tables.css">
<link rel="stylesheet" href="/frontend/styles/messages.css">
<link rel="stylesheet" href="/frontend/styles/layout.css">
```

2. Use as classes CSS conforme necessário em seus elementos HTML.

3. Para manter consistência, sempre use as variáveis CSS definidas em `global.css` ao criar novos estilos.

## Exemplos de Uso

### Botão Primário
```html
<button class="btn btn-primary">Salvar</button>
```

### Formulário
```html
<div class="form-group">
    <label for="nome">Nome</label>
    <input type="text" id="nome" name="nome">
</div>
```

### Tabela
```html
<div class="table-container">
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Nome</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1</td>
                <td>Exemplo</td>
            </tr>
        </tbody>
    </table>
</div>
```

### Mensagem
```html
<div class="message success">
    Operação realizada com sucesso!
</div>
```