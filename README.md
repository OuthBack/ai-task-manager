# Sinky: AI Task Manager

Projeto de gerenciador de tarefas inteligente que utiliza IA para auxiliar na organização e priorização de atividades.

## Estrutura do Projeto

- `/backend`: API construída com [NestJS](https://nestjs.com/), utilizando SQLite como banco de dados.
- `/frontend`: Aplicação web construída com [Next.js](https://nextjs.org/) e estilizada com Tailwind CSS.

## Como Rodar o Projeto

Este projeto utiliza Docker e Docker Compose para facilitar o ambiente de desenvolvimento e produção.

### Pré-requisitos
- [Docker](https://www.docker.com/) instalado.
- [Docker Compose](https://docs.docker.com/compose/) instalado.

### Execução

1. Clone o repositório (caso ainda não tenha feito).
2. Copie os .envs dos projetos
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
3. Na raiz do projeto, execute o comando abaixo para iniciar os containers:

   ```bash
   docker-compose up --build
   ```

4. Após a inicialização:
   - **Backend** estará disponível em: `http://localhost:3000`
   - **Frontend** estará disponível em: `http://localhost:3001`

### Comandos Úteis

- Para rodar em segundo plano: `docker-compose up -d`
- Para parar os containers: `docker-compose down`
- Para ver os logs: `docker-compose logs -f`
