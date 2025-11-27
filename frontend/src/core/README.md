# Core System

Sistema central de eventos, triggers e ações para o portfolio.

## EventBus

Sistema de eventos centralizado que gerencia emissão e escuta de eventos.

### Uso básico:

```javascript
import { eventBus } from './core';

// Emitir evento
eventBus.emit('USER_CLICK', { x: 100, y: 200 });

// Escutar evento
eventBus.on('USER_CLICK', (event) => {
  console.log('Clique detectado:', event.payload);
});

// Remover listener
eventBus.off('USER_CLICK', callback);
```

### Middlewares

Middlewares são executados antes dos listeners e podem interceptar/modificar eventos:

```javascript
eventBus.use((event, next) => {
  // Faz algo com o evento
  console.log('Evento interceptado:', event.name);
  
  // Pode cancelar o evento
  // event.cancelled = true;
  
  // Continua o fluxo
  next();
});
```

## TriggerEngine

Sistema de triggers que escuta eventos, avalia condições e executa ações.

### Estrutura de um Trigger

```javascript
{
  id: string,              // ID único do trigger
  listenTo: string[],      // Array de eventos que o trigger escuta
  once: boolean,           // Se deve executar apenas uma vez
  priority: number,       // Prioridade (maior = executa primeiro)
  conditions: (ctx) => boolean,  // Função que avalia condições
  actions: (ctx) => void   // Função que executa ações
}
```

### Contexto (ctx)

O contexto passado para conditions e actions contém:

```javascript
{
  event: {                 // Objeto do evento
    name: string,
    payload: any,
    timestamp: number
  },
  gameState: Object,       // Estado atual do jogo
  timestamp: number        // Timestamp do processamento
}
```

### Registrando Triggers

```javascript
import { triggerEngine } from './core';

triggerEngine.register({
  id: 'my_trigger',
  listenTo: ['USER_CLICK'],
  once: false,
  priority: 10,
  conditions: (ctx) => {
    // Avalia condições baseadas no evento e estado
    return ctx.gameState?.someCondition === true;
  },
  actions: (ctx) => {
    // Executa ações
    // - Tocar áudio
    // - Emitir eventos
    // - Atualizar estado
    // - etc.
  }
});
```

## Stanley

Sistema de triggers para reações a eventos. Usa TriggerEngine para gerenciar quando e como reagir.

### Inicialização

```javascript
import { stanley } from './core';

// Inicializa com o estado do jogo
stanley.init(gameState);

// Atualiza estado quando mudar
stanley.updateGameState(newGameState);
```

### Triggers do Stanley

Os triggers do Stanley ficam em `core/stanley/triggers.js`. Cada trigger define:

- **Quando** reagir (eventos que escuta)
- **Condições** para reagir
- **Ações** a executar (tocar áudio, emitir eventos, atualizar estado)

### Exemplo de Trigger do Stanley

```javascript
triggerEngine.register({
  id: 'stanley_first_click',
  listenTo: ['USER_CLICK'],
  once: true,
  priority: 20,
  conditions: (ctx) => {
    // Só executa se for o primeiro clique
    return !ctx.gameState?.firstClickHappened;
  },
  actions: (ctx) => {
    // Toca áudio
    audioPlayer.play('/audio/stanleys_parable/first_click.wav', {
      volume: 0.9,
    });
    
    // Atualiza estado
    ctx.gameState.firstClickHappened = true;
    
    // Emite evento
    eventBus.emit('CLIPPY_APPEAR');
  },
});
```

## AudioPlayer

Singleton para gerenciar um único canal de áudio. Sempre interrompe o áudio anterior antes de tocar um novo.

### Uso

```javascript
import { audioPlayer } from './core';

// Toca um áudio (sempre interrompe o anterior)
audioPlayer.play('/audio/stanleys_parable/sound.wav', {
  volume: 0.7,
  loop: false
});

// Para o áudio atual
audioPlayer.stop();
```

## Eventos Padrão

- `USER_CLICK` - Usuário clicou
- `USER_NAVIGATE` - Usuário navegou
- `USER_TRY_EXIT` - Usuário tentou sair
- `CLIPPY_APPEAR` - Clippy apareceu
- `CLIPPY_INTERRUPT` - Clippy interrompeu
- `NAVIGATE` - Navegação ocorreu
- `NAVIGATE_OVERRIDE` - Navegação foi sobrescrita

