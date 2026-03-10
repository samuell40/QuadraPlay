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
            <h2 class="brand-title">Painel do campeonato</h2>
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

      <nav class="menu-itens" aria-label="Navegação do campeonato">
        <router-link
          v-if="!isPermissao4"
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
          <span v-if="!isDesktopCollapsed" class="nav-text">Todos campeonatos</span>
        </router-link>

        <template v-if="campeonatoPossuiPartidas">
          <div class="menu-group" :class="{ active: isPartidasGroupActive, compact: isDesktopCollapsed }">
            <router-link
              :to="campeonatoRoute('gerenciar_partida')"
              class="menu-link"
              :class="{ active: isPartidasGroupActive }"
              @click="handleNavClick"
            >
              <span class="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M8 3v3M16 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
                  <path d="M9 13h6M9 17h4" />
                </svg>
              </span>
              <span v-if="!isDesktopCollapsed" class="nav-text">Partidas</span>
            </router-link>

            <router-link
              v-if="showPartidaSubmenu"
              :to="campeonatoRoute('Partida')"
              class="submenu-link"
              :class="{ active: isRouteName('Partida') }"
              @click="handleNavClick"
            >
              <span class="submenu-dot" aria-hidden="true"></span>
              <span class="submenu-text">Controle da partida</span>
            </router-link>
          </div>
        </template>

        <template v-else>
          <router-link
            :to="campeonatoRoute('Detalhar_Campeonatos')"
            class="menu-link"
            :class="{ active: isRouteName('Detalhar_Campeonatos') }"
            @click="handleNavClick"
          >
            <span class="nav-icon" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                class="filled-icon bi bi-gear-fill"
              >
                <path
                  d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"
                />
              </svg>
            </span>
          <span v-if="!isDesktopCollapsed" class="nav-text">Configurações</span>
          </router-link>

          <div class="menu-group" :class="{ active: isPartidasGroupActive, compact: isDesktopCollapsed }">
            <router-link
              :to="campeonatoRoute('gerenciar_partida')"
              class="menu-link"
              :class="{ active: isPartidasGroupActive }"
              @click="handleNavClick"
            >
              <span class="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M8 3v3M16 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
                  <path d="M9 13h6M9 17h4" />
                </svg>
              </span>
              <span v-if="!isDesktopCollapsed" class="nav-text">Partidas</span>
            </router-link>

            <router-link
              v-if="showPartidaSubmenu"
              :to="campeonatoRoute('Partida')"
              class="submenu-link"
              :class="{ active: isRouteName('Partida') }"
              @click="handleNavClick"
            >
              <span class="submenu-dot" aria-hidden="true"></span>
              <span class="submenu-text">Controle da partida</span>
            </router-link>
          </div>
        </template>

        <router-link
          v-if="!isPermissao4"
          :to="campeonatoRoute('Classificacao')"
          class="menu-link"
          :class="{ active: isRouteName('Classificacao') }"
          @click="handleNavClick"
        >
          <span class="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M6 20V10M12 20V4M18 20v-7" />
            </svg>
          </span>
          <span v-if="!isDesktopCollapsed" class="nav-text">Classificação</span>
        </router-link>

        <router-link
          v-if="!isPermissao4"
          :to="campeonatoRoute('gerenciar_equipes')"
          class="menu-link"
          :class="{ active: isRouteName('gerenciar_equipes') }"
          @click="handleNavClick"
        >
          <span class="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M16 18a4 4 0 0 1 4 4M16 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 16a4 4 0 0 0-4 4M8 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 3h8" />
            </svg>
          </span>
          <span v-if="!isDesktopCollapsed" class="nav-text">Gerenciar equipes</span>
        </router-link>

        <router-link
          v-if="campeonatoPossuiPartidas"
          :to="campeonatoRoute('Detalhar_Campeonatos')"
          class="menu-link"
          :class="{ active: isRouteName('Detalhar_Campeonatos') }"
          @click="handleNavClick"
        >
          <span class="nav-icon" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              class="filled-icon bi bi-gear-fill"
            >
              <path
                d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"
              />
            </svg>
          </span>
          <span v-if="!isDesktopCollapsed" class="nav-text">Configurações</span>
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
            <div class="user-role">{{ usuario?.permissao?.descricao || 'Equipe do campeonato' }}</div>
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
      role-fallback="Equipe do campeonato"
      @perfil-atualizado="atualizarUsuarioLocal"
      @conta-excluida="aoExcluirConta"
    />
  </div>
</template>

<script>
import router from "@/router";
import { useCampeonatoStore } from "@/storecampeonato";
import PerfilUsuarioModal from "@/components/shared/PerfilUsuarioModal.vue";

const SIDEBAR_COLLAPSED_KEY = "sidebar_collapsed";
const SIDEBAR_TOGGLE_EVENT = "quadraplay:toggle-sidebar";
const SIDEBAR_STATE_EVENT = "quadraplay:sidebar-state";
const STATUS_ENCERRADOS = ["FINALIZADA", "FINALIZADO", "CANCELADA", "CANCELADO", "DELETADA", "DELETADO"];

export default {
  name: "SidebarCampeonato",
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
      const statusPartida = String(this.partidaStatus || "").toUpperCase();
      if (statusPartida === "EM_ANDAMENTO") return "status-andamento";
      if (statusPartida === "FINALIZADA" || statusPartida === "FINALIZADO") return "status-finalizada";

      const statusCampeonato = String(this.campeonatoAtivoValido?.status || "").toUpperCase();
      if (STATUS_ENCERRADOS.includes(statusCampeonato)) return "status-finalizada";

      return "";
    },
    campeonatoAtivoValido() {
      const store = useCampeonatoStore();
      const campeonatoStore = store.campeonatoAtivo;
      if (!campeonatoStore) return null;

      const routeId = Number(this.$route.query.id || 0);
      const storeId = Number(campeonatoStore.id || 0);
      if (routeId && storeId && routeId !== storeId) return null;

      return campeonatoStore;
    },
    isPermissao4() {
      return this.usuario?.permissaoId === 4;
    },
    campeonatoId() {
      return this.campeonatoAtivoValido?.id || this.$route.query.id || null;
    },
    isDesktopCollapsed() {
      return !this.isMobile && this.collapsed;
    },
    isPartidasGroupActive() {
      return ["gerenciar_partida", "Partida"].includes(this.$route.name);
    },
    campeonatoPossuiPartidas() {
      const partidas = this.campeonatoAtivoValido?.partidas;
      return Array.isArray(partidas) && partidas.length > 0;
    },
    showPartidaSubmenu() {
      return !this.isDesktopCollapsed && this.$route.name === "Partida";
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
    campeonatoRoute(name) {
      const route = { name };
      if (this.campeonatoId) {
        route.query = { id: this.campeonatoId };
      }
      return route;
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
.logout-button,
.submenu-link {
  width: 100%;
  color: var(--sidebar-text);
  text-decoration: none;
}

.menu-link,
.logout-button {
  min-height: 50px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: transparent;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    color 0.2s ease;
}

.menu-link:hover,
.logout-button:hover,
.submenu-link:hover {
  background: var(--sidebar-surface);
  border-color: var(--sidebar-border);
  color: #ffffff;
}

.menu-link.active,
.submenu-link.active {
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

.menu-group {
  display: grid;
  gap: 8px;
}

.menu-group.active:not(.compact) {
  padding-left: 12px;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
}

.submenu-link {
  display: flex;
  align-items: center;
  gap: 10px;
  width: calc(100% - 14px);
  margin-left: 14px;
  min-height: 42px;
  padding: 10px 12px 10px 16px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 13px;
  font-weight: 700;
}

.submenu-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--sidebar-accent);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.06);
}

.submenu-text {
  line-height: 1.2;
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
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
}

.logout-button:focus-visible,
.menu-link:focus-visible,
.submenu-link:focus-visible,
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

  .menu-group.active:not(.compact) {
    padding-left: 0;
    border-left: 0;
  }

  .submenu-link {
    width: calc(100% - 18px);
    margin-left: 18px;
  }
}
</style>

