<template>
  <div class="layout-meus-avisos">
    <NavBar />

    <main class="conteudo-meus-avisos">
      <div class="page-shell">
        <section class="page-header">
          <div class="header-copy">
            <div class="header-topline">
              <h1 class="titulo-principal">Meus avisos</h1>
              <div class="resumo-chip">
                <span class="resumo-valor">{{ totalPendentes }}</span>
                <span class="resumo-texto">Avisos pendentes</span>
              </div>
            </div>
            <p class="subtitulo">Acompanhe atualizações das quadras e visualize o histórico no mesmo painel.</p>
          </div>
        </section>

        <div v-if="loading" class="loader-card">
          <LoadingState
            title="Carregando avisos"
            description="Buscando comunicados pendentes, importantes e já visualizados."
          />
        </div>

        <template v-else>
          <section class="tabs-card">
            <div class="tabs-head">
              <p class="section-kicker">STATUS</p>
              <p class="section-subtitle">Filtre por leitura e prioridade para encontrar cada aviso com mais rapidez.</p>
            </div>

            <div class="abas-config-container-aviso">
              <button type="button" class="aba-config-aviso" :class="{ ativa: abaAtiva === 'naoLidos' }"
                @click="abaAtiva = 'naoLidos'">
                <span>Não lidos</span>
                <span class="badge-total">{{ getTodosPorTipo('naoLidos').length }}</span>
              </button>

              <button type="button" class="aba-config-aviso" :class="{ ativa: abaAtiva === 'importantes' }"
                @click="abaAtiva = 'importantes'">
                <span>Importantes</span>
                <span class="badge-total">{{ getTodosPorTipo('importantes').length }}</span>
              </button>

              <button type="button" class="aba-config-aviso" :class="{ ativa: abaAtiva === 'lidos' }"
                @click="abaAtiva = 'lidos'">
                <span>Lidos</span>
                <span class="badge-total">{{ getTodosPorTipo('lidos').length }}</span>
              </button>
            </div>
          </section>

          <section class="section-aviso">
            <div class="panel-head">
              <div class="panel-copy">
                <p class="section-kicker">{{ getMetaAba(abaAtiva).kicker }}</p>
                <h2 class="section-title">{{ getMetaAba(abaAtiva).title }}</h2>
                <p class="section-subtitle">{{ getMetaAba(abaAtiva).description }}</p>
              </div>

              <span class="panel-count">{{ getTodosPorTipo(abaAtiva).length }} itens</span>
            </div>

            <div v-if="getTodosPorTipo(abaAtiva).length === 0" class="aviso-card-vazio">
              <p>{{ mensagensVazias[abaAtiva] }}</p>
            </div>

            <template v-else>
              <div class="avisos-grid">
                <article v-for="aviso in getItensPagina(abaAtiva)" :key="aviso.id" class="card-aviso"
                  :class="{ 'is-importante': aviso.fixado, 'is-lido': abaAtiva === 'lidos' }">
                  <div class="card-header">
                    <div class="card-header-copy">
                      <span class="tag-quadra">{{ aviso.quadraNome || aviso.quadra?.nome || 'Equipe Quadra Play' }}</span>
                      <h3 class="card-title">{{ aviso.titulo }}</h3>
                    </div>

                    <div class="meta-right">
                      <span v-if="aviso.fixado" class="status-pill status-pill-importante">Importante</span>
                      <span v-else-if="abaAtiva === 'lidos'" class="status-pill status-pill-lido">Lido</span>
                      <span v-else class="status-pill status-pill-pendente">Pendente</span>
                    </div>
                  </div>

                  <div class="card-meta">
                    <span>{{ formatarData(aviso.data) }}</span>
                    <span>{{ aviso.autor?.nome || 'Sistema Quadra Play' }}</span>
                  </div>

                  <p class="descricao">{{ aviso.descricao }}</p>

                  <div class="card-footer">
                    <span class="footer-label">{{ aviso.fixado ? 'Fixado para destaque' : 'Aviso geral da plataforma' }}</span>
                    <button v-if="abaAtiva !== 'lidos' && podeMarcarComoLido(aviso)" class="btn-ler"
                      @click="marcarComoLido(aviso)">
                      <svg class="icon-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span>Marcar como lido</span>
                    </button>
                    <span v-else class="texto-lido">Lido</span>
                  </div>
                </article>
              </div>

              <div class="paginacao-controls" v-if="getTotalPaginas(abaAtiva) > 1">
                <button class="btn-paginacao" :disabled="paginasAtuais[abaAtiva] === 1" @click="mudarPagina(abaAtiva, -1)">
                  &lt; Anterior
                </button>

                <span class="info-paginacao">
                  Página <strong>{{ paginasAtuais[abaAtiva] }}</strong> de {{ getTotalPaginas(abaAtiva) }}
                </span>

                <button class="btn-paginacao" :disabled="paginasAtuais[abaAtiva] === getTotalPaginas(abaAtiva)"
                  @click="mudarPagina(abaAtiva, 1)">
                  Próxima &gt;
                </button>
              </div>
            </template>
          </section>
        </template>
      </div>
    </main>
  </div>
</template>

<script>
import NavBar from "@/components/Usuario/NavBar.vue";
import LoadingState from "@/components/loading/LoadingState.vue";
import api from "@/axios";
import { useAuthStore } from "@/store";
import Swal from "sweetalert2";

const TAB_META = {
  naoLidos: {
    kicker: "PENDENTES",
    title: "Avisos não lidos",
    description: "Veja as atualizações recentes que ainda pedem sua atenção.",
  },
  importantes: {
    kicker: "DESTAQUES",
    title: "Avisos importantes",
    description: "Priorize comunicados fixados e informações com maior urgência.",
  },
  lidos: {
    kicker: "HISTORICO",
    title: "Avisos visualizados",
    description: "Consulte o histórico de comunicados já conferidos anteriormente.",
  },
};

export default {
  name: "MeusAvisosView",
  components: { NavBar, LoadingState },
  data() {
    return {
      todosAvisos: [],
      loading: true,
      abaAtiva: "naoLidos",
      mensagensVazias: {
        importantes: "Nenhum aviso importante pendente.",
        naoLidos: "Você está em dia com os avisos.",
        lidos: "Nenhum aviso no histórico.",
      },
      ITENS_POR_PAGINA: 8,
      paginasAtuais: {
        importantes: 1,
        naoLidos: 1,
        lidos: 1,
      },
    };
  },
  computed: {
    usuarioId() {
      const authStore = useAuthStore();
      const userLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
      return authStore.usuario?.id || userLocal.id;
    },
    listaImportantes() {
      return this.todosAvisos.filter((a) => a.fixado && !this.verificarSeLi(a));
    },
    listaNaoLidos() {
      return this.todosAvisos.filter((a) => !a.fixado && !this.verificarSeLi(a));
    },
    listaLidos() {
      return this.todosAvisos.filter((a) => this.verificarSeLi(a));
    },
    totalPendentes() {
      return this.listaImportantes.length + this.listaNaoLidos.length;
    },
  },
  mounted() {
    this.carregarTodosAvisos();
    window.addEventListener("avisos-atualizados", this.carregarTodosAvisos);
  },
  beforeUnmount() {
    window.removeEventListener("avisos-atualizados", this.carregarTodosAvisos);
  },
  methods: {
    getMetaAba(tipo) {
      return TAB_META[tipo] || TAB_META.naoLidos;
    },
    verificarSeLi(aviso) {
      if (!this.usuarioId || !aviso.leituras) return false;
      return aviso.leituras.some((leitura) => String(leitura.usuarioId) === String(this.usuarioId));
    },
    ehCriadorDoAviso(aviso) {
      const usuarioLogadoId = Number(this.usuarioId);
      if (!usuarioLogadoId) return false;

      const autorAvisoId = Number(
        aviso?.autorId ??
        aviso?.autor?.id ??
        aviso?.usuarioId ??
        aviso?.usuario?.id
      );

      if (!Number.isFinite(autorAvisoId) || autorAvisoId <= 0) return false;
      return autorAvisoId === usuarioLogadoId;
    },
    podeMarcarComoLido(aviso) {
      return !this.ehCriadorDoAviso(aviso);
    },
    getTodosPorTipo(tipo) {
      if (tipo === "importantes") return this.listaImportantes;
      if (tipo === "naoLidos") return this.listaNaoLidos;
      if (tipo === "lidos") return this.listaLidos;
      return [];
    },
    getItensPagina(tipo) {
      const todos = this.getTodosPorTipo(tipo);
      const pagina = this.paginasAtuais[tipo];
      const inicio = (pagina - 1) * this.ITENS_POR_PAGINA;
      return todos.slice(inicio, inicio + this.ITENS_POR_PAGINA);
    },
    getTotalPaginas(tipo) {
      return Math.ceil(this.getTodosPorTipo(tipo).length / this.ITENS_POR_PAGINA) || 1;
    },
    mudarPagina(tipo, delta) {
      const novaPagina = this.paginasAtuais[tipo] + delta;
      const max = this.getTotalPaginas(tipo);
      if (novaPagina >= 1 && novaPagina <= max) {
        this.paginasAtuais[tipo] = novaPagina;
      }
    },
    async carregarTodosAvisos() {
      this.loading = true;
      try {
        const { data } = await api.get("/avisos");
        const avisos = Array.isArray(data) ? data : [];
        const tempAvisos = avisos.map((aviso) => ({
          ...aviso,
          quadraNome: aviso?.quadra?.nome || "Equipe Quadra Play",
        }));

        tempAvisos.sort((a, b) => new Date(b.data) - new Date(a.data));
        this.todosAvisos = tempAvisos;
      } catch (error) {
        console.error("Erro ao carregar avisos:", error);
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível carregar os avisos.",
        });
      } finally {
        this.loading = false;
      }
    },
    async marcarComoLido(aviso) {
      if (!this.usuarioId) {
        Swal.fire({ icon: "error", title: "Erro", text: "Tente logar novamente." });
        return;
      }
      try {
        await api.post(`/avisos/${aviso.id}/ler`, { usuarioId: this.usuarioId });
        if (!aviso.leituras) aviso.leituras = [];
        aviso.leituras.push({ usuarioId: this.usuarioId });
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
        console.error("Erro ao marcar como lido", error);
      }
    },
    formatarData(data) {
      if (!data) return "";
      return new Date(data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
};
</script>

<style scoped>
.layout-meus-avisos {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: "Montserrat", sans-serif;
  background: #f4f6fb;
  overflow-x: hidden;
}

.conteudo-meus-avisos {
  padding: 100px 0 32px 0;
  overflow-x: hidden;
}

.page-shell {
  width: calc(100% - 120px);
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.header-copy,
.panel-copy {
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
  margin: 0;
  color: #2563eb;
  font-size: 42px;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.subtitulo,
.section-subtitle {
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
  color: rgba(255, 255, 255, 0.84);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.loader-card,
.tabs-card,
.section-aviso {
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
}

.loader-card {
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader {
  width: 56px;
  height: 56px;
  border: 6px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: girar 1s linear infinite;
}

@keyframes girar {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.tabs-card {
  padding: 18px 20px;
  margin-bottom: 18px;
}

.tabs-head {
  margin-bottom: 14px;
}

.section-kicker {
  margin: 0 0 8px 0;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.abas-config-container-aviso {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.aba-config-aviso {
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #f8fafc;
  color: #475569;
  font-size: 15px;
  font-weight: 800;
  padding: 12px;
  cursor: pointer;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: transform 0.15s ease, background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.aba-config-aviso:hover {
  background: rgba(59, 130, 246, 0.08);
  transform: translateY(-1px);
}

.aba-config-aviso.ativa {
  background: #3b82f6;
  color: #fff;
  box-shadow: 0 14px 26px rgba(37, 99, 235, 0.22);
  border-color: rgba(255, 255, 255, 0.18);
}

.badge-total {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  color: #2563eb;
  background: #dbeafe;
  border: 1px solid rgba(37, 99, 235, 0.18);
}

.aba-config-aviso.ativa .badge-total {
  color: #2563eb;
  background: #ffffff;
  border-color: rgba(255, 255, 255, 0.55);
}

.section-aviso {
  padding: 22px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-title {
  margin: 0 0 6px 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 800;
}

.panel-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: #eff6ff;
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.aviso-card-vazio {
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #64748b;
  font-size: 15px;
  background: #f8fafc;
  border: 1px dashed rgba(148, 163, 184, 0.45);
  border-radius: 20px;
}

.aviso-card-vazio p {
  margin: 0;
}

.avisos-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.card-aviso {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 248px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.card-aviso.is-importante {
  background: linear-gradient(180deg, #fff7ed 0%, #ffffff 100%);
  border-color: rgba(249, 115, 22, 0.24);
}

.card-aviso.is-lido {
  background: #f8fafc;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-header-copy {
  min-width: 0;
}

.tag-quadra {
  display: inline-flex;
  margin-bottom: 8px;
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.card-title {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: -0.02em;
}

.meta-right {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.status-pill-importante {
  color: #c2410c;
  background: #ffedd5;
  border: 1px solid rgba(249, 115, 22, 0.2);
}

.status-pill-pendente {
  color: #1d4ed8;
  background: #dbeafe;
  border: 1px solid rgba(59, 130, 246, 0.18);
}

.status-pill-lido {
  color: #166534;
  background: #dcfce7;
  border: 1px solid rgba(34, 197, 94, 0.18);
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.descricao {
  margin: 0;
  color: #334155;
  font-size: 14px;
  line-height: 1.58;
  flex: 1;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.footer-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.btn-ler {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 14px;
  border: none;
  border-radius: 999px;
  background: #3b82f6;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.18s ease;
}

.icon-check {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.btn-ler:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.texto-lido {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  color: #166534;
  background: #dcfce7;
  border: 1px solid rgba(34, 197, 94, 0.18);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.paginacao-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.info-paginacao {
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
}

.info-paginacao strong {
  color: #2563eb;
  font-weight: 900;
}

.btn-paginacao {
  background-color: #fff;
  border: 1px solid rgba(15, 23, 42, 0.12);
  color: #334155;
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.btn-paginacao:hover:not(:disabled) {
  border-color: rgba(59, 130, 246, 0.55);
  color: #2563eb;
  background-color: #eff6ff;
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.1);
}

.btn-paginacao:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background-color: #f8fafc;
  transform: none;
  box-shadow: none;
}

@media (max-width: 900px) {
  .page-shell {
    width: calc(100% - 28px);
  }

  .conteudo-meus-avisos {
    padding: 96px 0 24px 0;
  }

  .titulo-principal {
    font-size: 30px;
  }

  .resumo-chip {
    height: 38px;
    padding: 0 12px;
  }

  .resumo-valor {
    font-size: 16px;
  }

  .resumo-texto {
    font-size: 10px;
    letter-spacing: 0.06em;
  }

  .avisos-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header-topline {
    align-items: center;
    gap: 10px;
  }

  .titulo-principal {
    font-size: 28px;
    min-width: 0;
  }

  .subtitulo {
    font-size: 14px;
    line-height: 1.55;
  }

  .resumo-chip {
    flex: 0 0 auto;
    height: 36px;
    padding: 0 12px;
    gap: 6px;
  }

  .tabs-card {
    padding: 16px 14px;
  }

  .aba-config-aviso {
    padding: 10px 6px;
    font-size: 12px;
    gap: 6px;
  }

  .badge-total {
    min-width: 22px;
    height: 20px;
    font-size: 10px;
  }

  .section-aviso {
    padding: 18px 14px;
  }

  .panel-head,
  .card-header,
  .card-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel-count,
  .meta-right,
  .btn-ler,
  .texto-lido {
    width: auto;
  }

  .card-aviso {
    min-height: 0;
    padding: 16px;
  }

  .paginacao-controls {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .btn-paginacao {
    width: 100%;
    justify-content: center;
  }

  .info-paginacao {
    text-align: center;
  }
}
</style>





