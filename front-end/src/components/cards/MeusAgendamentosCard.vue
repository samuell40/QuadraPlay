<template>
  <article class="card">
    <div class="card-top">
      <div class="title-wrap">
        <p class="card-kicker">QUADRA</p>
        <h3>{{ agendamento.quadra?.nome || agendamento.quadra || "Quadra" }}</h3>
      </div>

      <span class="status" :class="statusKey">
        {{ statusLabel }}
      </span>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Data</span>
        <strong>{{ formatarData(agendamento) }}</strong>
      </div>

      <div class="meta-item">
        <span class="meta-label">Horario</span>
        <strong>{{ formatarHora(agendamento) }}</strong>
      </div>

      <div class="meta-item">
        <span class="meta-label">Duracao</span>
        <strong>{{ agendamento.duracao }} hora(s)</strong>
      </div>

      <div class="meta-item">
        <span class="meta-label">Tipo</span>
        <strong>{{ agendamento.tipo || "Nao informado" }}</strong>
      </div>

      <div v-if="escolaAula" class="meta-item">
        <span class="meta-label">Escola</span>
        <strong>{{ escolaAula }}</strong>
      </div>

      <div v-if="descricaoOutro" class="meta-item meta-item-wide">
        <span class="meta-label">Descricao</span>
        <strong>{{ descricaoOutro }}</strong>
      </div>
    </div>

    <div
      v-if="agendamento.status?.toLowerCase() === 'confirmado'"
      class="info-box code-box"
    >
      <span class="info-label">Codigo de verificacao </span>
      <strong class="codigo-texto">{{ agendamento.codigoVerificacao || "N/A" }}</strong>
    </div>

    <div
      v-if="(agendamento.status?.toLowerCase() === 'recusado' || agendamento.status?.toLowerCase() === 'cancelado') && agendamento.motivoRecusa"
      class="info-box reason-box"
    >
      <span class="info-label">Motivo </span>
      <strong>{{ agendamento.motivoRecusa }}</strong>
    </div>

    <div class="actions-wrapper" :class="{ compact: !mostrarBotoes }">
      <button
        v-if="agendamento.status?.toLowerCase() === 'confirmado'"
        class="btn btn-secondary btn-pdf"
        @click="$emit('gerarPdf', agendamento)"
        title="Baixar comprovante"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
        </svg>
        Comprovante
      </button>

      <template v-if="mostrarBotoes">
        <button
          v-if="agendamento.status?.toLowerCase() !== 'confirmado'"
          class="btn btn-ghost"
          @click="$emit('cancelar', agendamento.id)"
        >
          Cancelar
        </button>

        <button class="btn btn-primary" @click="$emit('novo')">
          Novo agendamento
        </button>
      </template>
    </div>
  </article>
</template>

<script>
import { formatarEscolaAulaLabel } from "@/utils/agendamentoExibicao";

export default {
  name: "MeusAgendamentoCard",
  emits: ["gerarPdf", "cancelar", "novo"],
  props: {
    agendamento: {
      type: Object,
      required: true,
    },
    mostrarBotoes: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    statusKey() {
      const status = this.agendamento.status?.toLowerCase() || "";
      if (status === "cancelado") return "cancelado";
      return status;
    },
    statusLabel() {
      const labels = {
        pendente: "Pendente",
        confirmado: "Confirmado",
        encerrado: "Encerrado",
        recusado: "Recusado",
        cancelado: "Cancelado",
      };
      return labels[this.statusKey] || this.agendamento.status || "Status";
    },
    tipoUpper() {
      return String(this.agendamento?.tipo || "").trim().toUpperCase();
    },
    escolaAula() {
      if (this.tipoUpper !== "AULA") return "";
      return formatarEscolaAulaLabel(this.agendamento?.escola);
    },
    descricaoOutro() {
      if (this.tipoUpper !== "OUTRO") return "";
      return String(this.agendamento?.descricao || "").trim();
    },
  },
  methods: {
    formatarData(ag) {
      if (ag.datahora) {
        return new Date(ag.datahora).toLocaleDateString("pt-BR");
      }
      if (ag.data) return ag.data;

      if (ag.dia && ag.mes && ag.ano) {
        return `${String(ag.dia).padStart(2, "0")}/${String(ag.mes).padStart(2, "0")}/${ag.ano}`;
      }
      return "--/--/----";
    },

    formatarHora(ag) {
      if (ag.datahora) {
        return new Date(ag.datahora).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      if (ag.hora !== undefined) {
        return `${String(ag.hora).padStart(2, "0")}:00`;
      }

      return "--:--";
    },
  },
};
</script>

<style scoped>
.card {
  width: 100%;
  background: #ffffff;
  border-radius: 24px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
  font-family: "Montserrat", sans-serif;
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.title-wrap {
  min-width: 0;
}

.card-kicker {
  margin: 0 0 6px 0;
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

h3 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.03em;
}

.status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.status.pendente {
  color: #92400e;
  background: #fef3c7;
  border: 1px solid rgba(217, 119, 6, 0.18);
}

.status.confirmado {
  color: #166534;
  background: #dcfce7;
  border: 1px solid rgba(34, 197, 94, 0.18);
}

.status.recusado {
  color: #b91c1c;
  background: #fee2e2;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status.cancelado {
  color: #475569;
  background: #e2e8f0;
  border: 1px solid rgba(100, 116, 139, 0.18);
}

.status.encerrado {
  color: #1f2937;
  background: #e5e7eb;
  border: 1px solid rgba(107, 114, 128, 0.22);
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.meta-item-wide {
  grid-column: span 2;
}

.meta-label,
.info-label {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.meta-item strong,
.info-box strong {
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.4;
}

.info-box {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.code-box {
  background: #eff6ff;
  border-color: rgba(59, 130, 246, 0.18);
}

.reason-box {
  background: #fff7ed;
  border-color: rgba(249, 115, 22, 0.18);
}

.codigo-texto {
  color: #1d4ed8;
  letter-spacing: 0.08em;
}

.actions-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.actions-wrapper.compact {
  margin-top: 14px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  transition: 0.18s ease;
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2);
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #0f172a;
  color: #fff;
}

.btn-secondary:hover {
  background: #1e293b;
  transform: translateY(-1px);
}

.btn-ghost {
  background: #ffffff;
  color: #475569;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.btn-ghost:hover {
  background: #f8fafc;
  border-color: rgba(59, 130, 246, 0.28);
  color: #2563eb;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .card {
    border-radius: 20px;
    padding: 16px;
  }

  .card-top {
    flex-direction: column;
    gap: 10px;
    margin-bottom: 14px;
  }

  h3 {
    font-size: 22px;
  }

  .meta-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .meta-item-wide {
    grid-column: span 1;
  }

  .actions-wrapper {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
