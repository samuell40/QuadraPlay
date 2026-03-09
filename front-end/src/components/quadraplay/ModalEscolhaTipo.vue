<template>
  <div v-if="modelValue && !mostrarModalPartida && !mostrarModalRodada && !mostrarModalJogadores" class="modal-overlay"
    @click.self="fechar">
    <div class="modal-content modal-escolha">
      <div class="modal-header">
        <span class="title">Escolha a Ação</span>
        <button type="button" class="btn-close-x" @click="fechar">x</button>
      </div>

      <div class="tipo-campeonato-lista">
        <button class="btn-tipo btn-tipo-card" :disabled="carregandoAcaoEscolha" @click="onEscolherAcao('ADICIONAR')">
          <span class="btn-tipo-titulo btn-tipo-titulo-com-icone">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-lg"
              viewBox="0 0 16 16">
              <path fill-rule="evenodd"
                d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2" />
            </svg>
            <span class="titulo-acao-modal">Adicionar Partida</span>
            <span v-if="carregandoAcaoEscolha && acaoSelecionada === 'ADICIONAR'" class="acao-loading-spinner"
              aria-hidden="true"></span>
          </span>
          <small class="btn-tipo-sub">Cria uma partida para iniciar agora</small>
        </button>

        <button class="btn-tipo btn-tipo-card" :disabled="carregandoAcaoEscolha" @click="onEscolherAcao('AGENDAR')">
          <span class="btn-tipo-titulo btn-tipo-titulo-com-icone">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar3"
              viewBox="0 0 16 16">
              <path
                d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2M1 3.857C1 3.384 1.448 3 2 3h12c.552 0 1 .384 1 .857v10.286c0 .473-.448.857-1 .857H2c-.552 0-1-.384-1-.857z" />
              <path
                d="M6.5 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2m3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
            </svg>
            <span class="titulo-acao-modal">Agendar Partida</span>
            <span v-if="carregandoAcaoEscolha && acaoSelecionada === 'AGENDAR'" class="acao-loading-spinner"
              aria-hidden="true"></span>
          </span>
          <small class="btn-tipo-sub">Define data e horário para jogar depois</small>
        </button>

        <button v-if="!isMesario" class="btn-tipo btn-tipo-card" :disabled="carregandoAcaoEscolha"
          @click="onEscolherAcao('RODADA')">
          <span class="btn-tipo-titulo btn-tipo-titulo-com-icone">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-repeat"
              viewBox="0 0 16 16">
              <path
                d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9" />
              <path fill-rule="evenodd"
                d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z" />
            </svg>
            <span class="titulo-acao-modal">Adicionar Rodada</span>
            <span v-if="carregandoAcaoEscolha && acaoSelecionada === 'RODADA'" class="acao-loading-spinner"
              aria-hidden="true"></span>
          </span>
          <small class="btn-tipo-sub">Cria uma nova rodada na fase atual</small>
        </button>
      </div>

      <div class="botoes">
        <button type="button" class="btn-cancel" @click="fechar">
          Cancelar
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL DE CRIAR PARTIDA -->
  <div v-if="mostrarModalPartida" class="modal-overlay" @click.self="mostrarModalPartida = false">
    <div class="modal-content modal-times">
      <div class="modal-header">
        <span class="title">{{ modoCriacaoPartida === 'AGENDAR' ? 'Agendar Partida' : 'Adicionar Partida' }}</span>
        <button type="button" class="btn-close-x" @click="mostrarModalPartida = false">x</button>
      </div>

      <div class="filtros-linha">
        <div class="filtros-topo">
          <label>Selecione a fase:</label>
          <select v-model="partida.faseId" @change="listarRodadas">
            <option disabled value="">Escolha uma fase</option>
            <option v-for="fase in fases" :key="fase.id" :value="fase.id">
              {{ fase.nome }}
            </option>
          </select>
        </div>

        <div class="filtros-topo">
          <label>Selecione a rodada:</label>
          <select v-model="partida.rodadaId" :disabled="!rodadas.length">
            <option disabled value="">Escolha uma rodada</option>
            <option v-for="rodada in rodadas" :key="rodada.id" :value="rodada.id">
              {{ rodada.nome }}
            </option>
          </select>
        </div>
      </div>

      <!-- TIME A -->
      <div class="filtros-topo">
        <label>Time 1:</label>

        <div ref="dropdownTimeAAnchor" class="dropdown-custom">
          <div class="dropdown-selected" @click.stop="toggleDropdownTimeA">
            <img v-if="timeASelecionadoObj" :src="obterFotoTimeCard(timeASelecionadoObj.foto)" class="avatar" />
            <span>
              {{ timeASelecionadoObj?.nome || 'Selecione o time' }}
            </span>
          </div>
        </div>

        <teleport to="body">
          <div
            v-if="abrirDropdownTimeA"
            ref="dropdownTimeALista"
            class="dropdown-list dropdown-list-solto"
            :style="dropdownTimeAStyle"
            @click.stop
          >
            <input type="text" v-model="buscaTimeA" placeholder="Buscar time..." class="input-busca-jogador"
              @click.stop />

            <ul>
              <li v-for="time in timesFiltradosA" :key="time.id" @click.stop="selecionarTimeA(time)">
                <img :src="obterFotoTimeCard(time.foto)" class="avatar" />
                <span>{{ time.nome }}</span>
              </li>

              <li v-if="timesFiltradosA.length === 0" class="sem-jogador">
                Nenhum time encontrado
              </li>
            </ul>
          </div>
        </teleport>
      </div>

      <!-- TIME B -->
      <div class="filtros-topo">
        <label>Time 2:</label>

        <div ref="dropdownTimeBAnchor" class="dropdown-custom">
          <div class="dropdown-selected" @click.stop="toggleDropdownTimeB">
            <img v-if="timeBSelecionadoObj" :src="obterFotoTimeCard(timeBSelecionadoObj.foto)" class="avatar" />
            <span>
              {{ timeBSelecionadoObj?.nome || 'Selecione o time' }}
            </span>
          </div>
        </div>

        <teleport to="body">
          <div
            v-if="abrirDropdownTimeB"
            ref="dropdownTimeBLista"
            class="dropdown-list dropdown-list-solto"
            :style="dropdownTimeBStyle"
            @click.stop
          >
            <input type="text" v-model="buscaTimeB" placeholder="Buscar time..." class="input-busca-jogador"
              @click.stop />

            <ul>
              <li v-for="time in timesFiltradosB" :key="time.id" @click.stop="selecionarTimeB(time)">
                <img :src="obterFotoTimeCard(time.foto)" class="avatar" />
                <span>{{ time.nome }}</span>
              </li>

              <li v-if="timesFiltradosB.length === 0" class="sem-jogador">
                Nenhum time encontrado
              </li>
            </ul>
          </div>
        </teleport>
      </div>

      <div v-if="modoCriacaoPartida === 'AGENDAR'" class="agenda-partida-wrapper">
        <div class="filtros-linha">
          <div class="filtros-topo">
            <label>Data da partida:</label>
            <select v-model="partida.dataAgenda" @change="onDataAgendaChange">
              <option disabled value="">Escolha uma data</option>
              <option v-for="opcao in datasAgendaDisponiveis" :key="opcao.value" :value="opcao.value">
                {{ opcao.label }}
              </option>
            </select>
          </div>

          <div class="filtros-topo">
            <label>Horario da partida:</label>
            <select v-model="partida.data" :disabled="!partida.dataAgenda">
              <option disabled value="">
                {{ partida.dataAgenda ? 'Escolha um horario' : 'Selecione uma data primeiro' }}
              </option>
              <option v-for="opcao in horariosAgendaDisponiveis" :key="opcao.value" :value="opcao.value">
                {{ opcao.label }}
              </option>
            </select>
          </div>
        </div>

        <p v-if="modoCriacaoPartida === 'AGENDAR' && !agendaCampeonatoDisponivel.length" class="agenda-helper-text">
          Nenhum horario do campeonato esta disponivel para novas partidas.
        </p>
        <p v-else-if="modoCriacaoPartida === 'AGENDAR' && partida.dataAgenda && !horariosAgendaDisponiveis.length" class="agenda-helper-text">
          Todos os horarios desta data ja foram usados em partidas.
        </p>
      </div>

      <div class="botoes" v-if="modoCriacaoPartida === 'AGENDAR'">
        <button class="btn-save" :disabled="!podeContinuar || criandoPartida" @click="salvarPartidaAgendada">
          <span class="btn-save-content">
            <span v-if="criandoPartida" class="btn-save-spinner" aria-hidden="true"></span>
            <span>{{ criandoPartida ? 'Salvando...' : 'Salvar partida' }}</span>
          </span>
        </button>
      </div>

      <div class="botoes" v-else>
        <button class="btn-save" :disabled="!podeContinuar || criandoPartida" @click="continuarSelecionarJogadores">
          <span class="btn-save-content">
            <span v-if="criandoPartida" class="btn-save-spinner" aria-hidden="true"></span>
            <span>{{ criandoPartida ? 'Carregando...' : 'Continuar (selecionar jogadores)' }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>

  <SelecionarJogadores :aberto="mostrarModalJogadores" :jogadoresTime1="jogadoresTime1" :jogadoresTime2="jogadoresTime2"
    :time1Nome="timeASelecionadoObj?.nome || 'Time 1'" :time2Nome="timeBSelecionadoObj?.nome || 'Time 2'"
    :regra="regraJogadores" :salvando="criandoPartida" @fechar="mostrarModalJogadores = false"
    @confirmar="onConfirmarJogadores" />

  <div v-if="mostrarModalRodada" class="modal-overlay" @click.self="mostrarModalRodada = false">
    <div class="modal-content modal-times">
      <div class="modal-header">
        <span class="title">Criar Nova Rodada</span>
        <button type="button" class="btn-close-x" @click="mostrarModalRodada = false">x</button>
      </div>
      <div class="filtros-topo">
        <label for="faseSelect">Selecione a fase:</label>
        <select id="faseSelect" v-model="faseIdSelecionada">
          <option value="" disabled>Escolha uma fase</option>
          <option v-for="fase in fases" :key="fase.id" :value="fase.id">
            {{ fase.nome }}
          </option>
        </select>
      </div>

      <div class="filtros-topo">
        <label for="nomeRodada">Digite o nome da rodada:</label>
        <input id="nomeRodada" v-model="nomeRodada" type="text" placeholder="Ex: Rodada 1" />
      </div>

      <div class="botoes">
        <button class="btn-save" :disabled="criandoRodada" @click="criarRodada">
          <span class="btn-save-content">
            <span v-if="criandoRodada" class="btn-save-spinner" aria-hidden="true"></span>
            <span>{{ criandoRodada ? 'Criando...' : 'Criar Rodada' }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/axios'
import Swal from 'sweetalert2'
import SelecionarJogadores from './Partida/SelecionarJogadores.vue'
import { obterFotoTime } from '@/utils/timeImagem'

export default {
  name: 'ModalEscolherTipo',
  components: { SelecionarJogadores },

  props: {
    modelValue: { type: Boolean, required: true },
    campeonatoId: { type: [String, Number], required: true }
  },

  data() {
    return {
      usuario: null,
      mostrarModalPartida: false,
      mostrarModalRodada: false,
      modoCriacaoPartida: 'ADICIONAR',
      nomeRodada: '',
      fases: [],
      faseIdSelecionada: null,
      modalidadeId: null,
      modalidadeNome: '',
      quadraId: null,
      agendaCampeonato: [],
      partidasCampeonato: [],
      rodadas: [],
      times: [],
      partida: {
        faseId: '',
        rodadaId: '',
        timeAId: '',
        timeBId: '',
        dataAgenda: '',
        data: ''
      },
      abrirDropdownTimeA: false,
      abrirDropdownTimeB: false,
      buscaTimeA: '',
      buscaTimeB: '',
      mostrarModalJogadores: false,
      jogadoresTime1: [],
      jogadoresTime2: [],
      criandoPartida: false,
      criandoRodada: false,
      carregandoAcaoEscolha: false,
      acaoSelecionada: '',
      dropdownTimeAStyle: {},
      dropdownTimeBStyle: {}
    }
  },

  emits: ['update:modelValue', 'selecionar', 'faseCriada', 'rodadaCriada', 'partidaCriada'],

  mounted() {
    this.usuario = JSON.parse(localStorage.getItem('usuario'))
    window.addEventListener('resize', this.atualizarPosicaoDropdownTimes)
    window.addEventListener('scroll', this.atualizarPosicaoDropdownTimes, true)
    document.addEventListener('click', this.handleClickForaDropdownTimes, true)
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.atualizarPosicaoDropdownTimes)
    window.removeEventListener('scroll', this.atualizarPosicaoDropdownTimes, true)
    document.removeEventListener('click', this.handleClickForaDropdownTimes, true)
  },

  watch: {
    abrirDropdownTimeA(aberto) {
      if (!aberto) return
      this.abrirDropdownTimeB = false
      this.$nextTick(() => this.atualizarPosicaoDropdownTime('A'))
    },
    abrirDropdownTimeB(aberto) {
      if (!aberto) return
      this.abrirDropdownTimeA = false
      this.$nextTick(() => this.atualizarPosicaoDropdownTime('B'))
    },
    mostrarModalPartida(aberto) {
      if (!aberto) this.fecharDropdownsTimes()
    },
    modelValue(aberto) {
      if (!aberto) this.fecharDropdownsTimes()
    }
  },

  computed: {
    isMesario() {
      return Number(this.usuario?.permissaoId) === 4
    },

    timeASelecionadoObj() {
      return this.times.find(t => t.id === this.partida.timeAId)
    },

    timeBSelecionadoObj() {
      return this.times.find(t => t.id === this.partida.timeBId)
    },

    timesFiltradosA() {
      return this.times
        .filter(t => t.id !== this.partida.timeBId)
        .filter(t => t.nome.toLowerCase().includes(this.buscaTimeA.toLowerCase()))
    },

    timesFiltradosB() {
      return this.times
        .filter(t => t.id !== this.partida.timeAId)
        .filter(t => t.nome.toLowerCase().includes(this.buscaTimeB.toLowerCase()))
    },

    podeContinuar() {
      const { faseId, rodadaId, timeAId, timeBId, data } = this.partida
      const baseOk = !!faseId && !!rodadaId && !!timeAId && !!timeBId && timeAId !== timeBId
      if (this.modoCriacaoPartida === 'AGENDAR') return baseOk && !!data
      return baseOk
    },

    dataHoraMinimaAgendamento() {
      const data = new Date()
      data.setHours(0, 0, 0, 0)
      data.setDate(data.getDate() + 1)

      const ano = data.getFullYear()
      const mes = String(data.getMonth() + 1).padStart(2, '0')
      const dia = String(data.getDate()).padStart(2, '0')
      return `${ano}-${mes}-${dia}T00:00`
    },

    regraJogadores() {
      return this.obterRegraJogadores()
    },

    agendaCampeonatoDisponivel() {
      const chavesPartidasUsadas = new Set(
        (Array.isArray(this.partidasCampeonato) ? this.partidasCampeonato : [])
          .filter((partida) => !['CANCELADA', 'DELETADA'].includes(String(partida?.status || '').toUpperCase()))
          .map((partida) => this.obterChaveDataHora(partida?.data))
          .filter(Boolean)
      )

      return (Array.isArray(this.agendaCampeonato) ? this.agendaCampeonato : [])
        .filter((slot) => {
          const chave = this.obterChaveDataHora(slot?.datahora)
          return chave && !chavesPartidasUsadas.has(chave)
        })
        .sort((a, b) => {
          const dataA = this.obterDataValida(a?.datahora)
          const dataB = this.obterDataValida(b?.datahora)
          return (dataA?.getTime() || 0) - (dataB?.getTime() || 0)
        })
    },

    datasAgendaDisponiveis() {
      const mapa = new Map()

      this.agendaCampeonatoDisponivel.forEach((slot) => {
        const chaveData = this.obterChaveData(slot?.datahora)
        if (!chaveData || mapa.has(chaveData)) return

        mapa.set(chaveData, {
          value: chaveData,
          label: this.formatarDataAgendada(slot.datahora)
        })
      })

      return Array.from(mapa.values())
    },

    horariosAgendaDisponiveis() {
      if (!this.partida.dataAgenda) return []

      return this.agendaCampeonatoDisponivel
        .filter((slot) => this.obterChaveData(slot?.datahora) === this.partida.dataAgenda)
        .map((slot) => ({
          value: slot.datahora,
          label: this.formatarHoraAgendada(slot.datahora)
        }))
    }
  },

  methods: {
    obterFotoTimeCard(foto) {
      return obterFotoTime(foto)
    },
    toggleDropdownTimeA() {
      this.abrirDropdownTimeA = !this.abrirDropdownTimeA
      if (!this.abrirDropdownTimeA) this.dropdownTimeAStyle = {}
    },
    toggleDropdownTimeB() {
      this.abrirDropdownTimeB = !this.abrirDropdownTimeB
      if (!this.abrirDropdownTimeB) this.dropdownTimeBStyle = {}
    },
    fecharDropdownsTimes() {
      this.abrirDropdownTimeA = false
      this.abrirDropdownTimeB = false
      this.dropdownTimeAStyle = {}
      this.dropdownTimeBStyle = {}
    },
    atualizarPosicaoDropdownTimes() {
      if (this.abrirDropdownTimeA) this.atualizarPosicaoDropdownTime('A')
      if (this.abrirDropdownTimeB) this.atualizarPosicaoDropdownTime('B')
    },
    atualizarPosicaoDropdownTime(tipo) {
      const anchor = tipo === 'A' ? this.$refs.dropdownTimeAAnchor : this.$refs.dropdownTimeBAnchor
      if (!anchor?.getBoundingClientRect) return

      const rect = anchor.getBoundingClientRect()
      const margemViewport = 8
      const gap = 6
      const alturaDesejada = 260
      const espacoAbaixo = Math.max(0, window.innerHeight - rect.bottom - margemViewport)
      const espacoAcima = Math.max(0, rect.top - margemViewport)
      const abreAcima = espacoAbaixo < 180 && espacoAcima > espacoAbaixo
      const alturaMax = Math.max(120, Math.min(alturaDesejada, abreAcima ? espacoAcima - gap : espacoAbaixo - gap))
      const top = abreAcima ? Math.max(margemViewport, rect.top - alturaMax - gap) : rect.bottom + gap

      const estilo = {
        left: `${Math.max(margemViewport, rect.left)}px`,
        top: `${Math.max(margemViewport, top)}px`,
        width: `${rect.width}px`,
        maxHeight: `${alturaMax}px`
      }

      if (tipo === 'A') {
        this.dropdownTimeAStyle = estilo
      } else {
        this.dropdownTimeBStyle = estilo
      }
    },
    handleClickForaDropdownTimes(evento) {
      const target = evento?.target
      if (!target) return

      const anchorA = this.$refs.dropdownTimeAAnchor
      const listaA = this.$refs.dropdownTimeALista
      if (this.abrirDropdownTimeA && !anchorA?.contains(target) && !listaA?.contains(target)) {
        this.abrirDropdownTimeA = false
      }

      const anchorB = this.$refs.dropdownTimeBAnchor
      const listaB = this.$refs.dropdownTimeBLista
      if (this.abrirDropdownTimeB && !anchorB?.contains(target) && !listaB?.contains(target)) {
        this.abrirDropdownTimeB = false
      }
    },
    obterDataValida(valor) {
      if (!valor) return null
      const data = valor instanceof Date ? new Date(valor.getTime()) : new Date(valor)
      return Number.isNaN(data.getTime()) ? null : data
    },

    obterChaveData(valor) {
      const data = this.obterDataValida(valor)
      if (!data) return ''

      const ano = data.getFullYear()
      const mes = String(data.getMonth() + 1).padStart(2, '0')
      const dia = String(data.getDate()).padStart(2, '0')
      return `${ano}-${mes}-${dia}`
    },

    obterChaveDataHora(valor) {
      const data = this.obterDataValida(valor)
      if (!data) return ''

      const ano = data.getFullYear()
      const mes = String(data.getMonth() + 1).padStart(2, '0')
      const dia = String(data.getDate()).padStart(2, '0')
      const hora = String(data.getHours()).padStart(2, '0')
      const minuto = String(data.getMinutes()).padStart(2, '0')
      return `${ano}-${mes}-${dia} ${hora}:${minuto}`
    },

    formatarDataAgendada(valor) {
      const data = this.obterDataValida(valor)
      if (!data) return 'Data invalida'

      return data.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },

    formatarHoraAgendada(valor) {
      const data = this.obterDataValida(valor)
      if (!data) return '--:--'

      return data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    normalizarNomeModalidade(nome) {
      return String(nome || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    },

    obterRegraJogadores() {
      const id = Number(this.modalidadeId)
      const nomeNormalizado = this.normalizarNomeModalidade(this.modalidadeNome)
      const MODALIDADES_GRUPO_FUTEBOL = new Set(['futebol', 'futsal', 'futebol de areia'])
      const MODALIDADES_GRUPO_VOLEI = new Set(['volei', 'volei de areia', 'futevolei', 'beach tenis', 'beach tennis'])

      if (MODALIDADES_GRUPO_FUTEBOL.has(nomeNormalizado)) {
        return { livre: true, minPorTime: 0, opcional: true }
      }

      if (MODALIDADES_GRUPO_VOLEI.has(nomeNormalizado)) {
        return { livre: true, minPorTime: 0, opcional: true }
      }

      const GRUPO_FUTEBOL = new Set([1, 2, 7])
      const VOLEI = new Set([3, 5, 6])
      const BEACH_TENIS = new Set([4])

      if (GRUPO_FUTEBOL.has(id)) return { livre: true, minPorTime: 0, opcional: true }
      if (VOLEI.has(id) || BEACH_TENIS.has(id)) return { livre: true, minPorTime: 0, opcional: true }

      return { porTime: 11, total: 22 }
    },

    fechar() {
      this.$emit('update:modelValue', false)
    },

    selecionar(tipo) {
      this.$emit('selecionar', tipo)
      this.fechar()
    },

    async onEscolherAcao(acao) {
      if (this.carregandoAcaoEscolha) return
      this.carregandoAcaoEscolha = true
      this.acaoSelecionada = acao

      try {
        if (acao === 'ADICIONAR' || acao === 'AGENDAR') {
          await this.abrirModalPartida(acao)
          return
        }

        if (acao === 'RODADA') {
          await this.abrirModalRodada()
        }
      } finally {
        this.carregandoAcaoEscolha = false
        this.acaoSelecionada = ''
      }
    },

    selecionarTimeA(time) {
      this.partida.timeAId = time.id
      this.abrirDropdownTimeA = false
      this.dropdownTimeAStyle = {}
      this.buscaTimeA = ''
    },

    selecionarTimeB(time) {
      this.partida.timeBId = time.id
      this.abrirDropdownTimeB = false
      this.dropdownTimeBStyle = {}
      this.buscaTimeB = ''
    },

    async abrirModalPartida(modo = 'ADICIONAR') {
      this.fecharDropdownsTimes()
      await this.carregarModalidadeCampeonato()
      await this.listarFases()
      await this.listarTimes()
      this.modoCriacaoPartida = modo
      this.rodadas = []
      this.partida = { faseId: '', rodadaId: '', timeAId: '', timeBId: '', dataAgenda: '', data: '' }
      this.mostrarModalPartida = true
      this.mostrarModalJogadores = false
      this.jogadoresTime1 = []
      this.jogadoresTime2 = []
    },

    async abrirModalRodada() {
      if (this.isMesario) return
      await this.listarFases()
      this.faseIdSelecionada = ''
      this.mostrarModalRodada = true
    },

    async listarFases() {
      /*
      if (false) {
        Swal.fire('Erro', 'Selecione uma data a partir de amanhã para agendar a partida.', 'error')
        this.criandoPartida = false
        return
      }

      */
      try {
        const { data } = await api.get(`/fases/${this.campeonatoId}/`)
        this.fases = data || []
      } catch (err) {
        console.error('Erro ao listar fases:', err)
        Swal.fire('Erro', 'Não foi possível carregar as fases.', 'error')
      }
    },

    async listarTimes() {
      try {
        const { data } = await api.get(`/${this.campeonatoId}/times`)
        this.times = data || []
      } catch (err) {
        console.error('Erro ao listar times:', err)
        Swal.fire('Erro', 'Não foi possível carregar os times.', 'error')
      }
    },

    listarRodadas() {
      const faseSelecionada = this.fases.find(f => f.id === Number(this.partida.faseId))
      this.rodadas = faseSelecionada?.rodadas
      this.partida.rodadaId = ''
    },

    async criarRodada() {
      if (this.criandoRodada) return
      if (this.isMesario) {
        Swal.fire('Atenção', 'Mesaário não pode criar rodada.', 'info')
        return
      }

      if (!this.nomeRodada) {
        Swal.fire('Erro', 'Informe o nome da rodada.', 'error')
        return
      }
      if (!this.faseIdSelecionada) {
        Swal.fire('Erro', 'Selecione uma fase.', 'error')
        return
      }

      this.criandoRodada = true

      try {
        const { data } = await api.post(`/rodada/${this.campeonatoId}/${this.faseIdSelecionada}`, {
          nome: this.nomeRodada
        })
        Swal.fire('Sucesso', 'Rodada criada com sucesso!', 'success')
        this.nomeRodada = ''
        this.faseIdSelecionada = null
        this.mostrarModalRodada = false
        this.$emit('rodadaCriada', data.rodada)
      } catch (err) {
        console.error('Erro ao criar rodada:', err)
        Swal.fire('Erro', 'Não foi possível criar a rodada.', 'error')
      } finally {
        this.criandoRodada = false
      }
    },

    async carregarModalidadeCampeonato() {
      try {
        const { data } = await api.get(`/campeonato/${this.campeonatoId}`)
        this.modalidadeId = data.modalidadeId
        this.modalidadeNome = data?.modalidade?.nome || ''
        this.quadraId = data.quadraId
        this.agendaCampeonato = Array.isArray(data?.agendamentos) ? data.agendamentos : []
        this.partidasCampeonato = Array.isArray(data?.partidas) ? data.partidas : []
      } catch (err) {
        console.error('Erro ao carregar campeonato:', err)
      }
    },

    onDataAgendaChange() {
      this.partida.data = ''
    },

    async continuarSelecionarJogadores() {
      const { faseId, rodadaId, timeAId, timeBId } = this.partida

      if (!faseId || !rodadaId || !timeAId || !timeBId) {
        Swal.fire('Erro', 'Preencha todos os campos.', 'error')
        return
      }

      if (timeAId === timeBId) {
        Swal.fire('Erro', 'Os times não podem ser iguais.', 'error')
        return
      }

      try {
        this.criandoPartida = true
        const [resA, resB] = await Promise.all([
          api.get('/partidas/escalacao/jogadores', {
            params: {
              campeonatoId: this.campeonatoId,
              faseId,
              timeId: timeAId
            }
          }),
          api.get('/partidas/escalacao/jogadores', {
            params: {
              campeonatoId: this.campeonatoId,
              faseId,
              timeId: timeBId
            }
          })
        ])

        this.jogadoresTime1 = Array.isArray(resA.data) ? resA.data : []
        this.jogadoresTime2 = Array.isArray(resB.data) ? resB.data : []
        this.mostrarModalJogadores = true
      } catch (err) {
        console.error('Erro ao carregar jogadores:', err)
        Swal.fire('Erro', 'Não foi possível carregar os jogadores dos times.', 'error')
      } finally {
        this.criandoPartida = false
      }
    },

    async onConfirmarJogadores(selecao) {
      const { faseId, rodadaId, timeAId, timeBId } = this.partida
      this.criandoPartida = true

      try {
        const modalidadeIdNum = Number(this.modalidadeId)
        const regra = this.obterRegraJogadores()

        const idsTimeA = selecao?.time1 || []
        const idsTimeB = selecao?.time2 || []

        if (regra.livre) {
          const min = Number(regra.minPorTime ?? 1)
          if (idsTimeA.length < min || idsTimeB.length < min) {
            Swal.fire('Erro', `Selecione pelo menos ${min} jogador(es) por time.`, 'error')
            return
          }
        } else if (idsTimeA.length !== regra.porTime || idsTimeB.length !== regra.porTime) {
          Swal.fire('Erro', `Para esta modalidade, selecione exatamente ${regra.porTime} jogador(es) por time.`, 'error')
          return
        }

        const payload = {
          campeonatoId: Number(this.campeonatoId),
          modalidadeId: modalidadeIdNum,
          faseId: Number(faseId),
          rodadaId: Number(rodadaId),
          timeAId: Number(timeAId),
          timeBId: Number(timeBId),
          quadraId: Number(this.quadraId),
          status: 'EM_ANDAMENTO'
        }

        const { data: partidaCriada } = await api.post('/partida', payload)
        const partidaId = partidaCriada?.id
        if (!partidaId) throw new Error('Partida criada sem ID.')

        const jogadoresPayload = [
          ...idsTimeA.map((jogadorId) => ({ jogadorId: Number(jogadorId), timeId: Number(timeAId) })),
          ...idsTimeB.map((jogadorId) => ({ jogadorId: Number(jogadorId), timeId: Number(timeBId) }))
        ]

        await api.put(`/partidas/${partidaId}/iniciar`, { jogadores: jogadoresPayload })

        Swal.fire('Sucesso', 'Partida criada e iniciada!', 'success')
        this.mostrarModalJogadores = false
        this.mostrarModalPartida = false
        this.$emit('partidaCriada', partidaCriada)
      } catch (err) {
        console.error('Erro no fluxo de criar/iniciar:', err)
        const mensagem = err.response?.data?.erro || err.response?.data?.message || 'Não foi possível criar/iniciar.'
        Swal.fire('Erro', mensagem, 'error')
      } finally {
        this.criandoPartida = false
      }
    },

    async salvarPartidaAgendada() {
      const { faseId, rodadaId, timeAId, timeBId, data } = this.partida
      this.criandoPartida = true

      if (!faseId || !rodadaId || !timeAId || !timeBId || !data) {
        Swal.fire('Erro', 'Preencha todos os campos.', 'error')
        this.criandoPartida = false
        return
      }

      if (timeAId === timeBId) {
        Swal.fire('Erro', 'Os times não podem ser iguais.', 'error')
        this.criandoPartida = false
        return
      }

      const horarioValido = this.agendaCampeonatoDisponivel.some(
        (slot) => this.obterChaveDataHora(slot?.datahora) === this.obterChaveDataHora(data)
      )

      if (!horarioValido) {
        Swal.fire('Erro', 'Selecione um horario disponivel cadastrado na agenda do campeonato.', 'error')
        this.criandoPartida = false
        return
      }

      try {
        const payload = {
          campeonatoId: Number(this.campeonatoId),
          modalidadeId: Number(this.modalidadeId),
          faseId: Number(faseId),
          rodadaId: Number(rodadaId),
          timeAId: Number(timeAId),
          timeBId: Number(timeBId),
          quadraId: Number(this.quadraId),
          data,
          status: 'AGENDADA'
        }

        const { data: partidaCriada } = await api.post('/partida', payload)

        Swal.fire('Sucesso', 'Partida agendada com sucesso!', 'success')
        this.mostrarModalPartida = false
        this.$emit('partidaCriada', partidaCriada)
      } catch (err) {
        console.error('Erro ao agendar partida:', err)
        const mensagem = err.response?.data?.erro || err.response?.data?.message || 'Não foi possível agendar.'
        Swal.fire('Erro', mensagem, 'error')
      } finally {
        this.criandoPartida = false
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 30px 40px;
  border-radius: 16px;
  width: min(900px, 95vw);
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
  font-family: 'Montserrat', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal-header h2 {
  margin: 0;
  color: var(--primary);
  font-weight: 800;
  letter-spacing: -0.2px;
}

.title_placar {
  color: #3b82f6;
  font-size: 24px;
  font-weight: bold;
}

.btn-close-x {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(59, 130, 246, 0.55);
  border-radius: 999px;
  background: #fff;
  color: var(--text);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  flex: 0 0 auto;
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.btn-close-x:hover {
  background: rgba(59, 130, 246, 0.08);
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.9);
}

.modal-escolha {
  width: min(720px, 92vw);
  padding: 26px 28px;
  border-radius: 18px;
  text-align: left;
}

.modal-escolha .modal-header {
  margin-bottom: 10px;
}

.title {
  color: #3b82f6;
  font-size: 34px;
  font-weight: bold;
}

.tipo-campeonato-lista {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 10px 0 18px;
}

.btn-tipo {
  width: 100%;
  cursor: pointer;
  transition: 0.2s ease;
  border: none;
  background: transparent;
  padding: 0;
}

.btn-tipo:disabled {
  cursor: wait;
}

.btn-tipo-card {
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  text-align: left;
  color: var(--text);
}

.btn-tipo-card:hover {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.45);
  transform: translateY(-1px);
}

.btn-tipo-card:disabled {
  opacity: 0.78;
  transform: none;
}

.btn-tipo-card:active {
  transform: translateY(0);
}

.btn-tipo-titulo {
  font-weight: 800;
  color: #000;
  font-size: 18px;
  letter-spacing: -0.1px;
  width: 100%;
  text-align: left;
}

.btn-tipo-titulo-com-icone {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.titulo-acao-modal {
  min-width: 0;
}

.acao-loading-spinner {
  width: 16px;
  height: 16px;
  margin-left: auto;
  border-radius: 999px;
  border: 2px solid rgba(59, 130, 246, 0.24);
  border-top-color: #3b82f6;
  animation: acaoSpin 0.75s linear infinite;
  flex: 0 0 16px;
}

@keyframes acaoSpin {
  to {
    transform: rotate(360deg);
  }
}

.btn-tipo-titulo-com-icone svg {
  color: #3b82f6;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
}

.btn-tipo-sub {
  font-size: 13px;
  font-weight: 600;
  color:  #777;
  line-height: 1.25;
  width: 100%;
  text-align: left;
}

.botoes {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.btn-save {
  flex: 1;
  padding: 12px 0;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  color: #Ffff;
  ;
  font-size: 16px;
  font-weight: 800;
  background-color: #3b82f6;
  ;
}

.btn-save-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-save-spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  animation: acaoSpin 0.75s linear infinite;
  flex: 0 0 14px;
}

.btn-cancel {
  flex: 1;
  padding: 12px 0;
  border-radius: 999px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 800;
  background: transparent;
  color: #3b82f6;;
  border: 1px solid rgba(59, 130, 246, 0.35);
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.modal-escolha .modal-header .title {
  text-align: left;
}


.btn-cancel:hover,
.btn-cancel-sec:hover {
  background: rgba(59, 130, 246, 0.06);
  border-color: rgba(59, 130, 246, 0.55);
  transform: translateY(-1px);
}

.modal-times .lista-times {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(59, 130, 246, 0.45);
  border-radius: 10px;
  padding: 12px;
  background-color: #fff;
}

.modal-times label {
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 700;
  color: var(--text);
}

.time-card {
  border: 1px solid rgba(59, 130, 246, 0.55);
  border-radius: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: 0.2s;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text);
}

.time-card.selecionado {
  background: var(--primary);
  color: #fff;
  border-color: #1e40af;
}

.time-card-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-foto {
  width: 50px;
  height: 50px;
}

.time-foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 1px solid rgba(59, 130, 246, 0.6);
}

.time-nome {
  font-size: 16px;
  font-weight: 800;
  color: inherit;
}

.time-jogadores {
  font-size: 14px;
  color: var(--text-2);
}

.filtros-topo {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
}

.filtros-topo label {
  display: block;
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 700;
  color: var(--text);
}

.filtros-topo select,
.filtros-topo input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 15px;
  color: var(--text);
  background-color: #fff;
  outline: none;
  transition: 0.2s;
}

.filtros-topo select:hover,
.filtros-topo input:hover {
  border-color: rgba(59, 130, 246, 0.65);
}

.filtros-topo select:focus,
.filtros-topo input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

.filtros-topo select option[disabled] {
  color: var(--text-3);
}

.filtros-linha {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.filtros-linha .filtros-topo {
  flex: 1;
  min-width: 150px;
}

.agenda-partida-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.agenda-helper-text {
  margin: -4px 0 18px;
  font-size: 13px;
  color: var(--text-2);
}

.dropdown-custom {
  position: relative;
  cursor: pointer;
  margin-top: 5px;
}

.dropdown-selected {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background-color: #fff;
  font-size: 15px;
  color: var(--text);
  min-height: 42px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.dropdown-selected:hover {
  border-color: rgba(59, 130, 246, 0.65);
}

.dropdown-list {
  position: absolute;
  width: 100%;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  margin-top: 6px;
  max-height: 220px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.14);
}

.dropdown-list-solto {
  position: fixed;
  margin-top: 0;
  z-index: 1300;
}

.dropdown-list-solto ul {
  max-height: calc(100% - 46px);
}

.dropdown-list ul {
  padding: 0;
  margin: 0;
  list-style: none;
  max-height: 180px;
  overflow-y: auto;
}

.dropdown-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;
  color: var(--text);
}

.dropdown-list li:hover {
  background-color: rgba(59, 130, 246, 0.06);
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.input-busca-jogador {
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  outline: none;
  font-size: 14px;
  margin-bottom: 5px;
}

.sem-jogador {
  padding: 10px;
  text-align: center;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 768px) {
  .modal-overlay {
    align-items: flex-start;
    padding: 10px;
  }

  .modal-content {
    width: min(100%, 100vw - 20px);
    max-height: calc(100dvh - 20px);
    padding: 16px 14px;
    border-radius: 14px;
  }

  .modal-escolha {
    width: min(100%, 100vw - 20px);
    padding: 16px 14px;
    border-radius: 14px;
  }

  .modal-escolha .modal-header {
    margin-bottom: 8px;
  }

  .modal-times {
    width: min(100%, 100vw - 20px);
    max-height: calc(100dvh - 20px);
    padding: 16px 14px;
    border-radius: 14px;
  }

  .title {
    font-size: 22px;
    line-height: 1.1;
  }

  .btn-tipo-titulo {
    font-size: 15px;
  }

  .tipo-campeonato-lista {
    gap: 10px;
    margin: 8px 0 14px;
  }

  .btn-tipo-card {
    padding: 11px 12px;
    border-radius: 10px;
    gap: 4px;
  }

  .btn-tipo-sub {
    font-size: 12px;
    line-height: 1.3;
  }

  .filtros-linha {
    flex-direction: column;
    gap: 12px;
  }

  .filtros-topo {
    margin-bottom: 14px;
  }

  .filtros-topo label {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .filtros-topo select,
  .filtros-topo input,
  .dropdown-selected {
    min-height: 42px;
    font-size: 14px;
    padding: 9px 11px;
  }

  .dropdown-custom {
    margin-top: 2px;
  }

  .agenda-helper-text {
    margin: -2px 0 12px;
    font-size: 12px;
  }

  .btn-save,
  .btn-cancel,
  .btn-cancel-sec {
    padding: 11px 0;
    font-size: 15px;
  }
}
</style>
