# AI Task Manager — Frontend

Um gerenciador de tarefas inteligente construído com **Next.js 14**, **TypeScript** e **React**, com suporte a geração automática de tarefas via IA Gemini.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm

### Setup

```bash
# Instalar dependências
npm install

# Criar arquivo .env.local (já existe .env.example)
cp .env.example .env.local

# Iniciar servidor dev (porta 3001)
npm run dev
```

Acesse: **http://localhost:3001**

## 📋 Arquitetura

- **Next.js 14 App Router** — SSR + SPA hybrid
- **TypeScript** — Tipagem forte em 100% do código
- **React Hooks** — Estado e lógica customizados
- **Services** — Camada de API isolada
- **Componentes UI** — Design system Apple-inspired
- **Jest + Testing Library** — 86%+ cobertura de testes

### Estrutura

```
src/
├── app/                       # Páginas e layout
├── components/                # Componentes React
│   ├── TaskList/             # Feature: listagem
│   ├── TaskForm/             # Feature: criar tarefa
│   ├── AiGenerator/          # Feature: gerar com IA
│   └── ui/                   # Componentes reutilizáveis
├── hooks/                    # Custom hooks com estado
├── services/                 # Requisições HTTP
└── types/                    # Tipos TypeScript
```

## 📚 Documentação

Para informações técnicas completas, consulte **[TRD.md](./TRD.md)**:
- Arquitetura e decisões de design
- Contrato com backend (NestJS)
- Especificação de componentes
- Estratégia de testes
- Design system (Apple-inspired)

## 🧪 Testes

```bash
# Executar testes uma vez
npm test

# Modo watch
npm run test:watch

# Coverage report
npm run test:coverage
```

**Cobertura:** 86.4% (mínimo: 80%)

## 🎨 Design System

Paleta Apple-inspired com cores minimalistas:
- Primária: Azul #007AFF
- Background: Branco #FFFFFF
- Texto: Preto #1D1D1F
- Sucesso: Verde #34C759
- Erro: Vermelho #FF3B30

## 🔗 Integração com Backend

API base: `http://localhost:3000` (configurável em `.env.local`)

**Endpoints consumidos:**
- `GET /tasks` — Listar tarefas
- `POST /tasks` — Criar tarefa
- `PATCH /tasks/:id` — Atualizar tarefa
- `DELETE /tasks/:id` — Deletar tarefa
- `POST /ai/generate` — Gerar tarefas via IA

## 📦 Build para Produção

```bash
# Build
npm run build

# Iniciar servidor (standalone)
npm start

# Docker
docker build -t ai-task-manager-frontend .
docker run -p 3000:3000 ai-task-manager-frontend
```

## ✅ Checklist de Implementação

- ✅ Tipagem TypeScript forte (sem `any`)
- ✅ Separação clara de camadas (page → component → hook → service)
- ✅ Otimismo em UI (toggleTask, deleteTask)
- ✅ Mensagens de erro amigáveis (mapeadas por status)
- ✅ Acessibilidade (labels, aria-label)
- ✅ Design minimalista Apple-inspired
- ✅ Testes unitários com 86%+ cobertura
- ✅ Commits semânticos
- ✅ TRD.md documentação completa
- ✅ Dockerfile de produção

## 📝 Licença

Privado — AI Task Manager Project

---

**Desenvolvido por:** GitHub Copilot  
**Última atualização:** 2026-04-21
