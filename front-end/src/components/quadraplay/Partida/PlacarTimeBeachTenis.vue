<template>
  <div class="placar" :class="{ 'placar-finalizada': partidaEncerradaGlobal, 'placar-andamento': partidaEmAndamentoGlobal }">
    <h2 class="nome-time">
      <img v-if="timeData?.foto" :src="timeData.foto" alt="Escudo do time" class="foto-time" />
      <span>{{ timeNome }}</span>
    </h2>
    <div class="box destaque-box">
      <transition name="feedback-local-fade">
        <div v-if="feedbackLocalTipo === 'setsVencidos'" class="acao-feedback-local" role="status" aria-live="polite">
          <span class="acao-feedback-local-spinner" aria-hidden="true"></span>
          <span>{{ feedbackLocalTexto }}</span>
        </div>
      </transition>
      <p>Sets Vencidos</p>
      <div class="controls">
        <button @click="emitDelta('setsVencidos', -1)" :disabled="!podeDiminuirSets">-</button>
        <span class="valor">{{ setsVencidosAtual }}</span>
        <button @click="emitDelta('setsVencidos', 1)" :disabled="!podeAumentarSets">+</button>
      </div>
    </div>
    <div class="box">
      <transition name="feedback-local-fade">
        <div v-if="feedbackLocalTipo === 'gamesSet'" class="acao-feedback-local" role="status" aria-live="polite">
          <span class="acao-feedback-local-spinner" aria-hidden="true"></span>
          <span>{{ feedbackLocalTexto }}</span>
        </div>
      </transition>
      <p>Games do Set</p>
      <div class="controls">
        <button @click="emitDelta('gamesSet', -1)" :disabled="!podeDiminuirGames">-</button>
        <span class="valor">{{ gamesSetAtual }}</span>
        <button @click="emitDelta('gamesSet', 1)" :disabled="!podeAumentarGames">+</button>
      </div>
    </div>
    <div class="box">
      <transition name="feedback-local-fade">
        <div v-if="feedbackLocalTipo === 'pontosTieBreak'" class="acao-feedback-local" role="status" aria-live="polite">
          <span class="acao-feedback-local-spinner" aria-hidden="true"></span>
          <span>{{ feedbackLocalTexto }}</span>
        </div>
      </transition>
      <p>Pontos do Tie-break</p>
      <div class="controls">
        <button @click="emitDelta('pontosTieBreak', -1)" :disabled="!podeDiminuirTieBreak">-</button>
        <span class="valor">{{ pontosTieBreakAtual }}</span>
        <button @click="emitDelta('pontosTieBreak', 1)" :disabled="!podeAumentarTieBreak">+</button>
      </div>
    </div>
    <div class="box">
      <transition name="feedback-local-fade">
        <div v-if="feedbackLocalTipo === 'wo'" class="acao-feedback-local" role="status" aria-live="polite">
          <span class="acao-feedback-local-spinner" aria-hidden="true"></span>
          <span>{{ feedbackLocalTexto }}</span>
        </div>
      </transition>
      <p>W.O</p>
      <div class="controls">
        <button @click="emitDelta('wo', -1)" :disabled="!podeDiminuirWo">-</button>
        <span class="valor">{{ woAtual }}</span>
        <button @click="emitDelta('wo', 1)" :disabled="!podeAumentarWo">+</button>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'PlacarTimeBeachTenis',

  emits: ['parcial-delta'],
  props: {
    timeNome: { type: String, default: 'Time' },
    timeData: { type: Object, required: true },
    partidaId: { type: [String, Number], required: true },
    lado: { type: String, required: true },
    podeEditar: { type: Boolean, default: true },
    placarId: { type: [String, Number], default: null },
    setsAdversario: { type: Number, default: 0 },
    woAdversario: { type: Number, default: 0 },
    partidaEncerradaGlobal: { type: Boolean, default: false },
    partidaStatus: { type: String, default: '' },
    maxSetsPartida: { type: Number, default: 5 },
    maxPontosSet: { type: Number, default: 25 }
  },

  data() {
    return {
      feedbackLocalTipo: '',
      feedbackLocalTexto: '',
      feedbackCampoPendente: '',
      feedbackValorBase: null
    }
  },

  computed: {
    setsVencidosAtual() {
      return Number(this.timeData?.setsVencidos ?? 0)
    },
    pontosTieBreakAtual() {
      return Number(this.timeData?.pontosTieBreak ?? 0)
    },
    gamesSetAtual() {
      return Number(this.timeData?.gamesSet ?? 0)
    },
    woAtual() {
      return this.timeData?.wo ? 1 : 0
    },
    partidaEmAndamentoGlobal() {
      return this.partidaStatus === 'EM_ANDAMENTO'
    },
    podeDiminuirSets() {
      return (
        this.podeEditar &&
        !this.partidaEncerradaGlobal &&
        this.setsVencidosAtual > 0 &&
        this.woAtual === 0 &&
        this.woAdversario === 0
      )
    },
    podeAumentarSets() {
      return (
        this.podeEditar &&
        !this.partidaEncerradaGlobal &&
        this.woAtual === 0 &&
        this.woAdversario === 0 &&
        (this.setsVencidosAtual + this.setsAdversario) < this.maxSetsPartida
      )
    },
    podeDiminuirGames() {
      return (
        this.podeEditar &&
        !this.partidaEncerradaGlobal &&
        this.gamesSetAtual > 0 &&
        this.woAtual === 0 &&
        this.woAdversario === 0
      )
    },
    podeAumentarGames() {
      return (
        this.podeEditar &&
        !this.partidaEncerradaGlobal &&
        this.woAtual === 0 &&
        this.woAdversario === 0
      )
    },
    podeDiminuirTieBreak() {
      return (
        this.podeEditar &&
        !this.partidaEncerradaGlobal &&
        this.pontosTieBreakAtual > 0 &&
        this.woAtual === 0 &&
        this.woAdversario === 0
      )
    },
    podeAumentarTieBreak() {
      return (
        this.podeEditar &&
        !this.partidaEncerradaGlobal &&
        this.woAtual === 0 &&
        this.woAdversario === 0
      )
    },
    podeAumentarWo() {
      return (
        this.podeEditar &&
        !this.partidaEncerradaGlobal &&
        this.woAtual === 0 &&
        this.woAdversario === 0
      )
    },
    podeDiminuirWo() {
      return (
        this.podeEditar &&
        !this.partidaEncerradaGlobal &&
        this.woAtual === 1 &&
        this.woAdversario === 0
      )
    }
  },

  watch: {
    timeData: {
      handler() {
        this.verificarConclusaoFeedback()
      },
      deep: true
    }
  },

  methods: {
    mensagemParcial(campo, delta) {
      const removendo = Number(delta) < 0

      if (campo === 'setsVencidos') return removendo ? 'Ajustando sets vencidos...' : 'Registrando set vencido...'
      if (campo === 'gamesSet') return removendo ? 'Ajustando games do set...' : 'Registrando game do set...'
      if (campo === 'pontosTieBreak') return removendo ? 'Ajustando tie-break...' : 'Registrando ponto no tie-break...'
      if (campo === 'wo') return removendo ? 'Removendo W.O...' : 'Registrando W.O...'
      return 'Registrando alteração...'
    },

    valorAtualPorCampo(campo) {
      if (campo === 'setsVencidos') return this.setsVencidosAtual
      if (campo === 'gamesSet') return this.gamesSetAtual
      if (campo === 'pontosTieBreak') return this.pontosTieBreakAtual
      if (campo === 'wo') return this.woAtual
      return null
    },

    iniciarFeedbackLocal(campo, mensagem = 'Registrando alteração...') {
      this.feedbackCampoPendente = campo
      this.feedbackValorBase = this.valorAtualPorCampo(campo)
      this.feedbackLocalTipo = campo
      this.feedbackLocalTexto = mensagem
    },

    verificarConclusaoFeedback() {
      if (!this.feedbackCampoPendente) return
      const atual = this.valorAtualPorCampo(this.feedbackCampoPendente)
      if (atual !== this.feedbackValorBase) {
        this.limparFeedbackLocal()
      }
    },

    limparFeedbackLocal() {
      this.feedbackLocalTipo = ''
      this.feedbackLocalTexto = ''
      this.feedbackCampoPendente = ''
      this.feedbackValorBase = null
    },

    emitDelta(campo, delta) {
      if (!this.podeEditar || this.partidaEncerradaGlobal) return
      this.iniciarFeedbackLocal(campo, this.mensagemParcial(campo, delta))
      this.$emit('parcial-delta', { lado: this.lado, campo, delta })
    }
  },

  beforeUnmount() {
    this.limparFeedbackLocal()
  }
}
</script>
<style scoped>
.placar {
  --accent: #2563eb;
  --accent-strong: #1d4ed8;
  --accent-soft: rgba(37, 99, 235, 0.1);
  --accent-border: rgba(59, 130, 246, 0.22);
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 19px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 23px;
  box-shadow: 0 13px 24px rgba(15, 23, 42, 0.065);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  position: relative;
}
.placar::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  border-radius: 23px 23px 0 0;
  background: linear-gradient(90deg, var(--accent), var(--accent-strong));
}
.placar.placar-andamento {
  --accent: #16a34a;
  --accent-strong: #15803d;
  --accent-soft: rgba(34, 197, 94, 0.1);
  --accent-border: rgba(34, 197, 94, 0.22);
}
.placar.placar-finalizada {
  --accent: #dc2626;
  --accent-strong: #b91c1c;
  --accent-soft: rgba(220, 38, 38, 0.1);
  --accent-border: rgba(220, 38, 38, 0.22);
}
.nome-time {
  margin: 0;
  grid-column: 1 / -1;
  padding: 12px 15px;
  border-radius: 17px;
  border: 1px solid var(--accent-border);
  background: linear-gradient(180deg, var(--accent-soft), rgba(255, 255, 255, 0.98));
  color: #0f172a;
  font-weight: 800;
  font-size: 23px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 9px;
  text-align: left;
  letter-spacing: -0.03em;
  overflow: hidden;
}
.nome-time span {
  min-width: 0;
}
.foto-time {
  display: block;
  width: 46px;
  min-width: 46px;
  max-width: 46px;
  height: 46px;
  min-height: 46px;
  max-height: 46px;
  object-fit: contain;
  border-radius: 50%;
  background-color: #f1f5f9;
  border: 1px solid rgba(148, 163, 184, 0.24);
  flex: 0 0 auto;
}

.acao-feedback-local {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid var(--accent-border);
  background: rgba(255, 255, 255, 0.9);
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.acao-feedback-local-spinner {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: 2px solid rgba(59, 130, 246, 0.22);
  border-top-color: var(--accent);
  animation: acaoFeedbackSpin 0.75s linear infinite;
  flex: 0 0 12px;
}

@keyframes acaoFeedbackSpin {
  to {
    transform: rotate(360deg);
  }
}

.feedback-local-fade-enter-active,
.feedback-local-fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.feedback-local-fade-enter-from,
.feedback-local-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.box {
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 17px;
  padding: 13px;
}
.destaque-box {
  grid-column: 1 / -1;
  padding: 15px;
  border-color: var(--accent-border);
  background: linear-gradient(180deg, var(--accent-soft), rgba(255, 255, 255, 0.98));
}
.box > p {
  margin: 0;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}
.destaque-box > p {
  color: var(--accent);
}
.controls {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 40px;
  align-items: center;
  gap: 9px;
  margin-top: 12px;
}
.destaque-box .controls {
  margin-top: 12px;
}
.valor {
  display: block;
  color: #0f172a;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.03em;
}
.destaque-box .valor {
  font-size: 36px;
  color: var(--accent-strong);
}
.box:not(.destaque-box) .valor {
  font-size: 23px;
}
.controls button {
  width: 40px;
  height: 40px;
  padding: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--accent-border);
  border-radius: 13px;
  background: #eff6ff;
  color: var(--accent);
  font-size: 21px;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  flex-shrink: 0;
}
.controls button:last-child {
  border-color: transparent;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #fff;
  box-shadow: 0 7px 13px rgba(15, 23, 42, 0.09);
}
.controls button:hover:not(:disabled) {
  transform: translateY(-1px);
}
.controls button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}
@media (max-width: 768px) {
  .placar {
    grid-template-columns: 1fr;
    gap: 9px;
    padding: 14px 12px;
    border-radius: 18px;
  }
  .nome-time {
    font-size: 18px;
    padding: 10px 12px;
    gap: 9px;
  }
  .foto-time {
    width: 36px;
    min-width: 36px;
    max-width: 36px;
    height: 36px;
    min-height: 36px;
    max-height: 36px;
  }
  .box {
    border-radius: 14px;
    padding: 10px;
  }
  .destaque-box {
    padding: 13px;
  }
  .controls {
    grid-template-columns: 32px minmax(0, 1fr) 32px;
    gap: 9px;
    margin-top: 9px;
  }
  .destaque-box .controls {
    margin-top: 12px;
  }
  .box:not(.destaque-box) .valor {
    font-size: 21px;
  }
  .destaque-box .valor {
    font-size: 27px;
  }
  .controls button {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    font-size: 16px;
  }
}
</style>


