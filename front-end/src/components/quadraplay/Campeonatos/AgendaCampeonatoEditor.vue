<template>
  <div class="agenda-editor-shell">
    <fieldset class="agenda-editor-fieldset" :disabled="disabled">
    <div class="agenda-add-row">
      <div class="form-group form-group-agenda-date">
        <label for="novaDataAgendaEditor">Adicionar data</label>
        <input
          id="novaDataAgendaEditor"
          v-model="novaDataAgenda"
          type="date"
          :min="minDate"
        >
      </div>

      <button type="button" class="btn-save btn-save-secondary" @click="adicionarDataAgenda">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="btn-save-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 7a.5.5 0 0 1 .5.5V9H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V10H6a.5.5 0 0 1 0-1h1.5V7.5A.5.5 0 0 1 8 7"/>
          <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
        </svg>
        <span>Adicionar data</span>
      </button>
    </div>

    <div v-if="datasAgendaOrdenadas.length" class="tabs-header-agenda">
      <button
        v-for="item in datasAgendaOrdenadas"
        :key="item.data"
        type="button"
        class="tab-btn"
        :class="{ active: dataAgendaSelecionada === item.data }"
        @click="selecionarDataAgenda(item.data)"
      >
        <span>{{ formatarDataAgenda(item.data) }}</span>
      </button>
    </div>

    <div v-if="agendaSelecionada" class="workspace-card agenda-workspace-card">
      <div class="dia-header-row">
        <div>
          <p class="section-kicker">DATA SELECIONADA</p>
          <h3 class="dia-titulo">{{ formatarDataAgenda(dataAgendaSelecionada) }}</h3>
        </div>

        <div class="ferramentas-icones">
          <button
            type="button"
            class="btn-tool"
            :class="{ active: showGeradorAgenda }"
            @click="showGeradorAgenda = !showGeradorAgenda"
          >
            <span>Automático</span>
          </button>

          <button
            type="button"
            class="btn-tool"
            :class="{ active: showReplicarAgenda }"
            @click="showReplicarAgenda = !showReplicarAgenda"
          >
            <span>Copiar</span>
          </button>
        </div>
      </div>

      <div v-if="showGeradorAgenda" class="painel-ferramenta">
        <div class="painel-head">
          <div>
            <p class="tool-kicker">GERADOR</p>
            <h4 class="tool-title">Montar horários automaticamente</h4>
          </div>
        </div>

        <div class="gerador-inputs">
          <div class="g-group">
            <label>Inicio</label>
            <input v-model="geradorAgenda.inicio" type="time">
          </div>

          <div class="g-group">
            <label>Fim</label>
            <input v-model="geradorAgenda.fim" type="time">
          </div>

          <div class="g-group">
            <label>Duracao (min)</label>
            <input v-model="geradorAgenda.duracao" type="number" placeholder="60">
          </div>

          <button type="button" class="btn-acao-painel" @click="gerarHorariosAutomaticosAgenda">
            Gerar grade
          </button>
        </div>
      </div>

      <div v-if="showReplicarAgenda" class="painel-ferramenta">
        <div class="painel-head">
          <div>
            <p class="tool-kicker">REPLICAR</p>
            <h4 class="tool-title">Copiar horários para outras datas</h4>
          </div>
        </div>

        <div class="dias-checks datas-checks-agenda">
          <label
            v-for="item in datasAgendaOrdenadas"
            :key="`replicar-${item.data}`"
            class="chk-item"
          >
            <input
              v-model="datasParaReplicarAgenda"
              type="checkbox"
              :value="item.data"
              :disabled="item.data === dataAgendaSelecionada"
            >
            <span>{{ formatarDataAgenda(item.data) }}</span>
          </label>
        </div>

        <button type="button" class="btn-acao-painel" @click="confirmarReplicacaoAgenda">
          Aplicar copia
        </button>
      </div>

      <div class="editor-card">
        <div class="editor-head">
          <div>
            <p class="tool-kicker">HORARIOS</p>
            <h4 class="tool-title">Adicionar horários manualmente</h4>
          </div>

          <button type="button" class="btn-remove-date" @click="removerDataAgenda(dataAgendaSelecionada)">
            Remover data
          </button>
        </div>

        <div class="add-horario-form">
          <input
            v-model="novoHorarioInputAgenda"
            type="time"
            class="time-input"
            @keyup.enter="adicionarHorarioAgenda"
          >

          <button type="button" class="btn-add" :disabled="!novoHorarioInputAgenda" @click="adicionarHorarioAgenda">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="btn-save-icon" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
            </svg>
            <span>Adicionar</span>
          </button>
        </div>

        <div class="lista-horarios">
          <div v-if="agendaSelecionada.horarios.length === 0" class="sem-horarios">
            Nenhum horario configurado para esta data.
          </div>

          <div
            v-for="(horario, index) in agendaSelecionada.horarios"
            v-else
            :key="`${dataAgendaSelecionada}-${horario}`"
            class="horario-chip"
          >
            <span>{{ horario }}</span>
            <button type="button" class="btn-remove-chip" @click="removerHorarioAgenda(index)">
              x
            </button>
          </div>
        </div>

        <div v-if="agendaSelecionada.horarios.length > 0" class="resumo-footer">
          <span>{{ agendaSelecionada.horarios.length }} horários listados</span>
          <button type="button" class="btn-clear" @click="limparHorariosAgenda">Limpar data</button>
        </div>
      </div>
    </div>

    <div v-else class="estado-agenda-vazio">
      <p>Adicione ao menos uma data para configurar a agenda do campeonato.</p>
    </div>
    </fieldset>
  </div>
</template>

<script>
import Swal from 'sweetalert2'

function clonarAgenda(lista = []) {
  return (Array.isArray(lista) ? lista : []).map((item) => ({
    data: String(item?.data || ''),
    horarios: Array.isArray(item?.horarios) ? [...item.horarios] : []
  }))
}

export default {
  name: 'AgendaCampeonatoEditor',
  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    minDate: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      agendaPorDataInterna: [],
      novaDataAgenda: '',
      dataAgendaSelecionada: '',
      showGeradorAgenda: false,
      showReplicarAgenda: false,
      datasParaReplicarAgenda: [],
      novoHorarioInputAgenda: '',
      geradorAgenda: {
        inicio: '07:00',
        fim: '23:00',
        duracao: 60
      }
    }
  },
  computed: {
    datasAgendaOrdenadas() {
      return [...this.agendaPorDataInterna].sort((a, b) => a.data.localeCompare(b.data))
    },
    agendaSelecionada() {
      return this.agendaPorDataInterna.find((item) => item.data === this.dataAgendaSelecionada) || null
    }
  },
  watch: {
    modelValue: {
      immediate: true,
      deep: true,
      handler(valor) {
        this.agendaPorDataInterna = this.normalizarAgenda(valor)

        if (!this.agendaPorDataInterna.length) {
          this.dataAgendaSelecionada = ''
          return
        }

        if (!this.agendaPorDataInterna.some((item) => item.data === this.dataAgendaSelecionada)) {
          this.dataAgendaSelecionada = this.agendaPorDataInterna[0].data
        }
      }
    }
  },
  methods: {
    normalizarAgenda(lista = []) {
      const mapa = new Map()

      clonarAgenda(lista).forEach((item) => {
        const data = String(item?.data || '').trim()
        if (!data) return

        const horarios = [...new Set(
          (Array.isArray(item?.horarios) ? item.horarios : [])
            .map((horario) => String(horario || '').trim())
            .filter(Boolean)
        )].sort((a, b) => this.timeToMinutes(a) - this.timeToMinutes(b))

        mapa.set(data, { data, horarios })
      })

      return [...mapa.values()].sort((a, b) => a.data.localeCompare(b.data))
    },
    emitirAgendaAtualizada() {
      const agendaAtualizada = this.normalizarAgenda(this.agendaPorDataInterna)
      this.agendaPorDataInterna = agendaAtualizada

      if (!agendaAtualizada.length) {
        this.dataAgendaSelecionada = ''
      } else if (!agendaAtualizada.some((item) => item.data === this.dataAgendaSelecionada)) {
        this.dataAgendaSelecionada = agendaAtualizada[0].data
      }

      this.$emit('update:modelValue', clonarAgenda(agendaAtualizada))
    },
    selecionarDataAgenda(data) {
      this.dataAgendaSelecionada = data
      this.showGeradorAgenda = false
      this.showReplicarAgenda = false
      this.datasParaReplicarAgenda = []
      this.novoHorarioInputAgenda = ''
    },
    adicionarDataAgenda() {
      if (!this.novaDataAgenda) {
        Swal.fire('Atenção', 'Selecione uma data.', 'warning')
        return
      }

      if (this.minDate && this.novaDataAgenda < this.minDate) {
        Swal.fire('Atenção', 'Selecione uma data válida para a agenda.', 'warning')
        return
      }

      const existe = this.agendaPorDataInterna.find((item) => item.data === this.novaDataAgenda)
      if (existe) {
        this.selecionarDataAgenda(existe.data)
        this.novaDataAgenda = ''
        return
      }

      this.agendaPorDataInterna = [
        ...this.agendaPorDataInterna,
        {
          data: this.novaDataAgenda,
          horarios: []
        }
      ]

      this.selecionarDataAgenda(this.novaDataAgenda)
      this.novaDataAgenda = ''
      this.emitirAgendaAtualizada()
    },
    removerDataAgenda(data) {
      this.agendaPorDataInterna = this.agendaPorDataInterna.filter((item) => item.data !== data)
      this.datasParaReplicarAgenda = this.datasParaReplicarAgenda.filter((item) => item !== data)
      this.emitirAgendaAtualizada()
    },
    timeToMinutes(time) {
      const [hora, minuto] = String(time || '').split(':').map(Number)
      return (hora * 60) + minuto
    },
    minutesToTime(totalMinutos) {
      return `${String(Math.floor(totalMinutos / 60)).padStart(2, '0')}:${String(totalMinutos % 60).padStart(2, '0')}`
    },
    adicionarHorarioAgenda() {
      if (!this.agendaSelecionada || !this.novoHorarioInputAgenda) return

      if (this.agendaSelecionada.horarios.includes(this.novoHorarioInputAgenda)) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          title: 'Horario ja existe',
          showConfirmButton: false,
          timer: 1600
        })
        return
      }

      this.agendaSelecionada.horarios.push(this.novoHorarioInputAgenda)
      this.agendaSelecionada.horarios.sort((a, b) => this.timeToMinutes(a) - this.timeToMinutes(b))
      this.novoHorarioInputAgenda = ''
      this.emitirAgendaAtualizada()
    },
    removerHorarioAgenda(index) {
      if (!this.agendaSelecionada) return
      this.agendaSelecionada.horarios.splice(index, 1)
      this.emitirAgendaAtualizada()
    },
    limparHorariosAgenda() {
      if (!this.agendaSelecionada) return
      this.agendaSelecionada.horarios = []
      this.emitirAgendaAtualizada()
    },
    gerarHorariosAutomaticosAgenda() {
      if (!this.agendaSelecionada) return
      if (!this.geradorAgenda.inicio || !this.geradorAgenda.fim || !this.geradorAgenda.duracao) return

      const inicio = this.timeToMinutes(this.geradorAgenda.inicio)
      const fim = this.timeToMinutes(this.geradorAgenda.fim)
      const duracao = Number(this.geradorAgenda.duracao)

      if (!Number.isFinite(duracao) || duracao <= 0 || inicio >= fim) {
        Swal.fire('Atenção', 'Preencha um intervalo válido para gerar os horários.', 'warning')
        return
      }

      const novosHorarios = []
      let atual = inicio

      while (atual < fim) {
        if (atual + duracao > fim) break
        novosHorarios.push(this.minutesToTime(atual))
        atual += duracao
      }

      this.agendaSelecionada.horarios = novosHorarios
      this.showGeradorAgenda = false
      this.emitirAgendaAtualizada()
    },
    confirmarReplicacaoAgenda() {
      if (!this.agendaSelecionada || !this.datasParaReplicarAgenda.length) return

      const copia = [...this.agendaSelecionada.horarios]
      this.agendaPorDataInterna = this.agendaPorDataInterna.map((item) => {
        if (!this.datasParaReplicarAgenda.includes(item.data)) return item
        return {
          ...item,
          horarios: [...copia]
        }
      })

      this.showReplicarAgenda = false
      this.datasParaReplicarAgenda = []
      this.emitirAgendaAtualizada()
    },
    formatarDataAgenda(dataStr) {
      if (!dataStr) return ''
      const data = new Date(`${dataStr}T12:00:00`)
      if (Number.isNaN(data.getTime())) return dataStr

      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.agenda-editor-shell {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.agenda-editor-fieldset {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label,
.g-group label {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.form-group input,
.g-group input,
.time-input {
  width: 100%;
  min-height: 40px;
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
  font-size: 15px;
}

.agenda-add-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.form-group-agenda-date {
  flex: 1;
}

.tabs-header-agenda {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.workspace-card {
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 20px;
  padding: 18px;
  background: #f8fafc;
}

.agenda-workspace-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dia-header-row,
.editor-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.section-kicker,
.tool-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  line-height: 1;
  letter-spacing: 0.16em;
  font-weight: 800;
  text-transform: uppercase;
  color: #2563eb;
}

.dia-titulo,
.tool-title {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
}

.ferramentas-icones {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.painel-ferramenta,
.editor-card {
  border: 1px solid #dbe3ef;
  border-radius: 16px;
  padding: 14px;
  background: #fff;
}

.painel-head {
  margin-bottom: 12px;
}

.gerador-inputs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  align-items: end;
}

.g-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dias-checks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.chk-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  border-radius: 12px;
  background: #eff6ff;
  color: #1e3a8a;
}

.add-horario-form {
  display: flex;
  gap: 10px;
  margin: 12px 0 14px;
}

.lista-horarios {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sem-horarios,
.estado-agenda-vazio {
  padding: 24px;
  border-radius: 16px;
  background: #f8fafc;
  text-align: center;
  color: #64748b;
}

.horario-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 11px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
  font-size: 13px;
}

.resumo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  color: #475569;
  font-size: 14px;
}

.btn-save,
.btn-acao-painel,
.btn-add,
.btn-tool,
.tab-btn,
.btn-remove-date {
  border: none;
  border-radius: 12px;
  cursor: pointer;
}

.btn-save,
.btn-acao-painel,
.btn-add {
  min-height: 40px;
  padding: 9px 14px;
  background: #2563eb;
  color: #fff;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-save-secondary {
  align-self: flex-end;
}

.btn-save-icon {
  flex: 0 0 auto;
}

.tab-btn {
  flex: 0 0 auto;
  min-height: 40px;
  padding: 9px 14px;
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 700;
  white-space: nowrap;
}

.tab-btn.active {
  background: #dbeafe;
  color: #1d4ed8;
}

.btn-tool,
.btn-remove-date {
  padding: 9px 13px;
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 700;
}

.btn-tool.active {
  background: #dbeafe;
  color: #1d4ed8;
}

.btn-remove-chip,
.btn-clear {
  border: none;
  background: transparent;
  color: inherit;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 768px) {
  .agenda-add-row,
  .add-horario-form,
  .dia-header-row,
  .editor-head {
    flex-direction: column;
    align-items: stretch;
  }

  .gerador-inputs {
    grid-template-columns: 1fr;
  }
}
</style>
