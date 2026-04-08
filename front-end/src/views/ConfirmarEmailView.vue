<template>
  <main class="confirmar-email-page">
    <section class="confirmar-email-card">
      <p class="confirmar-email-kicker">Seguranca da conta</p>
      <h1>Confirmar novo e-mail</h1>
      <p class="confirmar-email-copy">
        Ao abrir o link recebido por e-mail, a confirmacao acontece automaticamente.
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

      <button
        v-if="status === 'error' && token"
        type="button"
        class="confirmar-email-button"
        :disabled="carregandoAutomatico"
        @click="confirmarPorLink"
      >
        {{ carregandoAutomatico ? 'Tentando novamente...' : 'Tentar novamente' }}
      </button>

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
      carregandoAutomatico: false,
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

    if (this.token) {
      this.confirmarPorLink();
    } else {
      this.status = "error";
      this.mensagem = "Link de confirmacao invalido ou incompleto.";
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
          { token: this.token },
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
