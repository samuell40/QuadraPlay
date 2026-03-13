<template>
  <div v-if="modelValue && !mostrarModalFase && !mostrarModalCriterios && !mostrarModalColunas" class="modal-overlay"
    @click.self="fechar">
    <div class="modal-content modal-escolha-config">
      <div class="modal-header">
        <span class="title">Configurações de Classificação</span>
        <button type="button" class="btn-close-x" @click="fechar">x</button>
      </div>

      <div class="tipo-campeonato-lista">
        <button class="btn-tipo btn-tipo-card" :disabled="carregandoAcaoEscolha" @click="onEscolherConfiguracao('FASE')">
          <span class="btn-tipo-titulo btn-tipo-titulo-com-icone">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-stack"
              viewBox="0 0 16 16">
              <path
                d="m14.12 10.163 1.715.858c.22.11.22.424 0 .534L8.267 15.34a.6.6 0 0 1-.534 0L.165 11.555a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0l5.317-2.66zM7.733.063a.6.6 0 0 1 .534 0l7.568 3.784a.3.3 0 0 1 0 .535L8.267 8.165a.6.6 0 0 1-.534 0L.165 4.382a.299.299 0 0 1 0-.535z" />
              <path
                d="m14.12 6.576 1.715.858c.22.11.22.424 0 .534l-7.568 3.784a.6.6 0 0 1-.534 0L.165 7.968a.299.299 0 0 1 0-.534l1.716-.858 5.317 2.659c.505.252 1.1.252 1.604 0z" />
            </svg>
            <span class="titulo-acao-modal">Adicionar fase</span>
            <span v-if="carregandoAcaoEscolha && acaoSelecionada === 'FASE'" class="acao-loading-spinner"
              aria-hidden="true"></span>
          </span>
          <small class="btn-tipo-sub">Cria uma nova fase e seleciona os times participantes</small>
        </button>

        <button
          v-if="podeConfigurarTabelaClassificacao"
          class="btn-tipo btn-tipo-card"
          :disabled="carregandoAcaoEscolha"
          @click="onEscolherConfiguracao('GRUPOS')">
          <span class="btn-tipo-titulo btn-tipo-titulo-com-icone">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-people-fill"
              viewBox="0 0 16 16">
              <path
                d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" />
            </svg>
            <span class="titulo-acao-modal">Grupos</span>
            <span v-if="carregandoAcaoEscolha && acaoSelecionada === 'GRUPOS'" class="acao-loading-spinner"
              aria-hidden="true"></span>
          </span>
          <small class="btn-tipo-sub">Organiza os grupos do campeonato</small>
        </button>

        <button
          v-if="podeConfigurarTabelaClassificacao"
          class="btn-tipo btn-tipo-card"
          :disabled="carregandoAcaoEscolha"
          @click="onEscolherConfiguracao('CRITERIOS')">
          <span class="btn-tipo-titulo btn-tipo-titulo-com-icone">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list-ol"
              viewBox="0 0 16 16">
              <path fill-rule="evenodd"
                d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5" />
              <path
                d="M1.713 11.865v-.474H2c.217 0 .363-.137.363-.317 0-.185-.158-.31-.361-.31-.223 0-.367.152-.373.31h-.59c.016-.467.373-.787.986-.787.588-.002.954.291.957.703a.595.595 0 0 1-.492.594v.033a.615.615 0 0 1 .569.631c.003.533-.502.8-1.051.8-.656 0-1-.37-1.008-.794h.582c.008.178.186.306.422.309.254 0 .424-.145.422-.35-.002-.195-.155-.348-.414-.348h-.3zm-.004-4.699h-.604v-.035c0-.408.295-.844.958-.844.583 0 .96.326.96.756 0 .389-.257.617-.476.848l-.537.572v.03h1.054V9H1.143v-.395l.957-.99c.138-.142.293-.304.293-.508 0-.18-.147-.32-.342-.32a.33.33 0 0 0-.342.338zM2.564 5h-.635V2.924h-.031l-.598.42v-.567l.629-.443h.635z" />
            </svg>
            <span class="titulo-acao-modal">Critérios de Classificação</span>
            <span v-if="carregandoAcaoEscolha && acaoSelecionada === 'CRITERIOS'" class="acao-loading-spinner"
              aria-hidden="true"></span>
          </span>
          <small class="btn-tipo-sub">Define a ordem dos critérios usados na classificação</small>
        </button>

        <button
          v-if="podeConfigurarTabelaClassificacao"
          class="btn-tipo btn-tipo-card"
          :disabled="carregandoAcaoEscolha"
          @click="onEscolherConfiguracao('COLUNAS')">
          <span class="btn-tipo-titulo btn-tipo-titulo-com-icone">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
              class="bi bi-layout-text-window-reverse" viewBox="0 0 16 16">
              <path
                d="M13.5 1a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 13.5 15h-11A1.5 1.5 0 0 1 1 13.5v-11A1.5 1.5 0 0 1 2.5 1h11zm-11 1A.5.5 0 0 0 2 2.5v2h12v-2a.5.5 0 0 0-.5-.5h-11zM14 5.5H2v8a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-8z" />
              <path d="M3 7h2v2H3V7zm0 3h2v2H3v-2zm3-3h7v1H6V7zm0 3h7v1H6v-1z" />
            </svg>
            <span class="titulo-acao-modal">Colunas da Tabela</span>
            <span v-if="carregandoAcaoEscolha && acaoSelecionada === 'COLUNAS'" class="acao-loading-spinner"
              aria-hidden="true"></span>
          </span>
          <small class="btn-tipo-sub">Seleciona quais colunas devem aparecer no placar</small>
        </button>

        <button class="btn-tipo btn-tipo-card" :disabled="carregandoAcaoEscolha"
          @click="onEscolherConfiguracao('COMPARTILHAR')">
          <span class="btn-tipo-titulo btn-tipo-titulo-com-icone">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-share-fill"
              viewBox="0 0 16 16">
              <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5" />
            </svg>
            <span class="titulo-acao-modal">Gerar Imagem do Classificacao</span>
            <span v-if="carregandoAcaoEscolha && acaoSelecionada === 'COMPARTILHAR'" class="acao-loading-spinner"
              aria-hidden="true"></span>
          </span>
          <small class="btn-tipo-sub">Escolha PDF ou imagem e salva automaticamente</small>
        </button>
      </div>

      <div class="botoes">
        <button class="btn-cancel" @click="fechar">
          Cancelar
        </button>
      </div>
    </div>
  </div>

  <!-- Modal para criar fase -->
  <div v-if="mostrarModalFase" class="modal-overlay" @click.self="fecharModalFase">
    <div class="modal-content modal-times">
      <div class="modal-header">
        <div class="modal-header-copy">
          <span class="title">Criar nova fase</span>
        </div>
        <button type="button" class="btn-close-x" @click="fecharModalFase">x</button>
      </div>

      <section class="fase-form-card">
        <div class="campo-fase">
          <span class="campo-fase-label">Nome da fase</span>
        <input v-model="nomeFase" type="text" placeholder="Ex: Eliminatórias" />
      </div>

      </section>

      <section class="fase-times-card">
        <div class="fase-times-head">
          <div>
            <h3>Selecionar times</h3>
          </div>
          <span class="fase-total">{{ timesSelecionados.length }} selecionado(s)</span>
        </div>

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
              <img :src="obterFotoTimeCard(time.foto)" :alt="time.nome" />
            </div>

            <div class="time-card-copy">
              <h3 class="time-nome">
                {{ time.nome }}
              </h3>
              <span class="time-card-meta">
                {{ time._count?.jogadores || 0 }} jogadores
              </span>
            </div>

            <span v-if="timesSelecionados.includes(time.id)" class="time-card-badge">
              Selecionado
            </span>
          </div>
        </div>
      </div>

      <div v-else class="estado-vazio-times">
        Nenhum time disponivel para esta fase.
      </div>

      </section>

      <div class="botoes botoes-modal-times">
        <button class="btn-save" :disabled="salvandoFase" @click="criarFase">
          <span class="btn-save-content">
            <span v-if="salvandoFase" class="btn-save-spinner" aria-hidden="true"></span>
            <span>{{ salvandoFase ? 'Salvando...' : 'Criar Fase' }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>

  <div v-if="mostrarModalCriterios" class="modal-overlay" @click.self="fecharModalCriterios">
    <div class="modal-content modal-criterios">
      <div class="modal-header">
        <h2>Critérios de Classificação</h2>
        <button type="button" class="btn-close-x" @click="fecharModalCriterios">x</button>
      </div>

      <p class="descricao">
        Arraste para definir a ordem de classificação
      </p>

      <div class="lista-criterios">
        <div v-for="(criterio, indice) in criterios" :key="criterio.value" class="criterio-item" draggable="true"
          @dragstart="iniciarArraste(indice)" @dragover.prevent @drop="soltar(indice)">
          <span class="ordem">{{ indice + 1 }}</span>
          <span class="nome">{{ criterio.label }}</span>
        </div>
      </div>

      <div class="botoes">
        <button class="btn-save" :disabled="salvandoOrdem" @click="salvarOrdem">
          <span class="btn-save-content">
            <span v-if="salvandoOrdem" class="btn-save-spinner" aria-hidden="true"></span>
            <span>{{ salvandoOrdem ? 'Salvando...' : 'Salvar ordem' }}</span>
          </span>
        </button>
      </div>

      <div v-if="classificacao.length" class="classificacao-atual">
        <h3>Classificação atual:</h3>
        <div v-for="(time, index) in classificacao" :key="time.timeId">
          {{ index + 1 }} - {{ time.time.nome }} - {{ time.pontuacao }} pts
        </div>
      </div>
    </div>
  </div>

  <div v-if="mostrarModalColunas" class="modal-overlay" @click.self="fecharModalColunas">
    <div class="modal-content modal-criterios modal-colunas">
      <div class="modal-header">
        <h2>Colunas da Tabela</h2>
        <button type="button" class="btn-close-x" @click="fecharModalColunas">x</button>
      </div>

      <p class="descricao">
        Arraste para ordenar e marque as colunas que devem aparecer na tabela de classificação
      </p>

      <div class="lista-criterios lista-colunas">
        <label class="coluna-item coluna-item-fixa">
          <input type="checkbox" checked disabled />
          <span class="nome">Time</span>
          <span class="sigla-coluna">TIME</span>
        </label>

        <label v-for="(coluna, indice) in colunasOrdenadas" :key="coluna.key" class="coluna-item"
          :class="{ 'coluna-item-ativa': colunaSelecionada(coluna.key), dragging: indiceArrasteColuna === indice }"
          draggable="true" @dragstart="iniciarArrasteColuna($event, indice)" @dragover.prevent
          @drop="soltarColuna(indice)" @dragend="finalizarArrasteColuna">
          <span class="drag-handle" aria-hidden="true">::</span>
          <input v-model="colunasSelecionadas" type="checkbox" :value="coluna.key" />
          <span class="nome">{{ coluna.label }}</span>
          <span class="sigla-coluna">{{ coluna.abbr }}</span>
        </label>
      </div>

      <div class="botoes">
        <button class="btn-save" :disabled="salvandoColunas" @click="salvarColunas">
          <span class="btn-save-content">
            <span v-if="salvandoColunas" class="btn-save-spinner" aria-hidden="true"></span>
            <span>{{ salvandoColunas ? 'Salvando...' : 'Salvar colunas' }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from "@/axios"
import Swal from "sweetalert2"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
  getColunasClassificacaoPorModalidade,
  getChavesPadraoColunasClassificacao,
  resolverColunasVisiveisClassificacao
} from "@/utils/classificacaoColunas"
import { obterFotoTime } from "@/utils/timeImagem"
import logoQuadraPlay from "@/assets/logo.png"

export default {
  name: "ModalConfiguracoesCampeonato",

  props: {
    modelValue: Boolean,
    campeonato: Object,
    timesPlacar: {
      type: Array,
      default: () => []
    },
    colunasVisiveis: {
      type: Array,
      default: () => []
    },
    gruposConfig: {
      type: Object,
      default: null
    },
    exibirPorGrupos: {
      type: Boolean,
      default: false
    },
    faseNome: {
      type: String,
      default: ""
    },
    rodadaNome: {
      type: String,
      default: ""
    }
  },

  emits: ["update:modelValue", "faseCriada", "criterios", "colunas", "grupos"],

  data() {
    return {
      mostrarModalFase: false,
      mostrarModalCriterios: false,
      mostrarModalColunas: false,
      nomeFase: "",
      times: [],
      timesSelecionados: [],
      criterios: [],
      colunasSelecionadas: [],
      ordemColunas: [],
      classificacao: [],
      indiceArraste: null,
      indiceArrasteColuna: null,
      salvandoFase: false,
      salvandoOrdem: false,
      salvandoColunas: false,
      carregandoAcaoEscolha: false,
      acaoSelecionada: ''
    }
  },

  computed: {
    tipoCampeonatoNormalizado() {
      return String(this.campeonato?.tipo || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
    },
    campeonatoEhEliminatorias() {
      return this.tipoCampeonatoNormalizado === "eliminatorias"
    },
    podeConfigurarTabelaClassificacao() {
      return !this.campeonatoEhEliminatorias
    },
    colunasDisponiveis() {
      return getColunasClassificacaoPorModalidade(this.campeonato?.modalidade?.nome)
    },
    colunasOrdenadas() {
      return this.ordemColunas.length ? this.ordemColunas : this.colunasDisponiveis
    }
  },

  methods: {
    obterFotoTimeCard(foto) {
      return obterFotoTime(foto)
    },
    fechar() {
      this.$emit("update:modelValue", false)
    },

    async onEscolherConfiguracao(acao) {
      if (this.carregandoAcaoEscolha) return
      if (this.campeonatoEhEliminatorias && ["GRUPOS", "CRITERIOS", "COLUNAS"].includes(acao)) return
      this.carregandoAcaoEscolha = true
      this.acaoSelecionada = acao

      try {
        if (acao === 'FASE') {
          await this.abrirModalFase()
          return
        }

        if (acao === 'GRUPOS') {
          this.grupos()
          return
        }

        if (acao === 'CRITERIOS') {
          await this.criteriosClassificacao()
          return
        }

        if (acao === 'COLUNAS') {
          await this.colunasClassificacao()
          return
        }

        if (acao === 'COMPARTILHAR') {
          await this.compartilharPlacar()
        }
      } finally {
        this.carregandoAcaoEscolha = false
        this.acaoSelecionada = ''
      }
    },

    obterNomeTimeLinha(time) {
      return String(time?.time?.nome ?? time?.nome ?? "Time").trim() || "Time"
    },

    normalizarResultadoCompartilhamento(valor) {
      const token = String(valor || "")
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()

      if (["V", "W", "WIN", "WON", "VITORIA", "VITORIAS", "GANHOU"].includes(token)) return "V"
      if (["E", "DRAW", "EMPATE", "EMPATES", "TIE"].includes(token)) return "E"
      if (["D", "L", "LOSS", "LOST", "DERROTA", "DERROTAS", "PERDEU", "X"].includes(token)) return "D"
      if (["-", "N", "NULL", "SEM"].includes(token)) return "-"
      return "-"
    },

    obterUltimosJogosCompartilhamento(time) {
      const candidatas = [
        time?.ultimosJogos,
        time?.ultimos_jogos,
        time?.ultimosResultados,
        time?.ultimos_resultados,
        time?.historico,
        time?.recentes,
        time?.forma,
        time?.form
      ]

      const bruto = candidatas.find(valor => Array.isArray(valor) || typeof valor === "string")
      let resultados = []

      if (Array.isArray(bruto)) {
        resultados = bruto.map(item => this.normalizarResultadoCompartilhamento(item))
      } else if (typeof bruto === "string") {
        const tokens = bruto
          .toUpperCase()
          .split(/[,\s;/|-]+/)
          .filter(Boolean)
        resultados = tokens.map(item => this.normalizarResultadoCompartilhamento(item))
      }

      const normalizados = resultados
        .filter(item => ["V", "E", "D", "-"].includes(item))
        .slice(0, 3)

      while (normalizados.length < 3) normalizados.push("-")
      return normalizados
    },

    obterValorColunaCompartilhamento(time, chave) {
      if (chave === "aproveitamento") {
        return `${time?.aproveitamento ?? 0}%`
      }

      if (chave === "pontosAverage") {
        const valor = Number(time?.pontosAverage ?? 0)
        return Number.isFinite(valor) ? valor.toFixed(2) : "0.00"
      }

      if (chave === "ultimosJogos") {
        return this.obterUltimosJogosCompartilhamento(time).join(" ")
      }

      const valor = time?.[chave]
      return valor == null ? "-" : String(valor)
    },

    simboloResultadoCompartilhamento(resultado) {
      if (resultado === "V") return "\u2713"
      if (resultado === "D") return "\u2715"
      return "-"
    },

    coresResultadoCompartilhamento(resultado) {
      if (resultado === "V") {
        return { fundo: "#16a34a", texto: "#ffffff" }
      }

      if (resultado === "E") {
        return { fundo: "#9ca3af", texto: "#ffffff" }
      }

      if (resultado === "D") {
        return { fundo: "#ef4444", texto: "#ffffff" }
      }

      return { fundo: "#cbd5e1", texto: "#334155" }
    },

    obterColunasCompartilhamento() {
      const chavesVisiveis = resolverColunasVisiveisClassificacao(
        this.campeonato?.modalidade?.nome,
        this.colunasVisiveis
      )

      const mapa = new Map(this.colunasDisponiveis.map(coluna => [coluna.key, coluna]))
      const colunas = chavesVisiveis
        .map(chave => mapa.get(chave))
        .filter(Boolean)

      if (colunas.length) return colunas
      return this.colunasDisponiveis.slice(0, 6)
    },

    obterIdTimeCompartilhamento(time) {
      const id = Number(time?.timeId ?? time?.time?.id ?? time?.id ?? 0)
      return Number.isFinite(id) && id > 0 ? id : 0
    },

    compartilhamentoPorGruposAtivo() {
      return Boolean(
        this.exibirPorGrupos
        && Array.isArray(this.gruposConfig?.grupos)
        && this.gruposConfig.grupos.length > 0
      )
    },

    obterBlocosClassificacaoCompartilhamento(maxTimes = null) {
      const times = Array.isArray(this.timesPlacar) ? this.timesPlacar : []
      if (!times.length) return []

      const limite = Number(maxTimes)
      const aplicarLimite = Number.isFinite(limite) && limite > 0
      const limitarLista = lista => aplicarLimite ? lista.slice(0, limite) : lista.slice()

      if (!this.compartilhamentoPorGruposAtivo()) {
        const linhas = limitarLista(times)
        return linhas.length
          ? [{ id: "classificacao-geral", nome: "", times: linhas }]
          : []
      }

      const idsUsados = new Set()
      const blocos = this.gruposConfig.grupos
        .map((grupo, indice) => {
          const idsGrupo = new Set(
            (Array.isArray(grupo?.timeIds) ? grupo.timeIds : [])
              .map(id => Number(id))
              .filter(id => Number.isInteger(id) && id > 0)
          )

          const timesGrupo = times.filter(time => idsGrupo.has(this.obterIdTimeCompartilhamento(time)))
          timesGrupo.forEach(time => idsUsados.add(this.obterIdTimeCompartilhamento(time)))

          return {
            id: String(grupo?.id || `grupo-${indice + 1}`),
            nome: String(grupo?.nome || "").trim() || `Grupo ${indice + 1}`,
            times: timesGrupo
          }
        })
        .filter(bloco => bloco.times.length)

      const timesSemGrupo = times.filter(time => !idsUsados.has(this.obterIdTimeCompartilhamento(time)))
      if (timesSemGrupo.length) {
        blocos.push({
          id: "sem-grupo",
          nome: "Sem grupo",
          times: timesSemGrupo
        })
      }

      if (!aplicarLimite) return blocos

      let restante = limite
      const blocosLimitados = []

      for (const bloco of blocos) {
        if (restante <= 0) break
        const timesLimitados = bloco.times.slice(0, restante)
        if (!timesLimitados.length) continue
        blocosLimitados.push({
          ...bloco,
          times: timesLimitados
        })
        restante -= timesLimitados.length
      }

      return blocosLimitados
    },

    obterResumoCompartilhamento() {
      const partes = []
      if (this.campeonato?.nome) partes.push(`Campeonato: ${this.campeonato.nome}`)
      if (this.faseNome) partes.push(`Fase: ${this.faseNome}`)
      if (this.compartilhamentoPorGruposAtivo()) partes.push("Classificacao por grupo")
      partes.push(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`)
      return partes.join(" | ")
    },

    obterItensGlossarioCompartilhamento(colunas = []) {
      const descricaoPorChave = {
        pontuacao: "Pontos",
        jogos: "Jogos",
        vitorias: "Vitorias",
        empates: "Empates",
        derrotas: "Derrotas",
        golsPro: "Gols marcados",
        golsSofridos: "Gols sofridos",
        saldoDeGols: "Saldo de gols",
        aproveitamento: "Aproveitamento",
        setsVencidos: "Sets pro",
        setsContra: "Sets contra",
        diferencaSets: "Diferenca de sets",
        pontosPro: "Pontos pro",
        pontosContra: "Pontos contra",
        diferencaPontos: "Diferenca de pontos",
        pontosAverage: "Pontos average",
        derrotaWo: "Derrota por W.O.",
        gamesPro: "Games a favor",
        gamesContra: "Games contra",
        diferencaGames: "Diferenca de games",
        ultimosJogos: "Ultimos jogos"
      }

      const siglaPorChave = {
        vitorias: "V",
        derrotas: "D",
        empates: "E",
        ultimosJogos: "ULT",
        derrotaWo: "W.O."
      }

      const usados = new Set()
      const itens = []

      for (const coluna of colunas) {
        const chave = String(coluna?.key || "").trim()
        if (!chave || usados.has(chave)) continue

        const siglaBase = siglaPorChave[chave] || String(coluna?.abbr || coluna?.label || chave).toUpperCase()
        const sigla = String(siglaBase).replace(/\s+/g, " ").trim()
        const descricao = String(descricaoPorChave[chave] || coluna?.label || chave).trim()

        itens.push({ sigla, descricao })
        usados.add(chave)
      }

      return itens
    },

    normalizarUrlImagemCompartilhamento(url) {
      const src = String(url || "").trim()
      if (!src) return ""
      if (/^(data:|blob:)/i.test(src)) return src
      if (/^https?:\/\//i.test(src)) return src
      if (/^\/?(assets|img|images)\//i.test(src)) return src

      const baseApi = String(api?.defaults?.baseURL || "").trim().replace(/\/+$/, "")
      if (!baseApi) return src

      if (/^\/uploads\//i.test(src)) return `${baseApi}${src}`
      if (/^uploads\//i.test(src)) return `${baseApi}/${src}`
      return src
    },

    obterFotoTimeCompartilhamento(foto) {
      const fotoNormalizada = obterFotoTime(foto)
      const urlAbsoluta = this.normalizarUrlImagemCompartilhamento(fotoNormalizada)

      if (!/^https?:\/\//i.test(urlAbsoluta)) {
        return {
          principal: urlAbsoluta,
          fallback: urlAbsoluta
        }
      }

      const baseApi = String(api?.defaults?.baseURL || "").trim().replace(/\/+$/, "")
      if (!baseApi) {
        return {
          principal: urlAbsoluta,
          fallback: urlAbsoluta
        }
      }

      const proxyUrl = `${baseApi}/media/proxy?url=${encodeURIComponent(urlAbsoluta)}`
      return {
        principal: proxyUrl,
        fallback: urlAbsoluta
      }
    },

    carregarImagemDataUrlCompartilhamento(url) {
      return new Promise((resolve) => {
        const src = String(url || "").trim()
        if (!src) {
          resolve(null)
          return
        }

        const imagem = new Image()
        let finalizado = false
        const timeoutId = window.setTimeout(() => {
          if (finalizado) return
          finalizado = true
          resolve(null)
        }, 8000)

        const finalizar = (resultado) => {
          if (finalizado) return
          finalizado = true
          window.clearTimeout(timeoutId)
          resolve(resultado)
        }

        if (/^https?:\/\//i.test(src)) {
          imagem.crossOrigin = "anonymous"
        }

        imagem.decoding = "async"
        imagem.onload = () => {
          try {
            const largura = imagem.naturalWidth || imagem.width || 0
            const altura = imagem.naturalHeight || imagem.height || 0
            if (largura <= 0 || altura <= 0) {
              finalizar(null)
              return
            }

            const canvas = document.createElement("canvas")
            canvas.width = largura
            canvas.height = altura
            const ctx = canvas.getContext("2d")
            if (!ctx) {
              finalizar(null)
              return
            }

            ctx.drawImage(imagem, 0, 0, largura, altura)
            finalizar(canvas.toDataURL("image/png"))
          } catch {
            finalizar(null)
          }
        }
        imagem.onerror = () => finalizar(null)
        imagem.src = src
      })
    },

    async carregarImagemDataUrlCompartilhamentoComFallback(urlPrincipal, urlFallback = "") {
      const principal = await this.carregarImagemDataUrlCompartilhamento(urlPrincipal)
      if (principal) return principal

      const fallback = String(urlFallback || "").trim()
      if (!fallback || fallback === String(urlPrincipal || "").trim()) {
        return null
      }

      return this.carregarImagemDataUrlCompartilhamento(fallback)
    },

    carregarImagemObjetoCompartilhamento(url) {
      return new Promise((resolve) => {
        const src = String(url || "").trim()
        if (!src) {
          resolve(null)
          return
        }

        const imagem = new Image()
        let finalizado = false
        const timeoutId = window.setTimeout(() => {
          if (finalizado) return
          finalizado = true
          resolve(null)
        }, 8000)

        const finalizar = (resultado) => {
          if (finalizado) return
          finalizado = true
          window.clearTimeout(timeoutId)
          resolve(resultado)
        }

        if (/^https?:\/\//i.test(src)) {
          imagem.crossOrigin = "anonymous"
        }

        imagem.decoding = "async"
        imagem.onload = () => finalizar(imagem)
        imagem.onerror = () => finalizar(null)
        imagem.src = src
      })
    },

    async obterEscudosTimesCompartilhamento(times = []) {
      const referencias = times.map((time) => {
        const foto = time?.time?.foto ?? time?.foto ?? ""
        const urls = this.obterFotoTimeCompartilhamento(foto)
        const chave = `${String(urls?.principal || "")}||${String(urls?.fallback || "")}`
        return { chave, urls }
      })

      const cache = new Map()
      const listaUnica = []

      for (const referencia of referencias) {
        if (!referencia.chave || cache.has(referencia.chave)) continue
        cache.set(referencia.chave, null)
        listaUnica.push(referencia)
      }

      await Promise.all(listaUnica.map(async (referencia) => {
        const imagem = await this.carregarImagemDataUrlCompartilhamentoComFallback(
          referencia.urls?.principal,
          referencia.urls?.fallback
        )
        cache.set(referencia.chave, imagem || null)
      }))

      return referencias.map(referencia => cache.get(referencia.chave) || null)
    },

    criarPayloadArquivo(blob, extensao = "png") {
      const nomeNormalizado = String(this.campeonato?.nome || "campeonato")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase()

      const arquivoNome = `placar_${nomeNormalizado || "campeonato"}.${extensao}`
      const mime = extensao === "png" ? "image/png" : "application/octet-stream"
      const arquivo = new File([blob], arquivoNome, { type: mime })
      const url = URL.createObjectURL(blob)
      setTimeout(() => URL.revokeObjectURL(url), 60_000)

      return {
        arquivo,
        arquivoNome,
        url,
        texto: this.obterResumoCompartilhamento()
      }
    },

    desenharRetanguloArredondado(ctx, x, y, largura, altura, raio) {
      const r = Math.min(raio, largura / 2, altura / 2)
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + largura - r, y)
      ctx.quadraticCurveTo(x + largura, y, x + largura, y + r)
      ctx.lineTo(x + largura, y + altura - r)
      ctx.quadraticCurveTo(x + largura, y + altura, x + largura - r, y + altura)
      ctx.lineTo(x + r, y + altura)
      ctx.quadraticCurveTo(x, y + altura, x, y + altura - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
    },

    baixarArquivo(url, nomeArquivo) {
      if (!url) return
      const link = document.createElement("a")
      link.href = url
      link.download = nomeArquivo || "arquivo"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },

    async compartilharArquivoCanal(canal, payload) {
      const shareNativoDisponivel = !!(navigator.share && navigator.canShare && payload?.arquivo)
      const canShareArquivo = shareNativoDisponivel && navigator.canShare({ files: [payload.arquivo] })

      if (canShareArquivo) {
        try {
          await navigator.share({
            title: "Compartilhar placar",
            text: payload.texto,
            files: [payload.arquivo]
          })
          return
        } catch (error) {
          if (error?.name === "AbortError") return
        }
      }

      if (canal === "whatsapp") {
        const linkWhatsApp = `https://wa.me/?text=${encodeURIComponent(payload.texto)}`
        window.open(linkWhatsApp, "_blank", "noopener,noreferrer")
        this.baixarArquivo(payload.url, payload.arquivoNome)
        await Swal.fire({
          title: "Imagem pronta",
          text: "Abrimos o WhatsApp e baixamos a imagem para voce anexar.",
          icon: "info",
          target: ".modal-escolha-config"
        })
        return
      }

      this.baixarArquivo(payload.url, payload.arquivoNome)
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(payload.texto)
        }
      } catch (error) {
        console.warn("Não foi possível copiar o texto automaticamente:", error)
      }

      await Swal.fire({
        title: "Imagem pronta",
        text: "A imagem foi baixada para publicar no Instagram.",
        icon: "info",
        target: ".modal-escolha-config"
      })
    },

    async gerarBlobImagemPlacar() {
      const blocos = this.obterBlocosClassificacaoCompartilhamento(26)
      const colunasBase = this.obterColunasCompartilhamento()
      if (!blocos.length) {
        throw new Error("Sem dados de classificação para compartilhar.")
      }

      const compartilhandoPorGrupo = this.compartilhamentoPorGruposAtivo()
      const colunas = colunasBase.slice()
      const largura = 1536
      const margem = 56
      const larguraCard = largura - (margem * 2)
      const xTabela = margem + 34
      const larguraTabela = larguraCard - 68
      const paddingHorizontalTabela = 16
      const larguraUtilTabela = Math.max(1, larguraTabela - (paddingHorizontalTabela * 2))
      let larguraColunaTime = 340
      if (colunas.length >= 9) larguraColunaTime = 300
      else if (colunas.length >= 7) larguraColunaTime = 320
      else if (colunas.length <= 4) larguraColunaTime = 420
      const larguraMinimaColuna = 72

      while (colunas.length > 4) {
        const larguraDisponivelOutras = larguraUtilTabela - larguraColunaTime
        const larguraColunaAtual = larguraDisponivelOutras / Math.max(colunas.length, 1)
        if (larguraColunaAtual >= larguraMinimaColuna) break
        colunas.pop()
      }

      const larguraDisponivelOutras = Math.max(1, larguraUtilTabela - larguraColunaTime)
      const larguraColuna = larguraDisponivelOutras / Math.max(colunas.length, 1)
      const alturaCabecalhoTabela = 58
      const alturaLinha = 50
      const alturaTituloGrupo = compartilhandoPorGrupo ? 38 : 0
      const espacamentoEntreBlocos = compartilhandoPorGrupo ? 18 : 0
      const linhas = blocos.flatMap(bloco => bloco.times)
      const logoRodape = await this.carregarImagemObjetoCompartilhamento(logoQuadraPlay)
      const escudosDataUrl = await this.obterEscudosTimesCompartilhamento(linhas)
      const escudosLinhas = await Promise.all(
        escudosDataUrl.map((src) => this.carregarImagemObjetoCompartilhamento(src))
      )
      const alturaTabelas = blocos.reduce((total, bloco, indice) => {
        const alturaTabelaBloco = alturaCabecalhoTabela + (bloco.times.length * alturaLinha)
        const tituloBloco = compartilhandoPorGrupo ? alturaTituloGrupo : 0
        const gap = indice < blocos.length - 1 ? espacamentoEntreBlocos : 0
        return total + tituloBloco + alturaTabelaBloco + gap
      }, 0)
      const altura = Math.max(900, 290 + alturaTabelas + 90)

      const canvas = document.createElement("canvas")
      canvas.width = largura
      canvas.height = altura
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Não foi possível iniciar o canvas para compartilhar placar.")
      }

      const gradienteFundo = ctx.createLinearGradient(0, 0, 0, altura)
      gradienteFundo.addColorStop(0, "#081845")
      gradienteFundo.addColorStop(0.55, "#0f2f7b")
      gradienteFundo.addColorStop(1, "#0b1f55")
      ctx.fillStyle = gradienteFundo
      ctx.fillRect(0, 0, largura, altura)

      const xCard = margem
      const yCard = 68
      const hCard = altura - 120
      this.desenharRetanguloArredondado(ctx, xCard, yCard, larguraCard, hCard, 34)
      ctx.fillStyle = "rgba(15, 23, 42, 0.34)"
      ctx.fill()
      ctx.strokeStyle = "rgba(125, 211, 252, 0.42)"
      ctx.lineWidth = 2
      ctx.stroke()

      const titulo = `Classificacao - ${this.campeonato?.nome || "Campeonato"}`
      ctx.textAlign = "left"
      ctx.textBaseline = "alphabetic"
      ctx.fillStyle = "#f8fafc"
      ctx.font = "700 52px Montserrat, Arial, sans-serif"
      ctx.fillText(titulo, xCard + 38, yCard + 70)

      ctx.fillStyle = "rgba(191, 219, 254, 0.96)"
      ctx.font = "500 25px Montserrat, Arial, sans-serif"
      ctx.fillText(this.obterResumoCompartilhamento(), xCard + 38, yCard + 108)

      const yInicioTabelas = yCard + 148

      const truncarTexto = (texto, larguraMaxima) => {
        let saida = String(texto || "")
        if (ctx.measureText(saida).width <= larguraMaxima) return saida
        while (saida.length && ctx.measureText(`${saida}...`).width > larguraMaxima) {
          saida = saida.slice(0, -1)
        }
        return `${saida}...`
      }

      const xPrimeiraColuna = xTabela + paddingHorizontalTabela
      const xInicioDemais = xPrimeiraColuna + larguraColunaTime
      const fonteCabecalhoColunas = colunas.length >= 10 ? 14 : (colunas.length >= 8 ? 16 : 20)
      const fonteValorColunas = colunas.length >= 10 ? 14 : (colunas.length >= 8 ? 16 : 20)
      const obterTituloColunaImagem = (coluna) => {
        if (coluna?.key === "ultimosJogos") return "ULT"
        return String(coluna?.abbr || coluna?.label || "").toUpperCase()
      }

      let yCursorTabela = yInicioTabelas
      let indiceEscudoGlobal = 0

      blocos.forEach((bloco, indiceBloco) => {
        if (compartilhandoPorGrupo) {
          ctx.textAlign = "left"
          ctx.textBaseline = "alphabetic"
          ctx.fillStyle = "rgba(191, 219, 254, 0.98)"
          ctx.font = "700 28px Montserrat, Arial, sans-serif"
          ctx.fillText(bloco.nome || `Grupo ${indiceBloco + 1}`, xTabela, yCursorTabela + 28)
          yCursorTabela += alturaTituloGrupo
        }

        const alturaTabelaAtual = alturaCabecalhoTabela + (bloco.times.length * alturaLinha)
        const yHeader = yCursorTabela + 37

        this.desenharRetanguloArredondado(ctx, xTabela, yCursorTabela, larguraTabela, alturaTabelaAtual, 20)
        ctx.fillStyle = "rgba(15, 23, 42, 0.4)"
        ctx.fill()

        this.desenharRetanguloArredondado(ctx, xTabela, yCursorTabela, larguraTabela, alturaCabecalhoTabela, 20)
        ctx.fillStyle = "rgba(59, 130, 246, 0.86)"
        ctx.fill()

        ctx.textAlign = "left"
        ctx.fillStyle = "#ffffff"
        ctx.font = "700 24px Montserrat, Arial, sans-serif"
        ctx.fillText("Time", xPrimeiraColuna, yHeader)

        ctx.textAlign = "center"
        ctx.font = `700 ${fonteCabecalhoColunas}px Montserrat, Arial, sans-serif`
        colunas.forEach((coluna, indice) => {
          const centroColuna = xInicioDemais + (indice * larguraColuna) + (larguraColuna / 2)
          const tituloColuna = obterTituloColunaImagem(coluna)
          ctx.fillText(truncarTexto(tituloColuna, larguraColuna - 8), centroColuna, yHeader)
        })

        bloco.times.forEach((time, indiceLinha) => {
          const yLinhaTop = yCursorTabela + alturaCabecalhoTabela + (indiceLinha * alturaLinha)
          const yLinhaTexto = yLinhaTop + 33
          const escudo = escudosLinhas[indiceEscudoGlobal]
          indiceEscudoGlobal += 1
          const tamanhoEscudo = 30
          const larguraPosicao = 46
          const xPosicao = xPrimeiraColuna + 2
          const xEscudo = xPosicao + larguraPosicao
          const yEscudo = yLinhaTop + ((alturaLinha - tamanhoEscudo) / 2)

          ctx.fillStyle = indiceLinha % 2 === 0
            ? "rgba(248, 250, 252, 0.08)"
            : "rgba(15, 23, 42, 0.16)"
          ctx.fillRect(xTabela, yLinhaTop, larguraTabela, alturaLinha)

          ctx.textAlign = "left"
          ctx.fillStyle = "#e2e8f0"
          ctx.font = "700 21px Montserrat, Arial, sans-serif"
          ctx.fillText(`${indiceLinha + 1}\u00BA`, xPosicao, yLinhaTexto)

          if (escudo) {
            const raio = tamanhoEscudo / 2
            const centroX = xEscudo + raio
            const centroY = yEscudo + raio

            ctx.save()
            ctx.beginPath()
            ctx.arc(centroX, centroY, raio, 0, Math.PI * 2)
            ctx.closePath()
            ctx.clip()
            ctx.drawImage(escudo, xEscudo, yEscudo, tamanhoEscudo, tamanhoEscudo)
            ctx.restore()

            ctx.strokeStyle = "rgba(191, 219, 254, 0.75)"
            ctx.lineWidth = 1.1
            ctx.beginPath()
            ctx.arc(centroX, centroY, raio, 0, Math.PI * 2)
            ctx.closePath()
            ctx.stroke()
          }

          ctx.textAlign = "left"
          ctx.fillStyle = "#e2e8f0"
          ctx.font = "600 22px Montserrat, Arial, sans-serif"
          const nomeTime = truncarTexto(
            this.obterNomeTimeLinha(time),
            larguraColunaTime - (larguraPosicao + tamanhoEscudo + 18)
          )
          ctx.fillText(nomeTime, xEscudo + tamanhoEscudo + 10, yLinhaTexto)

          ctx.textAlign = "center"
          ctx.font = `600 ${fonteValorColunas}px Montserrat, Arial, sans-serif`
          colunas.forEach((coluna, indiceColuna) => {
            const centroColuna = xInicioDemais + (indiceColuna * larguraColuna) + (larguraColuna / 2)
            if (coluna?.key === "ultimosJogos") {
              const resultados = this.obterUltimosJogosCompartilhamento(time)
              const diametro = Math.max(11, Math.min(20, Math.floor((larguraColuna - 10) / 3)))
              const gap = Math.max(2, Math.min(5, Math.floor((larguraColuna - (diametro * 3)) / 4)))
              const larguraGrupo = (diametro * 3) + (gap * 2)
              const centroY = yLinhaTop + (alturaLinha / 2)
              const xPrimeiro = centroColuna - (larguraGrupo / 2) + (diametro / 2)

              resultados.forEach((resultado, indiceResultado) => {
                const xResultado = xPrimeiro + (indiceResultado * (diametro + gap))
                const cores = this.coresResultadoCompartilhamento(resultado)

                ctx.fillStyle = cores.fundo
                ctx.beginPath()
                ctx.arc(xResultado, centroY, diametro / 2, 0, Math.PI * 2)
                ctx.closePath()
                ctx.fill()

                ctx.fillStyle = cores.texto
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.font = `700 ${Math.max(9, Math.floor(diametro * 0.58))}px Montserrat, Arial, sans-serif`
                ctx.fillText(this.simboloResultadoCompartilhamento(resultado), xResultado, centroY + 0.5)
              })

              ctx.textBaseline = "alphabetic"
              return
            }

            const valor = this.obterValorColunaCompartilhamento(time, coluna.key)
            ctx.fillStyle = "#e2e8f0"
            ctx.textAlign = "center"
            ctx.textBaseline = "alphabetic"
            ctx.font = `600 ${fonteValorColunas}px Montserrat, Arial, sans-serif`
            ctx.fillText(truncarTexto(valor, larguraColuna - 16), centroColuna, yLinhaTexto)
          })
        })

        yCursorTabela += alturaTabelaAtual
        if (compartilhandoPorGrupo && indiceBloco < blocos.length - 1) {
          yCursorTabela += espacamentoEntreBlocos
        }
      })

      const textoMarca = "QuadraPlaySV"
      ctx.font = "600 22px Montserrat, Arial, sans-serif"
      const larguraTextoMarca = ctx.measureText(textoMarca).width
      const tamanhoLogoRodape = 28
      const gapLogoTexto = logoRodape ? 9 : 0
      const larguraTotalMarca = larguraTextoMarca + (logoRodape ? (tamanhoLogoRodape + gapLogoTexto) : 0)
      const xInicioMarca = (largura - larguraTotalMarca) / 2
      const yMarca = altura - 20

      if (logoRodape) {
        const yLogo = yMarca - tamanhoLogoRodape + 5
        ctx.drawImage(logoRodape, xInicioMarca, yLogo, tamanhoLogoRodape, tamanhoLogoRodape)
      }

      ctx.textAlign = "left"
      ctx.fillStyle = "rgba(191, 219, 254, 0.95)"
      ctx.font = "600 22px Montserrat, Arial, sans-serif"
      ctx.fillText(textoMarca, xInicioMarca + (logoRodape ? (tamanhoLogoRodape + gapLogoTexto) : 0), yMarca)

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((arquivo) => {
          if (arquivo) resolve(arquivo)
          else reject(new Error("Falha ao gerar imagem do placar"))
        }, "image/png", 0.95)
      })

      return blob
    },

    async gerarPdfPlacar() {
      const blocos = this.obterBlocosClassificacaoCompartilhamento()
      if (!blocos.length) {
        throw new Error("Sem dados de classificação para gerar PDF.")
      }

      const compartilhandoPorGrupo = this.compartilhamentoPorGruposAtivo()
      const colunas = this.obterColunasCompartilhamento()
      const itensGlossario = this.obterItensGlossarioCompartilhamento(colunas)
      const logoPdf = await this.carregarImagemDataUrlCompartilhamento(logoQuadraPlay)
      const doc = new jsPDF("l", "mm", "a4")
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margemX = 12
      const limiteInferior = pageHeight - 12
      const dataGeracao = new Date()
      const titulo = `Classificacao - ${this.campeonato?.nome || "Campeonato"}`
      const resumo = this.obterResumoCompartilhamento()
      const dataGeracaoLabel = `${dataGeracao.toLocaleDateString("pt-BR")} as ${dataGeracao.toLocaleTimeString("pt-BR")}`

      const cores = {
        header: [15, 23, 42],
        headerAccent: [56, 189, 248],
        primary: [29, 78, 216],
        primarySoft: [239, 246, 255],
        text: [15, 23, 42],
        muted: [100, 116, 139],
        border: [203, 213, 225],
        white: [255, 255, 255]
      }

      let cursorY = 0

      const desenharCabecalho = (continuacao = false) => {
        const altura = continuacao ? 14 : 22

        doc.setFillColor(...cores.header)
        doc.rect(0, 0, pageWidth, altura, "F")
        doc.setFillColor(...cores.headerAccent)
        doc.rect(0, 0, pageWidth, 2.2, "F")

        if (logoPdf) {
          const yLogoCabecalho = continuacao ? 4.2 : 5.2
          doc.addImage(
            logoPdf,
            "PNG",
            margemX,
            yLogoCabecalho,
            continuacao ? 7.6 : 9.2,
            continuacao ? 7.6 : 9.2
          )
        }

        const xTextoCabecalho = logoPdf ? margemX + (continuacao ? 10 : 13.2) : margemX

        if (continuacao) {
          doc.setTextColor(...cores.white)
          doc.setFont("helvetica", "bold")
          doc.setFontSize(10.5)
          doc.text("QuadraPlaySV", xTextoCabecalho, 8.8)

          doc.setFont("helvetica", "normal")
          doc.setFontSize(7.6)
          doc.setTextColor(191, 219, 254)
          doc.text("Relatório de classificação", pageWidth - margemX, 8.8, { align: "right" })
          cursorY = 18
          return
        }

        doc.setFont("helvetica", "bold")
        doc.setFontSize(15.2)
        doc.setTextColor(...cores.white)
        doc.text("QuadraPlaySV", xTextoCabecalho, 10.8)

        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(191, 219, 254)
        doc.text("Relatório de classificação", xTextoCabecalho, 15.5)

        doc.setFont("helvetica", "bold")
        doc.setFontSize(15.5)
        doc.setTextColor(...cores.text)
        doc.text(titulo, margemX, 30)

        doc.setFont("helvetica", "normal")
        doc.setFontSize(8.3)
        doc.setTextColor(...cores.muted)
        const resumoLinhas = doc.splitTextToSize(resumo, pageWidth - margemX * 2)
        doc.text(resumoLinhas, margemX, 35)
        const yGerado = 35 + (resumoLinhas.length * 4.1)
        doc.text(`Gerado em ${dataGeracaoLabel}`, margemX, yGerado)

        const yBloco = yGerado + 4
        doc.setFillColor(...cores.primarySoft)
        doc.setDrawColor(...cores.border)
        doc.roundedRect(margemX, yBloco, pageWidth - margemX * 2, 10.5, 3.2, 3.2, "FD")

        doc.setFont("helvetica", "bold")
        doc.setFontSize(7.6)
        doc.setTextColor(...cores.primary)
        doc.text("Leitura da classificação", margemX + 4, yBloco + 4.3)

        doc.setFont("helvetica", "normal")
        doc.setFontSize(7.2)
        doc.setTextColor(...cores.muted)
        doc.text(
          "Tabela da fase e rodada selecionadas com posição, desempenho e escudos dos times.",
          margemX + 4,
          yBloco + 7.8
        )

        cursorY = yBloco + 14.5
      }

      const desenharRodape = (paginaAtual, totalPaginas) => {
        doc.setDrawColor(...cores.border)
        doc.line(margemX, pageHeight - 8.5, pageWidth - margemX, pageHeight - 8.5)

        doc.setFont("helvetica", "normal")
        doc.setFontSize(7.4)
        doc.setTextColor(...cores.muted)
        doc.text("Relatório exportado pela tela de classificação.", margemX, pageHeight - 4.4)
        doc.text(`Pagina ${paginaAtual}/${totalPaginas}`, pageWidth - margemX, pageHeight - 4.4, { align: "right" })
      }

      const garantirEspaco = (alturaNecessaria) => {
        if (cursorY + alturaNecessaria <= limiteInferior) return
        doc.addPage()
        desenharCabecalho(true)
      }

      desenharCabecalho(false)

      const head = [[
        "Pos",
        "Escudo",
        "Time",
        ...colunas.map((coluna) => {
          if (coluna?.key === "ultimosJogos") return "ULT"
          return String(coluna?.abbr || coluna?.label || "").toUpperCase()
        })
      ]]

      const larguraUtil = pageWidth - (margemX * 2)
      const larguraColPos = 14
      const larguraColEscudo = 16
      const larguraColTime = Math.max(52, Math.min(70, larguraUtil * 0.24))
      const indiceColunaUlt = colunas.findIndex(coluna => coluna?.key === "ultimosJogos")
      const temColunaUlt = indiceColunaUlt >= 0
      const indiceColunaUltReal = temColunaUlt ? indiceColunaUlt + 3 : -1
      const larguraColUlt = temColunaUlt ? Math.max(20, Math.min(28, larguraUtil * 0.09)) : 0
      const larguraRestante = larguraUtil - larguraColPos - larguraColEscudo - larguraColTime - larguraColUlt
      const qtdColunasRestantes = colunas.length - (temColunaUlt ? 1 : 0)
      const larguraPadrao = qtdColunasRestantes > 0 ? Math.max(10.8, larguraRestante / qtdColunasRestantes) : 0
      const columnStyles = {
        0: { halign: "center", cellWidth: larguraColPos },
        1: { halign: "center", cellWidth: larguraColEscudo },
        2: { halign: "left", cellWidth: larguraColTime }
      }

      colunas.forEach((coluna, indice) => {
        const indiceReal = indice + 3
        if (coluna?.key === "ultimosJogos") {
          columnStyles[indiceReal] = { halign: "center", cellWidth: larguraColUlt }
          return
        }
        columnStyles[indiceReal] = { halign: "center", cellWidth: larguraPadrao }
      })

      for (let indiceBloco = 0; indiceBloco < blocos.length; indiceBloco += 1) {
        const bloco = blocos[indiceBloco]
        const timesBloco = Array.isArray(bloco?.times) ? bloco.times : []
        if (!timesBloco.length) continue

        if (compartilhandoPorGrupo) {
          garantirEspaco(14)
          doc.setFont("helvetica", "bold")
          doc.setFontSize(11.4)
          doc.setTextColor(...cores.primary)
          doc.text(bloco.nome || `Grupo ${indiceBloco + 1}`, margemX, cursorY + 4.4)
          cursorY += 7
        }

        const body = timesBloco.map((time, index) => ([
          `${index + 1}\u00BA`,
          "",
          this.obterNomeTimeLinha(time),
          ...colunas.map((coluna) => {
            if (coluna?.key === "ultimosJogos") {
              return ""
            }
            return this.obterValorColunaCompartilhamento(time, coluna.key)
          })
        ]))

        const escudosBloco = await this.obterEscudosTimesCompartilhamento(timesBloco)
        garantirEspaco(24)

        autoTable(doc, {
          startY: cursorY,
          head,
          body,
          margin: { left: margemX, right: margemX, bottom: 14 },
          styles: { fontSize: 8.6, cellPadding: 2.2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
          headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.3 },
          alternateRowStyles: { fillColor: [245, 248, 255] },
          bodyStyles: { fillColor: [255, 255, 255] },
          columnStyles,
          didDrawCell: (data) => {
            if (data.section !== "body") return

            if (data.column.index === 1) {
              const imagemDataUrl = escudosBloco?.[data.row.index]
              if (!imagemDataUrl) return

              try {
                const padding = 1.1
                const lado = Math.max(1, Math.min(
                  data.cell.width - (padding * 2),
                  data.cell.height - (padding * 2)
                ))
                const x = data.cell.x + ((data.cell.width - lado) / 2)
                const y = data.cell.y + ((data.cell.height - lado) / 2)
                doc.addImage(imagemDataUrl, "PNG", x, y, lado, lado, undefined, "FAST")
              } catch {
                // ignora falha de imagem individual para nao interromper o PDF
              }
              return
            }

            if (temColunaUlt && data.column.index === indiceColunaUltReal) {
              const resultados = this.obterUltimosJogosCompartilhamento(timesBloco?.[data.row.index])
              const gap = 0.9
              const diametro = Math.max(
                2.2,
                Math.min(
                  3.8,
                  data.cell.height - 1.8,
                  (data.cell.width - 2 - (gap * 2)) / 3
                )
              )
              const larguraTotal = (diametro * 3) + (gap * 2)
              const yCentro = data.cell.y + (data.cell.height / 2)
              const xInicial = data.cell.x + ((data.cell.width - larguraTotal) / 2) + (diametro / 2)

              resultados.forEach((resultado, indiceResultado) => {
                const xCentro = xInicial + (indiceResultado * (diametro + gap))
                const simbolo = this.simboloResultadoCompartilhamento(resultado)

                let corFundo = [203, 213, 225]
                let corTexto = [51, 65, 85]

                if (resultado === "V") {
                  corFundo = [22, 163, 74]
                  corTexto = [255, 255, 255]
                } else if (resultado === "E") {
                  corFundo = [156, 163, 175]
                  corTexto = [255, 255, 255]
                } else if (resultado === "D") {
                  corFundo = [239, 68, 68]
                  corTexto = [255, 255, 255]
                }

                doc.setFillColor(...corFundo)
                doc.circle(xCentro, yCentro, diametro / 2, "F")

                doc.setTextColor(...corTexto)
                doc.setFont("helvetica", "bold")
                doc.setFontSize(7)
                doc.text(simbolo, xCentro, yCentro + 0.9, { align: "center" })
              })
            }
          }
        })

        cursorY = (doc.lastAutoTable?.finalY || cursorY) + 6
      }

      if (itensGlossario.length) {
        const qtdColunasGlossario = 4
        const qtdLinhasGlossario = Math.ceil(itensGlossario.length / qtdColunasGlossario)
        const alturaGlossario = 12 + (qtdLinhasGlossario * 6.6)
        garantirEspaco(alturaGlossario + 2)

        const yGlossario = cursorY
        const larguraCard = pageWidth - (margemX * 2)
        doc.setFillColor(...cores.primarySoft)
        doc.setDrawColor(...cores.border)
        doc.roundedRect(margemX, yGlossario, larguraCard, alturaGlossario, 3.4, 3.4, "FD")

        doc.setFont("helvetica", "bold")
        doc.setFontSize(10.2)
        doc.setTextColor(...cores.primary)
        doc.text("Glossário da classificação", margemX + 5, yGlossario + 6.2)

        const larguraUtilGloss = larguraCard - 10
        const larguraColunaGloss = larguraUtilGloss / qtdColunasGlossario
        const yItensBase = yGlossario + 10.8
        const truncarDescricaoPdf = (texto, larguraMax) => {
          let saida = String(texto || "")
          if (doc.getTextWidth(saida) <= larguraMax) return saida
          while (saida.length && doc.getTextWidth(`${saida}...`) > larguraMax) {
            saida = saida.slice(0, -1)
          }
          return `${saida}...`
        }

        itensGlossario.forEach((item, indice) => {
          const coluna = indice % qtdColunasGlossario
          const linha = Math.floor(indice / qtdColunasGlossario)
          const xBase = margemX + 5 + (coluna * larguraColunaGloss)
          const yLinha = yItensBase + (linha * 6.6)
          const sigla = String(item?.sigla || "").toUpperCase()

          doc.setFont("helvetica", "bold")
          doc.setFontSize(7.2)
          const larguraSigla = Math.max(10, doc.getTextWidth(sigla) + 5)
          doc.setFillColor(...cores.primary)
          doc.roundedRect(xBase, yLinha - 3.6, larguraSigla, 4.8, 1.8, 1.8, "F")

          doc.setTextColor(...cores.white)
          doc.text(sigla, xBase + (larguraSigla / 2), yLinha - 0.3, { align: "center" })

          const larguraDescricao = larguraColunaGloss - larguraSigla - 3
          const descricao = truncarDescricaoPdf(item?.descricao, larguraDescricao)
          doc.setFont("helvetica", "normal")
          doc.setFontSize(7.2)
          doc.setTextColor(...cores.muted)
          doc.text(descricao, xBase + larguraSigla + 2, yLinha)
        })

        cursorY = yGlossario + alturaGlossario + 3
      }

      const totalPaginas = doc.getNumberOfPages()
      for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        doc.setPage(pagina)
        desenharRodape(pagina, totalPaginas)
      }

      const nomeArquivo = String(this.campeonato?.nome || "campeonato")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase()

      doc.save(`classificacao_${nomeArquivo || "campeonato"}.pdf`)
    },

    async compartilharPlacar() {
      if (!this.obterBlocosClassificacaoCompartilhamento().length) {
        await Swal.fire({
          title: "Atenção",
          text: "Não há dados de classificação para compartilhar.",
          icon: "warning",
          target: ".modal-escolha-config"
        })
        return
      }

      try {
        const escolhaFormato = await Swal.fire({
          title: "Compartilhar placar",
          text: "Escolha o formato para compartilhar.",
          icon: "question",
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: "Imagem",
          denyButtonText: "PDF",
          cancelButtonText: "Cancelar",
          target: ".modal-escolha-config"
        })

        if (escolhaFormato.isConfirmed) {
          const blob = await this.gerarBlobImagemPlacar()
          const payload = this.criarPayloadArquivo(blob, "png")
          this.baixarArquivo(payload.url, payload.arquivoNome)
          await Swal.fire({
            title: "Imagem pronta",
            text: "A imagem do placar foi baixada.",
            icon: "success",
            target: ".modal-escolha-config"
          })
          return
        }

        if (escolhaFormato.isDenied) {
          await this.gerarPdfPlacar()
          await Swal.fire({
            title: "PDF gerado",
            text: "O arquivo PDF do placar foi baixado.",
            icon: "success",
            target: ".modal-escolha-config"
          })
        }
      } catch (error) {
        console.error("Erro ao compartilhar placar:", error)
        await Swal.fire({
          title: "Erro",
          text: "Não foi possível compartilhar o placar.",
          icon: "error",
          target: ".modal-escolha-config"
        })
      }
    },

    async abrirModalFase() {
      await this.listarTimes()
      this.mostrarModalFase = true
    },

    fecharModalFase() {
      this.mostrarModalFase = false
      this.nomeFase = ""
      this.timesSelecionados = []
    },

    async carregarConfiguracoesClassificacao() {
      const resp = await api.get(`/ordem/classificacao/${this.campeonato.id}`)
      const data = resp.data || {}

      const ordem = Array.isArray(data?.ordem) ? data.ordem : []
      const colunasApi = Array.isArray(data?.colunas) ? data.colunas : []

      this.criterios = ordem.slice()
      this.colunasSelecionadas = resolverColunasVisiveisClassificacao(
        this.campeonato?.modalidade?.nome,
        colunasApi
      )
      this.montarOrdemColunas(this.colunasSelecionadas)
      this.classificacao = Array.isArray(data?.classificacao) ? data.classificacao : []
    },

    async criteriosClassificacao() {
      if (this.campeonatoEhEliminatorias) return
      this.mostrarModalCriterios = true
      try {
        await this.carregarConfiguracoesClassificacao()
      } catch (err) {
        console.error("Erro ao carregar critérios:", err)
        this.criterios = []
      }
    },

    fecharModalCriterios() {
      this.mostrarModalCriterios = false
    },

    async colunasClassificacao() {
      if (this.campeonatoEhEliminatorias) return
      this.mostrarModalColunas = true
      try {
        await this.carregarConfiguracoesClassificacao()
      } catch (err) {
        console.error("Erro ao carregar colunas da classificação:", err)
        this.colunasSelecionadas = getChavesPadraoColunasClassificacao(this.campeonato?.modalidade?.nome)
        this.montarOrdemColunas(this.colunasSelecionadas)
      }
    },

    fecharModalColunas() {
      this.mostrarModalColunas = false
    },

    iniciarArraste(indice) {
      this.indiceArraste = indice
    },

    soltar(indiceDestino) {
      if (this.indiceArraste === null || this.indiceArraste === indiceDestino) return
      const criterioMovido = this.criterios[this.indiceArraste]
      if (!criterioMovido) {
        this.indiceArraste = null
        return
      }
      this.criterios.splice(this.indiceArraste, 1)
      this.criterios.splice(indiceDestino, 0, criterioMovido)
      this.indiceArraste = null
    },

    colunaSelecionada(chave) {
      return this.colunasSelecionadas.includes(chave)
    },

    montarOrdemColunas(colunasSelecionadas = []) {
      const selecionadasNormalizadas = resolverColunasVisiveisClassificacao(
        this.campeonato?.modalidade?.nome,
        colunasSelecionadas
      )
      const disponiveis = this.colunasDisponiveis
      const mapa = new Map(disponiveis.map(coluna => [coluna.key, coluna]))
      const adicionadas = new Set()
      const ordem = []

      for (const chave of selecionadasNormalizadas) {
        if (!mapa.has(chave) || adicionadas.has(chave)) continue
        ordem.push(mapa.get(chave))
        adicionadas.add(chave)
      }

      for (const coluna of disponiveis) {
        if (adicionadas.has(coluna.key)) continue
        ordem.push(coluna)
        adicionadas.add(coluna.key)
      }

      this.ordemColunas = ordem
    },

    iniciarArrasteColuna(event, indice) {
      this.indiceArrasteColuna = indice
      if (event?.dataTransfer) {
        event.dataTransfer.effectAllowed = "move"
        event.dataTransfer.setData("text/plain", String(indice))
      }
    },

    soltarColuna(indiceDestino) {
      if (this.indiceArrasteColuna === null || this.indiceArrasteColuna === indiceDestino) return

      const ordemAtual = this.colunasOrdenadas.slice()
      const colunaMovida = ordemAtual[this.indiceArrasteColuna]
      if (!colunaMovida) {
        this.indiceArrasteColuna = null
        return
      }

      ordemAtual.splice(this.indiceArrasteColuna, 1)
      ordemAtual.splice(indiceDestino, 0, colunaMovida)

      this.ordemColunas = ordemAtual
      this.indiceArrasteColuna = null
    },

    finalizarArrasteColuna() {
      this.indiceArrasteColuna = null
    },

    async salvarOrdem() {
      if (this.salvandoOrdem) return
      this.salvandoOrdem = true

      try {
        const ordem = this.criterios.map(c => ({ label: c.label, value: c.value }))
        await api.put(`/campeonatos/${this.campeonato.id}/classificacao/ordem`, { ordem })

        await Swal.fire({
          title: "Sucesso",
          text: "Ordem salva com sucesso",
          icon: "success",
          target: ".modal-criterios"
        })

        this.$emit("criterios", ordem)
        this.fecharModalCriterios()
      } catch {
        Swal.fire({
          title: "Erro",
          text: "Erro ao salvar ordem",
          icon: "error",
          target: ".modal-criterios"
        })
      } finally {
        this.salvandoOrdem = false
      }
    },

    async salvarColunas() {
      if (this.salvandoColunas) return

      const selecionadas = new Set(this.colunasSelecionadas)
      const ordemSelecionada = this.colunasOrdenadas
        .map(coluna => coluna.key)
        .filter(chave => selecionadas.has(chave))

      const colunas = resolverColunasVisiveisClassificacao(
        this.campeonato?.modalidade?.nome,
        ordemSelecionada
      )

      if (!Array.isArray(colunas) || !colunas.length) {
        await Swal.fire({
          title: "Atenção",
          text: "Selecione ao menos uma coluna.",
          icon: "warning",
          target: ".modal-colunas"
        })
        return
      }

      this.salvandoColunas = true

      try {
        await api.put(`/campeonatos/${this.campeonato.id}/classificacao/ordem`, { colunas })

        this.colunasSelecionadas = colunas
        this.montarOrdemColunas(colunas)
        this.$emit("colunas", colunas)

        await Swal.fire({
          title: "Sucesso",
          text: "Colunas salvas com sucesso",
          icon: "success",
          target: ".modal-colunas"
        })

        this.fecharModalColunas()
      } catch {
        await Swal.fire({
          title: "Erro",
          text: "Erro ao salvar colunas",
          icon: "error",
          target: ".modal-colunas"
        })
      } finally {
        this.salvandoColunas = false
      }
    },

    grupos() {
      if (this.campeonatoEhEliminatorias) return
      this.$emit("grupos")
      this.fechar()
    },

    async listarTimes() {
      try {
        const { data } = await api.get(`/${this.campeonato.id}/times`)
        this.times = data
      } catch (err) {
        console.error(err)
        Swal.fire("Erro", "Não foi possível carregar os times.", "error")
      }
    },

    toggleTime(timeId) {
      const index = this.timesSelecionados.indexOf(timeId)
      if (index > -1) this.timesSelecionados.splice(index, 1)
      else this.timesSelecionados.push(timeId)
    },

    async criarFase() {
      if (this.salvandoFase) return

      if (!this.nomeFase) {
        Swal.fire("Erro", "Informe o nome da fase.", "error")
        return
      }

      if (this.timesSelecionados.length === 0) {
        Swal.fire("Erro", "Selecione pelo menos um time.", "error")
        return
      }

      this.salvandoFase = true

      try {
        const { data } = await api.post(`/campeonatos/${this.campeonato.id}/fases`, {
          nome: this.nomeFase,
          times: this.timesSelecionados
        })

        Swal.fire("Sucesso", "Fase criada com sucesso!", "success")
        this.$emit("faseCriada", data.fase)
        this.fecharModalFase()
      } catch (err) {
        console.error(err)
        Swal.fire("Erro", "Erro ao criar fase.", "error")
      } finally {
        this.salvandoFase = false
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  padding: 30px 40px;
  border-radius: 10px;
  width: 900px;
  max-width: 95%;
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.modal-content h2 {
  margin-bottom: 20px;
  color: #3b82f6;
  font-weight: bold;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal-header h2 {
  margin-bottom: 0;
}

.btn-close-x {
  width: 34px;
  height: 34px;
  border: 1px solid #3b82f6;
  border-radius: 999px;
  background: #fff;
  color: #3b82f6;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  flex: 0 0 auto;
}

.modal-escolha-config {
  width: min(720px, 92vw);
  padding: 26px 28px;
  border-radius: 18px;
  text-align: left;
}

.modal-escolha-config .modal-header {
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
  color: #0f172a;
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
  color: #777;
  line-height: 1.25;
  width: 100%;
  text-align: left;
}

.botoes {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.btn-save,
.btn-cancel {
  flex: 1;
  padding: 10px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: white;
  font-weight: 700;
}

.btn-save {
  background-color: #3b82f6;
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
  background-color: #3b82f6;
}

.modal-escolha-config .btn-cancel {
  background: transparent;
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.35);
}

.modal-header-copy {
  min-width: 0;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 12px;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.modal-times {
  width: min(720px, 92vw);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding: 24px 28px;
  border-radius: 18px;
  text-align: left;
}

.modal-times .modal-header {
  align-items: flex-start;
  margin-bottom: 18px;
}

.modal-times .title {
  display: block;
  line-height: 1.08;
}

.modal-times-descricao {
  margin: 10px 0 0;
  line-height: 1.55;
}

.fase-form-card,
.fase-times-card {
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
}

.fase-form-card {
  padding: 18px;
  margin-bottom: 16px;
}

.campo-fase {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.campo-fase-label {
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
}

.campo-fase input {
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.34);
  background: #fff;
  color: #0f172a;
  font: inherit;
}

.campo-fase input:focus {
  outline: none;
  border-color: rgba(37, 99, 235, 0.58);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.14);
}

.fase-times-card {
  padding: 18px;
}

.fase-times-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.fase-times-head h3 {
  margin: 8px 0 0;
  color: #0f172a;
  font-size: 23px;
}

.fase-total {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 8px 12px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.modal-times .lista-times {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}

.time-card {
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 18px;
  padding: 14px;
  background: #fff;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.time-card:hover {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.34);
  box-shadow: 0 18px 36px rgba(59, 130, 246, 0.1);
}

.time-card.selecionado {
  border-color: rgba(37, 99, 235, 0.42);
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  box-shadow: 0 20px 40px rgba(37, 99, 235, 0.14);
}

.time-card-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-card-copy {
  flex: 1;
  min-width: 0;
}

.time-foto {
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
}

.time-foto img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.time-nome {
  margin: 0;
  font-weight: 800;
  color: #0f172a;
  font-size: 17px;
}

.time-card-meta {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.time-card-badge {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(37, 99, 235, 0.14);
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.estado-vazio-times {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  border: 1px dashed rgba(148, 163, 184, 0.45);
  border-radius: 18px;
  color: #64748b;
  text-align: center;
  padding: 18px;
}

.botoes-modal-times {
  margin-top: 18px;
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

  .modal-escolha-config {
    width: min(100%, 100vw - 20px);
    padding: 16px 14px;
    border-radius: 14px;
  }

  .modal-escolha-config .modal-header {
    margin-bottom: 8px;
  }

  .modal-escolha-config .title {
    font-size: 22px;
    line-height: 1.12;
  }

  .modal-escolha-config .tipo-campeonato-lista {
    gap: 10px;
    margin: 8px 0 14px;
  }

  .modal-escolha-config .btn-tipo-card {
    padding: 11px 12px;
    border-radius: 10px;
    gap: 4px;
  }

  .modal-escolha-config .btn-tipo-titulo {
    font-size: 15px;
  }

  .modal-escolha-config .btn-tipo-sub {
    font-size: 12px;
    line-height: 1.3;
  }

  .modal-times {
    width: min(100%, 100vw - 20px);
    max-height: calc(100dvh - 20px);
    padding: 16px 14px;
    border-radius: 14px;
  }

  .modal-times .modal-header {
    position: relative;
    padding-right: 46px;
    gap: 10px;
    margin-bottom: 14px;
  }

  .modal-times .title {
    font-size: 26px;
  }

  .modal-times .btn-close-x {
    position: absolute;
    top: 0;
    right: 0;
  }

  .modal-times-descricao {
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.45;
  }

  .fase-form-card,
  .fase-times-card {
    padding: 14px;
    border-radius: 16px;
  }

  .campo-fase input {
    min-height: 44px;
    padding: 10px 12px;
  }

  .fase-times-head {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
  }

  .fase-times-head h3 {
    font-size: 19px;
  }

  .fase-total {
    align-self: auto;
    padding: 6px 10px;
    font-size: 11px;
  }

  .modal-times .lista-times {
    grid-template-columns: 1fr;
    gap: 10px;
    max-height: 300px;
  }

  .time-card {
    padding: 12px;
    border-radius: 16px;
  }

  .time-card-top {
    gap: 10px;
  }

  .time-foto {
    width: 40px;
    height: 40px;
    flex-basis: 40px;
  }

  .time-nome {
    font-size: 15px;
  }

  .time-card-meta {
    font-size: 12px;
  }

  .time-card-badge {
    padding: 5px 8px;
    font-size: 10px;
  }

  .estado-vazio-times {
    min-height: 110px;
    border-radius: 16px;
    padding: 14px;
    font-size: 13px;
  }
}

.modal-criterios {
  width: 900px;
}

.descricao {
  margin-bottom: 15px;
  color: #6b7280;
}

.modal-times .modal-times-descricao {
  margin: 10px 0 0;
}

.lista-criterios {
  border: 1px solid #3b82f6;
  border-radius: 8px;
  max-height: 350px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
}

.lista-criterios::-webkit-scrollbar {
  width: 6px;
}

.lista-criterios::-webkit-scrollbar-thumb {
  background: #3b82f6;
  border-radius: 10px;
}

.lista-criterios::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.criterio-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  cursor: grab;
  background: white;
}

.criterio-item:last-child {
  border-bottom: none;
}

.criterio-item:hover {
  background: #f9fafb;
}

.ordem {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex: 0 0 auto;
}

.nome {
  flex: 1;
  color: #0f172a;
  font-weight: 600;
}

.drag {
  cursor: grab;
  color: #6b7280;
  font-size: 18px;
}

.modal-colunas {
  width: 900px;
}

.lista-colunas {
  max-height: 380px;
}

.coluna-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  cursor: grab;
  background: white;
  user-select: none;
}

.coluna-item:last-child {
  border-bottom: none;
}

.coluna-item:hover {
  background: #f9fafb;
}

.coluna-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
  flex: 0 0 auto;
}

.coluna-item-ativa {
  background: #f8fbff;
}

.coluna-item.dragging {
  opacity: 0.6;
}

.drag-handle {
  color: #94a3b8;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  flex: 0 0 auto;
}

.coluna-item-fixa {
  background: #f8fafc;
  cursor: not-allowed;
  user-select: auto;
}

.coluna-item-fixa input[type="checkbox"] {
  cursor: not-allowed;
}

.sigla-coluna {
  margin-left: auto;
  border: 1px solid #bfdbfe;
  background: #dbeafe;
  color: #1d4ed8;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

@media (max-width: 768px) {
  .modal-criterios,
  .modal-colunas {
    width: min(100%, 100vw - 20px);
  }

  .modal-criterios .lista-criterios,
  .modal-colunas .lista-criterios {
    max-height: calc(100dvh - 260px);
  }
}
</style>


