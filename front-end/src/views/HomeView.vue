  <template>
    <div class="layout">
      <NavBarHome />
    
      <section class="texto-centro">
        <div class="conteudo-centralizado hero-grid">
          <div class="hero-copy">
            <h1 class="texto">
              <span class="texto-desktop-lines">
                <span class="primeira-linha">Agende sua Quadra</span>
                <span class="primeira-linha">em <span class="destaque_sublinhado">São Vicente</span></span>
                <span class="segunda-linha destaque">de forma Rápida e Fácil.</span>
              </span>

              <span class="texto-mobile-lines">
                <span class="linha-mobile">Agende sua</span>
                <span class="linha-mobile">Quadra</span>
                <span class="linha-mobile linha-mobile-em">em <span class="destaque_sublinhado">São Vicente</span></span>
                <span class="linha-mobile">de forma</span>
                <span class="linha-mobile segunda-linha linha-mobile-rapida">Rápida e Fácil.</span>
              </span>
            </h1>
            <p class="hero-subtitle">Com o Quadra Play SV, você reserva em poucos cliques.</p>
          </div>

          <div class="hero-visual" aria-hidden="true">
            <div class="hero-ring">
              <img :src="heroLogo" alt="" class="hero-logo" />
            </div>
          </div>
        </div>
      </section>

      <section id="quadras-disponiveis" class="quadras-section">
        <div class="quadras-shell">
          <div class="quadras-head">
            <div>
              <span class="section-kicker">Agendamento</span>
              <h2 class="tit_horario">Quadras Disponíveis</h2>
              <a class="quadras-subtitle">Escolha a melhor opção para o seu próximo treino!</a>
            </div>
          </div>

          <section class="agendamento">
            <template v-if="isLoadingQuadras">
              <LoadingState
                size="compact"
                title="Carregando quadras"
                description="Buscando unidades e modalidades disponíveis para o agendamento público."
              />
            </template>
            <template v-else>
              <button class="btn-prev" @click="prev">&lt;</button>
              <Carousel ref="carousel" :itemsToShow="1" :wrapAround="true" :mouseDrag="true" :autoplay="3000"
                :pauseAutoplayOnHover="true" :transition="600" :breakpoints="{ 768: { itemsToShow: 3 } }" class="carousel">
                <Slide v-for="quadra in quadras" :key="quadra.id">
                  <div class="card" :class="{ 'is-interditada': quadra.interditada }">
                    <img :src="quadra.foto" :alt="quadra.nome" class="imagem-quadra" />

                    <div class="overlay">
                      <div class="card-copy">
                        <h3 class="nome-quadra">{{ quadra.nome }}</h3>

                        <div class="card-tags">
                          <span class="tag-modalidade" :class="{ 'tag-modalidade-muted': !quadra.endereco }">
                            {{ quadra.endereco || 'Endereço não informado' }}
                          </span>
                        </div>
                      </div>

                      <button class="btn-agendar" :disabled="quadra.interditada"
                        @click="!quadra.interditada && verificarLogin(quadra)">
                        {{ quadra.interditada ? 'Indisponível' : 'Agendar agora' }}
                      </button>
                    </div>
                  </div>
                </Slide>
              </Carousel>
              <button class="btn-next" @click="next">&gt;</button>
            </template>
          </section>
        </div>
      </section>

      <section v-if="temCampeonatoCadastrado" class="painel-home">
        <div class="painel-card filtros-card">
          <div class="section-head">
            <div>
              <span class="section-kicker">Navegação</span>
              <h2>Fase e rodadas</h2>
              <a>Atualize os filtros para trocar a tabela e os resultados exibidos.</a>
            </div>
          </div>

          <div class="filtros-topo">
            <div class="filtro-item">
              <label class="filtro-titulo">Fase</label>
              <select v-model="faseSelecionada" class="filtro-select" @change="onFaseChange">
                <option disabled value="">Selecione a Fase</option>
                <option v-for="fase in fases" :key="fase.id" :value="fase.id">
                  {{ fase.nome }}
                </option>
              </select>
            </div>

            <!-- Rodada desktop -->
            <div v-if="!isMobile || faseAtualEhEliminatoria" class="filtro-item">
              <label class="filtro-titulo">Rodada</label>
              <select v-model="rodadaSelecionada" class="filtro-select" :disabled="!rodadas.length"
                @change="carregarPartidasPorRodada">
                <option disabled value="">Selecione a Rodada</option>
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
                <span class="section-kicker">{{ faseAtualEhEliminatoria ? 'Eliminatorias' : 'Classificacao' }}</span>
                <h2>{{ tituloPainelClassificacao }}</h2>
                <a>{{ subtituloPainelClassificacao }}</a>
              </div>
            </div>

            <TabelaClassificacao
              v-if="!faseAtualEhEliminatoria"
              :times="placarHomeTop5"
              :loading="isLoadingPlacar"
              :modalidade="modalidadeNormalizada"
              :show-glossary="false"
              :colunas-visiveis="colunasClassificacaoHome"
              :grupos-config="gruposClassificacao"
              theme="navegacao"
              compact-mobile-no-scroll
              @time-click="abrirModalPartidasTime"
            />

            <button
              v-if="!faseAtualEhEliminatoria && !isLoadingPlacar"
              type="button"
              class="btn-ver-completo"
              @click="irParaVisualizarPlacar"
            >
              Ver tabela completa
            </button>

            <ListaPartidas
              v-if="faseAtualEhEliminatoria"
              :partidas="partidas"
              :loading="isLoadingPartidas"
              loading-title="Carregando confrontos eliminatórios"
              loading-description="Buscando confrontos da rodada para montar o mata-mata."
              empty-title="Nenhum confronto disponível no momento."
              empty-subtitle="Assim que as partidas forem criadas, os confrontos aparecerão aqui."
              quadra-class="nome-quadra-home"
              empty-align="left"
              @time-click="abrirModalPartidasTime"
            />
          </div>

          <div v-if="!faseAtualEhEliminatoria" class="painel-card partidas-wrapper">
            <div class="section-head">
              <div>
                <span class="section-kicker">Resultados</span>
                <h2>Partidas da rodada</h2>
                <a>
                  {{ nomeFaseSelecionada ? `Fase: ${nomeFaseSelecionada}` : '' }}
                  {{ nomeRodadaSelecionada ? `  Rodada: ${nomeRodadaSelecionada}` : '' }}
                </a>
              </div>
            </div>

            <!-- Rodada mobile -->
            <div v-if="isMobile" class="filtro-item filtro-rodada-mobile">
              <label class="filtro-titulo">Rodada</label>
              <select v-model="rodadaSelecionada" class="filtro-select" :disabled="!rodadas.length"
                @change="carregarPartidasPorRodada">
                <option disabled value="">Selecione a Rodada</option>
                <option v-for="rodada in rodadas" :key="rodada.id" :value="rodada.id">
                  {{ rodada.nome }}
                </option>
              </select>
            </div>

            <ListaPartidas
              :partidas="partidasHomeTop5"
              :loading="isLoadingPartidas"
              empty-title="Nenhuma partida disponivel no momento."
              quadra-class="nome-quadra-home"
              @time-click="abrirModalPartidasTime"
            />

            <button
              v-if="!isLoadingPartidas && partidasHomeTop5.length > 0"
              type="button"
              class="btn-ver-completo"
              @click="irParaVisualizarPlacar"
            >
              Ver todas as partidas
            </button>
          </div>
        </div>
      </section>

      <PartidasDoTimeModal v-model="mostrarModalPartidasTime" :time="timeSelecionadoPartidas" :partidas="partidas"
        :fase-nome="nomeFaseSelecionada" :rodada-nome="nomeRodadaSelecionada" :campeonato-nome="nomeCampeonato"
        :loading="isLoadingPartidas" />
      <button v-if="mostrarBotaoTopo" type="button" class="btn-topo" @click="subirPagina">
        &uarr;
      </button>
      <Footer />
    </div>
  </template>

<script>
import NavBarHome from '@/components/NavBarHome.vue'
import Footer from '@/components/Footer.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import router from '@/router'
import { Carousel, Slide } from 'vue3-carousel'
import Swal from 'sweetalert2'
import api from '@/axios'
import { useAuthStore } from '@/store'
import TabelaClassificacao from '@/components/quadraplay/TabelaClassificacao.vue'
import ListaPartidas from '@/components/quadraplay/ListaPartidas.vue'
import PartidasDoTimeModal from '@/components/quadraplay/PartidasDoTimeModal.vue'
import {
  EVENTO_CAMPEONATO_ATUALIZADO,
  obterSocket,
  inscreverCampeonatoSocket,
  desinscreverCampeonatoSocket
} from '@/services/socket'
import { ordenarPartidasPorStatusEDataDesc } from '@/utils/partidaOrdenacao'
import heroLogo from '@/assets/logo.png'
import 'vue3-carousel/dist/carousel.css'

export default {
  name: 'HomeView',
  components: { NavBarHome, Footer, LoadingState, Carousel, Slide, TabelaClassificacao, ListaPartidas, PartidasDoTimeModal },

  data() {
    return {
      heroLogo,
      quadras: [],
      isLoadingQuadras: true,
      campeonatoAtual: null,
      campeonatoId: null,
      fases: [],
      rodadas: [],
      faseSelecionada: '',
      rodadaSelecionada: '',
      placar: [],
      isLoadingPlacar: true,
      partidas: [],
      isLoadingPartidas: true,
      mostrarModalPartidasTime: false,
      timeSelecionadoPartidas: null,
      mostrarBotaoTopo: false,
      isMobile: window.innerWidth <= 768,
      socket: null,
      socketCampeonatoId: null,
      onSocketAtualizacao: null,
      socketTimerPartidas: null,
      socketTimerPlacar: null,
      gruposClassificacao: null
    }
  },

  computed: {
    nomeCampeonato() {
      return this.campeonatoAtual?.nome
    },
    modalidadeNormalizada() {
      return String(this.campeonatoAtual?.modalidade?.nome || 'futebol')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
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
      const tipoCampeonato = this.normalizarTexto(this.campeonatoAtual?.tipo)
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

      if (this.nomeCampeonato) {
        return `Tabela do ${this.nomeCampeonato}`
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
    colunasClassificacaoHome() {
      return ['pontuacao', 'jogos', 'vitorias', 'derrotas']
    },
    placarHomeTop5() {
      return Array.isArray(this.placar) ? this.placar.slice(0, 5) : []
    },
    partidasHomeTop5() {
      return Array.isArray(this.partidas) ? this.partidas.slice(0, 5) : []
    },
    temCampeonatoCadastrado() {
      const campeonatoId = Number(this.campeonatoId)
      return Number.isInteger(campeonatoId) && campeonatoId > 0
    }
  },

  async mounted() {
    this.conectarSocket()

    const onResize = () => {
      this.isMobile = window.innerWidth <= 768
    }

    window.addEventListener('resize', onResize)
    this._onResize = onResize
    window.addEventListener('scroll', this.atualizarVisibilidadeBotaoTopo, { passive: true })

    await Promise.all([
      this.carregarQuadras(),
      this.carregarCampeonatoMaisRecente()
    ])
  },

  beforeUnmount() {
    window.removeEventListener('scroll', this.atualizarVisibilidadeBotaoTopo)
    window.removeEventListener('resize', this._onResize)
    clearTimeout(this.socketTimerPartidas)
    clearTimeout(this.socketTimerPlacar)
    this.desconectarSocket()
  },

  methods: {
    abrirModalPartidasTime(time) {
      this.timeSelecionadoPartidas = time
      this.mostrarModalPartidasTime = true
    },
    irParaVisualizarPlacar() {
      router.push({ name: 'visualizar_placarhome' })
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
        this.carregarPartidasPorRodada()
      }, 150)
    },

    agendarAtualizacaoPlacarSocket() {
      clearTimeout(this.socketTimerPlacar)
      this.socketTimerPlacar = setTimeout(() => {
        if (this.campeonatoId) this.carregarPlacarPorFase(this.campeonatoId)
      }, 150)
    },

    tratarAtualizacaoCampeonato(payload) {
      const campeonatoEvento = Number(payload?.campeonatoId)
      const campeonatoAtual = Number(this.campeonatoId)

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

    atualizarVisibilidadeBotaoTopo() {
      this.mostrarBotaoTopo = window.scrollY > 300
    },

    subirPagina() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    next() {
      if (this.$refs.carousel) this.$refs.carousel.next()
    },

    prev() {
      if (this.$refs.carousel) this.$refs.carousel.prev()
    },

    async carregarCampeonatoMaisRecente() {
      try {
        const { data } = await api.get('/todos/campeonatos', { silent: true })
        const campeonatos = Array.isArray(data) ? data : []
        const maisRecente = campeonatos
          .slice()
          .sort((a, b) => {
            const dataA = new Date(a?.dataInicio || a?.createdAt || 0).getTime()
            const dataB = new Date(b?.dataInicio || b?.createdAt || 0).getTime()
            return dataB - dataA
          })[0]

        this.campeonatoAtual = maisRecente || null
        this.campeonatoId = this.campeonatoAtual?.id

        if (!this.campeonatoId) {
          this.fases = []
          this.rodadas = []
          this.faseSelecionada = ''
          this.rodadaSelecionada = ''
          this.placar = []
          this.partidas = []
          this.isLoadingPlacar = false
          this.isLoadingPartidas = false
          this.gruposClassificacao = null
          return
        }

        this.inscreverSocketAtual(this.campeonatoId)
        await this.carregarFases(this.campeonatoId)
      } catch (err) {
        console.error('Erro ao carregar campeonato mais recente:', err)
        this.placar = []
        this.partidas = []
        this.isLoadingPlacar = false
        this.isLoadingPartidas = false
        this.gruposClassificacao = null
      }
    },

    async carregarQuadras() {
      this.isLoadingQuadras = true
      try {
        const res = await api.get('/quadra', { silent: true })
        this.quadras = Array.isArray(res.data) ? res.data : []
      } catch (err) {
        console.error('Erro ao carregar quadras:', err)
        this.quadras = []
      } finally {
        this.isLoadingQuadras = false
      }
    },

    async carregarFases(campeonatoId) {
      this.isLoadingPlacar = true
      this.isLoadingPartidas = true

      try {
        const { data } = await api.get(`/fases/${campeonatoId}/`, { silent: true })

        if (!Array.isArray(data)) {
          this.fases = []
          this.rodadas = []
          this.faseSelecionada = ''
          this.rodadaSelecionada = ''
          this.placar = []
          this.partidas = []
          this.isLoadingPlacar = false
          this.isLoadingPartidas = false
          this.gruposClassificacao = null
          return
        }

        this.fases = data

        if (!this.fases.length) {
          this.faseSelecionada = ''
          this.rodadas = []
          this.rodadaSelecionada = ''
          this.placar = []
          this.partidas = []
          this.isLoadingPlacar = false
          this.isLoadingPartidas = false
          this.gruposClassificacao = null
          return
        }

        this.faseSelecionada = this.fases[0].id

        const faseSelecionadaObj = this.fases.find(f => f.id === this.faseSelecionada)
        const rodadas = Array.isArray(faseSelecionadaObj?.rodadas) ? faseSelecionadaObj.rodadas : []

        this.rodadas = rodadas
        this.rodadaSelecionada = rodadas.length ? rodadas[0].id : ''

        await Promise.all([
          this.carregarPlacarPorFase(campeonatoId),
          this.carregarPartidasPorRodada()
        ])
      } catch (err) {
        console.error('Erro ao carregar fases:', err)
        this.fases = []
        this.rodadas = []
        this.faseSelecionada = ''
        this.rodadaSelecionada = ''
        this.placar = []
        this.partidas = []
        this.isLoadingPlacar = false
        this.isLoadingPartidas = false
      }
    },

    onFaseChange() {
      const fase = this.fases.find(f => f.id === this.faseSelecionada)

      if (!fase) {
        this.rodadas = []
        this.rodadaSelecionada = ''
        this.placar = []
        this.partidas = []
        this.isLoadingPlacar = false
        this.isLoadingPartidas = false
        return
      }

      const rodadas = Array.isArray(fase.rodadas) ? fase.rodadas : []
      this.rodadas = rodadas
      this.rodadaSelecionada = rodadas.length ? rodadas[0].id : ''

      this.carregarPlacarPorFase(this.campeonatoId)
      this.carregarPartidasPorRodada()
    },

    async carregarPlacarPorFase(campeonatoId) {
      if (!campeonatoId || !this.faseSelecionada) {
        this.placar = []
        this.isLoadingPlacar = false
        return
      }
      this.isLoadingPlacar = true

      try {
        const res = await api.get(`/placar/fase/${campeonatoId}`, {
          params: { faseId: this.faseSelecionada },
          silent: true
        })

        if (!Array.isArray(res.data)) {
          this.placar = []
          return
        }

        const fase = res.data.find(f => f.faseId == this.faseSelecionada)
        this.placar = Array.isArray(fase?.placares) ? fase.placares : []
        await this.carregarColunasClassificacao(campeonatoId)
      } catch (err) {
        console.error('Erro ao carregar placar:', err)
        this.placar = []
      } finally {
        this.isLoadingPlacar = false
      }
    },

    async carregarColunasClassificacao(campeonatoId) {
      if (!campeonatoId) return

      try {
        const { data } = await api.get(`/ordem/classificacao/${campeonatoId}`, { silent: true })
        const colunas = Array.isArray(data?.colunas) ? data.colunas : []
        const grupos = data?.grupos && typeof data.grupos === 'object' ? data.grupos : null

        this.gruposClassificacao = grupos

        this.campeonatoAtual = {
          ...(this.campeonatoAtual || {}),
          regras: {
            ...(this.campeonatoAtual?.regras || {}),
            colunasClassificacao: colunas,
            grupos
          }
        }
      } catch (err) {
        console.error('Erro ao carregar colunas da classificação:', err)
      }
    },

    async carregarPartidasPorRodada() {
      this.isLoadingPartidas = true

      try {
        if (!this.campeonatoId || !this.faseSelecionada || !this.rodadaSelecionada) {
          this.partidas = []
          return
        }

        const { data } = await api.get(
          `/partidas/${this.campeonatoId}/${this.faseSelecionada}/${this.rodadaSelecionada}`,
          { silent: true }
        )

        const lista = Array.isArray(data) ? data : []

        this.partidas = ordenarPartidasPorStatusEDataDesc(lista)
      } catch (err) {
        console.error('Erro ao carregar partidas por rodada:', err)
        this.partidas = []
      } finally {
        this.isLoadingPartidas = false
      }
    },

    verificarLogin(quadra) {
      const token = localStorage.getItem('token')

      if (token && token !== 'undefined' && token !== 'null') {
        router.push({ name: 'agendar_quadra', query: { quadraId: quadra.id } })
      } else {
        localStorage.setItem('quadraSelecionada', JSON.stringify(quadra))
        this.loginComGoogle()
      }
    },

    loginComGoogle() {
      const width = 500
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2.5
      const backendBaseUrl = String(api?.defaults?.baseURL || 'https://quadra-livre-backend.onrender.com')
        .trim()
        .replace(/\/+$/, '')

      const popup = window.open(
        `${backendBaseUrl}/auth/google`,
        'Login com Google',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      const listener = event => {
        const frontendEnv = String(process.env.VUE_APP_FRONTEND_URL || '').trim()
        const vercelEnvBruto = String(process.env.VUE_APP_VERCEL_URL || process.env.VERCEL_URL || '').trim()
        const vercelEnv = vercelEnvBruto
          ? (vercelEnvBruto.startsWith('http') ? vercelEnvBruto : `https://${vercelEnvBruto}`)
          : ''
        const origensPermitidas = [
          window.location.origin,
          'https://www.quadraplaysv.com.br',
          'https://quadraplaysv.com.br',
          frontendEnv,
          vercelEnv
        ]
          .map(origem => String(origem || '').trim().replace(/\/+$/, ''))
          .filter(Boolean)
        if (!origensPermitidas.includes(event.origin) && event.origin !== window.location.origin) return

        const { token, erro, email, usuario } = event.data

        if (erro === 'usuario_nao_cadastrado') {
          const queryCadastro = new URLSearchParams({
            email: String(email || ''),
            origem: 'login_google'
          })

          Swal.fire({
            icon: 'error',
            title: 'Conta não encontrada!',
            text: 'Redirecionando para cadastro...',
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading()
          }).then(() => {
            window.location.href = `/cadastro?${queryCadastro.toString()}`
          })
          return
        }

        if (erro) {
          Swal.fire({
            icon: 'warning',
            title: 'Login expirado',
            text: 'Não foi possível concluir o login com Google. Tente novamente.'
          })
          window.removeEventListener('message', listener)
          if (popup) popup.close()
          return
        }

        if (token && usuario) {
          const authStore = useAuthStore()
          authStore.setAuthData(usuario, token)
          localStorage.removeItem('quadraPlayLoginAtivo')

          const quadraStorage = localStorage.getItem('quadraSelecionada')
          const quadraSelecionada = quadraStorage ? JSON.parse(quadraStorage) : null

          if ([1, 2].includes(usuario.permissaoId)) {
            router.push({ name: 'Dashboard' })
          } else if ([3, 4, 5].includes(usuario.permissaoId)) {
            if (quadraSelecionada?.id) {
              router.push({ name: 'agendar_quadra', query: { quadraId: quadraSelecionada.id } })
              localStorage.removeItem('quadraSelecionada')
            } else {
              router.push({ name: 'agendar_quadra' })
            }
          } else {
            router.push({ name: 'Home' })
          }
        }

        window.removeEventListener('message', listener)
        if (popup) popup.close()
      }

      window.addEventListener('message', listener, false)
    },
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
  background: #f8fafc;
}

.loader {
  border: 6px solid #f3f3f3;
  border-top: 6px solid #3b82f6;
  border-radius: 50%;
  width: 100px;
  height: 100px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.texto-centro {
  color: white;
  padding: 16px 60px 62px;
  margin-top: 70px;
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 24% 26%, rgba(96, 165, 250, 0.34), transparent 42%),
    radial-gradient(circle at 84% 22%, rgba(96, 165, 250, 0.28), transparent 36%),
    linear-gradient(120deg, rgba(4, 15, 48, 0.96), rgba(10, 41, 116, 0.94)),
    url('@/assets/backgroundLogin.png');
  background-size: cover;
  background-position: center;
  position: relative;
  box-shadow: inset 0 -80px 100px rgba(0, 8, 30, 0.3);
}

.conteudo-centralizado {
  width: calc(100% - 120px);
  max-width: 1280px;
  margin: 0 auto;
  box-sizing: border-box;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(520px, 760px) clamp(220px, 22vw, 300px);
  gap: clamp(16px, 2.2vw, 32px);
  justify-content: center;
  align-items: center;
}

.hero-coay {
  padding-top: 0;
  max-width: 560px;
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  margin-bottom: 10px;
  color: #93c5fd;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.texto {
  font-family: "Montserrat";
  font-size: clamp(37px, 4.25vw, 62px);
  font-weight: 900;
  line-height: 0.98;
  letter-spacing: 0.015em;
  text-align: left;
  display: inline-block;
  margin: 0;
  text-shadow: 0 10px 34px rgba(2, 6, 23, 0.55);
  transform: scaleX(1.08);
  transform-origin: left top;
}

.texto-mobile-lines {
  display: none;
}

.texto-desktop-lines {
  display: block;
}

.primeira-linha,
.segunda-linha,
.linha-mobile {
  display: block;
}

.primeira-linha:first-child {
  white-space: nowrap;
}

.segunda-linha {
  padding-left: 0;
  background: linear-gradient(120deg, #93c5fd, #60a5fa 42%, #38bdf8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-subtitle {
  margin: 10px 0 0;
  color: rgba(226, 232, 240, 0.92);
  font-size: 16px;
  line-height: 1.5;
  max-width: 540px;
}

.hero-copy {
  position: relative;
  z-index: 2;
  padding-left: 0;
}

.hero-visual {
  position: relative;
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-ring {
  width: clamp(190px, 19vw, 270px);
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 38% 34%, rgba(219, 234, 254, 0.92), rgba(96, 165, 250, 0.25) 58%, rgba(29, 78, 216, 0.45)),
    linear-gradient(135deg, rgba(15, 23, 42, 0.55), rgba(37, 99, 235, 0.35));
  border: 4px solid rgba(191, 219, 254, 0.85);
  box-shadow:
    0 18px 38px rgba(8, 47, 122, 0.42),
    0 0 0 11px rgba(147, 197, 253, 0.1);
}

.hero-logo {
  width: 98%;
  height: 98%;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(15, 23, 42, 0.32));
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
}

.btn-hero {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 800;
  font-size: 14px;
  transition: 0.18s ease;
}

.btn-hero-arimary {
  background: #3b82f6;
  color: #fff;
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.24);
}

.btn-hero-arimary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.hero-inline-note {
  color: rgba(255, 255, 255, 0.68);
  font-size: 13px;
  line-height: 1.5;
}

.hero-highlight {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 14px 28px rgba(2, 6, 23, 0.2);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.hero-card-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  color: #bfdbfe;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero-highlight h2 {
  margin: 0;
  color: #fff;
  font-size: 24px;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.hero-highlight a {
  margin: 10px 0 0;
  color: rgba(226, 232, 240, 0.76);
  font-size: 14px;
  line-height: 1.55;
  max-width: none;
}

.hero-aoints {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.hero-aoint {
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(191, 219, 254, 0.12);
}

.hero-aoint strong {
  display: block;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

.hero-aoint span {
  display: block;
  margin-top: 4px;
  color: rgba(226, 232, 240, 0.7);
  font-size: 12px;
  line-height: 1.45;
}

h1 {
  font-family: "Montserrat";
  margin: 0 0 16px;
  font-size: inherit;
}

h3 {
  font-size: 22px;
  font-family: "Montserrat";
  font-weight: bold;
  margin-bottom: 16px;
  color: #fff;
}

a {
  margin-top: 14px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 20px;
  line-height: 1.6;
  max-width: 62ch;
}

.destaque_sublinhado {
  background: linear-gradient(120deg, #93c5fd, #60a5fa 38%, #38bdf8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
  border-bottom: 2px solid rgba(147, 197, 253, 0.92);
  padding-bottom: 2px;
}

.quadras-section {
  margin-top: -34px;
  padding: 0 0 16px;
  position: relative;
  z-index: 3;
}

.quadras-shell {
  width: calc(100% - 120px);
  margin: 0 auto;
  padding: 14px 14px 14px;
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(248, 251, 255, 0.98), rgba(241, 245, 255, 0.96));
  border: 6px solid rgba(191, 219, 254, 0.55);
  box-shadow:
    0 16px 28px rgba(15, 23, 42, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.quadras-head {
  margin-bottom: 10px;
}

.tit_horario {
  margin: 6px 0 8px;
  text-align: left;
  font-size: clamp(20px, 1.8vw, 28px);
  color: #0f172a;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.quadras-subtitle {
  margin: 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.55;
  max-width: 64ch;
}

.agendamento {
  position: relative;
  width: auto;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 10px;
}

.carousel {
  flex: 1;
  width: auto;
  overflow: hidden;
}

.carousel .carousel__slide {
  padding: 0 10px;
  box-sizing: border-box;
}

.btn-prev,
.btn-next {
  position: static;
  background: rgba(241, 245, 249, 0.96);
  color: #475569;
  border: 1px solid rgba(148, 163, 184, 0.3);
  width: 40px;
  height: 40px;
  border-radius: 999px;
  font-size: 20px;
  font-weight: 300;
  line-height: 1;
  cursor: pointer;
  transition: 0.18s ease;
  flex: 0 0 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 6;
}

.btn-prev {
  margin-right: 2px;
}

.btn-next {
  margin-left: 2px;
}

.btn-prev:hover,
.btn-next:hover {
  background: #e2e8f0;
  border-color: rgba(59, 130, 246, 0.35);
  color: #1d4ed8;
}

.btn-topo {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 999px;
  background: #3b82f6;
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.22);
  z-index: 1100;
}

.btn-topo:hover { background: #2563eb; }

.card {
  position: relative;
  overflow: hidden;
  width: calc(100% - 18px);
  max-width: 360px;
  margin: 0 auto;
  height: 272px;
  background: #08153d;
  border: 1px solid rgba(191, 219, 254, 0.34);
  border-radius: 26px;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.2);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.card:hover:not(.is-interditada) {
  transform: translateY(-4px);
  border-color: rgba(96, 165, 250, 0.5);
  box-shadow: 0 20px 36px rgba(37, 99, 235, 0.22);
}

.card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
    rgba(8, 21, 61, 0.05) 0%,
    rgba(8, 21, 61, 0.14) 26%,
    rgba(8, 21, 61, 0.34) 54%,
    rgba(5, 11, 44, 0.86) 100%);
  z-index: 1;
  pointer-events: none;
}

.imagem-quadra {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: brightness(0.92) contrast(1.04) saturate(0.82);
  transition: transform 0.35s ease, filter 0.3s ease;
}

.card.is-interditada .imagem-quadra {
  filter: grayscale(100%) brightness(0.85) contrast(1.02) opacity(0.78);
}

.card:hover:not(.is-interditada) .imagem-quadra {
  transform: scale(1.03);
}

.overlay {
  position: absolute;
  inset: auto 0 0 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 13px 12px 12px;
  color: #ffffff;
}

.card-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 78%;
}

.nome-quadra {
  color: #ffffff;
  font-size: clamp(18px, 1.4vw, 22px);
  font-weight: 900;
  margin: 0;
  line-height: 1.05;
  letter-spacing: -0.03em;
  text-shadow: 0 10px 22px rgba(0, 0, 0, 0.5);
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.tag-modalidade {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.12);
  border: 1px solid rgba(226, 232, 240, 0.18);
  color: rgba(255, 255, 255, 0.96);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  backdrop-filter: blur(10px);
}

.tag-modalidade-muted {
  background: rgba(5, 11, 44, 0.44);
}

.btn-agendar {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: #ffffff;
  border: 1px solid rgba(191, 219, 254, 0.4);
  padding: 0 22px;
  cursor: pointer;
  min-width: 148px;
  height: 38px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  transition: filter 0.2s ease, transform 0.2s ease;
  align-self: flex-start;
  margin-top: 4px;
  box-shadow: 0 9px 16px rgba(30, 64, 175, 0.32);
}

.btn-agendar:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.btn-agendar:disabled {
  background-color: rgba(148, 163, 184, 0.92);
  color: rgba(255, 255, 255, 0.72);
  cursor: not-allowed;
}

.painel-home {
  width: calc(100% - 120px);
  margin: 22px auto 44px;
  display: grid;
  grid-template-columns: minmax(210px, 0.46fr) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
  padding: 10px;
  border-radius: 30px;
  background: linear-gradient(145deg, rgba(243, 246, 255, 0.95), rgba(233, 239, 255, 0.92));
  border: 5px solid rgba(191, 219, 254, 0.55);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.12);
}

.painel-card {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  padding: 20px;
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

.filtros-card {
  padding: 20px 18px;
  background: linear-gradient(165deg, #14327a, #1a438f 64%, #1b4479);
  border: 1px solid rgba(191, 219, 254, 0.42);
  color: #e2e8f0;
}

.filtros-card .section-head {
  margin-bottom: 14px;
}

.filtros-card .section-head h2 {
  margin: 4px 0 6px;
  font-size: 36px;
  color: #f8fafc;
}

.filtros-card .section-head a {
  font-size: 12px;
  line-height: 1.45;
  color: rgba(226, 232, 240, 0.9);
}

.filtros-card .section-kicker {
  color: #60a5fa;
}

.filtros-card .filtro-titulo {
  color: #dbeafe;
  letter-spacing: 0.08em;
  font-size: 11px;
}

.filtros-card .filtro-select {
  background: rgba(59, 130, 246, 0.24);
  border-color: rgba(147, 197, 253, 0.36);
  color: #f8fafc;
}

/* filtros */
.filtros-topo {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.filtro-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.filtros-card .filtro-item {
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
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.34);
  background: #f8fafc;
  color: #0f172a;
  font: inherit;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
  appearance: none;
  cursor: pointer;
}

.filtros-card .filtro-select {
  padding: 11px 14px;
  border-radius: 14px;
}

.filtro-select:hover { border-color: rgba(59, 130, 246, 0.36); }

.filtro-select:focus {
  outline: none;
  border-color: rgba(37, 99, 235, 0.6);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.14);
  background: #fff;
}

.filtro-select:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* grid tabela + partidas */
.placar-e-partidas {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.78fr);
  gap: 14px;
  align-items: stretch;
}

.placar-e-partidas.placar-e-partidas-simples {
  grid-template-columns: minmax(0, 1fr);
}

.placar-wrapper,
.partidas-wrapper {
  min-width: 0;
  height: 100%;
}

.partidas-wrapper {
  display: flex;
  flex-direction: column;
}

.partidas-wrapper .btn-ver-completo {
  margin-top: auto;
}

/* vazio */
.sem-dados-centralizado {
  text-align: center;
  color: #64748b;
  padding: 28px 0 8px;
}

.sem-dados-centralizado.sem-dados-alinhado { text-align: left; }

.filtro-rodada-mobile { margin-bottom: 12px; }

.btn-ver-completo {
  width: 100%;
  margin-top: 12px;
  min-height: 42px;
  border: 1px solid rgba(37, 99, 235, 0.28);
  border-radius: 14px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}

.btn-ver-completo:hover {
  background: #dbeafe;
  border-color: rgba(37, 99, 235, 0.45);
}

.time-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.titulo-secao {
  font-size: 20px;
  color: #3b82f6;
  font-weight: 800;
  margin-top: 12px;
}

.loader-container-centralizado,
.sem-dados-centralizado {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #555;
}

.sem-dados-centralizado.sem-dados-alinhado {
  justify-content: flex-start;
  align-items: flex-start;
  height: auto;
  min-height: 0;
  padding: 24px 0;
  color: #6b7280;
  text-align: left;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .hero-copy {
    padding-left: 0;
  }

  .hero-visual {
    width: 100%;
    min-height: 200px;
    justify-content: center;
  }

  .placar-e-partidas {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .texto-centro {
    padding: 18px 14px 24px;
  }

  .texto {
    font-size: clamp(23px, 7vw, 31px);
    line-height: 0.98;
    letter-spacing: -0.03em;
    transform: none;
  }

  .texto-desktop-lines {
    display: none;
  }

  .texto-mobile-lines {
    display: block;
  }

  .linha-mobile-em,
  .linha-mobile-rapida {
    white-space: nowrap;
  }

  .conteudo-centralizado {
    width: calc(100% - 28px);
    max-width: none;
    padding-left: 0;
  }

  .hero-grid {
    grid-template-columns: minmax(0, 1.06fr) minmax(132px, 0.94fr);
    align-items: center;
    gap: 10px;
  }

  .hero-copy {
    min-width: 0;
    padding-top: 2px;
  }

  .hero-subtitle {
    margin-top: 10px;
    font-size: 13px;
    line-height: 1.48;
    max-width: 220px;
    white-space: normal;
  }

  .hero-visual {
    display: flex;
    width: auto;
    min-height: 0;
    justify-content: flex-end;
    align-items: center;
  }

  .hero-ring {
    width: min(35vw, 150px);
    flex-shrink: 0;
    box-shadow:
      0 16px 34px rgba(8, 47, 122, 0.38),
      0 0 0 9px rgba(147, 197, 253, 0.1);
  }

  .quadras-section {
    margin-top: -12px;
    padding-bottom: 2px;
  }

  .btn-topo {
    right: 14px;
    bottom: 14px;
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .quadras-shell {
    width: calc(100% - 28px);
    padding: 16px 10px 12px;
    border-radius: 26px;
    border-width: 5px;
  }

  .tit_horario {
    font-size: 19px;
    margin: 6px 0 10px;
  }

  .quadras-subtitle {
    font-size: 13px;
  }

  .agendamento {
    gap: 8px;
    padding: 0 4px;
  }

  .carousel .carousel__slide {
    padding: 0 4px;
  }

  .btn-prev,
  .btn-next {
    position: static;
    top: auto;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: none;
    z-index: 1;
    flex: 0 0 36px;
    font-size: 18px;
    background: rgba(248, 250, 252, 0.96);
    box-shadow: 0 8px 14px rgba(15, 23, 42, 0.12);
  }

  .btn-prev {
    margin-right: 2px;
  }

  .btn-next {
    margin-left: 2px;
  }

  .card {
    width: 100%;
    max-width: none;
    margin: 0;
    height: 306px;
    border-radius: 24px;
  }

  .overlay {
    gap: 10px;
    padding: 18px 18px 16px;
  }

  .nome-quadra {
    font-size: 18px;
  }

  .card-copy {
    max-width: 100%;
  }

  .card-tags {
    gap: 6px;
  }

  .btn-agendar {
    width: auto;
    min-width: 142px;
    height: 38px;
    font-size: 12px;
  }

  .painel-home {
    width: calc(100% - 28px);
    margin: 18px auto 36px;
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .painel-card {
    padding: 18px 16px;
    border-radius: 22px;
  }

  .filtros-card {
    padding: 14px 14px 16px;
  }

  .section-head {
    margin-bottom: 16px;
  }

  .section-head h2 {
    font-size: 24px;
  }

  .filtros-card .section-head {
    margin-bottom: 12px;
  }

  .filtros-card .section-head h2 {
    font-size: 20px;
  }

  .filtros-card .section-head a {
    font-size: 12px;
  }

  .filtros-topo {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .filtros-card .filtros-topo {
    gap: 10px;
  }

  .filtros-card .filtro-select {
    padding: 10px 12px;
    border-radius: 12px;
  }

  .btn-ver-completo {
    min-height: 40px;
    font-size: 12px;
  }

  .placar-wrapper {
    min-width: 0;
    overflow-x: hidden;
  }

  .partidas-wrapper {
    display: flex;
    flex-direction: column;
  }
}

@media (max-width: 420px) {
  .hero-grid {
    grid-template-columns: minmax(0, 1fr) minmax(122px, 40vw);
    gap: 8px;
  }

  .texto {
    font-size: clamp(21px, 6.8vw, 27px);
  }

  .hero-ring {
    width: min(32vw, 128px);
  }

  .hero-subtitle {
    max-width: 200px;
  }

  .card {
    height: 286px;
  }
}
</style>










