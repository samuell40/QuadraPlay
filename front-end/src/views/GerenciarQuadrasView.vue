<template>
  <div class="layout">
    <SideBar />

    <div class="conteudo">
      <NavBarUse v-if="mostrarNavBarUser" class="page-nav" />

      <section class="page-header">
        <div class="header-copy">
          <div class="header-topline">
            <h1 class="title">{{ tituloPagina }}</h1>

            <button
              v-if="podeCadastrar"
              type="button"
              class="btn-top-action"
              :disabled="salvandoCadastro || salvandoEdicao"
              @click="abrirModalCadastro"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="btn-top-action-icon bi bi-plus-circle-fill"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path
                  d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"
                />
              </svg>
              <span class="btn-label-desktop">Adicionar quadra</span>
              <span class="btn-label-mobile">Adicionar</span>
            </button>
          </div>
        </div>
      </section>

      <section v-if="mostrarOverviewCards" class="overview-grid">
        <article class="overview-card">
          <p class="metric-kicker">TOTAL</p>
          <p class="metric-value">{{ totalQuadras }}</p>
          <span class="metric-caption">Quadras exibidas neste perfil</span>
        </article>

        <article class="overview-card overview-card-active">
          <p class="metric-kicker">ATIVAS</p>
          <p class="metric-value">{{ quadrasAtivas }}</p>
          <span class="metric-caption">Disponíveis para operação normal</span>
        </article>

        <article class="overview-card overview-card-blocked">
          <p class="metric-kicker">INDISPONÍVEIS</p>
          <p class="metric-value">{{ quadrasIndisponiveis }}</p>
          <span class="metric-caption">Temporariamente bloqueadas</span>
        </article>
      </section>

      <section class="quadras-panel">
        <div class="panel-head">
          <div class="panel-copy">
            <p class="section-kicker">{{ kickerPainel }}</p>
            <h2 class="section-title">{{ tituloPainel }}</h2>
            <p class="section-subtitle">
              {{ subtituloPainel }}
            </p>
          </div>
        </div>

        <div v-if="isLoading" class="state-card">
          <LoadingState :title="tituloCarregamento" :description="descricaoCarregamento" />
        </div>

        <div v-else-if="quadras.length === 0" class="state-card state-card-empty">
          <p class="state-title">Nenhuma quadra vinculada ao seu perfil.</p>
          <p class="state-copy">{{ descricaoEstadoVazio }}</p>
        </div>

        <div v-else class="quadras-grid" :class="{ 'quadras-grid-full': isAdministrador }">
          <article
            v-for="quadra in quadras"
            :key="quadra.id"
            class="card-quadra"
            :class="{ 'is-interditada': quadra.interditada }"
          >
            <span class="card-status" :class="quadra.interditada ? 'is-indisponivel' : 'is-ativo'">
              {{ quadra.interditada ? 'Indisponível' : 'Ativa' }}
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
                <p class="endereco">{{ quadra.endereco || 'Endereço não informado' }}</p>

                <div class="card-tags">
                  <span
                    v-for="modalidade in (quadra.modalidades || []).slice(0, 3)"
                    :key="`${quadra.id}-${modalidade.id}`"
                    class="tag-modalidade"
                  >
                    {{ formatarNomeModalidade(modalidade.nome) }}
                  </span>

                  <span v-if="(quadra.modalidades || []).length > 3" class="tag-modalidade tag-modalidade-muted">
                    +{{ (quadra.modalidades || []).length - 3 }}
                  </span>

                  <span v-if="!(quadra.modalidades || []).length" class="tag-modalidade tag-modalidade-muted">
                    Sem modalidades
                  </span>
                </div>
              </div>

              <div class="card-actions">
                <button type="button" class="btn-card btn-card-primary" :disabled="quadraAlternandoId === quadra.id" @click="abrirModalEdicao(quadra)">
                  <span class="btn-inline-content">
                    <span>{{ quadraAlternandoId === quadra.id ? 'Aguarde...' : 'Editar' }}</span>
                  </span>
                </button>

                <button type="button" class="btn-card btn-card-secondary" :disabled="quadraAlternandoId === quadra.id" @click="abrirModalGrade(quadra)">
                  <span class="btn-inline-content">
                    <span>{{ quadraAlternandoId === quadra.id ? 'Aguarde...' : 'Horários' }}</span>
                  </span>
                </button>

                <button
                  type="button"
                  class="btn-card btn-card-wide"
                  :class="quadra.interditada ? 'btn-card-success' : 'btn-card-danger'"
                  :disabled="quadraAlternandoId === quadra.id"
                  @click="alternarStatus(quadra)"
                >
                  <span class="btn-inline-content">
                    <span
                      v-if="quadraAlternandoId === quadra.id"
                      class="btn-inline-spinner"
                      aria-hidden="true"
                    ></span>
                    <span>
                      {{
                        quadraAlternandoId === quadra.id
                          ? (quadra.interditada ? 'Liberando...' : 'Fechando...')
                          : (quadra.interditada ? 'Liberar quadra' : 'Fechar quadra')
                      }}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <div v-if="modalCadastroAberto" class="modal-overlay" @click.self="!salvandoCadastro && fecharModalCadastro()">
        <div class="modal-content modal-content-cadastro">
          <div class="modal-header">
            <div class="modal-header-copy">
              <h2 class="modal-title">Cadastrar unidade</h2>
              <p class="modal-subtitle">Preencha os dados principais e defina as modalidades disponíveis.</p>
            </div>

            <button
              type="button"
              class="btn-close-x-modal"
              :disabled="salvandoCadastro"
              @click="fecharModalCadastro"
              aria-label="Fechar modal"
            >
              x
            </button>
          </div>

          <div class="modal-body-scroll">
            <form class="modal-form" @submit.prevent="cadastrarQuadraModal">
              <div class="form-grid">
                <div class="form-group">
                  <label for="nomeCadastro" class="label-input">Nome da quadra</label>
                  <input
                    id="nomeCadastro"
                    v-model="formCadastro.nome"
                    type="text"
                    class="input-estilizado"
                    :disabled="salvandoCadastro"
                    placeholder="Ex: Arena Juruá"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="enderecoCadastro" class="label-input">Endereço</label>
                  <input
                    id="enderecoCadastro"
                    v-model="formCadastro.endereco"
                    type="text"
                    class="input-estilizado"
                    :disabled="salvandoCadastro"
                    placeholder="Ex: Rua das Flores, 123 - Centro"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="label-input">Modalidades disponíveis</label>
                <div class="checkbox-list">
                  <label
                    v-for="mod in todasModalidades"
                    :key="'cad-' + mod.id"
                    class="checkbox-item"
                    :for="'modalidade-cadastro-' + mod.id"
                  >
                    <input
                      :id="'modalidade-cadastro-' + mod.id"
                      v-model="formCadastro.modalidadesSelecionadas"
                      type="checkbox"
                      :value="mod.id"
                      :disabled="salvandoCadastro"
                    />
                    <span>{{ formatarNomeModalidade(mod.nome) }}</span>
                  </label>
                </div>

                <small v-if="erroModalidadeCadastro" class="erro-modalidade-cadastro">
                  Selecione pelo menos uma modalidade.
                </small>
              </div>

              <div class="form-group">
                <label for="imagemCadastro" class="label-input">Imagem da quadra</label>
                <input
                  id="imagemCadastro"
                  ref="inputImagemCadastro"
                  type="file"
                  class="input-estilizado input-file"
                  @change="handleCadastroFileChange"
                  accept=".jpg, .jpeg, .png"
                  :disabled="salvandoCadastro"
                  required
                />
              </div>

              <div class="modal-actions modal-actions-single">
                <button type="submit" class="btn-confirmar" :disabled="salvandoCadastro">
                  <span class="btn-inline-content">
                    <span v-if="salvandoCadastro" class="btn-inline-spinner" aria-hidden="true"></span>
                    <span>{{ salvandoCadastro ? 'Cadastrando...' : 'Cadastrar unidade' }}</span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div v-if="quadraEditando" class="modal-overlay" @click.self="!salvandoEdicao && fecharModalEdicao()">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-header-copy">
              <h2 class="modal-title">Editar unidade</h2>
              <p class="modal-subtitle">{{ quadraEditando.nome }}</p>
            </div>

            <button
              type="button"
              class="btn-close-x-modal"
              :disabled="salvandoEdicao"
              @click="fecharModalEdicao"
              aria-label="Fechar modal"
            >
              x
            </button>
          </div>

          <div class="modal-body-scroll">
            <form class="modal-form" @submit.prevent="salvarEdicao">
              <div class="form-grid">
                <div class="form-group">
                  <label for="nome" class="label-input">Nome da quadra</label>
                  <input
                    id="nome"
                    v-model="formEdicao.nome"
                    type="text"
                    class="input-estilizado"
                    :disabled="salvandoEdicao"
                    placeholder="Ex: Arena Juruá"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="endereco" class="label-input">Endereço</label>
                  <input
                    id="endereco"
                    v-model="formEdicao.endereco"
                    type="text"
                    class="input-estilizado"
                    :disabled="salvandoEdicao"
                    placeholder="Ex: Rua das Flores, 123 - Centro"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="label-input">Modalidades disponíveis</label>
                <div class="checkbox-list">
                  <label
                    v-for="mod in todasModalidades"
                    :key="mod.id"
                    class="checkbox-item"
                    :for="'mod-' + mod.id"
                  >
                    <input
                      :id="'mod-' + mod.id"
                      v-model="formEdicao.modalidadesSelecionadas"
                      type="checkbox"
                      :value="mod.id"
                      :disabled="salvandoEdicao"
                    />
                    <span>{{ formatarNomeModalidade(mod.nome) }}</span>
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label for="imagem" class="label-input">Atualizar imagem</label>
                <input
                  id="imagem"
                  type="file"
                  class="input-estilizado input-file"
                  @change="handleFileChange"
                  accept=".jpg, .jpeg, .png"
                  :disabled="salvandoEdicao"
                />
              </div>

              <div class="modal-actions modal-actions-single">
                <button type="submit" class="btn-confirmar" :disabled="salvandoEdicao">
                  <span class="btn-inline-content">
                    <span v-if="salvandoEdicao" class="btn-inline-spinner" aria-hidden="true"></span>
                    <span>{{ salvandoEdicao ? 'Salvando...' : 'Confirmar alterações' }}</span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <EditarGradeHorariosModal
        v-if="mostrarModalGrade && quadraParaGrade"
        :quadra="quadraParaGrade"
        @fechar="mostrarModalGrade = false"
        @sucesso="mostrarModalGrade = false"
      />
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2'
import SideBar from '@/components/SideBar.vue'
import NavBarUse from '@/components/NavBarUser.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import api from '@/axios'
import { useAuthStore } from '@/store'
import EditarGradeHorariosModal from '@/components/modals/Horarios/EditarGradeHorariosModal.vue'

export default {
  name: 'AdminGerenciarQuadras',
  components: { SideBar, NavBarUse, LoadingState, EditarGradeHorariosModal },
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
  data() {
    return {
      isMobile: typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
      quadras: [],
      todasModalidades: [],
      isLoading: true,
      quadraEditando: null,
      formEdicao: { nome: '', endereco: '', imagem: null, modalidadesSelecionadas: [] },
      modalCadastroAberto: false,
      formCadastro: { nome: '', endereco: '', imagem: null, modalidadesSelecionadas: [] },
      erroModalidadeCadastro: false,
      salvandoCadastro: false,
      salvandoEdicao: false,
      quadraAlternandoId: null,
      quadraParaGrade: null,
      mostrarModalGrade: false
    }
  },
  computed: {
    usuarioAutenticado() {
      return this.authStore.usuario || JSON.parse(localStorage.getItem('usuario') || 'null')
    },
    permissaoUsuario() {
      return Number(this.usuarioAutenticado?.permissaoId || 0)
    },
    isDesenvolvedor() {
      return this.permissaoUsuario === 1
    },
    isAdministrador() {
      return this.permissaoUsuario === 2
    },
    mostrarNavBarUser() {
      return this.isAdministrador || this.isMobile
    },
    mostrarOverviewCards() {
      return this.isDesenvolvedor
    },
    tituloPagina() {
      return this.isAdministrador ? 'Gerenciar quadra' : 'Gerenciar quadras'
    },
    kickerPainel() {
      return this.isAdministrador ? 'UNIDADE' : 'UNIDADES'
    },
    tituloPainel() {
      return this.isAdministrador ? 'Controle operacional da quadra' : 'Controle operacional das quadras'
    },
    subtituloPainel() {
      if (this.isAdministrador) {
        return 'Edite informações, atualize modalidades, configure horários e altere a disponibilidade da unidade vinculada.'
      }

      return 'Edite informações, atualize modalidades, configure horários e altere a disponibilidade de cada unidade.'
    },
    tituloCarregamento() {
      return this.isAdministrador ? 'Carregando quadra' : 'Carregando quadras'
    },
    descricaoCarregamento() {
      return this.isAdministrador
        ? 'Buscando a unidade e modalidades vinculadas ao seu acesso.'
        : 'Buscando unidades e modalidades vinculadas ao seu acesso.'
    },
    descricaoEstadoVazio() {
      return this.isAdministrador
        ? 'Quando houver uma unidade disponível para você, ela aparecerá aqui.'
        : 'Quando houver unidades disponíveis para você, elas aparecerão aqui.'
    },
    podeCadastrar() {
      return this.isDesenvolvedor
    },
    totalQuadras() {
      return this.quadras.length
    },
    quadrasAtivas() {
      return this.quadras.filter((quadra) => !quadra.interditada).length
    },
    quadrasIndisponiveis() {
      return this.quadras.filter((quadra) => quadra.interditada).length
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
    this.carregarDados()
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleResize() {
      this.isMobile = window.innerWidth <= 768
    },
    async carregarDados({ silencioso = false } = {}) {
      if (!silencioso) {
        this.isLoading = true
      }

      try {
        if (!this.authStore.usuario) {
          this.authStore.carregarDados()
        }

        const [resQuadras, resModalidades] = await Promise.all([
          api.get('/quadra'),
          api.get('/listar/modalidade')
        ])

        const todasAsQuadras = resQuadras.data
        const usuario = this.usuarioAutenticado

        if (!usuario) {
          throw new Error('Usuário autenticado não encontrado.')
        }

        if (Number(usuario.permissaoId) === 2 && Number(usuario.quadraId)) {
          this.quadras = todasAsQuadras.filter((q) => Number(q.id) === Number(usuario.quadraId))
        } else {
          this.quadras = todasAsQuadras
        }

        this.todasModalidades = resModalidades.data
      } catch (err) {
        Swal.fire('Erro de sistema', this.isAdministrador
          ? 'Não foi possível carregar os dados da quadra.'
          : 'Não foi possível carregar os dados das quadras.', 'error')
      } finally {
        if (!silencioso) {
          this.isLoading = false
        }
      }
    },

    abrirModalEdicao(quadra) {
      this.salvandoEdicao = false
      this.quadraEditando = quadra
      this.formEdicao = {
        nome: quadra.nome,
        endereco: quadra.endereco,
        imagem: null,
        modalidadesSelecionadas: (quadra.modalidades || []).map((m) => m.id)
      }
    },

    abrirModalCadastro() {
      this.modalCadastroAberto = true
      this.erroModalidadeCadastro = false
      this.formCadastro = {
        nome: '',
        endereco: '',
        imagem: null,
        modalidadesSelecionadas: []
      }
      this.$nextTick(() => {
        if (this.$refs.inputImagemCadastro) this.$refs.inputImagemCadastro.value = null
      })
    },

    fecharModalCadastro(force = false) {
      if (this.salvandoCadastro && !force) return
      this.modalCadastroAberto = false
      this.erroModalidadeCadastro = false
      this.formCadastro = { nome: '', endereco: '', imagem: null, modalidadesSelecionadas: [] }
      this.$nextTick(() => {
        if (this.$refs.inputImagemCadastro) this.$refs.inputImagemCadastro.value = null
      })
    },

    fecharModalEdicao(force = false) {
      if (this.salvandoEdicao && !force) return
      this.quadraEditando = null
      this.formEdicao = { nome: '', endereco: '', imagem: null, modalidadesSelecionadas: [] }
    },

    abrirModalGrade(quadra) {
      this.quadraParaGrade = quadra
      this.mostrarModalGrade = true
    },

    handleFileChange(event) {
      this.formEdicao.imagem = event.target.files[0]
    },

    handleCadastroFileChange(event) {
      this.formCadastro.imagem = event.target.files?.[0] || null
    },

    async cadastrarQuadraModal() {
      if (this.salvandoCadastro) return

      if (this.formCadastro.modalidadesSelecionadas.length === 0) {
        this.erroModalidadeCadastro = true
        return
      }

      this.erroModalidadeCadastro = false
      this.salvandoCadastro = true

      try {
        let urlImagem = null
        if (this.formCadastro.imagem) {
          const formData = new FormData()
          formData.append('file', this.formCadastro.imagem)
          const uploadRes = await api.post('/upload', formData)
          urlImagem = uploadRes.data.fileUrl
        }

        const modalidadesFormatadas = this.formCadastro.modalidadesSelecionadas.map((id) => ({ id }))

        await api.post('/quadra', {
          nome: this.formCadastro.nome,
          endereco: this.formCadastro.endereco,
          foto: urlImagem,
          modalidades: modalidadesFormatadas
        })

        await Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Quadra cadastrada com sucesso!',
          timer: 2000,
          showConfirmButton: false
        })

        this.fecharModalCadastro(true)
        await this.carregarDados({ silencioso: true })
      } catch (error) {
        Swal.fire(
          'Erro',
          error.response?.data?.error || 'Não foi possível cadastrar a quadra.',
          'error'
        )
      } finally {
        this.salvandoCadastro = false
      }
    },

    async salvarEdicao() {
      if (this.salvandoEdicao) return

      if (this.formEdicao.modalidadesSelecionadas.length === 0) {
        Swal.fire('Aviso', 'É obrigatório selecionar ao menos uma modalidade para a unidade.', 'warning')
        return
      }

      this.salvandoEdicao = true

      try {
        let urlImagem = this.quadraEditando.foto
        if (this.formEdicao.imagem) {
          const formData = new FormData()
          formData.append('file', this.formEdicao.imagem)
          const uploadRes = await api.post('/upload', formData)
          urlImagem = uploadRes.data.fileUrl
        }

        const modalidadesFormatadas = this.formEdicao.modalidadesSelecionadas.map((id) => ({ id }))

        await api.patch(`/quadra/${this.quadraEditando.id}`, {
          nome: this.formEdicao.nome,
          endereco: this.formEdicao.endereco,
          foto: urlImagem,
          modalidades: modalidadesFormatadas
        })

        Swal.fire({
          icon: 'success',
          title: 'Sucesso',
          text: 'Registro atualizado com sucesso.',
          timer: 2000,
          showConfirmButton: false
        })

        this.fecharModalEdicao(true)
        await this.carregarDados({ silencioso: true })
      } catch (err) {
        Swal.fire('Erro', 'Falha ao salvar alterações.', 'error')
      } finally {
        this.salvandoEdicao = false
      }
    },

    async alternarStatus(quadra) {
      if (this.quadraAlternandoId === quadra.id) return

      const novoStatus = !quadra.interditada
      const acaoTexto = novoStatus ? 'interditar' : 'liberar'
      const result = await Swal.fire({
        title: 'Confirmar alteração',
        text: `Deseja ${acaoTexto} a quadra "${quadra.nome}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: novoStatus ? '#1E3A8A' : '#3B82F6',
        cancelButtonColor: '#D9D9D9',
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar'
      })

      if (result.isConfirmed) {
        this.quadraAlternandoId = quadra.id
        try {
          await api.patch(`/quadra/${quadra.id}`, { interditada: novoStatus })
          await this.carregarDados({ silencioso: true })
          Swal.fire('Sucesso', 'Status alterado com sucesso.', 'success')
        } catch (error) {
          Swal.fire('Erro', 'Não foi possível alterar o status.', 'error')
        } finally {
          this.quadraAlternandoId = null
        }
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
.panel-head,
.modal-header {
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
.state-copy,
.modal-subtitle {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: #64748b;
}

.btn-top-action,
.btn-confirmar {
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.btn-top-action:hover:not(:disabled),
.btn-confirmar:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-top-action:disabled,
.btn-confirmar:disabled,
.btn-card:disabled,
.btn-close-x-modal:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-top-action,
.btn-confirmar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.22);
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
}

.btn-label-mobile {
  display: none;
}

.btn-inline-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-inline-spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  animation: spin 0.7s linear infinite;
}

.btn-top-action-icon {
  flex: 0 0 auto;
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
  color: rgba(191, 219, 254, 0.9);
}

.metric-value {
  margin: 0;
  font-size: 30px;
  line-height: 1;
  font-weight: 800;
  color: #0f172a;
}

.overview-card-active .metric-value {
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

.quadras-grid-full {
  grid-template-columns: minmax(0, 1fr);
}

.card-quadra {
  position: relative;
  height: 292px;
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
  background: linear-gradient(
    to top,
    rgba(5, 11, 44, 0.86) 0%,
    rgba(8, 21, 61, 0.44) 48%,
    rgba(8, 21, 61, 0.05) 100%
  );
  z-index: 1;
  pointer-events: none;
}

.card-quadra:hover:not(.is-interditada) {
  transform: translateY(-4px);
  border-color: rgba(96, 165, 250, 0.34);
  box-shadow: 0 20px 36px rgba(15, 23, 42, 0.18), 0 14px 28px rgba(37, 99, 235, 0.18);
}

.imagem-quadra {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
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
  min-width: 110px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
}

.card-status.is-ativo {
  background: rgba(34, 197, 94, 0.94);
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
  gap: 12px;
  padding: 16px;
  color: #ffffff;
}

.card-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
}

.nome-quadra {
  margin: 0;
  font-size: 26px;
  line-height: 1.12;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.03em;
  text-shadow: 0 10px 18px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.55);
}

.endereco {
  margin: 0;
  font-size: 14px;
  line-height: 1.35;
  color: rgba(226, 232, 240, 0.88);
  font-weight: 500;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.tag-modalidade {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
}

.tag-modalidade-muted {
  background: rgba(15, 23, 42, 0.46);
}

.card-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.btn-card {
  min-height: 38px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  padding: 0 12px;
  transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.btn-card:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-card-wide {
  grid-column: 1 / -1;
}

.btn-card-primary {
  background: #3b82f6;
  color: #ffffff;
}

.btn-card-primary:hover {
  background: #2563eb;
}

.btn-card-secondary {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.btn-card-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-card-success {
  background: rgba(34, 197, 94, 0.96);
  color: #ffffff;
}

.btn-card-success:hover {
  background: rgba(22, 163, 74, 0.98);
}

.btn-card-danger {
  background: rgba(239, 68, 68, 0.96);
  color: #ffffff;
}

.btn-card-danger:hover {
  background: rgba(220, 38, 38, 0.98);
}

.loader {
  border: 6px solid #e2e8f0;
  border-top: 6px solid #3b82f6;
  border-radius: 50%;
  width: 72px;
  height: 72px;
  animation: spin 1s linear infinite;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 100%;
  max-width: 920px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  overflow: hidden;
}

.modal-content-cadastro {
  max-width: 860px;
}

.modal-title {
  margin: 0;
  font-size: 26px;
  line-height: 1.1;
  font-weight: 800;
  color: #2563eb;
}

.modal-body-scroll {
  overflow-y: auto;
  padding-right: 4px;
}

.modal-header-copy {
  flex: 1;
  min-width: 0;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label-input {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.input-estilizado {
  width: 100%;
  min-height: 46px;
  padding: 0 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #f8fafc;
  font-size: 14px;
  color: #334155;
}

.input-estilizado:focus {
  outline: none;
  border-color: rgba(37, 99, 235, 0.45);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.input-file {
  min-height: auto;
  padding: 11px 12px;
}

.checkbox-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #f8fafc;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px 10px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.16);
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.checkbox-item input {
  margin: 0;
}

.erro-modalidade-cadastro {
  color: #dc2626;
  font-size: 12px;
  font-weight: 700;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-actions-single .btn-confirmar {
  width: 100%;
}

.btn-close-x-modal {
  width: 38px;
  height: 38px;
  border: 1px solid rgba(37, 99, 235, 0.24);
  border-radius: 999px;
  background: #ffffff;
  color: #2563eb;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 38px;
  padding: 0;
}

.btn-close-x-modal:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .checkbox-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .header-topline,
  .panel-head,
  .modal-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .quadras-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .checkbox-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

  .header-topline {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: nowrap;
  }

  .title {
    font-size: 24px;
    line-height: 1.12;
    min-width: 0;
  }

  .btn-top-action {
    min-height: 40px;
    width: auto;
    padding: 0 12px;
    flex: 0 0 auto;
    border-radius: 14px;
    font-size: 14px;
  }

  .btn-label-desktop {
    display: none;
  }

  .btn-label-mobile {
    display: inline;
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
    height: 304px;
    border-radius: 20px;
  }

  .card-status {
    min-width: 108px;
    height: 34px;
    font-size: 11px;
  }

  .overlay {
    padding: 14px;
    gap: 10px;
  }

  .card-copy {
    max-width: 100%;
  }

  .nome-quadra {
    font-size: 20px;
  }

  .endereco {
    font-size: 13px;
  }

  .checkbox-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .modal-overlay {
    padding: 14px;
  }

  .modal-content {
    padding: 18px;
    border-radius: 22px;
  }

  .modal-title {
    font-size: 22px;
  }

  .modal-content .modal-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: nowrap;
  }
}
</style>
