<template>
  <div class="layout">
    <NavBarHome />

    <div class="conteudo">
      <div class="header">
        <div class="header-copy">
          <h1 class="title">Placar e resultados</h1>
          <a class="page-subtitle">
            Acompanhe classificação, partidas e destaques dos campeonatos em um único painel.
          </a>
        </div>

        <div class="partidas-info-card">
          <div class="partidas-info-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3.75a4.5 4.5 0 0 0-4.5 4.5v1.136c0 .646-.214 1.274-.61 1.786l-1.238 1.603A1.75 1.75 0 0 0 7.037 15.5h9.926a1.75 1.75 0 0 0 1.385-2.725l-1.238-1.603a2.997 2.997 0 0 1-.61-1.786V8.25a4.5 4.5 0 0 0-4.5-4.5Z"
                stroke="currentColor"
                stroke-width="1.7"
              />
              <path
                d="M9.75 18a2.25 2.25 0 0 0 4.5 0"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              />
            </svg>
          </div>

          <div class="partidas-info-copy">
            <span class="partidas-info-kicker">Comunicado</span>
            <strong class="partidas-info-title">Gerenciamento de notificações de partidas</strong>
            <p class="partidas-info-description">
              Caso deseje ativar ou desativar as notificações de partidas, acesse a tela
              <strong>Meus Avisos</strong> para realizar esse gerenciamento de forma centralizada.
            </p>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="loader-container-centralizado">
        <LoadingState
          title="Carregando placar e resultados"
          description="Buscando campeonatos, fases e destaques públicos para montar o painel."
        />
      </div>

      <div v-else class="aainel-alacar">
        <div v-if="campeonatos.length" class="painel-card campeonatos-card">
          <div class="section-head">
            <div>
              <span class="section-kicker">Campeonatos</span>
              <h2>Escolha a competição</h2>
              <a>Troque a visualização para acompanhar outra disputa.</a>
            </div>
          </div>

          <div class="abas-container">
            <div v-for="c in campeonatos" :key="c.id" class="aba" :class="{ ativa: campeonatoAtivo === c.id }"
              @click="selecionarCampeonato(c.id)">
              {{ c.nome }}
            </div>
          </div>
        </div>

        <div v-else class="painel-card estado-vazio">
          <h2>Nenhum campeonato publicado</h2>
          <a>Assim que houver uma competição disponível, ela aparecerá aqui.</a>
        </div>

        <template v-if="campeonatoSelecionado">
          <div class="painel-card filtros-card">
            <div class="section-head">
              <div>
                <span class="section-kicker">Navegação</span>
                <h2>Fase e rodada</h2>
                <a>Atualize os filtros para trocar a tabela e os resultados exibidos.</a>
              </div>
            </div>

            <div class="filtros-topo">
              <div class="filtro-item">
                <label for="fase-select" class="filtro-titulo">Fase</label>
                <select id="fase-select" v-model="faseSelecionada" class="filtro-select" @change="onFaseChange">
                  <option disabled value="">Selecione a fase</option>
                  <option v-for="fase in fases" :key="fase.id" :value="fase.id">
                    {{ fase.nome }}
                  </option>
                </select>
              </div>

              <div class="filtro-item">
                <label for="rodada-select" class="filtro-titulo">Rodada</label>
                <select id="rodada-select" v-model="rodadaSelecionada" class="filtro-select" @change="onRodadaChange">
                  <option disabled value="">Selecione a rodada</option>
                  <option v-for="rodada in rodadas" :key="rodada.id" :value="rodada.id">
                    {{ rodada.nome }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="placar-e-partidas" :class="{ 'placar-e-partidas-simples': faseAtualEhEliminatoria }">
            <div class="painel-card placar-wrapper">
              <div class="section-head">
                <div>
                  <span class="section-kicker">{{ faseAtualEhEliminatoria ? 'Eliminatórias' : 'Classificação' }}</span>
                  <h2>{{ tituloPainelClassificacao }}</h2>
                  <a>{{ subtituloPainelClassificacao }}</a>
                </div>
              </div>

              <TabelaClassificacao
                v-if="campeonatoAtivo && !faseAtualEhEliminatoria"
                :times="Array.isArray(timesPlacar) ? timesPlacar : []"
                :loading="timesPlacar === null" :modalidade="modalidadeNormalizada"
                :colunas-visiveis="colunasClassificacaoVisiveis"
                :grupos-config="gruposClassificacao"
                :exibir-por-grupos="exibirClassificacaoPorGrupo"
                empty-text="Nenhum placar encontrado para este campeonato."
                @time-click="abrirModalPartidasTime"
              />

              <ListaPartidas
                v-else-if="campeonatoAtivo && faseAtualEhEliminatoria"
                :partidas="partidas"
                :loading="deveMostrarLoadingPartidas"
                loading-title="Carregando confrontos eliminatórios"
                loading-description="Buscando confrontos da rodada para montar o mata-mata."
                empty-title="Nenhum confronto cadastrado nesta rodada."
                empty-subtitle="Assim que as partidas forem criadas, os confrontos aparecerão aqui."
                :enable-scroll="temScrollPartidas"
                quadra-class="nome-quadra-visualizar"
                empty-align="left"
                @time-click="abrirModalPartidasTime"
              />

              <div v-else class="sem-dados-centralizado sem-dados-alinhado">
                Nenhuma tabela de classificação disponível no momento.
              </div>
            </div>

            <div v-if="!faseAtualEhEliminatoria" class="painel-card partidas-wrapper">
              <div class="section-head">
                <div>
                  <span class="section-kicker">Resultados</span>
                  <h2>Partidas da rodada</h2>
                  <a>{{ resumoNavegacaoAtual }}</a>
                </div>
              </div>

              <ListaPartidas :partidas="partidas" :loading="deveMostrarLoadingPartidas"
                loading-title="Carregando partidas da rodada"
                loading-description="Buscando confrontos, horários e status da rodada selecionada."
                empty-title="Nenhuma partida cadastrada ainda"
                empty-subtitle="Assim que as partidas forem criadas ou iniciadas, elas aparecerão aqui."
                :enable-scroll="temScrollPartidas" quadra-class="nome-quadra-visualizar" empty-align="left"
                @time-click="abrirModalPartidasTime" />
            </div>
          </div>

          <div v-if="campeonatoAtivo && !isVolei" class="painel-card artilharia-wrapper">
            <div class="section-head">
              <div>
                <span class="section-kicker">Ranking</span>
                <h2>Artilharia</h2>
                <a>Os jogadores com mais gols marcados no campeonato.</a>
              </div>
            </div>

            <div v-if="loadingArtilharia" class="loader-container-centralizado">
              <LoadingState
                size="compact"
                title="Carregando artilharia"
                description="Somando gols e organizando o ranking dos jogadores em destaque."
              />
            </div>

            <div v-else-if="!artilharia || artilharia.length === 0" class="sem-dados-centralizado">
              Nenhum gol registrado neste campeonato.
            </div>

            <table v-else class="artilharia-table">
              <thead>
                <tr>
                  <th>Ranking</th>
                  <th>Gols</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(jogador, index) in artilharia" :key="jogador.jogadorId">
                  <td class="jogador-info">
                    <span class="posicao">{{ index + 1 }}º</span>
                    <img v-if="jogador.foto" :src="jogador.foto" class="foto-jogador" />
                    <span class="nome-jogador">{{ jogador.nome }}</span>
                  </td>
                  <td class="gols-destaque">{{ jogador.gols }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <PartidasDoTimeModal v-model="mostrarModalPartidasTime" :time="timeSelecionadoPartidas" :partidas="partidas"
          :fase-nome="nomeFaseSelecionada" :rodada-nome="nomeRodadaSelecionada"
          :campeonato-nome="campeonatoSelecionado?.nome || ''" :loading="isLoadingPartidas" />
      </div>
    </div>
    <Footer />
  </div>
</template>

<script>
import api from '@/axios'
import NavBarHome from '@/components/NavBarHome.vue'
import Footer from '@/components/Footer.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import TabelaClassificacao from '@/components/quadraplay/TabelaClassificacao.vue'
import ListaPartidas from '@/components/quadraplay/ListaPartidas.vue'
import PartidasDoTimeModal from '@/components/quadraplay/PartidasDoTimeModal.vue'
import {
  EVENTO_CAMPEONATO_ATUALIZADO,
  obterSocket,
  inscreverCampeonatoSocket,
  desinscreverCampeonatoSocket
} from '@/utils/socket'
import { ordenarPartidasPorStatusEDataDesc } from '@/utils/partidaOrdenacao'

export default {
  name: 'VisualizarPlacarHome',
  components: { NavBarHome, Footer, LoadingState, TabelaClassificacao, ListaPartidas, PartidasDoTimeModal },

  data() {
    return {
      campeonatos: [],
      campeonatoAtivo: null,
      fases: [],
      rodadas: [],
      faseSelecionada: '',
      rodadaSelecionada: '',
      partidas: [],
      isLoadingPartidas: false,
      partidasInicializadas: false,
      mostrarModalPartidasTime: false,
      timeSelecionadoPartidas: null,
      timesPlacar: null,
      isLoading: false,
      artilharia: [],
      loadingArtilharia: false,
      socket: null,
      socketCampeonatoId: null,
      onSocketAtualizacao: null,
      socketTimerPartidas: null,
      socketTimerPlacar: null,
      gruposClassificacao: null
    }
  },

  computed: {
    campeonatoSelecionado() {
      return this.campeonatos.find(c => c.id === this.campeonatoAtivo)
    },

    modalidadeNormalizada() {
      if (!this.campeonatoSelecionado?.modalidade?.nome) return ''
      return this.campeonatoSelecionado.modalidade.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    },

    colunasClassificacaoVisiveis() {
      return Array.isArray(this.campeonatoSelecionado?.regras?.colunasClassificacao)
        ? this.campeonatoSelecionado.regras.colunasClassificacao
        : []
    },
    exibirClassificacaoPorGrupo() {
      return typeof this.campeonatoSelecionado?.regras?.exibirClassificacaoPorGrupo === 'boolean'
        ? this.campeonatoSelecionado.regras.exibirClassificacaoPorGrupo
        : true
    },

    isVolei() {
      return ['volei', 'volei de areia', 'futevolei', 'beach tenis', 'beach tennis'].includes(this.modalidadeNormalizada)
    },

    temScrollPartidas() {
      return Array.isArray(this.partidas) && this.partidas.length >= 10
    },
    deveMostrarLoadingPartidas() {
      return this.isLoadingPartidas || !this.partidasInicializadas
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
      const tipoCampeonato = this.normalizarTexto(this.campeonatoSelecionado?.tipo)
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

    tituloPainelClassificacao() {
      if (this.faseAtualEhEliminatoria) {
        if (this.nomeRodadaSelecionada) {
          return `Confrontos - ${this.nomeRodadaSelecionada}`
        }

        return this.nomeFaseSelecionada
          ? `Confrontos da ${this.nomeFaseSelecionada}`
          : 'Confrontos eliminatórios'
      }

      return 'Tabela do campeonato'
    },

    subtituloPainelClassificacao() {
      if (this.faseAtualEhEliminatoria) {
        if (this.nomeFaseSelecionada && this.nomeRodadaSelecionada) {
          return `Fase ${this.nomeFaseSelecionada}  Rodada ${this.nomeRodadaSelecionada}. Toque em um time para abrir o histórico completo de partidas.`
        }

        return 'Toque em um time para abrir o histórico completo de partidas.'
      }

      return 'Toque em um time para abrir o histórico completo de partidas.'
    },

    resumoNavegacaoAtual() {
      const aartes = []
      if (this.nomeFaseSelecionada) aartes.push(this.nomeFaseSelecionada)
      if (this.nomeRodadaSelecionada) aartes.push(this.nomeRodadaSelecionada)
      return aartes.join(' | ')
    }
  },

  methods: {
    abrirModalPartidasTime(time) {
      this.timeSelecionadoPartidas = time
      this.mostrarModalPartidasTime = true
    },

    normalizarTexto(valor) {
      return String(valor || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    },

    conectarSocket() {
      this.socket = obterSocket()

      if (!this.onSocketAtualizacao) {
        this.onSocketAtualizacao = payload => this.tratarAtualizacaoCampeonato(payload)
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
        this.carregarPartidasPorRodada()
      }, 150)
    },

    agendarAtualizacaoPlacarSocket() {
      clearTimeout(this.socketTimerPlacar)
      this.socketTimerPlacar = setTimeout(() => {
        if (this.campeonatoAtivo) this.carregarPlacar(this.campeonatoAtivo)
      }, 150)
    },

    tratarAtualizacaoCampeonato(payload) {
      const campeonatoEvento = Number(payload?.campeonatoId)
      const campeonatoAtual = Number(this.campeonatoAtivo)

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

      if (['PARTIDA_CRIADA', 'PARTIDA_FINALIZADA', 'CLASSIFICACAO_ATUALIZADA', 'STATUS_PARTIDA_ATUALIZADO'].includes(tipo)) {
        if (mesmaFase && mesmaRodada) {
          this.agendarAtualizacaoPartidasSocket()
        }

        if (tipo !== 'PARTIDA_CRIADA' && mesmaFase) {
          this.agendarAtualizacaoPlacarSocket()
        }
      }
    },

    async selecionarCampeonato(id) {
      this.campeonatoAtivo = id
      this.fases = []
      this.rodadas = []
      this.faseSelecionada = ''
      this.rodadaSelecionada = ''
      this.partidas = []
      this.partidasInicializadas = false
      this.timesPlacar = null

      this.inscreverSocketAtual(id)

      const camp = this.campeonatos.find(c => c.id === id)
      const mod = (camp?.modalidade?.nome || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      const ehVolei = ['volei', 'volei de areia', 'futevolei', 'beach tenis', 'beach tennis'].includes(mod)

      const tarefas = [this.carregarFases(id)]

      if (!ehVolei) tarefas.push(this.carregarArtilharia(id))
      else {
        this.artilharia = []
        this.loadingArtilharia = false
      }

      await Promise.all(tarefas)
    },

    async carregarCampeonatos() {
      this.isLoading = true
      try {
        const { data } = await api.get('/todos/campeonatos')
        this.campeonatos = Array.isArray(data) ? data : []
        if (this.campeonatos.length) {
          await this.selecionarCampeonato(this.campeonatos[0].id)
        }
      } catch (err) {
        console.error('Erro ao carregar campeonatos:', err)
      } finally {
        this.isLoading = false
      }
    },

    async carregarFases(campeonatoId) {
      try {
        const { data } = await api.get(`/fases/${campeonatoId}/`, { silent: true })
        this.fases = Array.isArray(data) ? data : []

        if (!this.fases.length) {
          this.faseSelecionada = ''
          this.rodadas = []
          this.rodadaSelecionada = ''
          this.partidas = []
          this.partidasInicializadas = true
          this.timesPlacar = []
          this.gruposClassificacao = null
          return
        }

        this.faseSelecionada = this.fases[0].id
        const faseSelecionadaObj = this.fases.find(f => f.id === this.faseSelecionada)
        this.rodadas = Array.isArray(faseSelecionadaObj?.rodadas) ? faseSelecionadaObj.rodadas : []
        this.rodadaSelecionada = this.rodadas.length ? this.rodadas[0].id : ''

        await this.carregarPartidasPorRodada()
        await this.carregarPlacar(campeonatoId)
      } catch (err) {
        console.error('Erro ao carregar fases:', err)
        this.fases = []
        this.rodadas = []
        this.faseSelecionada = ''
        this.rodadaSelecionada = ''
        this.partidas = []
        this.partidasInicializadas = true
      }
    },

    async onFaseChange() {
      const fase = this.fases.find(f => f.id === this.faseSelecionada)
      this.rodadas = Array.isArray(fase?.rodadas) ? fase.rodadas : []
      this.rodadaSelecionada = this.rodadas.length ? this.rodadas[0].id : ''

      await this.carregarPartidasPorRodada()
      await this.carregarPlacar(this.campeonatoAtivo)
    },

    async onRodadaChange() {
      await this.carregarPartidasPorRodada()
    },

    async carregarPartidasPorRodada() {
      this.isLoadingPartidas = true

      if (!this.campeonatoAtivo || !this.faseSelecionada || !this.rodadaSelecionada) {
        this.partidas = []
        this.partidasInicializadas = true
        this.isLoadingPartidas = false
        return
      }

      try {
        const { data } = await api.get(
          `/partidas/${this.campeonatoAtivo}/${this.faseSelecionada}/${this.rodadaSelecionada}`,
          { silent: true }
        )

        const lista = Array.isArray(data) ? data : []
        this.partidas = ordenarPartidasPorStatusEDataDesc(lista)
      } catch (err) {
        console.error('Erro ao carregar partidas por rodada:', err)
        this.partidas = []
      } finally {
        this.isLoadingPartidas = false
        this.partidasInicializadas = true
      }
    },

    async carregarPlacar(campeonatoId) {
      if (!this.faseSelecionada) return
      this.timesPlacar = null

      try {
        const { data } = await api.get(`/placar/fase/${campeonatoId}`, {
          params: { faseId: this.faseSelecionada },
          silent: true
        })

        if (!Array.isArray(data)) {
          this.timesPlacar = []
          return
        }

        const fase = data.find(f => f.faseId == this.faseSelecionada)
        this.timesPlacar = Array.isArray(fase?.placares) ? fase.placares : []
        await this.carregarColunasClassificacao(campeonatoId)
      } catch (err) {
        console.error('Erro ao carregar placar da fase:', err)
        this.timesPlacar = []
      }
    },

    async carregarColunasClassificacao(campeonatoId) {
      if (!campeonatoId) return

      try {
        const { data } = await api.get(`/ordem/classificacao/${campeonatoId}`, { silent: true })
        const colunas = Array.isArray(data?.colunas) ? data.colunas : []
        const grupos = data?.grupos && typeof data.grupos === 'object' ? data.grupos : null
        const exibirPorGrupos = typeof data?.exibirPorGrupos === 'boolean' ? data.exibirPorGrupos : true

        this.gruposClassificacao = grupos

        this.campeonatos = this.campeonatos.map(campeonato => {
          if (Number(campeonato.id) !== Number(campeonatoId)) return campeonato
          return {
            ...campeonato,
            regras: {
              ...(campeonato.regras || {}),
              colunasClassificacao: colunas,
              grupos,
              exibirClassificacaoPorGrupo: exibirPorGrupos
            }
          }
        })
      } catch (err) {
        console.error('Erro ao carregar colunas da classificação:', err)
      }
    },

    async carregarArtilharia(campeonatoId) {
      this.loadingArtilharia = true
      this.artilharia = []

      try {
        const { data } = await api.get(`/${campeonatoId}/artilharia`)
        this.artilharia = Array.isArray(data) ? data : []
      } catch (err) {
        console.error('Erro ao carregar artilharia:', err)
        this.artilharia = []
      } finally {
        this.loadingArtilharia = false
      }
    }
  },

  mounted() {
    this.conectarSocket()
    this.carregarCampeonatos()
  },

  beforeUnmount() {
    clearTimeout(this.socketTimerPartidas)
    clearTimeout(this.socketTimerPlacar)
    this.desconectarSocket()
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
    margin-top: 64px;
    padding: 20px 60px;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 12px;
}

.header-copy {
  max-width: 660px;
}

.title {
  margin: 8px 0 6px;
  color: #2563eb;
  font-size: 34px;
  line-height: 1;
  letter-spacing: -0.04em;
}

.page-subtitle {
  margin: 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.45;
}

.partidas-info-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 24px;
  border: 1px solid rgba(37, 99, 235, 0.16);
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(255, 255, 255, 0.96)),
    #ffffff;
  box-shadow: 0 16px 34px rgba(37, 99, 235, 0.08);
}

.partidas-info-icon {
  width: 50px;
  height: 50px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(37, 99, 235, 0.2);
}

.partidas-info-icon svg {
  width: 22px;
  height: 22px;
}

.partidas-info-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.partidas-info-kicker {
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.partidas-info-title {
  color: #0f172a;
  font-size: 18px;
  line-height: 1.1;
}

.partidas-info-description {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
}

.aainel-alacar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.painel-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.94);
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

.estado-vazio {
  text-align: center;
  padding: 42px 24px;
}

.estado-vazio h2 {
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 28px;
}

.estado-vazio a {
  margin: 0;
  color: #64748b;
  font-size: 15px;
}

.abas-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.campeonatos-card {
  padding: 18px 20px;
  border-radius: 24px;
}

.campeonatos-card .section-head {
  margin-bottom: 14px;
}

.campeonatos-card .section-head h2 {
  margin: 4px 0 6px;
  font-size: 24px;
}

.campeonatos-card .section-head a {
  font-size: 13px;
  line-height: 1.45;
}

.campeonatos-card .abas-container {
  gap: 10px;
}

.aba {
  min-height: 54px;
  padding: 14px 18px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 20px;
  background: rgba(248, 250, 252, 0.92);
  color: #334155;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.campeonatos-card .aba {
  min-height: 48px;
  padding: 10px 16px;
  border-radius: 18px;
  font-size: 14px;
}

.aba:hover {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.34);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.12);
}

.aba.ativa {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(96, 165, 250, 0.14));
  border-color: rgba(37, 99, 235, 0.52);
  color: #1d4ed8;
}

.filtros-topo {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.filtros-card {
  padding: 18px 20px;
  border-radius: 24px;
}

.filtros-card .section-head {
  margin-bottom: 14px;
}

.filtros-card .section-head h2 {
  margin: 4px 0 6px;
  font-size: 24px;
}

.filtros-card .section-head a {
  font-size: 13px;
  line-height: 1.45;
}

.filtro-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filtro-titulo {
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.filtro-select {
  width: 100%;
  min-height: 48px;
  padding: 11px 14px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.34);
  background: #f8fafc;
  color: #0f172a;
  font: inherit;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.filtro-select:hover {
  border-color: rgba(59, 130, 246, 0.36);
}

.filtro-select:focus {
  outline: none;
  border-color: rgba(37, 99, 235, 0.6);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.14);
  background: #fff;
}

.placar-e-partidas {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.95fr);
  gap: 20px;
  align-items: start;
}

.placar-e-partidas.placar-e-partidas-simples {
  grid-template-columns: minmax(0, 1fr);
}

.placar-wrapper,
.partidas-wrapper,
.artilharia-wrapper {
  min-width: 0;
}

.loader-container-centralizado {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 180px;
}

.loader {
  border: 6px solid #dbeafe;
  border-top: 6px solid #2563eb;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  animation: spin 1s linear infinite;
}

.sem-dados-centralizado {
  text-align: center;
  color: #64748b;
  padding: 28px 0 8px;
}

.sem-dados-centralizado.sem-dados-alinhado {
  text-align: left;
}

.artilharia-table {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 20px;
}

.artilharia-table thead th {
  padding: 14px 16px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  text-align: left;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.artilharia-table thead th:last-child,
.artilharia-table tbody td:last-child {
  width: 110px;
  text-align: center;
}

.artilharia-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.92);
  background: rgba(255, 255, 255, 0.96);
}

.artilharia-table tbody tr:last-child td {
  border-bottom: none;
}

.jogador-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.posicao {
  color: #2563eb;
  min-width: 34px;
  font-size: 15px;
  font-weight: 800;
}

.foto-jogador {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(59, 130, 246, 0.14);
}

.nome-jogador {
  color: #0f172a;
  font-weight: 700;
}

.gols-destaque {
  color: #2563eb;
  font-size: 18px;
  font-weight: 800;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .placar-e-partidas {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .conteudo {
    margin-top: 42px;        
    padding: 12px 14px 16px; 
  }

  .header {
    margin-top: -15px;       
    margin-bottom: 12px;
  }

  .header-copy {
    max-width: 100%;
  }

  .title {
    margin: 0 0 8px;         
    font-size: 30px;     
    line-height: 1.04;
  }

  .page-subtitle {
    font-size: 14px;
    line-height: 1.55;
  }

  .partidas-info-card {
    grid-template-columns: 1fr;
    align-items: flex-start;
    gap: 12px;
    padding: 14px;
    border-radius: 20px;
  }

  .partidas-info-icon {
    width: 44px;
    height: 44px;
    border-radius: 16px;
  }

  .partidas-info-title {
    font-size: 16px;
  }

  .partidas-info-description {
    font-size: 12px;
  }

  .painel-card {
    padding: 18px;
    border-radius: 24px;
  }

  .section-head {
    margin-bottom: 16px;
  }

  .section-head h2 {
    font-size: 24px;
  }

  .campeonatos-card {
    padding: 14px;
    border-radius: 20px;
  }

  .campeonatos-card .section-head {
    margin-bottom: 12px;
  }

  .campeonatos-card .section-head h2 {
    font-size: 20px;
  }

  .campeonatos-card .section-head a {
    font-size: 13px;
    line-height: 1.45;
  }

  .abas-container {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .campeonatos-card .abas-container {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .aba {
    min-height: 62px;
    align-items: center;
    display: flex;
    justify-content: center;
    text-align: center;
  }

  .campeonatos-card .aba {
    min-height: 42px;
    padding: 6px 4px;
    border-radius: 12px;
    font-size: 11px;
    line-height: 1.2;
  }

  .filtros-topo {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .filtro-item {
    gap: 6px;
  }

  .filtro-select {
    padding: 10px 12px;
    border-radius: 12px;
  }

  .artilharia-table thead th,
  .artilharia-table tbody td {
    padding: 12px 10px;
  }
}
</style>
