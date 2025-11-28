import eventBus from "./EventBus";

/**
 * AudioPlayer - Singleton para gerenciar um único canal de áudio
 * Garante que apenas um áudio toque por vez
 */
class AudioPlayer {
  constructor() {
    this.audioContext = null;
    this.currentSource = null;
    this.currentGainNode = null;
    this.audioCache = new Map();
    this.pendingRequest = null; // Armazena a última requisição pendente
    this.isProcessing = false; // Flag para bloquear múltiplas execuções simultâneas
    this.lastPlayAttempt = null; // Timestamp da última tentativa de tocar
    this.lastPlaySuccess = null; // Timestamp da última reprodução bem-sucedida
    this.playAttempts = 0; // Contador de tentativas de reprodução
  }

  /**
   * Inicializa o AudioContext
   */
  async ensureAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
      } catch (error) {
        console.warn("AudioContext não suportado:", error);
        return false;
      }
    }

    // Resolve o contexto se estiver suspenso
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    return true;
  }

  /**
   * Verifica se o AudioContext está disponível e ativo
   * @returns {boolean} true se o contexto está pronto para tocar
   */
  isContextReady() {
    return (
      this.audioContext !== null &&
      this.audioContext.state !== "closed" &&
      this.audioContext.state !== "suspended"
    );
  }

  /**
   * Verifica se o áudio está tocando atualmente
   * @returns {boolean} true se há um áudio tocando
   */
  isPlaying() {
    return this.currentSource !== null;
  }

  /**
   * Obtém informações sobre o estado do áudio
   * @returns {object} Informações sobre o estado do áudio
   */
  getAudioState() {
    return {
      contextReady: this.isContextReady(),
      isPlaying: this.isPlaying(),
      contextState: this.audioContext?.state || "none",
      lastPlayAttempt: this.lastPlayAttempt,
      lastPlaySuccess: this.lastPlaySuccess,
      playAttempts: this.playAttempts,
      // Nota: Não podemos detectar volume do sistema diretamente
      // Mas podemos inferir problemas se muitas tentativas falharem
      mightBeMuted: this.playAttempts > 0 && this.lastPlaySuccess === null,
    };
  }

  /**
   * Para o áudio atual imediatamente (síncrono)
   * SEMPRE deve ser chamado antes de tocar um novo áudio
   * FORÇA a parada de qualquer coisa que esteja tocando
   */
  stop() {
    const source = this.currentSource;
    const gainNode = this.currentGainNode;
    const wasPlaying = source !== null; // Verifica se havia áudio tocando

    // Limpa referências PRIMEIRO para evitar race conditions
    this.currentSource = null;
    this.currentGainNode = null;

    // Não reseta isProcessing aqui - ele será gerenciado pelo play() ou processPlayRequest()
    // Se há uma requisição pendente, ela será processada
    this.isProcessing = false;

    // Para a source
    if (source) {
      try {
        // Remove listener antes de parar para evitar callbacks
        source.onended = null;
        // Para imediatamente (pode lançar erro se já terminou, mas ignoramos)
        source.stop(0);
      } catch (error) {
        // Ignora erros - áudio já terminou ou não estava tocando
      }
    }

    // Desconecta o gainNode
    if (gainNode) {
      try {
        gainNode.disconnect();
      } catch (error) {
        // Ignora erros
      }
    }

    // Emite evento de áudio interrompido se havia um áudio tocando
    if (wasPlaying) {
      eventBus.emit("AUDIO_INTERRUPTED", {
        timestamp: Date.now(),
        reason: "stopped",
      });
    }
  }

  /**
   * Carrega um áudio (com cache)
   */
  async loadAudio(audioPath) {
    // Verifica cache
    if (this.audioCache.has(audioPath)) {
      return this.audioCache.get(audioPath);
    }

    // Carrega o áudio
    const response = await fetch(audioPath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Salva no cache
    this.audioCache.set(audioPath, audioBuffer);
    return audioBuffer;
  }

  /**
   * Toca um áudio
   * SEMPRE interrompe o áudio anterior antes de tocar um novo (síncrono)
   * Este é o player do Stanley - sempre para tudo antes de tocar
   * Se houver múltiplas chamadas rápidas, processa apenas a última
   */
  play(audioPath, options = {}) {
    // CRÍTICO: Para o áudio atual de forma SÍNCRONA e IMEDIATA
    // Isso garante que não há sobreposição
    console.log("Tocando áudio:");
    this.lastPlayAttempt = Date.now();
    this.playAttempts++;
    this.stop();

    // Armazena esta requisição como a mais recente
    this.pendingRequest = { audioPath, options };

    // Se já está processando, apenas atualiza a requisição pendente
    // A execução atual vai verificar se há uma nova requisição
    if (this.isProcessing) {
      return;
    }

    // Se não está processando, processa imediatamente
    // (pode ter sido resetado pelo stop() acima)
    this.isProcessing = true;
    this.processPlayRequest();
  }

  /**
   * Processa a requisição de tocar áudio
   * Se houver uma nova requisição durante o processamento, cancela e processa a nova
   */
  async processPlayRequest() {
    this.isProcessing = true;
    const request = this.pendingRequest;

    // Se não há requisição, sai
    if (!request) {
      this.isProcessing = false;
      return;
    }

    try {
      // Garante que o contexto está ativo
      const contextReady = await this.ensureAudioContext();
      if (!contextReady || !this.audioContext) {
        console.warn("AudioContext não disponível");
        this.isProcessing = false;
        this.pendingRequest = null;
        return;
      }

      // Verifica se há uma nova requisição (chamada rápida)
      if (this.pendingRequest !== request) {
        // Há uma nova requisição, processa ela ao invés
        this.isProcessing = false;
        this.processPlayRequest();
        return;
      }

      // Verifica novamente se algo está tocando (proteção extra)
      if (this.currentSource) {
        this.stop();
      }

      // Carrega o áudio
      const audioBuffer = await this.loadAudio(request.audioPath);

      // Verifica se há uma nova requisição após o carregamento
      if (this.pendingRequest !== request) {
        this.isProcessing = false;
        this.processPlayRequest();
        return;
      }

      // Verifica mais uma vez antes de criar a source
      if (this.currentSource) {
        this.stop();
      }

      // Cria a source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Configura volume se especificado
      if (request.options.volume !== undefined) {
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = request.options.volume;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        this.currentGainNode = gainNode;
      } else {
        source.connect(this.audioContext.destination);
      }

      // Configurações opcionais
      if (request.options.loop) {
        source.loop = true;
      }

      // Salva referências ANTES de tocar
      this.currentSource = source;
      this.pendingRequest = null; // Limpa requisição pendente

      // Quando terminar, limpa as referências
      source.onended = () => {
        // Só limpa se ainda for a mesma source
        if (this.currentSource === source) {
          this.currentSource = null;
          this.currentGainNode = null;
        }
        // Marca como sucesso se o áudio terminou normalmente
        this.lastPlaySuccess = Date.now();
        // Sempre reseta isProcessing quando o áudio terminar
        this.isProcessing = false;

        // Se há uma requisição pendente, processa ela
        if (this.pendingRequest) {
          this.processPlayRequest();
        }
      };

      // Toca o áudio
      source.start(0);
      // Marca como sucesso imediatamente após iniciar (se chegou até aqui, provavelmente está tocando)
      this.lastPlaySuccess = Date.now();
      // isProcessing será resetado quando o áudio terminar (onended)
    } catch (error) {
      console.error("Erro ao tocar áudio:", error);
      // Limpa em caso de erro
      this.currentSource = null;
      this.currentGainNode = null;
      this.isProcessing = false;

      // Se há uma requisição pendente, processa ela
      if (this.pendingRequest) {
        this.processPlayRequest();
      } else {
        this.pendingRequest = null;
      }
    }
  }
}

// Singleton
const audioPlayer = new AudioPlayer();

export default audioPlayer;
