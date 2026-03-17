<template>
  <div class="sidebar-admin-shell">
    <button class="button-sidebar d-block d-md-none" :class="{ hidden: sidebarVisible }" type="button"
      @click="toggleSidebar" aria-label="Abrir menu">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>

    <div v-if="isMobile && sidebarVisible" class="sidebar-overlay" @click="closeSidebar"></div>

    <aside v-if="sidebarVisible" class="sidebar">
      <div class="sidebar-top">
        <div class="brand-shell">
          <img src="@/assets/logo.png" class="logo" alt="Quadra Play" />

          <button v-if="isMobile" type="button" class="sidebar-close" @click="closeSidebar" aria-label="Fechar menu">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>

      <nav class="sidebar-nav">
        <section class="sidebar-section">
          <p class="section-label">Painel</p>

          <router-link to="/dashboard" class="nav-link" :class="{ active: isActive('/dashboard') }"
            @click="closeSidebar">
            <span class="nav-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grid-1x2"
                viewBox="0 0 16 16">
                <path
                  d="M6 1H1v14h5zm9 0h-5v5h5zm0 9v5h-5v-5zM0 1a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm9 0a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1zm1 8a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1z" />
              </svg>
            </span>
            <span class="nav-text">Dashboard</span>
          </router-link>
        </section>

        <section v-if="!isPermissao4" class="sidebar-section">
          <button type="button" class="sidebar-category-header" :class="{
            open: true,
            'is-active': isCategoryActive('agendamentos'),
          }" @click="toggleCategory('agendamentos')" aria-expanded="true">
            <span>Agendamentos</span>
            <svg class="category-chevron" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 10l4 4 4-4" />
            </svg>
          </button>

          <div class="sidebar-links">
            <router-link to="/agendamentos" class="nav-link" :class="{ active: isActive('/agendamentos') }"
              @click="closeSidebar">
              <span class="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
                </svg>
              </span>
              <span class="nav-text">Agendamentos</span>
            </router-link>

            <router-link to="/agendarquadrasadm" class="nav-link" :class="{ active: isActive('/agendarquadrasadm') }"
              @click="closeSidebar">
              <span class="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 7h14M5 12h14M5 17h10" />
                </svg>
              </span>
              <span class="nav-text">Agendar Quadras</span>
            </router-link>

            <router-link to="/horarios" class="nav-link" :class="{ active: isActive('/horarios') }"
              @click="closeSidebar">
              <span class="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0z" />
                </svg>
              </span>
              <span class="nav-text">Horários</span>
            </router-link>
          </div>
        </section>

        <section v-if="!isPermissao4" class="sidebar-section">
          <button type="button" class="sidebar-category-header" :class="{
            open: openCategory === 'admin',
            'is-active': isCategoryActive('admin'),
          }" @click="toggleCategory('admin')" :aria-expanded="String(openCategory === 'admin')">
            <span>Administração</span>
            <svg class="category-chevron" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 10l4 4 4-4" />
            </svg>
          </button>

          <div v-show="openCategory === 'admin'" class="sidebar-links">
            <router-link v-if="[1, 2].includes(usuario?.permissaoId)" to="/gerenciarquadras" class="nav-link"
              :class="{ active: isActive('/gerenciarquadras') }" @click="closeSidebar">
              <span class="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M4 20V9l8-5 8 5v11M9 20v-5h6v5M4 10h16" />
                </svg>
              </span>
              <span class="nav-text">Gerenciar Quadras</span>
            </router-link>

            <router-link to="/usuarios" class="nav-link" :class="{ active: isActive('/usuarios') }"
              @click="closeSidebar">
              <span class="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8a4 4 0 0 0 0 8zM20 21v-2a4 4 0 0 0-3-3.87M15.5 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span class="nav-text">Gerenciar Usuários</span>
            </router-link>

          </div>
        </section>
      </nav>

      <div class="sidebar-footer">
        <button type="button" class="logout-button" @click="logout">
          <span class="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" class="logout-icon">
              <path d="M8 3H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
              <path d="M12 6l4 4l-4 4" />
              <path d="M16 10H7" />
            </svg>
          </span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  </div>
</template>

<script>
import router from "@/router";

const ROTAS_CATEGORIA = {
  agendamentos: ["/agendamentos", "/agendarquadrasadm", "/horarios"],
  admin: ["/gerenciarquadras", "/usuarios"],
};

export default {
  name: "SideBar",
  data() {
    return {
      sidebarVisible: true,
      isMobile: false,
      usuario: null,
      openCategory: localStorage.getItem("openCategory") ?? "agendamentos",
    };
  },
  mounted() {
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
    this.usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    this.sincronizarCategoriaComRota(this.$route.path);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.handleResize);
  },
  watch: {
    "$route.path"(novoPath) {
      this.sincronizarCategoriaComRota(novoPath);
    },
  },
  computed: {
    isPermissao4() {
      return this.usuario?.permissaoId === 4;
    },
  },
  methods: {
    toggleSidebar() {
      if (this.isMobile) {
        this.sidebarVisible = !this.sidebarVisible;
      } else {
        this.sidebarVisible = true;
      }
    },
    closeSidebar() {
      if (this.isMobile) {
        this.sidebarVisible = false;
      }
    },
    toggleCategory(category) {
      if (category === "agendamentos") {
        return;
      }

      this.openCategory = this.openCategory === category ? null : category;

      if (this.openCategory) {
        localStorage.setItem("openCategory", this.openCategory);
      } else {
        localStorage.removeItem("openCategory");
      }
    },
    isActive(path) {
      return this.$route.path === path;
    },
    isCategoryActive(category) {
      return ROTAS_CATEGORIA[category]?.includes(this.$route.path);
    },
    sincronizarCategoriaComRota(path) {
      const categoriaEncontrada = Object.entries(ROTAS_CATEGORIA).find(([, paths]) =>
        paths.includes(path),
      )?.[0];

      if (!categoriaEncontrada) return;

      this.openCategory = categoriaEncontrada;
      localStorage.setItem("openCategory", categoriaEncontrada);
    },
    logout() {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      localStorage.removeItem("quadraPlayLoginAtivo");
      router.push("/");
    },
    handleResize() {
      this.isMobile = window.innerWidth <= 768;
      this.sidebarVisible = !this.isMobile;
    },
  },
};
</script>

<style>
body {
  margin: 0;
  font-family: "Montserrat", sans-serif;
  background-color: white;
}

.sidebar-admin-shell .sidebar {
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  width: 260px;
  height: 100vh;
  padding: 16px 14px 14px;
  background:
    linear-gradient(180deg, #0c1943 0%, #12204c 55%, #101b40 100%);
  border-right: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow: 0 24px 44px rgba(15, 23, 42, 0.24);
  z-index: 10;
  box-sizing: border-box;
  overflow: hidden;
}

.sidebar-admin-shell .sidebar-top {
  padding: 4px 6px 10px;
}

.sidebar-admin-shell .brand-shell {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.sidebar-admin-shell .logo {
  width: 122px;
  height: auto;
  display: block;
  margin: 0;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.sidebar-admin-shell .sidebar-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(191, 219, 254, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  cursor: pointer;
}

.sidebar-admin-shell .sidebar-close svg,
.sidebar-admin-shell .button-sidebar svg,
.sidebar-admin-shell .nav-icon svg,
.sidebar-admin-shell .category-chevron {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.sidebar-admin-shell .button-sidebar svg {
  position: absolute;
  top: 50%;
  left: 50%;
  display: block;
  width: 20px;
  height: 20px;
  transform: translate(-50%, -50%);
}

.sidebar-admin-shell .sidebar-nav {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;
}

.sidebar-admin-shell .sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-admin-shell .sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.24);
  border-radius: 999px;
}

.sidebar-admin-shell .sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-admin-shell .sidebar .section-label {
  margin: 0;
  padding: 0 10px;
  font-size: 10px;
  line-height: 1;
  letter-spacing: 0.18em;
  font-weight: 800;
  text-transform: uppercase;
  color: rgba(191, 219, 254, 0.62);
}

.sidebar-admin-shell .sidebar .sidebar-category-header {
  width: 100%;
  border: none;
  outline: none;
  box-shadow: none;
  border-radius: 12px;
  background: transparent;
  color: rgba(226, 232, 240, 0.9);
  font-size: 15px;
  font-weight: 700;
  padding: 9px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.15s ease;
}

.sidebar-admin-shell .sidebar .sidebar-category-header:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.sidebar-admin-shell .sidebar .sidebar-category-header.open,
.sidebar-admin-shell .sidebar .sidebar-category-header.is-active {
  background: rgba(255, 255, 255, 0.03);
  color: #ffffff;
}

.sidebar-admin-shell .sidebar .sidebar-category-header:active {
  transform: translateY(1px);
}

.sidebar-admin-shell .category-chevron {
  transition: transform 0.2s ease;
}

.sidebar-admin-shell .sidebar .sidebar-category-header.open .category-chevron {
  transform: rotate(180deg);
}

.sidebar-admin-shell .sidebar-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 2px;
  margin-left: 10px;
  padding-left: 10px;
  border-left: 1px solid rgba(148, 163, 184, 0.14);
}

.sidebar-admin-shell .sidebar .nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  text-decoration: none;
  color: rgba(226, 232, 240, 0.88) !important;
  font-size: 14px;
  font-weight: 700;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;
}

.sidebar-admin-shell .sidebar .nav-link:hover {
  color: #ffffff !important;
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(96, 165, 250, 0.1);
  transform: none;
}

.sidebar-admin-shell .sidebar .nav-link.active {
  color: #ffffff !important;
  background: rgba(37, 99, 235, 0.28);
  border-color: rgba(96, 165, 250, 0.24);
  box-shadow: inset 0 0 0 1px rgba(191, 219, 254, 0.08);
}

.sidebar-admin-shell .sidebar .nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  color: currentColor;
}

.sidebar-admin-shell .nav-text {
  white-space: normal;
  line-height: 1.2;
}

.sidebar-admin-shell .sidebar-footer {
  margin-top: auto;
  flex: 0 0 auto;
  padding: 12px 6px 0;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

.sidebar-admin-shell .sidebar .logout-button {
  width: 100%;
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 0 12px;
  border: none;
  outline: none;
  box-shadow: none;
  border-radius: 12px;
  background: transparent;
  color: rgba(226, 232, 240, 0.88);
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.15s ease;
}

.sidebar-admin-shell .sidebar .logout-button .nav-icon {
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
}

.sidebar-admin-shell .sidebar .logout-button .logout-icon {
  width: 28px !important;
  height: 28px !important;
  stroke-width: 2.5;
}

.sidebar-admin-shell .sidebar .logout-button:hover {
  color: #ffffff;
  background: rgba(239, 68, 68, 0.12);
}

.sidebar-admin-shell .sidebar .sidebar-category-header:focus,
.sidebar-admin-shell .sidebar .nav-link:focus,
.sidebar-admin-shell .sidebar .logout-button:focus {
  outline: none;
  box-shadow: none;
}

.sidebar-admin-shell .sidebar .sidebar-category-header:focus-visible,
.sidebar-admin-shell .sidebar .nav-link:focus-visible,
.sidebar-admin-shell .sidebar .logout-button:focus-visible {
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.3);
}

.sidebar-admin-shell .button-sidebar {
  position: fixed;
  top: 10px;
  left: 10px;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid rgba(29, 78, 216, 0.48);
  outline: none;
  display: block;
  border-radius: 12px;
  z-index: 1000;
  cursor: pointer;
  background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff;
  box-shadow: 0 12px 26px rgba(29, 78, 216, 0.28);
  line-height: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.sidebar-admin-shell .button-sidebar.hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateX(-6px);
}

.sidebar-admin-shell .button-sidebar:hover {
  background: linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
}

.sidebar-admin-shell .sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.56);
  z-index: 9;
  backdrop-filter: blur(2px);
}

@media (max-width: 768px) {
  .sidebar-admin-shell .button-sidebar {
    width: 42px;
    height: 42px;
    padding: 0;
  }

  .sidebar-admin-shell .button-sidebar svg {
    width: 20px;
    height: 20px;
  }

  .conteudo,
  .conteudo-agendamento {
    padding-top: 64px !important;
  }

  .sidebar-admin-shell .sidebar {
    top: 10px;
    bottom: calc(10px + env(safe-area-inset-bottom));
    left: 10px;
    width: min(284px, calc(100vw - 20px));
    height: auto;
    padding: 16px 14px 14px;
    border-radius: 24px;
  }

  .sidebar-admin-shell .logo {
    width: 118px;
  }

  .sidebar-admin-shell .sidebar-nav {
    gap: 16px;
  }

  .sidebar-admin-shell .nav-link,
  .sidebar-admin-shell .logout-button {
    min-height: 44px;
  }
}
</style>
