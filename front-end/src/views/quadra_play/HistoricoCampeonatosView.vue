<template>
  <div class="layout">
    <NavBarQuadras partida-status="FINALIZADA" />

    <div class="main">
      <SidebarQuadra partida-status="FINALIZADA" @sidebar-toggle="sidebarCollapsed = $event" />

      <div class="conteudo" :class="{ collapsed: sidebarCollapsed }">
        <section class="header-card">
          <div class="header-copy">
            <span class="section-kicker">Historico</span>
            <h1 class="title">Campeonatos passados</h1>
            <p class="subtitle">Consulte campeonatos encerrados por ano.</p>
          </div>

          <div class="filtro-ano">
            <label for="filtro-ano">Ano</label>
            <select id="filtro-ano" v-model="anoSelecionado">
              <option v-for="ano in anosDisponiveis" :key="ano" :value="ano">
                {{ ano }}
              </option>
            </select>
          </div>
        </section>

        <div v-if="isLoading" class="feedback-card feedback-card-loading">
          <LoadingState
            title="Carregando historico"
            description="Buscando os campeonatos finalizados para montar a linha do tempo."
          />
        </div>

        <div v-else-if="!anosDisponiveis.length" class="feedback-card feedback-card-empty">
          Nenhum campeonato passado encontrado.
        </div>

        <div v-else-if="!campeonatosFiltrados.length" class="feedback-card feedback-card-empty">
          Nenhum campeonato encontrado para o ano selecionado.
        </div>

        <section v-else class="historico-grid">
          <article v-for="campeonato in campeonatosFiltrados" :key="campeonato.id" class="historico-card">
            <div class="card-thumb-wrap">
              <img :src="obterFotoCard(campeonato.foto)" :alt="`Imagem do campeonato ${campeonato.nome}`" class="card-thumb" />
              <span class="status-badge" :class="classeStatus(campeonato.status)">
                {{ rotuloStatus(campeonato.status) }}
              </span>
            </div>

            <div class="card-content">
              <h2 class="card-title">
                {{ campeonato.nome }}
                <span class="card-title-tipo">({{ rotuloTipoCampeonato(campeonato.tipo) }})</span>
              </h2>
              <p class="card-meta">
                {{ campeonato.modalidade?.nome || 'Modalidade nao informada' }}
              </p>
              <p class="card-meta">
                {{ campeonato.quadra?.nome || 'Quadra nao informada' }}
              </p>
              <p class="card-periodo">
                {{ formatarPeriodo(campeonato) }}
              </p>
              <button
                type="button"
                class="btn-acessar-historico"
                :disabled="Boolean(campeonatoAcessandoId)"
                @click.stop="abrirCampeonato(campeonato)"
              >
                <span class="btn-acessar-content">
                  <span
                    v-if="campeonatoAcessandoId === Number(campeonato.id)"
                    class="btn-acessar-spinner"
                    aria-hidden="true"
                  ></span>
                  <span>{{ campeonatoAcessandoId === Number(campeonato.id) ? 'Abrindo...' : 'Acessar' }}</span>
                </span>
              </button>
            </div>
          </article>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/axios'
import NavBarQuadras from '@/components/quadraplay/NavBarQuadras.vue'
import SidebarQuadra from '@/components/quadraplay/SidebarQuadra.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import { obterFotoCardCampeonato } from '@/utils/campeonatoImagem'
import router from '@/router'
import { useCampeonatoStore } from '@/storecampeonato'

export default {
  name: 'HistoricoCampeonatosView',
  components: {
    NavBarQuadras,
    SidebarQuadra,
    LoadingState
  },
  data() {
    return {
      sidebarCollapsed: false,
      campeonatos: [],
      isLoading: true,
      anoSelecionado: '',
      campeonatoAcessandoId: null
    }
  },
  computed: {
    campeonatosPassados() {
      return (Array.isArray(this.campeonatos) ? this.campeonatos : []).filter(this.ehCampeonatoPassado)
    },
    anosDisponiveis() {
      const anos = [...new Set(this.campeonatosPassados
        .map(campeonato => this.obterAnoReferencia(campeonato))
        .filter(Boolean))]

      return anos.sort((a, b) => Number(b) - Number(a))
    },
    campeonatosFiltrados() {
      const ano = String(this.anoSelecionado || '')
      if (!ano) return []

      return this.campeonatosPassados
        .filter(campeonato => this.obterAnoReferencia(campeonato) === ano)
        .sort((a, b) => this.obterDataOrdenacao(b) - this.obterDataOrdenacao(a))
    }
  },
  watch: {
    anosDisponiveis: {
      immediate: true,
      handler(anos) {
        if (!Array.isArray(anos) || !anos.length) {
          this.anoSelecionado = ''
          return
        }

        if (!anos.includes(String(this.anoSelecionado))) {
          this.anoSelecionado = anos[0]
        }
      }
    }
  },
  mounted() {
    this.carregarHistorico()
  },
  methods: {
    async carregarHistorico() {
      this.isLoading = true
      try {
        const { data } = await api.get('/todos/campeonatos', {
          silent: true,
          params: { todosAnos: true }
        })
        this.campeonatos = Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Erro ao carregar historico de campeonatos:', error)
        this.campeonatos = []
      } finally {
        this.isLoading = false
      }
    },
    parseData(valor) {
      if (!valor) return null
      const data = new Date(valor)
      return Number.isNaN(data.getTime()) ? null : data
    },
    obterDataOrdenacao(campeonato) {
      return (
        this.parseData(campeonato?.dataFim) ||
        this.parseData(campeonato?.dataInicio) ||
        this.parseData(campeonato?.createdAt) ||
        new Date(0)
      )
    },
    obterAnoReferencia(campeonato) {
      const data = this.obterDataOrdenacao(campeonato)
      const ano = data instanceof Date ? data.getFullYear() : NaN
      return Number.isFinite(ano) ? String(ano) : ''
    },
    ehCampeonatoPassado(campeonato) {
      const anoReferencia = Number(this.obterAnoReferencia(campeonato))
      const anoAtual = new Date().getFullYear()
      if (!Number.isFinite(anoReferencia) || anoReferencia >= anoAtual) {
        return false
      }

      const status = String(campeonato?.status || '').toUpperCase()
      if (['FINALIZADO', 'FINALIZADA', 'CANCELADO', 'CANCELADA', 'DELETADO', 'DELETADA'].includes(status)) {
        return true
      }

      const dataFim = this.parseData(campeonato?.dataFim)
      if (!dataFim) return false

      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      return dataFim.getTime() < hoje.getTime()
    },
    rotuloStatus(status) {
      const valor = String(status || '').toUpperCase()
      if (valor === 'FINALIZADO' || valor === 'FINALIZADA') return 'Finalizado'
      if (valor === 'CANCELADO' || valor === 'CANCELADA') return 'Cancelado'
      return 'Encerrado'
    },
    classeStatus(status) {
      const valor = String(status || '').toUpperCase()
      if (valor === 'CANCELADO' || valor === 'CANCELADA') return 'status-cancelado'
      return 'status-finalizado'
    },
    rotuloTipoCampeonato(tipo) {
      const valor = String(tipo || '')
        .trim()
        .toLowerCase()

      if (valor === 'pontos_corridos' || valor === 'pontos corridos') {
        return 'Pontos corridos'
      }

      if (
        valor === 'pontos_corridos_eliminatorias'
        || valor === 'pontos corridos + eliminatorias'
        || valor === 'pontos corridos e eliminatorias'
      ) {
        return 'Pontos corridos + eliminatorias'
      }

      if (valor === 'eliminatorias' || valor === 'eliminatoria') {
        return 'Eliminatorias'
      }

      return 'Tipo nao informado'
    },
    formatarData(valor) {
      const data = this.parseData(valor)
      if (!data) return '--/--/----'
      return data.toLocaleDateString('pt-BR')
    },
    formatarPeriodo(campeonato) {
      const inicio = this.formatarData(campeonato?.dataInicio)
      const fim = this.formatarData(campeonato?.dataFim)
      return `Periodo: ${inicio} - ${fim}`
    },
    obterFotoCard(foto) {
      return obterFotoCardCampeonato(foto)
    },
    async abrirCampeonato(campeonato) {
      const campeonatoId = Number(campeonato?.id || 0)
      if (!campeonatoId || this.campeonatoAcessandoId) return

      const store = useCampeonatoStore()
      this.campeonatoAcessandoId = campeonatoId
      try {
        const { data } = await api.get(`/campeonato/${campeonatoId}`, { silent: true })
        const campeonatoCompleto = data && typeof data === 'object' ? data : campeonato
        store.setCampeonato(campeonatoCompleto)
        router.push({ name: 'Detalhar_Campeonatos', query: { id: campeonatoId } })
      } catch (error) {
        console.error('Erro ao abrir campeonato do historico:', error)
        store.setCampeonato(campeonato)
        router.push({ name: 'Detalhar_Campeonatos', query: { id: campeonatoId } })
      } finally {
        this.campeonatoAcessandoId = null
      }
    }
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.conteudo {
  flex: 1;
  padding: 26px 28px 32px;
  margin-top: 70px;
  margin-left: 250px;
  transition: margin-left 0.3s ease;
  background:
    radial-gradient(circle at top left, rgba(127, 29, 29, 0.08), transparent 28%),
    linear-gradient(180deg, #fff8f8 0%, #fef2f2 24%, #f8fafc 100%);
}

.conteudo.collapsed {
  margin-left: 70px;
}

.header-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
  padding: 20px;
  border-radius: 22px;
  border: 1px solid rgba(248, 113, 113, 0.26);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 28px rgba(127, 29, 29, 0.08);
}

.header-copy {
  min-width: 0;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  margin-bottom: 10px;
  color: #b91c1c;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.title {
  margin: 0;
  color: #b91c1c;
  font-size: 38px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.subtitle {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 15px;
  line-height: 1.55;
}

.filtro-ano {
  min-width: 170px;
  display: grid;
  gap: 8px;
}

.filtro-ano label {
  color: #b91c1c;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.filtro-ano select {
  min-height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(248, 113, 113, 0.3);
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  padding: 0 12px;
}

.feedback-card {
  padding: 22px;
  border-radius: 20px;
  border: 1px solid rgba(248, 113, 113, 0.2);
  background: rgba(255, 255, 255, 0.96);
}

.feedback-card-empty {
  color: #64748b;
}

.historico-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.historico-card {
  border: 1px solid rgba(248, 113, 113, 0.2);
  border-radius: 20px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 12px 22px rgba(127, 29, 29, 0.08);
}

.card-thumb-wrap {
  position: relative;
  height: 170px;
}

.card-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.status-finalizado {
  background: rgba(153, 27, 27, 0.9);
  color: #fff;
}

.status-cancelado {
  background: rgba(30, 41, 59, 0.9);
  color: #fff;
}

.card-content {
  padding: 14px 14px 16px;
}

.card-title {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 20px;
  line-height: 1.1;
  font-weight: 800;
}

.card-title-tipo {
  font-size: 0.72em;
  font-weight: 700;
  color: #475569;
  letter-spacing: -0.01em;
}

.card-meta {
  margin: 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.4;
}

.card-meta + .card-meta {
  margin-top: 4px;
}

.card-periodo {
  margin: 10px 0 0;
  color: #334155;
  font-size: 13px;
  line-height: 1.4;
}

.btn-acessar-historico {
  width: 100%;
  margin-top: 12px;
  min-height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(248, 113, 113, 0.35);
  background: rgba(254, 226, 226, 0.72);
  color: #991b1b;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.02em;
  padding: 0 14px;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}

.btn-acessar-historico:hover:not(:disabled) {
  background: rgba(254, 202, 202, 0.82);
  border-color: rgba(239, 68, 68, 0.4);
}

.btn-acessar-historico:disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

.btn-acessar-content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-acessar-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(153, 27, 27, 0.22);
  border-top-color: #991b1b;
  border-radius: 50%;
  animation: btnAcessarSpin 0.75s linear infinite;
}

@keyframes btnAcessarSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .historico-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .conteudo {
    margin-left: 0;
    padding: 16px 14px 24px;
  }

  .header-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 8px 10px;
    padding: 14px;
    border-radius: 24px;
    margin-bottom: 16px;
  }

  .section-kicker {
    margin-bottom: 6px;
  }

  .title {
    font-size: 26px;
    line-height: 1.02;
  }

  .subtitle {
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.55;
  }

  .filtro-ano {
    width: 124px;
    min-width: 124px;
    gap: 6px;
  }

  .filtro-ano label {
    font-size: 11px;
    letter-spacing: 0.12em;
  }

  .filtro-ano select {
    min-height: 40px;
    border-radius: 14px;
    padding: 0 10px;
  }

  .historico-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .card-thumb-wrap {
    height: 154px;
  }
}
</style>
