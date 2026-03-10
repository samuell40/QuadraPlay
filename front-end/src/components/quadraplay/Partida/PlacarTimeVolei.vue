<template>
  <div class="placar" :class="{ 'placar-finalizada': partidaEncerradaGlobal, 'placar-andamento': partidaEmAndamentoGlobal }">
    <h2 class="nome-time">
      <img v-if="timeData?.foto" :src="timeData.foto" alt="Escudo do time" class="foto-time" />
      <span>{{ timeNome }}</span>
    </h2>

    <div class="box">
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
        <div v-if="feedbackLocalTipo === 'pontosSet'" class="acao-feedback-local" role="status" aria-live="polite">
          <span class="acao-feedback-local-spinner" aria-hidden="true"></span>
          <span>{{ feedbackLocalTexto }}</span>
        </div>
      </transition>
      <p>Pontos do Set</p>
      <div class="controls">
        <button @click="emitDelta('pontosSet', -1)" :disabled="!podeDiminuirPontos">-</button>
        <span class="valor">{{ pontosSetAtual }}</span>
        <button @click="emitDelta('pontosSet', 1)" :disabled="!podeAumentarPontos">+</button>
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
  name: 'PlacarTimeVolei',

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

    pontosSetAtual() {
      return Number(this.timeData?.pontosSet ?? 0)
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

    podeDiminuirPontos() {
      return (
        this.podeEditar &&
        !this.partidaEncerradaGlobal &&
        this.pontosSetAtual > 0 &&
        this.woAtual === 0 &&
        this.woAdversario === 0
      )
    },

    podeAumentarPontos() {
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
      if (campo === 'pontosSet') return removendo ? 'Ajustando pontos do set...' : 'Registrando ponto do set...'
      if (campo === 'wo') return removendo ? 'Removendo W.O...' : 'Registrando W.O...'
      return 'Registrando alteração...'
    },

    valorAtualPorCampo(campo) {
      if (campo === 'setsVencidos') return this.setsVencidosAtual
      if (campo === 'pontosSet') return this.pontosSetAtual
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
  padding: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.07);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  position: relative;
}

.placar::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  border-radius: 24px 24px 0 0;
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
  padding: 13px 16px;
  border-radius: 18px;
  border: 1px solid var(--accent-border);
  background: linear-gradient(180deg, var(--accent-soft), rgba(255, 255, 255, 0.98));
  color: #0f172a;
  font-weight: 800;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  text-align: left;
  letter-spacing: -0.03em;
  overflow: hidden;
}

.nome-time span {
  min-width: 0;
}

.foto-time {
  display: block;
  width: 48px;
  min-width: 48px;
  max-width: 48px;
  height: 48px;
  min-height: 48px;
  max-height: 48px;
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
  border-radius: 18px;
  padding: 15px;
}

.placar > .box:first-of-type {
  grid-column: 1 / -1;
  padding: 16px;
  border-color: var(--accent-border);
  background: linear-gradient(180deg, var(--accent-soft), rgba(255, 255, 255, 0.98));
}

.placar > .box > p {
  margin: 0;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.placar > .box:first-of-type > p {
  color: var(--accent);
}

.placar > .box .controls {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 42px;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.placar > .box:first-of-type .controls {
  margin-top: 14px;
}

.placar > .box .controls span {
  display: block;
  color: #0f172a;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.03em;
}

.placar > .box:first-of-type .controls span {
  font-size: 38px;
  color: var(--accent-strong);
}

.placar > .box:not(:first-of-type) .controls span {
  font-size: 24px;
}

.placar > .box .controls button {
  width: 42px;
  height: 42px;
  padding: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--accent-border);
  border-radius: 14px;
  background: #eff6ff;
  color: var(--accent);
  font-size: 23px;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  flex-shrink: 0;
}

.placar > .box .controls button:last-child {
  border-color: transparent;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #fff;
  box-shadow: 0 8px 14px rgba(15, 23, 42, 0.1);
}

.placar > .box .controls button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.placar > .box .controls button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 768px) {
  .placar {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 16px 14px;
    border-radius: 20px;
  }

  .nome-time {
    font-size: 21px;
    padding: 13px;
    gap: 9px;
  }

  .foto-time {
    width: 40px;
    min-width: 40px;
    max-width: 40px;
    height: 40px;
    min-height: 40px;
    max-height: 40px;
  }

  .box {
    border-radius: 17px;
    padding: 13px;
  }

  .placar > .box:first-of-type {
    padding: 15px;
  }

  .placar > .box .controls {
    grid-template-columns: 36px minmax(0, 1fr) 36px;
    gap: 9px;
    margin-top: 12px;
  }

  .placar > .box:first-of-type .controls {
    margin-top: 12px;
  }

  .placar > .box .controls span {
    font-size: 23px;
  }

  .placar > .box:first-of-type .controls span {
    font-size: 30px;
  }

  .placar > .box .controls button {
    width: 36px;
    height: 36px;
    border-radius: 13px;
    font-size: 18px;
  }
}
</style>

