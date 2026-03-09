<template>
  <div class="layout">
    <NavBarQuadras />
    <SidebarCampeonato @sidebar-toggle="sidebarCollapsed = $event" />

    <div class="conteudo" :class="{ collapsed: sidebarCollapsed, 'campeonato-finalizado': isCampeonatoEncerrado }">
      <div class="header">
        <div class="header-copy">
          <div class="header-top">
            <h1 class="title">Gerenciar Partidas</h1>

            <button
              v-if="!isCampeonatoEncerrado"
              class="btn-add-partida-topo btn-add-aartida-header"
              @click="abrirModalTipo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                class="bi bi-plus-circle-fill btn-add-partida-icon" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z" />
              </svg>
              <span class="btn-add-partida-desktop">Adicionar</span>
              <span class="btn-add-partida-mobile">Adicionar</span>
            </button>
          </div>

          <a class="page-subtitle">
            Selecione a fase e a rodada para criar partidas, atualizar status e acessar o placar.
          </a>
        </div>
      </div>

      <div v-if="isLoading" class="loader-container-centralizado">
        <LoadingState
          :theme="isCampeonatoEncerrado ? 'danger' : 'default'"
          title="Carregando campeonato"
          description="Buscando fases, rodadas e partidas para gerenciamento."
        />
        <span class="loader-copy">Carregando informações do campeonato.</span>
      </div>

      <template v-else>
        <div class="painel-card filtros-wrapper">
          <div class="section-head filtros-head">
            <div>
              <span class="section-kicker">Navegacao</span>
              <h2>Fase e rodada</h2>
              <a>Atualize os filtros para visualizar, criar e gerenciar as partidas da rodada ativa.</a>
            </div>
          </div>

          <div class="filtros-topo">
            <div class="filtro-item">
              <label for="fase-select" class="filtro-titulo">Fase</label>
              <select id="fase-select" v-model="faseSelecionada" @change="onFaseChange">
                <option disabled value="">Selecione a Fase</option>
                <option v-for="fase in fases" :key="fase.id" :value="fase.id">
                  {{ fase.nome }}
                </option>
              </select>
            </div>

            <div class="filtro-item">
              <label for="rodada-select" class="filtro-titulo">Rodada</label>
              <select id="rodada-select" v-model="rodadaSelecionada" @change="onRodadaChange">
                <option disabled value="">Selecione a Rodada</option>
                <option v-for="rodada in rodadas" :key="rodada.id" :value="rodada.id">
                  {{ rodada.nome }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="painel-card partidas-wrapper">
          <div class="section-head">
            <div>
              <span class="section-kicker">Partidas</span>
              <h2>Partidas cadastradas</h2>
              <a>Edite status, acompanhe o placar e acesse cada partida conforme a rodada selecionada.</a>
            </div>
          </div>

            <div v-if="isLoading || isLoadingPartidas" class="partidas-loading">
              <LoadingState
                size="compact"
                :theme="isCampeonatoEncerrado ? 'danger' : 'default'"
                title="Carregando partidas"
                description="Buscando confrontos, status e placares da rodada selecionada."
              />
            </div>

            <ul v-else-if="partidasValidas.length" class="lista-partidas">
            <li v-for="partida in partidasValidas" :key="partida.id" class="card-partida"
              :class="classeStatusPartida(partida)">
              <div
                class="status-topo"
                :class="{ 'status-topo-clickable': podeAlterarStatus(partida) }"
                @click="editarStatus(partida)"
              >
                <div class="status-pill"
                  :class="[classeStatusTexto(partida), { 'status-editavel': podeAlterarStatus(partida) }]">
                  <template v-if="partidaEditandoStatus !== partida.id">
                    <span class="texto-status">
                      <span v-if="partida.status === 'EM_ANDAMENTO'" class="status-live-dot" aria-hidden="true"></span>
                      {{ statusLabel(partida) }}
                    </span>

                    <svg v-if="podeAlterarStatus(partida)" xmlns="http://www.w3.org/2000/svg" width="14"
                      height="14" fill="currentColor" class="bi bi-pencil-square icone-status" viewBox="0 0 16 16">
                      <path
                        d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293z" />
                      <path
                        d="M13.752 4.396l-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.815z" />
                    </svg>
                  </template>
                </div>
              </div>

              <div class="nome-quadra">
                <span>{{ partida.quadra?.nome }}</span>
                <span v-if="(partida?.data || partida?.createdAt) && partida.status !== 'EM_ANDAMENTO'"
                  class="data-info">
                  | {{ formatarDiaSemanaData(partida?.data || partida?.createdAt) }}
                </span>
              </div>

              <div class="conteudo-partida">
                <div class="time lado">
                  <img v-if="partida.timeA?.foto" :src="partida.timeA.foto" class="time-foto" />
                  <span class="time-nome">{{ partida.timeA?.nome }}</span>
                </div>

                <div class="placar-centro">
                  <template v-if="isStatusPartidaPendente(partida)">
                    <span>x</span>
                  </template>
                  <template v-else>
                    <strong>{{ partida.pontosTimeA ?? 0 }}</strong>
                    <span>x</span>
                    <strong>{{ partida.pontosTimeB ?? 0 }}</strong>
                  </template>
                </div>

                <div class="time lado">
                  <img v-if="partida.timeB?.foto" :src="partida.timeB.foto" class="time-foto" />
                  <span class="time-nome">{{ partida.timeB?.nome }}</span>
                </div>
              </div>

              <div class="meta-partida">
                <div class="usuario-criador">
                  Criado por:
                  <strong>{{ partida.usuarioCriador?.nome }}</strong>
                </div>

                <div v-if="partida.status === 'FINALIZADA' && partida.ultimaEdicaoEm" class="usuario-editor">
                  Editado em:
                  <strong>{{ formatarDataHora(partida.ultimaEdicaoEm) }}</strong>
                  <span v-if="partida.usuarioUltimaEdicao?.nome">
                    ({{ partida.usuarioUltimaEdicao.nome }})
                  </span>
                </div>
              </div>

              <button
                v-if="partida.status !== 'CANCELADA'"
                class="btn-acessar"
                :class="{
                  'btn-acessar-disabled': isMesario && partida.status === 'FINALIZADA',
                  'btn-acessar-loading': partidaAcessandoId === partida.id
                }"
                :disabled="(isMesario && partida.status === 'FINALIZADA') || partidaAcessandoId === partida.id"
                @click="acessarPartida(partida)"
              >
                {{
                  partidaAcessandoId === partida.id
                    ? 'Acessando...'
                    : partida.status === 'FINALIZADA'
                      ? (isMesario ? 'Finalizada' : 'Editar')
                      : 'Acessar'
                }}
              </button>
              <button v-else class="btn-acessar" @click="removerPartidaCancelada(partida)">
                Remover
              </button>
            </li>
          </ul>

            <div v-else class="vazio">
              <button v-if="!isCampeonatoEncerrado" class="btn-add-partida-vazio" @click="abrirModalTipo">
                Adicionar partida
              </button>
              <span v-else class="vazio-finalizado-copy">Nenhuma partida cadastrada neste campeonato.</span>
            </div>
        </div>
      </template>

      <ModalEscolhaTipo v-model="mostrarModalTipo" :campeonato-id="campeonatoSelecionado" @faseCriada="adicionarFase"
        @rodadaCriada="adicionarRodada" @partidaCriada="onPartidaCriada" />

      <SelecionarJogadores :aberto="mostrarModalJogadores" :jogadoresTime1="jogadoresTime1"
        :jogadoresTime2="jogadoresTime2" :time1Nome="partidaParaEscalacao?.timeA?.nome || 'Time 1'"
        :time2Nome="partidaParaEscalacao?.timeB?.nome || 'Time 2'" :regra="regraJogadoresEscalacao"
        :salvando="salvandoEscalacaoInicial"
        @fechar="fecharModalJogadores" @confirmar="confirmarJogadoresAntesDeAcessar" />

      <div v-if="mostrarModalStatus" class="modal-overlay" @click.self="!salvandoStatusPartida && fecharModalStatus()">
        <div class="modal-content modal-status" :class="classeVisualStatusModal">
          <div class="modal-header">
            <h2 class="titulo-modal-status">Alterar status da partida</h2>
            <button type="button" class="btn-close-x" :disabled="salvandoStatusPartida" @click="fecharModalStatus">x</button>
          </div>

          <label class="label-status">Selecione o status</label>

          <select v-model="novoStatus" class="select-status-modal" :class="classeVisualStatusModal" :disabled="salvandoStatusPartida">
            <option v-if="statusAtualModal" :value="statusAtualModal" hidden>
              {{ statusLabel(partidaSelecionada || statusAtualModal) || statusAtualModal.replace('_', ' ') }}
            </option>
            <option v-for="status in statusDisponiveisModal" :key="status" :value="status">
              {{ statusLabel(status) || status.replace('_', ' ') }}
            </option>
          </select>

          <div v-if="novoStatus === 'ADIADA'" class="campos-adiamento">
            <div class="campo-adiamento">
              <label class="label-status" for="data-adiamento">Nova data</label>
              <input
                id="data-adiamento"
                v-model="dataAdiamento"
                type="date"
                :min="dataMinimaAdiamento"
                :disabled="salvandoStatusPartida"
                class="input-status-modal"
                :class="classeVisualStatusModal"
              />
            </div>

            <div class="campo-adiamento">
              <label class="label-status" for="hora-adiamento">Nova hora</label>
              <input
                id="hora-adiamento"
                v-model="horaAdiamento"
                type="time"
                :disabled="salvandoStatusPartida"
                class="input-status-modal"
                :class="classeVisualStatusModal"
              />
            </div>
          </div>

          <div class="botoes">
            <button class="btn-save" :disabled="salvandoStatusPartida" @click="confirmarAlteracaoStatus">
              <span class="btn-save-content">
                <span v-if="salvandoStatusPartida" class="btn-save-spinner" aria-hidden="true"></span>
                <span>{{ salvandoStatusPartida ? 'Salvando...' : 'Salvar' }}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NavBarQuadras from '@/components/quadraplay/NavBarQuadras.vue'
import SidebarCampeonato from '@/components/quadraplay/SidebarCampeonato.vue'
import ModalEscolhaTipo from '@/components/quadraplay/ModalEscolhaTipo.vue'
import SelecionarJogadores from '@/components/quadraplay/Partida/SelecionarJogadores.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import { carregarCampeonato } from '@/utils/persistirCampeonato'
import { salvarPrefetchPartida } from '@/utils/partidaPrefetch'
import {
  isStatusPartidaPendente,
  obterRotuloStatusPartida,
  obterStatusExibicaoPartida
} from '@/utils/partidaStatus'
import { ordenarPartidasPorStatusEDataDesc } from '@/utils/partidaOrdenacao'
import api from '@/axios'
import Swal from 'sweetalert2'
import {
  EVENTO_CAMPEONATO_ATUALIZADO,
  obterSocket,
  inscreverCampeonatoSocket,
  desinscreverCampeonatoSocket
} from '@/services/socket'

const STATUS_CONFIG = {
  FINALIZADA: { label: 'ENCERRADA', card: 'card-finalizada', text: 'status-finalizada' },
  EM_ANDAMENTO: { label: 'EM ANDAMENTO', card: 'card-andamento', text: 'status-andamento' },
  AGENDADA: { label: 'AGENDADA', card: 'card-agendada', text: 'status-agendada' },
  AGENDADA_HOJE: { label: 'AGENDADA PARA HOJE', card: 'card-agendada', text: 'status-agendada' },
  ADIADA: { label: 'ADIADA', card: 'card-agendada', text: 'status-agendada' },
  CANCELADA: { label: 'CANCELADA', card: 'card-cancelada', text: 'status-cancelada' },
  DELETADA: { label: 'DELETAR', card: 'card-cancelada', text: 'status-cancelada' }
}

const PARTIDA_SEM_JOGADORES_FLAG_PREFIX = 'quadraplay:partidaSemJogadoresIgnorada:'

export default {
  name: 'GerenciarPartidaView',
  components: { SidebarCampeonato, NavBarQuadras, ModalEscolhaTipo, SelecionarJogadores, LoadingState },

  data() {
    return {
      fases: [],
      rodadas: [],
      partidas: [],
      faseSelecionada: '',
      rodadaSelecionada: '',
      sidebarCollapsed: false,
      modalidades: [],
      campeonatos: [],
      modalidadeSelecionada: '',
      campeonatoSelecionado: '',
      campeonato: null,
      isLoading: true,
      isLoadingPartidas: true,
      partidaAcessandoId: null,
      mostrarModalTipo: false,
      mostrarModalStatus: false,
      mostrarModalJogadores: false,
      statusDisponiveis: [],
      partidaSelecionada: null,
      partidaParaEscalacao: null,
      jogadoresTime1: [],
      jogadoresTime2: [],
      novoStatus: '',
      statusAtualModal: '',
      dataAdiamento: '',
      horaAdiamento: '',
      partidaEditandoStatus: null,
      salvandoStatusPartida: false,
      salvandoEscalacaoInicial: false,
      socket: null,
      socketCampeonatoId: null,
      onSocketAtualizacao: null,
      socketTimerPartidas: null
    }
  },

  mounted() {
    this.conectarSocket()
    this.carregarCampeonatoSelecionado()
    this.buscarModalidades()
    this.buscarStatusPartida()
  },

  beforeUnmount() {
    clearTimeout(this.socketTimerPartidas)
    this.desconectarSocket()
  },

  computed: {
    usuarioLogado() {
      try {
        return JSON.parse(localStorage.getItem('usuario') || 'null')
      } catch (error) {
        return null
      }
    },

    isMesario() {
      return Number(this.usuarioLogado?.permissaoId) === 4
    },

    isCampeonatoEncerrado() {
      const status = String(this.campeonato?.status || '').toUpperCase()
      return ['FINALIZADO', 'FINALIZADA', 'CANCELADO', 'CANCELADA', 'DELETADO', 'DELETADA'].includes(status)
    },

    partidasValidas() {
      const lista = Array.isArray(this.partidas) ? this.partidas.filter(a => a && a.id) : []
      return ordenarPartidasPorStatusEDataDesc(lista)
    },

    regraJogadoresEscalacao() {
      return this.obterRegraJogadoresPorPartida(this.partidaParaEscalacao)
    },

    statusDisponiveisModal() {
      const statusAtual = String(this.partidaSelecionada?.status || '').toUpperCase()
      return this.obterStatusDisponiveisModal(statusAtual)
    },

    classeVisualStatusModal() {
      const status = String(this.novoStatus || this.statusAtualModal || '').toUpperCase()
      if (status === 'EM_ANDAMENTO') return 'status-visual-andamento'
      if (status === 'FINALIZADA') return 'status-visual-finalizada'
      if (status === 'CANCELADA' || status === 'DELETADA') return 'status-visual-cancelada'
      return 'status-visual-agendada'
    },

    dataMinimaAdiamento() {
      const data = new Date()
      data.setHours(0, 0, 0, 0)
      data.setDate(data.getDate() + 1)

      const ano = data.getFullYear()
      const mes = String(data.getMonth() + 1).padStart(2, '0')
      const dia = String(data.getDate()).padStart(2, '0')
      return `${ano}-${mes}-${dia}`
    }
  },

  methods: {
    conectarSocket() {
      this.socket = obterSocket()

      if (!this.onSocketAtualizacao) {
        this.onSocketAtualizacao = (payload) => this.tratarAtualizacaoCampeonato(payload)
      }

      this.socket.off(EVENTO_CAMPEONATO_ATUALIZADO, this.onSocketAtualizacao)
      this.socket.on(EVENTO_CAMPEONATO_ATUALIZADO, this.onSocketAtualizacao)
    },

    desconectarSocket() {
      if (this.socket && this.onSocketAtualizacao) {
        this.socket.off(EVENTO_CAMPEONATO_ATUALIZADO, this.onSocketAtualizacao)
      }

      if (this.socketCampeonatoId) {
        desinscreverCampeonatoSocket(this.socketCampeonatoId)
      }

      this.socketCampeonatoId = null
      this.onSocketAtualizacao = null
    },

    inscreverSocketAtual(campeonatoId) {
      const id = Number(campeonatoId)
      if (!id) return

      if (this.socketCampeonatoId && this.socketCampeonatoId !== id) {
        desinscreverCampeonatoSocket(this.socketCampeonatoId)
      }

      inscreverCampeonatoSocket(id)
      this.socketCampeonatoId = id
    },

    agendarAtualizacaoPartidasSocket() {
      clearTimeout(this.socketTimerPartidas)
      this.socketTimerPartidas = setTimeout(() => {
        this.carregarPartidasPorFaseRodada()
      }, 150)
    },

    tratarAtualizacaoCampeonato(payload) {
      const campeonatoEvento = Number(payload?.campeonatoId)
      const campeonatoAtual = Number(this.campeonatoSelecionado)

      if (!campeonatoEvento || !campeonatoAtual || campeonatoEvento !== campeonatoAtual) {
        return
      }

      const tipo = String(payload?.tipo || '')
      const faseEvento = Number(payload?.faseId)
      const rodadaEvento = Number(payload?.rodadaId)

      const mesmaFase = !faseEvento || Number(this.faseSelecionada) === faseEvento
      const mesmaRodada = !rodadaEvento || Number(this.rodadaSelecionada) === rodadaEvento

      if (['PARTIDA_CRIADA', 'GOL_PARTIDA', 'PARTIDA_FINALIZADA', 'STATUS_PARTIDA_ATUALIZADO'].includes(tipo)) {
        if (mesmaFase && mesmaRodada) {
          this.agendarAtualizacaoPartidasSocket()
        }
      }
    },

    abrirModalTipo() {
      if (this.isCampeonatoEncerrado) return
      this.mostrarModalTipo = true
    },

    formatarDataHora(data) {
      const dt = new Date(data)
      if (Number.isNaN(dt.getTime())) return '-'
      return dt.toLocaleString('pt-BR')
    },

    formatarDiaSemanaData(data) {
      const dt = new Date(data)
      if (Number.isNaN(dt.getTime())) return '-'

      const diaSemana = dt.toLocaleDateString('pt-BR', { weekday: 'long' })
      const dataFormatada = dt.toLocaleDateString('pt-BR')
      const horaFormatada = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      const diaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)

      return `${diaCapitalizado} - ${dataFormatada} às ${horaFormatada}`
    },

    statusLabel(status) {
      return obterRotuloStatusPartida(status)
    },

    classeStatusPartida(partida) {
      const statusExibicao = obterStatusExibicaoPartida(partida)
      return STATUS_CONFIG[statusExibicao]?.card
    },

    classeStatusTexto(partida) {
      const statusExibicao = obterStatusExibicaoPartida(partida)
      return STATUS_CONFIG[statusExibicao]?.text
    },

    podeAlterarStatus(partida) {
      const statusAtual = String(partida?.status || '').toUpperCase()
      if (!statusAtual) return false
      return statusAtual !== 'FINALIZADA'
    },

    normalizarNomeModalidade(nome) {
      return String(nome || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    },

    obterRegraJogadoresPorPartida(partida) {
      const nome = this.normalizarNomeModalidade(partida?.modalidade?.nome)
      const MODALIDADES_GRUPO_FUTEBOL = new Set(['futebol', 'futsal', 'futebol de areia'])

      if (MODALIDADES_GRUPO_FUTEBOL.has(nome)) {
        return { livre: true, minPorTime: 0, opcional: true }
      }

      if (
        nome.includes('volei') ||
        nome.includes('futevolei') ||
        (nome.includes('beach') && (nome.includes('tenis') || nome.includes('tennis')))
      ) {
        return { livre: true, minPorTime: 0, opcional: true }
      }

      return { porTime: 11, total: 22 }
    },

    obterChaveAvisoSemJogadores(partidaId) {
      const id = Number(partidaId)
      return id ? `${PARTIDA_SEM_JOGADORES_FLAG_PREFIX}${id}` : ''
    },

    deveExibirAvisoSemJogadores(partidaId) {
      const chave = this.obterChaveAvisoSemJogadores(partidaId)
      if (!chave) return true

      try {
        return localStorage.getItem(chave) !== '1'
      } catch (error) {
        return true
      }
    },

    marcarAvisoSemJogadoresIgnorado(partidaId) {
      const chave = this.obterChaveAvisoSemJogadores(partidaId)
      if (!chave) return

      try {
        localStorage.setItem(chave, '1')
      } catch (error) {
        // Sem persistencia, mantem comportamento atual.
      }
    },

    limparAvisoSemJogadoresIgnorado(partidaId) {
      const chave = this.obterChaveAvisoSemJogadores(partidaId)
      if (!chave) return

      try {
        localStorage.removeItem(chave)
      } catch (error) {
        // Sem persistencia, mantem comportamento atual.
      }
    },

    async carregarCampeonatoSelecionado() {
      try {
        this.campeonato = await carregarCampeonato(this.$route)
        if (this.campeonato?.id) {
          this.modalidadeSelecionada = this.campeonato.modalidade?.id
          this.campeonatoSelecionado = this.campeonato.id
          this.inscreverSocketAtual(this.campeonato.id)
          await this.carregarFases()
        }
      } catch (err) {
        console.error('Erro ao carregar campeonato:', err)
      } finally {
        if (!this.campeonato?.id) {
          this.isLoadingPartidas = false
        }
        this.isLoading = false
      }
    },

    async carregarFases() {
      if (!this.campeonatoSelecionado) {
        this.isLoadingPartidas = false
        return
      }

      try {
        const { data } = await api.get(`/fases/${this.campeonatoSelecionado}`)
        this.fases = Array.isArray(data) ? data : []

        if (!this.fases.length) {
          this.faseSelecionada = ''
          this.rodadas = []
          this.rodadaSelecionada = ''
          this.partidas = []
          this.isLoadingPartidas = false
          return
        }

        const existeFaseSelecionada = this.fases.some(f => f.id === this.faseSelecionada)
        if (!this.faseSelecionada || !existeFaseSelecionada) {
          this.faseSelecionada = this.fases[0].id
        }

        const faseObj = this.fases.find(f => f.id === this.faseSelecionada) || this.fases[0]
        this.rodadas = Array.isArray(faseObj.rodadas) ? faseObj.rodadas : []

        const existeRodadaSelecionada = this.rodadas.some(r => r.id === this.rodadaSelecionada)
        if (!this.rodadaSelecionada || !existeRodadaSelecionada) {
          this.rodadaSelecionada = this.rodadas.length ? this.rodadas[0].id : ''
        }

        await this.carregarPartidasPorFaseRodada()
      } catch (error) {
        console.error('Erro ao buscar fases/rodadas:', error)
        this.fases = []
        this.rodadas = []
        this.faseSelecionada = ''
        this.rodadaSelecionada = ''
        this.partidas = []
        this.isLoadingPartidas = false
      }
    },

    async buscarModalidades() {
      try {
        const response = await api.get('/listar/modalidade')
        this.modalidades = response.data
      } catch (error) {
        console.error('Erro ao buscar modalidades:', error)
      }
    },

    async buscarStatusPartida() {
      try {
        const response = await api.get('/partidas/status')
        this.statusDisponiveis = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('Erro ao buscar status:', error)
      }
    },

    async onPartidaCriada(partidaCriada) {
      try {
        this.mostrarModalTipo = false

        const partidaIdCriada = Number(partidaCriada?.id)
        const statusCriada = String(partidaCriada?.status || '')
        if (partidaIdCriada && statusCriada === 'EM_ANDAMENTO') {
          await this.acessarPartida(partidaCriada)
          return
        }

        const faseIdCriada = Number(partidaCriada?.faseId)
        const rodadaIdCriada = Number(partidaCriada?.rodadaId)

        await this.carregarFases()

        if (faseIdCriada && this.fases.some(f => f.id === faseIdCriada)) {
          this.faseSelecionada = faseIdCriada
          const faseObj = this.fases.find(f => f.id === faseIdCriada)
          this.rodadas = Array.isArray(faseObj?.rodadas) ? faseObj.rodadas : []

          if (rodadaIdCriada && this.rodadas.some(r => r.id === rodadaIdCriada)) {
            this.rodadaSelecionada = rodadaIdCriada
          } else {
            this.rodadaSelecionada = this.rodadas.length ? this.rodadas[0].id : ''
          }
        }

        await this.carregarPartidasPorFaseRodada()
      } catch (e) {
        console.error('Erro ao atualizar lista apos criar partida:', e)
        await this.carregarFases()
      }
    },

    async carregarPartidasPorFaseRodada() {
      if (!this.campeonatoSelecionado || !this.faseSelecionada || !this.rodadaSelecionada) {
        this.partidas = []
        this.isLoadingPartidas = false
        return
      }

      this.isLoadingPartidas = true

      try {
        const { data } = await api.get(`/partidas/${this.campeonatoSelecionado}/${this.faseSelecionada}/${this.rodadaSelecionada}`)
        this.partidas = Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Erro ao buscar partidas por fase/rodada:', error)
        this.partidas = []
      } finally {
        this.isLoadingPartidas = false
      }
    },

    async onFaseChange() {
      const fase = this.fases.find(f => f.id === this.faseSelecionada)
      this.rodadas = Array.isArray(fase?.rodadas) ? fase.rodadas : []
      this.rodadaSelecionada = this.rodadas.length ? this.rodadas[0].id : ''
      await this.carregarPartidasPorFaseRodada()
    },

    async onRodadaChange() {
      await this.carregarPartidasPorFaseRodada()
    },

    obterStatusDisponiveisModal(statusAtualInformado = '') {
      const lista = Array.isArray(this.statusDisponiveis) ? this.statusDisponiveis : []
      const statusAtual = String(statusAtualInformado || '').toUpperCase()
      let opcoes = [...lista]

      if (statusAtual === 'EM_ANDAMENTO') {
        opcoes = opcoes.filter(status => status !== 'AGENDADA' && status !== 'ADIADA')
        if (!opcoes.includes('DELETADA')) opcoes.push('DELETADA')
      } else if (statusAtual === 'FINALIZADA') {
        if (this.isMesario) return []
        opcoes = opcoes.filter(status => !['AGENDADA', 'ADIADA', 'FINALIZADA'].includes(status))
      } else if (statusAtual === 'CANCELADA') {
        opcoes = opcoes.filter(status => !['AGENDADA', 'ADIADA', 'FINALIZADA'].includes(status))
        if (!opcoes.includes('DELETADA')) opcoes.push('DELETADA')
      }

      return opcoes.filter(status => status !== statusAtual)
    },

    isStatusPartidaPendente(partida) {
      return isStatusPartidaPendente(partida)
    },

    formatarDataInputLocal(dataReferencia) {
      const data = new Date(dataReferencia)
      if (Number.isNaN(data.getTime())) return ''

      const ano = data.getFullYear()
      const mes = String(data.getMonth() + 1).padStart(2, '0')
      const dia = String(data.getDate()).padStart(2, '0')
      return `${ano}-${mes}-${dia}`
    },

    formatarHoraInputLocal(dataReferencia) {
      const data = new Date(dataReferencia)
      if (Number.isNaN(data.getTime())) return ''

      const hora = String(data.getHours()).padStart(2, '0')
      const minuto = String(data.getMinutes()).padStart(2, '0')
      return `${hora}:${minuto}`
    },

    preencherCamposAdiamento(dataReferencia) {
      const dataFormatada = this.formatarDataInputLocal(dataReferencia)
      this.dataAdiamento = dataFormatada && dataFormatada >= this.dataMinimaAdiamento
        ? dataFormatada
        : this.dataMinimaAdiamento
      this.horaAdiamento = this.formatarHoraInputLocal(dataReferencia)
    },

    montarDataHoraAdiamento() {
      if (!this.dataAdiamento || !this.horaAdiamento) return ''

      const dataHora = `${this.dataAdiamento}T${this.horaAdiamento}`
      const data = new Date(dataHora)
      return Number.isNaN(data.getTime()) ? '' : data.toISOString()
    },

    editarStatus(partida) {
      if (!this.podeAlterarStatus(partida)) return
      const statusAtual = String(partida?.status || '').toUpperCase()

      this.partidaSelecionada = partida
      this.statusAtualModal = statusAtual
      this.novoStatus = statusAtual
      this.preencherCamposAdiamento(partida?.data || partida?.createdAt)
      this.mostrarModalStatus = true
    },

    fecharModalStatus() {
      if (this.salvandoStatusPartida) return
      this.mostrarModalStatus = false
      this.partidaSelecionada = null
      this.novoStatus = ''
      this.statusAtualModal = ''
      this.dataAdiamento = ''
      this.horaAdiamento = ''
      this.salvandoStatusPartida = false
    },

    async confirmarAlteracaoStatus() {
      if (this.salvandoStatusPartida) return

      let atualizou = false
      let iniciouSemEscalacao = false

      try {
        const partidaSelecionada = this.partidaSelecionada
        const statusAnterior = String(this.statusAtualModal || partidaSelecionada?.status || '').toUpperCase()

        if (this.isMesario && String(this.statusAtualModal || '').toUpperCase() === 'FINALIZADA') {
          Swal.fire('Atenção', 'Não é permitido alterar o status de partidas finalizadas.', 'info')
          this.fecharModalStatus()
          return
        }

        if (!this.novoStatus) {
          Swal.fire('Atenção', 'Selecione um status.', 'info')
          return
        }

        if (this.novoStatus === this.statusAtualModal) {
          Swal.fire('Atenção', 'Selecione um novo status na listagem.', 'info')
          return
        }

        if (this.novoStatus === 'DELETADA') {
          const partida = this.partidaSelecionada
          this.fecharModalStatus()
          await this.removerPartidaCancelada(partida)
          return
        }

        const payload = { status: this.novoStatus }

        if (this.novoStatus === 'ADIADA') {
          if (this.dataAdiamento < this.dataMinimaAdiamento) {
            Swal.fire('Atenção', 'Escolha uma data a partir de amanhã para adiar a partida.', 'info')
            return
          }

          const dataAdiamento = this.montarDataHoraAdiamento()

          if (!dataAdiamento) {
            Swal.fire('Atenção', 'Selecione a nova data e a nova hora da partida.', 'info')
            return
          }

          payload.data = dataAdiamento
        }

        this.salvandoStatusPartida = true

        const { data } = await api.put(`/partidas/${partidaSelecionada.id}/status`, payload)
        const partidaResposta = data?.partida && typeof data.partida === 'object' ? data.partida : data

        if (partidaSelecionada && partidaResposta && typeof partidaResposta === 'object') {
          Object.assign(partidaSelecionada, partidaResposta)
        }

        iniciouSemEscalacao =
          this.novoStatus === 'EM_ANDAMENTO' &&
          this.isStatusPartidaPendente(statusAnterior)

        atualizou = true
      } catch (error) {
        this.partidaAcessandoId = null
        console.error(error)
        const mensagem = error?.response?.data?.error || 'Não foi possível alterar o status.'
        return Swal.fire('Erro', mensagem, 'error')
      } finally {
        this.salvandoStatusPartida = false
      }

      if (!atualizou) return

      this.fecharModalStatus()

      if (iniciouSemEscalacao) {
        Swal.fire({
          icon: 'success',
          title: 'Status atualizado',
          text: 'A partida foi iniciada. A selecao de jogadores e opcional.',
          timer: 1800,
          showConfirmButton: false
        })
        return
      }

      Swal.fire({ icon: 'success', title: 'Status atualizado', timer: 1200, showConfirmButton: false })
    },

    fecharModalJogadores() {
      this.mostrarModalJogadores = false
      this.partidaParaEscalacao = null
      this.jogadoresTime1 = []
      this.jogadoresTime2 = []
      this.salvandoEscalacaoInicial = false
    },

    async abrirEscalacaoInicial(partida) {
      const [resA, resB] = await Promise.all([
        api.get('/partidas/escalacao/jogadores', {
          params: {
            campeonatoId: partida.campeonatoId,
            faseId: partida.faseId,
            timeId: partida.timeAId
          }
        }),
        api.get('/partidas/escalacao/jogadores', {
          params: {
            campeonatoId: partida.campeonatoId,
            faseId: partida.faseId,
            timeId: partida.timeBId
          }
        })
      ])

      this.partidaParaEscalacao = partida
      this.jogadoresTime1 = Array.isArray(resA.data) ? resA.data : []
      this.jogadoresTime2 = Array.isArray(resB.data) ? resB.data : []
      this.mostrarModalJogadores = true
    },

    async confirmarJogadoresAntesDeAcessar(selecao) {
      if (this.salvandoEscalacaoInicial) return
      this.salvandoEscalacaoInicial = true

      try {
        const partida = this.partidaParaEscalacao
        if (!partida?.id) return

        const idsTimeA = Array.isArray(selecao?.time1) ? selecao.time1 : []
        const idsTimeB = Array.isArray(selecao?.time2) ? selecao.time2 : []

        const jogadoresPayload = [
          ...idsTimeA.map((jogadorId) => ({ jogadorId: Number(jogadorId), timeId: Number(partida.timeAId) })),
          ...idsTimeB.map((jogadorId) => ({ jogadorId: Number(jogadorId), timeId: Number(partida.timeBId) }))
        ]

        await api.put(`/partidas/${partida.id}/iniciar`, { jogadores: jogadoresPayload })
        this.limparAvisoSemJogadoresIgnorado(partida.id)
        this.fecharModalJogadores()
        await this.carregarPartidasPorFaseRodada()
        await this.irParaTelaPartida(partida.id)
      } catch (error) {
        this.partidaAcessandoId = null
        console.error(error)
        const mensagem = error.response?.data?.erro || error.response?.data?.message || 'Nao foi possivel iniciar a partida.'
        Swal.fire('Erro', mensagem, 'error')
      } finally {
        this.salvandoEscalacaoInicial = false
      }
    },

    async prepararPrefetchPartida(partidaId) {
      const { data } = await api.get(`/partidas/${partidaId}/retornar`)
      salvarPrefetchPartida({
        partidaId,
        campeonatoId: this.campeonato?.id,
        campeonato: this.campeonato,
        partida: data
      })
    },

    async irParaTelaPartida(partidaId) {
      try {
        if (!this.campeonato) throw new Error('Campeonato nao encontrado')

        localStorage.setItem('campeonatoSelecionado', JSON.stringify(this.campeonato))

        await this.prepararPrefetchPartida(partidaId)

        await this.$router.push({
          path: '/partida',
          query: { partidaId, id: this.campeonato.id }
        })
      } catch (error) {
        this.partidaAcessandoId = null
        console.error(error)
        Swal.fire('Erro', 'Não foi possível acessar a partida.', 'error')
      }
    },

    async acessarPartida(partida) {
      try {
        if (this.partidaAcessandoId) return

        const partidaObj = partida && typeof partida === 'object'
          ? partida
          : this.partidasValidas.find(a => Number(a.id) === Number(partida))

        const partidaId = Number(partidaObj?.id || partida)
        if (!partidaId) throw new Error('Partida invalida.')
        this.partidaAcessandoId = partidaId

        if (this.isStatusPartidaPendente(partidaObj)) {
          this.partidaAcessandoId = null
          Swal.fire('Atenção', 'No dia da partida, altere o status para EM ANDAMENTO para iniciar.', 'info')
          return
        }

        if (this.isMesario && partidaObj?.status === 'FINALIZADA') {
          this.partidaAcessandoId = null
          Swal.fire('Atenção', 'Partidas finalizadas não podem ser editadas.', 'info')
          return
        }

        if (partidaObj?.status === 'EM_ANDAMENTO') {
          const { data } = await api.get(`/partida/${partidaId}`)
          const jogadoresSelecionados = Array.isArray(data) ? data : []
          const regraJogadores = this.obterRegraJogadoresPorPartida(partidaObj)

          if (jogadoresSelecionados.length) {
            this.limparAvisoSemJogadoresIgnorado(partidaId)
          }

          if (!jogadoresSelecionados.length && !regraJogadores?.opcional && this.deveExibirAvisoSemJogadores(partidaId)) {
            const resultado = await Swal.fire({
              title: 'Partida sem jogadores',
              text: 'Deseja selecionar jogadores agora? Voce pode continuar sem selecao.',
              icon: 'question',
              showCancelButton: true,
              confirmButtonText: 'Selecionar agora',
              cancelButtonText: 'Continuar sem selecao'
            })

            if (resultado.isConfirmed) {
              this.limparAvisoSemJogadoresIgnorado(partidaId)
              this.partidaAcessandoId = null
              await this.abrirEscalacaoInicial(partidaObj)
              return
            }

            this.marcarAvisoSemJogadoresIgnorado(partidaId)
          }
        }

        await this.irParaTelaPartida(partidaId)
      } catch (error) {
        this.partidaAcessandoId = null
        console.error(error)
        Swal.fire('Erro', 'Não foi possível acessar a partida.', 'error')
      }
    },

    async removerPartidaCancelada(partida) {
      const partidaId = Number(partida?.id || partida)
      if (!partidaId) return

      const statusAtual = String(partida?.status || '').toUpperCase()
      if (!['CANCELADA', 'EM_ANDAMENTO'].includes(statusAtual)) {
        Swal.fire('Atenção', 'Somente partidas canceladas ou em andamento podem ser removidas.', 'info')
        return
      }

      const resultado = await Swal.fire({
        title: 'Tem certeza?',
        text: 'A partida será removida da listagem.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar'
      })

      if (!resultado.isConfirmed) return

      try {
        await api.delete(`/partidas/${partidaId}`)

        await Swal.fire({
          title: 'Removida!',
          text: 'A partida foi removida com sucesso.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        })

        await this.carregarPartidasPorFaseRodada()
      } catch (error) {
        console.error(error)
        const mensagem = error.response?.data?.error || 'Não foi possível remover a partida.'
        Swal.fire({ title: 'Erro', text: mensagem, icon: 'error' })
      }
    },

    async retomarPartida(partidaId) {
      try {
        const response = await api.get(`/partidas/${partidaId}/retornar`)
        const partida = response.data
        this.$router.push({ path: '/partida', query: { partidaId: partida.id } })
      } catch (error) {
        console.error(error)
        Swal.fire('Erro', 'Não foi possível retomar essa partida.', 'error')
      }
    },

    async adicionarFase(novaFase) {
      this.fases.push(novaFase)
      this.faseSelecionada = novaFase.id
      this.rodadas = Array.isArray(novaFase.rodadas) ? novaFase.rodadas : []
      this.rodadaSelecionada = this.rodadas.length ? this.rodadas[0].id : ''
      await this.carregarPartidasPorFaseRodada()
    },

    async adicionarRodada(novaRodada) {
      const fase = this.fases.find(f => f.id === novaRodada.faseId)
      if (!fase) return

      fase.rodadas = Array.isArray(fase.rodadas) ? fase.rodadas : []
      fase.rodadas.push(novaRodada)

      this.rodadas = fase.rodadas
      this.rodadaSelecionada = novaRodada.id
      await this.carregarPartidasPorFaseRodada()
    }
  }
}
</script>

<style scoped>
a {
  text-decoration: none;
  color: inherit;
}

.layout {
  display: flex;
  min-height: 100vh;
}

.conteudo {
  flex: 1;
  padding: 24px 28px 32px;
  margin-top: 70px;
  margin-left: 250px;
  transition: margin-left 0.3s ease;
  background: #f8fafc;
}

.conteudo.collapsed {
  margin-left: 70px;
}

.header {
  margin-bottom: 18px;
}

.header-copy {
  width: 100%;
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.btn-add-partida-topo.btn-add-aartida-header {
  flex: 0 0 auto;
  margin-top: 14px;
}

.title {
  margin: 14px 0 10px;
  color: #2563eb;
  font-size: 40px;
  line-height: 0.98;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.page-subtitle {
  margin: 0;
  max-width: 720px;
  color: #475569;
  font-size: 17px;
  line-height: 1.6;
}

.conteudo.campeonato-finalizado .title {
  color: #b91c1c;
}

.conteudo.campeonato-finalizado .section-kicker {
  color: #b91c1c;
}

.conteudo.campeonato-finalizado .filtro-titulo {
  color: #b91c1c;
}

.conteudo.campeonato-finalizado .filtros-wrapper .section-head h2 {
  color: #991b1b;
}

.conteudo.campeonato-finalizado .filtros-topo select:hover {
  border-color: rgba(239, 68, 68, 0.38);
}

.conteudo.campeonato-finalizado .filtros-topo select:focus {
  border-color: rgba(185, 28, 28, 0.58);
  box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.2);
}

.conteudo.campeonato-finalizado .btn-add-partida-topo,
.conteudo.campeonato-finalizado .btn-add-partida-vazio,
.conteudo.campeonato-finalizado .btn-acessar,
.conteudo.campeonato-finalizado .btn-save {
  background: linear-gradient(135deg, #b91c1c, #ef4444);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fff;
  box-shadow: 0 14px 26px rgba(185, 28, 28, 0.22);
}

.vazio-finalizado-copy {
  color: #64748b;
  font-size: 15px;
  font-weight: 600;
}

.painel-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  padding: 24px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.section-head h2 {
  margin: 6px 0 8px;
  color: #0f172a;
  font-size: 28px;
  line-height: 1.05;
}

.section-head a {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.55;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.btn-add-partida-topo {
  min-height: 52px;
  padding: 0 18px;
  border: 1px solid rgba(59, 130, 246, 0.32);
  border-radius: 18px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
  cursor: pointer;
  box-shadow: 0 14px 26px rgba(59, 130, 246, 0.22);
  transition: transform 0.15s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-add-partida-topo:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(59, 130, 246, 0.28);
}

.btn-add-partida-icon {
  flex: 0 0 auto;
}

.btn-add-partida-mobile {
  display: none;
}

.criarpartidas {
  background-color: #3b82f6;
  color: white;
  padding: 8px 14px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}

.filtros-wrapper {
  margin-bottom: 18px;
  padding: 18px 20px;
}

.filtros-wrapper .section-head {
  margin-bottom: 14px;
}

.filtros-wrapper .section-head h2 {
  margin: 4px 0 6px;
  font-size: 24px;
}

.filtros-wrapper .section-head a {
  font-size: 13px;
  line-height: 1.45;
}

.filtros-topo {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.filtros-topo select {
  width: 100%;
  min-height: 46px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.34);
  font: inherit;
  color: #0f172a;
  background-color: #f8fafc;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.filtros-topo select:hover {
  border-color: rgba(59, 130, 246, 0.36);
}

.filtros-topo select:focus {
  outline: none;
  border-color: rgba(37, 99, 235, 0.6);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.14);
  background-color: #fff;
}

.filtro-item {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 6px;
  min-width: 0;
}

.filtro-titulo {
  margin: 0;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.loader-container-centralizado {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 0;
}

.loader-copy {
  display: none;
}

.partidas-wrapper {
  min-width: 0;
  overflow-x: hidden;
}

.partidas-loading {
  margin-top: 18px;
}

.titulo-secao {
  font-size: 20px;
  color: #3b82f6;
  font-weight: bold;
  margin-bottom: 12px;
}

.lista-partidas {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  min-width: 0;
}

.card-partida {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  border: 1.6px solid #e5e7eb;
  border-radius: 22px;
  padding: 20px;
  background: #ffffff;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.card-partida:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14);
}

.card-partida.card-agendada {
  border-color: rgba(251, 191, 36, 0.55);
}

.card-partida.card-andamento {
  border-color: rgba(34, 197, 94, 0.55);
}

.card-partida.card-cancelada {
  border-color: rgba(239, 68, 68, 0.55);
}

.card-partida.card-finalizada {
  border-color: rgba(220, 38, 38, 0.55);
}

.status-topo{
  display: flex;
  justify-content: center;
  margin: 0 0 10px;
}

.status-pill{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.status-topo-clickable:hover .status-pill{
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14);
}

.status-editavel{
  cursor: pointer;
}

.status-editavel:hover{
  opacity: 0.85;
}

.status-topo-clickable:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14);
}

.status-pill.status-agendada {
  background: rgba(251, 191, 36, 0.18);
  color: #b45309;
  border: 1px solid rgba(251, 191, 36, 0.35);
}

.status-pill.status-andamento {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.35);
}

.status-pill.status-cancelada {
  background: rgba(239, 68, 68, 0.14);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.30);
}

.status-pill.status-finalizada {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
  border: 1px solid rgba(220, 38, 38, 0.28);
}

.texto-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-live-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #22c55e;
  display: inline-block;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55);
  animation: statusDotPulse 1s infinite;
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

@keyframes btnSaveSpin {
  to {
    transform: rotate(360deg);
  }
}

.status-editavel {
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.status-editavel:hover {
  opacity: 0.8;
}

.icone-status {
  font-size: 12px;
}

.conteudo-partida {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  min-width: 0;
}

.time.lado {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  flex: 1 1 0;
  min-width: 0;
}

.time-foto {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(148, 163, 184, 0.4);
  background: #fff;
}

.meta-partida {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(226, 232, 240, 0.92);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.usuario-criador {
  font-size: 12px;
  color: #6b7280;
  text-align: left;
}

.usuario-editor {
  font-size: 12px;
  color: #6b7280;
  text-align: right;
}

.placar-centro {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 24px;
  font-weight: 800;
  min-width: 66px;
  text-align: center;
}

.placar-centro span {
  font-size: 20px;
  margin: 0;
  font-weight: 800;
  color: #334155;
}

.placar-centro strong {
  color: #0f172a;
}

.time-nome {
  min-width: 0;
  font-weight: 700;
  font-size: 17px;
  line-height: 1.2;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.nome-quadra {
  text-align: center;
  font-weight: 700;
  font-size: 13px;
  color: #3b82f6;
  margin: 6px 0 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}

.nome-quadra .data-info {
  color: #64748b;
  font-weight: 600;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px 26px;
  border-radius: 18px;
  width: min(560px, 92vw);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
}

.modal-content h2 {
  margin-bottom: 20px;
  color: #3b82f6;
  font-weight: bold;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal-header h2 {
  margin-bottom: 0;
}

.btn-close-x {
  width: 34px;
  height: 34px;
  border: 1px solid #3b82f6;
  border-radius: 999px;
  background: #fff;
  color: #3b82f6;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  flex: 0 0 auto;
  transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;
}

.tipo-campeonato-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.btn-tipo {
  padding: 12px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #3b82f6;
  background-color: #fff;
  cursor: pointer;
  transition: 0.2s;
}

.btn-tipo:hover {
  background-color: #3b82f6;
  color: #fff;
}

.botoes {
  display: flex;
  gap: 10px;
  margin-top: 1rem;
}

.btn-save,
.btn-cancel {
  flex: 1;
  min-height: 46px;
  padding: 0 16px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  color: white;
  font-size: 15px;
  font-weight: 800;
}

.btn-save {
  background-color: #3b82f6;
}

.btn-save:disabled,
.btn-close-x:disabled {
  cursor: not-allowed;
  opacity: 0.72;
  transform: none;
}

.btn-save-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-save-spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.38);
  border-top-color: #ffffff;
  animation: btnSaveSpin 0.75s linear infinite;
  flex: 0 0 14px;
}

.btn-cancel {
  background-color: #7e7e7e;
}

.btn-acessar {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  border: none;
  border-radius: 16px;
  min-height: 46px;
  padding: 0 14px;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  margin-top: 14px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 10px 18px rgba(59, 130, 246, 0.18);
}

.btn-acessar:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.btn-acessar.btn-acessar-disabled {
  background-color: #cbd5e1;
  color: #475569;
  cursor: not-allowed;
}

.btn-acessar.btn-acessar-disabled:hover {
  background-color: #cbd5e1;
}

.btn-acessar.btn-acessar-loading,
.btn-acessar:disabled:not(.btn-acessar-disabled) {
  opacity: 0.82;
  cursor: progress;
  transform: none;
}

.vazio {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  color: #6b7280;
  margin: 0;
  text-align: center;
}

.btn-add-partida-vazio {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  border: none;
  border-radius: 999px;
  min-height: 46px;
  padding: 0 22px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 10px 18px rgba(59, 130, 246, 0.2);
}

.btn-add-partida-vazio:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.modal-status {
  max-width: 900px;
  border-top: 4px solid #2563eb;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.modal-status .btn-save {
  transition: background-color 0.2s ease;
}

.titulo-modal-status {
  color: #3b82f6;
  font-size: 28px;
  transition: color 0.2s ease;
}

.label-status {
  color: #334155;
  transition: color 0.2s ease;
}

.select-status-modal {
  width: 100%;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 16px;
  color: #111827;
  background-color: #fff;
  cursor: pointer;
  transition: 0.2s;
  margin-bottom: 20px;
}

.select-status-modal:hover {
  border-color: #3b82f6;
}

.select-status-modal:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.campos-adiamento {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.campo-adiamento {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-status-modal {
  width: 100%;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 16px;
  color: #111827;
  background-color: #fff;
  transition: 0.2s;
}

.input-status-modal:hover {
  border-color: #3b82f6;
}

.input-status-modal:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.modal-status.status-visual-agendada {
  border-top-color: #2563eb;
}

.modal-status.status-visual-agendada .titulo-modal-status,
.modal-status.status-visual-agendada .label-status {
  color: #2563eb;
}

.modal-status.status-visual-agendada .btn-close-x {
  border-color: #2563eb;
  color: #2563eb;
}

.modal-status.status-visual-agendada .btn-close-x:hover {
  background: rgba(37, 99, 235, 0.08);
}

.modal-status.status-visual-agendada .btn-save {
  background-color: #2563eb;
}

.modal-status.status-visual-agendada .btn-save:hover {
  background-color: #1d4ed8;
}

.modal-status.status-visual-andamento {
  border-top-color: #16a34a;
}

.modal-status.status-visual-andamento .titulo-modal-status,
.modal-status.status-visual-andamento .label-status {
  color: #16a34a;
}

.modal-status.status-visual-andamento .btn-close-x {
  border-color: #16a34a;
  color: #16a34a;
}

.modal-status.status-visual-andamento .btn-close-x:hover {
  background: rgba(22, 163, 74, 0.08);
}

.modal-status.status-visual-andamento .btn-save {
  background-color: #16a34a;
}

.modal-status.status-visual-andamento .btn-save:hover {
  background-color: #15803d;
}

.modal-status.status-visual-finalizada {
  border-top-color: #bd1c1c;
}

.modal-status.status-visual-finalizada .titulo-modal-status,
.modal-status.status-visual-finalizada .label-status {
  color: #bd1c1c;
}

.modal-status.status-visual-finalizada .btn-close-x {
  border-color: #bd1c1c;
  color: #bd1c1c;
}

.modal-status.status-visual-finalizada .btn-close-x:hover {
  background: rgba(189, 28, 28, 0.08);
}

.modal-status.status-visual-finalizada .btn-save {
  background-color: #bd1c1c;
}

.modal-status.status-visual-finalizada .btn-save:hover {
  background-color: #991b1b;
}

.modal-status.status-visual-cancelada {
  border-top-color: #dc2626;
}

.modal-status.status-visual-cancelada .titulo-modal-status,
.modal-status.status-visual-cancelada .label-status {
  color: #dc2626;
}

.modal-status.status-visual-cancelada .btn-close-x {
  border-color: #dc2626;
  color: #dc2626;
}

.modal-status.status-visual-cancelada .btn-close-x:hover {
  background: rgba(220, 38, 38, 0.08);
}

.modal-status.status-visual-cancelada .btn-save {
  background-color: #dc2626;
}

.modal-status.status-visual-cancelada .btn-save:hover {
  background-color: #b91c1c;
}

.select-status-modal.status-visual-agendada {
  border-color: #2563eb;
  background-color: rgba(37, 99, 235, 0.08);
}

.input-status-modal.status-visual-agendada {
  border-color: #2563eb;
  background-color: rgba(37, 99, 235, 0.08);
}

.select-status-modal.status-visual-andamento {
  border-color: #16a34a;
  background-color: rgba(22, 163, 74, 0.08);
}

.input-status-modal.status-visual-andamento {
  border-color: #16a34a;
  background-color: rgba(22, 163, 74, 0.08);
}

.select-status-modal.status-visual-finalizada {
  border-color: #bd1c1c;
  background-color: rgba(189, 28, 28, 0.08);
}

.input-status-modal.status-visual-finalizada {
  border-color: #bd1c1c;
  background-color: rgba(189, 28, 28, 0.08);
}

.select-status-modal.status-visual-cancelada {
  border-color: #dc2626;
  background-color: rgba(220, 38, 38, 0.08);
}

.input-status-modal.status-visual-cancelada {
  border-color: #dc2626;
  background-color: rgba(220, 38, 38, 0.08);
}

@media (max-width: 768px) {
  .conteudo {
    margin-left: 0;
    margin-top: 34px;
    padding: 14px;
    overflow-x: hidden;
  }

  .campos-adiamento {
    grid-template-columns: 1fr;
  }

  .conteudo.collapsed {
    margin-left: 0;
  }

  .header {
    margin-top: 0;
    margin-bottom: 12px;
  }

  .header-copy {
    max-width: 100%;
    min-width: 0;
  }

  .header-top {
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
  }

  .title {
    margin: 0 0 8px;
    font-size: 30px;
    line-height: 1.04;
    flex: 1 1 220px;
    min-width: 0;
  }

  .page-subtitle {
    font-size: 14px;
    line-height: 1.55;
  }

  .painel-card {
    padding: 18px;
    border-radius: 24px;
  }

  .section-head {
    margin-bottom: 16px;
    flex-direction: column;
    align-items: stretch;
  }

  .section-head h2 {
    font-size: 24px;
  }

  .btn-add-partida-topo {
    min-height: 34px;
    padding: 0 12px;
    border-radius: 12px;
    font-size: 12px;
  }

  .btn-add-partida-topo.btn-add-aartida-header {
    margin-top: 0;
    margin-left: auto;
  }

  .btn-add-partida-desktop {
    display: none;
  }

  .btn-add-partida-mobile {
    display: inline;
  }

  .filtros-wrapper {
    margin-bottom: 16px;
    padding: 14px 16px;
  }

  .filtros-topo {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .filtro-titulo {
    font-size: 12px;
  }

  .filtros-wrapper .section-head {
    margin-bottom: 12px;
  }

  .filtros-wrapper .section-head h2 {
    font-size: 22px;
  }

  .filtros-topo select {
    min-height: 42px;
    padding: 9px 10px;
    border-radius: 12px;
  }

  .partidas-wrapper {
    margin-top: 0;
  }

  .lista-partidas {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .conteudo-partida {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 10px;
    align-items: center;
  }

  .card-partida {
    padding: 14px;
    border-radius: 18px;
  }

  .time.lado:last-child {
    justify-content: flex-end;
  }

  .time-foto {
    width: 28px;
    height: 28px;
  }

  .placar-centro {
    font-size: 20px;
  }

  .placar-centro span {
    font-size: 18px;
    margin: 0 6px;
    font-weight: 600;
  }

  .time-nome {
    font-size: 15px;
  }

  .time.lado:last-child .time-nome {
    text-align: right;
  }

  .meta-partida {
    margin-top: 10px;
    gap: 6px;
    align-items: flex-start;
    flex-direction: column;
  }

  .usuario-editor {
    text-align: left;
  }

  .btn-acessar,
  .btn-add-partida-vazio {
    min-height: 42px;
    border-radius: 14px;
    font-size: 12px;
  }

  .vazio {
    min-height: 140px;
  }

  .modal-content {
    width: min(560px, 94vw);
    padding: 22px 18px;
    border-radius: 16px;
  }
}
</style>




