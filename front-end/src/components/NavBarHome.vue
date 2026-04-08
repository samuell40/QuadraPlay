<template>
  <nav class="navbar-custom">
    <div class="navbar-container">
      <div class="left-actions">
        <button type="button" class="hamburger" :class="{ active: isMenuOpen }" aria-label="Abrir menu"
          :aria-expanded="String(isMenuOpen)" @click="toggleMenu">
          <span :class="{ open: isMenuOpen }"></span>
          <span :class="{ open: isMenuOpen }"></span>
          <span :class="{ open: isMenuOpen }"></span>
        </button>

        <a href="#" class="quadra-play desktop-only nav-quadra-desktop" @click.prevent="loginQuadraPlayComGoogle">
          <span>Campeonatos</span>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path fill-rule="evenodd"
              d="M1 11.5a.5.5 0 0 0 .5.5h11.793l-3.147 3.146a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 11H1.5a.5.5 0 0 0-.5.5m14-7a.5.5 0 0 1-.5.5H2.707l3.147 3.146a.5.5 0 1 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H14.5a.5.5 0 0 1 .5.5" />
          </svg>
        </a>
      </div>

      <div class="nav-links">
        <button type="button" class="nav-link" :class="{ active: isActive('/times') }" @click="navegar('/times')">
          Times
        </button>
        <button type="button" class="nav-link" :class="{ active: isActive('/visualizarplacarhome') }"
          @click="navegar('/visualizarplacarhome')">
          Placar e Resultados
        </button>
        <button type="button" class="nav-link" :class="{ active: isActive('/horarios-publico') }"
          @click="navegar('/horarios-publico')">
          Horários
        </button>
        <button type="button" class="nav-link" :class="{ active: isActive('/') }" @click="navegar('/')">
          Tela Inicial
        </button>
      </div>

      <div class="nav-actions">
        <a href="#" class="login desktop-only" @click.prevent="loginComGoogle">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle"
            viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
            <path
              d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
          </svg>
          <span>Login</span>
        </a>

        <a href="#" class="mobile-login" @click.prevent="loginComGoogle">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle"
            viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
            <path
              d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
          </svg>
          <span>Login</span>
        </a>
      </div>
    </div>

    <transition name="drawer-fade">
      <div v-if="isMenuOpen && isMobile" class="mobile-menu-overlay" @click="closeMenu"></div>
    </transition>

    <aside class="mobile-drawer" :class="{ open: isMenuOpen }" @click.stop>
      <div class="drawer-header">
        <div class="drawer-brand">
          <span class="drawer-kicker">Quadra Play SV</span>
          <strong class="drawer-title">Navegação</strong>
          <span class="drawer-subtitle">Acesse as áreas públicas e entre na sua conta.</span>
        </div>

        <button type="button" class="drawer-close" aria-label="Fechar menu" @click="closeMenu">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div class="drawer-links">
        <button type="button" class="drawer-link" :class="{ active: isActive('/times') }" @click="navegar('/times')">
          <span class="drawer-link-title">Times</span>
          <span class="drawer-link-subtitle">Veja as equipes cadastradas.</span>
        </button>

        <button type="button" class="drawer-link" :class="{ active: isActive('/visualizarplacarhome') }"
          @click="navegar('/visualizarplacarhome')">
          <span class="drawer-link-title">Placar e Resultados</span>
          <span class="drawer-link-subtitle">Acompanhe fases, rodadas e placares.</span>
        </button>

        <button type="button" class="drawer-link" :class="{ active: isActive('/horarios-publico') }"
          @click="navegar('/horarios-publico')">
          <span class="drawer-link-title">Horários</span>
          <span class="drawer-link-subtitle">Consulte a grade semanal das quadras.</span>
        </button>

        <button type="button" class="drawer-link" :class="{ active: isActive('/') }" @click="navegar('/')">
          <span class="drawer-link-title">Tela Inicial</span>
          <span class="drawer-link-subtitle">Voltar para a página principal.</span>
        </button>
      </div>

      <div class="drawer-footer">
        <button type="button" class="drawer-action secondary" @click="loginQuadraPlayComGoogle">
          <span>Campeonatos</span>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path fill-rule="evenodd"
              d="M1 11.5a.5.5 0 0 0 .5.5h11.793l-3.147 3.146a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 11H1.5a.5.5 0 0 0-.5.5m14-7a.5.5 0 0 1-.5.5H2.707l3.147 3.146a.5.5 0 1 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H14.5a.5.5 0 0 1 .5.5" />
          </svg>
        </button>
      </div>
    </aside>
  </nav>
</template>

<script>
import router from '@/router'
import Swal from 'sweetalert2'
import { useAuthStore } from '@/store'
import { redirecionarMesarioPosLogin } from '@/utils/quadraPlayMesarioRedirect'
import api from '@/axios'

const QUADRA_PLAY_LOGIN_KEY = 'quadraPlayLoginAtivo'

export default {
  name: 'NavbarQuadra',

  data() {
    return {
      isMenuOpen: false,
      isMobile: typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
      mostrarModalLogin: false
    }
  },

  mounted() {
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    this.syncBodyScroll(false)
  },

  watch: {
    '$route.fullPath'() {
      this.closeMenu()
    }
  },

  methods: {
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
      if (this.$route.path === path) {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
        return
      }

      router.push(path)
    },

    irParaLogin() {
      this.mostrarModalLogin = true
    },

    loginComGoogle() {
      this.closeMenu()
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

      const listener = async event => {
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

        const { token, erro, email, usuario, redirecionarPara } = event.data || {}

        if (redirecionarPara) {
          window.removeEventListener('message', listener)
          if (popup) popup.close()
          window.location.href = redirecionarPara
          return
        }

        if (erro === 'usuario_nao_cadastrado') {
          window.removeEventListener('message', listener)
          if (popup) popup.close()
          const queryCadastro = new URLSearchParams({
            email: String(email || ''),
            origem: 'login_google'
          })
          window.location.href = `/cadastro?${queryCadastro.toString()}`
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
          localStorage.removeItem(QUADRA_PLAY_LOGIN_KEY)

          const quadraSelecionada = JSON.parse(
            localStorage.getItem('quadraSelecionada')
          )

          if ([1, 2].includes(usuario.permissaoId)) {
            router.push({ name: 'Dashboard' })
          } else if ([3, 4, 5].includes(usuario.permissaoId)) {
            if (quadraSelecionada) {
              router.push({
                name: 'agendar_quadra',
                query: { quadraId: quadraSelecionada.id }
              })
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

    loginQuadraPlayComGoogle() {
      this.closeMenu()
      const width = 500
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2.5
      const backendBaseUrl = String(api?.defaults?.baseURL || 'https://quadra-livre-backend.onrender.com')
        .trim()
        .replace(/\/+$/, '')

      const popup = window.open(
        `${backendBaseUrl}/auth/google`,
        'Login QuadraPlay',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      const listener = async event => {
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

        const { token, erro, email, usuario, redirecionarPara } = event.data || {}

        if (redirecionarPara) {
          window.removeEventListener('message', listener)
          if (popup) popup.close()
          window.location.href = redirecionarPara
          return
        }

        if (erro === 'usuario_nao_cadastrado') {
          window.removeEventListener('message', listener)
          if (popup) popup.close()
          const queryCadastro = new URLSearchParams({
            email: String(email || ''),
            etapa: 'concluir_conta'
          })
          window.location.href = `/cadastro?${queryCadastro.toString()}`
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

          if ([1, 2].includes(usuario.permissaoId)) {
            localStorage.setItem(QUADRA_PLAY_LOGIN_KEY, '1')
            router.push({ name: 'TelaInicial' })
          } else if (usuario.permissaoId === 4) {
            localStorage.setItem(QUADRA_PLAY_LOGIN_KEY, '1')
            await redirecionarMesarioPosLogin(router)
          } else if ([3, 5].includes(usuario.permissaoId)) {
            localStorage.removeItem(QUADRA_PLAY_LOGIN_KEY)
            Swal.fire({
              icon: 'warning',
              title: 'Acesso negado',
              text: 'Você não tem permissão para acessar o QuadraPlay.'
            })
          } else {
            localStorage.removeItem(QUADRA_PLAY_LOGIN_KEY)
            Swal.fire({
              icon: 'info',
              title: 'Acesso não permitido',
              text: 'Seu perfil não possui acesso ao QuadraPlay.'
            })
          }
        }

        window.removeEventListener('message', listener)
        if (popup) popup.close()
      }

      window.addEventListener('message', listener, false)
    }
  }
}
</script>

<style scoped>
.navbar-custom {
  --nav-bg-start: #152147;
  --nav-bg-end: #0d1736;
  --nav-accent: #60a5fa;
  --nav-surface: rgba(255, 255, 255, 0.08);
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
  max-width: 1240px;
  height: 100%;
  margin: 0 auto;
  padding: 0 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
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

.nav-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex: 0 0 auto;
}

.login,
.mobile-login,
.quadra-play {
  min-height: 42px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 999px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
  transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.login,
.mobile-login {
  background: rgba(37, 99, 235, 0.88);
  border: 1px solid rgba(96, 165, 250, 0.18);
  color: #ffffff;
}

.quadra-play {
  border: 1px solid rgba(96, 165, 250, 0.42);
  background: rgba(255, 255, 255, 0.04);
  color: #ffffff;
}

.login:hover,
.mobile-login:hover,
.quadra-play:hover {
  transform: translateY(-1px);
}

.quadra-play svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.login-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
  flex-shrink: 0;
}

.desktop-only {
  display: inline-flex;
}

.mobile-login {
  display: none;
}

.mobile-brand-pill {
  display: none;
  min-height: 42px;
  padding: 0 10px 0 8px;
  align-items: center;
  gap: 7px;
  border-radius: 15px;
  border: 1px solid rgba(96, 165, 250, 0.42);
  background: rgba(255, 255, 255, 0.04);
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
  white-space: nowrap;
}

.mobile-brand-logo {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid rgba(191, 219, 254, 0.55);
  background: rgba(255, 255, 255, 0.08);
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
  background: var(--nav-surface);
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
  top: 82px;
  left: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  z-index: 1220;
  width: min(86vw, 360px);
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
  gap: 12px;
  padding: 22px 20px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.drawer-brand {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.drawer-kicker {
  color: rgba(191, 219, 254, 0.76);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.drawer-title {
  color: #ffffff;
  font-size: 30px;
  line-height: 1;
  letter-spacing: -0.04em;
}

.drawer-subtitle {
  color: rgba(191, 219, 254, 0.72);
  font-size: 13px;
  line-height: 1.5;
}

.drawer-close {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
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
  gap: 10px;
  padding: 16px 14px;
}

.drawer-link {
  width: 100%;
  display: grid;
  gap: 4px;
  padding: 16px 16px;
  border: 1px solid transparent;
  border-radius: 20px;
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

.drawer-link-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.drawer-link-subtitle {
  color: rgba(191, 219, 254, 0.72);
  font-size: 13px;
  line-height: 1.45;
}

.drawer-footer {
  display: grid;
  gap: 10px;
  padding: 16px 14px 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.drawer-action {
  min-height: 48px;
  padding: 0 16px;
  border-radius: 18px;
  font: inherit;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.drawer-action:hover {
  transform: translateY(-1px);
}

.drawer-action.primary {
  border: 1px solid rgba(96, 165, 250, 0.18);
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
}

.drawer-action.secondary {
  border: 1px solid rgba(96, 165, 250, 0.42);
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.drawer-action svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
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
  .desktop-only {
    display: none;
  }

  .hamburger {
    display: inline-flex;
  }

  .mobile-brand-pill {
    display: inline-flex;
  }

  .mobile-login {
    display: inline-flex;
    min-height: 40px;
    padding: 0 18px;
  }
}

@media (min-width: 769px) {
  .navbar-custom {
    background: #152147;
    box-shadow: none;
  }

  .navbar-container {
    width: calc(100% - 120px);
    max-width: none;
    margin: 0 auto;
    padding: 0;
    gap: 28px;
  }

  .left-actions {
    flex: 0 0 auto;
    gap: 12px;
  }

  .nav-links {
    flex: 1 1 auto;
    justify-content: flex-end;
    gap: 40px;
    min-width: 0;
  }

  .nav-link {
    min-height: auto;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    color: #ffffff;
    font-size: 15px;
    font-weight: 500;
  }

  .nav-link:hover {
    background: transparent;
    color: #3b82f6;
  }

  .nav-link.active {
    background: transparent;
    border-color: transparent;
    color: #3b82f6;
  }

  .nav-actions {
    flex: 0 0 auto;
    gap: 18px;
  }

  .nav-quadra-desktop {
    position: relative;
    padding: 6px 25px;
    border: 2px solid #3b82f6;
    border-radius: 15px;
    background: transparent;
    color: #ffffff;
    font-weight: 500;
    overflow: visible;
  }

  .nav-quadra-desktop svg {
    position: absolute;
    top: 90%;
    right: -12px;
    transform: translateY(-50%);
    width: 25px;
    height: 25px;
    padding: 2px;
    border-radius: 50%;
    background-color: #152147;
  }

  .login {
    min-height: auto;
    padding: 6px 50px;
    border: none;
    border-radius: 30px;
    background: #1e3a8a;
    color: #ffffff;
    font-weight: 500;
  }

  .mobile-menu-overlay,
  .mobile-drawer {
    display: none;
  }
}
</style>
