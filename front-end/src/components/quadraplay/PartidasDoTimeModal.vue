<template>
  <div v-if="modelValue && !mostrarDetalharPartida" class="modal-overlay" @click.self="fechar">
    <div class="modal-content" :class="{ encerrado }">
      <div class="modal-header">
        <h2 class="modal-title">
          Partidas do {{ timeSelecionado?.nome || '-' }}
          <span v-if="campeonatoNome"> ({{ campeonatoNome }})</span>
        </h2>

        <button type="button" class="btn-close" @click="fechar">x</button>
      </div>

      <p v-if="faseNome || rodadaNome" class="contexto-filtro">
        <span v-if="faseNome">Fase {{ faseNome }}</span>

        <span v-if="rodadaNome">
          <span v-if="faseNome"> | </span>
          Rodada {{ rodadaNome }}
        </span>
      </p>

      <div v-if="loading" class="loader-container-centralizado">
        <LoadingState
          size="compact"
          :theme="encerrado ? 'danger' : 'default'"
          title="Carregando partidas do time"
          description="Buscando os confrontos relacionados ao time selecionado nesta navegação."
        />
      </div>

      <div v-else-if="partidasDoTime.length === 0" class="sem-dados">
        Nenhuma partida desse time na fase/rodada selecionada.
      </div>

      <ul v-else class="lista-partidas" :class="{ encerrado }">
        <li v-for="partida in partidasDoTime" :key="partida.id" class="card-partida"
          :class="statusClassCard(partida)" @click="abrirDetalharPartida(partida)">
          <div class="match-ribbon" :class="statusClassRibbon(partida)">
            <span v-if="partida.status === 'EM_ANDAMENTO'" class="status-live-dot" aria-hidden="true"></span>
            {{ statusLabel(partida) }}
          </div>

          <div class="placar-linha">
            <div class="time-lado time-a">
              <img :src="obterFotoTimeCard(partida.timeA?.foto)" class="escudo" alt="Escudo time A" />
              <span class="nome">{{ partida.timeA?.nome }}</span>
            </div>

            <div v-if="partida.status === 'CANCELADA'"
              class="placar-centro placar-centro-agendado">
              <span>x</span>
            </div>

            <div v-else class="placar-centro">
              <strong>{{ partida.pontosTimeA ?? 0 }}</strong>
              <span>x</span>
              <strong>{{ partida.pontosTimeB ?? 0 }}</strong>
            </div>

            <div class="time-lado time-b">
              <img :src="obterFotoTimeCard(partida.timeB?.foto)" class="escudo" alt="Escudo time B" />
              <span class="nome">{{ partida.timeB?.nome }}</span>
            </div>
          </div>

          <div class="match-divider"></div>

          <div class="data-linha" :class="{ 'data-linha-oculta': partida.status === 'EM_ANDAMENTO' }">
            {{ formatarDiaSemanaData(partida?.data || partida?.createdAt) }}
          </div>

          <div class="quadra-linha">
            {{ partida.quadra?.nome}}
          </div>
        </li>
      </ul>
    </div>
  </div>

  <DetalharPartidaModal
    v-model="mostrarDetalharPartida"
    :partida-id="partidaSelecionadaId"
    :partida-status="partidaSelecionadaStatus"
  />
</template>

<script>
import DetalharPartidaModal from '@/components/quadraplay/DetalharPartidaModal.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import { obterRotuloStatusPartida, obterStatusExibicaoPartida } from '@/utils/partidaStatus'
import { ordenarPartidasPorStatusEDataDesc } from '@/utils/partidaOrdenacao'
import { obterFotoTime } from '@/utils/timeImagem'

const STATUS_CONFIG = {
  FINALIZADA: { label: 'ENCERRADA', cls: 'status-finalizada' },
  EM_ANDAMENTO: { label: 'EM ANDAMENTO', cls: 'status-andamento' },
  AGENDADA: { label: 'AGENDADA', cls: 'status-agendada' },
  AGENDADA_HOJE: { label: 'AGENDADA PARA HOJE', cls: 'status-agendada' },
  ADIADA: { label: 'ADIADA', cls: 'status-agendada' },
  CANCELADA: { label: 'CANCELADA', cls: 'status-cancelada' }
}

export default {
  name: 'PartidasDoTimeModal',
  components: {
    DetalharPartidaModal,
    LoadingState
  },
  props: {
    modelValue: { type: Boolean, default: false },
    time: { type: Object, default: null },
    partidas: { type: Array, default: () => [] },
    faseNome: { type: String, default: '' },
    rodadaNome: { type: String, default: '' },
    campeonatoNome: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    encerrado: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      mostrarDetalharPartida: false,
      partidaSelecionadaId: null,
      partidaSelecionadaStatus: ''
    }
  },
  computed: {
    timeSelecionado() {
      if (!this.time) return null
      return {
        id: Number(this.time.id ?? this.time.timeId ?? this.time.time?.id),
        nome: this.time.nome ?? this.time.time?.nome ?? '',
        foto: this.time.foto ?? this.time.time?.foto ?? ''
      }
    },
    partidasDoTime() {
      const timeId = Number(this.timeSelecionado?.id)
      if (!Number.isFinite(timeId) || timeId <= 0) return []

      const listaTime = (Array.isArray(this.partidas) ? this.partidas : [])
        .filter((p) => Number(p?.timeAId) === timeId || Number(p?.timeBId) === timeId)

      return ordenarPartidasPorStatusEDataDesc(listaTime)
    }
  },
  watch: {
    modelValue(value) {
      if (!value) {
        this.mostrarDetalharPartida = false
        this.partidaSelecionadaId = null
        this.partidaSelecionadaStatus = ''
      }
    },
    mostrarDetalharPartida(value) {
      if (value) return
      this.partidaSelecionadaId = null
      this.partidaSelecionadaStatus = ''
    }
  },
  methods: {
    obterFotoTimeCard(foto) {
      return obterFotoTime(foto)
    },
    fechar() {
      this.$emit('update:modelValue', false)
    },
    abrirDetalharPartida(partida) {
      const status = String(partida?.status || '').toUpperCase()
      if (status === 'CANCELADA') return

      const id = Number(partida?.id ?? partida)
      if (!Number.isFinite(id) || id <= 0) return
      this.partidaSelecionadaId = id
      this.partidaSelecionadaStatus = String(partida?.status || '')
      this.mostrarDetalharPartida = true
    },
    statusLabel(partida) {
      return obterRotuloStatusPartida(partida)
    },
    statusClassRibbon(partida) {
      const statusExibicao = obterStatusExibicaoPartida(partida)
      return STATUS_CONFIG[statusExibicao]?.cls || 'status-agendada'
    },
    statusClassCard(partida) {
      const statusExibicao = obterStatusExibicaoPartida(partida)
      if (statusExibicao === 'EM_ANDAMENTO') return 'partida-andamento'
      if (statusExibicao === 'FINALIZADA') return 'partida-finalizada'
      if (statusExibicao === 'CANCELADA') return 'partida-cancelada'
      return 'partida-agendada'
    },
    formatarDiaSemanaData(data) {
      const dt = new Date(data)
      if (Number.isNaN(dt.getTime())) return '-'

      const diaSemana = dt.toLocaleDateString('pt-BR', { weekday: 'long' })
      const dataFormatada = dt.toLocaleDateString('pt-BR')
      const horaFormatada = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      const diaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)

      return `${diaCapitalizado} - ${dataFormatada} às ${horaFormatada}`
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2500;
}

.modal-content {
  width: min(900px, 95vw);
  max-height: 90vh;
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: visible;
  border: 2px solid #3b82f6;
}

.modal-content.encerrado {
  border-color: #dc2626;
}

.modal-content>* {
  min-width: 0;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.modal-title {
  color: #3b82f6;
  font-size: 24px;
}

.modal-content.encerrado .modal-title {
  color: #b91c1c;
}

.btn-close {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid #3b82f6;
  background: #fff;
  color: #3b82f6;
  cursor: pointer;
}

.modal-content.encerrado .btn-close {
  border-color: #fca5a5;
  color: #dc2626;
}

.contexto-filtro {
  color: #64748b;
  margin: 0 0 12px;
}

.modal-content.encerrado .contexto-filtro {
  color: #7f1d1d;
}

.lista-partidas {
  list-style: none;
  margin: 0;
  padding: 10px 10px;
  overflow-y: auto;
  overflow-x: visible;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  align-items: start;
  border: 2px solid #3b82f6;
  border-radius: 12px;
  background: #fff;
}

.lista-partidas.encerrado {
  border-color: #f87171;
  background: linear-gradient(180deg, rgba(254, 242, 242, 0.72), #ffffff 22%);
}

.lista-partidas>.card-partida:only-child {
  grid-column: 1 / -1;
}

.card-partida {
  position: relative;
  border: 2px solid #2563eb;
  border-radius: 12px;
  padding: 10px 12px 8px;
  background: #fff;
  overflow: visible;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.modal-content.encerrado .card-partida {
  border-color: #dc2626;
}

.card-partida:hover {
  transform: translateY(-2px);
}

.card-partida.partida-agendada {
  border-color: #f59e0b;
}

.match-ribbon {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #111827;
  color: #ffffff;
  padding: 3px 14px;
  border-radius: 0 0 14px 14px;
  font-weight: 800;
  font-size: 10px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  z-index: 2;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-live-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #22c55e;
  border: 2px solid #fff;
  display: inline-block;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  animation: statusDotPulse 1s infinite;
}

.match-ribbon.status-andamento {
  background: #16a34a;
}

.match-ribbon.status-finalizada {
  background: #bd1c1c;
}

.match-ribbon.status-cancelada {
  background: #dc2626;
}

.match-ribbon.status-agendada {
  background: #f59e0b;
}

.match-divider {
  height: 1px;
  background-color: #f2f2f2;
  margin: 6px 8px 3px;
}

@keyframes statusDotPulse {
  0% {
    transform: scale(0.9);
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }

  70% {
    transform: scale(1.2);
    opacity: 0.7;
    box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
  }

  100% {
    transform: scale(0.9);
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

.placar-linha {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.time-lado {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.time-a {
  justify-content: flex-start;
}

.time-b {
  justify-content: flex-end;
  text-align: right;
}

.time-b .escudo {
  order: 2;
}

.time-b .nome {
  order: 1;
}

.escudo {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex: 0 0 auto;
}

.nome {
  color: #1f2937;
  font-weight: 800;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.placar-centro {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  min-width: 78px;
}

.placar-centro strong {
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1;
}

.placar-centro span {
  font-size: 14px;
  font-weight: 900;
  color: #334155;
  line-height: 1;
}

.placar-centro-agendado {
  min-width: 78px;
}

.placar-centro-agendado span {
  font-size: 22px;
}

.quadra-linha {
  margin-top: 5px;
  color: #3b82f6;
  font-size: 12px;
  text-align: center;
}

.modal-content.encerrado .quadra-linha {
  color: #b91c1c;
}

.data-linha {
  margin-top: 2px;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  min-height: 18px;
}

.data-linha-oculta {
  visibility: hidden;
}

.btn-fechar {
  margin-top: 14px;
  width: 100%;
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 999px;
  padding: 12px 0;
  background: transparent;
  color: #3b82f6;
  cursor: pointer;
  font-weight: 800;
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.btn-fechar:hover {
  background: rgba(59, 130, 246, 0.06);
  border-color: rgba(59, 130, 246, 0.55);
  transform: translateY(-1px);
}

.loader-container-centralizado,
.sem-dados {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
  color: #64748b;
}

.modal-content.encerrado .sem-dados {
  color: #7f1d1d;
}

.loader {
  width: 34px;
  height: 34px;
  border: 4px solid #dbeafe;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .modal-content {
    width: 100vw;
    max-height: 100dvh;
    border-radius: 0;
    padding: 14px;
  }

  .modal-title {
    font-size: 22px;
  }

  .lista-partidas {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 8px;
  }

  .card-partida {
    padding: 12px 10px 8px;
  }

  .nome {
    font-size: 15px;
    max-width: 140px;
  }

  .placar-centro strong {
    font-size: 18px;
  }

  .placar-centro span {
    font-size: 14px;
  }

  .placar-centro {
    min-width: 74px;
    padding: 4px 8px;
  }

  .escudo {
    width: 22px;
    height: 22px;
  }

  .btn-fechar {
    display: block;
  }
}
</style>
