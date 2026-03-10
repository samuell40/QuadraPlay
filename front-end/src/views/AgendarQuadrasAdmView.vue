<template>
  <div class="layout">
    <SideBar />

    <div class="conteudo">
      <NavBarUse class="page-nav" />

      <section class="page-header">
        <div class="header-copy">
          <div class="header-topline">
            <h1 class="title">Agendar quadras</h1>
          </div>
        </div>
      </section>

      <section class="overview-grid">
        <article class="overview-card">
          <p class="metric-kicker">TOTAL</p>
          <p class="metric-value">{{ totalQuadras }}</p>
          <span class="metric-caption">Quadras exibidas para operação</span>
        </article>

        <article class="overview-card overview-card-available">
          <p class="metric-kicker">DISPONÍVEIS</p>
          <p class="metric-value">{{ quadrasDisponiveis }}</p>
          <span class="metric-caption">Prontas para reserva imediata</span>
        </article>

        <article class="overview-card overview-card-blocked">
          <p class="metric-kicker">INDISPONÍVEIS</p>
          <p class="metric-value">{{ quadrasIndisponiveis }}</p>
          <span class="metric-caption">Quadras que Estão Interditadas</span>
        </article>
      </section>

      <section class="quadras-panel">
        <div class="panel-head">
          <div class="panel-copy">
            <p class="section-kicker">QUADRAS</p>
            <h2 class="section-title">Escolha onde reservar</h2>
          </div>
        </div>

        <div v-if="isLoadingQuadras" class="state-card">
          <LoadingState
            title="Carregando quadras"
            description="Buscando unidades liberadas e bloqueadas para o agendamento administrativo."
          />
        </div>

        <div v-else-if="quadras.length === 0" class="state-card state-card-empty">
          <p class="state-title">Nenhuma quadra encontrada.</p>
          <p class="state-copy">Quando houver quadras cadastradas, elas aparecerão aqui para reserva direta.</p>
        </div>

        <div v-else class="quadras-grid">
          <article
            v-for="quadra in quadras"
            :key="quadra.id"
            class="card-quadra"
            :class="{ 'is-interditada': quadra.interditada }"
          >
            <span class="card-status" :class="{ 'is-indisponivel': quadra.interditada }">
              {{ quadra.interditada ? "Indisponível" : "Disponível" }}
            </span>

            <img
              :src="quadra.foto || require('@/assets/QuadraLivre.png')"
              :alt="quadra.nome"
              class="imagem-quadra"
            />

            <div class="overlay">
              <div class="card-copy">
                <p class="card-label">QUADRA</p>
                <h3 class="nome-quadra">{{ quadra.nome }}</h3>

                <div class="card-tags">
                  <span
                    v-for="mod in (quadra.modalidades || []).slice(0, 3)"
                    :key="mod.id"
                    class="tag-modalidade"
                  >
                    {{ formatarNomeModalidade(mod.nome) }}
                  </span>

                  <span
                    v-if="(quadra.modalidades || []).length > 3"
                    class="tag-modalidade tag-modalidade-muted"
                  >
                    +{{ (quadra.modalidades || []).length - 3 }}
                  </span>

                  <span v-if="!(quadra.modalidades || []).length" class="tag-modalidade tag-modalidade-muted">
                    Sem modalidades
                  </span>
                </div>
              </div>

              <button
                class="btn-agendar"
                :disabled="quadra.interditada"
                @click="!quadra.interditada && abrirAgendamentoDireto(quadra)"
              >
                {{ quadra.interditada ? "Indisponível" : "Agendar agora" }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <AgendamentoModal
        v-if="mostrarModalAgendamento"
        :quadra="quadraSelecionada"
        :times="times"
        @fechar="mostrarModalAgendamento = false"
        @confirmar="confirmarAgendamento"
      />
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2'
import SideBar from '@/components/SideBar.vue'
import NavBarUse from '@/components/NavBarUser.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import AgendamentoModal from '@/components/modals/Agendamentos/AgendModal.vue'
import api from '@/axios'
import { useAuthStore } from '@/store'
import { mapState } from 'pinia'

export default {
  name: 'AgendarQuadrasAdm',
  components: { SideBar, NavBarUse, LoadingState, AgendamentoModal },
  data() {
    return {
      quadras: [],
      isLoadingQuadras: true,
      mostrarModalAgendamento: false,
      quadraSelecionada: null,
      times: [],
    }
  },

  computed: {
    ...mapState(useAuthStore, ['usuario']),
    totalQuadras() {
      return this.quadras.length
    },
    quadrasDisponiveis() {
      return this.quadras.filter((quadra) => !quadra.interditada).length
    },
    quadrasIndisponiveis() {
      return this.quadras.filter((quadra) => quadra.interditada).length
    }
  },

  watch: {
    usuario: {
      handler(novoUsuario) {
        if (novoUsuario?.id) {
          this.carregarTimes(novoUsuario.id)
        }
      },
      immediate: true
    }
  },

  mounted() {
    this.carregarQuadras()
    if (this.usuario?.id) {
      this.carregarTimes(this.usuario.id)
    }
  },

  methods: {
    obterUsuarioAutenticado() {
      const authStore = useAuthStore()

      if (authStore.usuario?.id) return authStore.usuario

      const token = localStorage.getItem('token')
      if (!token || token === 'undefined' || token === 'null') return null

      try {
        const usuarioLocal = JSON.parse(localStorage.getItem('usuario') || 'null')
        if (!usuarioLocal?.id) return null
        authStore.setAuthData(usuarioLocal, token)
        return usuarioLocal
      } catch {
        return null
      }
    },

    async carregarTimes(userId) {
      if (!userId) return

      try {
        let response

        if (this.usuario.permissaoId === 1 || this.usuario.permissaoId === 2) {
          response = await api.get('/times')
        } else {
          response = await api.get(`/usuarios/${userId}/times`)
        }

        this.times = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('Erro ao carregar times:', error)
        this.times = []
      }
    },

    async carregarQuadras() {
      this.isLoadingQuadras = true
      try {
        const { data } = await api.get('/quadra')
        this.quadras = data
      } catch (err) {
        console.error('Erro ao carregar quadras:', err)
      } finally {
        this.isLoadingQuadras = false
      }
    },

    async abrirAgendamentoDireto(quadra) {
      this.quadraSelecionada = quadra

      if (this.times.length === 0 && this.usuario?.id) {
        await this.carregarTimes(this.usuario.id)
      }

      this.mostrarModalAgendamento = true
    },

    async confirmarAgendamento(agendamentoDoModal, forcarAgendamento = false) {
      const usuarioAutenticado = this.obterUsuarioAutenticado()

      if (!usuarioAutenticado) {
        Swal.fire({
          title: 'Você precisa estar logado',
          text: 'Volte para a tela inicial para entrar novamente.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Ir para início',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#1E3A8A',
        }).then((result) => {
          if (result.isConfirmed) this.$router.push({ name: 'Home' })
        })
        return
      }

      const isAdministrador = usuarioAutenticado.permissaoId === 2
      const statusAutomatico = isAdministrador ? 'Confirmado' : 'Pendente'

      if (agendamentoDoModal.lote && Array.isArray(agendamentoDoModal.lote)) {
        const loteFormatado = agendamentoDoModal.lote.map((item) => ({
          ...item,
          usuarioId: usuarioAutenticado.id,
          quadraId: this.quadraSelecionada.id,
          ignorarRegra: forcarAgendamento,
          status: statusAutomatico
        }))

        Swal.fire({
          title: 'Processando agenda...',
          html: 'Isso pode levar alguns segundos dependendo da quantidade de semanas.',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        })

        if (agendamentoDoModal.fixo) {
          try {
            await api.post('/agendamentos/fixos', {
              lote: loteFormatado,
              usuarioId: usuarioAutenticado.id
            })

            Swal.close()
            Swal.fire({
              icon: 'success',
              title: 'Agenda fixa atualizada!',
              text: 'Os horários foram processados e sincronizados com a grade.',
              confirmButtonColor: '#1E3A8A'
            })

            this.mostrarModalAgendamento = false
          } catch (err) {
            Swal.close()
            const msgErro = err.response?.data?.error || err.response?.data?.message || 'Erro ao processar lote.'

            Swal.fire({
              icon: 'error',
              title: 'Erro no lote',
              text: msgErro,
              confirmButtonColor: '#1E3A8A'
            })
          }
          return
        }
      }

      const agendamento = {
        ...agendamentoDoModal,
        usuarioId: usuarioAutenticado.id,
        quadraId: this.quadraSelecionada.id,
        ignorarRegra: forcarAgendamento,
        status: statusAutomatico
      }

      try {
        await api.post('/agendamento', agendamento)

        Swal.fire({
          icon: 'success',
          title: isAdministrador ? 'Horário reservado!' : 'Solicitação enviada!',
          text: isAdministrador
            ? `Quadra ${this.quadraSelecionada.nome} reservada com sucesso.`
            : `Aguardando aprovação para a quadra ${this.quadraSelecionada.nome}.`,
          confirmButtonColor: '#1E3A8A',
          timer: 4000,
          showConfirmButton: false
        })

        this.mostrarModalAgendamento = false
      } catch (err) {
        const msgErro = err.response?.data?.error || err.response?.data?.message
        const status = err.response?.status

        if (status === 400 && (msgErro?.includes('limite') || msgErro?.includes('FIXOS'))) {
          Swal.fire({
            title: 'Restrição de limite',
            text: `${msgErro}. Como administrador, deseja forçar este agendamento?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, forçar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1E3A8A',
          }).then((result) => {
            if (result.isConfirmed) {
              this.confirmarAgendamento(agendamentoDoModal, true)
            }
          })
          return
        }

        Swal.fire({
          icon: 'warning',
          title: 'Não foi possível agendar',
          text: msgErro || 'Verifique se o horário está disponível.',
          confirmButtonColor: '#1E3A8A'
        })
      }
    },

    formatarNomeModalidade(nome) {
      return nome.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: #f4f7fb;
}

.conteudo {
  flex: 1;
  margin-left: 250px;
  padding: 20px 32px 32px;
  min-width: 0;
  overflow-x: hidden;
}

.page-nav {
  margin-bottom: 18px;
}

.page-header {
  margin-bottom: 22px;
}

.header-copy,
.panel-copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header-topline,
.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.panel-head {
  margin-bottom: 16px;
}

.title {
  margin: 0;
  font-size: 42px;
  line-height: 1.04;
  font-weight: 800;
  color: #2563eb;
}

.page-subtitle,
.section-subtitle,
.metric-caption,
.state-copy {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: #64748b;
}

.header-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  min-height: 46px;
  border-radius: 999px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.22);
  white-space: nowrap;
}

.header-chip-value {
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
}

.header-chip-text {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.82);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.overview-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 18px 14px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  box-shadow: 0 14px 24px rgba(15, 23, 42, 0.06);
}

.metric-kicker,
.section-kicker,
.card-label {
  margin: 0;
  font-size: 12px;
  line-height: 1;
  letter-spacing: 0.16em;
  font-weight: 800;
  text-transform: uppercase;
}

.metric-kicker,
.section-kicker {
  color: #2563eb;
}

.card-label {
  color: rgba(191, 219, 254, 0.88);
}

.metric-value {
  margin: 0;
  font-size: 30px;
  line-height: 1;
  font-weight: 800;
  color: #0f172a;
}

.overview-card-available .metric-value {
  color: #059669;
}

.overview-card-blocked .metric-value {
  color: #dc2626;
}

.quadras-panel {
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 14px 24px rgba(15, 23, 42, 0.06);
}

.section-title {
  margin: 0;
  font-size: 20px;
  line-height: 1.15;
  font-weight: 800;
  color: #0f172a;
}

.state-card {
  min-height: 300px;
  border-radius: 20px;
  border: 1px dashed rgba(148, 163, 184, 0.35);
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  padding: 24px;
}

.state-card-empty {
  min-height: 240px;
}

.state-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.quadras-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.card-quadra {
  position: relative;
  height: 248px;
  border-radius: 24px;
  overflow: hidden;
  background: #08153d;
  border: 1px solid rgba(59, 130, 246, 0.18);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.14);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.card-quadra::before {
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

.card-quadra:hover:not(.is-interditada) {
  transform: translateY(-4px);
  border-color: rgba(96, 165, 250, 0.5);
  box-shadow: 0 20px 36px rgba(37, 99, 235, 0.22);
}

.imagem-quadra {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: brightness(0.92) contrast(1.04) saturate(0.82);
  transition: transform 0.35s ease, filter 0.3s ease;
}

.card-quadra:hover:not(.is-interditada) .imagem-quadra {
  transform: scale(1.03);
}

.card-quadra.is-interditada .imagem-quadra {
  filter: grayscale(100%) brightness(0.85) contrast(1.02) opacity(0.78);
}

.card-status {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 102px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.94);
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
}

.card-status.is-indisponivel {
  background: rgba(239, 68, 68, 0.92);
}

.overlay {
  position: absolute;
  inset: auto 0 0 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  color: #ffffff;
}

.card-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  max-width: 78%;
}

.nome-quadra {
  font-size: 24px;
  font-weight: 800;
  margin: 0;
  line-height: 1.12;
  letter-spacing: -0.03em;
  text-shadow: 0 10px 18px rgba(0, 0, 0, 0.28);
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
  margin-bottom: 6px;
}

.tag-modalidade {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.12);
  border: 1px solid rgba(226, 232, 240, 0.18);
  color: rgba(255, 255, 255, 0.96);
  font-size: 11px;
  font-weight: 700;
  backdrop-filter: blur(10px);
}

.tag-modalidade-muted {
  background: rgba(5, 11, 44, 0.44);
}

.btn-agendar {
  background: #3b82f6;
  color: #ffffff;
  border: none;
  padding: 0 16px;
  cursor: pointer;
  min-width: 118px;
  height: 42px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  transition: background-color 0.2s ease, transform 0.2s ease;
  align-self: flex-start;
}

.btn-agendar:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-agendar:disabled {
  background: rgba(148, 163, 184, 0.92);
  color: rgba(255, 255, 255, 0.72);
  cursor: not-allowed;
}

.loader {
  border: 6px solid #f3f3f3;
  border-top: 6px solid #3b82f6;
  border-radius: 50%;
  width: 72px;
  height: 72px;
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

@media (max-width: 1200px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .header-topline,
  .panel-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .quadras-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .conteudo {
    margin-left: 0;
    padding: 12px 14px 18px;
  }

  .page-nav {
    margin-bottom: 12px;
  }

  .title {
    font-size: 24px;
    line-height: 1.12;
  }

  .header-chip {
    min-height: 40px;
    padding: 0 14px;
    gap: 8px;
  }

  .header-chip-value {
    font-size: 18px;
  }

  .header-chip-text {
    font-size: 11px;
  }

  .overview-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .overview-card {
    padding: 10px 8px 9px;
    border-radius: 14px;
    gap: 5px;
  }

  .metric-kicker {
    font-size: 9px;
    letter-spacing: 0.08em;
  }

  .metric-value {
    font-size: 20px;
  }

  .metric-caption {
    font-size: 9px;
    line-height: 1.25;
  }

  .quadras-panel {
    padding: 18px;
    border-radius: 22px;
  }

  .state-card {
    min-height: 220px;
    border-radius: 18px;
  }

  .state-title {
    font-size: 20px;
  }

  .quadras-grid {
    gap: 16px;
  }

  .card-quadra {
    height: 220px;
    border-radius: 20px;
  }

  .card-status {
    min-width: 108px;
    height: 34px;
    font-size: 11px;
  }

  .overlay {
    padding: 14px;
  }

  .card-copy {
    max-width: 100%;
  }

  .nome-quadra {
    font-size: 20px;
  }

  .btn-agendar {
    width: 100%;
    justify-content: center;
  }
}
</style>
