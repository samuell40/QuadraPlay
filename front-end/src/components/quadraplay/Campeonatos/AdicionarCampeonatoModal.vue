<template>
  <div v-if="mostrarModalTipo" class="modal-overlay" @click.self="cancelarCadastro">
    <div class="modal-content modal-escolha-tipo-campeonato">
      <div class="modal-header header-escolha-tipo">
        <h2 class="titulo-escolha-tipo">Escolha o Tipo de Campeonato</h2>
        <button type="button" class="btn-close-x" :disabled="carregandoModalidades || carregandoQuadras || carregandoTimes || salvandoCadastro" @click="cancelarCadastro">x</button>
      </div>

      <div class="tipo-campeonato-lista">
        <button
          v-for="tipo in tiposCampeonatoCards"
          :key="tipo.value"
          class="btn-tipo btn-tipo-card"
          :class="{ 'tipo-card-principal': tipoSelecionado === tipo.value }"
          @click="selecionarTipo(tipo.value)"
        >
          <span class="btn-tipo-icone" aria-hidden="true">
            <svg
              v-if="tipo.value === 'PONTOS_CORRIDOS'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-trophy-fill"
              viewBox="0 0 16 16"
            >
              <path
                d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5q0 .807-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33 33 0 0 1 2.5.5m.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935m10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935"
              />
            </svg>

            <svg
              v-else-if="tipo.value === 'PONTOS_CORRIDOS_ELIMINATORIAS'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-diagram-3-fill"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 2 7h5.5V6A1.5 1.5 0 0 1 6 4.5zm-6 8A1.5 1.5 0 0 1 1.5 10h1A1.5 1.5 0 0 1 4 11.5v1A1.5 1.5 0 0 1 2.5 14h-1A1.5 1.5 0 0 1 0 12.5zm6 0A1.5 1.5 0 0 1 7.5 10h1a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 8.5 14h-1A1.5 1.5 0 0 1 6 12.5zm6 0a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5z"
              />
            </svg>

            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-lightning-charge-fill"
              viewBox="0 0 16 16"
            >
              <path
                d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z"
              />
            </svg>
          </span>

          <span class="btn-tipo-conteudo">
            <span class="btn-tipo-titulo">{{ tipo.titulo }}</span>
            <small class="btn-tipo-sub">{{ tipo.descricao }}</small>
          </span>
        </button>
      </div>

      <div class="botoes botoes-escolha-tipo">
        <button type="button" class="btn-cancelar-escolha-tipo" :disabled="carregandoModalidades || carregandoQuadras || carregandoTimes || salvandoCadastro" @click="cancelarCadastro">Cancelar</button>
      </div>
    </div>
  </div>

  <div v-if="aberto && !mostrarModalTipo && !mostrarModalTimes && !mostrarModalAgenda" class="modal-overlay" @click.self="cancelarCadastro">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title-campeonato">Adicionar campeonato</h2>
        <button type="button" class="btn-close-x" :disabled="carregandoModalidades || carregandoQuadras || carregandoTimes || salvandoCadastro" @click="cancelarCadastro">x</button>
      </div>

      <form @submit.prevent="abrirModalTimes">
        <div class="form-group">
          <label for="nomeCampeonato">Nome do campeonato</label>
          <input
            id="nomeCampeonato"
            v-model="nomeCampeonato"
            type="text"
            placeholder="Ex: Campeonato de Futebol"
            :disabled="carregandoTimes || salvandoCadastro"
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="modalidade">Modalidade</label>
            <select id="modalidade" v-model="modalidadeSelecionada" :disabled="carregandoModalidades || carregandoTimes || salvandoCadastro" required>
              <option v-if="carregandoModalidades" value="" disabled>Carregando modalidades...</option>
              <option value="" disabled>Selecione a modalidade</option>
              <option v-for="modalidade in modalidades" :key="modalidade.id" :value="modalidade.id">
                {{ modalidade.nome }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="quadra">Quadra</label>
            <select id="quadra" v-model="quadraSelecionada" :disabled="!modalidadeSelecionada || carregandoQuadras || carregandoTimes || salvandoCadastro" required>
              <option value="" disabled v-if="!modalidadeSelecionada">Selecione antes</option>
              <option value="" disabled v-else-if="carregandoQuadras">Carregando quadras...</option>
              <option value="" disabled v-else>Selecione a quadra</option>
              <option v-for="quadra in quadras" :key="quadra.id" :value="quadra.id">
                {{ quadra.nome }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="fotoCampeonato">Foto (opcional)</label>
          <input id="fotoCampeonato" type="file" accept=".jpg,.jpeg,.png" @change="handleImagemUpload" />
          <small class="texto-ajuda">
            Recomendado: imagem horizontal (1920 x 600 px).<br>
            Tamanho m&iacute;nimo: 1280 x 400 px.
          </small>
        </div>

        <div class="botoes">
          <button type="submit" class="btn-save" :disabled="carregandoTimes || carregandoModalidades || carregandoQuadras || salvandoCadastro">
            <span class="btn-inline-content">
              <span v-if="carregandoTimes" class="btn-save-spinner" aria-hidden="true"></span>
              <span>{{ carregandoTimes ? 'Carregando...' : 'Continuar' }}</span>
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>

  <div v-if="mostrarModalTimes" class="modal-overlay" @click.self="voltarParaDados">
    <div class="modal-content modal-times">
      <div class="modal-header">
        <h2>Selecione os times (opcional)</h2>
        <button type="button" class="btn-close-x" :disabled="carregandoTimes || salvandoCadastro" @click="voltarParaDados">x</button>
      </div>

      <div class="contador">{{ timesSelecionados.length }} selecionado(s)</div>
      <p class="times-opcional-dica">Caso n&atilde;o queira selecionar agora, voc&ecirc; poder&aacute; adicionar depois na tela de Gerenciar Equipes.</p>

      <div v-if="times.length" class="lista-times">
        <div
          v-for="time in times"
          :key="time.id"
          class="time-card"
          :class="{ selecionado: timesSelecionados.includes(time.id) }"
          @click="toggleTime(time.id)"
        >
          <div class="time-card-top">
            <div class="time-foto">
              <img :src="obterFotoTimeCard(time.foto)" :alt="time.nome">
            </div>
            <h3 class="time-nome">{{ time.nome }}</h3>
          </div>

          <span>{{ time._count?.jogadores }} jogadores</span>
        </div>
      </div>
      <div v-else class="estado-times-vazio">
        <p class="estado-times-vazio-titulo">Nenhum time cadastrado para essa modalidade.</p>
        <p class="estado-times-vazio-descricao">Voc&ecirc; precisa ir para a tela de Gerenciar Times e adicionar os times por l&aacute;.</p>
        <button
          type="button"
          class="btn-ir-gerenciar-times"
          :disabled="salvandoCadastro"
          @click="irParaGerenciarTimes"
        >
          Clique aqui para gerenciar times
        </button>
      </div>

      <div class="botoes botoes-acao-dupla">
        <button type="button" class="btn-cancelar-escolha-tipo" :disabled="carregandoTimes || salvandoCadastro" @click="voltarParaDados">Voltar</button>
        <button class="btn-save" :disabled="carregandoTimes || salvandoCadastro" @click="abrirModalAgenda">Continuar</button>
      </div>
    </div>
  </div>

  <div v-if="mostrarModalAgenda" class="modal-overlay" @click.self="voltarParaTimes">
    <div class="modal-content modal-agenda-campeonato">
      <div class="modal-header">
        <div class="agenda-header-copy">
          <h2>Datas e horários do campeonato</h2>
          <p class="agenda-subtitle">Configure os horários base da quadra para esta competição.</p>
        </div>
        <button type="button" class="btn-close-x" :disabled="salvandoCadastro" @click="voltarParaTimes">x</button>
      </div>

      <AgendaCampeonatoEditor
        v-model="agendaPorData"
        :min-date="dataMinimaAgenda"
        :disabled="salvandoCadastro"
      />

      <div class="botoes botoes-acao-dupla">
        <button type="button" class="btn-cancelar-escolha-tipo" :disabled="salvandoCadastro" @click="voltarParaTimes">Voltar</button>
        <button class="btn-save" :disabled="salvandoCadastro" @click="finalizarCadastro">
          <span class="btn-inline-content">
            <span v-if="salvandoCadastro" class="btn-save-spinner" aria-hidden="true"></span>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="btn-save-icon"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
              <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05"/>
            </svg>
            <span>{{ salvandoCadastro ? 'Salvando...' : 'Criar campeonato' }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2'
import api from '@/axios'
import AgendaCampeonatoEditor from './AgendaCampeonatoEditor.vue'
import { obterFotoTime } from '@/utils/timeImagem'

  export default {
  name: 'AdicionarCampeonatoModal',
  components: { AgendaCampeonatoEditor },
  props: {
    aberto: { type: Boolean, default: false }
  },

  data() {
    return {
      mostrarModalTipo: false,
      tipoSelecionado: '',
      modalidades: [],
      quadras: [],
      modalidadeSelecionada: '',
      quadraSelecionada: '',
      nomeCampeonato: '',
      arquivoFoto: null,
      mostrarModalTimes: false,
      mostrarModalAgenda: false,
      times: [],
      timesSelecionados: [],
      usuarioLogado: null,
      novaDataAgenda: '',
      dataAgendaSelecionada: '',
      agendaPorData: [],
      showGeradorAgenda: false,
      showReplicarAgenda: false,
      datasParaReplicarAgenda: [],
      novoHorarioInputAgenda: '',
      geradorAgenda: {
        inicio: '07:00',
        fim: '23:00',
        duracao: 60
      },
      carregandoModalidades: false,
      carregandoQuadras: false,
      carregandoTimes: false,
      salvandoCadastro: false
    }
  },

  watch: {
    aberto(valor) {
      if (valor) {
        this.limparCampos()
        this.carregarUsuarioLogado()
        this.mostrarModalTipo = true
        this.carregarModalidades()
      } else {
        this.limparCampos()
      }
    },
    modalidadeSelecionada(valor) {
      this.quadraSelecionada = ''
      this.times = []
      this.timesSelecionados = []

      if (valor) {
        this.carregarQuadras(valor)
      } else {
        this.quadras = []
      }
    }
  },

  computed: {
    tiposCampeonatoCards() {
      return [
        {
          value: 'PONTOS_CORRIDOS',
          titulo: 'Pontos Corridos',
          descricao: 'Tabela única com classificação geral'
        },
        {
          value: 'PONTOS_CORRIDOS_ELIMINATORIAS',
          titulo: 'Pontos Corridos + Eliminatórias',
          descricao: 'Primeira fase em liga e depois mata-mata'
        },
        {
          value: 'ELIMINATORIAS',
          titulo: 'Eliminatórias',
          descricao: 'Competição no formato mata-mata'
        }
      ]
    },
    dataMinimaAgenda() {
      const data = new Date()
      data.setHours(0, 0, 0, 0)
      data.setDate(data.getDate() + 1)

      const ano = data.getFullYear()
      const mes = String(data.getMonth() + 1).padStart(2, '0')
      const dia = String(data.getDate()).padStart(2, '0')
      return `${ano}-${mes}-${dia}`
    },
    datasAgendaOrdenadas() {
      return [...this.agendaPorData].sort((a, b) => a.data.localeCompare(b.data))
    },
    agendaSelecionada() {
      return this.agendaPorData.find((item) => item.data === this.dataAgendaSelecionada) || null
    }
  },

  methods: {
    obterFotoTimeCard(foto) {
      return obterFotoTime(foto)
    },
    carregarUsuarioLogado() {
      try {
        this.usuarioLogado = JSON.parse(localStorage.getItem('usuario') || 'null')
      } catch (error) {
        this.usuarioLogado = null
      }
    },

    limparCampos() {
      this.mostrarModalTipo = false
      this.tipoSelecionado = ''
      this.modalidadeSelecionada = ''
      this.quadraSelecionada = ''
      this.nomeCampeonato = ''
      this.arquivoFoto = null
      this.mostrarModalTimes = false
      this.mostrarModalAgenda = false
      this.times = []
      this.timesSelecionados = []
      this.novaDataAgenda = ''
      this.dataAgendaSelecionada = ''
      this.agendaPorData = []
      this.showGeradorAgenda = false
      this.showReplicarAgenda = false
      this.datasParaReplicarAgenda = []
      this.novoHorarioInputAgenda = ''
      this.geradorAgenda = { inicio: '07:00', fim: '23:00', duracao: 60 }
      this.carregandoModalidades = false
      this.carregandoQuadras = false
      this.carregandoTimes = false
      this.salvandoCadastro = false
      this.quadras = []
    },

    selecionarTipo(tipo) {
      this.tipoSelecionado = tipo
      this.mostrarModalTipo = false
    },

    async carregarModalidades() {
      this.carregandoModalidades = true
      try {
        const { data } = await api.get('/listar/modalidade')
        this.modalidades = Array.isArray(data) ? data : []
      } catch (error) {
        this.modalidades = []
        Swal.fire('Erro', 'Erro ao carregar modalidades.', 'error')
      } finally {
        this.carregandoModalidades = false
      }
    },

    async carregarQuadras(modalidadeId) {
      this.carregandoQuadras = true
      try {
        const { data } = await api.get(`/listar/quadras/${modalidadeId}`)
        this.quadras = Array.isArray(data) ? data : []
      } catch (error) {
        this.quadras = []
        Swal.fire('Erro', 'Erro ao carregar quadras.', 'error')
      } finally {
        this.carregandoQuadras = false
      }
    },

    handleImagemUpload(event) {
      const [file] = event.target.files || []
      this.arquivoFoto = file || null
    },

    async abrirModalTimes() {
      if (this.carregandoTimes || this.salvandoCadastro) return

      if (!this.tipoSelecionado) {
        Swal.fire('Atenção', 'Selecione o tipo do campeonato.', 'warning')
        return
      }

      if (!this.modalidadeSelecionada || !this.quadraSelecionada || !this.nomeCampeonato.trim()) {
        Swal.fire('Atenção', 'Preencha nome, modalidade e quadra.', 'warning')
        return
      }

      this.carregandoTimes = true

      try {
        const { data } = await api.get(`/times/modalidade/${this.modalidadeSelecionada}`)
        this.times = Array.isArray(data) ? data : []
        this.timesSelecionados = []
        this.mostrarModalTimes = true
      } catch (error) {
        Swal.fire('Erro', 'Erro ao carregar os times.', 'error')
      } finally {
        this.carregandoTimes = false
      }
    },

    voltarParaDados() {
      if (this.carregandoTimes || this.salvandoCadastro) return
      this.mostrarModalTimes = false
    },

    toggleTime(id) {
      const index = this.timesSelecionados.indexOf(id)
      if (index >= 0) {
        this.timesSelecionados.splice(index, 1)
      } else {
        this.timesSelecionados.push(id)
      }
    },

    abrirModalAgenda() {
      if (this.timesSelecionados.length < 2) {
        Swal.fire('Atenção', 'Selecione pelo menos 2 times.', 'warning')
        return
      }

      this.mostrarModalTimes = false
      this.mostrarModalAgenda = true

      if (!this.dataAgendaSelecionada && this.datasAgendaOrdenadas.length) {
        this.dataAgendaSelecionada = this.datasAgendaOrdenadas[0].data
      }
    },

    irParaGerenciarTimes() {
      if (this.salvandoCadastro) return
      this.limparCampos()
      this.$emit('fechar')
      this.$router.push({ name: 'gerenciar_times' })
    },

    voltarParaTimes() {
      if (this.salvandoCadastro) return
      this.mostrarModalAgenda = false
      this.mostrarModalTimes = true
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

      if (this.novaDataAgenda < this.dataMinimaAgenda) {
        Swal.fire('Atenção', 'Selecione uma data a partir de amanhã.', 'warning')
        return
      }

      const existe = this.agendaPorData.find((item) => item.data === this.novaDataAgenda)
      if (existe) {
        this.selecionarDataAgenda(existe.data)
        this.novaDataAgenda = ''
        return
      }

      this.agendaPorData.push({
        data: this.novaDataAgenda,
        horarios: []
      })

      this.selecionarDataAgenda(this.novaDataAgenda)
      this.novaDataAgenda = ''
    },

    removerDataAgenda(data) {
      this.agendaPorData = this.agendaPorData.filter((item) => item.data !== data)
      this.datasParaReplicarAgenda = this.datasParaReplicarAgenda.filter((item) => item !== data)

      if (!this.agendaPorData.length) {
        this.dataAgendaSelecionada = ''
        return
      }

      if (this.dataAgendaSelecionada === data) {
        this.dataAgendaSelecionada = this.datasAgendaOrdenadas[0]?.data || ''
      }
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
          title: 'Horário já existe',
          showConfirmButton: false,
          timer: 1600
        })
        return
      }

      this.agendaSelecionada.horarios.push(this.novoHorarioInputAgenda)
      this.agendaSelecionada.horarios.sort((a, b) => this.timeToMinutes(a) - this.timeToMinutes(b))
      this.novoHorarioInputAgenda = ''
    },

    removerHorarioAgenda(index) {
      if (!this.agendaSelecionada) return
      this.agendaSelecionada.horarios.splice(index, 1)
    },

    limparHorariosAgenda() {
      if (!this.agendaSelecionada) return
      this.agendaSelecionada.horarios = []
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
    },

    confirmarReplicacaoAgenda() {
      if (!this.agendaSelecionada || !this.datasParaReplicarAgenda.length) return

      const copia = [...this.agendaSelecionada.horarios]
      this.agendaPorData = this.agendaPorData.map((item) => {
        if (!this.datasParaReplicarAgenda.includes(item.data)) return item
        return {
          ...item,
          horarios: [...copia]
        }
      })

      this.showReplicarAgenda = false
      this.datasParaReplicarAgenda = []
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
    },

    montarDatasJogos() {
      return this.datasAgendaOrdenadas.flatMap((item) =>
        (Array.isArray(item.horarios) ? item.horarios : [])
          .filter(Boolean)
          .map((horario) => {
            const [hora, minuto] = String(horario).split(':').map(Number)
            const [ano, mes, dia] = item.data.split('-').map(Number)
            return new Date(ano, mes - 1, dia, hora, minuto || 0, 0).toISOString()
          })
      )
    },

    async uploadImagem() {
      if (!this.arquivoFoto) return null

      const formData = new FormData()
      formData.append('file', this.arquivoFoto)

      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      return data?.fileUrl || data?.url || null
    },

    async finalizarCadastro() {
      if (this.salvandoCadastro) return

      const datasJogos = this.montarDatasJogos()

      if (!datasJogos.length) {
        Swal.fire('Atenção', 'Adicione ao menos um horário para o campeonato.', 'warning')
        return
      }

      this.salvandoCadastro = true

      try {
        const foto = await this.uploadImagem()

        await api.post('/criar/campeonato', {
          tipo: this.tipoSelecionado,
          nome: this.nomeCampeonato.trim(),
          modalidadeId: this.modalidadeSelecionada,
          quadraId: this.quadraSelecionada,
          status: 'EM_ANDAMENTO',
          foto,
          times: this.timesSelecionados,
          datasJogos,
          usuarioId: Number(this.usuarioLogado?.id || 0) || null
        })

        Swal.fire('Sucesso', 'Campeonato cadastrado com sucesso!', 'success')
        this.$emit('atualizar')
        this.$emit('fechar')
        this.limparCampos()
      } catch (error) {
        Swal.fire('Erro', error.response?.data?.detalhes || error.response?.data?.erro || 'Erro ao criar campeonato', 'error')
      } finally {
        this.salvandoCadastro = false
      }
    },

    cancelarCadastro() {
      if (this.salvandoCadastro) return
      this.limparCampos()
      this.$emit('fechar')
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.62);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  z-index: 1000;
}

.modal-content {
  width: min(920px, 96vw);
  max-height: 90vh;
  overflow-y: auto;
  background: #ffffff;
  padding: 28px 32px;
  border-radius: 20px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  color: #0f172a;
}

.modal-escolha-tipo-campeonato {
  width: min(720px, 92vw);
  border-radius: 18px;
  padding: 26px 28px;
  overflow: visible;
}

.modal-agenda-campeonato {
  width: 95%;
  max-width: 760px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.header-escolha-tipo {
  margin-bottom: 12px;
}

.titulo-escolha-tipo {
  margin: 0;
  color: #3b82f6;
  font-size: 34px;
  font-weight: 800;
  line-height: 1.1;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  color: #2563eb;
  font-size: 30px;
  line-height: 1.1;
}

.agenda-header-copy {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 6px;
}

.agenda-subtitle {
  margin: 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.5;
}

.modal-title-campeonato {
  font-size: 26px;
  line-height: 1.05;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.btn-close-x {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(37, 99, 235, 0.24);
  border-radius: 999px;
  background: #fff;
  color: #3b82f6;
  font-size: 19px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 40px;
  padding: 0;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.btn-close-x:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
  transform: translateY(-1px);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-group label {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.form-group input,
.form-group select {
  width: 100%;
  min-height: 46px;
  padding: 11px 14px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: #fff;
  font-size: 15px;
  color: #0f172a;
}

.form-group input[type="file"] {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  color: #475569;
  background: #f8fbff;
}

.form-group input[type="file"]::file-selector-button {
  margin-right: 12px;
  padding: 10px 16px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(59, 130, 246, 0.16));
  color: #1d4ed8;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.form-group input[type="file"]::file-selector-button:hover {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(59, 130, 246, 0.22));
  border-color: rgba(37, 99, 235, 0.26);
  transform: translateY(-1px);
}

.texto-ajuda {
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.botoes {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.botoes-acao-dupla {
  justify-content: space-between;
}

.btn-save,
.btn-cancelar-escolha-tipo,
.btn-acao-painel,
.btn-add,
.btn-tool,
.tab-btn,
.btn-remove-date {
  border: none;
  border-radius: 12px;
  cursor: pointer;
}

.btn-save {
  min-width: 160px;
  padding: 12px 18px;
  background: #2563eb;
  color: #fff;
  font-weight: 700;
}

.btn-inline-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-save-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #ffffff;
  border-radius: 999px;
  animation: qpSpin 0.8s linear infinite;
}

.btn-save-icon {
  flex: 0 0 auto;
}

.btn-save:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-close-x:disabled,
.btn-cancelar-escolha-tipo:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-save-secondary {
  align-self: flex-end;
}

.btn-cancelar-escolha-tipo {
  width: 100%;
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 999px;
  padding: 12px 0;
  color: #3b82f6;
  cursor: pointer;
  font-size: 16px;
  font-weight: 800;
  background: transparent;
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.tipo-campeonato-lista {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 12px 0 18px;
}

.btn-tipo {
  width: 100%;
  padding: 0;
  background: transparent;
}

.btn-tipo-card {
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  background: #fff;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.tipo-card-principal {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.14) 0%, rgba(59, 130, 246, 0.06) 100%);
}

.btn-tipo-card:hover {
  transform: translateY(-1px);
  border-color: #3b82f6;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.12);
}

.btn-tipo-icone {
  color: #3b82f6;
  width: 28px;
  flex: 0 0 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-tipo-icone svg {
  width: 24px;
  height: 24px;
}

.btn-tipo-conteudo {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.btn-tipo-titulo {
  font-size: 18px;
  font-weight: 500;
  color: #0f172a;
  line-height: 1.2;
}

.btn-tipo-sub {
  color: #475569;
  font-size: 14px;
}

.botoes-escolha-tipo {
  justify-content: flex-end;
}

.botoes-escolha-tipo .btn-cancelar-escolha-tipo:hover {
  background: rgba(59, 130, 246, 0.06);
  border-color: rgba(59, 130, 246, 0.55);
  transform: translateY(-1px);
}

.botoes-acao-dupla .btn-cancelar-escolha-tipo {
  width: auto;
  min-width: 140px;
  padding: 12px 18px;
}

.botoes-acao-dupla .btn-cancelar-escolha-tipo:hover {
  background: rgba(59, 130, 246, 0.06);
  border-color: rgba(59, 130, 246, 0.55);
  transform: translateY(-1px);
}

.botoes-acao-dupla .btn-cancelar-escolha-tipo:disabled:hover {
  background: transparent;
  border-color: rgba(59, 130, 246, 0.35);
  transform: none;
}

.contador {
  margin-bottom: 16px;
  color: #475569;
  font-size: 14px;
  font-weight: 700;
}

.times-opcional-dica {
  margin: -6px 0 16px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
}

.lista-times {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.estado-times-vazio {
  margin-bottom: 8px;
  padding: 20px;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  background: #f8fafc;
}

.estado-times-vazio-titulo {
  margin: 0 0 6px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
}

.estado-times-vazio-descricao {
  margin: 0 0 14px;
  color: #475569;
  font-size: 14px;
  line-height: 1.45;
}

.btn-ir-gerenciar-times {
  border: 1px solid rgba(59, 130, 246, 0.45);
  border-radius: 999px;
  padding: 10px 16px;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.btn-ir-gerenciar-times:hover {
  background: rgba(37, 99, 235, 0.14);
  border-color: rgba(37, 99, 235, 0.65);
}

.btn-ir-gerenciar-times:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.time-card {
  border: 1px solid #dbe3ef;
  border-radius: 16px;
  padding: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.time-card:hover {
  transform: translateY(-1px);
  border-color: #60a5fa;
  box-shadow: 0 16px 28px rgba(59, 130, 246, 0.12);
}

.time-card.selecionado {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.06);
}

.time-card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.time-foto {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  overflow: hidden;
  background: #e2e8f0;
}

.time-foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.time-nome {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.agenda-add-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 0;
}

.form-group-agenda-date {
  flex: 1;
  margin-bottom: 0;
}

.tabs-header-agenda {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  margin-bottom: 0;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
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

.g-group input {
  min-height: 40px;
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
}

.btn-acao-painel,
.btn-add {
  min-height: 40px;
  padding: 9px 14px;
  background: #2563eb;
  color: #fff;
  font-weight: 700;
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

.time-input {
  flex: 1;
  min-height: 40px;
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
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

.btn-remove-chip,
.btn-clear {
  border: none;
  background: transparent;
  color: inherit;
  font-weight: 700;
  cursor: pointer;
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

@keyframes qpSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .modal-content {
    padding: 22px 18px;
  }

  .modal-header {
    align-items: center;
    gap: 10px;
  }

  .modal-header .modal-title-campeonato {
    font-size: 21px !important;
    line-height: 1.02;
    font-weight: bold;
    letter-spacing: -0.03em;
    white-space: nowrap;
    min-width: 0;
    flex: 1 1 auto;
  }

  .header-escolha-tipo .titulo-escolha-tipo {
    font-size: 24px !important;
    line-height: 1.02;
    letter-spacing: -0.03em;
    max-width: 200px;
    min-width: 0;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-row {
    gap: 12px;
    margin-bottom: 12px;
  }

  .form-row .form-group {
    margin-bottom: 0;
  }

  .form-group input,
  .form-group select {
    min-height: 44px;
    padding: 10px 12px;
    font-size: 12px;
  }

  .form-group select {
    padding-right: 30px;
  }

  #quadra {
    font-size: 11px;
    letter-spacing: -0.01em;
  }

  .form-group input[type="file"] {
    font-size: 12px;
    gap: 8px;
  }

  .form-group input[type="file"]::file-selector-button {
    margin-right: 10px;
    padding: 9px 12px;
    font-size: 12px;
  }

  .form-row,
  .gerador-inputs {
    grid-template-columns: 1fr;
  }

  .agenda-add-row,
  .add-horario-form,
  .dia-header-row,
  .editor-head,
  .botoes-acao-dupla {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-save,
  .btn-cancelar-escolha-tipo {
    width: 100%;
  }
}
</style>

