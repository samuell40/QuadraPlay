<template>
  <div class="layout">
    <NavBarQuadras />
    <SidebarCampeonato @sidebar-toggle="sidebarCollapsed = $event" />

    <div class="conteudo" :class="{ collapsed: sidebarCollapsed, 'campeonato-finalizado': isCampeonatoEncerrado }">
      <div class="header">
        <div class="header-copy">
          <h1 class="title">Classificação {{ campeonato?.nome }}</h1>
          <a class="page-subtitle">
            Acompanhe a tabela da fase atual, ajuste as colunas exibidas e abra o histórico completo de cada time.
          </a>
        </div>

        <button v-if="!isCampeonatoEncerrado" class="btn-add" @click="abrirConfiguracoes">
          <span class="btn-add-icon" aria-hidden="true">⚙</span>
          <span class="btn-add-label">Configuracoes</span>
        </button>
      </div>

      <template v-if="isLoading">
        <div class="loader-container-centralizado">
          <LoadingState
            :theme="isCampeonatoEncerrado ? 'danger' : 'default'"
            title="Carregando campeonato"
            description="Buscando fases, rodadas, classificacao e partidas."
          />
        </div>
      </template>

      <template v-else>
      <div v-if="campeonato" class="painel-card filtros-card">
        <div class="section-head">
          <div class="section-head-copy">
            <span class="section-kicker">Navegação</span>
            <h2>Fase e rodada</h2>
            <a>Atualize os filtros para trocar a classificação exibida sem sair da mesma tela.</a>
          </div>

        </div>

        <div v-if="fases.length" class="filtros-topo">
          <div class="filtro-item">
            <label class="filtro-titulo" for="fase-select">Fase</label>
            <select id="fase-select" class="filtro-select" v-model="faseSelecionada" @change="onFaseChange">
              <option disabled value="">Selecione a fase</option>
              <option v-for="fase in fases" :key="fase.id" :value="fase.id">{{ fase.nome }}</option>
            </select>
          </div>
          <div class="filtro-item">
            <label class="filtro-titulo" for="rodada-select">Rodada</label>
            <select id="rodada-select" class="filtro-select" v-model="rodadaSelecionada" :disabled="!rodadas.length" @change="onRodadaChange">
              <option disabled value="">Selecione a rodada</option>
              <option v-for="rodada in rodadas" :key="rodada.id" :value="rodada.id">{{ rodada.nome }}</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="campeonato" class="painel-card placar-wrapper">
        <div class="section-head">
          <div class="section-head-copy">
            <span class="section-kicker">Classificação</span>
            <div class="section-title-row">
              <h2>{{ tituloTabela }}</h2>

              <button
                v-if="temGruposDefinidos && !faseAtualEhEliminatoria"
                type="button"
                class="grupo-toggle grupo-toggle-mobile-only"
                :class="{ ativo: exibirClassificacaoPorGrupo }"
                :aria-pressed="exibirClassificacaoPorGrupo ? 'true' : 'false'"
                @click="alternarExibicaoGrupos"
              >
                <span class="grupo-toggle-label grupo-toggle-label-desktop">Classificacao por Grupo</span>
                <span class="grupo-toggle-label grupo-toggle-label-mobile">Grupos</span>
                <span class="grupo-toggle-track">
                  <span class="grupo-toggle-thumb"></span>
                </span>
              </button>
            </div>
            <a>{{ subtituloTabela }}</a>
          </div>

          <button
            v-if="temGruposDefinidos && !faseAtualEhEliminatoria"
            type="button"
            class="grupo-toggle grupo-toggle-desktop-only"
            :class="{ ativo: exibirClassificacaoPorGrupo }"
            :aria-pressed="exibirClassificacaoPorGrupo ? 'true' : 'false'"
            @click="alternarExibicaoGrupos"
          >
            <span class="grupo-toggle-label grupo-toggle-label-desktop">Classificacao por Grupo</span>
            <span class="grupo-toggle-track">
              <span class="grupo-toggle-thumb"></span>
            </span>
          </button>
        </div>

        <TabelaClassificacao
          v-if="!faseAtualEhEliminatoria"
          :times="Array.isArray(timesPlacar) ? timesPlacar : []"
          :loading="timesPlacar === null"
          :loading-theme="isCampeonatoEncerrado ? 'danger' : 'default'"
          :theme="isCampeonatoEncerrado ? 'finalizado' : 'default'"
          :modalidade="modalidadeNormalizada"
          :colunas-visiveis="colunasClassificacaoVisiveis"
          :grupos-config="gruposClassificacao"
          :exibir-por-grupos="exibirClassificacaoPorGrupo"
          empty-text="Nenhum placar encontrado para esta fase."
          @time-click="abrirModalPartidasTime"
        />

        <ListaPartidas
          v-else
          :partidas="partidas"
          :loading="isLoadingPartidas"
          loading-title="Carregando confrontos eliminatorios"
          loading-description="Buscando confrontos da rodada para montar o mata-mata."
          empty-title="Nenhum confronto cadastrado nesta rodada."
          empty-subtitle="Crie as partidas desta fase para montar as eliminatorias."
          :enable-scroll="true"
          empty-align="left"
          @time-click="abrirModalPartidasTime"
        />
      </div>
      </template>
      
      <PartidasDoTimeModal
        v-model="mostrarModalPartidasTime"
        :time="timeSelecionadoPartidas"
        :partidas="partidas"
        :fase-nome="nomeFaseSelecionada"
        :rodada-nome="nomeRodadaSelecionada"
        :campeonato-nome="campeonato?.nome || ''"
        :loading="isLoadingPartidas"
      />
      <ModalConfiguracoesPlacar
        v-if="campeonato && !isCampeonatoEncerrado"
        v-model="modalConfiguracoes"
        :campeonato="campeonato"
        :times-placar="Array.isArray(timesPlacar) ? timesPlacar : []"
        :colunas-visiveis="colunasVisiveisClassificacao"
        :grupos-config="gruposClassificacao"
        :exibir-por-grupos="exibirClassificacaoPorGrupo"
        :fase-nome="nomeFaseSelecionada"
        :rodada-nome="nomeRodadaSelecionada"
        @faseCriada="carregarFases"
        @colunas="atualizarColunasClassificacao"
        @grupos="abrirModalGrupos"
      />

      <ModalConfigurarGrupos
        v-if="campeonato"
        v-model="modalGrupos"
        :campeonato-id="campeonato.id"
        @salvo="atualizarGruposClassificacao"
      />

    </div>
  </div>
</template>

<script>
import NavBarQuadras from '@/components/quadraplay/NavBarQuadras.vue'
import SidebarCampeonato from '@/components/quadraplay/SidebarCampeonato.vue'
import { carregarCampeonato } from '@/utils/persistirCampeonato'
import ModalConfiguracoesPlacar from '@/components/quadraplay/ModalConfiguracoesPlacar.vue'
import ModalConfigurarGrupos from '@/components/quadraplay/ModalConfigurarGrupos.vue'
import PartidasDoTimeModal from '@/components/quadraplay/PartidasDoTimeModal.vue'
import TabelaClassificacao from '@/components/quadraplay/TabelaClassificacao.vue'
import ListaPartidas from '@/components/quadraplay/ListaPartidas.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import api from '@/axios'
import {
  getColunasClassificacaoPorModalidade,
  resolverColunasVisiveisClassificacao
} from '@/utils/classificacaoColunas'
import {
  EVENTO_CAMPEONATO_ATUALIZADO,
  obterSocket,
  inscreverCampeonatoSocket,
  desinscreverCampeonatoSocket
} from '@/services/socket'
import { ordenarPartidasPorStatusEDataDesc } from '@/utils/partidaOrdenacao'

export default {
  name: 'ClassificacaoView',
  components: {
    SidebarCampeonato,
    NavBarQuadras,
    ModalConfiguracoesPlacar,
    ModalConfigurarGrupos,
    PartidasDoTimeModal,
    TabelaClassificacao,
    ListaPartidas,
    LoadingState
  },

  data() {
    return {
      sidebarCollapsed: false,
      campeonato: null,
      fases: [],
      faseSelecionada: '',
      rodadas: [],
      rodadaSelecionada: '',
      timesPlacar: null,
      partidas: [],
      isLoadingPartidas: false,
      mostrarModalPartidasTime: false,
      timeSelecionadoPartidas: null,
      isLoading: true,
      modalConfiguracoes: false,
      modalGrupos: false,
      colunasClassificacaoVisiveis: [],
      gruposClassificacao: null,
      exibirClassificacaoPorGrupo: true,
      socket: null,
      socketCampeonatoId: null,
      onSocketAtualizacao: null,
      socketTimerPlacar: null,
      socketTimerPartidas: null
    }
  },

  computed: {
    modalidadeNormalizada() {
      return String(this.campeonato?.modalidade?.nome || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    },

    isGrupoFutebol() {
      return ['futebol', 'futebol de areia', 'futsal'].includes(this.modalidadeNormalizada)
    },

    isGrupoVolei() {
      return ['volei', 'volei de areia', 'futevolei'].includes(this.modalidadeNormalizada)
    },

    isGrupoBeachTenis() {
      return ['beach tenis', 'beach tennis'].includes(this.modalidadeNormalizada)
    },

    temTabela() {
      return Array.isArray(this.timesPlacar) && this.timesPlacar.length > 0
    },

    temGruposDefinidos() {
      return Array.isArray(this.gruposClassificacao?.grupos) && this.gruposClassificacao.grupos.length > 0
    },

    colunasVisiveisClassificacao() {
      const colunasConfiguradas = this.colunasClassificacaoVisiveis.length
        ? this.colunasClassificacaoVisiveis
        : this.campeonato?.regras?.colunasClassificacao

      return resolverColunasVisiveisClassificacao(
        this.modalidadeNormalizada,
        colunasConfiguradas
      )
    },

    colunasVisiveisSet() {
      return new Set(this.colunasVisiveisClassificacao)
    },

    colunasTabelaClassificacao() {
      const mapa = new Map(
        getColunasClassificacaoPorModalidade(this.modalidadeNormalizada)
          .map(coluna => [coluna.key, coluna])
      )

      return this.colunasVisiveisClassificacao
        .map(chave => mapa.get(chave))
        .filter(Boolean)
    },

    nomeFaseSelecionada() {
      return this.fases.find(f => Number(f.id) === Number(this.faseSelecionada))?.nome || ''
    },

    nomeRodadaSelecionada() {
      return this.rodadas.find(r => Number(r.id) === Number(this.rodadaSelecionada))?.nome || ''
    },

    nomeFaseSelecionadaNormalizada() {
      return this.normalizarTexto(this.nomeFaseSelecionada)
    },

    faseAtualEhEliminatoria() {
      const tipoCampeonato = this.normalizarTexto(this.campeonato?.tipo)
      const faseAtual = this.nomeFaseSelecionadaNormalizada
      const rodadaAtual = this.normalizarTexto(this.nomeRodadaSelecionada)

      const possuiTermoEliminatoria = /(eliminat|mata ?mata|playoff)/.test(faseAtual)
      const rodadaEhMataMata = /(dezesseis avos|oitavas|quartas|semi ?final|final|repescagem)/.test(rodadaAtual)

      if (tipoCampeonato === 'eliminatorias') {
        return true
      }

      if (tipoCampeonato === 'pontos_corridos_eliminatorias') {
        return possuiTermoEliminatoria || rodadaEhMataMata
      }

      return possuiTermoEliminatoria
    },

    tituloTabela() {
      if (this.faseAtualEhEliminatoria) {
        if (this.nomeRodadaSelecionada) {
          return `Confrontos - ${this.nomeRodadaSelecionada}`
        }

        return this.nomeFaseSelecionada
          ? `Confrontos da ${this.nomeFaseSelecionada}`
          : 'Confrontos eliminatorios'
      }

      return this.nomeFaseSelecionada ? `Tabela da ${this.nomeFaseSelecionada}` : 'Tabela do campeonato'
    },

    subtituloTabela() {
      if (this.faseAtualEhEliminatoria) {
        if (this.nomeFaseSelecionada && this.nomeRodadaSelecionada) {
          return `Fase ${this.nomeFaseSelecionada}  Rodada ${this.nomeRodadaSelecionada}. Toque em um time para abrir o historico completo de partidas.`
        }

        return 'Toque em um time para abrir o historico completo de partidas.'
      }

      if (this.nomeFaseSelecionada && this.nomeRodadaSelecionada) {
        return `Fase ${this.nomeFaseSelecionada}  Rodada ${this.nomeRodadaSelecionada}. Toque em um time para abrir o historico completo de partidas.`
      }

      return 'Toque em um time para abrir o historico completo de partidas.'
    },

    isCampeonatoEncerrado() {
      const status = String(this.campeonato?.status || '').toUpperCase()
      return ['FINALIZADO', 'FINALIZADA', 'CANCELADO', 'CANCELADA', 'DELETADO', 'DELETADA'].includes(status)
    }
  },

  async mounted() {
    this.conectarSocket()

    try {
      this.campeonato = await carregarCampeonato(this.$route)
      if (this.campeonato?.id) {
        this.inscreverSocketAtual(this.campeonato.id)
        await this.carregarFases()
      } else {
        this.timesPlacar = []
      }
    } catch (err) {
      console.error('Erro ao carregar classificação:', err)
      this.timesPlacar = []
      this.campeonato = null
    } finally {
      this.isLoading = false
    }
  },

  beforeUnmount() {
    clearTimeout(this.socketTimerPlacar)
    clearTimeout(this.socketTimerPartidas)
    this.desconectarSocket()
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

    agendarAtualizacaoPlacarSocket() {
      clearTimeout(this.socketTimerPlacar)
      this.socketTimerPlacar = setTimeout(() => {
        this.carregarPlacarPorFase()
      }, 150)
    },

    agendarAtualizacaoPartidasSocket() {
      clearTimeout(this.socketTimerPartidas)
      this.socketTimerPartidas = setTimeout(() => {
        this.carregarPartidasPorRodada()
      }, 150)
    },

    tratarAtualizacaoCampeonato(payload) {
      const campeonatoEvento = Number(payload?.campeonatoId)
      const campeonatoAtual = Number(this.campeonato?.id)

      if (!campeonatoEvento || !campeonatoAtual || campeonatoEvento !== campeonatoAtual) {
        return
      }

      const tipo = String(payload?.tipo || '')
      const faseEvento = Number(payload?.faseId)
      const rodadaEvento = Number(payload?.rodadaId)
      const mesmaFase = !faseEvento || Number(this.faseSelecionada) === faseEvento
      const mesmaRodada = !rodadaEvento || Number(this.rodadaSelecionada) === rodadaEvento

      if (tipo === 'GOL_PARTIDA') {
        if (mesmaFase && mesmaRodada) {
          this.agendarAtualizacaoPartidasSocket()
        }
        return
      }

      if (['PARTIDA_CRIADA', 'PARTIDA_FINALIZADA', 'STATUS_PARTIDA_ATUALIZADO'].includes(tipo)) {
        if (mesmaFase && mesmaRodada) {
          this.agendarAtualizacaoPartidasSocket()
        }
      }

      if (['PARTIDA_FINALIZADA', 'CLASSIFICACAO_ATUALIZADA', 'STATUS_PARTIDA_ATUALIZADO'].includes(tipo)) {
        if (mesmaFase) {
          this.agendarAtualizacaoPlacarSocket()
        }
      }
    },

    abrirConfiguracoes() {
      if (this.isCampeonatoEncerrado) return
      this.modalConfiguracoes = true
    },

    abrirModalGrupos() {
      this.modalGrupos = true
    },

    alternarExibicaoGrupos() {
      if (!this.temGruposDefinidos) return
      this.exibirClassificacaoPorGrupo = !this.exibirClassificacaoPorGrupo
    },

    normalizarTexto(valor) {
      return String(valor || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    },

    mostrarColuna(chave) {
      return this.colunasVisiveisSet.has(chave)
    },

    formatarValorColuna(time, chave) {
      if (chave === 'aproveitamento') {
        return `${time?.aproveitamento ?? 0}%`
      }

      if (chave === 'pontosAverage') {
        const valor = Number(time?.pontosAverage ?? 0)
        return Number.isFinite(valor) ? valor.toFixed(2) : '0.00'
      }

      return time?.[chave] ?? ''
    },

    atualizarColunasClassificacao(colunas) {
      const colunasResolvidas = resolverColunasVisiveisClassificacao(
        this.modalidadeNormalizada,
        colunas
      )

      this.colunasClassificacaoVisiveis = colunasResolvidas
      this.campeonato = {
        ...(this.campeonato || {}),
        regras: {
          ...(this.campeonato?.regras || {}),
          colunasClassificacao: colunasResolvidas
        }
      }
    },

    atualizarGruposClassificacao(grupos) {
      const tinhaGruposDefinidos = Array.isArray(this.gruposClassificacao?.grupos)
        && this.gruposClassificacao.grupos.length > 0

      this.gruposClassificacao = grupos && typeof grupos === 'object' ? grupos : null
      const temGruposDefinidos = Array.isArray(this.gruposClassificacao?.grupos)
        && this.gruposClassificacao.grupos.length > 0

      if (!temGruposDefinidos) {
        this.exibirClassificacaoPorGrupo = false
      } else if (!tinhaGruposDefinidos) {
        this.exibirClassificacaoPorGrupo = true
      }

      this.campeonato = {
        ...(this.campeonato || {}),
        regras: {
          ...(this.campeonato?.regras || {}),
          grupos: this.gruposClassificacao
        }
      }
    },

    async carregarConfiguracoesClassificacao() {
      if (!this.campeonato?.id) return

      try {
        const { data } = await api.get(`/ordem/classificacao/${this.campeonato.id}`)
        const colunas = Array.isArray(data?.colunas) ? data.colunas : []
        const grupos = data?.grupos && typeof data.grupos === 'object' ? data.grupos : null

        this.atualizarColunasClassificacao(colunas)
        this.atualizarGruposClassificacao(grupos)
      } catch (err) {
        console.error('Erro ao carregar configuracoes da classificacao:', err)
      }
    },

    abrirModalPartidasTime(time) {
      this.timeSelecionadoPartidas = this.normalizarTimePlacar(time)
      if (!this.timeSelecionadoPartidas) return
      this.mostrarModalPartidasTime = true
    },

    normalizarTimePlacar(time) {
      const payload = {
        id: Number(time?.timeId ?? time?.time?.id ?? time?.id),
        nome: time?.time?.nome ?? time?.nome ?? '',
        foto: time?.time?.foto ?? time?.foto ?? ''
      }

      if (!Number.isFinite(payload.id) || payload.id <= 0) return null
      return payload
    },

    atualizarRodadasDaFase() {
      const fase = this.fases.find(f => Number(f.id) === Number(this.faseSelecionada))
      this.rodadas = Array.isArray(fase?.rodadas) ? fase.rodadas : []
      this.rodadaSelecionada = this.rodadas.length ? this.rodadas[0].id : ''
    },

    async onFaseChange() {
      this.atualizarRodadasDaFase()
      await this.carregarPlacarPorFase()
      await this.carregarPartidasPorRodada()
    },

    async onRodadaChange() {
      await this.carregarPartidasPorRodada()
    },

    async carregarFases() {
      if (!this.campeonato?.id) return

      try {
        const { data } = await api.get(`/fases/${this.campeonato.id}/`)
        this.fases = Array.isArray(data) ? data : []

        if (!this.fases.length) {
          this.faseSelecionada = ''
          this.rodadas = []
          this.rodadaSelecionada = ''
          this.partidas = []
          this.timesPlacar = []
          this.gruposClassificacao = null
          return
        }

        this.faseSelecionada = this.fases[0].id
        this.atualizarRodadasDaFase()

        await this.carregarPlacarPorFase()
        await this.carregarPartidasPorRodada()
      } catch (err) {
        console.error('Erro ao carregar fases:', err)
        this.fases = []
        this.faseSelecionada = ''
        this.rodadas = []
        this.rodadaSelecionada = ''
        this.partidas = []
        this.timesPlacar = []
      }
    },

    async carregarPlacarPorFase() {
      if (!this.faseSelecionada) return

      this.timesPlacar = null

      try {
        const { data } = await api.get(`/placar/fase/${this.campeonato.id}`,
          {
            params: {
              faseId: this.faseSelecionada
            }
          }
        )

        if (data?.placares) {
          this.timesPlacar = data.placares
          await this.carregarConfiguracoesClassificacao()
          return
        }

        if (Array.isArray(data)) {
          const fase = data.find(f => f.faseId == this.faseSelecionada)
          this.timesPlacar = fase?.placares || []
          await this.carregarConfiguracoesClassificacao()
          return
        }

        this.timesPlacar = []
      } catch (err) {
        console.error('Erro ao carregar placar da fase:', err)
        this.timesPlacar = []
      }
    },

    async carregarPartidasPorRodada() {
      this.isLoadingPartidas = true

      try {
        if (!this.campeonato?.id || !this.faseSelecionada || !this.rodadaSelecionada) {
          this.partidas = []
          return
        }

        const { data } = await api.get(`/partidas/${this.campeonato.id}/${this.faseSelecionada}/${this.rodadaSelecionada}`)
        const lista = Array.isArray(data) ? data : []

        this.partidas = ordenarPartidasPorStatusEDataDesc(lista)
      } catch (err) {
        console.error('Erro ao carregar partidas por rodada:', err)
        this.partidas = []
      } finally {
        this.isLoadingPartidas = false
      }
    },

    obterUltimosJogos(time) {
      const candidatas = [
        time?.ultimosJogos,
        time?.ultimos_jogos,
        time?.ultimosResultados,
        time?.ultimos_resultados,
        time?.historico,
        time?.recentes,
        time?.forma,
        time?.form
      ]

      const bruto = candidatas.find(valor => Array.isArray(valor) || typeof valor === 'string')
      let resultados = []

      if (Array.isArray(bruto)) {
        resultados = bruto.map(item => this.normalizarResultadoItem(item, time))
      } else if (typeof bruto === 'string') {
        resultados = this.extrairResultadosDeTexto(bruto)
      }

      const normalizados = resultados
        .map(item => this.normalizarResultadoTexto(item))
        .filter(item => ['V', 'E', 'D', '-'].includes(item))
        .slice(0, 3)

      while (normalizados.length < 3) normalizados.push('-')
      return normalizados
    },
    extrairResultadosDeTexto(texto) {
      const bruto = String(texto || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()

      if (!bruto) return []

      const separadores = /[,\s;/|-]/
      const tokens = separadores.test(bruto)
        ? bruto.split(/[,\s;/|-]+/).filter(Boolean)
        : bruto.split('')

      return tokens.map(token => this.normalizarResultadoTexto(token))
    },
    normalizarResultadoItem(item, time) {
      if (item == null) return '-'

      if (typeof item === 'string' || typeof item === 'number') {
        return this.normalizarResultadoTexto(item)
      }

      if (typeof item !== 'object') return '-'

      const valorDireto =
        item.resultado ??
        item.status ??
        item.tipo ??
        item.code ??
        item.valor ??
        item.sigla

      if (valorDireto != null) {
        const direto = this.normalizarResultadoTexto(valorDireto)
        if (direto !== '-') return direto
      }

      if (item.venceu === true || item.vitoria === true) return 'V'
      if (item.empatou === true || item.empate === true) return 'E'
      if (item.perdeu === true || item.derrota === true) return 'D'

      const timeId = time?.timeId ?? time?.time?.id ?? time?.id
      const vencedorId = item.vencedorId ?? item.timeVencedorId ?? item.ganhadorId
      if (timeId != null && vencedorId != null) {
        return String(vencedorId) === String(timeId) ? 'V' : 'D'
      }

      const pontosPro = item.golsPro ?? item.pontosPro ?? item.pontos ?? item.marcados
      const pontosContra = item.golsContra ?? item.golsSofridos ?? item.pontosContra ?? item.sofridos
      if (Number.isFinite(Number(pontosPro)) && Number.isFinite(Number(pontosContra))) {
        if (Number(pontosPro) > Number(pontosContra)) return 'V'
        if (Number(pontosPro) < Number(pontosContra)) return 'D'
        return 'E'
      }

      return '-'
    },
    normalizarResultadoTexto(valor) {
      const token = String(valor || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()

      if (['V', 'W', 'WIN', 'WON', 'VITORIA', 'VITORIAS', 'GANHOU'].includes(token)) return 'V'
      if (['E', 'DRAW', 'EMPATE', 'EMPATES', 'TIE'].includes(token)) return 'E'
      if (['D', 'L', 'LOSS', 'LOST', 'DERROTA', 'DERROTAS', 'PERDEU', 'X'].includes(token)) return 'D'
      if (['-', 'N', 'NULL', 'SEM'].includes(token)) return '-'
      return '-'
    },
    classeResultado(resultado) {
      if (resultado === 'V') return 'resultado-v'
      if (resultado === 'E') return 'resultado-e'
      if (resultado === 'D') return 'resultado-d'
      return 'resultado-n'
    },
    simboloResultado(resultado) {
      if (resultado === 'V') return '\u2713'
      if (resultado === 'D') return '\u2715'
      return '-'
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
  flex-direction: column;
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
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.header-copy {
  flex: 1;
  min-width: 0;
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
  color: #475569;
  font-size: 17px;
  line-height: 1.6;
  white-space: nowrap;
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

.conteudo.campeonato-finalizado .filtros-card .section-head h2 {
  color: #991b1b;
}

.conteudo.campeonato-finalizado .filtro-select:hover {
  border-color: rgba(239, 68, 68, 0.38);
}

.conteudo.campeonato-finalizado .filtro-select:focus {
  border-color: rgba(185, 28, 28, 0.58);
  box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.2);
}

.conteudo.campeonato-finalizado .btn-add,
.conteudo.campeonato-finalizado .grupo-toggle.ativo {
  background: linear-gradient(135deg, #b91c1c, #ef4444);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fff;
}

.btn-add {
  min-height: 46px;
  padding: 0 18px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border: 1px solid rgba(59, 130, 246, 0.32);
  border-radius: 18px;
  color: #fff;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: -0.02em;
  white-space: nowrap;
  box-shadow: 0 14px 26px rgba(59, 130, 246, 0.22);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-add-icon {
  display: inline-block;
  font-size: 16px;
  line-height: 1;
}

.btn-add-label {
  line-height: 1.2;
}

.btn-add:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(59, 130, 246, 0.28);
}

.btn-add:active {
  transform: translateY(0);
}

.card-quadra {
  position: relative;
  width: 100%;
  height: 360px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
}

.imagem-quadra {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.overlay {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  color: white;
  padding: 16px;
}

.campeonato-nome {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.loader-container-centralizado {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 0;
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
  margin-bottom: 16px;
}

.section-head-copy {
  min-width: 0;
  flex: 1;
}

.section-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin: 6px 0 8px;
}

.section-title-row h2 {
  flex: 1;
  min-width: 0;
}

.section-head h2 {
  margin: 0;
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

.grupo-toggle {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 220px;
  padding: 8px 10px 8px 14px;
  border: 1px solid rgba(59, 130, 246, 0.22);
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.08);
  color: #1e3a8a;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.grupo-toggle:hover {
  border-color: rgba(59, 130, 246, 0.34);
  box-shadow: 0 14px 30px rgba(59, 130, 246, 0.12);
}

.grupo-toggle:focus-visible {
  outline: none;
  border-color: rgba(37, 99, 235, 0.52);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.14);
}

.grupo-toggle-label {
  min-width: 0;
  text-align: left;
}

.grupo-toggle-label-mobile {
  display: none;
}

.grupo-toggle-mobile-only {
  display: none;
}

.grupo-toggle-desktop-only {
  display: inline-flex;
  align-self: flex-start;
  margin-top: 34px;
}

.grupo-toggle-track {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 48px;
  height: 28px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.42);
  transition: background-color 0.18s ease;
}

.grupo-toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
  transition: transform 0.18s ease;
}

.grupo-toggle.ativo {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.32);
}

.grupo-toggle.ativo .grupo-toggle-track {
  background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
}

.grupo-toggle.ativo .grupo-toggle-thumb {
  transform: translateX(20px);
}

.filtros-card {
  margin-bottom: 18px;
  padding: 16px 18px;
  border-radius: 24px;
}

.filtros-card .section-head {
  margin-bottom: 10px;
}

.filtros-card .section-head h2 {
  font-size: 22px;
}

.filtros-card .section-head a {
  font-size: 13px;
  line-height: 1.45;
}

.filtros-topo {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.filtro-item {
  display: flex;
  flex-direction: column;
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

.filtro-select {
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.34);
  font: inherit;
  color: #0f172a;
  background-color: #f8fafc;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.filtro-select:hover {
  border-color: rgba(59, 130, 246, 0.36);
}

.filtro-select:focus {
  outline: none;
  border-color: rgba(37, 99, 235, 0.6);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.14);
  background-color: #fff;
}

.placar-wrapper {
  min-width: 0;
}

.titulo-secao {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
}

.placar-table {
  margin-top: 20px;
  width: 100%;
  overflow-x: auto;
  border-radius: 10px;
}

.placar {
  width: 100%;
  min-width: 1000px;
  border-collapse: collapse;
  font-size: 14px;
}

.placar thead th {
  background-color: #3b82f6;
  color: white;
  font-weight: 600;
  padding: 14px 12px;
  text-align: left;
  white-space: nowrap;
}

.placar tbody tr {
  background-color: white;
  transition: background-color 0.2s ease;
}

.placar tbody tr:hover {
  background-color: #f3f4f6;
}

.placar tbody td {
  color: #374151;
  padding: 12px;
  font-size: 14px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.col-ultimos {
  text-align: center !important;
  min-width: 136px;
}

.ultimos-jogos-cell {
  min-width: 136px;
}

.ultimos-jogos {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.resultado-item {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.resultado-v {
  background-color: #16a34a;
  color: #fff;
}

.resultado-e {
  background-color: #9ca3af;
  color: #fff;
}

.resultado-d {
  background-color: #ef4444;
  color: #fff;
}

.resultado-n {
  background-color: #cbd5e1;
  color: #334155;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-info.time-info-click {
  cursor: pointer;
}

.time-info.time-info-click .nome-time {
  text-decoration: underline;
}

.posicao {
  font-weight: bold;
  font-size: 14px;
  min-width: 28px;
  text-align: right;
  color: #3b82f6;
}

.time-image {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 50%;
  border: 1px solid #d1d5db;
}

.nome-time {
  font-weight: 500;
  color: #7e7e7e;
}

.glossario-placar {
  margin-top: 12px;
  padding: 10px 12px;
  background: #f5f6fa;
  border-radius: 6px;
  font-size: 12px;
  color: #333;
}

.glossario-placar strong {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
}

.glossario-placar ul {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 4px 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.glossario-placar li b {
  color: #152147;
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
    margin-top: 0;
    margin-bottom: 12px;
    gap: 10px;
  }

  .header-copy {
    max-width: 100%;
  }

  .title {
    margin: 0 0 8px;
    font-size: 30px;
    line-height: 1.04;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .page-subtitle {
    font-size: 14px;
    line-height: 1.55;
    white-space: normal;
  }

  .btn-add {
    width: auto;
    align-self: flex-start;
    min-height: 42px;
    padding: 0 14px;
    border-radius: 14px;
    font-size: 13px;
    letter-spacing: -0.01em;
    white-space: normal;
    text-align: left;
    gap: 6px;
  }

  .btn-add-icon { font-size: 16px; }

  .painel-card {
    padding: 18px;
    border-radius: 24px;
  }

  .section-head {
    margin-bottom: 14px;
  }

  .grupo-toggle-desktop-only {
    display: none;
  }

  .grupo-toggle-mobile-only {
    display: inline-flex;
  }

  .grupo-toggle {
    gap: 6px;
    min-width: 0;
    padding: 4px 6px 4px 10px;
    font-size: 12px;
  }

  .section-head h2 {
    font-size: 24px;
  }

  .section-title-row {
    align-items: center;
    gap: 10px;
    margin: 6px 0 10px;
  }

  .grupo-toggle-label-desktop {
    display: none;
  }

  .grupo-toggle-label-mobile {
    display: inline;
  }

  .grupo-toggle-track {
    width: 38px;
    height: 22px;
  }

  .grupo-toggle-thumb {
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
  }

  .grupo-toggle.ativo .grupo-toggle-thumb {
    transform: translateX(16px);
  }

  .filtros-card {
    padding: 14px 16px;
    margin-bottom: 16px;
  }

  .filtros-topo {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .filtro-item {
    gap: 6px;
  }

  .filtro-select {
    min-height: 42px;
    padding: 9px 10px;
    border-radius: 12px;
  }

  .placar-wrapper {
    padding: 16px;
  }
}
</style>





