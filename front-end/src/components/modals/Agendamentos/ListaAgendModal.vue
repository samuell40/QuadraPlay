<template>
  <div class="modal-overlay" @click.self="$emit('fechar')">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-copy">
          <p class="modal-kicker">CONSULTA RAPIDA</p>
          <h2 class="modal-title">{{ quadraNome }}</h2>
          <p class="modal-subtitle">{{ subtituloPeriodo }}</p>
        </div>

        <button
          type="button"
          class="btn-close-x-modal"
          aria-label="Fechar modal"
          @click="$emit('fechar')"
        >
          x
        </button>
      </div>

      <div v-if="isLoading" class="dias-wrapper dias-wrapper-loading">
        <div
          v-for="d in datas"
          :key="`skeleton-${getChaveData(d)}`"
          class="dia-container dia-container-skeleton"
        >
          <div class="skeleton-line skeleton-title"></div>

          <div class="horarios-linha">
            <div v-for="index in 8" :key="index" class="horario horario-skeleton">
              <div class="skeleton-line skeleton-time"></div>
              <div class="skeleton-line skeleton-copy"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="erroCarga" class="state-card">
        <p class="state-title">Nao foi possivel carregar os horarios.</p>
        <p class="state-copy">{{ erroCarga }}</p>

        <button type="button" class="btn-reload" @click="carregarTodosHorarios">
          Tentar novamente
        </button>
      </div>

      <div v-else class="dias-wrapper">
        <div
          v-for="d in datas"
          :key="getChaveData(d)"
          class="dia-container"
        >
          <div class="dia-head">
            <h3>{{ formatarData(d) }}</h3>

            <span
              class="dia-badge"
              :class="obterEstadoDia(d).fechado ? 'is-closed' : 'is-open'"
            >
              {{
                obterEstadoDia(d).fechado
                  ? 'Fechado'
                  : `${obterEstadoDia(d).slots.length} horarios`
              }}
            </span>
          </div>

          <div v-if="obterEstadoDia(d).slots.length" class="horarios-linha">
            <button
              v-for="slot in obterEstadoDia(d).slots"
              :key="`${getChaveData(d)}-${slot.horario}`"
              type="button"
              class="horario"
              :class="slot.agendamento ? 'agendado' : 'disponivel'"
              :title="obterTooltipHorario(slot)"
              @click="selecionarHorario(slot)"
            >
              <span class="horario-label">{{ slot.horario }}</span>

              <template v-if="slot.agendamento">
                <span class="nome-agendamento-sm">{{ slot.resumoPrincipal }}</span>
                <span class="slot-meta">{{ slot.resumoSecundario }}</span>
              </template>

              <span v-else class="slot-meta slot-meta-free">Livre</span>
            </button>
          </div>

          <div v-else class="dia-empty">
            {{
              obterEstadoDia(d).fechado
                ? 'Quadra fechada neste dia.'
                : 'Nenhum horario configurado para este dia.'
            }}
          </div>
        </div>
      </div>

      <button type="button" class="btn-cancelar" @click="$emit('fechar')">Fechar</button>
    </div>
  </div>
</template>

<script>
import api from '@/axios';
import Swal from 'sweetalert2';

export default {
  name: 'ListaAgendModal',
  emits: ['fechar', 'ver-detalhes'],
  props: {
    quadraId: { type: Number, required: true },
    quadraNome: { type: String, default: 'Quadra' },
    datas: { type: Array, required: true },
  },
  data() {
    return {
      horariosPorDia: {},
      gradeConfig: [],
      isLoading: false,
      erroCarga: '',
      loadSequence: 0,
    };
  },
  computed: {
    subtituloPeriodo() {
      if (!this.datas?.length) {
        return 'Consulte os horarios confirmados da quadra.';
      }

      const datasOrdenadas = [...this.datas].sort((a, b) => {
        const primeira = new Date(a.ano, a.mes - 1, a.dia, 12, 0, 0).getTime();
        const segunda = new Date(b.ano, b.mes - 1, b.dia, 12, 0, 0).getTime();
        return primeira - segunda;
      });

      const primeiraData = this.formatarData(datasOrdenadas[0]);
      const ultimaData = this.formatarData(datasOrdenadas[datasOrdenadas.length - 1]);

      if (datasOrdenadas.length === 1) {
        return `Consulta rapida para ${primeiraData}. Clique em um horario ocupado para abrir os detalhes.`;
      }

      return `Consulta rapida de ${primeiraData} ate ${ultimaData}. Clique em um horario ocupado para abrir os detalhes.`;
    },
  },
  watch: {
    datas: {
      immediate: true,
      deep: true,
      handler(newVal) {
        if (this.quadraId && newVal && newVal.length) {
          this.carregarTodosHorarios();
          return;
        }

        this.horariosPorDia = {};
      },
    },
    quadraId() {
      if (this.quadraId && this.datas?.length) {
        this.carregarTodosHorarios();
      }
    },
  },
  mounted() {
    document.body.style.overflow = 'hidden';
  },
  unmounted() {
    document.body.style.overflow = '';
  },
  methods: {
    getChaveData(data) {
      return `${data.ano}-${String(data.mes).padStart(2, '0')}-${String(data.dia).padStart(2, '0')}`;
    },
    getGradePadrao() {
      const lista = [];

      for (let hora = 7; hora <= 23; hora += 1) {
        lista.push(`${String(hora).padStart(2, '0')}:00`);
      }

      return lista;
    },
    horarioParaMinutos(horario) {
      if (!horario || typeof horario !== 'string') return null;

      const [hora, minuto] = horario.split(':').map(Number);

      if (!Number.isFinite(hora) || !Number.isFinite(minuto)) {
        return null;
      }

      return (hora * 60) + minuto;
    },
    minutosParaHorario(totalMinutos) {
      const minutosNoDia = 24 * 60;
      const minutosNormalizados = ((totalMinutos % minutosNoDia) + minutosNoDia) % minutosNoDia;
      const hora = Math.floor(minutosNormalizados / 60);
      const minuto = minutosNormalizados % 60;
      return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
    },
    obterDiaSemanaSeguro(data) {
      const dataSegura = new Date(data.ano, data.mes - 1, data.dia, 12, 0, 0);
      return dataSegura.getDay();
    },
    async carregarGradeConfig() {
      try {
        const { data } = await api.get(`/grade-horarios/${this.quadraId}`);
        this.gradeConfig = Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('Sem grade configurada para consulta rapida.', error);
        this.gradeConfig = [];
      }
    },
    obterSlotsDoDia(data) {
      const diaSemana = this.obterDiaSemanaSeguro(data);

      if (!this.gradeConfig.length) {
        return this.getGradePadrao();
      }

      return this.gradeConfig
        .filter((slot) => {
          const diaConfigurado =
            slot.diaSemana !== undefined ? Number(slot.diaSemana) : Number(slot.dia_semana);
          return diaConfigurado === diaSemana;
        })
        .map((slot) => slot.horario)
        .sort((primeiro, segundo) => this.horarioParaMinutos(primeiro) - this.horarioParaMinutos(segundo));
    },
    normalizarAgendamento(agendamento) {
      const usuarioNome = agendamento.usuario?.nome || agendamento.usuario || 'Usuario';
      const timeNome = agendamento.time?.nome || '';
      const resumoEvento = agendamento.resumoEvento || '';

      return {
        ...agendamento,
        usuarioNome,
        timeNome,
        resumoEvento,
      };
    },
    obterInicioAgendamentoMinutos(agendamento) {
      if (agendamento?.datahora) {
        const data = new Date(agendamento.datahora);

        if (!Number.isNaN(data.getTime())) {
          return (data.getHours() * 60) + data.getMinutes();
        }
      }

      if (Number.isFinite(Number(agendamento?.hora))) {
        return Number(agendamento.hora) * 60;
      }

      return null;
    },
    obterDuracaoMinutos(agendamento) {
      const duracaoEmHoras = Number(agendamento?.duracao || 1);
      return Number.isFinite(duracaoEmHoras) && duracaoEmHoras > 0 ? duracaoEmHoras * 60 : 60;
    },
    encontrarAgendamentoNoSlot(slotHorario, agendamentos) {
      const minutosSlot = this.horarioParaMinutos(slotHorario);

      return agendamentos.find((agendamentoAtual) => {
        const inicio = this.obterInicioAgendamentoMinutos(agendamentoAtual);

        if (inicio === null || minutosSlot === null) {
          return false;
        }

        const fim = inicio + this.obterDuracaoMinutos(agendamentoAtual);
        return minutosSlot >= inicio && minutosSlot < fim;
      }) || null;
    },
    obterResumoPrincipal(agendamento) {
      if (agendamento.resumoEvento) {
        return agendamento.resumoEvento;
      }

      if (agendamento.timeNome) {
        return agendamento.timeNome;
      }

      return agendamento.usuarioNome || 'Reserva confirmada';
    },
    obterResumoSecundario(agendamento) {
      if (agendamento.resumoEvento && agendamento.campeonato?.nome) {
        return agendamento.campeonato.nome;
      }

      if (agendamento.timeNome && agendamento.usuarioNome) {
        return agendamento.usuarioNome;
      }

      return 'Clique para ver detalhes';
    },
    formatarFaixaAgendamento(agendamento) {
      const inicio = this.obterInicioAgendamentoMinutos(agendamento);

      if (inicio === null) {
        return '';
      }

      const fim = inicio + this.obterDuracaoMinutos(agendamento);
      return `${this.minutosParaHorario(inicio)} - ${this.minutosParaHorario(fim)}`;
    },
    async montarEstadoDia(data) {
      const { ano, mes, dia } = data;
      const slotsDoDia = this.obterSlotsDoDia(data);

      if (!slotsDoDia.length) {
        return {
          chave: this.getChaveData(data),
          fechado: true,
          slots: [],
        };
      }

      const resposta = await api.get(
        `/agendamentos/quadra/${this.quadraId}/confirmados`,
        { params: { ano, mes, dia } },
      );

      const agendamentos = Array.isArray(resposta.data)
        ? resposta.data.map(this.normalizarAgendamento)
        : [];

      const slots = slotsDoDia.map((slotHorario) => {
        const agendamento = this.encontrarAgendamentoNoSlot(slotHorario, agendamentos);
        const resumoPrincipal = agendamento ? this.obterResumoPrincipal(agendamento) : '';
        const resumoSecundario = agendamento ? this.obterResumoSecundario(agendamento) : '';

        return {
          horario: slotHorario,
          agendamento,
          resumoPrincipal,
          resumoSecundario,
          faixaAgendamento: agendamento ? this.formatarFaixaAgendamento(agendamento) : '',
        };
      });

      return {
        chave: this.getChaveData(data),
        fechado: false,
        slots,
      };
    },
    async carregarTodosHorarios() {
      if (!this.quadraId || !this.datas?.length) {
        this.horariosPorDia = {};
        return;
      }

      const sequence = this.loadSequence + 1;
      this.loadSequence = sequence;
      this.isLoading = true;
      this.erroCarga = '';
      this.horariosPorDia = {};

      try {
        await this.carregarGradeConfig();

        const estadosPorDia = await Promise.all(
          this.datas.map((dataItem) => this.montarEstadoDia(dataItem)),
        );

        if (sequence !== this.loadSequence) {
          return;
        }

        this.horariosPorDia = estadosPorDia.reduce((acumulador, estadoDia) => {
          acumulador[estadoDia.chave] = {
            fechado: estadoDia.fechado,
            slots: estadoDia.slots,
          };
          return acumulador;
        }, {});
      } catch (error) {
        console.error('Erro ao carregar horarios da consulta rapida:', error);
        this.erroCarga = 'Verifique a grade da quadra e tente novamente em instantes.';

        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Nao foi possivel carregar os horarios da consulta rapida.',
          confirmButtonColor: '#1E3A8A',
        });
      } finally {
        if (sequence === this.loadSequence) {
          this.isLoading = false;
        }
      }
    },
    obterEstadoDia(data) {
      return this.horariosPorDia[this.getChaveData(data)] || { fechado: false, slots: [] };
    },
    obterTooltipHorario(slot) {
      if (!slot.agendamento) {
        return `Horario livre: ${slot.horario}`;
      }

      const linhas = [
        `Horario: ${slot.horario}`,
        `Reserva: ${slot.resumoPrincipal}`,
      ];

      if (slot.resumoSecundario && slot.resumoSecundario !== 'Clique para ver detalhes') {
        linhas.push(`Solicitante: ${slot.resumoSecundario}`);
      }

      if (slot.faixaAgendamento) {
        linhas.push(`Faixa: ${slot.faixaAgendamento}`);
      }

      linhas.push('Clique para ver detalhes');

      return linhas.join('\n');
    },
    selecionarHorario(slot) {
      if (!slot.agendamento) return;
      this.$emit('ver-detalhes', slot.agendamento);
    },
    formatarData(data) {
      return `${String(data.dia).padStart(2, '0')}/${String(data.mes).padStart(2, '0')}/${data.ano}`;
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 24px;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 100%;
  max-width: 920px;
  max-height: 88vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable both-edges;
  background: #ffffff;
  padding: 24px;
  border-radius: 28px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.28);
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.modal-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn-close-x-modal {
  width: 38px;
  height: 38px;
  border: 1px solid rgba(37, 99, 235, 0.24);
  border-radius: 999px;
  background: #ffffff;
  color: #2563eb;
  font-size: 18px;
  line-height: 1;
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

.modal-kicker {
  margin: 0;
  font-size: 12px;
  line-height: 1;
  letter-spacing: 0.16em;
  font-weight: 900;
  color: #2563eb;
}

.modal-title {
  margin: 0;
  font-size: 26px;
  line-height: 1.04;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.modal-subtitle {
  margin: 0;
  font-size: 12px;
  line-height: 1.35;
  color: #64748b;
}

.dias-wrapper {
  margin-top: 12px;
  border-radius: 14px;
  padding: 12px;
  background: #f8fbff;
  border: 1px solid rgba(59, 130, 246, 0.2);
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.05);
}

.dias-wrapper-loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dia-container {
  padding: 8px 0;
}

.dia-container + .dia-container {
  border-top: 1px solid rgba(148, 163, 184, 0.16);
}

.dia-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.dia-head h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 900;
  color: #0f172a;
}

.dia-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dia-badge.is-open {
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}

.dia-badge.is-closed {
  background: rgba(148, 163, 184, 0.18);
  color: #475569;
}

.horarios-linha {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.horario {
  appearance: none;
  border: 1px solid rgba(15, 23, 42, 0.08);
  flex: 0 0 100px;
  min-height: 52px;
  padding: 7px 9px;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  border-radius: 11px;
  font-weight: 800;
  background: #ffffff;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.horario-label {
  font-size: 12px;
  line-height: 1.1;
  font-weight: 900;
}

.horario.disponivel {
  background: #f1f5f9;
  color: #334155;
  cursor: default;
}

.horario.disponivel:hover {
  border-color: rgba(59, 130, 246, 0.25);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.06);
}

.horario.agendado {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow: 0 12px 22px rgba(37, 99, 235, 0.18);
  cursor: pointer;
}

.horario.agendado:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.26);
}

.horario.agendado:active {
  transform: translateY(0);
}

.nome-agendamento-sm {
  display: block;
  width: 100%;
  margin-top: 4px;
  font-size: 10px;
  line-height: 1.2;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slot-meta {
  display: block;
  width: 100%;
  margin-top: 2px;
  font-size: 8px;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.96;
}

.slot-meta-free {
  margin-top: 4px;
  font-weight: 700;
  color: #64748b;
}

.dia-empty,
.state-copy {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: #64748b;
}

.state-card {
  margin-top: 18px;
  min-height: 220px;
  border-radius: 18px;
  border: 1px dashed rgba(148, 163, 184, 0.35);
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  padding: 24px;
}

.state-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
}

.btn-reload,
.btn-cancelar {
  width: 100%;
  margin-top: 12px;
  padding: 9px 16px;
  border: 1px solid rgba(37, 99, 235, 0.25);
  border-radius: 999px;
  cursor: pointer;
  font-weight: 900;
  font-size: 13px;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 14px 26px rgba(37, 99, 235, 0.18);
  transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.btn-reload {
  max-width: 240px;
}

.btn-reload:hover,
.btn-cancelar:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(37, 99, 235, 0.24);
  filter: brightness(0.98);
}

.btn-reload:active,
.btn-cancelar:active {
  transform: translateY(0);
}

.horario-skeleton {
  background: #ffffff;
  border-color: rgba(226, 232, 240, 0.95);
  pointer-events: none;
}

.skeleton-line {
  border-radius: 999px;
  background: linear-gradient(90deg, #e2e8f0 0%, #f8fafc 50%, #e2e8f0 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.2s linear infinite;
}

.skeleton-title {
  width: 180px;
  height: 12px;
  margin-bottom: 10px;
}

.skeleton-time {
  width: 52px;
  height: 11px;
}

.skeleton-copy {
  width: 76px;
  height: 9px;
  margin-top: 6px;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 14px;
  }

  .modal-content {
    padding: 18px;
    border-radius: 22px;
    scrollbar-gutter: auto;
  }

  .modal-title {
    font-size: 24px;
  }

  .dias-wrapper {
    padding: 14px;
    border-radius: 14px;
  }

  .dia-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .horario {
    flex: 1 1 calc(50% - 5px);
    min-width: 0;
    min-height: 68px;
    padding: 10px;
  }

  .btn-reload {
    max-width: none;
  }
}
</style>
