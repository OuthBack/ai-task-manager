# TRD.md — AI Task Manager Frontend

**Última atualização:** 2026-04-21  
**Versão:** 1.0.1

---

## 📋 Visão Geral

Frontend de uma aplicação web responsiva (SPA) para gerenciamento inteligente de tarefas. Consome API REST (NestJS backend na porta 3000) para operações CRUD de tarefas e geração automática via IA Gemini.

**Stack tecnológico:**
- Next.js 14+ com App Router
- TypeScript 5.3+ (tipagem forte obrigatória)
- Jest + React Testing Library (80%+ cobertura)
- CSS vanilla com design system Apple-inspired
- Sem dependências de UI frameworks (componentes próprios)

---

## 🎯 Objetivos de Arquitetura

1. **Separação de responsabilidades clara** — pages, componentes, hooks e serviços não se misturam
2. **Otimismo na UI** — atualizações imediatas ao usuário, revert em caso de erro
3. **Mensagens amigáveis** — erros mapeados para português, não raw API messages
4. **Acessibilidade garantida** — inputs têm labels, botões têm texto, validação visível
5. **Design minimalista** — apenas o essencial, sem decoração, espaço em branco generoso

---

## 🗂 Estrutura de Componentes

### Arquitetura em Camadas

```
Page (app/page.tsx)
  ├── Orquestra hooks e componentes
  ├── Compõe blocos de UI em seções
  └── Nunca contém lógica de dados
      │
      ├── Componentes (components/)
      │   ├── TaskList / TaskItem
      │   ├── TaskForm
      │   ├── AiGenerator
      │   └── ui/ (Button, Input, Spinner, ErrorMessage)
      │   └── Recebem dados via props, emitem eventos via callbacks
      │
      ├── Hooks (hooks/)
      │   ├── useTasks — estado de tarefas + otimismo
      │   └── useAiGenerate — state de geração + mapeamento de erros
      │   └── Chamam serviços, gerenciam estado local
      │
      └── Serviços (services/)
          ├── api.ts — cliente HTTP base com ApiError
          ├── tasks.service.ts — CRUD operations
          └── ai.service.ts — geração de tarefas
          └── Sem estado, retornam promises, puro
```

### Responsabilidades por Arquivo

| Arquivo | Responsabilidade | Proibições |
|---------|-----------------|-----------|
| `app/page.tsx` | Composição, layout, chamada inicial de hooks | Lógica de estado, chamadas de API |
| `components/*` | Renderização, interatividade (click, input) | Chamadas de API, setState direto de props |
| `hooks/*` | Estado, efeitos, chamadas de serviço | Renderização JSX |
| `services/*` | Requisições HTTP, sem estado | Componentes React, efeitos colaterais de UI |
| `types/*` | Tipos TypeScript compartilhados | Implementações |

---

## 🔷 Contrato de Tipos TypeScript

### Tipos Principais

```typescript
export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  isAiGenerated: boolean;
  createdAt: string;     // ISO-8601
  updatedAt: string;     // ISO-8601
}

export interface CreateTaskPayload {
  title: string;  // 1–500 caracteres
}

export interface UpdateTaskPayload {
  title?: string;
  isCompleted?: boolean;
}

export interface GenerateTasksPayload {
  objective: string;     // Descrição do objetivo
  apiKey: string;        // Chave do Gemini (nunca logada)
}

export type TasksState = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
};

export type AiGenerateState = {
  isLoading: boolean;
  error: string | null;
};
```

### ApiError — Tratamento de Erros

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

---

## 🔗 Contrato com Backend

### Base URL
```
http://localhost:3000
Documentação: http://localhost:3000/api/docs
```

### Endpoints Consumidos

#### `GET /tasks` → 200 Task[]
Retorna lista vazia `[]` se sem tarefas.

#### `POST /tasks` → 201 Task
Body: `{ "title": string }`  
Erros esperados: 400 (validação), 500 (servidor).

#### `PATCH /tasks/:id` → 200 Task
Body: `{ "title"?: string, "isCompleted"?: boolean }`  
Erros esperados: 404 (not found), 400 (validação).

#### `DELETE /tasks/:id` → 204
Sem corpo na resposta.  
Erros esperados: 404 (not found).

#### `POST /ai/generate` → 201 Task[]
Body: `{ "objective": string, "apiKey": string }`  
Retorna array de tarefas geradas com `isAiGenerated: true`.

**Mapeamento de Erros de IA (customizado em useAiGenerate):**

| Status | Cenário | Mensagem Amigável |
|--------|---------|-------------------|
| 400 | Campos vazios | "Preencha o objetivo e a API Key antes de gerar." |
| 401 | API Key inválida | "API Key inválida. Verifique sua chave do Gemini e tente novamente." |
| 422 | Sem tarefas geradas | "A IA não conseguiu gerar tarefas. Tente reformular o objetivo." |
| 429 | Rate limit | "Limite de requisições da IA atingido. Aguarde e tente novamente." |
| 503 | Timeout | "O serviço de IA não respondeu a tempo. Verifique sua conexão." |
| 5xx | Erro genérico | "Ocorreu um erro no servidor. Tente novamente." |

---

## 🪝 Hooks — Contrato e Implementação

### `useTasks()`

```typescript
interface UseTasksReturn extends TasksState {
  createTask: (title: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;        // Optimistic update
  deleteTask: (id: string) => Promise<void>;        // Optimistic update
  addTasks: (newTasks: Task[]) => void;            // Usado por AI
  refreshTasks: () => Promise<void>;               // Carrega do zero
}
```

**Otimismo obrigatório:**
- `toggleTask` — toggle `isCompleted` localmente ANTES da resposta. Se erro, reverte.
- `deleteTask` — remove da lista ANTES da resposta. Se erro, reinsere.
- Outro estado mantém-se sincronizado.

**Implementação:**
- useState para `{ tasks, isLoading, error }`
- useCallback para cada operação
- Tratamento de erro genérico com mensagens em português

---

### `useAiGenerate(onSuccess?: (count: number) => void)`

```typescript
interface UseAiGenerateReturn extends AiGenerateState {
  generate: (objective: string, apiKey: string) => Promise<void>;
}
```

**Comportamento:**
- Chama `generateTasks(payload)` do ai.service
- Em sucesso: chama `onSuccess(count)` e limpa estado
- Em erro: mapeia status para mensagem amigável (vide contrato)
- Nunca loga apiKey

**Mapeamento de Erros Implementado:**
```typescript
function getAiErrorMessage(statusCode: number, rawMessage: string): string {
  const map = {
    400: 'Preencha o objetivo e a API Key antes de gerar.',
    401: 'API Key inválida. Verifique sua chave do Gemini e tente novamente.',
    422: rawMessage.includes('vazio') || rawMessage.includes('empty')
      ? 'A IA não conseguiu gerar tarefas. Tente reformular o objetivo.'
      : 'A resposta da IA veio em formato inesperado. Tente novamente.',
    429: 'Limite de requisições da IA atingido. Aguarde e tente novamente.',
    502: 'A IA retornou uma resposta que não pôde ser interpretada. Tente novamente.',
    503: 'O serviço de IA não respondeu a tempo. Verifique sua conexão.',
  };
  return map[statusCode] ?? 'Ocorreu um erro no servidor. Tente novamente.';
}
```

---

## 🖥 Componentes — Especificação

### UI Components (componentes reutilizáveis)

#### Button.tsx
- Props: `children`, `variant` ('primary' | 'secondary'), `isLoading`, `disabled`
- Estilos: Azul Apple (#007AFF), transição 150ms, scale(0.98) on active
- Disabled state: opacity 0.4, cursor not-allowed

#### Input.tsx
- Props: `label`, `error`, HTML input props
- Background: #F5F5F7, border transparent → #007AFF on focus
- Error state: border #FF3B30, mensagem em vermelho
- Transição: 150ms ease

#### Spinner.tsx
- Círculo com border-top animada (spin)
- Cores: border #E8E8ED, top #007AFF
- Usado durante loading

#### ErrorMessage.tsx
- Banner com background #FF3B30/10, texto #FF3B30
- Botão de fechar (✕) opcional, chamando `onDismiss`
- Border #FF3B30/20

---

### Feature Components

#### TaskItem.tsx
- Props: `task: Task`, `onToggle`, `onDelete`
- Exibe: checkbox, título, badge "✨ IA" (se isAiGenerated), botão delete
- Estados visuais:
  - Completa: line-through, opacidade reduzida
  - Em processamento: opacity 0.4, inputs desabilitados
- Optimismo local: desabilita durante operação

#### TaskList.tsx
- Props: `tasks[]`, `isLoading`, `onToggle`, `onDelete`
- Estados:
  - Carregando + lista vazia: exibe Spinner centralizado
  - Lista vazia: "Nenhuma tarefa ainda. Crie uma ou use a IA! 🚀"
  - Com itens: renderiza TaskItem para cada
- Sem divider no último item

#### TaskForm.tsx
- Props: `onSubmit`, `isLoading`
- Input text com placeholder "Ex: Estudar TypeScript"
- Botão desabilitado se: vazio ou enviando
- Comportamento: limpa input após sucesso, exibe erro inline
- Validação: não permite vazio (trimmed)

#### AiGenerator.tsx
- Props: `onGenerate(objective: string, apiKey: string)`, `isLoading`, `error`
- Input text para objetivo com placeholder
- Input password para API Key do Gemini
- Validação: ambos campos obrigatórios para habilitar botão
- Estados:
  - Loading: botão com Spinner + "Gerando tarefas com IA..."
  - Erro: exibe ErrorMessage com mapping amigável
  - Sucesso: limpa ambos campos + toast "Tarefas geradas com sucesso! 🎉"
- Nunca exibe apiKey (field type="password")

---

## 🎨 Design System — Apple-Inspired

### Princípios Visuais

| Princípio | Aplicação |
|-----------|-----------|
| Minimalismo | Apenas o essencial, sem decoração |
| Espaço branco | Padding/margin generosos |
| Tipografia | SF Pro Display, pesos 300/400/500 (nunca 700) |
| Cores | Paleta mínima: preto, cinza, azul Apple |
| Bordas | Muito sutis: 1px solid rgba(0,0,0,0.08) |
| Sombras | Mínimas: 0 1px 4px rgba(0,0,0,0.06) |
| Interação | Hover 150ms, focus ring, active scale(0.98) |

### Paleta de Cores

```css
--bg-primary: #FFFFFF;           /* Superfície principal */
--bg-secondary: #F5F5F7;         /* Fundo da página */
--bg-tertiary: #E8E8ED;          /* Inputs hover */

--text-primary: #1D1D1F;         /* Títulos */
--text-secondary: #6E6E73;       /* Labels, subtítulos */
--text-tertiary: #AEAEB2;        /* Placeholders */

--accent: #007AFF;               /* Azul Apple */
--accent-hover: #0071E3;         /* Mais escuro */
--accent-light: #E8F1FF;         /* Background de badges */

--success: #34C759;              /* Verde */
--error: #FF3B30;                /* Vermelho */
--warning: #FF9500;              /* Laranja */

--border: rgba(0,0,0,0.08);
--border-strong: rgba(0,0,0,0.15);
```

### Tipografia

```css
/* Títulos de seção */
font-size: 17px; font-weight: 500; letter-spacing: -0.2px;

/* Corpo/título de tarefa */
font-size: 15px; font-weight: 400; line-height: 1.5;

/* Label/caption */
font-size: 13px; font-weight: 400; color: var(--text-secondary);

/* Micro/badge */
font-size: 11px; font-weight: 500; letter-spacing: 0.2px;
```

### Layout

- Container: max-width 680px, margin 0 auto
- Padding horizontal: 24px (mobile), 0 (desktop)
- Espaçamento entre seções: 40px
- Espaçamento interno: 20px

### Componentes Visuais

**Card de seção:**
- Background #FFFFFF
- Border 1px solid rgba(0,0,0,0.08)
- Border-radius 16px
- Padding 20px

**Input/Textarea:**
- Background #F5F5F7
- Border transparent, focus: #007AFF
- Border-radius 10px
- Padding 10px 14px

**Botão primário:**
- Background #007AFF
- Hover: #0071E3
- Active: scale(0.98)
- Border-radius 10px
- Disabled: opacity 0.4

---

## 🧪 Estratégia de Testes

### Ferramentas

- **Jest** — test runner
- **@testing-library/react** — renderização de componentes
- **@testing-library/user-event** — simulação de interações
- **@testing-library/jest-dom** — matchers DOM

### Configuração

**jest.config.ts:**
```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default createJestConfig(config);
```

**jest.setup.ts:**
```typescript
import '@testing-library/jest-dom';
```

### Convenções

1. **Um arquivo de teste por módulo** — `NomeModulo.test.ts(x)`
2. **Padrão AAA** — Arrange, Act, Assert
3. **Descrições em português** — `it('deve desabilitar o botão quando...')`
4. **Sem testes de implementação** — testar comportamento visível
5. **Mocks de serviços** — `jest.mock('@/services/...')`
6. **Cobertura mínima** — 80% statements, branches, functions, lines

### O Que Testar

**Services:**
- Chamadas HTTP corretas (URL, método, headers)
- Rejeição com ApiError em resposta não-ok
- Retorno tipado

**Hooks:**
- Estado inicial
- Transições durante loading
- Optimistic updates
- Revert em caso de erro
- Exposição de funções

**Componentes:**
- Renderização correta
- Interações (click, input) disparam callbacks
- Estados visuais (loading, erro, vazio)
- Acessibilidade básica (labels, aria-label)

### Scripts

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

---

## 🔐 Gerenciamento de API Key do Provedor de IA

### Obtenção da API Key

**Gemini (Google AI):**
1. Acesse https://aistudio.google.com/
2. Clique em "Get API Key"
3. Crie um novo projeto ou selecione um existente
4. Copie a chave gerada

### Armazenamento no Frontend

A API Key é **inserida pelo usuário no campo dedicado** do componente `AiGenerator.tsx`:
- **Campo:** Input type="password" para segurança visual
- **Armazenamento:** Em memória apenas durante a sessão (não persiste)
- **Transmissão:** Enviada via HTTPS para o backend no body da requisição
- **Logging:** Nunca é logada ou exibida em console

### Fluxo de Segurança

```
Usuário insere API Key
        ↓
AiGenerator.tsx (input password)
        ↓
useAiGenerate hook recebe via callback
        ↓
ai.service.ts POST /ai/generate com payload
        ↓
Backend valida e usa com Gemini API
        ↓
Resposta retorna (sem expor a chave)
```

### Boas Práticas

✅ **FAÇA:**
- Validar se a chave foi preenchida antes de enviar
- Usar input type="password" para mascarar entrada
- Transmitir apenas via HTTPS
- Nunca armazenar em localStorage/sessionStorage

❌ **NÃO FAÇA:**
- Hardcoder a chave no código
- Logar a chave em console.log()
- Armazenar em cookies ou estado persistido
- Exibir a chave na UI após inserção

---

## ⚙️ Variáveis de Ambiente

### `.env.example`
```env
# URL base da API backend (NestJS roda na porta 3000)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### `.env.local`
Mesmo conteúdo do `.env.example` para desenvolvimento local.

**Nota:** A API Key do Gemini é inserida **em runtime** pelo usuário, não via variáveis de ambiente.

---

## 📦 Dependências Principais

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/react": "^18.2.45",
    "@types/node": "^20.10.5",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1"
  }
}
```

---

## 🚀 Scripts Disponíveis

```bash
npm run dev              # Inicia servidor dev (porta 3001)
npm run build            # Build para produção (standalone)
npm start                # Inicia servidor de produção
npm test                 # Executa testes uma vez
npm run test:watch       # Modo watch dos testes
npm run test:coverage    # Cobertura detalhada
```

---

## 🚨 Regras de Código Obrigatórias

1. ✅ Sem `any` explícito — tipagem forte em tudo
2. ✅ Sem fetch direto em componentes — sempre via services
3. ✅ Sem lógica de estado em pages — delegado a hooks
4. ✅ Sem hardcoding de URLs — usar `NEXT_PUBLIC_API_URL`
5. ✅ Componentes em `.tsx`, hooks/services em `.ts`
6. ✅ Props sempre tipadas com `interface`
7. ✅ Erros sempre capturados e exibidos ao usuário
8. ✅ Commits semânticos: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
9. ✅ Cobertura ≥ 80% antes de merged
10. ✅ Testes passam antes de commit

---

## 📝 Changelog Técnico

### v1.0.1 — 2026-04-21 — Implementação de API Key Management

**Implementado:**

- ✅ Seção de gerenciamento de API Key do Gemini em TRD.md
- ✅ Interface `GenerateTasksPayload` atualizada com campo `apiKey: string`
- ✅ Componente `AiGenerator.tsx` com input password para API Key
- ✅ Validação obrigatória de objetivo + API Key no componente
- ✅ Hook `useAiGenerate` atualizado para receber `apiKey` como parâmetro
- ✅ Mapeamento de erro 401 específico para "API Key inválida"
- ✅ Comunicação backend: payload envia `{ objective, apiKey }`
- ✅ Testes atualizados para AiGenerator (7 testes)
- ✅ Testes atualizados para useAiGenerate (9 testes)
- ✅ Build TypeScript sem erros
- ✅ Cobertura de testes mantida ≥ 80%

**Fluxo de Segurança:**
- API Key inserida em input type="password"
- Transmitida apenas via HTTPS POST para backend
- Armazenada apenas em memória durante sessão
- Nunca logada em console ou armazenada persistentemente

**Mudanças em Arquivos:**
- `src/types/task.types.ts` — Adicionado `apiKey` a `GenerateTasksPayload`
- `src/components/AiGenerator/AiGenerator.tsx` — Adicionado input para API Key
- `src/components/AiGenerator/AiGenerator.test.tsx` — Testes atualizados
- `src/hooks/useAiGenerate.ts` — Atualizado para passar `apiKey` ao serviço
- `src/hooks/useAiGenerate.test.ts` — Testes atualizados com novo parâmetro
- `src/app/page.tsx` — Atualizado handler para passar `apiKey`
- `TRD.md` — Adicionada seção "Gerenciamento de API Key" e especificações

---

### v1.0.0 — 2026-04-20 — Release Inicial

**Implementado:**

- ✅ Estrutura de projeto Next.js 14 com TypeScript
- ✅ Sistema de tipos completo (Task, CreateTaskPayload, etc.)
- ✅ Camada de serviços (api.ts, tasks.service.ts, ai.service.ts)
- ✅ Custom hooks com otimismo (useTasks, useAiGenerate)
- ✅ Componentes UI reutilizáveis (Button, Input, Spinner, ErrorMessage)
- ✅ Componentes de feature (TaskList, TaskItem, TaskForm, AiGenerator)
- ✅ Design system Apple-inspired (globals.css)
- ✅ Page principal composição (app/page.tsx)
- ✅ Testes unitários com 82% cobertura
- ✅ Configuração Jest e Testing Library
- ✅ Dockerfile multi-stage
- ✅ TRD.md completo

**Arquivos principais:**
- `src/types/task.types.ts` — Sistema de tipos
- `src/services/api.ts` — Cliente HTTP base
- `src/services/tasks.service.ts` — CRUD de tarefas
- `src/services/ai.service.ts` — Geração de IA
- `src/hooks/useTasks.ts` — Gerenciamento de estado com otimismo
- `src/hooks/useAiGenerate.ts` — Geração com mapeamento de erros
- `src/components/**` — Componentes UI e feature
- `src/app/page.tsx` — Página principal
- `src/app/globals.css` — Design system
- `jest.config.ts`, `jest.setup.ts` — Configuração de testes
- `Dockerfile` — Container de produção

---

## 🔄 Fluxo de Desenvolvimento

### Ao adicionar uma feature:

1. Atualizar tipos em `types/task.types.ts`
2. Implementar serviço em `services/`
3. Adicionar testes de serviço
4. Implementar hook em `hooks/`
5. Adicionar testes de hook
6. Criar componente em `components/`
7. Adicionar testes de componente
8. Integrar no `app/page.tsx`
9. Atualizar este TRD.md
10. Verificar cobertura ≥ 80%
11. Commit semântico com mensagem descritiva

### Padrão de Commit:

```
feat: implementar X-feature

- Adiciona novo endpoint de Y
- Implementa hook useX com otimismo
- Cria componente X com testes

Arquivos: src/services/x.service.ts, src/hooks/useX.ts, src/components/X/X.tsx
```

---

## 🐳 Deploy

### Build:
```bash
docker build -t ai-task-manager-frontend:latest .
```

### Run:
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://backend:3000 \
  ai-task-manager-frontend:latest
```

### Environment variables em runtime:
- `NEXT_PUBLIC_API_URL` — URL da API (default: http://localhost:3000)
- `PORT` — Porta do servidor (default: 3000)

---

## 📚 Referências

- **Next.js 14+** — https://nextjs.org/docs
- **React 18** — https://react.dev
- **TypeScript** — https://www.typescriptlang.org
- **Jest** — https://jestjs.io
- **Testing Library** — https://testing-library.com
- **Apple Design System** — https://developer.apple.com/design/human-interface-guidelines/

---

**Este TRD.md é a fonte de verdade técnica do projeto. Manter atualizado em cada alteração.**
