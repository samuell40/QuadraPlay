<template>
  <div class="layout" :class="{ 'layout-publico': publico }">
    <template v-if="publico">
      <NavBarHome />
    </template>
    <template v-else>
      <SideBar />
    </template>

    <div class="conteudo" :class="{ 'conteudo-publico': publico }">
      <NavBarUse v-if="!publico" class="page-nav" />

      <section class="page-header">
        <div class="header-copy">
          <div class="header-topline">
            <h1 class="title">{{ publico ? 'Horários' : 'Grade Semanal' }}</h1>
          </div>
          <p v-if="publico" class="page-subtitle">
            Consulte a grade semanal das quadras, acompanhe reservas e veja os horários disponíveis.
          </p>
        </div>
      </section>

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
                  <button type="button" class="btn-week" @click="irParaSemanaAnterior" :disabled="isLoading || !quadraSelecionada">
                    Semana anterior
                  </button>
                  <button
                    type="button"
                    class="btn-week btn-week-current"
                    @click="irParaSemanaAtual"
                    :disabled="isLoading || !quadraSelecionada || semanaAtualSelecionada"
                  >
                    Semana atual
                  </button>
                  <button type="button" class="btn-week" @click="irParaProximaSemana" :disabled="isLoading || !quadraSelecionada">
                    Próxima semana
                  </button>
                </div>
              <button v-if="!publico" @click="gerarPDF" class="btn-pdf" :disabled="isLoading || !quadraSelecionada" title="Gerar PDF">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path>
                  <path d="M14 2v6h6"></path>
                  <text x="5" y="17" font-size="7" font-family="Arial, sans-serif" font-weight="bold" fill="currentColor" stroke="none">PDF</text>
                </svg>
                <span class="btn-pdf-label btn-pdf-label-desktop">Relátorio PDF</span>
                <span class="btn-pdf-label btn-pdf-label-mobile">PDF</span>
              </button>
              </div>
            </div>
            <p class="section-subtitle">
              Horários livres ficam apenas para consulta. Horários reservados podem ser abertos para ver o agendamento.
            </p>
          </div>
        </div>

        <div class="tabela-container">
          <div v-if="isLoading" class="loader-overlay">
            <LoadingState
              size="compact"
              title="Carregando grade de horários"
              description="Montando a disponibilidade e as reservas da semana selecionada."
            />
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
                <tr v-for="slotIndex in maxSlots" :key="slotIndex" :class="slotIndex % 2 === 0 ? 'linha-branca' : 'linha-cinza'">
                  <template v-for="(colunaDia, colIndex) in gradeMontada" :key="colIndex">
                    <template v-if="colunaDia[slotIndex - 1]">
                      <td class="celula-hora">{{ colunaDia[slotIndex - 1].horario }}</td>
                      <td
                        class="celula-status"
                        :class="{
                          reservado: colunaDia[slotIndex - 1].ocupado,
                          livre: !colunaDia[slotIndex - 1].ocupado
                        }"
                        @click="abrirDetalhes(colunaDia[slotIndex - 1])"
                      >
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
    </div>

    <Footer v-if="publico" />

    <DetalheAgendModal
      v-if="agendamentoSelecionado"
      :agendamento="agendamentoSelecionado"
      @fechar="agendamentoSelecionado = null"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { startOfWeek, addDays, addWeeks, subWeeks, format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '@/axios'
import { useAuthStore } from '@/store'
import SideBar from '@/components/SideBar.vue'
import NavBarUse from '@/components/NavBarUser.vue'
import NavBarHome from '@/components/NavBarHome.vue'
import Footer from '@/components/Footer.vue'
import DetalheAgendModal from '@/components/modals/Agendamentos/DetalharAgendModal.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import logoImg from '@/assets/logo.png'
import { obterTextoAgendamento } from '@/utils/agendamentoExibicao'

export default {
  name: 'HorariosView',
  components: { SideBar, NavBarUse, NavBarHome, Footer, DetalheAgendModal, LoadingState },
  props: {
    publico: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const authStore = useAuthStore()
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

    const podeTrocarQuadra = computed(() => props.publico || Number(authStore.usuario?.permissaoId) === 1)

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

    const totalDiasAtivos = computed(() => diasSemanaHeader.value.length)
    const totalSlotsConfigurados = computed(() => {
      return gradeMontada.value.reduce((sum, coluna) => sum + coluna.length, 0)
    })
    const totalReservasSemana = computed(() => {
      return gradeMontada.value.reduce((sum, coluna) => {
        return sum + coluna.filter((slot) => slot.ocupado).length
      }, 0)
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

    const buscarQuadras = async () => {
      try {
        const { data } = await api.get('/quadra')
        const usuarioQuadraId = Number(authStore.usuario?.quadraId)
        const quadraDoUsuario = data.find((q) => Number(q.id) === usuarioQuadraId)

        if (!props.publico && Number(authStore.usuario?.permissaoId) === 2) {
          quadras.value = quadraDoUsuario ? [quadraDoUsuario] : []
          quadraSelecionada.value = quadraDoUsuario?.id || null
        } else {
          quadras.value = data
          if (data.length > 0) {
            quadraSelecionada.value = quadraDoUsuario ? quadraDoUsuario.id : data[0].id
          }
        }

        if (quadraSelecionada.value) {
          carregarTudo()
        }
      } catch (error) {
        console.error('Erro ao carregar quadras', error)
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
          const rotaGrade = props.publico
            ? `/public/grade-horarios/${quadraSelecionada.value}`
            : `/grade-horarios/${quadraSelecionada.value}`
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

        const rotaAgendamentosSemana = props.publico
          ? `/public/agendamentos/quadra/${quadraSelecionada.value}/confirmados/semana`
          : `/agendamentos/quadra/${quadraSelecionada.value}/confirmados/semana`
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

    const truncarTextoPdf = (texto, limite = 28) => {
      const valor = String(texto || '').trim()
      if (!valor) return ''
      return valor.length > limite ? `${valor.slice(0, limite - 3)}...` : valor
    }

    const normalizarNomeArquivo = (texto) => {
      return String(texto || 'grade')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase()
    }

    const gerarPDF = async () => {
      const doc = new jsPDF('l', 'mm', 'a4')
      const nomeQuadra = nomeQuadraSelecionada.value
      const totalDias = totalDiasAtivos.value
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margemX = 8
      const dataGeracao = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      const nomeArquivoQuadra = normalizarNomeArquivo(nomeQuadra)

      const cores = {
        header: [15, 23, 42],
        headerAccent: [56, 189, 248],
        primary: [29, 78, 216],
        primarySoft: [219, 234, 254],
        primarySoftAlt: [239, 246, 255],
        success: [22, 163, 74],
        successSoft: [240, 253, 244],
        muted: [100, 116, 139],
        surface: [248, 250, 252],
        border: [203, 213, 225],
        text: [15, 23, 42],
        white: [255, 255, 255],
        emptyBg: [241, 245, 249],
        emptyText: [148, 163, 184],
      }

      const PDF_STATUS_DISPONIVEL = 'Disponível'
      const PDF_STATUS_SEM_GRADE = 'Sem grade'

      const desenharCampoInformativo = (x, y, largura, titulo, texto, opcoes = {}) => {
        const {
          altura = 12,
          fillColor = cores.surface,
          borderColor = cores.border,
          titleColor = cores.text,
          bodyColor = cores.muted,
          accentColor = null,
        } = opcoes

        doc.setFillColor(...fillColor)
        doc.setDrawColor(...borderColor)
        doc.roundedRect(x, y, largura, altura, 3, 3, 'FD')

        let textoX = x + 4
        if (accentColor) {
          doc.setFillColor(...accentColor)
          doc.roundedRect(x, y, 4, altura, 3, 3, 'F')
          textoX = x + 7
        }

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.8)
        doc.setTextColor(...titleColor)
        doc.text(titulo, textoX, y + 4.4)

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...bodyColor)
        doc.text(texto, textoX, y + 9)
      }

      const desenharInformacoesExtras = (y) => {
        const gap = 4
        const larguraTotal = pageWidth - margemX * 2
        const larguraObservacao = 176
        const larguraInternet = larguraTotal - larguraObservacao - gap

        desenharCampoInformativo(
          margemX,
          y,
          larguraObservacao,
          'Observação',
          'Horários sujeitos a alterações com aviso prévio.',
          {
            altura: 13,
            fillColor: [255, 247, 237],
            borderColor: [253, 186, 116],
            titleColor: [194, 65, 12],
            bodyColor: [154, 52, 18],
            accentColor: [234, 88, 12],
          }
        )

        desenharCampoInformativo(
          margemX + larguraObservacao + gap,
          y,
          larguraInternet,
          'Internet',
          'LOGIN: METODÃO  |  SENHA: desafio2022',
          {
            altura: 13,
          }
        )
      }

      const desenharResumoSuperior = (y) => {
        const larguraWifi = 104

        desenharCampoInformativo(
          pageWidth - margemX - larguraWifi,
          y - 5.8,
          larguraWifi,
          'Wi-Fi da quadra',
          'LOGIN: METODAO | SENHA: desafio2022',
          {
            altura: 11.6,
            fillColor: [239, 246, 255],
            borderColor: [147, 197, 253],
            titleColor: [29, 78, 216],
            bodyColor: [30, 64, 175],
            accentColor: [37, 99, 235],
          }
        )
      }

      void desenharInformacoesExtras

      const desenharAvisoAbaixoDaGrade = (y) => {
        desenharCampoInformativo(
          margemX,
          y,
          pageWidth - margemX * 2,
          'Observação',
          'Horários sujeitos a alterações com aviso prévio.',
          {
            altura: 12.8,
            fillColor: [255, 247, 237],
            borderColor: [253, 186, 116],
            titleColor: [194, 65, 12],
            bodyColor: [154, 52, 18],
            accentColor: [234, 88, 12],
          }
        )
      }

      const desenharRodape = (paginaAtual, totalPaginas) => {
        doc.setDrawColor(...cores.border)
        doc.line(margemX, pageHeight - 8.5, pageWidth - margemX, pageHeight - 8.5)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(...cores.muted)
        doc.text(`Agenda semanal • ${nomeQuadra}`, margemX, pageHeight - 4.6)
        doc.text(`Página ${paginaAtual}/${totalPaginas}`, pageWidth - margemX, pageHeight - 4.6, { align: 'right' })
      }

      const desenharCabecalhoContinuidade = () => {
        doc.setFillColor(...cores.header)
        doc.rect(0, 0, pageWidth, 14, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(...cores.white)
        doc.text('QuadraPlay', margemX, 8.8)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(191, 219, 254)
        doc.text(`${nomeQuadra} • ${faixaSemana.value}`, pageWidth - margemX, 8.8, { align: 'right' })
      }

      doc.setFillColor(...cores.header)
      doc.rect(0, 0, pageWidth, 18, 'F')
      doc.setFillColor(...cores.headerAccent)
      doc.rect(0, 0, pageWidth, 2.2, 'F')

      const img = new Image()
      img.src = logoImg
      try {
        await new Promise((r) => {
          img.onload = r
          img.onerror = r
        })
        doc.addImage(img, 'PNG', margemX, 4, 10, 10)
      } catch (e) {
        console.warn('Logo não carregada no PDF', e)
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      doc.setTextColor(...cores.white)
      doc.text('QuadraPlay', 21, 9.5)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(191, 219, 254)
      doc.text('Agenda operacional da semana', 21, 14.2)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(191, 219, 254)
      doc.text(`Gerado em ${dataGeracao}`, pageWidth - margemX, 9.8, { align: 'right' })
      doc.text(faixaSemana.value, pageWidth - margemX, 14.2, { align: 'right' })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(...cores.text)
      doc.text(`Agenda de ${nomeQuadra}`, margemX, 28)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...cores.muted)
      doc.text(
        `Grade semanal com ${totalDias} ${totalDias === 1 ? 'dia ativo' : 'dias ativos'} e visão consolidada das reservas confirmadas.`,
        margemX,
        33
      )

      const diasAtivos = gradeMontada.value.length
      const totalSlots = maxSlots.value
      const layoutCompacto = diasAtivos >= 6 || totalSlots >= 15
      const layoutMuitoCompacto = diasAtivos >= 7 || totalSlots >= 18
      const larguraUtilPagina = pageWidth - margemX * 2
      const larguraColunaHora = layoutMuitoCompacto ? 9 : layoutCompacto ? 10 : 12
      const larguraTotalHoras = diasAtivos * larguraColunaHora
      const espacoParaTimes = Math.max(
        larguraUtilPagina - larguraTotalHoras,
        diasAtivos * (layoutMuitoCompacto ? 14 : layoutCompacto ? 16 : 18)
      )
      const larguraColunaTime = diasAtivos > 0 ? espacoParaTimes / diasAtivos : 0
      const limiteTruncagemReserva = layoutMuitoCompacto ? 14 : layoutCompacto ? 18 : 22
      const inicioTabelaY = 43
      const margemInferiorTabela = 16
      const fonteTabela = layoutMuitoCompacto ? 5.8 : layoutCompacto ? 6.4 : 7.1
      const paddingTabela = layoutMuitoCompacto ? 0.82 : layoutCompacto ? 0.98 : 1.18
      const alturaCabecalhoPrincipal = layoutMuitoCompacto ? 5.5 : layoutCompacto ? 6.3 : 7.2
      const alturaCabecalhoSecundario = layoutMuitoCompacto ? 4.4 : layoutCompacto ? 5.1 : 5.8
      const espacoReservadoAbaixo = 31
      const alturaCorpoBase = layoutMuitoCompacto ? 4.15 : layoutCompacto ? 4.75 : 5.35
      const alturaCorpoMaxima = layoutMuitoCompacto ? 5 : layoutCompacto ? 5.6 : 6.25
      const alturaCorpoTabela = maxSlots.value > 0
        ? Math.max(
          alturaCorpoBase,
          Math.min(
            alturaCorpoMaxima,
            (pageHeight - inicioTabelaY - espacoReservadoAbaixo - alturaCabecalhoPrincipal - alturaCabecalhoSecundario) / maxSlots.value
          )
        )
        : alturaCorpoBase
      const estilosColunas = {}
      const totalColunasTabela = diasAtivos * 2

      for (let i = 0; i < totalColunasTabela; i++) {
        estilosColunas[i] = {
          cellWidth: i % 2 === 0 ? larguraColunaHora : larguraColunaTime,
          overflow: 'ellipsize',
        }
      }

      const head1 = diasSemanaHeader.value.map((dia) => ({
        content: dia,
        colSpan: 2,
        styles: { halign: 'center', fillColor: cores.primary, textColor: 255, fontStyle: 'bold' }
      }))

      const head2 = []
      for (let i = 0; i < diasAtivos; i++) {
        head2.push({
          content: layoutCompacto ? 'Hr' : 'Hora',
          styles: { halign: 'center', fillColor: cores.surface, textColor: cores.muted, fontStyle: 'bold' }
        })
        head2.push({
          content: layoutMuitoCompacto ? 'Res.' : 'Reserva',
          styles: { halign: 'center', fillColor: cores.surface, textColor: cores.muted, fontStyle: 'bold' }
        })
      }

      const body = []
      for (let i = 0; i < maxSlots.value; i++) {
        const row = []
        for (let d = 0; d < diasAtivos; d++) {
          const slot = gradeMontada.value[d][i]
          if (slot) {
            row.push(slot.horario)
            row.push(slot.ocupado ? truncarTextoPdf(slot.texto, limiteTruncagemReserva) : PDF_STATUS_DISPONIVEL)
          } else {
            row.push('--')
            row.push(PDF_STATUS_SEM_GRADE)
          }
        }
        body.push(row)
      }

      desenharResumoSuperior(37.8)

      if (diasAtivos === 0) {
        doc.setFillColor(...cores.surface)
        doc.setDrawColor(...cores.border)
        doc.roundedRect(margemX, 50, pageWidth - margemX * 2, 30, 5, 5, 'FD')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(...cores.text)
        doc.text('Nenhum horário configurado para esta semana.', margemX + 8, 62)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...cores.muted)
        doc.text(
          'Ajuste a grade da quadra ou selecione outro período antes de exportar a agenda operacional.',
          margemX + 8,
          69
        )

      } else {
        autoTable(doc, {
          head: [head1, head2],
          body,
          startY: inicioTabelaY,
          theme: 'grid',
          margin: { left: margemX, right: margemX, top: 18, bottom: margemInferiorTabela },
          columnStyles: estilosColunas,
          styles: {
            fontSize: fonteTabela,
            cellPadding: paddingTabela,
            valign: 'middle',
            halign: 'center',
            lineColor: cores.border,
            lineWidth: 0.15,
            overflow: 'ellipsize',
            textColor: cores.text,
          },
          didParseCell: (data) => {
            const colIndex = data.column.index
            const text = String(data.cell.raw || '')

            if (data.section === 'head' && data.row.index === 0) {
              data.cell.styles.fillColor = cores.primary
              data.cell.styles.textColor = cores.white
              data.cell.styles.fontStyle = 'bold'
              data.cell.styles.minCellHeight = alturaCabecalhoPrincipal
            }

            if (data.section === 'head' && data.row.index === 1) {
              data.cell.styles.fillColor = cores.surface
              data.cell.styles.textColor = cores.muted
              data.cell.styles.fontStyle = 'bold'
              data.cell.styles.minCellHeight = alturaCabecalhoSecundario
            }

            if (data.section === 'body') {
              data.cell.styles.minCellHeight = alturaCorpoTabela

              if (colIndex % 2 === 0) {
                data.cell.styles.fillColor = [255, 255, 255]
                data.cell.styles.textColor = text === '--' ? cores.emptyText : [51, 65, 85]
                data.cell.styles.fontStyle = 'bold'
              } else if (text === PDF_STATUS_DISPONIVEL) {
                data.cell.styles.fillColor = cores.successSoft
                data.cell.styles.textColor = cores.success
                data.cell.styles.fontStyle = 'bold'
              } else if (text === PDF_STATUS_SEM_GRADE) {
                data.cell.styles.fillColor = cores.emptyBg
                data.cell.styles.textColor = cores.emptyText
                data.cell.styles.fontStyle = 'bold'
              } else {
                data.cell.styles.fillColor = cores.primarySoft
                data.cell.styles.textColor = cores.primary
                data.cell.styles.fontStyle = 'bold'
              }
            }
          },
          didDrawPage: (data) => {
            if (data.pageNumber > 1) {
              desenharCabecalhoContinuidade()
            }
          }
        })

        const paginaAviso = doc.getNumberOfPages()
        doc.setPage(paginaAviso)
        desenharAvisoAbaixoDaGrade(
          Math.min((doc.lastAutoTable?.finalY || inicioTabelaY) + 6, pageHeight - 24)
        )

      }

      const totalPaginas = doc.getNumberOfPages()
      for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        doc.setPage(pagina)
        desenharRodape(pagina, totalPaginas)
      }

      doc.save(`grade_semanal_${nomeArquivoQuadra}_${format(inicioSemana.value, 'yyyy-MM-dd')}.pdf`)
    }

    onMounted(() => {
      buscarQuadras()
    })

    return {
      quadras,
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
      totalDiasAtivos,
      totalSlotsConfigurados,
      totalReservasSemana,
      buscarQuadras,
      carregarTudo,
      irParaSemanaAnterior,
      irParaSemanaAtual,
      irParaProximaSemana,
      gerarPDF,
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
  margin: 0;
  font-size: 42px;
  line-height: 1.04;
  font-weight: 800;
  color: #2563eb;
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

.btn-pdf {
  min-height: 46px;
  padding: 0 16px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.22);
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  white-space: nowrap;
}

.btn-pdf:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-pdf-label {
  display: inline-flex;
  align-items: center;
}

.btn-pdf-label-mobile {
  display: none;
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

  .btn-pdf {
    width: auto;
    min-width: 72px;
    height: 44px;
    min-height: 44px;
    padding: 0 12px;
    gap: 6px;
    flex: 0 0 auto;
    border-radius: 14px;
  }

  .btn-pdf-label-desktop {
    display: none;
  }

  .btn-pdf-label-mobile {
    display: inline-flex;
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

  .btn-pdf {
    grid-column: 2;
    grid-row: 1;
    width: auto;
    justify-self: end;
    align-self: center;
  }

  .tabela-container,
  .loader-overlay,
  .state-card {
    min-height: 260px;
  }
}
</style>
