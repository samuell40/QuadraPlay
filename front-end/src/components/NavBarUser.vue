<template>
  <div class="navbar-user-root">
    <div
      class="navbar-user-shell"
      role="button"
      tabindex="0"
      aria-label="Editar perfil"
      @click="abrirModalPerfil"
      @keydown.enter.prevent="abrirModalPerfil"
      @keydown.space.prevent="abrirModalPerfil"
    >
      <div class="foto">
        <img
          v-if="usuario?.foto"
          :src="usuario.foto"
          :alt="`Foto de ${userName}`"
          class="user-photo1"
        >
        <span v-else class="user-fallback">{{ userInitial }}</span>
      </div>

      <div class="user-meta">
        <div class="user-name">{{ userName }}</div>

        <div class="user-role">
          <span class="user-role-badge">
            {{ roleLabel }}
          </span>
        </div>
      </div>
    </div>

    <PerfilUsuarioModal
      v-model="isPerfilModalOpen"
      :usuario="usuario || {}"
      role-fallback="Sem permissao"
      @perfil-atualizado="atualizarUsuarioLocal"
      @conta-excluida="aoExcluirConta"
    />
  </div>
</template>

<script>
import PerfilUsuarioModal from '@/components/shared/PerfilUsuarioModal.vue'

export default {
  name: 'NavBarUse',
  components: {
    PerfilUsuarioModal
  },
  data() {
    return {
      usuario: null,
      isPerfilModalOpen: false
    }
  },
  computed: {
    userName() {
      return this.usuario?.nome || 'Usuario'
    },
    roleLabel() {
      return String(this.usuario?.permissao?.descricao || 'Sem permissao').toUpperCase()
    },
    userInitial() {
      return this.userName.trim().charAt(0).toUpperCase() || 'U'
    }
  },
  mounted() {
    try {
      this.usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
    } catch {
      this.usuario = null
    }
  },
  methods: {
    abrirModalPerfil() {
      this.isPerfilModalOpen = true
    },
    atualizarUsuarioLocal(usuarioAtualizado) {
      this.usuario = usuarioAtualizado || this.usuario
    },
    aoExcluirConta() {
      this.isPerfilModalOpen = false
      this.usuario = null
    }
  }
}
</script>

<style scoped>
.navbar-user-root {
  position: absolute;
  top: 16px;
  right: 32px;
  padding: 0;
  z-index: 20;
}

.navbar-user-shell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 7px;
  width: clamp(200px, calc((100vw - 620px) / 5), 252px);
  min-height: 58px;
  padding: 5px 14px 5px 7px;
  border-radius: 18px;
  border: 1px solid rgba(191, 219, 254, 0.9);
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.14), transparent 46%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.94) 100%);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
  box-sizing: border-box;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.navbar-user-shell:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.12);
}

.navbar-user-shell:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
  border-color: rgba(37, 99, 235, 0.7);
}

.foto {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 50px;
  border-radius: 999px;
  padding: 3px;
  background: linear-gradient(145deg, #90dcff 0%, #56b8ff 45%, #2e78f4 100%);
  box-shadow: 0 0 0 2px #ebf6ff, 0 0 0 4px rgba(86, 184, 255, 0.3), 0 6px 14px rgba(45, 116, 229, 0.24);
}

.user-photo1,
.user-fallback {
  width: 44px;
  height: 44px;
  border-radius: 999px;
}

.user-photo1 {
  display: block;
  object-fit: cover;
  border: 2px solid #d9eaff;
  background: #d7dfec;
}

.user-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #d9eaff;
  background: linear-gradient(180deg, #e0ecff 0%, #c9dcff 100%);
  color: #1d4ed8;
  font-size: 17px;
  font-weight: 800;
}

.user-meta {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 3px;
}

.user-name {
  max-width: 100%;
  font-size: 13px;
  line-height: 1.05;
  color: #0f172a;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  margin-top: 0;
}

.user-role-badge {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 19px;
  padding: 0 7px;
  border-radius: 999px;
  border: 1px solid #bfdbfe;
  background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
  color: #2563eb;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.05em;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .navbar-user-root {
    position: absolute;
    top: 10px;
    left: 60px;
    right: 12px;
    z-index: 8;
    padding: 0;
    display: flex;
    justify-content: flex-end;
  }

  .navbar-user-shell {
    width: 172px;
    height: 42px;
    min-height: 42px;
    gap: 5px;
    padding: 3px 8px 3px 4px;
    border-radius: 12px;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.07);
    box-sizing: border-box;
  }

  .foto {
    width: 34px;
    height: 34px;
    flex-basis: 34px;
    padding: 1px;
    box-shadow: 0 0 0 1px #ebf6ff, 0 0 0 2px rgba(86, 184, 255, 0.2), 0 4px 8px rgba(45, 116, 229, 0.16);
  }

  .user-photo1,
  .user-fallback {
    width: 32px;
    height: 32px;
  }

  .user-fallback {
    font-size: 11px;
  }

  .user-meta {
    gap: 1px;
  }

  .user-name {
    font-size: 11px;
    margin-top: 2px;
  }

  .user-role-badge {
    min-height: 16px;
    padding: 0 6px;
    font-size: 7px;
    letter-spacing: 0.04em;
    margin-top: -3px;
  }
}
</style>
