# Diretrizes de Desenvolvimento e Regras para IA

Este documento estabelece os padrões de código, arquitetura e organização para o projeto "Musical MIDI App". O objetivo é manter a base de código limpa, modular e fácil de manter, evitando a dívida técnica comum em projetos gerados por IA.

## 1. Arquitetura e Estrutura de Pastas

O projeto utiliza **React + Vite**. A arquitetura deve separar a lógica de música (Core) da camada de visualização (React Components).

### Estrutura Sugerida:
```
/
├── public/             # Assets estáticos
├── src/
│   ├── components/     # Componentes React Reutilizáveis (UI)
│   │   ├── ui/         # Componentes genéricos (Botões, Cards - shadcn/ui style)
│   │   └── musical/    # Componentes de domínio (Piano, ChordDisplay)
│   ├── core/           # Lógica pura de música e teoria (sem dependências de React)
│   │   ├── chord-detection.js
│   │   └── music-theory.js
│   ├── hooks/          # Custom React Hooks para conectar Core <-> UI
│   │   ├── useMidi.js
│   │   └── useAudioEngine.js
│   ├── services/       # Serviços de infraestrutura (Singletons)
│   │   ├── midi-service.js
│   │   └── audio-engine.js
│   ├── App.jsx         # Layout Principal
│   └── main.jsx        # Entry Point
└── index.html
```

## 2. Princípios de Código (SOLID & Clean Code)

*   **React & Hooks:** Use Functional Components e Hooks. Evite Class Components.
*   **Separação de Conceitos:**
    *   `src/core`: Lógica pura (JS/TS). Não deve importar React.
    *   `src/services`: APIs do navegador (MIDI, Audio).
    *   `src/hooks`: A "cola" que conecta os serviços aos componentes.
*   **Responsabilidade Única (SRP):** Um componente deve apenas exibir dados. A lógica de *como* obter esses dados deve estar em um Hook ou Service.

## 3. Padrões de JavaScript e React

*   **Estilização:** Use **Tailwind CSS**. Evite CSS puro ou arquivos .css separados, a menos que estritamente necessário.
*   **Estado:** Use `useState` para estados locais simples e Context API (ou Zustand se crescer) para estado global (como conexão MIDI).
*   **Imutabilidade:** Nunca mute estados diretamente.

## 4. Documentação e Comentários

*   **JSDoc:** Todas as funções principais devem ter comentários JSDoc explicando parâmetros e retorno.
*   **Porquê, não O quê:** Comente *por que* uma decisão complexa foi tomada, não o que o código faz (o código deve ser legível por si só).

## 5. Tratamento de MIDI e Áudio

*   **Abstração:** A API Web MIDI e Web Audio API são complexas. Crie "Wrappers" ou "Services" que simplifiquem o uso para o resto do app.
*   **Performance:** Evite operações pesadas (DOM manipulation, logs excessivos) dentro dos loops de processamento de áudio ou handlers de eventos MIDI de alta frequência.

## 6. Fluxo de Trabalho para a IA

1.  **Analisar antes de codar:** Antes de gerar código, descreva o plano e quais arquivos serão afetados.
2.  **Ler o contexto:** Sempre verifique os arquivos existentes relacionados antes de criar novos ou sobrescrever.
3.  **Manter a consistência:** Siga o estilo de nomenclatura existente (camelCase para funções/variáveis, PascalCase para Classes).

---
*Este arquivo deve ser consultado antes de qualquer alteração significativa no código.*
