<template>
  <article class="card" :class="statusClass">
    <div v-if="loading" class="overlay-loader">
      <div class="loader"></div>
    </div>

    <div class="card-top">
      <div class="title-block">
        <p class="card-kicker">AGENDAMENTO</p>
        <h3 class="card-title">{{ quadraNome }}</h3>
      </div>

      <div class="status-wrap">
        <span class="status-pill" :class="statusClass">{{ statusTexto }}</span>
        <span v-if="ehEncaixe && limiteSemanalAtingido" class="limit-pill">LIMITE ATINGIDO</span>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Solicitante</span>
        <strong class="meta-value">{{ solicitanteNome }}</strong>
      </div>

      <div v-if="exibirCampoTime" class="meta-item">
        <span class="meta-label">Time</span>
        <strong class="meta-value">{{ timeNome }}</strong>
      </div>

      <div class="meta-item">
        <span class="meta-label">Data</span>
        <strong class="meta-value">{{ dataFormatada }}</strong>
      </div>

      <div class="meta-item">
        <span class="meta-label">Horário</span>
        <strong class="meta-value">{{ horaFormatada }}</strong>
      </div>

      <div class="meta-item">
        <span class="meta-label">Duração</span>
        <strong class="meta-value">{{ duracaoLabel }}</strong>
      </div>

      <div class="meta-item">
        <span class="meta-label">Tipo</span>
        <strong class="meta-value">{{ tipoLabelExibicao }}</strong>
      </div>

      <div v-if="escolaAula" class="meta-item">
        <span class="meta-label">Escola</span>
        <strong class="meta-value">{{ escolaAula }}</strong>
      </div>

      <div v-if="descricaoAgendamento" class="meta-item meta-item-wide">
        <span class="meta-label">Descrição</span>
        <strong class="meta-value">{{ descricaoAgendamento }}</strong>
      </div>
    </div>

    <div class="code-strip">
      <span class="code-label">Código de verificação</span>
      <strong class="code-value">{{ codigoVerificacao }}</strong>
    </div>

    <div v-if="motivoRecusa" class="motivo-recusa">
      <span class="motivo-label">Motivo da recusa</span>
      <strong class="motivo-value">{{ motivoRecusa }}</strong>
    </div>

    <div v-if="!readonly && isPendente" class="buttons">
      <button type="button" class="btn-action btn-action-primary" @click="emit('confirmar')">
        Aceitar
      </button>
      <button type="button" class="btn-action btn-action-secondary" @click="emit('recusar')">
        Recusar
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed, defineEmits, defineProps } from 'vue'
import { formatarEscolaAulaLabel } from '@/utils/agendamentoExibicao'

const props = defineProps({
  agendamento: { type: Object, required: true },
  readonly: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['confirmar', 'recusar'])

const statusNormalizado = computed(() => String(props.agendamento?.status || '').trim().toLowerCase())

const statusClass = computed(() => {
  const mapa = {
    pendente: 'is-pendente',
    confirmado: 'is-confirmado',
    recusado: 'is-recusado',
    finalizado: 'is-finalizado',
  }

  return mapa[statusNormalizado.value] || 'is-neutro'
})

const statusTexto = computed(() => String(props.agendamento?.status || 'Sem status').toUpperCase())
const isPendente = computed(() => statusNormalizado.value === 'pendente')
const ehEncaixe = computed(() => Boolean(props.agendamento?.encaixe))
const limiteSemanalAtingido = computed(() => Boolean(props.agendamento?.limiteSemanalAtingido))

const quadraNome = computed(() => props.agendamento?.quadraNome || props.agendamento?.quadra?.nome || 'Quadra')
const solicitanteNome = computed(() => props.agendamento?.solicitanteNome || props.agendamento?.usuario || props.agendamento?.usuario?.nome || 'Sem usuário')
const timeNome = computed(() => props.agendamento?.timeNome || props.agendamento?.time || props.agendamento?.time?.nome || 'Não especificado')
const codigoVerificacao = computed(() => props.agendamento?.codigoVerificacao || 'N/A')
const motivoRecusa = computed(() => props.agendamento?.motivoRecusa || '')
const tipoLabel = computed(() => props.agendamento?.tipo || 'Não informado')
const tipoNormalizado = computed(() => String(props.agendamento?.tipo || '').trim().toLowerCase())
const permissaoSolicitanteId = computed(() =>
  Number(props.agendamento?.usuario?.permissaoId ?? props.agendamento?.solicitantePermissaoId ?? 0)
)
const tipoPermiteCampoTime = computed(() => !['amistoso', 'evento', 'campeonato'].includes(tipoNormalizado.value))
const permissaoPermiteCampoTime = computed(() => [1, 2, 5].includes(permissaoSolicitanteId.value))
const exibirCampoTime = computed(() => tipoPermiteCampoTime.value && permissaoPermiteCampoTime.value)
const tipoLabelExibicao = computed(() => (ehEncaixe.value ? `${tipoLabel.value} (ENCAIXE)` : tipoLabel.value))
const escolaAula = computed(() => {
  if (String(props.agendamento?.tipo || '').trim().toUpperCase() !== 'AULA') return ''
  return formatarEscolaAulaLabel(props.agendamento?.escola)
})
const descricaoAgendamento = computed(() => {
  if (String(props.agendamento?.tipo || '').trim().toUpperCase() !== 'OUTRO') return ''
  return String(props.agendamento?.descricao || '').trim()
})
const duracaoLabel = computed(() => `${props.agendamento?.duracao || 0} hora(s)`)

const formatarData = (agendamento) => {
  if (agendamento?.datahora) {
    return new Date(agendamento.datahora).toLocaleDateString('pt-BR')
  }

  return `${String(agendamento?.dia || 0).padStart(2, '0')}/${String(agendamento?.mes || 0).padStart(2, '0')}/${agendamento?.ano || '----'}`
}

const formatarHora = (agendamento) => {
  if (agendamento?.datahora) {
    return new Date(agendamento.datahora).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return `${String(agendamento?.hora || 0).padStart(2, '0')}:00`
}

const dataFormatada = computed(() => formatarData(props.agendamento))
const horaFormatada = computed(() => formatarHora(props.agendamento))
</script>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100%;
  padding: 13px 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fbfdff 0%, #ffffff 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.07);
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: rgba(148, 163, 184, 0.24);
}

.card.is-pendente::before {
  background: #d97706;
}

.card.is-confirmado::before {
  background: #059669;
}

.card.is-recusado::before {
  background: #dc2626;
}

.card.is-recusado {
  gap: 6px;
  padding: 10px 11px;
}

.card.is-recusado .card-top {
  gap: 8px;
}

.card.is-recusado .title-block {
  gap: 1px;
}

.card.is-recusado .card-title {
  font-size: 18px;
}

.card.is-recusado .status-pill {
  min-width: 88px;
  min-height: 26px;
  padding: 0 9px;
  font-size: 8px;
}

.card.is-finalizado::before {
  background: #2563eb;
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.card-kicker {
  margin: 0;
  font-size: 9px;
  line-height: 1;
  letter-spacing: 0.14em;
  font-weight: 800;
  text-transform: uppercase;
  color: #2563eb;
}

.card-title {
  margin: 0;
  font-size: 18px;
  line-height: 1.05;
  font-weight: 800;
  color: #0f172a;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  min-height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
}

.status-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.limit-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #7c2d12;
  background: rgba(249, 115, 22, 0.16);
  border: 1px solid rgba(249, 115, 22, 0.28);
  white-space: nowrap;
}

.status-pill.is-pendente {
  background: rgba(217, 119, 6, 0.14);
  color: #b45309;
}

.status-pill.is-confirmado {
  background: rgba(5, 150, 105, 0.14);
  color: #047857;
}

.status-pill.is-recusado {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

.status-pill.is-finalizado,
.status-pill.is-neutro {
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.card.is-recusado .meta-grid {
  gap: 6px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 8px 9px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.card.is-recusado .meta-item {
  gap: 2px;
  padding: 8px 9px;
  border-radius: 12px;
}

.meta-item-wide {
  grid-column: span 2;
}

.meta-label,
.code-label,
.motivo-label,
.footer-status-label {
  font-size: 9px;
  line-height: 1;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 800;
  color: #64748b;
}

.meta-value,
.motivo-value,
.footer-status-value {
  min-width: 0;
  font-size: 13px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 700;
  word-break: break-word;
}

.code-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(37, 99, 235, 0.06);
  border: 1px solid rgba(37, 99, 235, 0.12);
}

.card.is-recusado .code-strip {
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
}

.code-value {
  font-size: 13px;
  line-height: 1;
  color: #1d4ed8;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.motivo-recusa {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(220, 38, 38, 0.06);
  border: 1px solid rgba(220, 38, 38, 0.14);
}

.card.is-recusado .motivo-recusa {
  gap: 2px;
  padding: 8px 10px;
  border-radius: 12px;
}

.motivo-value {
  color: #991b1b;
}

.card.is-recusado .motivo-value {
  font-size: 13px;
  line-height: 1.15;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.btn-action {
  min-height: 36px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.btn-action:hover {
  transform: translateY(-1px);
}

.btn-action-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  box-shadow: 0 14px 26px rgba(37, 99, 235, 0.2);
}

.btn-action-secondary {
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.footer-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 2px;
  border-top: 1px solid rgba(226, 232, 240, 0.9);
}

.overlay-loader {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.72);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border-radius: 20px;
  backdrop-filter: blur(2px);
}

.overlay-loader .loader {
  width: 42px;
  height: 42px;
  border: 5px solid #3b82f6;
  border-top-color: transparent;
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

@media (max-width: 768px) {
  .card {
    padding: 14px;
    border-radius: 18px;
    gap: 10px;
  }

  .card-title {
    font-size: 18px;
  }

  .status-pill {
    min-width: 88px;
    min-height: 26px;
    font-size: 8px;
  }

  .card.is-recusado {
    padding: 11px 12px;
    gap: 7px;
  }

  .card.is-recusado .card-title {
    font-size: 17px;
  }

  .card.is-recusado .meta-grid {
    gap: 6px;
  }

  .card.is-recusado .meta-item,
  .card.is-recusado .code-strip,
  .card.is-recusado .motivo-recusa {
    padding: 8px 9px;
  }

  .meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  .meta-item,
  .meta-item-wide {
    grid-column: auto;
  }

  .meta-item {
    padding: 9px 10px;
  }

  .meta-label {
    font-size: 9px;
  }

  .meta-value,
  .motivo-value,
  .footer-status-value {
    font-size: 13px;
  }

  .code-strip,
  .footer-status {
    flex-direction: column;
    align-items: flex-start;
  }

  .buttons {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .btn-action {
    min-height: 36px;
    font-size: 13px;
  }
}
</style>
