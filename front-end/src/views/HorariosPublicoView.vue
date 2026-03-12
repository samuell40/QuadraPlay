<template>
  <div class="layout layout-publico">
    <NavBarHome />

    <div class="conteudo conteudo-publico">

      <section class="page-header">
        <div class="header-copy">
          <div class="header-topline">
            <h1 class="title">Horários</h1>
          </div>
          <p class="page-subtitle">
            Consulte a grade semanal das quadras, acompanhe reservas e veja os horários disponíveis.
          </p>
        </div>
      </section>

      <div v-if="carregandoInicial" class="loader-container-centralizado">
        <LoadingState title="Carregando horários"
          description="Buscando quadras, grade semanal e reservas publicas para montar o painel." />
      </div>

      <template v-else>
        <section v-if="podeTrocarQuadra" class="controls-panel">
          <div class="panel-head">
            <div class="panel-copy">
              <p class="section-kicker">{{ kickerControles }}</p>
              <h2 class="section-title">{{ tituloControles }}</h2>
              <p class="section-subtitle">
                {{ subtituloControles }}
              </p>
            </div>
          </div>

          <div class="controls-row">
            <label class="filter-field">
              <select v-model="quadraSelecionada" @change="carregarTudo" class="select-quadra">
                <option v-for="quadra in quadras" :key="quadra.id" :value="quadra.id">
                  {{ quadra.nome }}
                </option>
              </select>
            </label>
          </div>
        </section>

        <section class="schedule-panel">
          <div class="panel-head">
            <div class="panel-copy">
              <p class="section-kicker">SEMANA</p>
              <div class="section-topline">
                <div class="section-title-block">
                  <h2 class="section-title">Agenda de {{ nomeQuadraSelecionada }}</h2>
                  <p class="week-range">{{ faixaSemana }}</p>
                </div>

                <div class="section-actions">
                  <div class="week-toolbar">
                    <button type="button" class="btn-week" @click="irParaSemanaAnterior"
                      :disabled="isLoading || !quadraSelecionada">
                      Semana anterior
                    </button>
                    <button type="button" class="btn-week btn-week-current" @click="irParaSemanaAtual"
                      :disabled="isLoading || !quadraSelecionada || semanaAtualSelecionada">
                      Semana atual
                    </button>
                    <button type="button" class="btn-week" @click="irParaProximaSemana"
                      :disabled="isLoading || !quadraSelecionada">
                      Próxima semana
                    </button>
                  </div>

                </div>
              </div>
              <p class="section-subtitle">
                Horários livres ficam apenas para consulta. Horários reservados podem ser abertos para ver o
                agendamento.
              </p>
            </div>
          </div>

          <div class="tabela-container">
            <div v-if="isLoading" class="loader-overlay">
              <LoadingState size="compact" title="Carregando grade de horários"
                description="Montando a disponibilidade e as reservas da semana selecionada." />
            </div>

            <div v-else-if="gradeMontada.length === 0" class="state-card">
              <p class="state-title">Nenhum dia com horários configurados para esta quadra.</p>
              <p class="state-copy">Ajuste a grade da unidade para exibir a semana operacional aqui.</p>
            </div>

            <div v-else class="tabela-shell">
              <table class="tabela-horarios" id="tabela-agenda">
                <thead>
                  <tr>
                    <th colspan="2" v-for="(dia, index) in diasSemanaHeader" :key="index" class="header-dia">
                      {{ dia }}
                    </th>
                  </tr>

                  <tr class="sub-header">
                    <template v-for="(colunaDia, index) in gradeMontada" :key="index">
                      <th class="col-min">Hr</th>
                      <th>Time</th>
                    </template>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="slotIndex in maxSlots" :key="slotIndex"
                    :class="slotIndex % 2 === 0 ? 'linha-branca' : 'linha-cinza'">
                    <template v-for="(colunaDia, colIndex) in gradeMontada" :key="colIndex">
                      <template v-if="colunaDia[slotIndex - 1]">
                        <td class="celula-hora">{{ colunaDia[slotIndex - 1].horario }}</td>
                        <td class="celula-status" :class="{
                          reservado: colunaDia[slotIndex - 1].ocupado,
                          livre: !colunaDia[slotIndex - 1].ocupado
                        }" @click="abrirDetalhes(colunaDia[slotIndex - 1])">
                          {{ colunaDia[slotIndex - 1].texto }}
                        </td>
                      </template>

                      <template v-else>
                        <td class="celula-vazia">---</td>
                        <td class="celula-vazia">---</td>
                      </template>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </template>
    </div>

    <Footer />

    <DetalheAgendModal v-if="agendamentoSelecionado" :agendamento="agendamentoSelecionado"
      @fechar="agendamentoSelecionado = null" />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { startOfWeek, addDays, addWeeks, subWeeks, format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import api from '@/axios'
import { useAuthStore } from '@/store'
import NavBarHome from '@/components/NavBarHome.vue'
import Footer from '@/components/Footer.vue'
import DetalheAgendModal from '@/components/modals/Agendamentos/DetalharAgendModal.vue'
import LoadingState from '@/components/loading/LoadingState.vue'

export default {
  name: 'HorariosPublicoView',
  components: { NavBarHome, Footer, DetalheAgendModal, LoadingState },
  setup() {
    const authStore = useAuthStore()
    const carregandoInicial = ref(true)
    const quadras = ref([])
    const quadraSelecionada = ref(null)
    const isLoading = ref(false)
    const agendamentoSelecionado = ref(null)
    const diasSemanaHeader = ref([])
    const gradeMontada = ref([])
    const maxSlots = ref(0)
    const hoje = new Date()
    const inicioSemana = ref(startOfWeek(hoje, { weekStartsOn: 1 }))
    const inicioSemanaAtual = startOfWeek(hoje, { weekStartsOn: 1 })
    const formatarHoraIntParaString = (h) => String(h).padStart(2, '0') + ':00'

    const podeTrocarQuadra = computed(() => true)

    const nomeQuadraSelecionada = computed(() => {
      return quadras.value.find((q) => Number(q.id) === Number(quadraSelecionada.value))?.nome || authStore.usuario?.quadra?.nome || 'Quadra'
    })
    const faixaSemana = computed(() => {
      const inicio = inicioSemana.value
      const fim = addDays(inicio, 6)
      return `${format(inicio, 'dd/MM/yyyy')} - ${format(fim, 'dd/MM/yyyy')}`
    })
    const semanaAtualSelecionada = computed(() => isSameDay(inicioSemana.value, inicioSemanaAtual))
    const kickerControles = computed(() => (podeTrocarQuadra.value ? 'FILTROS' : 'UNIDADE'))
    const tituloControles = computed(() => (podeTrocarQuadra.value ? 'Selecione a Quadra ' : 'Quadra vinculada'))
    const subtituloControles = computed(() => {
      if (podeTrocarQuadra.value) {
        return 'A grade abaixo reflete a quadra selecionada. Clique em um horário reservado para abrir os detalhes.'
      }

      return 'Esta agenda exibe apenas a unidade vinculada ao seu perfil administrativo.'
    })

    const normalizarHorarioStr = (valor) => {
      const texto = String(valor || '').trim()
      const match = texto.match(/^(\d{1,2}):(\d{1,2})/)
      if (!match) return ''

      const hora = Number(match[1])
      const minuto = Number(match[2])
      if (!Number.isInteger(hora) || hora < 0 || hora > 23) return ''
      if (!Number.isInteger(minuto) || minuto < 0 || minuto > 59) return ''

      return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`
    }

    const extrairHoraMinutoStr = (ag) => {
      if (ag.datahora) {
        const d = new Date(ag.datahora)
        return normalizarHorarioStr(format(d, 'HH:mm'))
      }
      return normalizarHorarioStr(`${String(ag.hora).padStart(2, '0')}:00`)
    }

    const obterPrimeiroNome = (nomeCompleto) => {
      const nome = String(nomeCompleto || '').trim()
      if (!nome) return ''
      return nome.split(/\s+/)[0] || ''
    }

    const formatarTipoLabel = (tipo) => {
      const valor = String(tipo || '').trim().toUpperCase()
      if (!valor) return ''
      return valor.charAt(0) + valor.slice(1).toLowerCase()
    }

    const obterDescricaoReserva = (agendamento) => {
      const permissaoId = Number(agendamento?.usuario?.permissaoId)
      const nomeTime = String(agendamento?.time?.nome || '').trim()
      const nomeModalidade = String(agendamento?.modalidade?.nome || '').trim()
      const descricaoOutro = String(agendamento?.descricao || '').trim()
      const tipo = String(agendamento?.tipo || '').trim().toUpperCase()

      if (permissaoId === 5 && nomeTime) {
        return nomeTime
      }

      if (tipo === 'TREINO' || tipo === 'AMISTOSO') {
        return nomeModalidade || formatarTipoLabel(tipo)
      }

      if (tipo === 'EVENTO') return 'Evento'
      if (tipo === 'OUTRO') return descricaoOutro || 'Outro'
      if (tipo === 'CAMPEONATO' || agendamento?.campeonatoId) return 'Campeonato'

      return formatarTipoLabel(tipo) || nomeModalidade || nomeTime || 'Reservado'
    }

    const obterTextoAgendamento = (agendamento) => {
      const primeiroNome = obterPrimeiroNome(agendamento?.usuario?.nome)
      const descricaoReserva = obterDescricaoReserva(agendamento)

      if (primeiroNome && descricaoReserva) return `${primeiroNome} - ${descricaoReserva}`
      return primeiroNome || descricaoReserva || 'Reservado'
    }

    const buscarQuadras = async () => {
      try {
        const { data } = await api.get('/quadra')
        const usuarioQuadraId = Number(authStore.usuario?.quadraId)
        const quadraDoUsuario = data.find((q) => Number(q.id) === usuarioQuadraId)

        quadras.value = data
        if (data.length > 0) {
          quadraSelecionada.value = quadraDoUsuario ? quadraDoUsuario.id : data[0].id
        }

        if (quadraSelecionada.value) {
          await carregarTudo()
        }
      } catch (error) {
        console.error('Erro ao carregar quadras', error)
      } finally {
        carregandoInicial.value = false
      }
    }

    const carregarTudo = async () => {
      if (!quadraSelecionada.value) return
      isLoading.value = true
      gradeMontada.value = []
      diasSemanaHeader.value = []
      maxSlots.value = 0

      try {
        let slotsConfig = []
        try {
          const rotaGrade = `/public/grade-horarios/${quadraSelecionada.value}`
          const res = await api.get(rotaGrade)
          slotsConfig = res.data
        } catch (e) {
          console.warn('Grade não configurada.')
        }

        let diasAtivosIndices = []
        if (!slotsConfig || slotsConfig.length === 0) {
          diasAtivosIndices = [0, 1, 2, 3, 4, 5, 6]
          for (let d = 0; d <= 6; d++) {
            for (let h = 7; h < 23; h++) {
              slotsConfig.push({ diaSemana: d, horario: formatarHoraIntParaString(h) })
            }
          }
        } else {
          const diasSet = new Set(slotsConfig.map((s) => s.diaSemana))
          diasAtivosIndices = [...diasSet].sort()
        }

        const rotaAgendamentosSemana = `/public/agendamentos/quadra/${quadraSelecionada.value}/confirmados/semana`
        const agendamentosRes = await api.get(
          rotaAgendamentosSemana,
          {
            params: {
              inicio: format(inicioSemana.value, 'yyyy-MM-dd'),
            },
          },
        )
        const agendamentos = agendamentosRes.data

        for (let i = 0; i < 7; i++) {
          const dataDoDia = addDays(inicioSemana.value, i)
          const diaSemanaBanco = dataDoDia.getDay()

          if (!diasAtivosIndices.includes(diaSemanaBanco)) continue

          const diaStr = format(dataDoDia, 'dd/MM')
          const nomeDia = format(dataDoDia, 'EEEE', { locale: ptBR })
          const textoHeader = nomeDia.charAt(0).toUpperCase() + nomeDia.slice(1).split('-')[0] + ', ' + diaStr
          diasSemanaHeader.value.push(textoHeader)

          const slotsDoDia = slotsConfig.filter((s) => {
            const ds = s.diaSemana !== undefined ? s.diaSemana : s.dia_semana
            return Number(ds) === diaSemanaBanco
          })
          const agendamentosDoDia = agendamentos.filter((a) => {
            const dataAg = a.datahora ? new Date(a.datahora) : new Date(a.ano, a.mes - 1, a.dia)
            return isSameDay(dataAg, dataDoDia)
          })

          const agendamentoPorHorario = new Map()
          agendamentosDoDia.forEach((a) => {
            const horario = extrairHoraMinutoStr(a)
            if (!horario || agendamentoPorHorario.has(horario)) return
            agendamentoPorHorario.set(horario, a)
          })

          const slotsBaseNormalizados = slotsDoDia
            .map((slot) => {
              const horario = normalizarHorarioStr(slot.horario)
              if (!horario) return null
              return { ...slot, horario }
            })
            .filter(Boolean)

          const horariosExtras = [...agendamentoPorHorario.keys()]
            .filter((horarioAg) => !slotsBaseNormalizados.some((slot) => slot.horario === horarioAg))
            .map((horarioAg) => ({
              diaSemana: diaSemanaBanco,
              horario: horarioAg,
            }))

          const slotsCompletos = [...slotsBaseNormalizados, ...horariosExtras]
          slotsCompletos.sort((a, b) => a.horario.localeCompare(b.horario))

          const colunaDoDia = slotsCompletos.map((slot) => {
            const agendamentoEncontrado = agendamentoPorHorario.get(slot.horario) || null

            return {
              horario: slot.horario,
              ocupado: !!agendamentoEncontrado,
              texto: agendamentoEncontrado
                ? obterTextoAgendamento(agendamentoEncontrado)
                : 'Disponível',
              dadosAgendamento: agendamentoEncontrado
            }
          })

          gradeMontada.value.push(colunaDoDia)
          if (colunaDoDia.length > maxSlots.value) maxSlots.value = colunaDoDia.length
        }
      } catch (err) {
        console.error('Erro ao montar grade:', err)
      } finally {
        isLoading.value = false
      }
    }

    const irParaSemanaAnterior = async () => {
      inicioSemana.value = subWeeks(inicioSemana.value, 1)
      await carregarTudo()
    }

    const irParaSemanaAtual = async () => {
      inicioSemana.value = startOfWeek(new Date(), { weekStartsOn: 1 })
      await carregarTudo()
    }

    const irParaProximaSemana = async () => {
      inicioSemana.value = addWeeks(inicioSemana.value, 1)
      await carregarTudo()
    }

    const abrirDetalhes = (celula) => {
      if (celula.ocupado && celula.dadosAgendamento) {
        agendamentoSelecionado.value = celula.dadosAgendamento
      }
    }

    onMounted(() => {
      buscarQuadras()
    })

    return {
      quadras,
      carregandoInicial,
      quadraSelecionada,
      isLoading,
      agendamentoSelecionado,
      diasSemanaHeader,
      gradeMontada,
      maxSlots,
      podeTrocarQuadra,
      nomeQuadraSelecionada,
      faixaSemana,
      semanaAtualSelecionada,
      kickerControles,
      tituloControles,
      subtituloControles,
      buscarQuadras,
      carregarTudo,
      irParaSemanaAnterior,
      irParaSemanaAtual,
      irParaProximaSemana,
      abrirDetalhes
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

.layout-publico {
  display: block;
}

.conteudo {
  flex: 1;
  margin-left: 250px;
  padding: 20px 32px 32px;
  min-width: 0;
  overflow-x: hidden;
}

.conteudo-publico {
  margin-left: 0;
  margin-top: 64px;
  padding: 20px 60px;
}

.conteudo-publico .page-header {
  margin-bottom: 12px;
}

.conteudo-publico .header-copy {
  max-width: 660px;
}

.conteudo-publico .title {
  margin: 8px 0 6px;
  font-size: 34px;
  line-height: 1;
  letter-spacing: -0.04em;
  font-weight: 400;
}

.conteudo-publico .page-subtitle {
  margin: 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.45;
  max-width: none;
  white-space: nowrap;
}

.page-nav {
  margin-bottom: 18px;
}

.page-header {
  margin-bottom: 22px;
}

.header-copy,
.panel-copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.header-topline,
.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.panel-head {
  margin-bottom: 16px;
}

.title {
  margin: 8px 0 6px;
  color: #2563eb;
  font-size: 34px;
  line-height: 1;
  letter-spacing: -0.04em;
}

.page-subtitle,
.section-subtitle,
.metric-caption,
.state-copy {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: #64748b;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.overview-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 18px 14px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  box-shadow: 0 14px 24px rgba(15, 23, 42, 0.06);
}

.metric-kicker,
.section-kicker {
  margin: 0;
  font-size: 12px;
  line-height: 1;
  letter-spacing: 0.16em;
  font-weight: 800;
  text-transform: uppercase;
  color: #2563eb;
}

.metric-value {
  margin: 0;
  font-size: 30px;
  line-height: 1;
  font-weight: 800;
  color: #0f172a;
}

.overview-card-slots .metric-value {
  color: #059669;
}

.overview-card-reserved .metric-value {
  color: #d97706;
}

.controls-panel,
.schedule-panel {
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 14px 24px rgba(15, 23, 42, 0.06);
}

.controls-panel {
  margin-bottom: 18px;
}

.section-title {
  margin: 0;
  font-size: 20px;
  line-height: 1.15;
  font-weight: 800;
  color: #0f172a;
}

.section-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
}

.section-title-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.week-range {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}

.section-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.week-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-week {
  min-height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #ffffff;
  color: #334155;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, opacity 0.2s ease;
}

.btn-week:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.28);
  color: #2563eb;
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.08);
}

.btn-week:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-week-current {
  background: rgba(37, 99, 235, 0.08);
  border-color: rgba(37, 99, 235, 0.18);
  color: #2563eb;
}

.controls-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.filter-label {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.select-quadra {
  width: 100%;
  min-height: 46px;
  padding: 0 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #f8fafc;
  font-size: 14px;
  color: #334155;
}

.select-quadra:focus {
  outline: none;
  border-color: rgba(37, 99, 235, 0.45);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.quadra-fixa {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 46px;
  padding: 0 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #f8fafc;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.tabela-container {
  position: relative;
  min-height: 320px;
}

.tabela-shell {
  overflow-x: auto;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 20px;
  background: #ffffff;
}

.tabela-horarios {
  width: 100%;
  min-width: 1000px;
  border-collapse: separate;
  border-spacing: 0;
  text-align: center;
  font-size: 13px;
}

.tabela-horarios th,
.tabela-horarios td {
  padding: 8px 10px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.tabela-horarios th:last-child,
.tabela-horarios td:last-child {
  border-right: none;
}

.tabela-horarios tbody tr:last-child td {
  border-bottom: none;
}

.header-dia {
  background: #1e3a8a;
  color: #ffffff;
  font-size: 13px;
  text-transform: uppercase;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.sub-header th {
  background: #eff6ff;
  color: #1e293b;
  font-weight: 800;
  font-size: 12px;
}

.col-min,
.celula-hora {
  width: 62px;
  background: #f8fafc;
  font-weight: 800;
  color: #475569;
}

.celula-status {
  cursor: default;
  transition: background 0.2s ease, color 0.2s ease;
}

.celula-status.reservado {
  color: #1e40af;
  font-weight: 800;
  cursor: pointer;
  background: rgba(37, 99, 235, 0.1);
}

.celula-status.reservado:hover {
  background: rgba(37, 99, 235, 0.16);
}

.celula-status.livre {
  color: #94a3b8;
}

.celula-vazia {
  color: #cbd5e1;
  font-weight: 800;
  letter-spacing: 1px;
  user-select: none;
  background: #f8fafc;
  vertical-align: middle;
}

.linha-branca td {
  background: #ffffff;
}

.linha-cinza td {
  background: #fbfdff;
}

.linha-branca .celula-hora,
.linha-cinza .celula-hora,
.linha-branca .celula-vazia,
.linha-cinza .celula-vazia {
  background: #f8fafc;
}

.linha-branca .celula-status.reservado,
.linha-cinza .celula-status.reservado {
  background: rgba(37, 99, 235, 0.1);
}

.loader-container-centralizado {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 180px;
}

.loader-overlay,
.state-card {
  min-height: 320px;
  border-radius: 20px;
  background: #f8fafc;
}

.loader-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(248, 250, 252, 0.9);
  z-index: 2;
}

.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  padding: 24px;
  border: 1px dashed rgba(148, 163, 184, 0.35);
}

.state-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

@media (max-width: 1200px) {
  .overview-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {

  .controls-row,
  .panel-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-topline,
  .section-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .conteudo {
    margin-left: 0;
    padding: 12px 14px 18px;
  }

  .page-nav {
    margin-bottom: 12px;
  }

  .conteudo-publico {
    margin-top: 42px;
    padding: 12px 14px 16px;
  }

  .conteudo-publico .page-header {
    margin-top: -15px;
    margin-bottom: 12px;
  }

  .conteudo-publico .header-copy {
    max-width: 100%;
  }

  .conteudo-publico .title {
    margin: 0 0 8px;
    font-size: 30px;
    line-height: 1.04;
    letter-spacing: -0.04em;
  }

  .conteudo-publico .page-subtitle {
    margin-top: 0;
    font-size: 14px;
    line-height: 1.55;
    white-space: normal;
  }

  .title {
    font-size: 24px;
    line-height: 1.12;
  }

  .overview-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .overview-card {
    padding: 10px 8px 9px;
    border-radius: 14px;
    gap: 5px;
  }

  .metric-kicker {
    font-size: 9px;
    letter-spacing: 0.08em;
  }

  .metric-value {
    font-size: 20px;
  }

  .metric-caption {
    font-size: 9px;
    line-height: 1.25;
  }

  .controls-panel,
  .schedule-panel {
    padding: 18px;
    border-radius: 22px;
  }

  .controls-row {
    flex-direction: row;
    width: 100%;
    align-items: stretch;
  }

  .section-topline {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    column-gap: 10px;
    row-gap: 12px;
  }

  .section-actions {
    display: contents;
  }

  .section-title-block {
    min-width: 0;
  }

  .week-toolbar {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
  }

  .btn-week {
    width: 100%;
  }

  .tabela-container,
  .loader-overlay,
  .state-card {
    min-height: 260px;
  }
}
</style>
