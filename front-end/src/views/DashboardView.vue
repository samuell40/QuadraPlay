<template>
  <div class="layout">
    <SideBar />

    <div class="conteudo">
      <NavBarUse class="dashboard-nav" />

      <section class="page-header">
        <div class="header-copy">
          <div class="header-topline">
            <h1 class="title">{{ tituloDashboard }}</h1>
          </div>
        </div>
      </section>

      <section class="section_totalAgendamentos">
        <article class="card_contagem card_contagem-usuarios">
          <p class="card_kicker">USUÁRIOS</p>
          <div class="card_metric_row">
            <p class="card_valor">{{ totalUsuarios }}</p>
            <span class="card_legenda">Cadastrados em {{ anoAtual }}</span>
          </div>
        </article>

        <article class="card_contagem card_contagem-agendamentos">
          <p class="card_kicker">AGENDAMENTOS</p>
          <div class="card_metric_row">
            <p class="card_valor">{{ totalAgendamentos }}</p>
            <span class="card_legenda">Total Anual</span>
          </div>
        </article>

        <article class="card_contagem card_contagem-pendentes">
          <p class="card_kicker">PENDENTES</p>
          <div class="card_metric_row">
            <p class="card_valor">{{ totalPendentes }}</p>
            <span class="card_legenda">Aguardando resposta</span>
          </div>
        </article>

        <article class="card_contagem card_contagem-confirmados">
          <p class="card_kicker">CONFIRMADOS</p>
          <div class="card_metric_row">
            <p class="card_valor">{{ totalConfirmados }}</p>
            <span class="card_legenda">Reservas aprovadas</span>
          </div>
        </article>

        <article class="card_contagem card_contagem-recusados">
          <p class="card_kicker">RECUSADOS</p>
          <div class="card_metric_row">
            <p class="card_valor">{{ totalCancelados }}</p>
            <span class="card_legenda">Não Aceitos</span>
          </div>
        </article>
      </section>

      <section v-if="podeGerenciarNotificacaoAgendamentos" class="section_push_pref">
        <div class="push-pref-card" :class="{ ativo: preferenciaNotificacaoAgendamentos }">
          <div class="push-pref-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3.75a4.5 4.5 0 0 0-4.5 4.5v1.136c0 .646-.214 1.274-.61 1.786l-1.238 1.603A1.75 1.75 0 0 0 7.037 15.5h9.926a1.75 1.75 0 0 0 1.385-2.725l-1.238-1.603a2.997 2.997 0 0 1-.61-1.786V8.25a4.5 4.5 0 0 0-4.5-4.5Z"
                stroke="currentColor"
                stroke-width="1.7"
              />
              <path
                d="M9.75 18a2.25 2.25 0 0 0 4.5 0"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              />
            </svg>
          </div>

          <div class="push-pref-copy">
            <p class="push-pref-kicker">ALERTAS</p>
            <h2 class="push-pref-title">Novos agendamentos</h2>
            <p class="push-pref-description">{{ descricaoNotificacaoAgendamentos }}</p>
          </div>

          <div class="push-pref-actions">
            <span class="push-pref-status" :class="{ ativo: preferenciaNotificacaoAgendamentos }">
              {{ statusNotificacaoAgendamentos }}
            </span>

            <button
              type="button"
              class="push-pref-button"
              :class="{ ativo: preferenciaNotificacaoAgendamentos }"
              :disabled="carregandoPreferenciaNotificacaoAgendamentos || salvandoPreferenciaNotificacaoAgendamentos"
              @click="alternarPreferenciaNotificacaoAgendamentos"
            >
              {{
                carregandoPreferenciaNotificacaoAgendamentos
                  ? 'Carregando...'
                  : salvandoPreferenciaNotificacaoAgendamentos
                    ? 'Salvando...'
                    : preferenciaNotificacaoAgendamentos
                      ? 'Desativar alertas'
                      : 'Ativar alertas'
              }}
            </button>
          </div>
        </div>
      </section>

      <section class="section_avisos">
        <div class="card_avisos_container">
          <div class="panel-head">
            <div class="panel-copy">
              <p class="section-kicker">AVISOS</p>
              <h2 class="section-title">Mural de avisos</h2>
              <p class="section-subtitle">Acompanhe recados recentes da administração e gerencie o que fica em destaque.
              </p>
            </div>

            <div class="header_actions">
              <button v-if="listaPendentes.length > 1" type="button" @click="exibirTodosAvisos = !exibirTodosAvisos"
                class="btn-padrao btn-secundario">
                {{ exibirTodosAvisos ? 'Ver menos' : 'Ver todos (' + listaPendentes.length + ')' }}
              </button>

              <button type="button" @click="abrirHistorico" class="btn-padrao btn-secundario">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon-mini" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Histórico
              </button>

              <button v-if="podePostar" type="button" @click="abrirModal" class="btn-padrao btn-primario">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="icon-mini bi bi-plus-circle-fill"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path
                    d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"
                  />
                </svg>
                Novo aviso
              </button>
            </div>
          </div>

          <div v-if="loadingAvisos" class="avisos-loading-wrap">
            <LoadingState
              size="compact"
              title="Carregando avisos"
              description="Buscando comunicados recentes para o mural."
            />
          </div>

          <div v-else-if="listaPendentes.length === 0" class="sem-avisos">
            <p class="sem-avisos-title">Nenhum aviso pendente.</p>
            <p class="sem-avisos-copy">Consulte o histórico para revisar as mensagens antigas quando precisar.</p>
          </div>

          <div class="lista_avisos" v-else>
            <article v-for="aviso in avisosExibidos" :key="aviso.id" class="card_aviso_item"
              :class="{ 'aviso-fixado': aviso.fixado }">
              <div class="aviso_topo">
                <div class="aviso_meta">
                  <span class="aviso_origem">{{ aviso.quadra?.nome || 'Equipe Quadra Play' }}</span>
                  <span class="aviso_data">{{ formatarData(aviso.data) }}</span>
                </div>
                <span class="aviso_status" :class="{ 'aviso_status-fixado': aviso.fixado }">
                  {{ aviso.fixado ? 'Fixado' : 'Recente' }}
                </span>
              </div>

              <div class="aviso_conteudo">
                <h3>{{ aviso.titulo }}</h3>
                <p>{{ aviso.descricao }}</p>
              </div>

              <div class="aviso_footer">
                <span class="aviso_autor">Autor: {{ aviso.autor?.nome }}</span>

                <div class="aviso_actions_wrapper">
                  <button v-if="podeMarcarComoLido(aviso)" class="btn-ler" @click="marcarComoLido(aviso)">
                    <svg class="icon-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
                      aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>Marcar como lido</span>
                  </button>

                  <div class="aviso_actions" v-if="podePostar">
                    <button class="btn-icon btn-fixar" :class="{ 'btn-ativo': aviso.fixado }"
                      @click="alternarFixado(aviso)" :title="aviso.fixado ? 'Desafixar aviso' : 'Fixar aviso'">
                      <img v-if="aviso.fixado" :src="require('@/assets/icons/pin-slash.svg')" class="icon-svg"
                        alt="Desafixar" />
                      <img v-else :src="require('@/assets/icons/pin.svg')" class="icon-svg" alt="Fixar" />
                    </button>

                    <button v-if="usuarioLogado.id === aviso.autorId || usuarioLogado.permissaoId === 1"
                      class="btn-icon btn-excluir" @click="deletarAviso(aviso.id)" title="Excluir aviso">
                      <svg xmlns="http://www.w3.org/2000/svg" class="icon-svg" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <div class="charts-toolbar">
        <div class="panel-copy">
          <p class="section-kicker">RELATÓRIOS</p>
          <h2 class="section-title">Gráficos operacionais</h2>
        </div>

        <button @click="gerarPDFGraficos" class="btn-pdf-side" :disabled="loading" title="Baixar PDF">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path>
            <path d="M14 2v6h6"></path>
            <text x="5" y="17" font-size="7" font-family="Arial, sans-serif" font-weight="bold" fill="currentColor"
              stroke="none">PDF</text>
          </svg>
          <span class="btn-pdf-label btn-pdf-label-desktop">Relatório PDF</span>
          <span class="btn-pdf-label btn-pdf-label-mobile">PDF</span>
        </button>
      </div>

      <section class="section_graficos_top">
        <article class="chart-panel">
          <div class="chart-panel-head">
            <p class="chart-kicker">Distribuição por modalidade</p>
          </div>

          <div v-if="loading" class="loader-container-centralizado">
            <LoadingState
              size="compact"
              title="Carregando modalidades"
              description="Organizando os agendamentos por modalidade para montar o gráfico."
            />
          </div>

          <div v-else-if="!temDadosGraficoModalidade" class="chart-empty-state">
            Nenhum dado de agendamentos confirmados para modalidade.
          </div>

          <div v-else class="chart-wrapper chart-wrapper-fixed">
            <div class="chart-container">
              <canvas id="agendamentosModalidadeChart"></canvas>
            </div>
          </div>
        </article>

        <article class="chart-panel">
          <div class="chart-panel-head">
            <p class="chart-kicker">Participação por Tipo</p>
          </div>

          <div v-if="loading" class="loader-container-centralizado">
            <LoadingState
              size="compact"
              title="Carregando tipos"
              description="Separando os agendamentos por categoria para gerar a participação."
            />
          </div>

          <div v-else-if="!temDadosGraficoTipo" class="chart-empty-state">
            Nenhum dado de agendamentos confirmados para tipo.
          </div>

          <div v-else class="chart-wrapper chart-wrapper-fixed">
            <div class="chart-area-pie">
              <canvas id="agendamentosTipoChart"></canvas>
            </div>
          </div>
        </article>
      </section>

      <section class="section_graficos_bottom">
        <article class="chart-panel chart-panel-full">
          <div class="chart-panel-head">
            <p class="chart-kicker">Agendamento por mês</p>
          </div>

          <div v-if="loading" class="loader-container-centralizado">
            <LoadingState
              size="compact"
              title="Carregando agendamentos"
              description="Montando a evolução mensal das reservas da sua operação."
            />
          </div>

          <div v-else-if="!temDadosGraficoMes" class="chart-empty-state">
            Nenhum dado de agendamentos confirmados para evolução mensal.
          </div>

          <div v-else class="chart-wrapper chart-wrapper-fixed">
            <div class="chart-container-full">
              <canvas id="agendamentosMesChart"></canvas>
            </div>
          </div>
        </article>
      </section>

      <Teleport to="body">
        <div v-if="exibirModalAviso" class="modal-overlay" @click.self="exibirModalAviso = false">
          <div class="modal-content modal-form">
            <div class="modal-header">
              <div class="modal-header-copy">
                <h3 class="modal-title">Cadastrar novo aviso</h3>
                <p class="modal-subtitle">Preencha os dados e publique o recado no mural principal.</p>
              </div>
              <button type="button" class="btn-close-x-modal" @click="exibirModalAviso = false"
                aria-label="Fechar modal">x</button>
            </div>

            <div class="modal-body-scroll">
              <div class="form-group" v-if="usuarioLogado.permissaoId === 1">
                <label class="label-input">Quadra de destino</label>
                <select v-model="novoAviso.quadraId" class="input-estilizado">
                  <option value="" disabled>Selecione uma quadra</option>
                  <option :value="null">Aviso geral</option>
                  <option v-for="q in listaQuadras" :key="q.id" :value="q.id">{{ q.nome }}</option>
                </select>
              </div>

              <div class="form-group">
                <label class="label-input">Título</label>
                <input v-model="novoAviso.titulo" placeholder="Digite o título do aviso" class="input-estilizado" />
              </div>

              <div class="form-group">
                <label class="label-input">Descrição</label>
                <textarea v-model="novoAviso.descricao" placeholder="O que você quer avisar?"
                  class="input-estilizado area-texto"></textarea>
              </div>

              <label class="form-group-checkbox" for="fixarNovo">
                <input type="checkbox" id="fixarNovo" v-model="novoAviso.fixado" />
                <span>Fixar este aviso no topo.</span>
              </label>
            </div>

            <div class="modal-actions modal-actions-single">
              <button @click="enviarAviso" class="btn-confirmar" :disabled="enviando">
                {{ enviando ? 'Postando...' : 'Postar aviso' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <Teleport to="body">
        <div v-if="exibirModalHistorico" class="modal-overlay" @click.self="exibirModalHistorico = false">
          <div class="modal-content modal-historico">
            <div class="modal-header">
              <div class="modal-header-copy">
                <h3 class="modal-title">Avisos lidos</h3>
                <p class="modal-subtitle">Filtre por ano e origem para revisar comunicados antigos.</p>
              </div>
              <button type="button" class="btn-close-x-modal" @click="exibirModalHistorico = false"
                aria-label="Fechar modal">x</button>
            </div>

            <div class="filter-row filtros-full">
              <div>
                <label class="filtro-label">Filtrar por ano</label>
                <select v-model="filtroAno" class="input-estilizado">
                  <option value="todos">Todos</option>
                  <option v-for="ano in anosDisponiveis" :key="ano" :value="ano">{{ ano }}</option>
                </select>
              </div>

              <div>
                <label class="filtro-label">Origem</label>
                <select v-model="filtroOrigem" class="input-estilizado">
                  <option value="todos">Todos</option>
                  <option value="geral">Geral</option>
                  <option value="quadra">Própria quadra</option>
                </select>
              </div>
            </div>

            <div class="lista_avisos lista_avisos_historico">
              <div v-if="loadingHistoricoAvisos" class="historico-loading-wrap">
                <LoadingState
                  size="compact"
                  title="Carregando avisos lidos"
                  description="Buscando o histórico para aplicar os filtros."
                />
              </div>

              <div v-else-if="listaLidosFiltrada.length === 0" class="sem-avisos sem-avisos-historico">
                <p class="sem-avisos-title">Nenhum aviso encontrado.</p>
                <p class="sem-avisos-copy">Não há avisos lidos para o filtro {{ filtroAno }}.</p>
              </div>

              <article v-else v-for="aviso in listaLidosFiltrada" :key="aviso.id"
                class="card_aviso_item card_aviso_item-historico">
                <div class="aviso_topo">
                  <div class="aviso_meta">
                    <span class="aviso_origem">{{ aviso.quadra?.nome || 'Aviso geral' }}</span>
                    <span class="aviso_data">{{ formatarData(aviso.data) }}</span>
                  </div>
                  <span class="aviso_status aviso_status-lido">Lido</span>
                </div>

                <div class="aviso_conteudo">
                  <h3>{{ aviso.titulo }}</h3>
                  <p>{{ aviso.descricao }}</p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>
<script>
import SideBar from '@/components/SideBar.vue'
import NavBarUse from '@/components/NavBarUser.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import { Chart, registerables } from 'chart.js'
import { nextTick } from 'vue'
import api from '@/axios'
import Swal from 'sweetalert2'
import jsPDF from "jspdf";
import logoImg from "@/assets/logo.png";
import { inicializarNotificacoesPush } from '@/utils/pushNotifications'

Chart.register(...registerables)

const pdfExportPlugin = {
  id: 'pdfExportPlugin',
  beforeDraw(chart) {
    const ctx = chart.ctx;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();

    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);

      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#1E3A8A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      meta.data.forEach((element, index) => {
        const data = dataset.data[index];
        if (data > 0) {
          let x, y;

          if (chart.config.type === 'pie' || chart.config.type === 'doughnut') {
            const model = element;
            const midAngle = model.startAngle + (model.endAngle - model.startAngle) / 2;
            const radius = (model.outerRadius + model.innerRadius) / 2;

            x = model.x + Math.cos(midAngle) * radius;
            y = model.y + Math.sin(midAngle) * radius;

            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4;
          }
          else {
            x = element.x;
            y = element.y - 15;
            ctx.fillStyle = '#1E3A8A';
            ctx.shadowColor = "transparent";
          }
          ctx.fillText(data, x, y);
        }
      });
    });
    ctx.restore();
  }
};

export default {
  name: 'DashboardView',
  components: { SideBar, NavBarUse, LoadingState },
  data() {
    return {
      agendamentos: [],
      totalAgendamentos: 0,
      totalPendentes: 0,
      totalConfirmados: 0,
      totalCancelados: 0,
      totalUsuarios: 0,
      totalTimes: 0,
      totalModalidades: 0,
      agendamentosMesChart: null,
      agendamentosModalidadeChart: null,
      agendamentosTipoChart: null,
      loading: true,

      exibirTodosAvisos: false,
      todosAvisos: [],
      listaQuadras: [],
      exibirModalAviso: false,
      exibirModalHistorico: false,
      loadingAvisos: true,
      loadingHistoricoAvisos: false,
      filtroAno: new Date().getFullYear(),
      filtroOrigem: 'todos',
      enviando: false,
      usuarioLogado: {},
      preferenciaNotificacaoAgendamentos: false,
      carregandoPreferenciaNotificacaoAgendamentos: false,
      salvandoPreferenciaNotificacaoAgendamentos: false,
      novoAviso: {
        titulo: '',
        descricao: '',
        fixado: false,
        quadraId: ""
      }
    }
  },
  computed: {
    anoAtual() {
      return new Date().getFullYear();
    },
    podePostar() {
      return this.usuarioLogado?.permissaoId === 1 || this.usuarioLogado?.permissaoId === 2;
    },
    podeGerenciarNotificacaoAgendamentos() {
      return this.usuarioLogado?.permissaoId === 1 || this.usuarioLogado?.permissaoId === 2
    },
    statusNotificacaoAgendamentos() {
      return this.preferenciaNotificacaoAgendamentos ? 'Alertas ativos' : 'Alertas pausados'
    },
    descricaoNotificacaoAgendamentos() {
      const escopo = this.usuarioLogado?.permissaoId === 1 ? 'de todas as quadras' : 'da sua quadra'

      if (this.preferenciaNotificacaoAgendamentos) {
        return `Você receberá a notificação quando entrarem novos pedidos pendentes ${escopo}.`
      }

      return `Ative para ser avisado quando um novo pedido de agendamento entrar na fila ${escopo}.`
    },
    listaPendentes() {
      return this.todosAvisos.filter(a => !this.verificarSeLi(a)).sort((a, b) => {
        if (a.fixado === b.fixado) return new Date(b.data) - new Date(a.data);
        return a.fixado ? -1 : 1;
      });
    },
    avisosExibidos() {
      if (this.exibirTodosAvisos) {
        return this.listaPendentes;
      }
      return this.listaPendentes.length > 0 ? [this.listaPendentes[0]] : [];
    },
    tituloDashboard() {
      const usuario = JSON.parse(localStorage.getItem("usuario"));

      if (usuario?.permissaoId === 1) {
        return 'Dashboard';
      }

      if (usuario?.permissaoId === 2 && usuario?.quadra?.nome) {
        return `Dashboard (${usuario.quadra.nome})`;
      }
      return 'Dashboard';
    },
    listaLidos() {
      return this.todosAvisos.filter(a => this.verificarSeLi(a));
    },
    listaLidosFiltrada() {
      return this.listaLidos.filter(aviso => {
        const anoAviso = new Date(aviso.data).getFullYear()

        const passaAno =
          this.filtroAno === 'todos' || anoAviso === Number(this.filtroAno)

        const passaOrigem =
          this.filtroOrigem === 'todos' ||
          (this.filtroOrigem === 'geral' && !aviso.quadra) ||
          (this.filtroOrigem === 'quadra' && aviso.quadra)

        return passaAno && passaOrigem
      })
    },
    anosDisponiveis() {
      const anos = this.listaLidos.map(a => new Date(a.data).getFullYear());
      const unicos = [...new Set(anos)];
      if (!unicos.includes(new Date().getFullYear())) {
        unicos.push(new Date().getFullYear());
      }
      return unicos.sort((a, b) => b - a);
    },
    agendamentosConfirmados() {
      return (Array.isArray(this.agendamentos) ? this.agendamentos : [])
        .filter(a => this.statusContaComoConfirmado(a?.status))
    },
    temDadosGraficoModalidade() {
      return this.agendamentosConfirmados.length > 0
    },
    temDadosGraficoTipo() {
      const tiposValidos = new Set(['AMISTOSO', 'TREINO', 'CAMPEONATO', 'EVENTO', 'AULA', 'OUTRO'])
      return this.agendamentosConfirmados.some((agendamento) =>
        tiposValidos.has(String(agendamento?.tipo || '').toUpperCase())
      )
    },
    temDadosGraficoMes() {
      return this.agendamentosConfirmados.some(a => {
        const mes = Number(a?.mes)
        return Number.isInteger(mes) && mes >= 1 && mes <= 12
      })
    }
  },
  async mounted() {
    this.usuarioLogado = JSON.parse(localStorage.getItem("usuario") || "{}");
    window.scrollTo(0, 0)
    this.loading = true

    if (this.usuarioLogado.quadraId) {
      this.novoAviso.quadraId = this.usuarioLogado.quadraId;
    }

    await Promise.all([
      this.carregarQuadrasParaSelect(),
      this.carregarUsuarios(),
      this.carregarTimes(),
      this.carregarModalidades(),
      this.carregarPreferenciaNotificacaoAgendamentos()
    ]);

    this.carregarAvisos();
    this.carregarAgendamentos();
  },
  methods: {
    normalizarStatusAgendamento(status) {
      return String(status || '').trim().toUpperCase()
    },
    statusContaComoConfirmado(status) {
      const statusNormalizado = this.normalizarStatusAgendamento(status)
      return statusNormalizado === 'CONFIRMADO' || statusNormalizado === 'ENCERRADO'
    },
    statusContaComoRecusado(status) {
      const statusNormalizado = this.normalizarStatusAgendamento(status)
      return statusNormalizado === 'RECUSADO' || statusNormalizado === 'CANCELADO'
    },
    async carregarPreferenciaNotificacaoAgendamentos() {
      if (!this.podeGerenciarNotificacaoAgendamentos) return

      this.carregandoPreferenciaNotificacaoAgendamentos = true

      try {
        const { data } = await api.get('/notificacoes/push/agendamentos/preferencia', { silent: true })
        this.preferenciaNotificacaoAgendamentos = Boolean(data?.enabled)
      } catch (error) {
        console.error('Erro ao carregar a preferencia de notificacao de agendamentos:', error)
        this.preferenciaNotificacaoAgendamentos = false
      } finally {
        this.carregandoPreferenciaNotificacaoAgendamentos = false
      }
    },
    async alternarPreferenciaNotificacaoAgendamentos() {
      if (
        !this.podeGerenciarNotificacaoAgendamentos ||
        this.carregandoPreferenciaNotificacaoAgendamentos ||
        this.salvandoPreferenciaNotificacaoAgendamentos
      ) {
        return
      }

      const habilitar = !this.preferenciaNotificacaoAgendamentos

      if (habilitar) {
        const pushAtivo = await inicializarNotificacoesPush()

        if (!pushAtivo) {
          Swal.fire({
            icon: 'info',
            title: 'Ative as notificações do navegador',
            text: 'Permita notificações para receber os alertas de novos agendamentos.',
          })
          return
        }
      }

      this.salvandoPreferenciaNotificacaoAgendamentos = true

      try {
        const { data } = await api.patch(
          '/notificacoes/push/agendamentos/preferencia',
          { enabled: habilitar },
          { silent: true },
        )

        this.preferenciaNotificacaoAgendamentos = Boolean(data?.enabled)

        Swal.fire(
          this.preferenciaNotificacaoAgendamentos ? 'Alertas ativados' : 'Alertas pausados',
          this.preferenciaNotificacaoAgendamentos
            ? 'Você receberá push quando novos pedidos de agendamento entrarem na fila.'
            : 'Os alertas de novos agendamentos foram desativados.',
          'success',
        )
      } catch (error) {
        console.error('Erro ao atualizar a preferencia de notificacao de agendamentos:', error)
        Swal.fire(
          'Erro',
          error?.response?.data?.error || 'Não foi possível atualizar a preferência de notificação.',
          'error',
        )
      } finally {
        this.salvandoPreferenciaNotificacaoAgendamentos = false
      }
    },
    async gerarPDFGraficos() {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margemX = 12;
      const limiteInferior = pageHeight - 15;
      const dataGeracao = new Date();
      const dataGeracaoLabel = `${dataGeracao.toLocaleDateString('pt-BR')} às ${dataGeracao.toLocaleTimeString('pt-BR')}`;
      const anoAnalise = dataGeracao.getFullYear();
      const nomeQuadra = this.usuarioLogado?.quadra?.nome || 'Todas as quadras';
      const escopoRelatorio = this.usuarioLogado?.permissaoId === 2 ? `Quadra: ${nomeQuadra}` : 'Visão geral da operação';
      const resumoPeriodo = `Ano analisado: ${anoAnalise}`;

      const cores = {
        header: [15, 23, 42],
        headerAccent: [56, 189, 248],
        primary: [29, 78, 216],
        primarySoft: [219, 234, 254],
        primarySoftAlt: [239, 246, 255],
        success: [22, 163, 74],
        successSoft: [240, 253, 244],
        warning: [234, 88, 12],
        warningSoft: [255, 247, 237],
        danger: [185, 28, 28],
        dangerSoft: [254, 242, 242],
        text: [15, 23, 42],
        muted: [100, 116, 139],
        border: [203, 213, 225],
        white: [255, 255, 255],
        panel: [248, 250, 252],
      };

      const normalizarNomeArquivo = (texto) => {
        return String(texto || 'dashboard')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .toLowerCase();
      };

      const carregarLogo = async () => {
        const img = new Image();

        return new Promise((resolve) => {
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = logoImg;
        });
      };

      const logo = await carregarLogo();
      let cursorY = 0;

      const desenharCabecalho = (continuacao = false) => {
        const altura = continuacao ? 15 : 22;

        doc.setFillColor(...cores.header);
        doc.rect(0, 0, pageWidth, altura, 'F');
        doc.setFillColor(...cores.headerAccent);
        doc.rect(0, 0, pageWidth, 2.5, 'F');

        if (logo) {
          doc.addImage(logo, 'PNG', margemX, continuacao ? 3.5 : 4.5, continuacao ? 8 : 10, continuacao ? 8 : 10);
        }

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...cores.white);
        doc.setFontSize(continuacao ? 11 : 15);
        doc.text('QuadraPlay', logo ? margemX + (continuacao ? 11 : 13) : margemX, continuacao ? 8.8 : 11.8);

        if (continuacao) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(191, 219, 254);
          doc.text('Relatório de gráficos operacionais', pageWidth - margemX, 8.8, { align: 'right' });
          cursorY = 20;
          return;
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(191, 219, 254);
        doc.text('Relatório de gráficos operacionais', logo ? margemX + 13 : margemX, 16);

        doc.setTextColor(...cores.white);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(this.tituloDashboard, margemX, 31);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.2);
        doc.setTextColor(...cores.muted);
        doc.text(`${escopoRelatorio}  •  ${resumoPeriodo}`, margemX, 36);
        doc.text(`Gerado em ${dataGeracaoLabel}`, margemX, 40.5);

        cursorY = 46;
      };

      const desenharRodape = (paginaAtual, totalPaginas) => {
        doc.setDrawColor(...cores.border);
        doc.line(margemX, pageHeight - 9, pageWidth - margemX, pageHeight - 9);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...cores.muted);
        doc.text('Relatório gerado a partir dos gráficos exibidos no dashboard.', margemX, pageHeight - 4.5);
        doc.text(`Página ${paginaAtual}/${totalPaginas}`, pageWidth - margemX, pageHeight - 4.5, { align: 'right' });
      };

      const desenharCardResumo = ({ x, y, w, titulo, valor, detalhe, fillColor, accentColor, valueColor }) => {
        doc.setFillColor(...fillColor);
        doc.setDrawColor(...cores.border);
        doc.roundedRect(x, y, w, 15, 4, 4, 'FD');

        doc.setFillColor(...accentColor);
        doc.roundedRect(x, y, 4, 15, 4, 4, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...cores.muted);
        doc.text(titulo.toUpperCase(), x + 7, y + 4.8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...valueColor);
        doc.text(String(valor), x + 7, y + 9.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.7);
        doc.setTextColor(...cores.muted);
        doc.text(detalhe, x + 7, y + 13);
      };

      const desenharBlocoContexto = (y) => {
        doc.setFillColor(...cores.primarySoftAlt);
        doc.setDrawColor(...cores.border);
        doc.roundedRect(margemX, y, pageWidth - margemX * 2, 11, 4, 4, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...cores.primary);
        doc.text('Leitura do relatório', margemX + 6, y + 4.6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(...cores.muted);
        doc.text(
          'Os gráficos consideram os agendamentos carregados no dashboard e ajudam a comparar volume, distribuição e evolução mensal.',
          margemX + 6,
          y + 8.4
        );
      };

      const garantirEspaco = (alturaNecessaria) => {
        if (cursorY + alturaNecessaria <= limiteInferior) return;
        doc.addPage();
        desenharCabecalho(true);
      };

      const capturarGraficoComNumeros = (chartId) => {
        const chartInstance = Chart.getChart(chartId);
        if (!chartInstance) return null;

        Chart.register(pdfExportPlugin);
        chartInstance.update('none');

        try {
          return chartInstance.canvas.toDataURL('image/png', 1.0);
        } finally {
          Chart.unregister(pdfExportPlugin);
          chartInstance.update('none');
        }
      };

      const adicionarSecaoGrafico = ({ chartId, titulo, descricao, isPie = false }) => {
        const imgData = capturarGraficoComNumeros(chartId);
        const larguraPainel = pageWidth - margemX * 2;

        if (!imgData) {
          garantirEspaco(28);
          doc.setFillColor(...cores.panel);
          doc.setDrawColor(...cores.border);
          doc.roundedRect(margemX, cursorY, larguraPainel, 22, 5, 5, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(...cores.primary);
          doc.text(titulo, margemX + 6, cursorY + 7);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...cores.muted);
          doc.text('Não foi possível capturar este gráfico no momento da exportação.', margemX + 6, cursorY + 13);

          cursorY += 27;
          return;
        }

        const imgProps = doc.getImageProperties(imgData);
        let pdfWidth = isPie ? 110 : 166;
        let pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        const alturaMaxima = isPie ? 82 : 90;

        if (pdfHeight > alturaMaxima) {
          pdfWidth = (pdfWidth * alturaMaxima) / pdfHeight;
          pdfHeight = alturaMaxima;
        }

        const alturaPainel = pdfHeight + 22;
        garantirEspaco(alturaPainel + 5);

        doc.setFillColor(...cores.white);
        doc.setDrawColor(...cores.border);
        doc.roundedRect(margemX, cursorY, larguraPainel, alturaPainel, 5, 5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...cores.primary);
        doc.text(titulo, margemX + 6, cursorY + 7);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(...cores.muted);
        doc.text(descricao, margemX + 6, cursorY + 12);

        const imagemX = margemX + (larguraPainel - pdfWidth) / 2;
        doc.addImage(imgData, 'PNG', imagemX, cursorY + 15, pdfWidth, pdfHeight);

        cursorY += alturaPainel + 5;
      };

      desenharCabecalho(false);

      const cardGap = 4;
      const cardWidth = (pageWidth - margemX * 2 - cardGap * 3) / 4;

      desenharCardResumo({
        x: margemX,
        y: cursorY,
        w: cardWidth,
        titulo: 'Total',
        valor: this.totalAgendamentos,
        detalhe: 'Agendamentos no período',
        fillColor: cores.primarySoftAlt,
        accentColor: cores.primary,
        valueColor: cores.text,
      });
      desenharCardResumo({
        x: margemX + cardWidth + cardGap,
        y: cursorY,
        w: cardWidth,
        titulo: 'Confirmados',
        valor: this.totalConfirmados,
        detalhe: 'Agendamentos aprovados',
        fillColor: cores.successSoft,
        accentColor: cores.success,
        valueColor: cores.success,
      });
      desenharCardResumo({
        x: margemX + (cardWidth + cardGap) * 2,
        y: cursorY,
        w: cardWidth,
        titulo: 'Pendentes',
        valor: this.totalPendentes,
        detalhe: 'Aguardando análise',
        fillColor: cores.warningSoft,
        accentColor: cores.warning,
        valueColor: cores.warning,
      });
      desenharCardResumo({
        x: margemX + (cardWidth + cardGap) * 3,
        y: cursorY,
        w: cardWidth,
        titulo: 'Recusados',
        valor: this.totalCancelados,
        detalhe: 'Agendamentos não aprovados',
        fillColor: cores.dangerSoft,
        accentColor: cores.danger,
        valueColor: cores.danger,
      });

      cursorY += 19;
      desenharBlocoContexto(cursorY);
      cursorY += 16;

      adicionarSecaoGrafico({
        chartId: 'agendamentosModalidadeChart',
        titulo: '1. Distribuição por modalidade',
        descricao: 'Mostra como os agendamentos confirmados se distribuem entre as modalidades registradas no dashboard.',
      });

      adicionarSecaoGrafico({
        chartId: 'agendamentosTipoChart',
        titulo: '2. Distribuição por tipo de agendamento',
        descricao: 'Resume a participação de amistosos, treinos, campeonatos, eventos e outros tipos no volume confirmado.',
        isPie: true,
      });

      adicionarSecaoGrafico({
        chartId: 'agendamentosMesChart',
        titulo: '3. Evolução mensal',
        descricao: 'Apresenta o comportamento dos agendamentos confirmados ao longo dos meses disponíveis no período.',
      });

      const totalPaginas = doc.getNumberOfPages();
      for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        doc.setPage(pagina);
        desenharRodape(pagina, totalPaginas);
      }

      doc.save(`relatorio_dashboard_${normalizarNomeArquivo(nomeQuadra)}_${dataGeracao.toISOString().slice(0, 10)}.pdf`);
    },

    verificarSeLi(aviso) {
      if (!this.usuarioLogado?.id || !aviso.leituras) return false;
      return aviso.leituras.some(leitura => String(leitura.usuarioId) === String(this.usuarioLogado.id));
    },

    ehCriadorDoAviso(aviso) {
      const usuarioLogadoId = Number(this.usuarioLogado?.id);
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

    abrirModal() {
      if (this.usuarioLogado.permissaoId === 2 && this.usuarioLogado.quadraId) {
        this.novoAviso.quadraId = this.usuarioLogado.quadraId;
      } else {
        this.novoAviso.quadraId = "";
      }
      this.exibirModalAviso = true;
    },

    async abrirHistorico() {
      this.exibirModalHistorico = true;
      this.loadingHistoricoAvisos = true;
      try {
        await this.carregarAvisos({ usarLoadingPrincipal: false });
      } finally {
        this.loadingHistoricoAvisos = false;
      }
    },

    async carregarQuadrasParaSelect() {
      if (this.listaQuadras.length > 0) return;
      try {
        const res = await api.get('/quadra');
        this.listaQuadras = res.data;
      } catch (error) {
        console.error("Erro ao carregar lista de quadras", error);
      }
    },

    async carregarUsuarios() {
      try {
        const res = await api.get('/usuarios/resumo');
        const usuarios = Array.isArray(res.data) ? res.data : [];
        this.totalUsuarios = usuarios.filter((usuario) => {
          const dataCadastro =
            usuario?.dataCadastro ||
            usuario?.createdAt ||
            usuario?.criadoEm ||
            null;

          if (!dataCadastro) return false;

          const data = new Date(dataCadastro);
          if (Number.isNaN(data.getTime())) return false;

          return data.getFullYear() === this.anoAtual;
        }).length;
      }
      catch (error) {
        console.error(error);
      }
    },

    async carregarTimes() {
      try {
        const res = await api.get('/times');
        this.totalTimes = Array.isArray(res.data) ? res.data.length : 0;
      }
      catch (error) {
        console.error(error);
      }
    },

    async carregarModalidades() {
      try {
        const res = await api.get('/listar/modalidade');
        this.totalModalidades = Array.isArray(res.data) ? res.data.length : 0;
      }
      catch (error) {
        console.error(error);
      }
    },

    async carregarAgendamentos() {
      try {
        this.loading = true
        let data = []
        if (this.usuarioLogado?.permissaoId === 1) {
          const res = await api.get('/agendamentos/todos')
          data = res.data
        } else if (this.usuarioLogado?.permissaoId === 2) {
          if (!this.usuarioLogado.quadraId) return
          const res = await api.get(`/agendamentos/quadra/${this.usuarioLogado.quadraId}`)
          data = res.data
        } else {
          return
        }
        const anoAtual = new Date().getFullYear()
        this.agendamentos = data.filter(a => {
          if (a.ano) return a.ano === anoAtual
          if (a.data) return new Date(a.data).getFullYear() === anoAtual
          return false
        })
        this.totalPendentes = this.agendamentos.filter(a => a.status === 'Pendente').length
        this.totalConfirmados = this.agendamentos.filter(a => this.statusContaComoConfirmado(a.status)).length
        this.totalCancelados = this.agendamentos.filter(
          a => this.statusContaComoRecusado(a.status)
        ).length
        this.totalAgendamentos = this.totalPendentes + this.totalConfirmados + this.totalCancelados

        this.loading = false
        await nextTick()
        this.atualizarGraficosAgendamentos()
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error)
      } finally {
        this.loading = false
      }
    },

    atualizarGraficosAgendamentos() {
      if (this.temDadosGraficoModalidade) {
        this.renderAgendamentosModalidadeChart()
      } else if (this.agendamentosModalidadeChart) {
        this.agendamentosModalidadeChart.destroy()
        this.agendamentosModalidadeChart = null
      }

      if (this.temDadosGraficoTipo) {
        this.renderAgendamentosTipoChart()
      } else if (this.agendamentosTipoChart) {
        this.agendamentosTipoChart.destroy()
        this.agendamentosTipoChart = null
      }

      if (this.temDadosGraficoMes) {
        this.renderAgendamentosMesChart()
      } else if (this.agendamentosMesChart) {
        this.agendamentosMesChart.destroy()
        this.agendamentosMesChart = null
      }
    },

    async carregarAvisos({ usarLoadingPrincipal = true } = {}) {
      if (usarLoadingPrincipal) this.loadingAvisos = true;
      try {
        const { data } = await api.get('/avisos');
        const avisos = Array.isArray(data) ? data : [];
        const permissaoId = Number(this.usuarioLogado?.permissaoId);
        const quadraIdUsuario = Number(this.usuarioLogado?.quadraId);

        const avisosFiltrados = permissaoId === 1
          ? avisos
          : avisos.filter((aviso) => {
            const quadraAvisoId = Number(aviso?.quadra?.id);
            if (!quadraAvisoId) return true;
            return quadraIdUsuario > 0 && quadraAvisoId === quadraIdUsuario;
          });

        this.todosAvisos = [...new Map(avisosFiltrados.map(item => [item.id, item])).values()];

      } catch (error) {
        console.error('Erro ao carregar avisos', error);
      } finally {
        if (usarLoadingPrincipal) this.loadingAvisos = false;
      }
    },

    async marcarComoLido(aviso) {
      try {
        await api.post(`/avisos/${aviso.id}/ler`, { usuarioId: this.usuarioLogado.id });

        if (!aviso.leituras) aviso.leituras = [];
        aviso.leituras.push({ usuarioId: this.usuarioLogado.id });

        const Toast = Swal.mixin({
          toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true
        });
        Toast.fire({ icon: 'success', title: 'Lido' });
      } catch (error) {
        console.error("Erro ao ler", error);
      }
    },

    async enviarAviso() {
      const ehAdmin = this.usuarioLogado.permissaoId === 1;
      const quadraObrigatoria = !ehAdmin;

      if (!this.novoAviso.titulo || !this.novoAviso.descricao || (quadraObrigatoria && !this.novoAviso.quadraId) || (ehAdmin && this.novoAviso.quadraId === "")) {
        Swal.fire({
          icon: 'warning',
          title: 'Campos Incompletos',
          text: 'Preencha título, descrição e escolha o destino.',
          confirmButtonColor: '#1E3A8A',
        });
        return;
      }

      try {
        this.enviando = true;
        await api.post('/avisos', {
          titulo: this.novoAviso.titulo,
          descricao: this.novoAviso.descricao,
          fixado: this.novoAviso.fixado,
          quadraId: this.novoAviso.quadraId,
          autorId: this.usuarioLogado.id
        });

        const quadraMantida = this.usuarioLogado.permissaoId === 2 ? this.usuarioLogado.quadraId : "";
        this.novoAviso = { titulo: '', descricao: '', fixado: false, quadraId: quadraMantida };

        this.exibirModalAviso = false;
        await this.carregarAvisos();

        Swal.fire({
          icon: 'success',
          title: 'Aviso Publicado',
          text: 'O aviso foi salvo com sucesso.',
          confirmButtonColor: '#1E3A8A',
        });
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Erro na Operação',
          text: 'Falha ao registrar o aviso.',
          confirmButtonColor: '#1E3A8A',
        });
      } finally {
        this.enviando = false;
      }
    },

    formatarData(data) { return new Date(data).toLocaleDateString('pt-BR'); },
    async deletarAviso(id) {
      const result = await Swal.fire({
        title: 'Excluir Aviso?',
        text: "Essa ação não pode ser desfeita.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#1E3A8A',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        try {
          await api.delete(`/avisos/${id}`);
          await this.carregarAvisos();
          Swal.fire('Excluído!', 'O aviso foi removido.', 'success');
        } catch (error) {
          Swal.fire('Erro', 'Não foi possível excluir o aviso.', 'error');
        }
      }
    },
    async alternarFixado(aviso) {
      try {
        const novoStatus = !aviso.fixado;
        const index = this.todosAvisos.findIndex(a => a.id === aviso.id);
        if (index !== -1) this.todosAvisos[index].fixado = novoStatus;
        await api.patch(`/avisos/${aviso.id}/fixar`, { fixado: novoStatus });
        await this.carregarAvisos();
      } catch (error) {
        console.error("Erro ao fixar aviso", error);
        Swal.fire('Erro', 'Falha ao alterar status fixado.', 'error');
      }
    },

    renderAgendamentosModalidadeChart() {
      const canvas = document.getElementById('agendamentosModalidadeChart')
      if (!canvas) return
      if (this.agendamentosModalidadeChart) this.agendamentosModalidadeChart.destroy()
      const ctx = canvas.getContext('2d')

      const agendamentosConfirmados = this.agendamentosConfirmados

      const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1)

      const nomesModalidades = agendamentosConfirmados.map(a => {
        let nome = 'Não definido'
        if (a.modalidade?.nome) nome = a.modalidade.nome
        else if (a.quadra?.modalidades?.length > 0) nome = a.quadra.modalidades[0].nome
        return capitalize(nome)
      })

      const modalidades = [...new Set(nomesModalidades)]

      const quantidade = modalidades.map(m => nomesModalidades.filter(n => n === m).length)

      this.agendamentosModalidadeChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: modalidades,
          datasets: [{
            label: 'Agendamentos Confirmados por Modalidade',
            data: quantidade,
            backgroundColor: '#3B82F6'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
          layout: {
            padding: { top: 20 }
          }
        }
      })
    },
    renderAgendamentosTipoChart() {
      const canvas = document.getElementById('agendamentosTipoChart')
      if (!canvas) return
      if (this.agendamentosTipoChart) this.agendamentosTipoChart.destroy()
      const ctx = canvas.getContext('2d')

      const agendamentosConfirmados = this.agendamentosConfirmados

      const tipos = [
        { value: 'AMISTOSO', label: 'Amistoso', color: '#152147' },
        { value: 'TREINO', label: 'Treino', color: '#1E3A8A' },
        { value: 'CAMPEONATO', label: 'Campeonato', color: '#2563EB' },
        { value: 'EVENTO', label: 'Evento', color: '#60A5FA' },
        { value: 'AULA', label: 'Aula', color: '#93C5FD' },
        { value: 'OUTRO', label: 'Outro', color: '#D9D9D9' }
      ]

      const quantidade = tipos.map(({ value }) =>
        agendamentosConfirmados.filter(a => String(a?.tipo || '').toUpperCase() === value).length
      )

      this.agendamentosTipoChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: tipos.map(({ label }) => label),
          datasets: [{ data: quantidade, backgroundColor: tipos.map(({ color }) => color) }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
      })
    },
    renderAgendamentosMesChart() {
      const canvas = document.getElementById('agendamentosMesChart')
      if (!canvas) return
      if (this.agendamentosMesChart) this.agendamentosMesChart.destroy()
      const ctx = canvas.getContext('2d')

      const agendamentosConfirmados = this.agendamentosConfirmados

      const mesesNomes = [
        'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ]

      const mesesAgendamentos = agendamentosConfirmados
        .map(a => Number(a?.mes))
        .filter(mes => Number.isInteger(mes) && mes >= 1 && mes <= 12)

      if (mesesAgendamentos.length === 0) {
        this.agendamentosMesChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: mesesNomes,
            datasets: [{ label: 'Agendamentos Confirmados por Mês', data: new Array(12).fill(0), backgroundColor: '#1E3A8A' }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            layout: { padding: { top: 20 } }
          }
        })
        return
      }

      const mesInicial = Math.min(...mesesAgendamentos) - 1
      const mesesFiltrados = mesesNomes.slice(mesInicial)

      const quantidade = mesesFiltrados.map((_, idx) =>
        agendamentosConfirmados.filter(a => Number(a?.mes) === (mesInicial + idx + 1)).length
      )

      this.agendamentosMesChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: mesesFiltrados,
          datasets: [{ label: 'Agendamentos Confirmados por Mês', data: quantidade, backgroundColor: '#1E3A8A' }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
          layout: { padding: { top: 20 } }
        }
      })
    }
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: #f4f7fb;
}

.conteudo {
  flex: 1;
  margin-left: 250px;
  padding: 20px 32px 32px;
  min-width: 0;
  overflow-x: hidden;
}

.dashboard-nav {
  margin-bottom: 18px;
}

.page-header {
  margin-bottom: 22px;
}

.header-copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header-topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.section-kicker,
.card_kicker,
.chart-kicker {
  margin: 0;
  font-size: 13px;
  line-height: 1;
  letter-spacing: 0.18em;
  font-weight: 800;
  color: #2563eb;
  text-transform: uppercase;
}

.title {
  margin: 0;
  font-size: 42px;
  line-height: 1.04;
  font-weight: 800;
  color: #2563eb;
}

.section-subtitle,
.modal-subtitle {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #64748b;
}

.section_push_pref {
  margin-bottom: 18px;
}

.push-pref-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 24px;
  border: 1px solid rgba(37, 99, 235, 0.16);
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(255, 255, 255, 0.95)),
    #ffffff;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.08);
}

.push-pref-card.ativo {
  border-color: rgba(37, 99, 235, 0.24);
  box-shadow: 0 18px 34px rgba(37, 99, 235, 0.12);
}

.push-pref-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  color: #ffffff;
  box-shadow: 0 14px 26px rgba(37, 99, 235, 0.22);
}

.push-pref-icon svg {
  width: 22px;
  height: 22px;
}

.push-pref-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.push-pref-kicker {
  margin: 0;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.14em;
  font-weight: 800;
  text-transform: uppercase;
  color: #2563eb;
}

.push-pref-title {
  margin: 0;
  font-size: 17px;
  line-height: 1.1;
  font-weight: 800;
  color: #0f172a;
}

.push-pref-description {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: #64748b;
}

.push-pref-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.push-pref-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.14);
  color: #475569;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.push-pref-status.ativo {
  background: rgba(5, 150, 105, 0.12);
  color: #059669;
}

.push-pref-button {
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 14px 24px rgba(15, 23, 42, 0.16);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.push-pref-button.ativo {
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  color: #0f172a;
  box-shadow: 0 12px 22px rgba(148, 163, 184, 0.18);
}

.push-pref-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.push-pref-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.section_totalAgendamentos {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.card_contagem {
  display: flex;
  flex-direction: column; 
  gap: 10px;
  padding: 16px 16px 14px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  box-shadow: 0 14px 24px rgba(15, 23, 42, 0.06);
}

.card_metric_row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card_valor {
  margin: 0;
  font-size: 28px;
  line-height: 1;
  font-weight: 800;
  color: #0f172a;
}

.card_legenda {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.card_contagem-usuarios .card_valor {
  color: #2563eb;
}

.card_contagem-agendamentos .card_valor {
  color: #0f172a;
}

.card_contagem-pendentes .card_valor {
  color: #d97706;
}

.card_contagem-confirmados .card_valor {
  color: #059669;
}

.card_contagem-recusados .card_valor {
  color: #dc2626;
}

.section_avisos {
  margin-bottom: 22px;
}

.card_avisos_container,
.chart-panel {
  position: relative;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 14px 24px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.panel-head,
.chart-panel-head,
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.panel-copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.section-title {
  margin: 0;
  font-size: 20px;
  line-height: 1.15;
  font-weight: 800;
  color: #0f172a;
}

.modal-title {
  margin: 0;
  font-size: 26px;
  line-height: 1.1;
  font-weight: 800;
  color: #2563eb;
}

.header_actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-padrao,
.btn-pdf-side,
.btn-confirmar {
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.btn-padrao:hover,
.btn-pdf-side:hover,
.btn-confirmar:hover {
  transform: translateY(-1px);
}

.btn-padrao {
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-secundario {
  background: #ffffff;
  color: #1d4ed8;
  border: 1px solid rgba(37, 99, 235, 0.22);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}

.btn-secundario:hover {
  background: rgba(37, 99, 235, 0.06);
}

.btn-primario,
.btn-confirmar,
.btn-pdf-side {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.22);
}

.icon-mini {
  width: 16px;
  height: 16px;
}

.lista_avisos {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card_aviso_item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 12px 10px;
  border-radius: 16px;
  border: 1px solid rgba(59, 130, 246, 0.12);
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.card_aviso_item-historico {
  background: #f8fafc;
  gap: 8px;
  padding: 12px 12px 10px;
  border-radius: 16px;
}

.card_aviso_item-historico .aviso_meta {
  gap: 6px;
}

.card_aviso_item-historico .aviso_origem {
  font-size: 10px;
}

.card_aviso_item-historico .aviso_data,
.card_aviso_item-historico .aviso_autor {
  font-size: 11px;
}

.card_aviso_item-historico .aviso_status {
  min-height: 28px;
  padding: 0 9px;
  font-size: 10px;
}

.card_aviso_item-historico .aviso_conteudo h3 {
  margin: 0 0 5px;
  font-size: 18px;
  line-height: 1.04;
}

.card_aviso_item-historico .aviso_conteudo p {
  font-size: 13px;
  line-height: 1.38;
}

.aviso-fixado {
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.08) 0%, #ffffff 100%);
  border-color: rgba(37, 99, 235, 0.22);
}

.aviso_topo,
.aviso_footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.aviso_meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.aviso_origem {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #2563eb;
}

.aviso_data,
.aviso_autor {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.aviso_status {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 9px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.aviso_status-fixado {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.aviso_status-lido {
  background: rgba(5, 150, 105, 0.12);
  color: #047857;
}

.aviso_conteudo h3 {
  margin: 0 0 5px;
  font-size: 18px;
  line-height: 1.04;
  color: #0f172a;
}

.aviso_conteudo p {
  margin: 0;
  font-size: 13px;
  line-height: 1.38;
  color: #475569;
}

.aviso_actions_wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-left: auto;
}

.aviso_actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-ler {
  height: 32px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.2);
  background: rgba(37, 99, 235, 0.06);
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.icon-check {
  width: 11px;
  height: 11px;
  flex-shrink: 0;
}

.btn-ler:hover {
  background: rgba(37, 99, 235, 0.12);
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #ffffff;
  color: #475569;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.btn-icon:hover {
  background: #f8fafc;
}

.icon-svg {
  width: 15px;
  height: 15px;
}

.btn-fixar.btn-ativo {
  background: rgba(37, 99, 235, 0.1);
  border-color: rgba(37, 99, 235, 0.28);
}

.btn-excluir:hover {
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.22);
}

.sem-avisos {
  margin-top: 20px;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  padding: 24px;
  border-radius: 24px;
  border: 1px dashed rgba(148, 163, 184, 0.35);
  background: #f8fafc;
}

.avisos-loading-wrap {
  margin-top: 20px;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border-radius: 24px;
  border: 1px dashed rgba(148, 163, 184, 0.35);
  background: #f8fafc;
}

.sem-avisos-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.sem-avisos-copy {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: #64748b;
  max-width: 520px;
}

.charts-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.btn-pdf-side {
  min-height: 46px;
  padding: 0 16px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-pdf-label {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}


.btn-pdf-label-desktop {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.15;
}

.btn-pdf-label-mobile {
  display: none;
  align-items: center;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.12;
}

.btn-pdf-label {
  display: inline-flex;
  align-items: center;
}

.section_graficos_top {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.section_graficos_top .chart-panel {
  min-height: 380px;
}

.section_graficos_bottom {
  position: relative;
}

.chart-panel-full {
  min-height: 380px;
}

.chart-wrapper {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  padding-bottom: 0;
}

.chart-wrapper-fixed {
  margin-top: 16px;
}

.chart-empty-state {
  margin-top: 16px;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
  border-radius: 18px;
  border: 1px dashed rgba(148, 163, 184, 0.35);
  background: #f8fafc;
  color: #64748b;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}

.chart-container,
.chart-area-pie,
.chart-container-full {
  position: relative;
  width: 100%;
  min-width: 0;
}

.chart-container {
  height: 300px;
}

.chart-area-pie {
  height: 340px;
}

.chart-container-full {
  height: 320px;
}

.chart-container canvas,
.chart-area-pie canvas,
.chart-container-full canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
  max-width: 100%;
}

.chart-container canvas,
.chart-area-pie canvas,
.chart-container-full canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
  max-width: 100%;
}

.loader-container-centralizado {
  margin-top: 16px;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 20px;
  text-align: center;
  border-radius: 18px;
  border: 1px dashed rgba(148, 163, 184, 0.35);
  background: #f8fafc;
}

.loader {
  border: 6px solid #e2e8f0;
  border-top: 6px solid #3b82f6;
  border-radius: 50%;
  width: 72px;
  height: 72px;
  animation: spin 1s linear infinite;
}

.loader-copy {
  color: #475569;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 100%;
  max-width: 900px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  overflow: hidden;
  font-family: "Montserrat", sans-serif;
}

.modal-content :is(h1, h2, h3, h4, h5, h6, p, label, span, input, select, textarea, button) {
  font-family: "Montserrat", sans-serif;
}

.modal-form {
  max-width: 760px;
}

.modal-historico {
  max-width: 980px;
}

.modal-body-scroll {
  overflow-y: auto;
  padding-right: 4px;
}

.modal-header-copy {
  flex: 1;
  min-width: 0;
}

.btn-close-x-modal {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.24);
  background: #ffffff;
  color: #2563eb;
  font-family: "Montserrat", sans-serif;
  font-size: 20px;
  font-weight: 500;
  line-height: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 38px;
  padding: 0;
}

.btn-close-x-modal:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.label-input,
.filtro-label {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.input-estilizado {
  width: 100%;
  min-height: 46px;
  padding: 0 10px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #f8fafc;
  font-size: 14px;
  color: #334155;
}

.area-texto {
  min-height: 128px;
  padding: 12px 14px;
  resize: vertical;
}

.input-estilizado:focus {
  outline: none;
  border-color: rgba(37, 99, 235, 0.45);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.form-group-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #475569;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-actions-single .btn-confirmar {
  width: 100%;
  min-height: 44px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
}

.filter-row.filtros-full {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.lista_avisos_historico {
  max-height: 420px;
  overflow-y: auto;
  gap: 10px;
  padding-right: 4px;
}

.sem-avisos-historico {
  margin-top: 0;
  min-height: 140px;
}

.historico-loading-wrap {
  min-height: 180px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.btn-pdf-label-mobile {
  display: none;
}

@media (max-width: 1200px) {
  .section_totalAgendamentos {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .section_graficos_top {
    grid-template-columns: 1fr;
  }

  .header-topline,
  .panel-head,
  .chart-panel-head,
  .modal-header {
    flex-direction: column;
    align-items: flex-start;
  }


  .charts-toolbar {
    flex-direction: row;
    align-items: center;
  }

  .header_actions {
    justify-content: flex-start;
  }

  .push-pref-card {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .push-pref-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .conteudo {
    margin-left: 0;
    padding: 12px 14px 18px;
  }

  .dashboard-nav {
    margin-bottom: 12px;
  }

  .title,
  .section-title,
  .modal-title {
    font-size: 22px;
    margin-bottom: 4px;
    line-height: 1.12;
  }

  .section-subtitle,
  .modal-subtitle,
  .aviso_conteudo p {
    font-size: 14px;
  }

  .section_totalAgendamentos {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .section_graficos_top,
  .filter-row.filtros-full {
    grid-template-columns: 1fr;
  }

  .section_graficos_top .chart-panel {
    min-height: 0;
  }

  .card_avisos_container,
  .chart-panel,
  .modal-content {
    padding: 18px;
    border-radius: 22px;
  }

  .push-pref-card {
    gap: 12px;
    padding: 12px;
    border-radius: 18px;
  }

  .push-pref-icon {
    width: 42px;
    height: 42px;
    border-radius: 14px;
  }

  .push-pref-title {
    font-size: 16px;
  }

  .push-pref-description {
    font-size: 12px;
  }

  .push-pref-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .push-pref-button,
  .push-pref-status {
    width: 100%;
  }

  .modal-content .modal-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: nowrap;
  }

  .card_contagem {
    padding: 10px 8px 9px;
    border-radius: 14px;
    gap: 5px;
  }

  .card_kicker {
    font-size: 9px;
    letter-spacing: 0.08em;
  }

  .card_valor {
    font-size: 20px;
  }

  .card_legenda {
    font-size: 9px;
    line-height: 1.2;
  }

  .aviso_topo,
  .aviso_footer {
    align-items: flex-start;
  }

  .aviso_actions_wrapper {
    margin-left: 0;
  }

  .card_aviso_item-historico {
    gap: 6px;
    padding: 10px 10px 8px;
    border-radius: 14px;
  }

  .card_aviso_item-historico .aviso_conteudo h3 {
    margin-bottom: 4px;
    font-size: 16px;
  }

  .card_aviso_item-historico .aviso_conteudo p {
    font-size: 12px;
    line-height: 1.34;
  }

  .card_aviso_item-historico .aviso_status {
    min-height: 26px;
    padding: 0 8px;
  }

  .chart-container,
  .chart-area-pie,
  .chart-container-full {
    min-width: 0;
  }

  .chart-container {
    height: 220px;
  }

  .chart-area-pie {
    height: 300px;
  }

  .chart-container-full {
    height: 270px;
  }

  .chart-empty-state {
    min-height: 180px;
    font-size: 14px;
    padding: 16px;
  }

  .chart-panel-full {
    height: auto;
    min-height: 0;
  }

  .loader-container-centralizado {
    min-height: 180px;
    padding: 16px;
  }

  .loader {
    width: 52px;
    height: 52px;
    border-width: 5px;
  }

  .modal-overlay {
    padding: 14px;
  }

  .charts-toolbar {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }

  .btn-pdf-side {
    min-height: 30px;
    padding: 0 8px;
    border-radius: 10px;
    gap: 6px;
    font-size: 14px;
    box-shadow: 0 6px 14px rgba(37, 99, 235, 0.18);
  }

  .btn-pdf-label-mobile {
    display: inline-flex;
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
  }

  .btn-pdf-side svg {
    width: 18px;
    height: 18px;
  }

  .btn-pdf-label-desktop {
    display: none;
  }

}
</style>
