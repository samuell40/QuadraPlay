<template>
  <div class="layout">
    <NavBarQuadras :partida-status="partida?.status" />
    <SidebarCampeonato :partida-status="partida?.status" @sidebar-toggle="sidebarCollapsed = $event" />

    <div class="conteudo" :class="{ collapsed: sidebarCollapsed }">
      <div class="header">
        <div class="header-copy">
          <h1 class="title" :class="{ 'title-finalizada': isFinalizada, 'title-andamento': isEmAndamento }">Controles da
            Partida</h1>
          <p class="page-subtitle">
            Atualize o placar, eventos e substituições de cada time.
          </p>
        </div>

        <span v-if="isEmAndamento" class="badge-status badge-ao-vivo">
          <span class="live-dot" aria-hidden="true"></span>
          Ao Vivo
        </span>

        <span v-else-if="isFinalizada" class="badge-status badge-finalizada">
          Finalizada
        </span>
      </div>

      <div v-if="isLoading" class="loader-container-centralizado">
        <LoadingState
          title="Carregando partida"
          description="Buscando placar, jogadores e eventos para liberar os controles da partida."
        />
      </div>

      <div v-else>
        <div v-if="placarComponent" class="placares"
          :class="{ 'placares-finalizada': isFinalizada, 'placares-andamento': isEmAndamento }">
          <component :is="placarComponent" v-bind="placarPropsTimeA" @parcial-delta="onParcialDelta"
            @refresh="carregarPartida" />

          <component :is="placarComponent" v-bind="placarPropsTimeB" @parcial-delta="onParcialDelta"
            @refresh="carregarPartida" />
        </div>

        <button class="botao-finalizar"
          :class="{ 'botao-finalizar-finalizada': isFinalizada, 'botao-finalizar-andamento': isEmAndamento }"
          :disabled="botaoDesabilitado" @click="finalizarPartida">
          <span v-if="isFinalizando" class="botao-finalizar-loading">
            <span class="botao-finalizar-spinner" aria-hidden="true"></span>
            <span>Salvando...</span>
          </span>

          <template v-else>
            <span v-if="isFinalizada">
              {{ temAlteracao ? 'Salvar alterações' : 'Partida Finalizada' }}
            </span>
            <span v-else>Finalizar Partida</span>
          </template>
        </button>

      </div>
    </div>
  </div>
</template>

<script>
import api from '@/axios'
import Swal from 'sweetalert2'
import NavBarQuadras from '@/components/quadraplay/NavBarQuadras.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import SidebarCampeonato from '@/components/quadraplay/SidebarCampeonato.vue'
import { carregarCampeonato } from '@/utils/persistirCampeonato'
import { consumirPrefetchPartida } from '@/utils/partidaPrefetch'
import PlacarTimeFutebol from '@/components/quadraplay/Partida/PlacarTimeFutebol.vue'
import PlacarTimeVolei from '@/components/quadraplay/Partida/PlacarTimeVolei.vue'
import PlacarTimeBeachTenis from '@/components/quadraplay/Partida/PlacarTimeBeachTenis.vue'

export default {
  name: 'RegistroPartidaView',

  components: {
    NavBarQuadras,
    LoadingState,
    SidebarCampeonato,
    PlacarTimeFutebol,
    PlacarTimeVolei,
    PlacarTimeBeachTenis
  },

  data() {
    return {
      sidebarCollapsed: false,
      campeonato: null,
      isLoading: true,
      partidaId: null,
      time1: null,
      time2: null,
      partida: null,
      isFinalizando: false,
      parcialTimeA: null,
      parcialTimeB: null,
      parcialTimer: null,
      isSalvandoParcial: false,
      snapshotInicial: null,
      temAlteracao: false,
      acabouDeSalvar: false,
      modalidadesById: {},
      registroMensagemAtual: '',
      registroOperacoesAtivas: 0,
      feedbackAguardandoSalvar: false
    }
  },

  computed: {
    isFinalizada() {
      return this.partida?.status === 'FINALIZADA'
    },

    podeEditar() {
      return !this.isFinalizando && !!this.partidaId
    },


    modalidadeId() {
      return (
        this.partida?.modalidadeId ??
        this.campeonato?.modalidade?.id ??
        this.campeonato?.modalidadeId ??
        null
      )
    },

    modalidadeKey() {
      const id = Number(this.modalidadeId)
      if (!id) return null
      const key = this.modalidadesById[id]
      if (key) return key
      const nome =
        this.partida?.modalidade?.nome ??
        this.campeonato?.modalidade?.nome ??
        ''

      return this.keyDaModalidadePeloNome(nome)
    },
    isGrupoFutebol() {
      return this.modalidadeKey === 'FUTEBOL' || this.modalidadeKey === 'FUTSAL'
    },
    isGrupoVolei() {
      return this.modalidadeKey === 'VOLEI'
    },

    placarComponent() {
      if (this.isGrupoFutebol) return 'PlacarTimeFutebol'
      if (this.isGrupoVolei) return 'PlacarTimeVolei'
      if (this.modalidadeKey === 'BEACH_TENIS') return 'PlacarTimeBeachTenis'
      return null
    },

    placarIdTimeA() {
      return this.partida?.placarTimeAId ?? this.partida?.placarAId ?? this.time1?.placarId ?? null
    },

    placarIdTimeB() {
      return this.partida?.placarTimeBId ?? this.partida?.placarBId ?? this.time2?.placarId ?? null
    },

    placarPropsTimeA() {
      if (!this.partidaId) return {}
      return {
        lado: 'A',
        timeNome: this.time1?.nome,
        timeData: this.time1,
        partidaId: this.partidaId,
        partidaStatus: this.partida?.status || '',
        partidaEncerradaGlobal: this.isFinalizada,
        podeEditar: this.podeEditar,
        placarId: this.placarIdTimeA,
        setsAdversario: Number(this.time2?.setsVencidos ?? 0),
        maxSetsPartida: this.maxSetsPartida,
        maxPontosSet: this.maxPontosSet
      }
    },

    placarPropsTimeB() {
      if (!this.partidaId) return {}
      return {
        lado: 'B',
        timeNome: this.time2?.nome,
        timeData: this.time2,
        partidaId: this.partidaId,
        partidaStatus: this.partida?.status || '',
        partidaEncerradaGlobal: this.isFinalizada,
        podeEditar: this.podeEditar,
        placarId: this.placarIdTimeB,
        setsAdversario: Number(this.time1?.setsVencidos ?? 0),
        maxSetsPartida: this.maxSetsPartida,
        maxPontosSet: this.maxPontosSet
      }
    },

    regrasPartida() {
      return (
        this.partida?.campeonato?.regras ||
        this.campeonato?.regras ||
        {}
      )
    },

    maxSetsPartida() {
      return Math.max(1, Number(this.regrasPartida?.quantidadeSetsPartida ?? 5))
    },

    maxPontosSet() {
      return Math.max(0, Number(this.regrasPartida?.pontosPorSet ?? 25))
    },

    isEmAndamento() {
      return this.partida?.status === 'EM_ANDAMENTO'
    },

    mostrarFeedbackRegistro() {
      return !this.isLoading && (
        this.isFinalizando ||
        this.isSalvandoParcial ||
        this.registroOperacoesAtivas > 0 ||
        this.feedbackAguardandoSalvar
      )
    },

    textoFeedbackRegistro() {
      if (this.isFinalizando) {
        return this.isFinalizada ? 'Salvando alteracoes da partida...' : 'Finalizando partida...'
      }

      if (this.registroMensagemAtual) {
        return this.registroMensagemAtual
      }

      if (this.isSalvandoParcial || this.registroOperacoesAtivas > 0) {
        return 'Registrando alteracao...'
      }

      return ''
    },

    botaoDesabilitado() {
      if (this.isFinalizando || !this.partidaId) return true
      if (this.isFinalizada) return !this.temAlteracao
      return false
    }
  },

  methods: {
    normalizarNomeModalidade(nome) {
      return String(nome || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    },

    keyDaModalidadePeloNome(nome) {
      const n = this.normalizarNomeModalidade(nome)
      if (n.includes('beach') && (n.includes('tenis') || n.includes('tennis'))) return 'BEACH_TENIS'
      if (n.includes('futsal')) return 'FUTSAL'
      if (n.includes('beach soccer') || (n.includes('futebol') && n.includes('areia'))) return 'FUTEBOL'
      if (n.includes('futebol')) return 'FUTEBOL'
      if (
        n.includes('futevolei') ||
        ((n.includes('volei') || n.includes('voleibol')) && n.includes('areia')) ||
        n.includes('volei') ||
        n.includes('voleibol')
      ) return 'VOLEI'

      return null
    },

    async carregarModalidades() {
      const { data } = await api.get('/listar/modalidade')
      const map = {}
      for (const m of (data || [])) {
        const key = this.keyDaModalidadePeloNome(m.nome)
        if (key) map[Number(m.id)] = key
      }

      this.modalidadesById = map
    },

    mapTimeFutebol(time, lado, partida) {
      const quantidadeJogadoresEmCampo = Array.isArray(partida?.jogadoresPartida)
        ? partida.jogadoresPartida.filter(jp =>
          Number(jp?.timeId) === Number(time?.id) && jp?.emCampo
        ).length
        : 0

      return {
        id: time?.id,
        nome: time?.nome,
        foto: time?.foto,
        golspro: lado === 'A' ? (partida.pontosTimeA ?? 0) : (partida.pontosTimeB ?? 0),
        faltas: lado === 'A' ? (partida.faltasTimeA ?? 0) : (partida.faltasTimeB ?? 0),
        substituicoes: lado === 'A' ? (partida.substituicoesTimeA ?? 0) : (partida.substituicoesTimeB ?? 0),
        cartaoamarelo: lado === 'A' ? (partida.cartoesAmarelosTimeA ?? 0) : (partida.cartoesAmarelosTimeB ?? 0),
        cartaovermelho: lado === 'A' ? (partida.cartoesVermelhosTimeA ?? 0) : (partida.cartoesVermelhosTimeB ?? 0),
        wo: lado === 'A' ? !!partida.woTimeA : !!partida.woTimeB,
        quantidadeJogadoresEmCampo,
        placarId: lado === 'A' ? (partida.placarTimeAId) : (partida.placarTimeBId)
      }
    },
    mapTimeVolei(time, lado, partida) {
      const setsVencidos = lado === 'A' ? (partida.pontosTimeA ?? 0) : (partida.pontosTimeB ?? 0)
      const wo = lado === 'A' ? !!partida.woTimeA : !!partida.woTimeB

      let pontosSet = 0

      if (Array.isArray(partida.sets) && partida.sets.length) {
        const totalSets = (partida.pontosTimeA ?? 0) + (partida.pontosTimeB ?? 0)
        const setAtualNum = totalSets + 1
        const setAtual = partida.sets.find(s => Number(s.numero) === Number(setAtualNum))
        if (setAtual) {
          pontosSet = lado === 'A' ? (setAtual.pontosA ?? 0) : (setAtual.pontosB ?? 0)
        }
      }

      const setsJogados = Array.isArray(partida.sets)
        ? partida.sets.map(s => ({
          numero: s.numero,
          pontos: lado === 'A' ? (s.pontosA ?? 0) : (s.pontosB ?? 0),
          time: lado
        }))
        : []

      return {
        id: time?.id,
        nome: time?.nome,
        foto: time?.foto,
        setsVencidos,
        pontosSet,
        wo,
        setsJogados,
        placarId: lado === 'A' ? partida.placarTimeAId : partida.placarTimeBId
      }
    },

    mapTimeBeachTenis(time, lado, partida) {
      const setsVencidos = lado === 'A' ? (partida.pontosTimeA ?? 0) : (partida.pontosTimeB ?? 0)
      const wo = lado === 'A' ? !!partida.woTimeA : !!partida.woTimeB

      // Set atual = soma dos sets vencidos + 1
      const totalSets = (partida.pontosTimeA ?? 0) + (partida.pontosTimeB ?? 0)
      const setAtualNum = totalSets + 1

      let gamesSet = 0
      let pontosTieBreak = 0
      if (Array.isArray(partida.sets) && partida.sets.length) {
        const setAtual = partida.sets.find(s => Number(s.numero) === Number(setAtualNum))
        if (setAtual) {
          gamesSet = lado === 'A' ? (setAtual.gamesA ?? 0) : (setAtual.gamesB ?? 0)
          pontosTieBreak = lado === 'A' ? (setAtual.pontosA ?? 0) : (setAtual.pontosB ?? 0)
        }
      }

      return {
        id: time?.id,
        nome: time?.nome,
        foto: time?.foto,
        setsVencidos,
        gamesSet,
        pontosTieBreak,
        wo,
        placarId: lado === 'A' ? partida.placarTimeAId : partida.placarTimeBId
      }
    },

    aplicarDadosPartida(partida) {
      this.partida = partida

      if (this.modalidadeKey === 'VOLEI') {
        this.time1 = this.mapTimeVolei(partida.timeA, 'A', partida)
        this.time2 = this.mapTimeVolei(partida.timeB, 'B', partida)
      } else if (this.modalidadeKey === 'BEACH_TENIS') {
        this.time1 = this.mapTimeBeachTenis(partida.timeA, 'A', partida)
        this.time2 = this.mapTimeBeachTenis(partida.timeB, 'B', partida)
      } else {
        this.time1 = this.mapTimeFutebol(partida.timeA, 'A', partida)
        this.time2 = this.mapTimeFutebol(partida.timeB, 'B', partida)
      }

      if (this.isFinalizada) {
        if (!this.snapshotInicial || this.acabouDeSalvar) {
          this.setSnapshotInicial()
          this.acabouDeSalvar = false
        } else {
          this.atualizarFlagAlteracao()
        }
      } else {
        this.snapshotInicial = null
        this.temAlteracao = false
        this.acabouDeSalvar = false
      }
    },

    async carregarPartida() {
      if (!this.partidaId) return
      const res = await api.get(`/partidas/${this.partidaId}/retornar`)
      this.aplicarDadosPartida(res.data)
    },

    iniciarFeedbackRegistro(mensagem = 'Registrando alteracao...') {
      this.registroOperacoesAtivas += 1
      this.registroMensagemAtual = mensagem
    },

    sinalizarFeedbackRegistro(mensagem = 'Registrando alteracao...') {
      this.registroMensagemAtual = mensagem
      this.feedbackAguardandoSalvar = true
    },

    finalizarFeedbackRegistro() {
      this.registroOperacoesAtivas = Math.max(0, this.registroOperacoesAtivas - 1)
      this.limparFeedbackRegistro()
    },

    limparFeedbackRegistro() {
      if (this.isFinalizando || this.isSalvandoParcial || this.registroOperacoesAtivas > 0 || this.feedbackAguardandoSalvar) return
      this.registroMensagemAtual = ''
    },

    descreverAcaoRegistro(campo, delta) {
      const removendo = Number(delta) < 0

      if (campo === 'golspro') return removendo ? 'Removendo gol...' : 'Registrando gol...'
      if (campo === 'faltas') return removendo ? 'Removendo falta...' : 'Registrando falta...'
      if (campo === 'substituicoes') return removendo ? 'Removendo substituicao...' : 'Registrando substituicao...'
      if (campo === 'cartaoamarelo') return removendo ? 'Removendo cartao amarelo...' : 'Registrando cartao amarelo...'
      if (campo === 'cartaovermelho') return removendo ? 'Removendo cartao vermelho...' : 'Registrando cartao vermelho...'
      if (campo === 'setsVencidos') return removendo ? 'Ajustando sets vencidos...' : 'Registrando set vencido...'
      if (campo === 'pontosSet') return removendo ? 'Ajustando pontos do set...' : 'Registrando ponto do set...'
      if (campo === 'gamesSet') return removendo ? 'Ajustando games do set...' : 'Registrando game do set...'
      if (campo === 'pontosTieBreak') return removendo ? 'Ajustando tie-break...' : 'Registrando ponto no tie-break...'
      if (campo === 'wo') return removendo ? 'Removendo W.O...' : 'Registrando W.O...'
      return 'Registrando alteracao...'
    },

    async atualizarParcial(payload) {
      if (!this.partidaId) return

      try {
        this.isSalvandoParcial = true
        console.log('payload enviado:', JSON.stringify(payload))
        await api.put(`/partida/${this.partidaId}/parcial`, payload)
        this.atualizarFlagAlteracao()
      } catch (error) {
        console.error('[atualizarParcial] erro:', error)
        const msg = error.response?.data?.error || 'Nao foi possivel atualizar a partida.'
        Swal.fire('Erro', msg, 'error')
      } finally {
        this.isSalvandoParcial = false
        this.feedbackAguardandoSalvar = false
        this.limparFeedbackRegistro()
      }
    },

    async onParcialDelta({ lado, campo, delta }) {
      if (!this.partidaId) return
      if (!this.partida) return

      if (this.isGrupoFutebol) {
        await this.aplicarDeltaFutebol(lado, campo, delta)
        return
      }

      if (this.isGrupoVolei) {
        await this.aplicarDeltaVolei(lado, campo, delta)
        return
      }

      if (this.modalidadeKey === 'BEACH_TENIS') {
        await this.aplicarDeltaBeachTenis(lado, campo, delta)
        return
      }
    },

    async aplicarDeltaFutebol(lado, campo, delta) {
      const p = this.partida
      if (!p) return

      const d = Number(delta || 0)
      if (!Number.isFinite(d) || d === 0) return

      const isA = lado === 'A'
      const clamp0 = (n) => Math.max(0, Number(n || 0))

      const payload = {
        pontosTimeA: clamp0(p.pontosTimeA),
        pontosTimeB: clamp0(p.pontosTimeB),
        faltasTimeA: clamp0(p.faltasTimeA),
        faltasTimeB: clamp0(p.faltasTimeB),
        substituicoesTimeA: clamp0(p.substituicoesTimeA),
        substituicoesTimeB: clamp0(p.substituicoesTimeB),
        cartoesAmarelosTimeA: clamp0(p.cartoesAmarelosTimeA),
        cartoesAmarelosTimeB: clamp0(p.cartoesAmarelosTimeB),
        cartoesVermelhosTimeA: clamp0(p.cartoesVermelhosTimeA),
        cartoesVermelhosTimeB: clamp0(p.cartoesVermelhosTimeB),
        woTimeA: !!p.woTimeA,
        woTimeB: !!p.woTimeB
      }

      const inc = (key) => { payload[key] = clamp0(payload[key] + d) }

      if (campo === 'golspro') inc(isA ? 'pontosTimeA' : 'pontosTimeB')
      else if (campo === 'faltas') inc(isA ? 'faltasTimeA' : 'faltasTimeB')
      else if (campo === 'substituicoes') inc(isA ? 'substituicoesTimeA' : 'substituicoesTimeB')
      else if (campo === 'cartaoamarelo') inc(isA ? 'cartoesAmarelosTimeA' : 'cartoesAmarelosTimeB')
      else if (campo === 'cartaovermelho') inc(isA ? 'cartoesVermelhosTimeA' : 'cartoesVermelhosTimeB')
      else {
        console.warn('[aplicarDeltaFutebol] campo desconhecido:', campo)
        return
      }

      Object.assign(this.partida, payload)
      this.atualizarFlagAlteracao()
      await this.atualizarParcial(payload)
      await this.carregarPartida()
    },

    async aplicarDeltaVolei(lado, campo, delta) {
      const p = this.partida
      if (!p) return

      const d = Number(delta || 0)
      if (!Number.isFinite(d) || d === 0) return

      const isA = lado === 'A'
      const clamp0 = (n) => Math.max(0, Number(n || 0))

      const payload = {
        pontosTimeA: clamp0(p.pontosTimeA),
        pontosTimeB: clamp0(p.pontosTimeB),
        woTimeA: !!p.woTimeA,
        woTimeB: !!p.woTimeB,

        sets: Array.isArray(p.sets)
          ? p.sets.map(s => ({
            numero: Number(s.numero),
            pontosA: clamp0(s.pontosA ?? s.pontosTimeA ?? 0),
            pontosB: clamp0(s.pontosB ?? s.pontosTimeB ?? 0)
          }))
          : []
      }

      const totalSets = payload.pontosTimeA + payload.pontosTimeB
      const setAtualNum = totalSets + 1

      const getOrCreateSetAtual = () => {
        let s = payload.sets.find(x => Number(x.numero) === Number(setAtualNum))
        if (!s) {
          s = { numero: setAtualNum, pontosA: 0, pontosB: 0 }
          payload.sets.push(s)
        }
        s.pontosA = clamp0(s.pontosA)
        s.pontosB = clamp0(s.pontosB)
        return s
      }

      if (campo === 'setsVencidos') {
        if (d > 0) {
          const totalSetsAtual = payload.pontosTimeA + payload.pontosTimeB
          if (totalSetsAtual >= this.maxSetsPartida) return
        }
        if (isA) payload.pontosTimeA = clamp0(payload.pontosTimeA + d)
        else payload.pontosTimeB = clamp0(payload.pontosTimeB + d)
      } else if (campo === 'pontosSet') {
        const setAtual = getOrCreateSetAtual()
        if (d > 0) {
          if (setAtualNum > this.maxSetsPartida) return
        }
        if (isA) setAtual.pontosA = clamp0(setAtual.pontosA + d)
        else setAtual.pontosB = clamp0(setAtual.pontosB + d)

        if (d > 0) {
          const totalSetsAtual = payload.pontosTimeA + payload.pontosTimeB
          const limitePontosSet = this.maxPontosSet

          if (totalSetsAtual < this.maxSetsPartida && limitePontosSet >= 0) {
            const pontosDoLado = isA ? setAtual.pontosA : setAtual.pontosB
            if (pontosDoLado >= limitePontosSet) {
              if (isA) payload.pontosTimeA = clamp0(payload.pontosTimeA + 1)
              else payload.pontosTimeB = clamp0(payload.pontosTimeB + 1)
            }
          }
        }
      } else if (campo === 'wo') {
        if (isA) payload.woTimeA = d > 0
        else payload.woTimeB = d > 0

        if (payload.woTimeA || payload.woTimeB) {
          payload.pontosTimeA = 0
          payload.pontosTimeB = 0
          payload.sets = []
        }
      } else {
        console.warn('[aplicarDeltaVolei] campo desconhecido:', campo)
        return
      }

      Object.assign(this.partida, payload)

      this.atualizarFlagAlteracao()
      await this.atualizarParcial(payload)
      await this.carregarPartida()
    },

    async aplicarDeltaBeachTenis(lado, campo, delta) {
      const p = this.partida
      if (!p) return

      const d = Number(delta || 0)
      if (!Number.isFinite(d) || d === 0) return

      const isA = lado === 'A'
      const clamp0 = (n) => Math.max(0, Number(n || 0))

      const payload = {
        pontosTimeA: clamp0(p.pontosTimeA),
        pontosTimeB: clamp0(p.pontosTimeB),
        woTimeA: !!p.woTimeA,
        woTimeB: !!p.woTimeB,

        sets: Array.isArray(p.sets)
          ? p.sets.map(s => ({
            numero: Number(s.numero),
            pontosA: clamp0(s.pontosA ?? 0),
            pontosB: clamp0(s.pontosB ?? 0),
            gamesA: clamp0(s.gamesA ?? 0),
            gamesB: clamp0(s.gamesB ?? 0)
          }))
          : []
      }

      const totalSets = payload.pontosTimeA + payload.pontosTimeB
      const setAtualNum = totalSets + 1

      const getOrCreateSetAtual = () => {
        let s = payload.sets.find(x => Number(x.numero) === Number(setAtualNum))
        if (!s) {
          s = { numero: setAtualNum, pontosA: 0, pontosB: 0, gamesA: 0, gamesB: 0 }
          payload.sets.push(s)
        }
        s.pontosA = clamp0(s.pontosA)
        s.pontosB = clamp0(s.pontosB)
        s.gamesA = clamp0(s.gamesA)
        s.gamesB = clamp0(s.gamesB)
        return s
      }

      if (campo === 'setsVencidos') {
        if (d > 0) {
          const totalSetsAtual = payload.pontosTimeA + payload.pontosTimeB
          if (totalSetsAtual >= this.maxSetsPartida) return
        }
        if (isA) payload.pontosTimeA = clamp0(payload.pontosTimeA + d)
        else payload.pontosTimeB = clamp0(payload.pontosTimeB + d)

        getOrCreateSetAtual()

      } else if (campo === 'gamesSet') {
        const setAtual = getOrCreateSetAtual()
        if (isA) setAtual.gamesA = clamp0(setAtual.gamesA + d)
        else setAtual.gamesB = clamp0(setAtual.gamesB + d)

      } else if (campo === 'pontosTieBreak') {
        const setAtual = getOrCreateSetAtual()
        if (d > 0) {
          if (setAtualNum > this.maxSetsPartida) return
        }
        if (isA) setAtual.pontosA = clamp0(setAtual.pontosA + d)
        else setAtual.pontosB = clamp0(setAtual.pontosB + d)
      } else if (campo === 'wo') {
        if (isA) payload.woTimeA = d > 0
        else payload.woTimeB = d > 0

        if (payload.woTimeA || payload.woTimeB) {
          payload.pontosTimeA = 0
          payload.pontosTimeB = 0
          payload.sets = []
        }

      } else {
        console.warn('[aplicarDeltaBeachTenis] campo desconhecido:', campo)
        return
      }

      Object.assign(this.partida, payload)
      this.atualizarFlagAlteracao()

      await this.atualizarParcial(payload)
      await this.carregarPartida()
    },

    async incrementarPlacar(placarId, incremento) {
      if (!placarId) {
        console.warn('[incrementarPlacar] placarId não encontrado. Incremento:', incremento)
        return
      }

      try {
        const res = await api.put(`/placar/${placarId}/incrementar`, incremento)
        await this.carregarPartida()
        this.atualizarFlagAlteracao()
        return res.data
      } catch (error) {
        console.error('[incrementarPlacar] erro:', error)
        Swal.fire('Erro', 'error')
      }
    },

    async onIncrementarPlacarTimeA(incremento) {
      await this.incrementarPlacar(this.placarIdTimeA, incremento)
    },

    async onIncrementarPlacarTimeB(incremento) {
      await this.incrementarPlacar(this.placarIdTimeB, incremento)
    },

    async finalizarPartida() {
      if (!this.partidaId) return

      const jaFinalizada = this.isFinalizada
      if (jaFinalizada && !this.temAlteracao) return
      const usaPayloadComSets = this.modalidadeKey === 'VOLEI' || this.modalidadeKey === 'BEACH_TENIS'

      const confirm = await Swal.fire({
        title: jaFinalizada ? 'Salvar alterações?' : 'Finalizar partida?',
        text: jaFinalizada
          ? 'A partida já está finalizada. Vou salvar apenas os dados (sem alterar o status).'
          : 'Depois de finalizada, a partida não deve mais ser editada.',
        icon: jaFinalizada ? 'question' : 'warning',
        showCancelButton: true,
        confirmButtonText: jaFinalizada ? 'Sim, salvar' : 'Sim, finalizar',
        cancelButtonText: 'Cancelar'
      })

      if (!confirm.isConfirmed) return

      this.isFinalizando = true
      this.registroMensagemAtual = this.isFinalizada ? 'Salvando alteracoes da partida...' : 'Finalizando partida...'
      try {
        if (jaFinalizada) {
          const p = this.partida || {}
          const payload = usaPayloadComSets
            ? {
              pontosTimeA: p.pontosTimeA ?? 0,
              pontosTimeB: p.pontosTimeB ?? 0,
              woTimeA: !!p.woTimeA,
              woTimeB: !!p.woTimeB,
              sets: Array.isArray(p.sets) ? p.sets : []
            }
            : {
              pontosTimeA: p.pontosTimeA ?? 0,
              pontosTimeB: p.pontosTimeB ?? 0,
              faltasTimeA: p.faltasTimeA ?? 0,
              faltasTimeB: p.faltasTimeB ?? 0,
              substituicoesTimeA: p.substituicoesTimeA ?? 0,
              substituicoesTimeB: p.substituicoesTimeB ?? 0,
              cartoesAmarelosTimeA: p.cartoesAmarelosTimeA ?? 0,
              cartoesAmarelosTimeB: p.cartoesAmarelosTimeB ?? 0,
              cartoesVermelhosTimeA: p.cartoesVermelhosTimeA ?? 0,
              cartoesVermelhosTimeB: p.cartoesVermelhosTimeB ?? 0,
              woTimeA: !!p.woTimeA,
              woTimeB: !!p.woTimeB
            }

          await api.put(`/partida/${this.partidaId}/parcial`, payload)
          this.acabouDeSalvar = true

          await Swal.fire('Sucesso', 'Alterações salvas!', 'success')
          await this.carregarPartida()
          this.setSnapshotInicial()
          this.$router.push({ name: 'gerenciar_partida', query: { id: this.campeonato?.id } })
          return
        }

        await api.put(`/partidas/${this.partidaId}/finalizar`)
        await Swal.fire('Sucesso', 'Partida finalizada!', 'success')
        await this.carregarPartida()
        this.$router.push({ name: 'gerenciar_partida', query: { id: this.campeonato?.id } })
      } catch (error) {
        const msg =
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Erro ao salvar/finalizar.'
        Swal.fire('Erro', msg, 'error')
      } finally {
        this.isFinalizando = false
        this.feedbackAguardandoSalvar = false
        this.limparFeedbackRegistro()
      }
    },

    criarSnapshotAtual() {
      const p = this.partida
      const usaPayloadComSets = this.modalidadeKey === 'VOLEI' || this.modalidadeKey === 'BEACH_TENIS'

      if (usaPayloadComSets) {
        return JSON.stringify({
          pontosTimeA: p.pontosTimeA ?? 0,
          pontosTimeB: p.pontosTimeB ?? 0,
          woTimeA: !!p.woTimeA,
          woTimeB: !!p.woTimeB,
          sets: Array.isArray(p.sets) ? p.sets : []
        })
      }

      return JSON.stringify({
        pontosTimeA: p.pontosTimeA ?? 0,
        pontosTimeB: p.pontosTimeB ?? 0,
        faltasTimeA: p.faltasTimeA ?? 0,
        faltasTimeB: p.faltasTimeB ?? 0,
        substituicoesTimeA: p.substituicoesTimeA ?? 0,
        substituicoesTimeB: p.substituicoesTimeB ?? 0,
        cartoesAmarelosTimeA: p.cartoesAmarelosTimeA ?? 0,
        cartoesAmarelosTimeB: p.cartoesAmarelosTimeB ?? 0,
        cartoesVermelhosTimeA: p.cartoesVermelhosTimeA ?? 0,
        cartoesVermelhosTimeB: p.cartoesVermelhosTimeB ?? 0,
        woTimeA: !!p.woTimeA,
        woTimeB: !!p.woTimeB
      })
    },

    atualizarFlagAlteracao() {
      if (!this.isFinalizada) return
      if (!this.snapshotInicial) return
      this.temAlteracao = this.criarSnapshotAtual() !== this.snapshotInicial
    },

    setSnapshotInicial() {
      this.snapshotInicial = this.criarSnapshotAtual()
      this.temAlteracao = false
    }
  },

  async mounted() {
    try {
      this.partidaId = this.$route.query.partidaId
      const campeonatoId = Number(this.$route.query.id || 0)
      const cache = consumirPrefetchPartida(this.partidaId, campeonatoId)

      this.campeonato = cache?.campeonato || await carregarCampeonato(this.$route)

      if (cache?.partida) {
        this.aplicarDadosPartida(cache.partida)
      } else {
        await this.carregarModalidades()
        await this.carregarPartida()
      }
    } catch (err) {
      console.error('Erro ao carregar:', err)
      this.campeonato = null
    } finally {
      this.isLoading = false
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
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 24px 28px 32px;
  margin-top: 70px;
  margin-left: 250px;
  background: #f8fafc;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.conteudo.collapsed {
  margin-left: 70px;
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

.title {
  margin: 4px 0 8px;
  font-size: 34px;
  line-height: 0.98;
  color: #2563eb;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.title.title-andamento {
  color: #16a34a;
}

.title.title-finalizada {
  color: #dc2626;
}

.page-subtitle {
  margin: 0;
  max-width: 760px;
  color: #475569;
  font-size: 15px;
  line-height: 1.5;
}

.badge-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  font-weight: 800;
  font-size: 13px;
  margin-top: 0;
  transform: translateY(14px);
  flex: 0 0 auto;
}

.badge-ao-vivo {
  color: #166534;
  border-color: rgba(34, 197, 94, 0.24);
  background: rgba(34, 197, 94, 0.1);
}

.badge-finalizada {
  border-color: rgba(220, 38, 38, 0.22);
  color: #b91c1c;
  background: rgba(220, 38, 38, 0.08);
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  animation: dotPulse 1s infinite;
}

@keyframes dotPulse {
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

@keyframes livePulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.06);
    opacity: 0.85;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}


.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.header-copy {
  min-width: 0;
  transform: translateY(14px);
}

.loader-container-centralizado {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.registro-feedback {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  max-width: 100%;
  margin: 4px 0 10px;
  padding: 11px 14px;
  border-radius: 14px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.96), rgba(219, 234, 254, 0.92));
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.02em;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.08);
}

.registro-feedback-spinner {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid rgba(59, 130, 246, 0.18);
  border-top-color: #3b82f6;
  animation: feedbackSpin 0.8s linear infinite;
  flex: 0 0 auto;
}

@keyframes feedbackSpin {
  to {
    transform: rotate(360deg);
  }
}

.feedback-fade-enter-active,
.feedback-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.feedback-fade-enter-from,
.feedback-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.botao-finalizar {
  width: 100%;
  min-height: 50px;
  padding: 0 16px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  margin-top: 16px;
  box-shadow: 0 12px 22px rgba(59, 130, 246, 0.18);
  transition: transform 0.15s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.botao-finalizar-loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.botao-finalizar-spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  animation: botaoFinalizarSpin 0.75s linear infinite;
  flex: 0 0 14px;
}

.botao-finalizar.botao-finalizar-andamento {
  background: linear-gradient(135deg, #16a34a, #22c55e);
  box-shadow: 0 12px 22px rgba(34, 197, 94, 0.16);
}

.botao-finalizar.botao-finalizar-finalizada {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  box-shadow: 0 12px 22px rgba(239, 68, 68, 0.16);
}

.botao-finalizar:hover:not(:disabled) {
  transform: translateY(-1px);
}

.botao-finalizar:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@keyframes botaoFinalizarSpin {
  to {
    transform: rotate(360deg);
  }
}

.placares {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
  align-items: flex-start;
}

@media (max-width: 768px) {
  .conteudo {
    margin-left: 0;
    margin-top: 34px;
    padding: 14px;
  }

  .conteudo.collapsed {
    margin-left: 0;
  }

  .header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    justify-content: initial;
    gap: 10px;
    margin-top: 0;
    margin-bottom: 12px;
  }

  .section-kicker {
    font-size: 11px;
  }

  .title {
    font-size: 29px;
    margin: 0 0 8px;
    margin-right: 0;
    line-height: 1.05;
    white-space: normal;
    overflow: visible;
    text-overflow: initial;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .header-copy {
    transform: none;
    min-width: 0;
    max-width: 100%;
  }

  .page-subtitle {
    font-size: 13px;
    line-height: 1.55;
  }

  .registro-feedback {
    width: 100%;
    margin: 0 0 12px;
    padding: 12px 14px;
    font-size: 13px;
  }

  .badge-status {
    align-self: start;
    flex-shrink: 0;
    min-height: 34px;
    font-size: 12px;
    padding: 0 10px;
    gap: 8px;
    margin-top: 0;
    border-radius: 12px;
    transform: none;
  }

  .live-dot {
    width: 8px;
    height: 8px;
  }

  .placares {
    grid-template-columns: 1fr;
    gap: 14px;
    margin-top: 14px;
  }

  .botao-finalizar {
    min-height: 48px;
    font-size: 15px;
    margin-top: 0;
  }
}
</style>

