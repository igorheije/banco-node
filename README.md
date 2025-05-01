# Banco Node - API REST com NestJS

Este é um projeto de API REST desenvolvido com NestJS, utilizando PostgreSQL como banco de dados e Prisma como ORM.

## 🚀 Começando

### Pré-requisitos

- Node.js (versão 16 ou superior)
- Docker e Docker Compose
- pnpm (gerenciador de pacotes)

### Instalação

1. Clone o repositório:

```bash
git clone [https://github.com/igorheije/banco-node]
cd banco-node
```

2. Instale as dependências:

```bash
pnpm install
```

## 🐳 Configuração do Docker

O projeto utiliza Docker para rodar o banco de dados PostgreSQL. Para iniciar o container:

```bash
docker-compose up -d
```

Este comando irá:

- Criar um container PostgreSQL
- Configurar o banco de dados com as seguintes credenciais:
  - Usuário: usuario
  - Senha: senha
  - Banco de dados: meubanco
  - Porta: 5432

Para parar o container:

```bash
docker-compose down
```

## 🔧 Configuração do Banco de Dados

Após iniciar o container Docker, execute as migrações do Prisma:

```bash
pnpm prisma migrate dev
```

## 🛠️ Funcionalidades

- Autenticação JWT
- CRUD de usuários
- Validação de dados
- Documentação Swagger
- Testes automatizados

## 🏃‍♂️ Executando o Projeto

### Desenvolvimento

```bash
# Modo desenvolvimento
pnpm run start:dev
```

### Produção

```bash
# Build
pnpm run build

# Iniciar em produção
pnpm run start:prod
```

## 📚 Documentação

A documentação da API está disponível em:

```
http://localhost:3000/api
```

## 🧪 Testes

O projeto utiliza Jest para testes. Os seguintes comandos estão disponíveis:

```bash
# Executar todos os testes
pnpm run test

# Executar testes em modo watch
pnpm run test:watch

# Executar testes com cobertura
pnpm run test:cov

# Executar testes end-to-end
pnpm run test:e2e
```

## 🛠️ Tecnologias Utilizadas

- NestJS
- PostgreSQL
- Prisma
- JWT
- Docker
- Jest
- Swagger

## 📝 Licença

Este projeto está sob a licença MIT.
