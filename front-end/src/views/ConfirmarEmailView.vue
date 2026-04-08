<template>
  <main class="confirmar-email-page">
    <section class="confirmar-email-card">
      <p class="confirmar-email-kicker">Seguranca da conta</p>
      <h1>Confirmar novo e-mail</h1>
      <p class="confirmar-email-copy">
        Use o link recebido por e-mail ou informe manualmente o codigo de confirmacao.
      </p>

      <div
        v-if="mensagem"
        class="confirmar-email-status"
        :class="statusClasse"
      >
        {{ mensagem }}
      </div>

      <div v-if="carregandoAutomatico" class="confirmar-email-loading">
        Validando o link de confirmacao...
      </div>

      <form class="confirmar-email-form" @submit.prevent="confirmarComCodigo">
        <label class="confirmar-email-field">
          <span>E-mail</span>
          <input
            v-model.trim="email"
            type="email"
            maxlength="120"
            placeholder="Digite o novo e-mail"
            autocomplete="email"
          />
        </label>

        <label class="confirmar-email-field">
          <span>Codigo</span>
          <input
            v-model.trim="codigo"
            type="text"
            maxlength="8"
            placeholder="Digite o codigo"
            autocomplete="one-time-code"
          />
        </label>

        <button
          type="submit"
          class="confirmar-email-button"
          :disabled="carregandoManual"
        >
          {{ carregandoManual ? 'Confirmando...' : 'Confirmar com codigo' }}
        </button>
      </form>

      <button type="button" class="confirmar-email-link" @click="irParaHome">
        Voltar para a tela inicial
      </button>
    </section>
  </main>
</template>

<script>
import api from "@/axios";
import router from "@/router";
import { useAuthStore } from "@/store";

export default {
  name: "ConfirmarEmailView",
  data() {
    return {
      token: "",
      email: "",
      codigo: "",
      carregandoAutomatico: false,
      carregandoManual: false,
      status: "idle",
      mensagem: "",
    };
  },
  computed: {
    statusClasse() {
      return {
        success: this.status === "success",
        error: this.status === "error",
      };
    },
  },
  mounted() {
    this.token = String(this.$route.query?.token || "").trim();
    this.email = String(this.$route.query?.email || "").trim();

    if (this.token) {
      this.confirmarPorLink();
    }
  },
  methods: {
    async aplicarSessaoSeDisponivel(data) {
      if (!data?.token || !data?.usuario) return;
      const authStore = useAuthStore();
      authStore.setAuthData(data.usuario, data.token);
    },
    async confirmarPorLink() {
      if (!this.token || this.carregandoAutomatico) return;

      this.carregandoAutomatico = true;
      this.status = "idle";
      this.mensagem = "";

      try {
        const { data } = await api.post(
          "/confirmar/email/usuario",
          {
            token: this.token,
            email: this.email,
          },
          { silent: true }
        );

        await this.aplicarSessaoSeDisponivel(data);
        this.status = "success";
        this.mensagem = data?.message || "E-mail confirmado com sucesso.";
      } catch (err) {
        this.status = "error";
        this.mensagem =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Nao foi possivel confirmar o e-mail pelo link.";
      } finally {
        this.carregandoAutomatico = false;
      }
    },
    async confirmarComCodigo() {
      if (this.carregandoManual) return;

      const email = String(this.email || "").trim().toLowerCase();
      const codigo = String(this.codigo || "").trim().toUpperCase();
      const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!email || !codigo) {
        this.status = "error";
        this.mensagem = "Preencha o e-mail e o codigo para continuar.";
        return;
      }

      if (!emailValido) {
        this.status = "error";
        this.mensagem = "Informe um e-mail valido.";
        return;
      }

      this.carregandoManual = true;
      this.status = "idle";
      this.mensagem = "";

      try {
        const { data } = await api.post(
          "/confirmar/email/usuario",
          { email, codigo },
          { silent: true }
        );

        await this.aplicarSessaoSeDisponivel(data);
        this.status = "success";
        this.mensagem = data?.message || "E-mail confirmado com sucesso.";
      } catch (err) {
        this.status = "error";
        this.mensagem =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Nao foi possivel confirmar o e-mail com esse codigo.";
      } finally {
        this.carregandoManual = false;
      }
    },
    irParaHome() {
      router.push("/");
    },
  },
};
</script>

<style scoped>
.confirmar-email-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.22), transparent 32%),
    radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.16), transparent 26%),
    linear-gradient(180deg, #0a1435 0%, #101f4f 100%);
}

.confirmar-email-card {
  width: min(100%, 520px);
  display: grid;
  gap: 16px;
  padding: 28px;
  border-radius: 24px;
  border: 1px solid rgba(147, 197, 253, 0.24);
  background:
    linear-gradient(180deg, rgba(18, 33, 79, 0.98) 0%, rgba(13, 25, 63, 0.98) 100%);
  box-shadow: 0 28px 60px rgba(2, 6, 23, 0.45);
  color: #e2e8f0;
}

.confirmar-email-kicker {
  margin: 0;
  color: #60a5fa;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.confirmar-email-card h1 {
  margin: 0;
  color: #ffffff;
  font-size: clamp(28px, 5vw, 36px);
  line-height: 1.1;
}

.confirmar-email-copy {
  margin: 0;
  color: rgba(226, 232, 240, 0.82);
  font-size: 15px;
  line-height: 1.6;
}

.confirmar-email-status {
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.4);
  color: #dbeafe;
  font-size: 14px;
  line-height: 1.5;
}

.confirmar-email-status.success {
  border-color: rgba(74, 222, 128, 0.3);
  background: rgba(20, 83, 45, 0.22);
  color: #dcfce7;
}

.confirmar-email-status.error {
  border-color: rgba(248, 113, 113, 0.3);
  background: rgba(127, 29, 29, 0.26);
  color: #fee2e2;
}

.confirmar-email-loading {
  color: #bfdbfe;
  font-size: 14px;
}

.confirmar-email-form {
  display: grid;
  gap: 14px;
}

.confirmar-email-field {
  display: grid;
  gap: 6px;
}

.confirmar-email-field span {
  font-size: 12px;
  font-weight: 700;
  color: #bfdbfe;
}

.confirmar-email-field input {
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid rgba(96, 165, 250, 0.34);
  background: rgba(15, 23, 42, 0.55);
  color: #f8fafc;
  font: inherit;
  box-sizing: border-box;
}

.confirmar-email-field input::placeholder {
  color: rgba(191, 219, 254, 0.46);
}

.confirmar-email-field input:focus {
  outline: none;
  border-color: rgba(96, 165, 250, 0.88);
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.16);
}

.confirmar-email-button,
.confirmar-email-link {
  min-height: 48px;
  border-radius: 14px;
  border: 1px solid transparent;
  font: inherit;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.confirmar-email-button {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border-color: rgba(147, 197, 253, 0.38);
  color: #ffffff;
}

.confirmar-email-button:disabled {
  opacity: 0.72;
  cursor: wait;
}

.confirmar-email-link {
  background: transparent;
  border-color: rgba(148, 163, 184, 0.22);
  color: #dbeafe;
}

@media (max-width: 640px) {
  .confirmar-email-page {
    padding: 16px;
  }

  .confirmar-email-card {
    padding: 22px;
  }
}
</style>
