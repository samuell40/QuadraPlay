<template>
  <div class="modal-overlay" @click.self="!isSaving && fechar()">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-copy">
          <p class="modal-kicker">HORÁRIOS</p>
          <h2 class="modal-title">Editar grade de horários</h2>
          <p class="modal-subtitle">{{ quadra.nome }}</p>
        </div>

        <button type="button" class="btn-close-x" :disabled="isSaving" @click="fechar" aria-label="Fechar modal">
          x
        </button>
      </div>

      <div v-if="isLoading" class="loader-container">
        <LoadingState
          size="compact"
          title="Carregando grade"
          description="Buscando dias de funcionamento e horários já configurados para a quadra."
        />
      </div>

      <div v-else class="modal-body">
        <p class="info-text">
          Configure os dias de funcionamento, gere horários em lote, replique a grade e ajuste cada dia manualmente.
        </p>

        <div class="tabs-header">
          <button
            v-for="(dia, index) in diasSemanaNomes"
            :key="index"
            type="button"
            :class="['tab-btn', { active: diaSelecionado === index }]"
            @click="mudarDia(index)"
          >
            <span class="tab-day">{{ dia }}</span>
          </button>
        </div>

        <div class="workspace-card">
          <div class="dia-header-row">
            <div class="titulo-switch-wrapper">
              <div>
                <p class="section-kicker">DIA SELECIONADO</p>
                <h3 class="dia-titulo">{{ diasSemanaExtenso[diaSelecionado] }}</h3>
              </div>

              <div class="switch-container">
                <span class="switch-label" :class="{ 'is-open': diaEstaAberto, 'is-closed': !diaEstaAberto }">
                  {{ diaEstaAberto ? 'Aberto' : 'Fechado' }}
                </span>

                <label class="switch">
                  <input type="checkbox" :checked="diaEstaAberto" @change="alternarFuncionamento">
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <div v-if="diaEstaAberto" class="ferramentas-icones">
              <button
                type="button"
                class="btn-tool"
                title="Gerador automatico"
                :class="{ active: showGerador }"
                @click="showGerador = !showGerador"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z" />
                </svg>
                <span>Automático</span>
              </button>

              <button
                type="button"
                class="btn-tool"
                title="Copiar para outros dias"
                :class="{ active: showReplicar }"
                @click="showReplicar = !showReplicar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <path fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z" />
                  <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                  <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                </svg>
                <span>Copiar</span>
              </button>
            </div>
          </div>

          <div v-if="diaEstaAberto" class="conteudo-aberto">
            <div v-if="showGerador" class="painel-ferramenta">
              <div class="painel-head">
                <div>
                  <p class="tool-kicker">GERADOR</p>
                  <h4 class="tool-title">Montar grade automaticamente</h4>
                </div>
              </div>

              <div class="gerador-inputs">
                <div class="g-group">
                  <label>Início</label>
                  <input v-model="gerador.inicio" type="time">
                </div>

                <div class="g-group">
                  <label>Fim</label>
                  <input v-model="gerador.fim" type="time">
                </div>

                <div class="g-group">
                  <label>Duracao (min)</label>
                  <input v-model="gerador.duracao" type="number" placeholder="60">
                </div>

                <button type="button" class="btn-acao-painel" @click="gerarHorariosAutomaticos">
                  Gerar grade
                </button>
              </div>

              <small class="hint">A nova grade substitui os horários atuais deste dia.</small>
            </div>

            <div v-if="showReplicar" class="painel-ferramenta">
              <div class="painel-head">
                <div>
                  <p class="tool-kicker">REPLICAR</p>
                  <h4 class="tool-title">Copiar grade para outros dias</h4>
                </div>
              </div>

              <p class="replicar-titulo">
                Copiar a configuração de <strong>{{ diasSemanaNomes[diaSelecionado] }}</strong> para:
              </p>

              <div class="dias-checks">
                <label v-for="(dia, idx) in diasSemanaNomes" :key="idx" class="chk-item">
                  <input v-model="diasParaReplicar" type="checkbox" :value="idx" :disabled="idx === diaSelecionado">
                  <span>{{ dia }}</span>
                </label>
              </div>

              <button type="button" class="btn-acao-painel" @click="confirmarReplicacao">
                Aplicar cópia
              </button>
            </div>

            <div class="editor-card">
              <div class="editor-head">
                <div>
                  <p class="tool-kicker">HORÁRIOS</p>
                  <h4 class="tool-title">Adicionar horários manualmente</h4>
                </div>
              </div>

              <div class="add-horario-form">
                <div class="input-wrapper">
                  <svg class="clock-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="9"></circle>
                    <path d="M12 7v5l3 2"></path>
                  </svg>
                  <input
                    v-model="novoHorarioInput"
                    type="time"
                    class="time-input"
                    @keyup.enter="adicionarHorario"
                  />
                </div>

                <button type="button" class="btn-add" :disabled="!novoHorarioInput" @click="adicionarHorario">
                  Adicionar
                </button>
              </div>

              <div class="lista-horarios">
                <div v-if="gradePorDia[diaSelecionado].length === 0" class="sem-horarios">
                  Nenhum horário configurado para este dia.
                </div>

                <div
                  v-else
                  v-for="(horario, hIndex) in gradePorDia[diaSelecionado]"
                  :key="hIndex"
                  class="horario-chip"
                >
                  <span>{{ horario }}</span>
                  <button type="button" class="btn-remove-chip" @click="removerHorario(hIndex)">
                    x
                  </button>
                </div>
              </div>

              <div v-if="gradePorDia[diaSelecionado].length > 0" class="resumo-footer">
                <span>{{ gradePorDia[diaSelecionado].length }} horarios listados</span>
                <button type="button" class="btn-clear" @click="limparDia">Limpar dia</button>
              </div>
            </div>
          </div>

          <div v-else class="estado-fechado">
            <div class="fechado-content">
              <div class="fechado-badge">Fechado</div>
              <p class="fechado-title">Não há horários disponíveis para agendamento.</p>
              <p class="fechado-desc">Ative o dia para criar uma nova grade de funcionamento.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-salvar" @click="salvarGradeCompleta" :disabled="isSaving || isLoading">
          <span class="btn-inline-content">
            <span v-if="isSaving" class="btn-loading-spinner" aria-hidden="true"></span>
            <span>{{ isSaving ? 'Salvando...' : 'Salvar alteracoes' }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/axios'
import LoadingState from '@/components/loading/LoadingState.vue'
import Swal from 'sweetalert2'

export default {
  name: 'EditarGradeHorariosModal',
  components: { LoadingState },
  props: {
    quadra: { type: Object, required: true }
  },
  data() {
    return {
      isLoading: true,
      isSaving: false,
      diaSelecionado: 1,
      novoHorarioInput: '',
      showGerador: false,
      showReplicar: false,
      diasParaReplicar: [],
      gerador: { inicio: '07:00', fim: '23:00', duracao: 60 },
      diasSemanaNomes: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
      diasSemanaExtenso: ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado'],
      gradePorDia: [[], [], [], [], [], [], []],
      statusDias: [false, false, false, false, false, false, false]
    }
  },
  computed: {
    diaEstaAberto() {
      return this.statusDias[this.diaSelecionado]
    }
  },
  mounted() {
    this.carregarGradeExistente()
  },
  methods: {
    async carregarGradeExistente() {
      this.isLoading = true
      try {
        const response = await api.get(`/grade-horarios/${this.quadra.id}`)
        this.gradePorDia = [[], [], [], [], [], [], []]
        this.statusDias = [false, false, false, false, false, false, false]

        response.data.forEach((item) => {
          if (this.gradePorDia[item.diaSemana]) {
            this.gradePorDia[item.diaSemana].push(item.horario)
            this.statusDias[item.diaSemana] = true
          }
        })

        this.gradePorDia.forEach((diaArr) => diaArr.sort())
      } catch (error) {
        console.error('Erro ao carregar:', error)
      } finally {
        this.isLoading = false
      }
    },

    mudarDia(index) {
      this.diaSelecionado = index
      this.showGerador = false
      this.showReplicar = false
    },

    alternarFuncionamento() {
      const novoStatus = !this.statusDias[this.diaSelecionado]
      this.statusDias[this.diaSelecionado] = novoStatus

      if (!novoStatus) {
        this.gradePorDia[this.diaSelecionado] = []
      }
    },

    adicionarHorario() {
      if (!this.novoHorarioInput) return

      const arr = this.gradePorDia[this.diaSelecionado]
      if (arr.includes(this.novoHorarioInput)) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          title: 'Horario ja existe',
          showConfirmButton: false,
          timer: 1500
        })
        return
      }

      arr.push(this.novoHorarioInput)
      arr.sort()
      this.novoHorarioInput = ''
    },

    removerHorario(index) {
      this.gradePorDia[this.diaSelecionado].splice(index, 1)
    },

    limparDia() {
      this.gradePorDia[this.diaSelecionado] = []
    },

    gerarHorariosAutomaticos() {
      if (!this.gerador.inicio || !this.gerador.fim || !this.gerador.duracao) return

      const novos = []
      let atual = this.timeToMinutes(this.gerador.inicio)
      const fim = this.timeToMinutes(this.gerador.fim)
      const duracao = parseInt(this.gerador.duracao)

      while (atual < fim) {
        if (atual + duracao > fim && duracao > (fim - atual)) break
        novos.push(this.minutesToTime(atual))
        atual += duracao
      }

      this.gradePorDia[this.diaSelecionado] = novos
      this.showGerador = false

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Grade gerada!',
        showConfirmButton: false,
        timer: 1500
      })
    },

    confirmarReplicacao() {
      if (this.diasParaReplicar.length === 0) return

      const copia = [...this.gradePorDia[this.diaSelecionado]]

      this.diasParaReplicar.forEach((idx) => {
        this.gradePorDia[idx] = [...copia]
        this.statusDias[idx] = true
      })

      this.showReplicar = false
      this.diasParaReplicar = []

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Copiado com sucesso!',
        showConfirmButton: false,
        timer: 1500
      })
    },

    timeToMinutes(t) {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    },

    minutesToTime(m) {
      return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    },

    async salvarGradeCompleta() {
      this.isSaving = true
      try {
        const promises = this.gradePorDia.map((horarios, diaIndex) => {
          const dadosFinais = this.statusDias[diaIndex] ? horarios : []
          return api.post('/grade-horarios', {
            quadraId: this.quadra.id,
            diaSemana: diaIndex,
            horarios: dadosFinais
          })
        })

        await Promise.all(promises)
        Swal.fire('Sucesso', 'Grade atualizada!', 'success')
        this.$emit('sucesso')
        this.fechar()
      } catch (e) {
        Swal.fire('Erro', 'Falha ao salvar.', 'error')
      } finally {
        this.isSaving = false
      }
    },

    fechar() {
      this.$emit('fechar')
    }
  }
}
</script>

<style scoped>
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
  width: 95%;
  max-width: 760px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  color: #1e293b;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.modal-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.modal-kicker,
.section-kicker,
.tool-kicker {
  margin: 0;
  font-size: 12px;
  line-height: 1;
  letter-spacing: 0.16em;
  font-weight: 800;
  text-transform: uppercase;
  color: #2563eb;
}

.modal-title {
  margin: 0;
  font-size: 26px;
  line-height: 1.1;
  font-weight: 800;
  color: #2563eb;
}

.modal-subtitle,
.info-text,
.hint,
.replicar-titulo,
.loader-copy {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: #64748b;
}

.btn-close-x {
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

.btn-close-x:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.btn-close-x:disabled,
.btn-salvar:disabled {
  cursor: not-allowed;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.tabs-header {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  margin: 18px 0 20px;
}

.tab-btn {
  min-height: 42px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.tab-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.25);
  color: #2563eb;
}

.tab-btn.active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 14px 24px rgba(37, 99, 235, 0.18);
}

.workspace-card,
.painel-ferramenta,
.editor-card {
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.05);
}

.workspace-card {
  padding: 18px;
}

.dia-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.titulo-switch-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
}

.dia-titulo {
  margin: 6px 0 0;
  font-size: 22px;
  line-height: 1.15;
  font-weight: 800;
  color: #0f172a;
}

.switch-container {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.switch-label {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.switch-label.is-open {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.switch-label.is-closed {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  cursor: pointer;
  background-color: #cbd5e1;
  transition: 0.4s;
  border-radius: 999px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: #ffffff;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #3b82f6;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.ferramentas-icones {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-tool,
.btn-acao-painel,
.btn-add,
.btn-salvar {
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.btn-tool:hover,
.btn-acao-painel:hover,
.btn-add:hover:not(:disabled),
.btn-salvar:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-tool {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.btn-tool.active {
  background: rgba(37, 99, 235, 0.08);
  border-color: rgba(37, 99, 235, 0.22);
  color: #2563eb;
}

.conteudo-aberto {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 16px;
}

.painel-ferramenta,
.editor-card {
  padding: 16px;
}

.painel-head,
.editor-head {
  margin-bottom: 12px;
}

.tool-title {
  margin: 6px 0 0;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 800;
  color: #0f172a;
}

.gerador-inputs {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.g-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.g-group label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.g-group input,
.time-input {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 14px;
  background: #f8fafc;
  font-size: 14px;
  color: #334155;
}

.g-group input {
  width: 110px;
}

.btn-acao-painel,
.btn-add,
.btn-salvar {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  box-shadow: 0 14px 24px rgba(37, 99, 235, 0.18);
  font-size: 13px;
  font-weight: 800;
}

.dias-checks {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 14px 0 12px;
}

.chk-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #f8fafc;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.add-horario-form {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.input-wrapper {
  position: relative;
  flex: 1;
}

.time-input {
  width: 100%;
  padding-left: 40px;
}

.time-input:focus,
.g-group input:focus {
  outline: none;
  border-color: rgba(37, 99, 235, 0.45);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.clock-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  width: 16px;
  height: 16px;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}

.btn-add:disabled,
.btn-salvar:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-inline-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-loading-spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  animation: girar-botao 0.7s linear infinite;
}

.lista-horarios {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 60px;
  align-content: flex-start;
}

.sem-horarios {
  width: 100%;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  border: 1px dashed rgba(148, 163, 184, 0.34);
  background: #f8fafc;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.horario-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.18);
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
}

.horario-chip:hover {
  background: rgba(37, 99, 235, 0.12);
}

.btn-remove-chip {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #60a5fa;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

.btn-remove-chip:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.resumo-footer {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #94a3b8;
}

.btn-clear {
  border: none;
  background: transparent;
  color: #ef4444;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.estado-fechado {
  margin-top: 16px;
  padding: 24px;
  border-radius: 20px;
  border: 1px dashed rgba(239, 68, 68, 0.28);
  background: rgba(254, 242, 242, 0.94);
}

.fechado-content {
  text-align: center;
}

.fechado-badge {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.fechado-title {
  margin: 12px 0 6px;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 800;
  color: #991b1b;
}

.fechado-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #b91c1c;
}

.modal-footer {
  padding-top: 4px;
}

.loader-container {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

@keyframes girar-botao {
  to {
    transform: rotate(360deg);
  }
}

.loader {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 14px;
  }

  .modal-content {
    width: 100%;
    padding: 18px;
    border-radius: 22px;
  }

  .modal-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: nowrap;
  }

  .dia-header-row,
  .titulo-switch-wrapper {
    flex-direction: column;
    align-items: flex-start;
  }

  .modal-title {
    font-size: 22px;
  }

  .tabs-header {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 2px;
    margin-bottom: 16px;
  }

  .tab-btn {
    min-width: 58px;
    flex: 0 0 auto;
  }

  .workspace-card,
  .painel-ferramenta,
  .editor-card {
    border-radius: 18px;
  }

  .workspace-card,
  .painel-ferramenta,
  .editor-card {
    padding: 14px;
  }

  .dia-titulo {
    font-size: 20px;
  }

  .ferramentas-icones {
    width: 100%;
  }

  .btn-tool {
    flex: 1 1 auto;
    justify-content: center;
  }

  .gerador-inputs,
  .add-horario-form {
    flex-direction: column;
    align-items: stretch;
  }

  .g-group,
  .g-group input,
  .input-wrapper,
  .time-input,
  .btn-acao-painel,
  .btn-add {
    width: 100%;
  }

  .dias-checks {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lista-horarios {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .horario-chip {
    width: 100%;
    justify-content: space-between;
    min-width: 0;
  }

  .resumo-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
