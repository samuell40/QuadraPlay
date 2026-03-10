<template>
  <div class="quadraplay-sidebar-shell">
    <transition name="sidebar-fade">
      <div
        v-if="isMobile && sidebarVisible"
        class="sidebar-overlay"
        @click="closeSidebar"
      ></div>
    </transition>

    <aside
      class="sidebar_quadra"
      :class="[statusThemeClass, { collapsed: isDesktopCollapsed, open: sidebarVisible || !isMobile }]"
    >
      <div class="sidebar-top">
        <div class="sidebar-brand" :class="{ compact: isDesktopCollapsed }">
          <template v-if="!isDesktopCollapsed">
            <h2 class="brand-title">Painel da quadra</h2>
          </template>
        </div>

        <button
          v-if="isMobile"
          type="button"
          class="icon-button close-btn"
          aria-label="Fechar menu lateral"
          @click="closeSidebar"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <button
          v-else
          type="button"
          class="icon-button collapse-btn"
          :aria-label="collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'"
          @click="toggleCollapse"
        >
          <svg v-if="collapsed" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>

      <nav class="menu-itens" aria-label="Navegação principal QuadraPlay">
        <router-link
          :to="{ name: 'TelaInicial' }"
          class="menu-link"
          :class="{ active: isRouteName('TelaInicial') }"
          @click="handleNavClick"
        >
          <span class="nav-icon" aria-hidden="true">
            <svg class="filled-icon" viewBox="0 0 16 16">
              <path
                d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5q0 .807-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33 33 0 0 1 2.5.5m.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935m10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935"
              />
            </svg>
          </span>
          <span v-if="!isDesktopCollapsed" class="nav-text">Campeonatos</span>
        </router-link>

        <router-link
          v-if="!isPermissao4"
          :to="{ name: 'gerenciar_times' }"
          class="menu-link"
          :class="{ active: isRouteName('gerenciar_times') }"
          @click="handleNavClick"
        >
          <span class="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M16 18a4 4 0 0 1 4 4M16 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 16a4 4 0 0 0-4 4M8 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 3h8" />
            </svg>
          </span>
          <span v-if="!isDesktopCollapsed" class="nav-text">Times e Funções</span>
        </router-link>

        <router-link
          v-if="!isPermissao4"
          :to="{ name: 'historico_campeonatos' }"
          class="menu-link"
          :class="{ active: isRouteName('historico_campeonatos') }"
          @click="handleNavClick"
        >
          <span class="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 8v5l3 2" />
              <path d="M21 12a9 9 0 1 1-3.22-6.91" />
            </svg>
          </span>
          <span v-if="!isDesktopCollapsed" class="nav-text">Histórico</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button
          type="button"
          class="sidebar-user sidebar-user-button"
          :class="{ compact: isDesktopCollapsed }"
          aria-label="Editar perfil"
          @click="abrirModalPerfil"
        >
          <div class="user-avatar">
            <img v-if="usuario?.foto" :src="usuario.foto" :alt="`Foto de ${usuario?.nome || 'usuario'}`" />
            <span v-else>{{ userInitial }}</span>
          </div>

          <div v-if="!isDesktopCollapsed" class="user-text">
            <div class="user-name">{{ usuario?.nome || 'Usuário QuadraPlay' }}</div>
            <div class="user-role">{{ usuario?.permissao?.descricao || 'Equipe da quadra' }}</div>
          </div>
        </button>

        <button type="button" class="logout-button" @click="logout">
          <span class="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" />
              <path d="M10 12h10" />
              <path d="m17 8 4 4-4 4" />
            </svg>
          </span>
          <span v-if="!isDesktopCollapsed" class="nav-text">Sair</span>
        </button>
      </div>
    </aside>

    <PerfilUsuarioModal
      v-model="isPerfilModalOpen"
      :usuario="usuario || {}"
      role-fallback="Equipe da quadra"
      @perfil-atualizado="atualizarUsuarioLocal"
      @conta-excluida="aoExcluirConta"
    />
  </div>
</template>

<script>
import router from "@/router";
import PerfilUsuarioModal from "@/components/shared/PerfilUsuarioModal.vue";

const SIDEBAR_COLLAPSED_KEY = "sidebar_collapsed";
const SIDEBAR_TOGGLE_EVENT = "quadraplay:toggle-sidebar";
const SIDEBAR_STATE_EVENT = "quadraplay:sidebar-state";

export default {
  name: "SidebarQuadra",
  components: {
    PerfilUsuarioModal,
  },
  emits: ["sidebar-toggle"],
  props: {
    partidaStatus: {
      type: String,
      default: "",
    },
  },
  data() {
    const isMobile = typeof window !== "undefined" ? window.innerWidth <= 768 : false;

    return {
      usuario: null,
      isMobile,
      collapsed: false,
      sidebarVisible: !isMobile,
      isPerfilModalOpen: false,
    };
  },
  computed: {
    statusThemeClass() {
      if (this.partidaStatus === "EM_ANDAMENTO") return "status-andamento";
      if (this.partidaStatus === "FINALIZADA") return "status-finalizada";
      return "";
    },
    isPermissao4() {
      return this.usuario?.permissaoId === 4;
    },
    isDesktopCollapsed() {
      return !this.isMobile && this.collapsed;
    },
    userInitial() {
      return String(this.usuario?.nome || "Q")
        .trim()
        .charAt(0)
        .toUpperCase();
    },
  },
  mounted() {
    window.addEventListener("resize", this.handleResize);
    window.addEventListener(SIDEBAR_TOGGLE_EVENT, this.handleExternalToggle);
    this.readCollapsedState();
    this.loadUsuario();
    this.handleResize();
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener(SIDEBAR_TOGGLE_EVENT, this.handleExternalToggle);
  },
  watch: {
    "$route.fullPath"() {
      if (this.isMobile) this.closeSidebar();
    },
  },
  methods: {
    loadUsuario() {
      try {
        this.usuario = JSON.parse(localStorage.getItem("usuario") || "null");
      } catch (error) {
        this.usuario = null;
      }
    },
    readCollapsedState() {
      this.collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    },
    isRouteName(name) {
      return this.$route.name === name;
    },
    syncNavbarTrigger() {
      window.dispatchEvent(
        new CustomEvent(SIDEBAR_STATE_EVENT, {
          detail: { open: this.isMobile ? this.sidebarVisible : false },
        })
      );
    },
    handleResize() {
      this.isMobile = window.innerWidth <= 768;

      if (this.isMobile) {
        this.sidebarVisible = false;
        this.$emit("sidebar-toggle", false);
        this.syncNavbarTrigger();
        return;
      }

      this.readCollapsedState();
      this.sidebarVisible = true;
      this.$emit("sidebar-toggle", this.collapsed);
      this.syncNavbarTrigger();
    },
    toggleCollapse() {
      if (this.isMobile) return;

      this.collapsed = !this.collapsed;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, this.collapsed ? "1" : "0");
      this.$emit("sidebar-toggle", this.collapsed);
    },
    handleExternalToggle() {
      if (!this.isMobile) return;
      this.toggleSidebar();
    },
    toggleSidebar() {
      if (!this.isMobile) return;
      this.sidebarVisible = !this.sidebarVisible;
      this.syncNavbarTrigger();
    },
    closeSidebar() {
      if (!this.isMobile) return;
      this.sidebarVisible = false;
      this.syncNavbarTrigger();
    },
    handleNavClick() {
      if (this.isMobile) this.closeSidebar();
    },
    abrirModalPerfil() {
      this.isPerfilModalOpen = true;
    },
    atualizarUsuarioLocal(usuarioAtualizado) {
      this.usuario = usuarioAtualizado || this.usuario;
    },
    aoExcluirConta() {
      this.isPerfilModalOpen = false;
      if (this.isMobile) this.closeSidebar();
    },
    logout() {
      this.isPerfilModalOpen = false;
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      localStorage.removeItem("quadraPlayLoginAtivo");
      router.push("/");
    },
  },
};
</script>

<style scoped>
.quadraplay-sidebar-shell {
  --sidebar-bg: #0f1f4f;
  --sidebar-bg-strong: #0a173d;
  --sidebar-surface: rgba(255, 255, 255, 0.08);
  --sidebar-surface-strong: rgba(255, 255, 255, 0.12);
  --sidebar-border: rgba(148, 163, 184, 0.2);
  --sidebar-text: rgba(226, 232, 240, 0.92);
  --sidebar-muted: rgba(191, 219, 254, 0.72);
  --sidebar-accent: #60a5fa;
  --sidebar-accent-soft: rgba(59, 130, 246, 0.24);
  --sidebar-shadow: 0 24px 48px rgba(2, 6, 23, 0.32);
}

.quadraplay-sidebar-shell .status-andamento {
  --sidebar-bg: #0f3b2a;
  --sidebar-bg-strong: #0b291e;
  --sidebar-accent: #4ade80;
  --sidebar-accent-soft: rgba(34, 197, 94, 0.22);
}

.quadraplay-sidebar-shell .status-finalizada {
  --sidebar-bg: #4a1221;
  --sidebar-bg-strong: #2f0a12;
  --sidebar-accent: #f87171;
  --sidebar-accent-soft: rgba(248, 113, 113, 0.22);
}

.icon-button svg,
.nav-icon svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.nav-icon svg.filled-icon {
  fill: currentColor;
  stroke: none;
}

.sidebar-overlay {
  position: fixed;
  inset: 70px 0 0;
  z-index: 1040;
  background: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(4px);
}

.sidebar_quadra {
  position: fixed;
  top: 70px;
  left: 0;
  z-index: 1050;
  width: 250px;
  height: calc(100vh - 70px);
  padding: 18px 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: var(--sidebar-text);
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.14), transparent 36%),
    linear-gradient(180deg, var(--sidebar-bg) 0%, var(--sidebar-bg-strong) 100%);
  box-shadow: var(--sidebar-shadow);
  overflow: hidden;
  transition: width 0.24s ease, transform 0.24s ease;
}

.sidebar_quadra.collapsed {
  width: 70px;
  padding-inline: 10px;
}

.sidebar-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.sidebar-brand {
  min-width: 0;
  display: grid;
  gap: 8px;
}

.sidebar-brand.compact {
  place-items: center;
  width: 100%;
}

.sidebar-brand.compact .brand-chip {
  width: 34px;
  height: 34px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 0;
  letter-spacing: 0;
}

.sidebar-brand.compact .brand-chip::after {
  content: "QP";
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.brand-chip {
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--sidebar-accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.brand-title {
  margin: 0;
  font-size: 23px;
  font-weight: 800;
  line-height: 1.05;
  color: #f8fafc;
}

.brand-subtitle {
  margin: 0;
  color: var(--sidebar-muted);
  font-size: 13px;
  line-height: 1.55;
}

.icon-button {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--sidebar-border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.07);
  color: #f8fafc;
}

.menu-itens {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.menu-link,
.logout-button {
  width: 100%;
  min-height: 50px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 16px;
  color: var(--sidebar-text);
  text-decoration: none;
  background: transparent;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    color 0.2s ease;
}

.menu-link:hover,
.logout-button:hover {
  background: var(--sidebar-surface);
  border-color: var(--sidebar-border);
  color: #ffffff;
}

.menu-link.active {
  background: linear-gradient(180deg, var(--sidebar-accent-soft), rgba(15, 23, 42, 0.06));
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: inset 3px 0 0 var(--sidebar-accent);
  color: #ffffff;
}

.sidebar_quadra.collapsed .menu-link,
.sidebar_quadra.collapsed .logout-button {
  justify-content: center;
  padding-inline: 0;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nav-text {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.25;
}

.sidebar-footer {
  display: grid;
  gap: 14px;
  margin-top: auto;
  flex: 0 0 auto;
  padding-top: 14px;
  border-top: 1px solid var(--sidebar-border);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.sidebar-user.compact {
  justify-content: center;
  padding-inline: 0;
}

.sidebar-user-button {
  width: 100%;
  text-align: left;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.sidebar-user-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.16);
  transform: translateY(-1px);
}

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-text {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.user-name {
  color: #f8fafc;
  font-size: 14px;
  font-weight: 700;
}

.user-role {
  color: var(--sidebar-muted);
  font-size: 12px;
  line-height: 1.4;
}

.logout-button {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  cursor: pointer;
}

.logout-button:focus-visible,
.menu-link:focus-visible,
.icon-button:focus-visible,
.sidebar-user-button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.7);
  outline-offset: 2px;
}

.sidebar-fade-enter-active,
.sidebar-fade-leave-active {
  transition: opacity 0.24s ease;
}

.sidebar-fade-enter-from,
.sidebar-fade-leave-to {
  opacity: 0;
}

@media (min-width: 769px) {
  .close-btn {
    display: none;
  }
}

@media (max-width: 768px) {
  .sidebar_quadra {
    width: min(292px, calc(100vw - 24px));
    top: 82px;
    bottom: calc(12px + env(safe-area-inset-bottom));
    height: auto;
    left: 12px;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    transform: translateX(-112%);
  }

  .sidebar_quadra.open {
    transform: translateX(0);
  }

  .sidebar-top {
    align-items: center;
  }

  .brand-title {
    font-size: 21px;
  }

  .brand-subtitle {
    font-size: 12px;
  }
}
</style>
