<template>
  <transition name="perfil-modal-fade">
    <div v-if="modelValue" class="profile-modal-overlay" @click="fecharModalPerfil">
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

          <p class="profile-role">{{ roleLabel }}</p>
        </div>

        <div class="profile-actions">
          <button
            type="button"
            class="profile-save"
            :disabled="isSalvandoPerfil || isExcluindoConta"
            @click="salvarPerfil"
          >
            {{ isSalvandoPerfil ? 'Salvando...' : 'Salvar' }}
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
</template>

<script>
import api from "@/axios";
import router from "@/router";
import Swal from "sweetalert2";

export default {
  name: "PerfilUsuarioModal",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    usuario: {
      type: Object,
      default: () => ({}),
    },
    roleFallback: {
      type: String,
      default: "Area do usuario",
    },
  },
  emits: ["update:modelValue", "perfil-atualizado", "conta-excluida"],
  data() {
    return {
      isSalvandoPerfil: false,
      isExcluindoConta: false,
      perfilFotoArquivo: null,
      perfilFotoPreview: "",
      perfilForm: {
        nome: "",
        telefone: "",
        email: "",
        foto: "",
      },
    };
  },
  computed: {
    userInitial() {
      return String(this.perfilForm.nome || this.usuario?.nome || "U")
        .trim()
        .charAt(0)
        .toUpperCase();
    },
    roleLabel() {
      return String(this.usuario?.permissao?.descricao || this.roleFallback || "Area do usuario").trim();
    },
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(aberto) {
        if (aberto) {
          this.sincronizarPerfilForm();
        } else {
          this.limparPerfilFotoSelecionada();
        }
      },
    },
    usuario: {
      deep: true,
      handler() {
        if (this.modelValue) {
          this.sincronizarPerfilForm();
        }
      },
    },
  },
  beforeUnmount() {
    this.limparPerfilFotoSelecionada();
  },
  methods: {
    sincronizarPerfilForm() {
      this.perfilForm = {
        nome: String(this.usuario?.nome || "").trim(),
        telefone: String(this.usuario?.telefone || "").trim(),
        email: String(this.usuario?.email || "").trim(),
        foto: String(this.usuario?.foto || "").trim(),
      };
    },
    fecharModalPerfil() {
      if (this.isSalvandoPerfil || this.isExcluindoConta) return;
      this.$emit("update:modelValue", false);
    },
    limparPerfilFotoSelecionada() {
      if (this.perfilFotoPreview && typeof URL !== "undefined") {
        URL.revokeObjectURL(this.perfilFotoPreview);
      }
      this.perfilFotoPreview = "";
      this.perfilFotoArquivo = null;
    },
    handlePerfilFotoChange(event) {
      const arquivo = event?.target?.files?.[0];
      this.limparPerfilFotoSelecionada();
      if (!arquivo) return;

      this.perfilFotoArquivo = arquivo;
      this.perfilFotoPreview = URL.createObjectURL(arquivo);
    },
    formatarTelefonePerfil() {
      const valor = String(this.perfilForm.telefone || "").replace(/\D/g, "").slice(0, 11);
      if (!valor) {
        this.perfilForm.telefone = "";
        return;
      }

      if (valor.length <= 2) {
        this.perfilForm.telefone = `(${valor}`;
      } else if (valor.length <= 6) {
        this.perfilForm.telefone = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
      } else if (valor.length <= 10) {
        this.perfilForm.telefone = `(${valor.slice(0, 2)}) ${valor.slice(2, 6)}-${valor.slice(6)}`;
      } else {
        this.perfilForm.telefone = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
      }
    },
    async uploadFotoPerfil() {
      if (!this.perfilFotoArquivo) {
        return this.perfilForm.foto || null;
      }

      const formData = new FormData();
      formData.append("file", this.perfilFotoArquivo);

      const { data } = await api.post("/upload", formData, { requiresAuth: true });
      return data?.fileUrl || data?.url || null;
    },
    async salvarPerfil() {
      if (this.isSalvandoPerfil || this.isExcluindoConta) return;

      const nome = String(this.perfilForm.nome || "").trim();
      const email = String(this.perfilForm.email || "").trim().toLowerCase();
      const telefone = String(this.perfilForm.telefone || "").trim();
      const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!nome || !email) {
        await Swal.fire("Atencao", "Preencha nome e e-mail para continuar.", "warning");
        return;
      }

      if (!emailValido) {
        await Swal.fire("Atencao", "Informe um e-mail valido.", "warning");
        return;
      }

      this.isSalvandoPerfil = true;

      try {
        const foto = await this.uploadFotoPerfil();
        const payload = { nome, email, telefone, foto };
        const { data } = await api.put("/editar/usuario", payload, { requiresAuth: true });

        if (data?.token) {
          localStorage.setItem("token", data.token);
        }

        const usuarioAtualizado = data?.usuario?.id
          ? data.usuario
          : { ...(this.usuario || {}), ...payload };

        localStorage.setItem("usuario", JSON.stringify(usuarioAtualizado));
        this.$emit("perfil-atualizado", usuarioAtualizado);
        this.$emit("update:modelValue", false);
        this.limparPerfilFotoSelecionada();
        this.sincronizarPerfilForm();

        await Swal.fire("Sucesso", "Perfil atualizado com sucesso.", "success");
      } catch (err) {
        const mensagem =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Nao foi possivel atualizar o perfil.";
        await Swal.fire("Erro", mensagem, "error");
      } finally {
        this.isSalvandoPerfil = false;
      }
    },
    async confirmarExclusaoConta() {
      if (this.isSalvandoPerfil || this.isExcluindoConta) return;

      const confirmacao = await Swal.fire({
        title: "Excluir conta?",
        text: "Voce tem certeza que deseja excluir sua conta?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, excluir",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b",
      });

      if (!confirmacao.isConfirmed) return;
      await this.excluirConta();
    },
    async excluirConta() {
      this.isExcluindoConta = true;

      try {
        await api.delete("/delete/usuario", { requiresAuth: true });

        this.$emit("update:modelValue", false);
        this.$emit("conta-excluida");
        this.limparPerfilFotoSelecionada();
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        localStorage.removeItem("quadraPlayLoginAtivo");

        await Swal.fire("Conta excluida", "Sua conta foi excluida com sucesso.", "success");
        router.push("/");
      } catch (err) {
        const mensagem =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Nao foi possivel excluir sua conta.";
        await Swal.fire("Erro", mensagem, "error");
      } finally {
        this.isExcluindoConta = false;
      }
    },
  },
};
</script>

<style scoped>
.profile-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1800;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(2, 6, 23, 0.68);
  backdrop-filter: blur(6px);
}

.profile-modal {
  width: min(92vw, 560px);
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

.profile-role {
  margin: 0;
  color: rgba(191, 219, 254, 0.8);
  font-size: 12px;
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
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border-color: rgba(147, 197, 253, 0.4);
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

.perfil-modal-fade-enter-active,
.perfil-modal-fade-leave-active {
  transition: opacity 0.22s ease;
}

.perfil-modal-fade-enter-from,
.perfil-modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
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
</style>
