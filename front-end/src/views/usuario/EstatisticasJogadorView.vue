<template>
  <div class="layout-estatisticas">
    <NavBar />

    <main class="conteudo-estatisticas">
      <div class="page-shell">
        <section class="page-heading">
          <h1 class="titulo-principal">Minhas estatisticas</h1>
          <p class="subtitulo">
            Acompanhe os numeros do jogador vinculado ao seu usuario em partidas finalizadas.
          </p>
        </section>

        <div v-if="loading" class="loader-card">
          <LoadingState
            title="Carregando estatÃ­sticas"
            description="Buscando partidas finalizadas e consolidando o desempenho do jogador."
          />
        </div>

        <template v-else>
          <section v-if="erroCarregamento" class="feedback-card feedback-card-error">
            <h2>NÃ£o foi possÃ­vel carregar as estatÃ­sticas</h2>
            <p>{{ erroCarregamento }}</p>
            <button type="button" class="btn-tentar" @click="carregarEstatisticas">
              Tentar novamente
            </button>
          </section>

          <section v-else-if="!possuiJogador" class="feedback-card">
            <h2>Nenhum jogador vinculado</h2>
            <p>
              Esta tela serÃ¡ exibida automaticamente quando seu usuÃ¡rio estiver vinculado a um jogador.
            </p>
          </section>

          <template v-else>
            <section class="jogador-card">
              <p class="section-kicker">DESEMPENHO</p>
              <div class="jogador-topo">
                <div class="jogador-identidade">
                  <div class="avatar-wrap">
                    <img
                      v-if="jogador?.foto"
                      :src="jogador.foto"
                      :alt="`Foto de ${jogador?.nome || 'jogador'}`"
                    />
                    <span v-else>{{ inicialJogador }}</span>
                  </div>

                  <div class="jogador-copy">
                    <div class="jogador-nome-linha">
                      <h2>{{ jogador?.nome || "Jogador" }}</h2>
                      <span class="jogador-numero-inline">{{ numeroJogadorExibicao }}</span>
                    </div>
                    <p class="jogador-funcao">{{ jogador?.funcao?.nome || "Sem funcao cadastrada" }}</p>
                  </div>
                </div>

                <button
                  type="button"
                  class="btn-compartilhar-estatisticas btn-compartilhar-estatisticas-card"
                  :disabled="compartilhandoImagem"
                  :aria-label="compartilhandoImagem ? 'Gerando imagem para compartilhar' : 'Compartilhar estatÃ­sticas do jogador'"
                  @click="compartilharEstatisticasJogador"
                >
                  <span class="btn-share-content">
                    <span v-if="compartilhandoImagem" class="btn-share-spinner" aria-hidden="true"></span>
                    <template v-else>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        class="bi bi-share-fill btn-share-icon"
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                      >
                        <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5" />
                      </svg>
                    </template>
                    <span>{{ compartilhandoImagem ? "Gerando..." : "Compartilhar" }}</span>
                  </span>
                </button>
              </div>

              <div class="jogador-meta">
                <span class="meta-pill">
                  {{ jogadorVinculadoTexto }}
                </span>
                <span class="meta-pill">
                  {{ filtroAnoTexto }}
                </span>
                <span class="meta-pill meta-pill-wrap">
                  {{ resumoLinhaJogador }}
                </span>
              </div>
            </section>

            <section class="resumo-grid">
              <article
                v-for="item in metricasResumo"
                :key="item.label"
                class="resumo-item"
              >
                <p class="resumo-label">
                  <span>{{ item.label }}</span>
                  <button
                    v-if="item.ajuda"
                    type="button"
                    class="resumo-info"
                    :aria-label="`Ver explicacao de ${item.label}`"
                    @click.stop="mostrarExplicacaoMetrica(item)"
                  >
                    !
                  </button>
                </p>
                <p class="resumo-valor">{{ item.valor }}</p>
              </article>
            </section>

            <section v-if="resumo.partidas === 0" class="feedback-card feedback-card-neutral">
              <h2>Nenhuma estatistica registrada em {{ anoAtual }}</h2>
              <p>Para os numeros aparecerem, confira os pontos abaixo:</p>
              <ul class="checklist-vazio">
                <li>O usuario precisa estar vinculado ao jogador correto.</li>
                <li>A partida precisa estar com status FINALIZADA.</li>
                <li>O jogador deve estar registrado na partida com o mesmo ID vinculado ao usuario.</li>
                <li>Somente partidas de {{ anoAtual }} entram no calculo.</li>
              </ul>
              <button type="button" class="btn-tentar" @click="carregarEstatisticas">
                Atualizar estatisticas
              </button>
            </section>

            <section v-if="exibirPainelCampanhas" class="painel">
              <div class="painel-head">
                <div>
                  <p class="section-kicker">CAMPANHAS</p>
                  <h2 class="section-title">Resumo por campeonato</h2>
                </div>
              </div>

              <div v-if="campanhas.length === 0" class="estado-vazio estado-vazio-detalhado">
                <p>Nenhuma partida finalizada em campeonato foi encontrada para este jogador.</p>
                <ul class="checklist-vazio checklist-vazio-inline">
                  <li>Confirme o vinculo do jogador no usuario.</li>
                  <li>Verifique se a partida foi finalizada.</li>
                  <li>Confira se a partida pertence ao ano de {{ anoAtual }}.</li>
                </ul>
                <button type="button" class="btn-atualizar-inline" @click="carregarEstatisticas">
                  Atualizar agora
                </button>
              </div>

              <div v-else class="campanhas-lista">
                <article
                  v-for="campanha in campanhas"
                  :key="`campanha-${campanha.campeonatoId || 'avulso'}-${campanha.campeonatoNome}`"
                  class="campanha-card"
                >
                  <div class="campanha-head">
                    <h3>{{ campanha.campeonatoNome }}</h3>
                    <span class="campanha-pill">
                      {{ formatarInteiro(campanha.aproveitamento) }}%
                    </span>
                  </div>

                  <p class="campanha-subtitulo">
                    {{ campanha.modalidadeNome || "Modalidade nao informada" }}
                    <span v-if="campanha.timeNome">| {{ campanha.timeNome }}</span>
                  </p>

                  <div class="campanha-grid">
                    <div class="campanha-metrica">
                      <span>Partidas</span>
                      <strong>{{ formatarInteiro(campanha.partidas) }}</strong>
                    </div>
                    <div class="campanha-metrica">
                      <span>Gols</span>
                      <strong>{{ formatarInteiro(campanha.gols) }}</strong>
                    </div>
                    <div class="campanha-metrica">
                      <span>Aproveitamento</span>
                      <strong>{{ formatarInteiro(campanha.aproveitamento) }}%</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="btn-campanha-detalhe"
                    @click="alternarDetalhesCampanha(obterChaveCampanha(campanha))"
                  >
                    {{ campanhaDetalhesVisivel(obterChaveCampanha(campanha)) ? "Ocultar detalhes" : "Ver detalhes" }}
                  </button>

                  <div
                    v-if="campanhaDetalhesVisivel(obterChaveCampanha(campanha))"
                    class="campanha-detalhes"
                  >
                    <span>
                      V/E/D:
                      {{ formatarInteiro(campanha.vitorias) }}/{{ formatarInteiro(campanha.empates) }}/{{ formatarInteiro(campanha.derrotas) }}
                    </span>
                    <span>
                      Cartoes:
                      {{ formatarInteiro(campanha.cartoesAmarelos) }}A / {{ formatarInteiro(campanha.cartoesVermelhos) }}V
                    </span>
                    <span v-if="campanha.statusCampeonato">
                      Status: {{ campanha.statusCampeonato }}
                    </span>
                  </div>
                </article>
              </div>
            </section>

            <section class="painel">
              <div class="painel-head">
                <div>
                  <p class="section-kicker">HISTORICO</p>
                  <h2 class="section-title">Ultimas partidas</h2>
                </div>
              </div>

              <div v-if="ultimasPartidas.length === 0" class="estado-vazio estado-vazio-detalhado">
                <p>Nenhuma partida finalizada encontrada para exibicao.</p>
                <ul class="checklist-vazio checklist-vazio-inline">
                  <li>Finalize ao menos uma partida no ano atual.</li>
                  <li>Verifique se o jogador correto foi lancado na sumula.</li>
                </ul>
                <button type="button" class="btn-atualizar-inline" @click="carregarEstatisticas">
                  Atualizar agora
                </button>
              </div>

              <div v-else class="partidas-lista">
                <article
                  v-for="partida in ultimasPartidas"
                  :key="`partida-${partida.partidaId}`"
                  class="partida-card"
                >
                  <div class="partida-topo">
                    <span class="partida-data">{{ formatarData(partida.data) }}</span>
                    <span class="partida-resultado" :class="resultadoClasse(partida.resultado)">
                      {{ partida.resultadoLabel }}
                    </span>
                  </div>

                  <p class="partida-times">{{ partida.meuTimeNome }} x {{ partida.adversarioNome }}</p>
                  <p class="partida-campeonato">{{ partida.campeonatoNome }}</p>

                  <div class="partida-metricas">
                    <span>Placar {{ partida.placar }}</span>
                    <span>Gols {{ formatarInteiro(partida.gols) }}</span>
                    <span>{{ formatarInteiro(partida.cartoesAmarelos) }}A / {{ formatarInteiro(partida.cartoesVermelhos) }}V</span>
                  </div>
                </article>
              </div>
            </section>
          </template>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import Swal from "sweetalert2";
import NavBar from "@/components/Usuario/NavBar.vue";
import LoadingState from "@/components/loading/LoadingState.vue";
import api from "@/axios";
import { useAuthStore } from "@/store";
import logoQuadraPlay from "@/assets/logo.png";

const authStore = useAuthStore();

const loading = ref(true);
const erroCarregamento = ref("");
const possuiJogador = ref(true);
const estatisticas = ref(null);
const compartilhandoImagem = ref(false);
const campanhasExpandidas = ref([]);
const anoAtual = new Date().getFullYear();

const resumoBase = {
  partidas: 0,
  gols: 0,
  cartoesAmarelos: 0,
  cartoesVermelhos: 0,
  vitorias: 0,
  empates: 0,
  derrotas: 0,
  aproveitamento: 0,
  mediaGols: 0,
};

const resumo = computed(() => estatisticas.value?.resumo || resumoBase);
const jogador = computed(() => estatisticas.value?.jogador || null);
const campanhas = computed(() => (Array.isArray(estatisticas.value?.campanhas) ? estatisticas.value.campanhas : []));
const ultimasPartidas = computed(() => (Array.isArray(estatisticas.value?.ultimasPartidas) ? estatisticas.value.ultimasPartidas : []));
const timesJogador = computed(() => (Array.isArray(jogador.value?.times) ? jogador.value.times : []));
const exibirPainelCampanhas = computed(() => campanhas.value.length !== 1);

const inicialJogador = computed(() =>
  String(jogador.value?.nome || "J")
    .trim()
    .charAt(0)
    .toUpperCase()
);

const numeroJogadorExibicao = computed(() => {
  const numero = Number(jogador.value?.numero);
  if (Number.isInteger(numero) && numero > 0) {
    return String(numero);
  }
  return "-";
});

const resumoLinhaJogador = computed(() => {
  const vinculos = timesJogador.value
    .map((item) => {
      const nomeTime = String(item?.timeNome || "").trim();
      const modalidade = String(item?.modalidadeNome || "").trim();
      if (!nomeTime && !modalidade) return "";
      if (!modalidade) return nomeTime;
      if (!nomeTime) return modalidade;
      return `${nomeTime} (${modalidade})`;
    })
    .filter(Boolean);

  if (!vinculos.length) {
    return "Times/modalidades considerados: nenhum vinculo ativo";
  }

  return `Times/modalidades considerados: ${vinculos.join(" | ")}`;
});

const jogadorVinculadoTexto = computed(() => {
  const idJogador = Number(jogador.value?.id);
  if (Number.isInteger(idJogador) && idJogador > 0) {
    return `Jogador vinculado: ID ${formatarInteiro(idJogador)}`;
  }
  return "Jogador vinculado: nao identificado";
});

const filtroAnoTexto = computed(() => `Filtro aplicado: partidas finalizadas de ${anoAtual}`);

function obterChaveCampanha(campanha = {}) {
  const campeonatoId = Number(campanha?.campeonatoId);
  if (Number.isInteger(campeonatoId) && campeonatoId > 0) {
    return `campeonato-${campeonatoId}`;
  }
  return `campanha-${String(campanha?.campeonatoNome || "avulso")}`;
}

function campanhaDetalhesVisivel(chave) {
  return campanhasExpandidas.value.includes(String(chave || ""));
}

function alternarDetalhesCampanha(chave) {
  const chaveNormalizada = String(chave || "");
  if (!chaveNormalizada) return;

  if (campanhasExpandidas.value.includes(chaveNormalizada)) {
    campanhasExpandidas.value = campanhasExpandidas.value.filter((item) => item !== chaveNormalizada);
    return;
  }

  campanhasExpandidas.value = [...campanhasExpandidas.value, chaveNormalizada];
}

const metricasResumo = computed(() => [
  { label: "Partidas", valor: formatarInteiro(resumo.value.partidas) },
  { label: "Vitorias", valor: formatarInteiro(resumo.value.vitorias) },
  { label: "Empates", valor: formatarInteiro(resumo.value.empates) },
  { label: "Derrotas", valor: formatarInteiro(resumo.value.derrotas) },
  { label: "Gols", valor: formatarInteiro(resumo.value.gols) },
  {
    label: "Cartoes (A/V)",
    valor: `${formatarInteiro(resumo.value.cartoesAmarelos)} / ${formatarInteiro(resumo.value.cartoesVermelhos)}`,
  },
  {
    label: "Media de gols",
    valor: formatarDecimal(resumo.value.mediaGols),
    ajuda: "Formula: gols marcados divididos pelo total de partidas finalizadas do ano atual.",
  },
  {
    label: "Aproveitamento",
    valor: `${formatarInteiro(resumo.value.aproveitamento)}%`,
    ajuda: "Formula: (vitorias * 3 + empates) / (partidas * 3) x 100.",
  },
]);

function mostrarExplicacaoMetrica(item = {}) {
  const titulo = String(item?.label || "Metrica").trim() || "Metrica";
  const explicacao = String(item?.ajuda || "").trim();
  if (!explicacao) return;

  Swal.fire({
    icon: "info",
    title: titulo,
    text: explicacao,
    confirmButtonText: "Entendi",
    confirmButtonColor: "#1d4ed8",
  });
}

function formatarInteiro(valor) {
  const numero = Number(valor) || 0;
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(numero);
}

function formatarDecimal(valor) {
  const numero = Number(valor) || 0;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero);
}

function formatarData(valor) {
  if (!valor) return "Data nÃ£o informada";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Data nÃ£o informada";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

function resultadoClasse(resultado) {
  if (resultado === "V") return "resultado-vitoria";
  if (resultado === "D") return "resultado-derrota";
  return "resultado-empate";
}

function sanitizarNomeArquivo(valor) {
  const texto = String(valor || "jogador")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return texto || "jogador";
}

function formatarDataHoraGeracao() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function quebrarTexto(ctx, texto, maxLargura) {
  const palavras = String(texto || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!palavras.length) return ["-"];

  const linhas = [];
  let linhaAtual = "";

  palavras.forEach((palavra) => {
    const tentativa = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
    if (ctx.measureText(tentativa).width <= maxLargura) {
      linhaAtual = tentativa;
      return;
    }
    if (linhaAtual) {
      linhas.push(linhaAtual);
      linhaAtual = palavra;
      return;
    }
    linhas.push(palavra);
    linhaAtual = "";
  });

  if (linhaAtual) linhas.push(linhaAtual);
  return linhas;
}

function desenharRetanguloArredondado(ctx, x, y, largura, altura, raio) {
  const r = Math.max(0, Math.min(raio, largura / 2, altura / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + largura - r, y);
  ctx.arcTo(x + largura, y, x + largura, y + r, r);
  ctx.lineTo(x + largura, y + altura - r);
  ctx.arcTo(x + largura, y + altura, x + largura - r, y + altura, r);
  ctx.lineTo(x + r, y + altura);
  ctx.arcTo(x, y + altura, x, y + altura - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function carregarImagemCanvas(url) {
  return new Promise((resolve) => {
    const src = String(url || "").trim();
    if (!src) {
      resolve(null);
      return;
    }

    const imagem = new Image();
    imagem.crossOrigin = "anonymous";
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => resolve(null);
    imagem.src = src;
  });
}

function baixarImagemBlob(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function desenharListaCanvas(ctx, opcoes = {}) {
  const {
    x = 0,
    y = 0,
    largura = 0,
    altura = 0,
    titulo = "",
    linhas = [],
    corMarcador = "#38bdf8",
  } = opcoes;

  desenharRetanguloArredondado(ctx, x, y, largura, altura, 20);
  ctx.fillStyle = "rgba(15, 23, 42, 0.25)";
  ctx.fill();
  ctx.strokeStyle = "rgba(125, 211, 252, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#bfdbfe";
  ctx.font = "700 28px Montserrat, Arial, sans-serif";
  ctx.fillText(titulo, x + 22, y + 38);

  const yLinhaCabecalho = y + 54;
  const gradienteTopo = ctx.createLinearGradient(x + 20, yLinhaCabecalho, x + largura - 20, yLinhaCabecalho);
  gradienteTopo.addColorStop(0, "rgba(56, 189, 248, 0.08)");
  gradienteTopo.addColorStop(0.5, "rgba(56, 189, 248, 0.8)");
  gradienteTopo.addColorStop(1, "rgba(56, 189, 248, 0.08)");
  ctx.fillStyle = gradienteTopo;
  ctx.fillRect(x + 20, yLinhaCabecalho, largura - 40, 2);

  const itens = Array.isArray(linhas) ? linhas : [];
  if (!itens.length) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 22px Montserrat, Arial, sans-serif";
    ctx.fillText("Sem informaÃ§Ãµes para exibir.", x + 22, y + 100);
    return;
  }

  let cursorY = y + 90;
  const limiteY = y + altura - 20;
  const maxLarguraTexto = largura - 62;

  for (let i = 0; i < itens.length; i += 1) {
    const linhasQuebradas = quebrarTexto(ctx, `${i + 1}. ${itens[i]}`, maxLarguraTexto).slice(0, 2);
    const alturaItem = (linhasQuebradas.length * 28) + 14;
    if ((cursorY + alturaItem) > limiteY) break;

    ctx.beginPath();
    ctx.arc(x + 26, cursorY - 8, 5, 0, Math.PI * 2);
    ctx.fillStyle = corMarcador;
    ctx.fill();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 22px Montserrat, Arial, sans-serif";
    linhasQuebradas.forEach((linha, indiceLinha) => {
      ctx.fillText(linha, x + 40, cursorY + (indiceLinha * 28));
    });

    cursorY += alturaItem;
  }
}

async function gerarImagemEstatisticasBlob() {
  const jogadorAtual = jogador.value;
  if (!jogadorAtual) {
    throw new Error("Jogador nÃ£o encontrado para gerar imagem.");
  }

  const resumoAtual = resumo.value || resumoBase;
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1000;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("NÃ£o foi possÃ­vel inicializar o canvas.");
  }

  const [logoMarca, fotoJogador] = await Promise.all([
    carregarImagemCanvas(logoQuadraPlay),
    carregarImagemCanvas(jogadorAtual?.foto),
  ]);

  const gradienteFundo = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradienteFundo.addColorStop(0, "#06163f");
  gradienteFundo.addColorStop(1, "#0f2f78");
  ctx.fillStyle = gradienteFundo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const brilhoTopo = ctx.createRadialGradient(260, 140, 30, 260, 140, 420);
  brilhoTopo.addColorStop(0, "rgba(56, 189, 248, 0.28)");
  brilhoTopo.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = brilhoTopo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const brilhoDireita = ctx.createRadialGradient(1320, 820, 20, 1320, 820, 460);
  brilhoDireita.addColorStop(0, "rgba(244, 114, 182, 0.22)");
  brilhoDireita.addColorStop(1, "rgba(244, 114, 182, 0)");
  ctx.fillStyle = brilhoDireita;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const painelX = 56;
  const painelY = 112;
  const painelLargura = 1488;
  const painelAltura = 830;
  desenharRetanguloArredondado(ctx, painelX, painelY, painelLargura, painelAltura, 42);
  ctx.fillStyle = "rgba(15, 29, 78, 0.82)";
  ctx.fill();
  ctx.strokeStyle = "rgba(125, 211, 252, 0.45)";
  ctx.lineWidth = 2;
  ctx.stroke();

  if (logoMarca) {
    ctx.drawImage(logoMarca, 74, 38, 72, 72);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 46px Montserrat, Arial, sans-serif";
  ctx.fillText("QuadraPlaySV", 164, 86);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "800 54px Montserrat, Arial, sans-serif";
  ctx.fillText("ESTATISTICAS DO JOGADOR", painelX + 40, painelY + 78);

  ctx.fillStyle = "#bfdbfe";
  ctx.font = "600 26px Montserrat, Arial, sans-serif";
  ctx.fillText(`Gerado em ${formatarDataHoraGeracao()}`, painelX + 40, painelY + 114);

  const cardJogadorX = painelX + 34;
  const cardJogadorY = painelY + 142;
  const cardJogadorLargura = 452;
  const cardJogadorAltura = 330;
  desenharRetanguloArredondado(ctx, cardJogadorX, cardJogadorY, cardJogadorLargura, cardJogadorAltura, 26);
  ctx.fillStyle = "rgba(15, 23, 42, 0.3)";
  ctx.fill();
  ctx.strokeStyle = "rgba(125, 211, 252, 0.26)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const avatarX = cardJogadorX + (cardJogadorLargura / 2);
  const avatarY = cardJogadorY + 104;
  const raioAvatar = 82;
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, raioAvatar, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (fotoJogador) {
    ctx.drawImage(fotoJogador, avatarX - raioAvatar, avatarY - raioAvatar, raioAvatar * 2, raioAvatar * 2);
  } else {
    const gradAvatar = ctx.createLinearGradient(avatarX - raioAvatar, avatarY - raioAvatar, avatarX + raioAvatar, avatarY + raioAvatar);
    gradAvatar.addColorStop(0, "#38bdf8");
    gradAvatar.addColorStop(1, "#1d4ed8");
    ctx.fillStyle = gradAvatar;
    ctx.fillRect(avatarX - raioAvatar, avatarY - raioAvatar, raioAvatar * 2, raioAvatar * 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 74px Montserrat, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(inicialJogador.value || "J", avatarX, avatarY + 2);
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(avatarX, avatarY, raioAvatar, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
  ctx.stroke();

  const numeroJogadorTexto = jogadorAtual?.numero != null ? formatarInteiro(jogadorAtual.numero) : "-";
  const nomeJogadorTexto = String(jogadorAtual?.nome || "Jogador").trim() || "Jogador";
  const numeroNomeJogador = `${numeroJogadorTexto} ${nomeJogadorTexto}`.trim();
  const funcaoJogadorTexto = String(jogadorAtual?.funcao?.nome || "Sem funÃ§Ã£o definida").trim() || "Sem funÃ§Ã£o definida";

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  let fonteNumeroNome = 44;
  const larguraMaxNumeroNome = cardJogadorLargura - 52;
  while (fonteNumeroNome > 26) {
    ctx.font = `700 ${fonteNumeroNome}px Montserrat, Arial, sans-serif`;
    if (ctx.measureText(numeroNomeJogador).width <= larguraMaxNumeroNome) break;
    fonteNumeroNome -= 2;
  }
  ctx.fillText(numeroNomeJogador, avatarX, cardJogadorY + 250);

  ctx.fillStyle = "#93c5fd";
  let fonteFuncao = 32;
  const larguraMaxFuncao = cardJogadorLargura - 56;
  while (fonteFuncao > 22) {
    ctx.font = `600 ${fonteFuncao}px Montserrat, Arial, sans-serif`;
    if (ctx.measureText(funcaoJogadorTexto).width <= larguraMaxFuncao) break;
    fonteFuncao -= 2;
  }
  ctx.fillText(funcaoJogadorTexto, avatarX, cardJogadorY + 294);

  const metricasCanvas = [
    { label: "Partidas", valor: formatarInteiro(resumoAtual.partidas) },
    { label: "Vitorias", valor: formatarInteiro(resumoAtual.vitorias) },
    { label: "Empates", valor: formatarInteiro(resumoAtual.empates) },
    { label: "Derrotas", valor: formatarInteiro(resumoAtual.derrotas) },
    { label: "Gols", valor: formatarInteiro(resumoAtual.gols) },
    { label: "Cartoes A", valor: formatarInteiro(resumoAtual.cartoesAmarelos) },
    { label: "Cartoes V", valor: formatarInteiro(resumoAtual.cartoesVermelhos) },
    { label: "Media gols", valor: formatarDecimal(resumoAtual.mediaGols) },
    { label: "Aproveitamento", valor: `${formatarInteiro(resumoAtual.aproveitamento)}%` },
  ];

  const gridX = cardJogadorX + cardJogadorLargura + 22;
  const gridY = cardJogadorY;
  const gridLargura = painelX + painelLargura - gridX - 34;
  const gridAltura = cardJogadorAltura;
  desenharRetanguloArredondado(ctx, gridX, gridY, gridLargura, gridAltura, 26);
  ctx.fillStyle = "rgba(15, 23, 42, 0.3)";
  ctx.fill();
  ctx.strokeStyle = "rgba(125, 211, 252, 0.26)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const colunas = 3;
  const gapX = 12;
  const gapY = 10;
  const areaInternaX = gridX + 18;
  const areaInternaY = gridY + 18;
  const areaInternaLargura = gridLargura - 36;
  const cardMetricaLargura = (areaInternaLargura - (gapX * (colunas - 1))) / colunas;
  const cardMetricaAltura = 84;

  metricasCanvas.forEach((item, indice) => {
    const coluna = indice % colunas;
    const linha = Math.floor(indice / colunas);
    const xCard = areaInternaX + (coluna * (cardMetricaLargura + gapX));
    const yCard = areaInternaY + (linha * (cardMetricaAltura + gapY));

    desenharRetanguloArredondado(ctx, xCard, yCard, cardMetricaLargura, cardMetricaAltura, 16);
    ctx.fillStyle = "rgba(15, 23, 42, 0.36)";
    ctx.fill();
    ctx.strokeStyle = "rgba(147, 197, 253, 0.34)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#93c5fd";
    ctx.font = "700 20px Montserrat, Arial, sans-serif";
    ctx.fillText(item.label, xCard + 14, yCard + 31);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "800 34px Montserrat, Arial, sans-serif";
    ctx.fillText(item.valor, xCard + 14, yCard + 70);
  });

  const secoesY = cardJogadorY + cardJogadorAltura + 24;
  const secoesAltura = painelY + painelAltura - secoesY - 30;
  const secoesLargura = (painelLargura - 34 - 34 - 18) / 2;
  const secaoCampanhasX = painelX + 34;
  const secaoPartidasX = secaoCampanhasX + secoesLargura + 18;

  const campanhasLinhas = campanhas.value.slice(0, 4).map((campanha) =>
    `${campanha.campeonatoNome || "Campeonato"} - ${formatarInteiro(campanha.partidas)}j | ${formatarInteiro(campanha.gols)}g | ${formatarInteiro(campanha.aproveitamento)}%`
  );
  const partidasLinhas = ultimasPartidas.value.slice(0, 4).map((partida) =>
    `${formatarData(partida.data)} - ${partida.meuTimeNome || "Time"} ${partida.placar || "x"} ${partida.adversarioNome || "Adversario"} (${partida.resultadoLabel || "-"})`
  );

  desenharListaCanvas(ctx, {
    x: secaoCampanhasX,
    y: secoesY,
    largura: secoesLargura,
    altura: secoesAltura,
    titulo: "CAMPEONATOS",
    linhas: campanhasLinhas,
    corMarcador: "#38bdf8",
  });

  desenharListaCanvas(ctx, {
    x: secaoPartidasX,
    y: secoesY,
    largura: secoesLargura,
    altura: secoesAltura,
    titulo: "ULTIMAS PARTIDAS",
    linhas: partidasLinhas,
    corMarcador: "#f59e0b",
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (arquivo) => {
        if (arquivo) resolve(arquivo);
        else reject(new Error("Falha ao gerar imagem das estatÃ­sticas."));
      },
      "image/jpeg",
      0.92
    );
  });
}

async function compartilharEstatisticasJogador() {
  if (compartilhandoImagem.value || loading.value || !possuiJogador.value || !jogador.value) return;

  compartilhandoImagem.value = true;
  try {
    const blob = await gerarImagemEstatisticasBlob();
    const nomeArquivo = `estatisticas-${sanitizarNomeArquivo(jogador.value?.nome)}.jpg`;
    baixarImagemBlob(blob, nomeArquivo);
  } catch (error) {
    console.error("Erro ao gerar imagem de estatÃ­sticas:", error);
    Swal.fire("Erro", "NÃ£o foi possÃ­vel gerar a imagem das estatÃ­sticas.", "error");
  } finally {
    compartilhandoImagem.value = false;
  }
}

function atualizarUsuarioLocalComJogador(jogadorAtual) {
  try {
    const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "null");
    if (!usuarioLocal || typeof usuarioLocal !== "object") return;

    const atualizado = {
      ...usuarioLocal,
      jogadorId: Number(jogadorAtual?.id) || null,
      jogador: jogadorAtual || null,
    };

    localStorage.setItem("usuario", JSON.stringify(atualizado));
    authStore.usuario = atualizado;
  } catch (error) {
    console.error("Erro ao atualizar usuÃ¡rio local com jogador:", error);
  }
}

function limparJogadorDoUsuarioLocal() {
  try {
    const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "null");
    if (!usuarioLocal || typeof usuarioLocal !== "object") return;

    const atualizado = {
      ...usuarioLocal,
      jogadorId: null,
      jogador: null,
    };

    localStorage.setItem("usuario", JSON.stringify(atualizado));
    authStore.usuario = atualizado;
  } catch (error) {
    console.error("Erro ao limpar jogador do usuÃ¡rio local:", error);
  }
}

async function carregarEstatisticas() {
  loading.value = true;
  erroCarregamento.value = "";

  try {
    const { data } = await api.get("/estatisticas/jogador", {
      requiresAuth: true,
      silent: true,
    });

    estatisticas.value = data || null;
    campanhasExpandidas.value = [];
    possuiJogador.value = Boolean(data?.jogador?.id);

    if (possuiJogador.value) {
      atualizarUsuarioLocalComJogador(data.jogador);
    } else {
      limparJogadorDoUsuarioLocal();
    }
  } catch (error) {
    const status = Number(error?.response?.status);
    if (status === 404) {
      possuiJogador.value = false;
      estatisticas.value = null;
      campanhasExpandidas.value = [];
      limparJogadorDoUsuarioLocal();
      return;
    }

    estatisticas.value = null;
    campanhasExpandidas.value = [];
    possuiJogador.value = false;
    erroCarregamento.value =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Ocorreu um erro ao carregar os dados do jogador.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  carregarEstatisticas();
});
</script>

<style scoped>
.layout-estatisticas {
  min-height: 100vh;
  background: linear-gradient(180deg, #eef2f7 0%, #e2e8f0 100%);
}

.conteudo-estatisticas {
  padding: 100px 0 32px 0;
}

.page-shell {
  width: calc(100% - 120px);
  margin: 0 auto;
  display: grid;
  gap: 18px;
}

.page-heading {
  display: grid;
  gap: 8px;
  padding: 2px 2px 0;
}

.titulo-principal {
  margin: 0;
  color: #1d4ed8;
  font-size: clamp(2rem, 2.8vw, 3.1rem);
  line-height: 1.06;
}

.subtitulo {
  margin: 0;
  color: #475569;
  font-size: 1.04rem;
  max-width: 900px;
}

.loader-card {
  background: #f8fafc;
  border: 1px solid #dbeafe;
  border-radius: 26px;
  padding: 18px;
}

.btn-compartilhar-estatisticas {
  min-height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.34);
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
  color: #ffffff;
  padding: 0 18px;
  font: inherit;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.btn-compartilhar-estatisticas:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.28);
}

.btn-compartilhar-estatisticas:disabled {
  opacity: 0.82;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-share-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-share-icon {
  font-size: 14px;
}

.btn-share-spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  animation: shareSpin 0.75s linear infinite;
}

.feedback-card {
  background: #f8fafc;
  border: 1px solid #dbeafe;
  border-radius: 26px;
  padding: 32px;
  color: #0f172a;
  display: grid;
  gap: 12px;
}

.feedback-card h2 {
  margin: 0;
  font-size: 1.75rem;
}

.feedback-card p {
  margin: 0;
  color: #475569;
  font-size: 1rem;
}

.feedback-card-error {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(254, 242, 242, 0.84);
}

.feedback-card-neutral {
  border-color: rgba(37, 99, 235, 0.24);
  background: rgba(239, 246, 255, 0.62);
}

.checklist-vazio {
  margin: 0;
  padding-left: 1.1rem;
  color: #334155;
  display: grid;
  gap: 6px;
  text-align: left;
}

.checklist-vazio-inline {
  margin-top: 2px;
  margin-bottom: 2px;
}

.btn-atualizar-inline {
  min-height: 38px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.36);
  background: #ffffff;
  color: #1d4ed8;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  padding: 0 14px;
  cursor: pointer;
  justify-self: center;
}

.btn-atualizar-inline:hover {
  background: #eff6ff;
}

.btn-tentar {
  width: fit-content;
  min-height: 44px;
  border: 1px solid rgba(37, 99, 235, 0.38);
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  font: inherit;
  font-weight: 700;
  padding: 0 18px;
  cursor: pointer;
}

.jogador-card {
  background: #f8fafc;
  border: 1px solid #dbeafe;
  border-radius: 26px;
  padding: 20px 22px;
  display: grid;
  gap: 16px;
}

.jogador-topo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.jogador-identidade {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.btn-compartilhar-estatisticas-card {
  flex: 0 0 auto;
  margin-left: auto;
}

.avatar-wrap {
  width: 74px;
  height: 74px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(37, 99, 235, 0.24);
  background: rgba(37, 99, 235, 0.14);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #1d4ed8;
  font-size: 1.38rem;
  font-weight: 800;
}

.avatar-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.jogador-copy {
  min-width: 0;
}

.jogador-nome-linha {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.jogador-copy h2 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(1.45rem, 2vw, 2rem);
  line-height: 1.1;
}

.jogador-numero-inline {
  min-width: 44px;
  min-height: 30px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.3);
  background: rgba(239, 246, 255, 0.92);
  color: #1d4ed8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.94rem;
  font-weight: 800;
  line-height: 1;
  padding: 0 10px;
  flex: 0 0 auto;
}

.jogador-funcao {
  margin: 6px 0 0;
  color: #475569;
}

.jogador-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-pill {
  min-height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(147, 197, 253, 0.7);
  background: rgba(239, 246, 255, 0.92);
  color: #1e3a8a;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
}

.meta-pill-wrap {
  white-space: normal;
  line-height: 1.2;
}

.times-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.time-pill {
  min-height: 30px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.22);
  background: #eff6ff;
  color: #1e3a8a;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  font-size: 0.88rem;
  font-weight: 600;
}

.time-pill small {
  font-size: 0.78rem;
  color: #475569;
}

.resumo-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.resumo-item {
  background: #f8fafc;
  border: 1px solid #dbeafe;
  border-radius: 18px;
  padding: 12px 14px;
  display: grid;
  gap: 8px;
}

.resumo-label {
  margin: 0;
  color: #475569;
  font-size: 0.84rem;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.resumo-info {
  width: 20px;
  height: 20px;
  padding: 0;
  min-width: 18px;
  min-height: 18px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.35);
  background: #eff6ff;
  color: #1d4ed8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
}

.resumo-info:hover {
  background: #dbeafe;
}

.resumo-info:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.35);
  outline-offset: 2px;
}

.resumo-valor {
  margin: 0;
  color: #0f172a;
  font-size: 1.28rem;
  font-weight: 800;
  line-height: 1;
}

.painel {
  background: #f8fafc;
  border: 1px solid #dbeafe;
  border-radius: 26px;
  padding: 18px;
  display: grid;
  gap: 14px;
}

.painel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.section-kicker {
  margin: 0;
  color: #2563eb;
  font-size: 0.83rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.section-title {
  margin: 6px 0 0;
  color: #0f172a;
  font-size: 1.72rem;
}

.estado-vazio {
  border: 1px dashed rgba(148, 163, 184, 0.5);
  border-radius: 16px;
  padding: 18px;
  color: #475569;
  text-align: center;
}

.estado-vazio-detalhado {
  display: grid;
  gap: 10px;
}

.estado-vazio-detalhado p {
  margin: 0;
}

.campanhas-lista {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.campanha-card {
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  padding: 14px;
  display: grid;
  gap: 10px;
}

.campanha-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.campanha-head h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.02rem;
}

.campanha-pill {
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.14);
  color: #1d4ed8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 800;
}

.campanha-subtitulo {
  margin: 0;
  color: #475569;
  font-size: 0.9rem;
}

.campanha-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.campanha-metrica {
  border: 1px solid rgba(191, 219, 254, 0.8);
  border-radius: 12px;
  background: #f8fbff;
  padding: 8px 10px;
  display: grid;
  gap: 4px;
}

.campanha-metrica span {
  color: #475569;
  font-size: 0.78rem;
}

.campanha-metrica strong {
  color: #0f172a;
  font-size: 1rem;
  line-height: 1;
}

.btn-campanha-detalhe {
  width: fit-content;
  min-height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.32);
  background: #ffffff;
  color: #1d4ed8;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0 12px;
  cursor: pointer;
}

.btn-campanha-detalhe:hover {
  background: #eff6ff;
}

.campanha-detalhes {
  border: 1px dashed rgba(147, 197, 253, 0.8);
  border-radius: 12px;
  background: rgba(239, 246, 255, 0.72);
  padding: 8px 10px;
  color: #1e293b;
  font-size: 0.8rem;
  display: grid;
  gap: 4px;
}

.partidas-lista {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.partida-card {
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: #ffffff;
  padding: 12px;
  display: grid;
  gap: 8px;
}

.partida-topo {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.partida-data {
  color: #475569;
  font-size: 0.88rem;
}

.partida-resultado {
  min-height: 28px;
  border-radius: 999px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 800;
}

.resultado-vitoria {
  background: rgba(34, 197, 94, 0.16);
  color: #15803d;
}

.resultado-derrota {
  background: rgba(239, 68, 68, 0.16);
  color: #b91c1c;
}

.resultado-empate {
  background: rgba(59, 130, 246, 0.16);
  color: #1d4ed8;
}

.partida-times {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 700;
}

.partida-campeonato {
  margin: 0;
  color: #475569;
  font-size: 0.86rem;
}

.partida-metricas {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #334155;
  font-size: 0.82rem;
}

@keyframes shareSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .conteudo-estatisticas {
    padding: 96px 0 24px 0;
  }

  .page-shell {
    width: calc(100% - 28px);
  }

  .page-heading {
    gap: 6px;
  }

  .titulo-principal {
    font-size: clamp(1.8rem, 7vw, 2.4rem);
    line-height: 1.05;
  }

  .jogador-card,
  .painel,
  .feedback-card {
    border-radius: 20px;
  }

  .resumo-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .jogador-topo {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .btn-compartilhar-estatisticas-card {
    align-self: flex-end;
  }

  .jogador-identidade {
    flex-wrap: wrap;
  }

  .meta-pill {
    white-space: normal;
  }
}

@media (max-width: 620px) {
  .titulo-principal {
    font-size: clamp(1.55rem, 8vw, 2rem);
    line-height: 1.04;
  }

  .campanhas-lista {
    grid-template-columns: 1fr;
  }

  .btn-compartilhar-estatisticas {
    width: 100%;
    min-height: 42px;
    justify-content: center;
  }

  .btn-compartilhar-estatisticas-card {
    align-self: stretch;
  }

  .btn-atualizar-inline {
    width: 100%;
  }

  .campanha-grid {
    grid-template-columns: 1fr;
  }
}
</style>



