<template>
  <div class="container">
    <NavBar />

    <div class="page-shell">
      <div v-if="avisoDestaque" class="aviso-banner">
        <div class="aviso-body">
          <div class="aviso-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon-atencao" viewBox="0 0 24 24" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clip-rule="evenodd"
              />
            </svg>
          </div>

          <div class="aviso-content-col">
            <p class="aviso-quadra-tag">
              {{ avisoDestaque.quadra?.nome || "Equipe Quadra Play" }}
            </p>
            <h4 class="aviso-titulo">{{ avisoDestaque.titulo }}</h4>
            <p class="aviso-descricao">{{ avisoDestaque.descricao }}</p>
          </div>

          <button class="btn-ler" type="button" @click="marcarLido">
            Confirmar leitura
          </button>
        </div>
      </div>

      <section class="page-header">
        <div class="header-copy">
          <div class="header-topline">
            <h1 class="titulo-principal">Agendar quadra</h1>
            <div class="resumo-chip">
              <span class="resumo-valor">{{ quadrasDisponiveis }}</span>
              <span class="resumo-texto">Quadras Disponíveis</span>
            </div>
          </div>
          <p class="subtitulo">Escolha a quadra ideal e faça sua reserva em poucos passos.</p>
        </div>
      </section>

      <div v-if="isLoadingQuadras" class="loader-wrap">
        <LoadingState
          title="Carregando quadras"
          description="Buscando unidades e modalidades vinculadas ao seu acesso."
        />
      </div>

      <div v-else>
        <div v-if="quadras.length === 0" class="mensagem-nenhuma-quadra">
          <p>Nenhuma unidade disponível para agendamento.</p>
        </div>

        <section v-else class="quadras-painel">
          <div class="section-head">
            <p class="section-kicker">QUADRAS</p>
            <h2 class="section-title">Escolha onde reservar</h2>
            <p class="section-subtitle">Clique em agendar agora e siga direto para o agendamento.</p>
          </div>

          <div class="quadras-grid">
            <article
              v-for="quadra in quadras"
              :key="quadra.id"
              class="card-quadra"
              :class="{ 'is-interditada': quadra.interditada }"
            >
              <span class="card-status" :class="{ 'is-indisponivel': quadra.interditada }">
                {{ quadra.interditada ? "Indisponível" : "Disponível" }}
              </span>

              <img
                :src="quadra.foto"
                :alt="quadra.nome"
                class="imagem-quadra"
              />

              <div class="overlay">
                <div class="card-surface">
                  <div class="card-copy">
                    <h3 class="nome-quadra">{{ quadra.nome }}</h3>

                    <div class="card-tags">
                      <span class="tag-modalidade" :class="{ 'tag-modalidade-muted': !quadra.endereco }">
                        {{ quadra.endereco || "Endereço não informado" }}
                      </span>
                    </div>
                  </div>

                  <button
                    class="btn-agendar"
                    :disabled="quadra.interditada || !!quadraEmAberturaId"
                    @click="abrirAgendamentoDireto(quadra)"
                  >
                    <span class="btn-agendar-content">
                      <svg
                        v-if="quadraEmAberturaId !== quadra.id"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M7 3v4" />
                        <path d="M17 3v4" />
                        <rect x="4" y="5" width="16" height="15" rx="3" ry="3" />
                        <path d="M4 10h16" />
                        <path d="m9 14 2 2 4-4" />
                      </svg>
                      <span
                        v-if="quadraEmAberturaId === quadra.id"
                        class="btn-agendar-spinner"
                        aria-hidden="true"
                      ></span>
                      <span>
                        {{
                          quadra.interditada
                            ? "Indisponível"
                            : quadraEmAberturaId === quadra.id
                              ? "Carregando..."
                              : "Agendar agora"
                        }}
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>

      <AgendamentoModal
        v-if="mostrarModalAgendamento"
        :quadra="quadraSelecionada"
        :times="podeSelecionarTime ? times : []"
        :usar-dados-precarregados="true"
        :modalidades-precarregadas="modalidadesPrecarregadasModal"
        :grade-config-precarregada="gradeConfigPrecarregadaModal"
        @fechar="mostrarModalAgendamento = false"
        @confirmar="confirmarAgendamento"
      />
    </div>
  </div>
</template>

<script>
import Swal from "sweetalert2";
import NavBar from "@/components/Usuario/NavBar.vue";
import LoadingState from "@/components/loading/LoadingState.vue";
import AgendamentoModal from "@/components/modals/Agendamentos/AgendModal.vue";
import api from "@/axios";
import { useAuthStore } from "@/store";
import { mapState } from "pinia";

export default {
  name: "AgendarQuadras",
  components: { NavBar, LoadingState, AgendamentoModal },
  data() {
    return {
      quadras: [],
      isLoadingQuadras: true,
      mostrarModalAgendamento: false,
      quadraSelecionada: null,
      avisoDestaque: null,
      times: [],
      quadraEmAberturaId: null,
      modalidadesPrecarregadasModal: [],
      gradeConfigPrecarregadaModal: [],
      cacheModalidadesPorQuadra: {},
      cacheGradePorQuadra: {},
    };
  },

  computed: {
    ...mapState(useAuthStore, ["usuario"]),
    podeSelecionarTime() {
      return [1, 2, 5].includes(Number(this.usuario?.permissaoId));
    },
    quadrasDisponiveis() {
      return this.quadras.filter((quadra) => !quadra.interditada).length;
    },
  },

  watch: {
    usuario: {
      handler(novoUsuario) {
        if (novoUsuario?.id && this.podeSelecionarTime) {
          this.carregarTimes(novoUsuario.id);
          return;
        }
        this.times = [];
      },
      immediate: true,
    },
  },

  mounted() {
    this.carregarQuadras();
    if (this.usuario?.id && this.podeSelecionarTime) {
      this.carregarTimes(this.usuario.id);
    }
    window.addEventListener("avisos-atualizados", this.carregarAvisoDestaque);
  },

  beforeUnmount() {
    window.removeEventListener("avisos-atualizados", this.carregarAvisoDestaque);
  },

  methods: {
    obterUsuarioAutenticado() {
      const authStore = useAuthStore();

      if (authStore.usuario?.id) return authStore.usuario;

      const token = localStorage.getItem("token");
      if (!token || token === "undefined" || token === "null") return null;

      try {
        const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "null");
        if (!usuarioLocal?.id) return null;
        authStore.setAuthData(usuarioLocal, token);
        return usuarioLocal;
      } catch {
        return null;
      }
    },

    async carregarTimes(userId) {
      if (!userId) return;
      try {
        const permissaoId = Number(this.usuario?.permissaoId);
        const endpoint =
          permissaoId === 1 || permissaoId === 2 ? "/times" : `/usuarios/${userId}/times`;
        const { data } = await api.get(endpoint);
        this.times = Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao carregar times na tela principal:", error);
        this.times = [];
      }
    },

    async abrirAgendamentoDireto(quadra) {
      if (!quadra || quadra.interditada || this.quadraEmAberturaId) return;

      this.quadraEmAberturaId = Number(quadra.id);
      this.quadraSelecionada = quadra;
      this.modalidadesPrecarregadasModal = [];
      this.gradeConfigPrecarregadaModal = [];

      try {
        const promessas = [this.carregarDadosAgendamentoDaQuadra(Number(quadra.id))];
        if (this.podeSelecionarTime && this.usuario?.id && this.times.length === 0) {
          promessas.push(this.carregarTimes(this.usuario.id));
        }

        const [dadosAgendamento] = await Promise.all(promessas);
        this.modalidadesPrecarregadasModal = dadosAgendamento.modalidades;
        this.gradeConfigPrecarregadaModal = dadosAgendamento.gradeConfig;
        this.mostrarModalAgendamento = true;
      } catch (error) {
        console.error("Erro ao preparar agendamento:", error);
        Swal.fire({
          icon: "error",
          title: "Não foi possível abrir o agendamento",
          text: "Tente novamente em alguns segundos.",
          confirmButtonColor: "#1E3A8A",
        });
      } finally {
        this.quadraEmAberturaId = null;
      }
    },

    async carregarDadosAgendamentoDaQuadra(quadraId) {
      const temModalidadesCache = Object.prototype.hasOwnProperty.call(this.cacheModalidadesPorQuadra, quadraId);
      const temGradeCache = Object.prototype.hasOwnProperty.call(this.cacheGradePorQuadra, quadraId);

      const promessaModalidades = temModalidadesCache
        ? Promise.resolve(this.cacheModalidadesPorQuadra[quadraId])
        : api.get(`/quadra/${quadraId}/modalidades`).then(({ data }) => (Array.isArray(data) ? data : []));

      const promessaGrade = temGradeCache
        ? Promise.resolve(this.cacheGradePorQuadra[quadraId])
        : api.get(`/grade-horarios/${quadraId}`)
          .then(({ data }) => (Array.isArray(data) ? data : []))
          .catch((error) => {
            console.warn("Sem grade configurada para a quadra:", error);
            return [];
          });

      const [modalidades, gradeConfig] = await Promise.all([promessaModalidades, promessaGrade]);

      this.cacheModalidadesPorQuadra[quadraId] = modalidades;
      this.cacheGradePorQuadra[quadraId] = gradeConfig;

      return { modalidades, gradeConfig };
    },

    async carregarAvisoDestaque() {
      try {
        const authStore = useAuthStore();
        const usuarioId = authStore.usuario?.id;
        const { data } = await api.get("/avisos");
        const avisos = Array.isArray(data) ? data : [];

        const todosAvisos = avisos.filter((aviso) => {
          if (!aviso?.leituras) return true;
          return !aviso.leituras.some((leitura) => String(leitura.usuarioId) === String(usuarioId));
        });

        if (todosAvisos.length === 0) {
          this.avisoDestaque = null;
          return;
        }

        todosAvisos.sort((a, b) => {
          if (a.fixado === b.fixado) return new Date(b.data) - new Date(a.data);
          return a.fixado ? -1 : 1;
        });
        this.avisoDestaque = todosAvisos[0];
      } catch (err) {
        console.error("Erro ao carregar avisos para destaque:", err);
      }
    },

    async marcarLido() {
      const authStore = useAuthStore();
      if (this.avisoDestaque && authStore.usuario) {
        try {
          await api.post(`/avisos/${this.avisoDestaque.id}/ler`, {
            usuarioId: authStore.usuario.id,
          });
          this.avisoDestaque = null;
          window.dispatchEvent(new Event("avisos-atualizados"));

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Lido",
            showConfirmButton: false,
            timer: 2000,
          });
        } catch (error) {
          console.warn("Não foi possível marcar como lido", error);
        }
      }
    },

    async carregarQuadras() {
      this.isLoadingQuadras = true;
      try {
        const { data } = await api.get("/quadra");
        this.quadras = data;

        const quadraIdUrl = this.$route.query.quadraId;
        if (quadraIdUrl) {
          const quadraAlvo = this.quadras.find((q) => q.id === Number(quadraIdUrl));

          if (quadraAlvo && !quadraAlvo.interditada) {
            this.$router.replace({ query: null });
            this.abrirAgendamentoDireto(quadraAlvo);
          }
        }
        this.carregarAvisoDestaque();
      } catch (err) {
        console.error("Erro ao carregar quadras:", err);
      } finally {
        this.isLoadingQuadras = false;
      }
    },

    async confirmarAgendamento(agendamentoDoModal) {
      const usuarioAutenticado = this.obterUsuarioAutenticado();

      if (!usuarioAutenticado) {
        Swal.fire({
          title: "Você precisa estar logado",
          text: "Volte para a tela inicial para entrar novamente.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Ir para início",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#1E3A8A",
        }).then((result) => {
          if (result.isConfirmed) this.$router.push({ name: "Home" });
        });
        return;
      }

      if (!this.quadraSelecionada) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Nenhuma quadra selecionada.",
          confirmButtonColor: "#1E3A8A",
        });
        return;
      }

      if (agendamentoDoModal.fixo && Array.isArray(agendamentoDoModal.lote)) {
        const loteFormatado = agendamentoDoModal.lote.map((item) => ({
          ...item,
          usuarioId: usuarioAutenticado.id,
          quadraId: this.quadraSelecionada.id,
        }));

        try {
          Swal.fire({
            title: "Processando agenda fixa...",
            html: "Isso pode levar alguns segundos.",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          await api.post("/agendamentos/fixos", {
            lote: loteFormatado,
            usuarioId: usuarioAutenticado.id,
          });

          Swal.fire({
            icon: "success",
            title: "Agenda fixa salva!",
            text: `Os horários fixos da quadra ${this.quadraSelecionada.nome} foram atualizados com sucesso.`,
            confirmButtonColor: "#1E3A8A",
          });

          this.mostrarModalAgendamento = false;
        } catch (err) {
          const msgErro =
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Não foi possível processar os agendamentos fixos.";
          Swal.fire({
            icon: "error",
            title: "Erro ao salvar agenda fixa",
            text: msgErro,
            confirmButtonColor: "#1E3A8A",
          });
        }

        return;
      }

      const agendamento = {
        ...agendamentoDoModal,
        usuarioId: usuarioAutenticado.id,
        quadraId: this.quadraSelecionada.id,
        fixo: false,
      };

      try {
        Swal.fire({
          title: "Processando seu agendamento...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        await api.post("/agendamento", agendamento);

        Swal.fire({
          icon: "success",
          title: "Agendamento realizado!",
          text: `Sua reserva na quadra ${this.quadraSelecionada.nome} foi enviada para análise.`,
          confirmButtonColor: "#1E3A8A",
          timer: 5000,
          showConfirmButton: true,
          timerProgressBar: true,
        });

        this.mostrarModalAgendamento = false;
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message || "Ocorreu um erro inesperado.";
        const status = err.response?.status;

        if (status === 409) {
          Swal.fire({
            icon: "warning",
            title: "Horário indisponível",
            text: "O horário selecionado já está reservado. Por favor, escolha outro horário.",
            confirmButtonColor: "#1E3A8A",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Não foi possível agendar",
            text: msg,
            confirmButtonColor: "#1E3A8A",
          });
        }
      }
    },
  },
};
</script>

<style scoped>
body {
  margin: 0 auto;
  padding: 0;
  box-sizing: border-box;
}

.container {
  font-family: "Montserrat", sans-serif;
  background-color: #f4f6fb;
  min-height: 100vh;
  width: 100%;
  max-width: none;
  padding: 100px 0 32px 0;
}

.page-shell {
  width: calc(100% - 120px);
  margin: 0 auto;
}

.aviso-banner {
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  border: 1px solid #dbe7ff;
  border-radius: 24px;
  padding: 16px 18px;
  margin-bottom: 20px;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07);
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.aviso-body {
  display: flex;
  align-items: center;
  gap: 14px;
}

.aviso-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: #dbeafe;
  border-radius: 50%;
  flex-shrink: 0;
}

.icon-atencao {
  width: 20px;
  height: 20px;
  color: #1d4ed8;
}

.aviso-content-col {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.aviso-quadra-tag {
  margin: 0 0 6px 0;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: #2563eb;
  letter-spacing: 0.14em;
}

.aviso-titulo {
  color: #0f172a;
  font-size: 16px;
  font-weight: 800;
  margin: 0 0 4px 0;
}

.aviso-descricao {
  color: #64748b;
  font-size: 14px;
  margin: 0;
  line-height: 1.45;
}

.btn-ler {
  flex-shrink: 0;
  border: none;
  background: #3b82f6;
  color: #ffffff;
  padding: 0 16px;
  min-width: 150px;
  height: 40px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.btn-ler:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.page-header {
  display: block;
  margin-bottom: 20px;
}

.header-copy {
  min-width: 0;
}

.header-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}

.titulo-principal {
  font-size: 42px;
  font-weight: 900;
  color: #2563eb;
  margin: 0;
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.subtitulo {
  margin: 0;
  color: #64748b;
  font-size: 15px;
  line-height: 1.5;
}

.resumo-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 18px 32px rgba(37, 99, 235, 0.18);
}

.resumo-valor {
  color: #ffffff;
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
}

.resumo-texto {
  margin-top: 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.loader-wrap,
.mensagem-nenhuma-quadra,
.quadras-painel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 28px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.07);
}

.loader-wrap,
.mensagem-nenhuma-quadra {
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quadras-painel {
  padding: 22px;
}

.section-head {
  margin-bottom: 18px;
}

.section-kicker {
  margin: 0 0 8px 0;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.section-title {
  margin: 0 0 6px 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 800;
}

.section-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
}

.quadras-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
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
  background: linear-gradient(180deg,
    rgba(8, 21, 61, 0.05) 0%,
    rgba(8, 21, 61, 0.14) 26%,
    rgba(8, 21, 61, 0.34) 54%,
    rgba(5, 11, 44, 0.86) 100%);
  z-index: 1;
  pointer-events: none;
}

.card-quadra:hover:not(.is-interditada) {
  transform: translateY(-4px);
  border-color: rgba(96, 165, 250, 0.5);
  box-shadow: 0 20px 36px rgba(37, 99, 235, 0.22);
}

.imagem-quadra {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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
  min-width: 102px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.94);
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
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

.card-surface {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 78%;
}

.card-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 100%;
}

.card-kicker {
  margin: 0;
  color: #93c5fd;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.nome-quadra {
  color: #ffffff;
  font-size: 24px;
  font-weight: 900;
  margin: 0;
  line-height: 1.12;
  letter-spacing: -0.03em;
  text-shadow: 0 10px 22px rgba(0, 0, 0, 0.5);
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.tag-modalidade {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.12);
  border: 1px solid rgba(226, 232, 240, 0.18);
  color: rgba(255, 255, 255, 0.96);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  backdrop-filter: blur(10px);
}

.tag-modalidade-muted {
  background: rgba(5, 11, 44, 0.44);
}

.btn-agendar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #3b82f6;
  color: #ffffff;
  border: none;
  padding: 0 16px;
  cursor: pointer;
  min-width: 118px;
  height: 42px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  transition: background-color 0.2s ease, transform 0.2s ease;
  align-self: flex-start;
}

.btn-agendar-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-agendar svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  flex-shrink: 0;
}

.btn-agendar-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.42);
  border-top-color: #ffffff;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

.btn-agendar:hover:not(:disabled) {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.btn-agendar:disabled {
  background-color: rgba(148, 163, 184, 0.92);
  color: rgba(255, 255, 255, 0.72);
  cursor: not-allowed;
}

.loader {
  border: 6px solid #f3f3f3;
  border-top: 6px solid #3b82f6;
  border-radius: 50%;
  width: 88px;
  height: 88px;
  animation: spin 1s linear infinite;
}

.mensagem-nenhuma-quadra {
  text-align: center;
  color: #64748b;
  font-size: 18px;
}

.mensagem-nenhuma-quadra p {
  margin: 0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .container {
    padding: 96px 0 24px 0;
  }

  .page-shell {
    width: calc(100% - 28px);
  }

  .aviso-banner {
    border-radius: 24px;
    padding: 16px;
  }

  .aviso-body {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-ler {
    width: 100%;
    min-width: 0;
  }

  .page-header {
    display: block;
  }

  .header-topline {
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: nowrap;
  }

  .titulo-principal {
    font-size: 28px;
    min-width: 0;
  }

  .resumo-chip {
    flex: 0 0 auto;
    height: 36px;
    padding: 0 12px;
    gap: 6px;
  }

  .resumo-valor {
    font-size: 16px;
  }

  .resumo-texto {
    font-size: 10px;
    letter-spacing: 0.06em;
  }

  .subtitulo {
    font-size: 15px;
    line-height: 1.55;
  }

  .loader-wrap,
  .mensagem-nenhuma-quadra,
  .quadras-painel {
    border-radius: 24px;
  }

  .quadras-painel {
    padding: 18px 14px;
  }

  .section-head {
    margin-bottom: 18px;
  }

  .quadras-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .card-quadra {
    height: 248px;
    border-radius: 24px;
  }

  .card-status {
    top: 14px;
    right: 14px;
    min-width: 108px;
    height: 34px;
    font-size: 11px;
  }

  .overlay {
    padding: 14px;
  }

  .nome-quadra {
    font-size: 20px;
  }

  .card-surface {
    max-width: 100%;
  }

  .card-tags {
    gap: 6px;
  }

  .btn-agendar {
    width: 100%;
  }
}
</style>
