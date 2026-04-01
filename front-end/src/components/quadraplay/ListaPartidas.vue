<template>
  <div v-if="loading" class="loader-container-centralizado">
    <LoadingState
      size="compact"
      :title="loadingTitle"
      :description="loadingDescription"
    />
  </div>

  <div
    v-else-if="!partidas.length"
    class="sem-dados-centralizado"
    :class="{ 'sem-dados-alinhado': emptyAlign === 'left', 'sem-dados-card': emptyCard }"
  >
    <div :class="{ 'sem-dados-card-box': emptyCard }">
      <p class="empty-title">{{ emptyTitle }}</p>
      <p v-if="emptySubtitle" class="empty-subtitle">{{ emptySubtitle }}</p>
    </div>
  </div>

  <ul v-else class="lista-partidas" :class="{ 'com-scroll': enableScroll || partidas.length > 5 }">
    <li v-for="partida in partidas" :key="partida.id" class="card-partida" :class="statusClass(partida, 'card')"
      @click="abrirModalPartida(partida)">
      <div class="match-ribbon" :class="statusClass(partida, 'text')">
        <span v-if="partida.status === 'EM_ANDAMENTO'" class="status-live-dot"></span>
        {{ statusLabel(partida) }}
      </div>

      <div class="conteudo-card-interno">
        <div class="conteudo-partida">
          <div class="time lado">
            <img v-if="partida.timeA?.foto" :src="partida.timeA.foto" alt="Escudo Time A" />
            <button
              type="button"
              class="nome-time nome-time-btn"
              :class="{ 'nome-time-sigla': usarSiglaTimes }"
              @click.stop="abrirModalPartidasTime(partida.timeA)"
            >
              {{ rotuloTime(partida.timeA) }}
            </button>
          </div>

          <div v-if="partida.status === 'CANCELADA'" class="placar-centro-agendado">
            <span class="divisor-x">x</span>
          </div>

          <div v-else class="placar-centro">
            <span class="gols-placar">{{ partida.pontosTimeA ?? 0 }}</span>
            <span class="divisor-x">x</span>
            <span class="gols-placar">{{ partida.pontosTimeB ?? 0 }}</span>
          </div>

          <div class="time lado">
            <img v-if="partida.timeB?.foto" :src="partida.timeB.foto" alt="Escudo Time B" />
            <button
              type="button"
              class="nome-time nome-time-btn"
              :class="{ 'nome-time-sigla': usarSiglaTimes }"
              @click.stop="abrirModalPartidasTime(partida.timeB)"
            >
              {{ rotuloTime(partida.timeB) }}
            </button>
          </div>
        </div>

        <div class="match-divider"></div>

        <div v-if="partida.status !== 'EM_ANDAMENTO'" class="data-partida">
          {{ formatarDiaSemanaData(partida?.data || partida?.createdAt) }}
        </div>

        <div class="nome-quadra" :class="quadraClass">
          <span class="dot-quadra"></span> {{ partida.quadra?.nome }}
        </div>
      </div>
    </li>
  </ul>

  <DetalharPartidaModal
    v-model="mostrarModalPartida"
    :partida-id="partidaSelecionadaId"
    :partida-status="partidaSelecionadaStatus"
  />
</template>

<script>
import DetalharPartidaModal from '@/components/quadraplay/DetalharPartidaModal.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import { obterRotuloStatusPartida, obterStatusExibicaoPartida } from '@/utils/partidaStatus'

const STATUS_CONFIG = {
  FINALIZADA: { label: 'ENCERRADA', card: 'partida-finalizada', text: 'status-finalizada' },
  EM_ANDAMENTO: { label: 'EM ANDAMENTO', card: 'partida-andamento', text: 'status-andamento' },
  AGENDADA: { label: 'AGENDADA', card: 'partida-agendada', text: 'status-agendada' },
  AGENDADA_HOJE: { label: 'AGENDADA PARA HOJE', card: 'partida-agendada', text: 'status-agendada' },
  ADIADA: { label: 'ADIADA', card: 'partida-agendada', text: 'status-agendada' },
  CANCELADA: { label: 'CANCELADA', card: 'partida-cancelada', text: 'status-cancelada' }
}

export default {
  name: 'ListaPartidas',
  components: {
    DetalharPartidaModal,
    LoadingState
  },
  props: {
    partidas: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    loadingTitle: { type: String, default: 'Carregando partidas' },
    loadingDescription: { type: String, default: 'Buscando confrontos, horários e status da rodada selecionada.' },
    emptyTitle: { type: String, default: 'Nenhuma partida cadastrada ainda' },
    emptySubtitle: { type: String, default: '' },
    enableScroll: { type: Boolean, default: false },
    quadraClass: { type: String, default: '' },
    emptyAlign: { type: String, default: 'center' },
    emptyCard: { type: Boolean, default: false },
    usarSiglaTimes: { type: Boolean, default: false },
    tamanhoSiglaTime: { type: Number, default: 3 }
  },
  emits: ['time-click'],
  data() {
    return {
      mostrarModalPartida: false,
      partidaSelecionadaId: null,
      partidaSelecionadaStatus: ''
    }
  },
  watch: {
    mostrarModalPartida(value) {
      if (value) return
      this.partidaSelecionadaId = null
      this.partidaSelecionadaStatus = ''
    }
  },
  methods: {
    abrirModalPartidasTime(time) {
      const id = Number(time?.id ?? time?.timeId ?? time?.time?.id)
      if (!Number.isFinite(id) || id <= 0) return

      this.$emit('time-click', {
        id,
        nome: time?.nome ?? time?.time?.nome ?? '',
        foto: time?.foto ?? time?.time?.foto ?? ''
      })
    },
    rotuloTime(time) {
      const nome = String(time?.nome ?? time?.time?.nome ?? '').trim()
      if (!this.usarSiglaTimes) return nome

      const tamanho = Math.max(1, Number(this.tamanhoSiglaTime) || 3)
      const sigla = nome
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, tamanho)

      return sigla || nome.slice(0, tamanho).toUpperCase()
    },
    abrirModalPartida(partida) {
      const status = String(partida?.status || '').toUpperCase()
      if (status === 'CANCELADA') return

      const id = Number(partida?.id ?? partida)
      if (!Number.isFinite(id) || id <= 0) return
      this.partidaSelecionadaId = id
      this.partidaSelecionadaStatus = String(partida?.status || '')
      this.mostrarModalPartida = true
    },
    statusClass(partida, tipo) {
      const statusExibicao = obterStatusExibicaoPartida(partida)
      return STATUS_CONFIG[statusExibicao]?.[tipo] || ''
    },
    statusLabel(partida) {
      return obterRotuloStatusPartida(partida)
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
.lista-partidas {
  list-style: none;
  padding: 0;
  margin: 0;
}

.lista-partidas li {
  list-style: none;
  display: block;
}

.lista-partidas li::marker {
  content: '';
}

.lista-partidas.com-scroll {
  max-height: 650px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
}

.lista-partidas.com-scroll::-webkit-scrollbar {
  width: 8px;
}

.lista-partidas.com-scroll::-webkit-scrollbar-thumb {
  background: #3b82f6;
  border-radius: 10px;
}

.lista-partidas.com-scroll::-webkit-scrollbar-thumb:hover {
  background: #3b82f6;
}

.card-partida {
  position: relative;
  background-color: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 20px;
  width: 100%;
  max-width: 450px;
  box-sizing: border-box;
  margin: 25px auto 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.card-partida:hover {
  transform: translateY(-2px);
}

.match-ribbon {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #111827;
  color: #ffffff;
  padding: 4px 25px;
  border-radius: 8px 8px 20px 20px;
  font-weight: 800;
  font-size: 11px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  z-index: 2;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.status-live-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #16a34a;
  border: 2px solid #fff;
  display: inline-block;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  animation: statusDotPulse 1s infinite;
}

.card-partida.partida-andamento {
  border-color: #16a34a;
}

.match-ribbon.status-andamento {
  background: #22c55e;
}

.card-partida.partida-finalizada {
  border-color: #e11d48;
}

.card-partida.partida-finalizada .conteudo-card-interno {
  padding: 2px 12px 6px;
}

.match-ribbon.status-finalizada {
  background: #bd1c1c;
}

.card-partida.partida-cancelada {
  border-color: #dc2626;
}

.match-ribbon.status-cancelada {
  background: #dc2626;
}

.card-partida.partida-agendada {
  border-color: #f59e0b;
}

.match-ribbon.status-agendada {
  background: #f59e0b;
}

.conteudo-card-interno {
  padding: 5px 15px 10px;
}

.conteudo-partida {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 0;
}

.time.lado {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  text-align: left;
  min-width: 0;
  overflow: hidden;
}

.time.lado img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex: 0 0 auto;
  margin-top: 10%;
}

.nome-time {
  font-size: 14px;
  font-weight: 600;
  color: #777;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 10%;
}

.nome-time-btn {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  text-align: left;
  display: inline-block;
  max-width: 100%;
}

.nome-time-sigla {
  width: 3ch;
  min-width: 3ch;
  max-width: 3ch;
  overflow: visible;
  text-overflow: clip;
  text-align: center;
  flex: 0 0 3ch;
}

.nome-time-btn:hover {
  color: #2563eb;
}

.placar-centro {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 40px;
  font-weight: 900;
  color: #777;
  line-height: 1;
  margin-top: 10px;
}

.placar-centro-agendado {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  margin-top: 14px;
}

.placar-centro-agendado .divisor-x {
  font-size: 28px;
  font-weight: 700;
}

.gols-placar {
  font-size: 30px;
  font-weight: bold;
  color: #000;
  padding: 2px 8px;
  border-radius: 12px;
}

.divisor-x {
  color: #777;
  font-size: 18px;
  font-weight: 400;
}

.match-divider {
  height: 1px;
  background-color: #f2f2f2;
  margin-bottom: 3%;
}

.data-partida {
  text-align: center;
  font-weight: 700;
  font-size: 13px;
  color: #334155;
  margin: -4px 0 8px;
}

.nome-quadra {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5c93e6;
  font-weight: 600;
  font-size: 13px;
  margin-top: -10px;
}

.loader-container-centralizado,
.sem-dados-centralizado {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  font-size: 16px;
  color: #555;
  text-align: center;
}

.sem-dados-centralizado.sem-dados-alinhado {
  justify-content: flex-start;
  align-items: flex-start;
  min-height: 0;
  padding: 24px 0;
  text-align: left;
}

.sem-dados-centralizado.sem-dados-card {
  min-height: 0;
  padding: 16px 0 0;
}

.sem-dados-card-box {
  width: 100%;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 46px 20px;
  text-align: center;
}

.empty-title {
  margin: 0;
  font-weight: 700;
}

.sem-dados-card-box .empty-title {
  color: #6b7280;
  font-weight: 500;
}

.empty-subtitle {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.loader {
  border: 6px solid #f3f3f3;
  border-top: 6px solid #3b82f6;
  border-radius: 50%;
  width: 90px;
  height: 90px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
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

@media (max-width: 768px) {
  .lista-partidas.com-scroll {
    padding-right: 0;
  }

  .card-partida {
    margin: 18px auto 12px;
    max-width: 100%;
  }

  .match-ribbon {
    font-size: 10px;
    padding: 4px 12px;
  }

  .conteudo-partida {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 10px;
  }

  .time.lado {
    justify-content: flex-start;
  }

  .conteudo-partida .time.lado:last-child {
    justify-content: flex-end;
    text-align: right;
  }

  .conteudo-partida .time.lado:last-child .nome-time-btn {
    text-align: right;
  }

  .placar-centro {
    margin-top: 10px;
    min-width: 58px;
    justify-content: center;
  }

  .placar-centro-agendado {
    margin-top: 10px;
    min-width: 58px;
    justify-content: center;
  }

  .gols-placar {
    font-size: 24px;
    padding: 0 4px;
  }

  .nome-time {
    font-size: 12px;
    max-width: 100%;
    margin-top: 0;
  }

  .time.lado img {
    margin-top: 0;
    width: 24px;
    height: 24px;
  }

  .data-partida {
    margin-top: 4px;
    font-size: 12px;
  }
}
</style>
