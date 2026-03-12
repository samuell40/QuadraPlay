<template>
  <div class="layout-agendamento-user">
    <NavBar />

    <main class="conteudo-meus-agendamentos">
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
              <h1 class="titulo-agendamento">Meus agendamentos</h1>
              <button class="btn-acao-topo" @click="irParaAgendarQuadra(null)" aria-label="Agendar quadra">
                <svg class="btn-acao-icone" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span class="btn-acao-texto">Agendar quadra</span>
              </button>
            </div>
            <p class="subtitulo-agendamento">Acompanhe e gerencie suas reservas em um só lugar.</p>
          </div>
        </section>

        <div v-if="isLoading" class="loader-card">
          <LoadingState
            title="Carregando agendamentos"
            description="Buscando suas reservas, status e atalhos de acompanhamento."
          />
        </div>

        <template v-else>
          <section class="tabs-card">
            <div class="tabs-head">
              <p class="section-kicker">STATUS</p>
              <p class="section-subtitle">Filtre seus agendamentos por etapa para acompanhar cada reserva.</p>
            </div>

            <div class="abas-config-container-agendamento">
              <button type="button" class="aba-config-agendamento" :class="{ ativa: abaAtiva === 'pendentes' }"
                @click="abaAtiva = 'pendentes'">
                <span>Pendentes</span>
                <span class="badge-total">{{ getTodosPorTipo("pendentes").length }}</span>
              </button>

              <button type="button" class="aba-config-agendamento" :class="{ ativa: abaAtiva === 'confirmados' }"
                @click="abaAtiva = 'confirmados'">
                <span>Confirmados</span>
                <span class="badge-total">{{ getTodosPorTipo("confirmados").length }}</span>
              </button>

              <button type="button" class="aba-config-agendamento" :class="{ ativa: abaAtiva === 'recusados' }"
                @click="abaAtiva = 'recusados'">
                <span>Recusados</span>
                <span class="badge-total">{{ getTodosPorTipo("recusados").length }}</span>
              </button>
            </div>
          </section>

          <section class="section-agendamento">
            <div class="panel-head">
              <div class="panel-copy">
                <p class="section-kicker">{{ getMetaAba(abaAtiva).kicker }}</p>
                <h2 class="section-title">{{ getMetaAba(abaAtiva).title }}</h2>
                <p class="section-subtitle">{{ getMetaAba(abaAtiva).description }}</p>
              </div>

              <span class="panel-count">{{ getTodosPorTipo(abaAtiva).length }} itens</span>
            </div>

            <div v-if="getTodosPorTipo(abaAtiva).length === 0" class="agendamento-vazio">
              <p>{{ getMetaAba(abaAtiva).empty }}</p>
            </div>

            <template v-else>
              <div class="agendamentos-grid">
                <MeusAgendamentoCard v-for="ag in getItensPagina(abaAtiva)" :key="ag.id" :agendamento="ag"
                  :mostrarBotoes="deveMostrarBotoes(ag)" @gerarPdf="gerarPdfAgendamento(ag)"
                  @cancelar="cancelarAgendamento(ag.id)" @novo="irParaAgendarQuadra(ag.quadraId)" />
              </div>

              <div class="paginacao-controls" v-if="getTotalPaginas(abaAtiva) > 1">
                <button class="btn-paginacao" :disabled="paginasAtuais[abaAtiva] === 1"
                  @click="mudarPagina(abaAtiva, -1)">
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

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import NavBar from "@/components/Usuario/NavBar.vue";
import LoadingState from "@/components/loading/LoadingState.vue";
import MeusAgendamentoCard from "@/components/cards/MeusAgendamentosCard.vue";
import api from "@/axios";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import logoImg from "@/assets/logo.png";
import { useAuthStore } from "@/store";

const router = useRouter();
const authStore = useAuthStore();
const isLoading = ref(true);
const allAgendamentos = ref([]);
const abaAtiva = ref("pendentes");
const avisoDestaque = ref(null);
const abaInicialDefinida = ref(false);

const ITENS_POR_PAGINA = 10;
const ORDEM_ABAS_PRIORIDADE = ["pendentes", "confirmados", "recusados"];
const ORDEM_STATUS_LISTA = {
  pendente: 0,
  confirmado: 1,
  recusado: 2,
  cancelado: 2,
};

const paginasAtuais = ref({
  confirmados: 1,
  pendentes: 1,
  recusados: 1,
});

const TAB_META = {
  confirmados: {
    kicker: "CONFIRMADOS",
    title: "Reservas confirmadas",
    description: "Visualize os horários já aprovados e gere o comprovante quando precisar.",
    empty: "Nenhum agendamento futuro confirmado.",
  },
  pendentes: {
    kicker: "PENDENTES",
    title: "Solicitações em análise",
    description: "Acompanhe os pedidos que ainda aguardam confirmação da quadra.",
    empty: "Nenhuma solicitação pendente no momento.",
  },
  recusados: {
    kicker: "HISTÓRICO",
    title: "Recusados e cancelados",
    description: "Consulte as reservas recusadas ou canceladas anteriormente.",
    empty: "Nenhum agendamento recusado ou cancelado.",
  },
};

const getMetaAba = (tipo) => TAB_META[tipo] || TAB_META.confirmados;

const getTodosPorTipo = (tipo) => {
  if (tipo === "pendentes") {
    return allAgendamentos.value.filter((a) => a.status === "pendente");
  }
  if (tipo === "confirmados") {
    return allAgendamentos.value.filter((a) => a.status === "confirmado");
  }
  if (tipo === "recusados") {
    return allAgendamentos.value.filter((a) => a.status === "recusado" || a.status === "cancelado");
  }
  return [];
};

const getItensPagina = (tipo) => {
  const todos = getTodosPorTipo(tipo);
  const pagina = paginasAtuais.value[tipo];
  const inicio = (pagina - 1) * ITENS_POR_PAGINA;
  return todos.slice(inicio, inicio + ITENS_POR_PAGINA);
};

const getTotalPaginas = (tipo) => Math.ceil(getTodosPorTipo(tipo).length / ITENS_POR_PAGINA) || 1;

const sincronizarAbaAtiva = () => {
  const primeiraAbaComItens =
    ORDEM_ABAS_PRIORIDADE.find((tipo) => getTodosPorTipo(tipo).length > 0) || ORDEM_ABAS_PRIORIDADE[0];

  if (!abaInicialDefinida.value || getTodosPorTipo(abaAtiva.value).length === 0) {
    abaAtiva.value = primeiraAbaComItens;
    abaInicialDefinida.value = true;
  }
};

const mudarPagina = (tipo, delta) => {
  const novaPagina = paginasAtuais.value[tipo] + delta;
  const max = getTotalPaginas(tipo);

  if (novaPagina >= 1 && novaPagina <= max) {
    paginasAtuais.value[tipo] = novaPagina;
  }
};

const getUsuarioId = () => {
  if (authStore.usuario?.id) return authStore.usuario.id;

  try {
    const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
    return usuarioLocal.id || null;
  } catch {
    return null;
  }
};

const normalizarNomeArquivo = (texto, fallback = "arquivo") => {
  const nome = String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  return nome || fallback;
};

const carregarLogoPdf = () => {
  const img = new Image();
  img.src = logoImg;

  return new Promise((resolve) => {
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
};

const formatarDuracaoPdf = (duracao) => {
  const numero = Number(duracao);
  if (!Number.isFinite(numero) || numero <= 0) return "Não informado";
  return `${numero} hora${numero === 1 ? "" : "s"}`;
};

const carregarAgendamentos = async () => {
  isLoading.value = true;
  try {
    const { data } = await api.get("/agendamentos");

    allAgendamentos.value = data
      .map((a) => {
        const dataObj = a.datahora ? new Date(a.datahora) : new Date(a.ano, a.mes - 1, a.dia, a.hora);

        return {
          id: a.id,
          quadra: a.quadra?.nome || "Não informado",
          quadraId: a.quadra?.id || null,
          dataObj,
          dataFormatada: dataObj.toLocaleDateString("pt-BR"),
          hora: dataObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          duracao: a.duracao,
          tipo: a.tipo,
          escola: a.escola || null,
          descricao: a.descricao || null,
          status: a.status.toLowerCase(),
          codigoVerificacao: a.codigoVerificacao,
          motivoRecusa: a.motivoRecusa,
          datahora: a.datahora,
        };
      })
      .sort((a, b) => {
        const ordemA = ORDEM_STATUS_LISTA[a.status] ?? Number.MAX_SAFE_INTEGER;
        const ordemB = ORDEM_STATUS_LISTA[b.status] ?? Number.MAX_SAFE_INTEGER;
        if (ordemA !== ordemB) return ordemA - ordemB;
        return b.dataObj - a.dataObj;
      });

    sincronizarAbaAtiva();
  } catch (err) {
    console.error("Erro ao carregar agendamentos:", err);
    Swal.fire({
      icon: "error",
      title: "Erro",
      text: "Não foi possível carregar seus agendamentos.",
      confirmButtonColor: "#1E3A8A",
    });
  } finally {
    isLoading.value = false;
  }
};

const carregarAvisoDestaque = async () => {
  try {
    const usuarioId = getUsuarioId();
    const { data } = await api.get("/avisos");
    const avisos = Array.isArray(data) ? data : [];

    const todosAvisos = avisos.filter((aviso) => {
      if (!aviso?.leituras) return true;
      return !aviso.leituras.some((leitura) => String(leitura.usuarioId) === String(usuarioId));
    });

    if (todosAvisos.length === 0) {
      avisoDestaque.value = null;
      return;
    }

    todosAvisos.sort((a, b) => {
      if (a.fixado === b.fixado) return new Date(b.data) - new Date(a.data);
      return a.fixado ? -1 : 1;
    });

    avisoDestaque.value = todosAvisos[0];
  } catch (error) {
    console.error("Erro ao carregar aviso destaque:", error);
  }
};

const marcarLido = async () => {
  const usuarioId = getUsuarioId();

  if (!avisoDestaque.value || !usuarioId) return;

  try {
    await api.post(`/avisos/${avisoDestaque.value.id}/ler`, {
      usuarioId,
    });

    avisoDestaque.value = null;
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
    console.warn("Não foi possível marcar o aviso como lido", error);
  }
};

const deveMostrarBotoes = (ag) => {
  const agora = new Date();
  if (ag.status === "pendente") return true;
  if (ag.status === "confirmado" && ag.dataObj >= agora) return true;
  return false;
};

const cancelarAgendamento = async (id) => {
  const confirmacao = await Swal.fire({
    title: "Cancelar agendamento?",
    text: "Essa ação não poderá ser desfeita.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#1E3A8A",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sim, cancelar",
    cancelButtonText: "Não",
    customClass: {
      confirmButton: "swal-botao",
      cancelButton: "swal-botao",
    },
  });

  if (confirmacao.isConfirmed) {
    try {
      await api.delete(`/agendamento/${id}`);
      allAgendamentos.value = allAgendamentos.value.filter((a) => a.id !== id);

      Swal.fire({
        icon: "success",
        title: "Cancelado!",
        text: "Agendamento cancelado com sucesso.",
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Erro ao cancelar agendamento:", err);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível cancelar o agendamento.",
        confirmButtonColor: "#1E3A8A",
      });
    }
  }
};

const gerarPdfAgendamento = async (agendamento) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margemX = 14;
  const status = String(agendamento?.status || "").toLowerCase();
  const statusMeta = {
    pendente: { label: "PENDENTE", bg: [254, 243, 199], text: [146, 64, 14], border: [245, 158, 11] },
    confirmado: { label: "CONFIRMADO", bg: [220, 252, 231], text: [21, 128, 61], border: [74, 222, 128] },
    recusado: { label: "RECUSADO", bg: [254, 226, 226], text: [185, 28, 28], border: [248, 113, 113] },
    cancelado: { label: "CANCELADO", bg: [226, 232, 240], text: [51, 65, 85], border: [148, 163, 184] },
  }[status] || { label: "STATUS", bg: [226, 232, 240], text: [51, 65, 85], border: [148, 163, 184] };

  const cores = {
    header: [15, 23, 42],
    headerAccent: [56, 189, 248],
    primary: [29, 78, 216],
    text: [15, 23, 42],
    muted: [100, 116, 139],
    border: [203, 213, 225],
    panel: [248, 250, 252],
    white: [255, 255, 255],
    codeBg: [239, 246, 255],
    codeBorder: [191, 219, 254],
  };

  const codigoFinal = String(agendamento?.codigoVerificacao || `ID-${agendamento?.id || "N-A"}`);
  const nomeQuadra = String(agendamento?.quadra || "Não informado");
  const tipoReserva = String(agendamento?.tipo || "Não informado");
  const dataReserva = String(agendamento?.dataFormatada || "--/--/----");
  const horaReserva = String(agendamento?.hora || "--:--");
  const duracaoReserva = formatarDuracaoPdf(agendamento?.duracao);
  const dataGeracao = new Date();
  const dataGeracaoLabel = `${dataGeracao.toLocaleDateString("pt-BR")} as ${dataGeracao.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const logo = await carregarLogoPdf();

  const desenharCampo = ({ x, y, w, h = 14, label, valor }) => {
    doc.setFillColor(...cores.white);
    doc.setDrawColor(...cores.border);
    doc.roundedRect(x, y, w, h, 2.2, 2.2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...cores.muted);
    doc.text(label.toUpperCase(), x + 3, y + 4.1);

    const linhas = doc.splitTextToSize(String(valor || "Não informado"), w - 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...cores.text);
    doc.text(linhas.slice(0, 2), x + 3, y + 9.3);
  };

  doc.setFillColor(...cores.header);
  doc.rect(0, 0, pageWidth, 19, "F");
  doc.setFillColor(...cores.headerAccent);
  doc.rect(0, 0, pageWidth, 2, "F");

  if (logo) {
    doc.addImage(logo, "PNG", margemX, 5.1, 8.5, 8.5);
  }

  const tituloX = logo ? margemX + 11 : margemX;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...cores.white);
  doc.text("Quadra Play", tituloX, 9.6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(191, 219, 254);
  doc.text("Comprovante de agendamento", tituloX, 13.9);
  doc.text(`Gerado em ${dataGeracaoLabel}`, pageWidth - margemX, 9.3, { align: "right" });
  doc.text(`Código ${codigoFinal}`, pageWidth - margemX, 14, { align: "right" });

  const painelX = margemX;
  const painelY = 25;
  const painelW = pageWidth - margemX * 2;
  const painelH = 104;

  doc.setFillColor(...cores.panel);
  doc.setDrawColor(...cores.border);
  doc.roundedRect(painelX, painelY, painelW, painelH, 3.2, 3.2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...cores.primary);
  doc.text("Dados da reserva", painelX + 6, painelY + 9.2);

  const badgeW = 34;
  const badgeH = 7.8;
  const badgeX = painelX + painelW - badgeW - 6;
  const badgeY = painelY + 3.6;
  doc.setFillColor(...statusMeta.bg);
  doc.setDrawColor(...statusMeta.border);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 4, 4, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...statusMeta.text);
  doc.text(statusMeta.label, badgeX + badgeW / 2, badgeY + 5.2, { align: "center" });

  const conteudoX = painelX + 6;
  const conteudoW = painelW - 12;
  const gap = 4;
  const colW = (conteudoW - gap) / 2;

  desenharCampo({
    x: conteudoX,
    y: painelY + 13,
    w: conteudoW,
    h: 16,
    label: "Quadra",
    valor: nomeQuadra,
  });

  desenharCampo({
    x: conteudoX,
    y: painelY + 32,
    w: colW,
    label: "Data",
    valor: dataReserva,
  });

  desenharCampo({
    x: conteudoX + colW + gap,
    y: painelY + 32,
    w: colW,
    label: "Horário",
    valor: horaReserva,
  });

  desenharCampo({
    x: conteudoX,
    y: painelY + 49,
    w: colW,
    label: "Duração",
    valor: duracaoReserva,
  });

  desenharCampo({
    x: conteudoX + colW + gap,
    y: painelY + 49,
    w: colW,
    label: "Tipo",
    valor: tipoReserva,
  });

  doc.setFillColor(...cores.codeBg);
  doc.setDrawColor(...cores.codeBorder);
  doc.roundedRect(conteudoX, painelY + 66, conteudoW, 17.5, 2.2, 2.2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(...cores.primary);
  doc.text("CÓDIGO DE VERIFICAÇÃO", painelX + painelW / 2, painelY + 72.4, { align: "center" });
  doc.setFontSize(12);
  doc.text(codigoFinal, painelX + painelW / 2, painelY + 79.5, { align: "center" });

  doc.setDrawColor(...cores.border);
  doc.line(margemX, pageHeight - 16, pageWidth - margemX, pageHeight - 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...cores.muted);
  doc.text("Apresente este comprovante ao chegar na quadra.", margemX, pageHeight - 11);
  doc.text("Quadra Play", pageWidth - margemX, pageHeight - 11, { align: "right" });

  doc.save(
    `comprovante_agendamento_${normalizarNomeArquivo(nomeQuadra, "quadra")}_${normalizarNomeArquivo(
      codigoFinal,
      "codigo"
    )}.pdf`
  );

  Swal.fire({
    icon: "success",
    title: "Comprovante pronto!",
    text: "O arquivo foi salvo no seu dispositivo.",
    timer: 1500,
    showConfirmButton: false,
  });
};

const irParaAgendarQuadra = (quadraId) => {
  const query = quadraId ? { quadraId } : {};
  router.push({ path: "/agendarquadra", query });
};

onMounted(() => {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  carregarAgendamentos();
  carregarAvisoDestaque();
  window.addEventListener("avisos-atualizados", carregarAvisoDestaque);
});

onBeforeUnmount(() => {
  window.removeEventListener("avisos-atualizados", carregarAvisoDestaque);
});
</script>

<style scoped>
.conteudo-meus-agendamentos {
  padding: 100px 0 32px 0;
  margin-left: 0;
  padding-left: 0;
  transform: none;
  overflow-x: hidden;
}

.layout-agendamento-user {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: "Montserrat", sans-serif;
  background: #f4f6fb;
  overflow-x: hidden;
}

.page-shell {
  width: calc(100% - 120px);
  max-width: none;
  min-width: 0;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 18px;
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

.section-kicker {
  margin: 0 0 8px 0;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.header-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}

.titulo-agendamento {
  margin: 0;
  color: #2563eb;
  font-size: 42px;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.subtitulo-agendamento,
.section-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 15px;
  line-height: 1.5;
}

.btn-acao-topo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 16px;
  border: none;
  border-radius: 999px;
  background: #3b82f6;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.24);
  transition: 0.18s ease;
}

.btn-acao-topo:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-acao-icone {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.loader-card,
.tabs-card,
.section-agendamento {
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

.loader-agendamento {
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
  padding: 16px 18px;
  margin-bottom: 16px;
}

.tabs-head {
  margin-bottom: 12px;
}

.abas-config-container-agendamento {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.aba-config-agendamento {
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #f8fafc;
  color: #475569;
  font-size: 15px;
  font-weight: 800;
  padding: 11px 10px;
  cursor: pointer;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.15s ease, background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.aba-config-agendamento:hover {
  background: rgba(59, 130, 246, 0.08);
  transform: translateY(-1px);
}

.aba-config-agendamento.ativa {
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

.aba-config-agendamento.ativa .badge-total {
  color: #2563eb;
  background: #ffffff;
  border-color: rgba(255, 255, 255, 0.55);
}

.section-agendamento {
  padding: 18px;
  min-width: 0;
  overflow-x: hidden;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
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
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: #eff6ff;
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.agendamento-vazio {
  min-height: 132px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #64748b;
  font-size: 15px;
  background: #f8fafc;
  border: 1px dashed rgba(148, 163, 184, 0.45);
  border-radius: 20px;
  overflow-x: hidden;
}

.agendamento-vazio p {
  margin: 0;
}

.agendamentos-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
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

  .conteudo-meus-agendamentos {
    padding: 96px 0 24px 0;
  }

  .titulo-agendamento {
    font-size: 30px;
  }

  .btn-acao-topo {
    min-height: 40px;
    padding: 0 12px;
    font-size: 12px;
  }

  .tabs-card,
  .section-agendamento,
  .loader-card {
    border-radius: 24px;
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

  .agendamentos-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header-topline {
    align-items: center;
    gap: 10px;
  }

  .titulo-agendamento {
    font-size: 26px;
    line-height: 1.04;
  }

  .subtitulo-agendamento,
  .section-subtitle {
    font-size: 14px;
    line-height: 1.55;
  }

  .btn-acao-topo {
    width: auto;
    min-width: fit-content;
    height: 40px;
    padding: 0 12px;
    border-radius: 999px;
    gap: 6px;
  }

  .btn-acao-texto {
    display: inline;
    white-space: nowrap;
    font-size: 11px;
    letter-spacing: 0.01em;
  }

  .btn-acao-icone {
    width: 14px;
    height: 14px;
  }

  .tabs-card {
    padding: 16px 14px;
  }

  .abas-config-container-agendamento {
    gap: 8px;
  }

  .aba-config-agendamento {
    padding: 10px 6px;
    font-size: 12px;
    gap: 6px;
  }

  .badge-total {
    min-width: 22px;
    height: 20px;
    font-size: 10px;
  }

  .section-agendamento {
    padding: 18px 14px;
  }

  .panel-head {
    flex-direction: column;
    gap: 10px;
  }

  .panel-count {
    min-height: 34px;
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






