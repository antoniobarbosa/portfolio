README — Arquitetura do Sistema (Primeira Etapa)

Escopo Desta Etapa

Este documento define apenas a Primeira Etapa do projeto:
	•	O funcionamento inicial do site/jogo.
	•	O comportamento do Clippy.
	•	O sistema de eventos.
	•	O event loop.
	•	O sistema de triggers.
	•	O fluxo das telas iniciais.
	•	A progressão até desbloquear a LABS (sem implementar LABS).

Essas etapas virão depois.

⸻

1. Arquitetura Geral

A aplicação é 100% event-driven. Não há fluxo linear. Tudo depende de:
	1.	EventBus — sistema central de emissão/escolta de eventos.
	2.	GameState — estado global do jogo.
	3.	TriggerEngine — avalia condições e dispara progressão.
	4.	ClippyEngine — controla falas, interrupções e comportamentos.
	5.	Navigation Controller — controla telas e rotas.
	6.	UI Renderer — atualiza a interface conforme eventos.

⸻

🧠 Como tudo funciona agora

1) FRONT = Motor do jogo

	•	roda Clippy

	•	roda triggers

	•	decide navegação

	•	interpreta eventos

	•	mostra telas

	•	reconstrói o mundo a partir dos achievements



Ele não depende do backend para lógica.

Só usa o backend para lembrar coisas.



⸻



2) BACKEND = Memória persistente



Ele armazena só dois blocos de informação:



⸻



📦 A) GameState (snapshot principal)



Salvo e carregado toda vez.



{

  "currentScene": "HELP",

  "gamePlayTime": 684200,

  "startDate": 1719304012213,

  "achievements": [

    "CLIPPY_APPEARED",

    "FIRST_EXIT_ATTEMPT",

    "WAITED_10S"

  ]

}



Esse JSON sozinho define todo o progresso.

O front lê isso e sabe exatamente o que mostrar.



⸻



📜 B) EventLog (opcional, para analytics e comportamento)



[

  { "event": "USER_CLICK", "ts": 1719304010001 },

  { "event": "USER_TRY_EXIT", "ts": 1719304012100 },

  { "event": "NAVIGATE", "payload": "HELP", "ts": 1719304013100 }

]



Usado para:

	•	humor adaptativo do Clippy

	•	velocidade do jogador

	•	detectar loops

	•	analytics futuros



Mas não altera a lógica do jogo — só melhora ela.



⸻



🔄 Fluxo resumido

	1.	Usuário faz algo → front roda toda lógica.

	2.	Front decide se um achievement deve ser pedido.

	3.	Backend salva o estado e devolve achievements atualizados.

	4.	Front re-renderiza tudo baseado nesse JSON.

	5.	Se o usuário fechar o site, backend lembra onde ele parou.



Pronto.

Simples, consistente, escalável.

⸻

2. Fluxo Inicial do Jogo

HOME (site normal)
↓
Primeiro clique → CLIPPY aparece
↓
Clippy reage a navegação e interações
↓
Usuário tenta sair (intencional ou não)
↓

A PRIMEIRA ETAPA termina aqui.

⸻

3. EventBus (Núcleo do Sistema)

Sistema central que gerencia eventos.

Características:
	•	Todos os sistemas escutam o EventBus.
	•	Eventos podem ser cancelados ou alterados.
	•	Suporte a prioridades.
	•	Suporte a interrupções.

Eventos são objetos:

{
  name: string,
  payload?: any,
  timestamp: number
}


⸻

4. GameState (Estado Global)

O estado global guarda tudo o que determina progressão.

Estrutura da Primeira Etapa:

GameState {
  currentScene: "HOME" | "HELP" | "ABOUT" | ...,  
  clippyWaitRequestedAt: null,
  runStartTimestamp: null,
  timeInit: null,
}


⸻

5. TriggerEngine (Sistema de Triggers)

Responsável por:
	•	Escutar eventos.
	•	Avaliar se condições foram atendidas.
	•	Executar ações.
	•	Atualizar GameState.
	•	Disparar novos eventos.

Um trigger possui:

id: string
listenTo: EventName[]
once?: boolean
priority?: number
conditions: (ctx) => boolean
actions: (ctx) => void

Ciclo:

Evento → Triggers compatíveis → Condições → Ações → Novos eventos


⸻

6. ClippyEngine

Clippy é 100% scriptado.
Ele não é procedural.
Ele reage a:
	•	Eventos do usuário.
	•	Tentativas de sair.
	•	Navegação rápida.
	•	Navegação lenta.
	•	Inatividade.
	•	Estados internos.

Funções do Clippy:
	1.	Interromper ações do usuário.
	2.	Desviar navegação.
	3.	Injetar falas.
	4.	Forçar rotas.
	5.	Disparar triggers.
	6.	Responder a condições de tempo.

Clippy usa um grafo de falas, não scripts lineares.

⸻

7. Eventos da Primeira Etapa

Lista dos eventos que precisam existir agora:

Usuário
	•	USER_CLICK
	•	USER_NAVIGATE
	•	USER_TRY_EXIT
	•	USER_RETURNED

Navegação
	•	NAVIGATE
	•	NAVIGATE_OVERRIDE

Clippy
	•	CLIPPY_APPEAR
	•	CLIPPY_INTERRUPT
	•	CLIPPY_TALK

Progresso
	•	TRIGGER_FIRE
	•	LABS_UNLOCKED

⸻

8. Triggers da Primeira Etapa

Abaixo estão os triggers necessários apenas para o ciclo inicial.

8.1. Trigger: Primeiro clique → Clippy aparece

listenTo: ["USER_CLICK"]
once: true
conditions: []
actions:
  - emitir CLIPPY_APPEAR
  - set runStartTimestamp = now

8.2. Trigger: Usuário tenta sair

listenTo: ["USER_TRY_EXIT"]
once: false
conditions:
  - labsUnlocked == false
actions:
  - userTriedExitCount++
  - emitir CLIPPY_INTERRUPT("TRY_EXIT")
  - set clippyWaitRequestedAt = now

8.3. Trigger: Usuário retorna após 10s

listenTo: ["USER_NAVIGATE"]
once: true
conditions:
  - userTriedExitCount > 0
  - now - clippyWaitRequestedAt >= 10000
actions:
  - labsUnlocked = true
  - emitir NAVIGATE_OVERRIDE("LABS")


⸻

9. Navegação da Primeira Etapa

A navegação é controlada via eventos.

Fluxo:

USER_NAVIGATE → eventBus
  ↓
Clippy pode interceptar:
  - bloquear
  - redirecionar
  - liberar
  ↓
NavigationController decide a rota final


⸻

10. Como o jogo progride (Primeira Etapa)

Toda progressão depende de triggers.
	•	Usuário tenta sair → dispara trigger.
	•	Clippy intercepta → muda estado.
	•	Clippy pede 10s → define timestamp.
	•	Usuário volta → detecta condição de 10s.
	•	Trigger dispara → LABS desbloqueada.

Nada disso é procedural.
Nada é linear.
Tudo depende do estado + eventos.

⸻

11. Ordem de Processamento

Quando um evento acontece:
	1.	EventBus publica
	2.	TriggerEngine avalia triggers
	3.	ClippyEngine intercepta (se necessário)
	4.	GameState é atualizado
	5.	NavigationController decide a tela
	6.	UI Renderer atualiza a interface

Essa ordem garante que Clippy sempre pode intervir.

