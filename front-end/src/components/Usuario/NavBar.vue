<template>
  <nav class="navbar-custom">
    <div class="navbar-container">
      <div class="left-actions">
        <button
          type="button"
          class="hamburger"
          :class="{ active: isMenuOpen }"
          aria-label="Abrir menu"
          :aria-expanded="String(isMenuOpen)"
          @click="toggleMenu"
        >
          <span :class="{ open: isMenuOpen }"></span>
          <span :class="{ open: isMenuOpen }"></span>
          <span :class="{ open: isMenuOpen }"></span>
        </button>

        <div class="logo-container">
          <img src="@/assets/logo.png" alt="Quadra Play" class="logo-img" />
        </div>
      </div>

      <div class="nav-links">
        <button
          type="button"
          class="nav-link"
          :class="{ active: isActive('/agendarquadra') }"
          @click="navegar('/agendarquadra')"
        >
          Agendar Quadra
        </button>

        <button
          type="button"
          class="nav-link"
          :class="{ active: isActive('/meusagendamentos') }"
          @click="navegar('/meusagendamentos')"
        >
          Meus Agendamentos
        </button>

        <button
          type="button"
          class="nav-link nav-link-badge"
          :class="{ active: isActive('/meusavisos') }"
          @click="navegar('/meusavisos')"
        >
          <span>Meus Avisos</span>
          <span v-if="totalNotificacoes > 0" class="badge-avisos">
            {{ totalNotificacoes }}
          </span>
        </button>

        <button
          v-if="possuiJogadorVinculado"
          type="button"
          class="nav-link"
          :class="{ active: isActive('/minhasestatisticas') }"
          @click="navegar('/minhasestatisticas')"
        >
          Minhas Estatísticas
        </button>
      </div>

      <div class="nav-actions">
        <button
          type="button"
          class="desktop-profile-trigger"
          aria-label="Editar perfil"
          @click="abrirModalPerfil"
        >
          <span class="desktop-profile-avatar">
            <img
              v-if="usuarioLogado?.foto"
              :src="usuarioLogado.foto"
              :alt="`Foto de ${usuarioLogado?.nome || 'usuario'}`"
            />
            <span v-else>{{ userInitial }}</span>
          </span>
          <span class="desktop-profile-name">{{ usuarioLogado?.nome || 'Usuário' }}</span>
        </button>

        <button type="button" class="desktop-logout" @click="logout">
          Sair
        </button>

        <button type="button" class="mobile-avisos" @click="navegar('/meusavisos')">
          <span>Avisos</span>
          <strong v-if="totalNotificacoes > 0">{{ totalNotificacoes }}</strong>
        </button>
      </div>
    </div>

    <transition name="drawer-fade">
      <div v-if="isMenuOpen && isMobile" class="mobile-menu-overlay" @click="closeMenu"></div>
    </transition>

    <aside class="mobile-drawer" :class="{ open: isMenuOpen }" @click.stop>
      <div class="drawer-header">
        <div class="drawer-brand">
          <div class="drawer-brand-top">
            <div class="drawer-brand-copy">
              <span class="drawer-kicker">Área do usuário</span>
            </div>
          </div>

        </div>

        <button type="button" class="drawer-close" aria-label="Fechar menu" @click="closeMenu">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div class="drawer-links">
        <button
          type="button"
          class="drawer-link"
          :class="{ active: isActive('/agendarquadra') }"
          @click="navegar('/agendarquadra')"
        >
          <span class="drawer-link-title">Agendar Quadra</span>
          <span class="drawer-link-subtitle">Escolha a quadra e faça uma nova reserva.</span>
        </button>

        <button
          type="button"
          class="drawer-link"
          :class="{ active: isActive('/meusagendamentos') }"
          @click="navegar('/meusagendamentos')"
        >
          <span class="drawer-link-title">Meus Agendamentos</span>
          <span class="drawer-link-subtitle">Consulte reservas atuais e histórico.</span>
        </button>

        <button
          type="button"
          class="drawer-link drawer-link-badge"
          :class="{ active: isActive('/meusavisos') }"
          @click="navegar('/meusavisos')"
        >
          <span class="drawer-link-main">
            <span class="drawer-link-title">Meus Avisos</span>
            <span class="drawer-link-subtitle">Acompanhe mensagens e atualizações.</span>
          </span>

          <span v-if="totalNotificacoes > 0" class="badge-avisos large">
            {{ totalNotificacoes }}
          </span>
        </button>

        <button
          v-if="possuiJogadorVinculado"
          type="button"
          class="drawer-link"
          :class="{ active: isActive('/minhasestatisticas') }"
          @click="navegar('/minhasestatisticas')"
        >
          <span class="drawer-link-title">Minhas Estatísticas</span>
          <span class="drawer-link-subtitle">Veja gols, cartões e desempenho do jogador vinculado.</span>
        </button>
      </div>

      <div class="drawer-footer">
        <button
          type="button"
          class="drawer-user-card"
          aria-label="Editar perfil"
          @click="abrirModalPerfil"
        >
          <div class="drawer-user-avatar">
            <img
              v-if="usuarioLogado?.foto"
              :src="usuarioLogado.foto"
              :alt="`Foto de ${usuarioLogado?.nome || 'usuario'}`"
            />
            <span v-else>{{ userInitial }}</span>
          </div>

          <div class="drawer-user-copy">
            <strong>{{ usuarioLogado?.nome || 'Usuário' }}</strong>
            <span>{{ userResumo }}</span>
          </div>
        </button>

        <button type="button" class="drawer-logout" @click="logout">
          Sair
        </button>
      </div>
    </aside>

    <transition name="drawer-fade">
      <div v-if="isPerfilModalOpen" class="profile-modal-overlay" @click="fecharModalPerfil">
        <div
          class="profile-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
          @click.stop
        >
          <header class="profile-modal-header">
            <h2 id="profile-modal-title">Editar perfil</h2>
            <button type="button" class="profile-modal-close" aria-label="Fechar" @click="fecharModalPerfil">
              x
            </button>
          </header>

          <div class="profile-avatar-wrap">
            <div class="profile-avatar-preview">
              <img
                v-if="perfilFotoPreview || perfilForm.foto"
                :src="perfilFotoPreview || perfilForm.foto"
                :alt="`Foto de ${perfilForm.nome || 'usuario'}`"
              />
              <span v-else>{{ userInitial }}</span>
            </div>

            <label class="profile-avatar-upload">
              Alterar foto
              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/*"
                @change="handlePerfilFotoChange"
              />
            </label>
          </div>

          <div class="profile-form-grid">
            <label class="profile-field">
              <span>Nome</span>
              <input
                v-model.trim="perfilForm.nome"
                type="text"
                maxlength="120"
                placeholder="Digite seu nome"
              />
            </label>

            <label class="profile-field">
              <span>Telefone</span>
              <input
                v-model="perfilForm.telefone"
                type="tel"
                inputmode="tel"
                maxlength="15"
                placeholder="(00) 00000-0000"
                @input="formatarTelefonePerfil"
              />
            </label>

            <label class="profile-field">
              <span>E-mail</span>
              <input
                v-model.trim="perfilForm.email"
                type="email"
                maxlength="120"
                placeholder="Digite seu e-mail"
              />
            </label>
          </div>

          <div class="profile-actions">
            <button
              type="button"
              class="profile-save"
              :disabled="isSalvandoPerfil || isExcluindoConta"
              @click="salvarPerfil"
            >
              <svg
                v-if="!isSalvandoPerfil"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="profile-save-icon"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05"/>
              </svg>
              <span>{{ isSalvandoPerfil ? 'Salvando...' : 'Salvar' }}</span>
            </button>

            <button
              type="button"
              class="profile-delete"
              :disabled="isSalvandoPerfil || isExcluindoConta"
              @click="confirmarExclusaoConta"
            >
              {{ isExcluindoConta ? 'Excluindo...' : 'Excluir conta' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </nav>
</template>

<script>
import router from '@/router'
import api from '@/axios'
import Swal from 'sweetalert2'

export default {
  name: 'NavbarUser',

  data() {
    return {
      isMenuOpen: false,
      isMobile: typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
      usuarioLogado: {},
      todosAvisos: [],
      isPerfilModalOpen: false,
      isSalvandoPerfil: false,
      isExcluindoConta: false,
      perfilFotoArquivo: null,
      perfilFotoPreview: '',
      perfilForm: {
        nome: '',
        telefone: '',
        email: '',
        foto: '',
      },
    }
  },

  computed: {
    totalNotificacoes() {
      if (!this.usuarioLogado.id) return 0

      return this.todosAvisos.filter(aviso => {
        if (!aviso.leituras || aviso.leituras.length === 0) return true

        return !aviso.leituras.some(
          l => Number(l.usuarioId) === Number(this.usuarioLogado.id)
        )
      }).length
    },

    userInitial() {
      return String(this.usuarioLogado?.nome || 'U')
        .trim()
        .charAt(0)
        .toUpperCase()
    },

    userResumo() {
      if (this.totalNotificacoes > 0) {
        return `${this.totalNotificacoes} aviso(s) pendente(s)`
      }
      return 'Área do usuário'
    },

    possuiJogadorVinculado() {
      const jogadorIdDireto = Number(this.usuarioLogado?.jogadorId)
      if (Number.isInteger(jogadorIdDireto) && jogadorIdDireto > 0) return true

      const jogadorIdObjeto = Number(this.usuarioLogado?.jogador?.id)
      return Number.isInteger(jogadorIdObjeto) && jogadorIdObjeto > 0
    }
  },

  mounted() {
    this.carregarUsuario()
    this.sincronizarVinculoJogador()
    this.carregarAvisos()
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('avisos-atualizados', this.carregarAvisos)
    this.handleResize()
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('avisos-atualizados', this.carregarAvisos)
    this.syncBodyScroll(false)
    this.limparPerfilFotoSelecionada()
  },

  watch: {
    '$route.fullPath'() {
      this.closeMenu()
    }
  },

  methods: {
    carregarUsuario() {
      try {
        this.usuarioLogado = JSON.parse(localStorage.getItem('usuario')) || {}
      } catch {
        this.usuarioLogado = {}
      }
      this.sincronizarPerfilForm()
    },

    async sincronizarVinculoJogador() {
      if (!this.usuarioLogado?.id) return

      const possuiIndicadorJogador =
        Object.prototype.hasOwnProperty.call(this.usuarioLogado, 'jogadorId') ||
        Object.prototype.hasOwnProperty.call(this.usuarioLogado, 'jogador')

      if (possuiIndicadorJogador) return

      try {
        const { data } = await api.get('/estatisticas/jogador', {
          requiresAuth: true,
          silent: true,
        })

        const jogador = data?.jogador || null
        const jogadorId = Number(jogador?.id)

        this.usuarioLogado = {
          ...this.usuarioLogado,
          jogadorId: Number.isInteger(jogadorId) && jogadorId > 0 ? jogadorId : null,
          jogador,
        }

        localStorage.setItem('usuario', JSON.stringify(this.usuarioLogado))
      } catch (err) {
        if (Number(err?.response?.status) !== 404) return

        this.usuarioLogado = {
          ...this.usuarioLogado,
          jogadorId: null,
          jogador: null,
        }

        localStorage.setItem('usuario', JSON.stringify(this.usuarioLogado))
      }
    },

    sincronizarPerfilForm() {
      this.perfilForm = {
        nome: String(this.usuarioLogado?.nome || '').trim(),
        telefone: String(this.usuarioLogado?.telefone || '').trim(),
        email: String(this.usuarioLogado?.email || '').trim(),
        foto: String(this.usuarioLogado?.foto || '').trim(),
      }
    },

    abrirModalPerfil() {
      this.sincronizarPerfilForm()
      this.limparPerfilFotoSelecionada()
      this.isPerfilModalOpen = true
    },

    fecharModalPerfil() {
      if (this.isSalvandoPerfil || this.isExcluindoConta) return
      this.isPerfilModalOpen = false
      this.limparPerfilFotoSelecionada()
      this.sincronizarPerfilForm()
    },

    limparPerfilFotoSelecionada() {
      if (this.perfilFotoPreview && typeof URL !== 'undefined') {
        URL.revokeObjectURL(this.perfilFotoPreview)
      }
      this.perfilFotoPreview = ''
      this.perfilFotoArquivo = null
    },

    handlePerfilFotoChange(event) {
      const arquivo = event?.target?.files?.[0]
      this.limparPerfilFotoSelecionada()

      if (!arquivo) return

      this.perfilFotoArquivo = arquivo
      this.perfilFotoPreview = URL.createObjectURL(arquivo)
    },

    formatarTelefonePerfil() {
      const valor = String(this.perfilForm.telefone || '').replace(/\D/g, '').slice(0, 11)
      if (!valor) {
        this.perfilForm.telefone = ''
        return
      }

      if (valor.length <= 2) {
        this.perfilForm.telefone = `(${valor}`
      } else if (valor.length <= 6) {
        this.perfilForm.telefone = `(${valor.slice(0, 2)}) ${valor.slice(2)}`
      } else if (valor.length <= 10) {
        this.perfilForm.telefone = `(${valor.slice(0, 2)}) ${valor.slice(2, 6)}-${valor.slice(6)}`
      } else {
        this.perfilForm.telefone = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`
      }
    },

    async uploadFotoPerfil() {
      if (!this.perfilFotoArquivo) {
        return this.perfilForm.foto || null
      }

      const formData = new FormData()
      formData.append('file', this.perfilFotoArquivo)

      const { data } = await api.post('/upload', formData, { requiresAuth: true })
      return data?.fileUrl || data?.url || null
    },

    async salvarPerfil() {
      if (this.isSalvandoPerfil || this.isExcluindoConta) return

      const nome = String(this.perfilForm.nome || '').trim()
      const email = String(this.perfilForm.email || '').trim().toLowerCase()
      const telefone = String(this.perfilForm.telefone || '').trim()
      const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

      if (!nome || !email) {
        await Swal.fire('Atenção', 'Preencha nome e e-mail para continuar.', 'warning')
        return
      }

      if (!emailValido) {
        await Swal.fire('Atenção', 'Informe um e-mail válido.', 'warning')
        return
      }

      this.isSalvandoPerfil = true

      try {
        const foto = await this.uploadFotoPerfil()
        const payload = { nome, email, telefone, foto }
        const { data } = await api.put('/editar/usuario', payload, { requiresAuth: true })

        const usuarioAtualizado = data?.usuario || {}
        if (data?.token) {
          localStorage.setItem('token', data.token)
        }

        if (usuarioAtualizado?.id) {
          this.usuarioLogado = usuarioAtualizado
        } else {
          this.usuarioLogado = { ...this.usuarioLogado, ...payload }
        }

        localStorage.setItem('usuario', JSON.stringify(this.usuarioLogado))
        this.isPerfilModalOpen = false
        this.limparPerfilFotoSelecionada()
        this.sincronizarPerfilForm()

        await Swal.fire('Sucesso', 'Perfil atualizado com sucesso.', 'success')
      } catch (err) {
        const mensagem =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Não foi possível atualizar o perfil.'
        await Swal.fire('Erro', mensagem, 'error')
      } finally {
        this.isSalvandoPerfil = false
      }
    },

    async confirmarExclusaoConta() {
      if (this.isSalvandoPerfil || this.isExcluindoConta) return

      const confirmacao = await Swal.fire({
        title: 'Excluir conta?',
        text: 'Você tem certeza que deseja excluir sua conta?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
      })

      if (!confirmacao.isConfirmed) return
      await this.excluirConta()
    },

    async excluirConta() {
      this.isExcluindoConta = true

      try {
        await api.delete('/delete/usuario', { requiresAuth: true })

        this.isPerfilModalOpen = false
        this.limparPerfilFotoSelecionada()
        this.closeMenu()
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        localStorage.removeItem('quadraPlayLoginAtivo')

        await Swal.fire('Conta excluída', 'Sua conta foi excluída com sucesso.', 'success')
        router.push('/')
      } catch (err) {
        const mensagem =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Não foi possível excluir sua conta.'
        await Swal.fire('Erro', mensagem, 'error')
      } finally {
        this.isExcluindoConta = false
      }
    },

    async carregarAvisos() {
      if (!this.usuarioLogado.id) return

      try {
        const { data } = await api.get('/avisos')
        this.todosAvisos = Array.isArray(data) ? data : []
      } catch (err) {
        console.error('Erro ao buscar avisos:', err)
        this.todosAvisos = []
      }
    },

    handleResize() {
      this.isMobile = window.innerWidth <= 768
      if (!this.isMobile) {
        this.closeMenu()
      }
    },

    syncBodyScroll(shouldLock) {
      if (typeof document === 'undefined') return
      document.body.style.overflow = shouldLock ? 'hidden' : ''
    },

    isActive(path) {
      return this.$route.path === path
    },

    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen
      this.syncBodyScroll(this.isMenuOpen && this.isMobile)
    },

    closeMenu() {
      this.isMenuOpen = false
      this.syncBodyScroll(false)
    },

    navegar(path) {
      this.closeMenu()
      if (this.$route.path !== path) {
        router.push(path)
      }
    },

    logout() {
      this.isPerfilModalOpen = false
      this.closeMenu()
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      localStorage.removeItem('quadraPlayLoginAtivo')
      router.push('/')
    }
  }
}
</script>

<style scoped>
.navbar-custom {
  --nav-bg-start: #152147;
  --nav-bg-end: #0d1736;
  --nav-border: rgba(148, 163, 184, 0.2);
  position: fixed;
  inset: 0 0 auto;
  height: 70px;
  z-index: 1200;
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.18), transparent 34%),
    linear-gradient(135deg, var(--nav-bg-start), var(--nav-bg-end));
  border-bottom: 1px solid var(--nav-border);
  box-shadow: 0 16px 34px rgba(2, 6, 23, 0.24);
}

.navbar-container {
  height: 100%;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 0 0 auto;
}

.logo-container {
  display: inline-flex;
  align-items: center;
}

.logo-img {
  height: 56px;
  width: auto;
  display: block;
}

.nav-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1 1 auto;
  min-width: 0;
}

.nav-link {
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: rgba(226, 232, 240, 0.9);
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.nav-link.active {
  background: rgba(59, 130, 246, 0.16);
  border-color: rgba(96, 165, 250, 0.18);
  color: #ffffff;
}

.nav-link-badge {
  position: relative;
}

.badge-avisos {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #60a5fa;
  color: #0f172a;
  font-size: 11px;
  font-weight: 800;
}

.badge-avisos.large {
  min-width: 28px;
  height: 28px;
  font-size: 12px;
}

.nav-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex: 0 0 auto;
}

.desktop-logout,
.mobile-avisos {
  min-height: 42px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 999px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.desktop-profile-trigger {
  min-height: 42px;
  max-width: 220px;
  padding: 4px 12px 4px 4px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  font: inherit;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.desktop-profile-trigger:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(191, 219, 254, 0.35);
}

.desktop-profile-trigger:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.9);
  outline-offset: 2px;
}

.desktop-profile-avatar {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 999px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
}

.desktop-profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.desktop-profile-name {
  display: block;
  max-width: 145px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}

.desktop-logout {
  border: 1px solid rgba(96, 165, 250, 0.18);
  background: rgba(37, 99, 235, 0.88);
  color: #ffffff;
}

.mobile-avisos {
  display: none;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.mobile-avisos strong {
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #60a5fa;
  color: #0f172a;
  font-size: 11px;
}

.hamburger {
  display: none;
  width: 42px;
  height: 42px;
  padding: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
}

.hamburger span {
  width: 18px;
  height: 2px;
  background: #ffffff;
  border-radius: 999px;
  transition: transform 0.24s ease, opacity 0.24s ease;
}

.hamburger span.open:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.hamburger span.open:nth-child(2) {
  opacity: 0;
}

.hamburger span.open:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

.mobile-menu-overlay {
  position: fixed;
  inset: 70px 0 0;
  z-index: 1210;
  background: rgba(7, 13, 32, 0.54);
  backdrop-filter: blur(6px);
}

.mobile-drawer {
  position: fixed;
  top: 78px;
  left: 10px;
  bottom: calc(8px + env(safe-area-inset-bottom));
  z-index: 1220;
  width: min(88vw, 352px);
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.12), transparent 38%),
    linear-gradient(180deg, #162452 0%, #0f1d47 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28px;
  box-shadow: 0 26px 44px rgba(2, 6, 23, 0.4);
  overflow: hidden;
  transform: translateX(-112%);
  transition: transform 0.26s ease;
}

.mobile-drawer.open {
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.drawer-brand {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.drawer-brand-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drawer-logo {
  width: 50px;
  height: 50px;
  flex: 0 0 50px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
}

.drawer-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.drawer-brand-copy {
  display: grid;
  gap: 2px;
}

.drawer-kicker {
  color: rgba(191, 219, 254, 0.76);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.drawer-title {
  color: #ffffff;
  font-size: 22px;
  line-height: 1.05;
}

.drawer-subtitle {
  color: rgba(191, 219, 254, 0.72);
  font-size: 12px;
  line-height: 1.35;
}

.drawer-close {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  cursor: pointer;
}

.drawer-close svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.drawer-links {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  gap: 8px;
  padding: 10px 12px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.drawer-links::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.drawer-link {
  width: 100%;
  display: grid;
  gap: 3px;
  padding: 12px 13px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  color: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.drawer-link:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.06);
}

.drawer-link.active {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.22), rgba(96, 165, 250, 0.14));
  border-color: rgba(96, 165, 250, 0.28);
  box-shadow: inset 3px 0 0 #60a5fa;
}

.drawer-link-badge {
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
}

.drawer-link-main {
  display: grid;
  gap: 4px;
}

.drawer-link-title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.15;
}

.drawer-link-subtitle {
  color: rgba(191, 219, 254, 0.72);
  font-size: 12px;
  line-height: 1.32;
}

.drawer-footer {
  display: grid;
  gap: 8px;
  padding: 10px 12px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.drawer-user-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.drawer-user-card:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.09);
}

.drawer-user-card:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.9);
  outline-offset: 1px;
  border-color: rgba(96, 165, 250, 0.5);
}

.profile-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1250;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(2, 6, 23, 0.68);
  backdrop-filter: blur(6px);
}

.profile-modal {
  width: min(92vw, 620px);
  display: grid;
  gap: 16px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.2), transparent 46%),
    linear-gradient(180deg, #162452 0%, #0f1d47 100%);
  box-shadow: 0 20px 44px rgba(2, 6, 23, 0.45);
  color: #e2e8f0;
}

.profile-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.profile-modal-header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 20px;
  line-height: 1.2;
}

.profile-modal-close {
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font: inherit;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.profile-modal-close:hover {
  background: rgba(255, 255, 255, 0.14);
}

.profile-modal-close:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.8);
  outline-offset: 2px;
}

.profile-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-avatar-preview {
  width: 74px;
  height: 74px;
  flex: 0 0 74px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 24px;
  font-weight: 800;
}

.profile-avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar-upload {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(96, 165, 250, 0.32);
  background: rgba(37, 99, 235, 0.22);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.profile-avatar-upload input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.profile-form-grid {
  display: grid;
  gap: 10px;
}

.profile-field {
  display: grid;
  gap: 6px;
}

.profile-field span {
  color: rgba(191, 219, 254, 0.9);
  font-size: 12px;
  font-weight: 700;
}

.profile-field input {
  width: 100%;
  min-height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.55);
  color: #f8fafc;
  font: inherit;
  font-size: 14px;
  padding: 0 12px;
}

.profile-field input::placeholder {
  color: rgba(191, 219, 254, 0.55);
}

.profile-field input:focus {
  outline: none;
  border-color: rgba(96, 165, 250, 0.85);
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.18);
}

.profile-actions {
  display: grid;
  gap: 10px;
}

.profile-save,
.profile-delete {
  min-height: 44px;
  border-radius: 14px;
  border: 1px solid transparent;
  color: #ffffff;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.profile-save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border-color: rgba(147, 197, 253, 0.4);
}

.profile-save-icon {
  flex: 0 0 auto;
}

.profile-delete {
  background: rgba(239, 68, 68, 0.16);
  border-color: rgba(248, 113, 113, 0.32);
}

.profile-save:disabled,
.profile-delete:disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

.profile-save:not(:disabled):hover,
.profile-delete:not(:disabled):hover {
  transform: translateY(-1px);
}

.profile-save:not(:disabled):active,
.profile-delete:not(:disabled):active {
  transform: translateY(0);
}

.drawer-user-avatar {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 14px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 17px;
  font-weight: 800;
}

.drawer-user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.drawer-user-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.drawer-user-copy strong {
  color: #ffffff;
  font-size: 14px;
}

.drawer-user-copy span {
  color: rgba(191, 219, 254, 0.72);
  font-size: 11px;
  line-height: 1.3;
}

.drawer-logout {
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid rgba(248, 113, 113, 0.24);
  border-radius: 14px;
  background: rgba(248, 113, 113, 0.1);
  color: #ffffff;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.drawer-logout:hover {
  transform: translateY(-1px);
  background: rgba(248, 113, 113, 0.16);
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.22s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .navbar-container {
    padding: 0 14px;
    gap: 12px;
  }

  .nav-links,
  .desktop-logout,
  .desktop-profile-trigger {
    display: none;
  }

  .hamburger,
  .mobile-avisos {
    display: inline-flex;
  }

  .logo-img {
    height: 48px;
  }

  .profile-modal-overlay {
    padding: 12px;
  }

  .profile-modal {
    width: 100%;
    max-height: calc(100vh - 24px);
    overflow-y: auto;
    padding: 16px;
  }

  .profile-avatar-wrap {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (min-width: 769px) {
  .mobile-menu-overlay,
  .mobile-drawer {
    display: none;
  }
}
</style>
