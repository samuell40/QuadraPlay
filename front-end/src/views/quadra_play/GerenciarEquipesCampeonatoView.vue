<template>
  <div class="layout">
    <NavBarQuadras />
    <SidebarCampeonato @sidebar-toggle="sidebarCollapsed = $event" />

    <div class="conteudo" :class="{ collapsed: sidebarCollapsed, 'campeonato-finalizado': isCampeonatoEncerrado }">
      <div class="header">
        <div class="header-copy">
          <div class="header-top">
            <h1 class="title">Gerenciar Equipes</h1>

            <button
              v-if="!isCampeonatoEncerrado"
              class="btn-add"
              :disabled="isAdicionandoEquipe || isLoadingEquipesDisponiveis"
              @click="abrirAdicionarEquipe"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                class="bi bi-plus-circle-fill btn-add-icon" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z" />
              </svg>
              <span class="btn-add-label-desktop">
                {{ isAdicionandoEquipe ? 'Adicionando...' : (isLoadingEquipesDisponiveis ? 'Carregando...' : 'Adicionar time') }}
              </span>
              <span class="btn-add-label-mobile">
                {{ isAdicionandoEquipe ? 'Adicionando...' : (isLoadingEquipesDisponiveis ? 'Carregando...' : 'Adicionar') }}
              </span>
            </button>
          </div>

          <a class="page-subtitle">
            Gerencie os times do campeonato, acompanhe cartoes por jogador e controle suspensoes manuais.
          </a>
        </div>
      </div>

      <div v-if="isLoadingEquipes" class="painel-card loader-container-centralizado">
        <LoadingState
          :theme="isCampeonatoEncerrado ? 'danger' : 'default'"
          title="Carregando equipes"
          description="Buscando os times vinculados ao campeonato."
        />
      </div>

        <div v-else class="painel-card">
        <div class="section-head">
          <div>
            <span class="section-kicker">Equipes</span>
            <h2>Times participantes</h2>
            <a>Selecione um time para listar os jogadores e controlar suspensoes.</a>
          </div>
        </div>

        <div v-if="equipes.length" class="lista-equipes">
          <article
            v-for="equipe in equipes"
            :key="equipe.id"
            class="equipe-card"
            :class="{ ativa: Number(equipe.id) === Number(equipeSelecionadaId) }"
            @click="abrirModalJogadoresEquipe(equipe)"
          >
            <div class="equipe-head">
              <div class="equipe-main">
                <img class="equipe-foto" :src="obterFotoTimeCard(equipe.foto)" :alt="equipe.nome" />
                <div class="equipe-info">
                  <strong>{{ equipe.nome }}</strong>
                  <span>{{ equipe.qtdJogadores || 0 }} jogador{{ (equipe.qtdJogadores || 0) === 1 ? '' : 'es' }}</span>
                  <span class="equipe-treinador">
                    Treinador: {{ equipe.treinador || 'Nao informado' }}
                  </span>
                </div>
              </div>

              <div class="equipe-actions">
                <span v-if="Number(equipe.id) === Number(equipeSelecionadaId)" class="tag-selecionada">Selecionada</span>

                <button
                  v-if="!isCampeonatoEncerrado"
                  type="button"
                  class="btn-remove-secundario"
                  :disabled="isRemovendoEquipeId === equipe.id"
                  @click.stop="removerEquipe(equipe)"
                >
                  {{ isRemovendoEquipeId === equipe.id ? 'Removendo...' : 'Remover time' }}
                </button>
              </div>
            </div>

            <button
              type="button"
              class="btn-jogadores btn-jogadores-principal btn-jogadores-bloco"
              @click.stop="abrirModalJogadoresEquipe(equipe)"
            >
              Jogadores
            </button>
          </article>
        </div>

        <div v-else class="estado-vazio">
          Nenhum time vinculado neste campeonato.
        </div>
      </div>

      <div v-if="mostrarModalAdicionarEquipe" class="modal-overlay modal-overlay-sub" @click.self="fecharModalAdicionarEquipe">
        <div class="modal-content modal-adicionar-equipe">
          <div class="modal-header">
            <div class="modal-header-copy">
              <span class="section-kicker">Equipes</span>
              <h2 class="titulo-modal">Adicionar time ao campeonato</h2>
              <a class="modal-subtitle">Selecione um ou mais times da modalidade para vincular a este campeonato.</a>
            </div>

            <button
              type="button"
              class="btn-close-x"
              :disabled="isAdicionandoEquipe || isLoadingEquipesDisponiveis"
              @click="fecharModalAdicionarEquipe"
            >
              x
            </button>
          </div>

          <div v-if="isLoadingEquipesDisponiveis" class="estado-card">
            <LoadingState
              size="compact"
              :theme="isCampeonatoEncerrado ? 'danger' : 'default'"
              title="Carregando times"
              description="Buscando os times disponiveis para esta modalidade."
            />
          </div>

          <div v-else-if="equipesDisponiveis.length" class="lista-times-disponiveis">
            <article
              v-for="time in equipesDisponiveis"
              :key="time.id"
              class="time-disponivel-card"
              :class="{ selecionado: equipesDisponiveisSelecionadas.includes(Number(time.id)) }"
              @click="alternarEquipeDisponivelSelecionada(time.id)"
            >
              <div class="time-disponivel-topo">
                <img class="time-disponivel-foto" :src="obterFotoTimeCard(time.foto)" :alt="time.nome" />
                <h3 class="time-disponivel-nome">{{ time.nome }}</h3>
              </div>
              <span class="time-disponivel-meta">
                {{ time._count?.jogadores || time.qtdJogadores || 0 }} jogador{{ (time._count?.jogadores || time.qtdJogadores || 0) === 1 ? '' : 'es' }}
              </span>
            </article>
          </div>

          <div v-else class="estado-vazio">
            Todos os times desta modalidade ja estao vinculados ao campeonato.
          </div>

          <div class="modal-adicionar-acoes">
            <button
              type="button"
              class="btn-salvar-modal"
              :disabled="isAdicionandoEquipe || !equipesDisponiveisSelecionadas.length || !equipesDisponiveis.length"
              @click="confirmarAdicionarEquipe"
            >
              <span class="btn-inline-content">
                <span v-if="isAdicionandoEquipe" class="btn-save-spinner" aria-hidden="true"></span>
                <span>{{ isAdicionandoEquipe ? 'Salvando...' : 'Salvar' }}</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="mostrarModalJogadores" class="modal-overlay" @click.self="fecharModalJogadores">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-header-copy">
              <h2 class="titulo-modal">{{ tituloJogadores }}</h2>
              <a class="modal-subtitle">
                {{ descricaoModalJogadores }}
              </a>
            </div>

            <button type="button" class="btn-close-x" @click="fecharModalJogadores">x</button>
          </div>

          <div v-if="isLoadingJogadores" class="estado-card">
            <LoadingState
              size="compact"
              :theme="isCampeonatoEncerrado ? 'danger' : 'default'"
              title="Carregando jogadores"
              :description="descricaoCarregamentoJogadores"
            />
          </div>

          <div v-else-if="jogadores.length" class="tabela-wrap">
            <table
              class="tabela-jogadores"
              :class="{
                'tabela-sem-cartoes': !mostrarColunasCartoes,
                'tabela-sem-acoes': isCampeonatoEncerrado
              }"
            >
              <thead>
                <tr>
                  <th>Jogador</th>
                  <th v-if="mostrarColunasCartoes">CA</th>
                  <th v-if="mostrarColunasCartoes">CV</th>
                  <th>Status</th>
                  <th v-if="!isCampeonatoEncerrado" class="th-acoes">Acoes</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="jogador in jogadores" :key="jogador.id">
                  <td class="cell-jogador">
                    <div class="cell-jogador-inner">
                      <span
                        v-if="jogador.numero !== null && jogador.numero !== undefined"
                        class="jogador-numero-inline"
                      >
                        {{ jogador.numero }}
                      </span>
                      <img class="jogador-foto" :src="obterFotoJogador(jogador.foto)" :alt="jogador.nome" />

                      <div class="jogador-info">
                        <strong>{{ jogador.nome }}</strong>
                        <span>{{ jogador.funcao?.nome || 'Sem funcao' }}</span>
                      </div>
                    </div>
                  </td>

                  <td v-if="mostrarColunasCartoes">{{ jogador.cartoesAmarelos || 0 }}</td>
                  <td v-if="mostrarColunasCartoes">{{ jogador.cartoesVermelhos || 0 }}</td>

                  <td>
                    <span class="status-pill" :class="classeStatus(jogador)">
                      {{ textoStatus(jogador) }}
                    </span>
                  </td>

                  <td v-if="!isCampeonatoEncerrado" class="cell-acoes">
                    <div class="cell-acoes-inner">
                      <button
                        v-if="jogador.suspenso"
                        type="button"
                        class="btn-acao btn-liberar"
                        :disabled="acaoJogadorId === jogador.id || jogador.suspensaoManual === false"
                        @click="atualizarSuspensao(jogador, false)"
                      >
                        Remover suspensao
                      </button>

                      <button
                        v-else
                        type="button"
                        class="btn-acao btn-suspender"
                        :disabled="acaoJogadorId === jogador.id || jogador.suspensaoManual === true"
                        @click="atualizarSuspensao(jogador, true)"
                      >
                        Suspender
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="estado-vazio">
            Nenhum jogador vinculado a este time.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2'
import api from '@/axios'
import NavBarQuadras from '@/components/quadraplay/NavBarQuadras.vue'
import SidebarCampeonato from '@/components/quadraplay/SidebarCampeonato.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import { obterFotoTime } from '@/utils/timeImagem'
import { carregarCampeonato } from '@/utils/persistirCampeonato'
import iconJogadorPadrao from '@/assets/imagem_padrao_usuario.png'

const STATUS_CAMPEONATO_ENCERRADO = ['FINALIZADO', 'FINALIZADA', 'CANCELADO', 'CANCELADA', 'DELETADO', 'DELETADA']

function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function modalidadeSemCartoes(nomeModalidade) {
  const nome = normalizarTexto(nomeModalidade)
  if (!nome) return false

  const ehGrupoVolei = nome.includes('volei') || nome.includes('futevolei')
  const ehBeachTenis = nome.includes('beach') && (nome.includes('tenis') || nome.includes('tennis'))
  return ehGrupoVolei || ehBeachTenis
}

export default {
  name: 'GerenciarEquipesCampeonatoView',
  components: {
    NavBarQuadras,
    SidebarCampeonato,
    LoadingState
  },
  data() {
    return {
      sidebarCollapsed: false,
      campeonato: null,
      equipes: [],
      equipeSelecionadaId: null,
      mostrarModalJogadores: false,
      mostrarModalAdicionarEquipe: false,
      jogadores: [],
      isLoadingEquipes: false,
      isLoadingJogadores: false,
      isLoadingEquipesDisponiveis: false,
      isAdicionandoEquipe: false,
      isRemovendoEquipeId: null,
      acaoJogadorId: null,
      jogadorPadrao: iconJogadorPadrao,
      equipesDisponiveis: [],
      equipesDisponiveisSelecionadas: []
    }
  },
  computed: {
    campeonatoId() {
      return Number(this.campeonato?.id || this.$route?.query?.id || 0) || null
    },
    isCampeonatoEncerrado() {
      return STATUS_CAMPEONATO_ENCERRADO.includes(String(this.campeonato?.status || '').toUpperCase())
    },
    equipeSelecionada() {
      return this.equipes.find((item) => Number(item.id) === Number(this.equipeSelecionadaId)) || null
    },
    tituloJogadores() {
      if (!this.equipeSelecionada) {
        return 'Elenco do time'
      }
      return `Jogadores ${this.equipeSelecionada.nome}`
    },
    mostrarColunasCartoes() {
      return !modalidadeSemCartoes(this.campeonato?.modalidade?.nome)
    },
    descricaoModalJogadores() {
      if (this.mostrarColunasCartoes) {
        return 'Cartoes acumulados no campeonato e status atual de suspensao por jogador.'
      }
      return 'Status atual de suspensao por jogador.'
    },
    descricaoCarregamentoJogadores() {
      if (this.mostrarColunasCartoes) {
        return 'Buscando cartoes e suspensoes do jogadores selecionados.'
      }
      return 'Buscando status de suspensao dos jogadores selecionado.'
    }
  },
  watch: {
    '$route.query.id': {
      handler() {
        this.inicializar()
      }
    }
  },
  mounted() {
    this.inicializar()
  },
  methods: {
    obterFotoTimeCard(foto) {
      return obterFotoTime(foto)
    },
    obterFotoJogador(foto) {
      return foto || this.jogadorPadrao
    },
    classeStatus(jogador) {
      return jogador?.suspenso ? 'status-suspenso' : 'status-liberado'
    },
    textoStatus(jogador) {
      if (jogador?.suspenso) return 'Suspenso'
      return 'Ativo'
    },
    aplicarPayloadEquipes(payload, equipePreferidaId = null) {
      const lista = Array.isArray(payload?.equipes) ? payload.equipes : []
      this.equipes = lista

      if (this.campeonato && payload?.campeonatoStatus) {
        this.campeonato.status = payload.campeonatoStatus
      }

      const preferida = Number(equipePreferidaId || 0)
      const atual = Number(this.equipeSelecionadaId || 0)

      if (preferida && lista.some((item) => Number(item.id) === preferida)) {
        this.equipeSelecionadaId = preferida
        return
      }

      if (atual && lista.some((item) => Number(item.id) === atual)) {
        this.equipeSelecionadaId = atual
        return
      }

      this.equipeSelecionadaId = null
      this.jogadores = []
      this.mostrarModalJogadores = false
    },
    async inicializar() {
      this.equipes = []
      this.equipeSelecionadaId = null
      this.mostrarModalJogadores = false
      this.mostrarModalAdicionarEquipe = false
      this.jogadores = []
      this.equipesDisponiveis = []
      this.equipesDisponiveisSelecionadas = []

      try {
        this.campeonato = await carregarCampeonato(this.$route)
      } catch (error) {
        console.error('Erro ao carregar campeonato da tela de equipes:', error)
      }

      await this.carregarEquipes()
    },
    async carregarEquipes(opcoes = {}) {
      if (!this.campeonatoId) return

      this.isLoadingEquipes = true
      try {
        const { data } = await api.get(`/campeonato/${this.campeonatoId}/equipes`)
        this.aplicarPayloadEquipes(data, opcoes?.equipePreferidaId)
      } catch (error) {
        console.error('Erro ao carregar equipes:', error)
        this.equipes = []
        this.jogadores = []
        await Swal.fire('Erro', error?.response?.data?.error || 'Nao foi possivel carregar as equipes.', 'error')
      } finally {
        this.isLoadingEquipes = false
      }
    },
    async carregarJogadores(timeId) {
      const idTime = Number(timeId)
      if (!this.campeonatoId || !idTime) {
        this.jogadores = []
        return
      }

      this.isLoadingJogadores = true
      try {
        const { data } = await api.get(`/campeonato/${this.campeonatoId}/equipes/${idTime}/jogadores`)
        const idTimeResposta = Number(data?.time?.id || idTime)
        this.equipeSelecionadaId = Number.isInteger(idTimeResposta) && idTimeResposta > 0 ? idTimeResposta : idTime
        this.jogadores = Array.isArray(data?.jogadores)
          ? data.jogadores.map((jogador) => ({ ...jogador, timeId: this.equipeSelecionadaId }))
          : []
      } catch (error) {
        console.error('Erro ao carregar jogadores da equipe:', error)
        this.jogadores = []
        await Swal.fire('Erro', error?.response?.data?.error || 'Nao foi possivel carregar os jogadores.', 'error')
      } finally {
        this.isLoadingJogadores = false
      }
    },
    async abrirModalJogadoresEquipe(equipe) {
      const idTime = Number(equipe?.id || equipe)
      if (!idTime) return

      this.equipeSelecionadaId = idTime
      this.mostrarModalJogadores = true
      this.jogadores = []
      await this.carregarJogadores(idTime)
    },
    fecharModalJogadores() {
      this.mostrarModalJogadores = false
      this.jogadores = []
      this.equipeSelecionadaId = null
    },
    fecharModalAdicionarEquipe(force = false) {
      if (this.isAdicionandoEquipe && !force) return
      this.mostrarModalAdicionarEquipe = false
      this.equipesDisponiveis = []
      this.equipesDisponiveisSelecionadas = []
      this.isLoadingEquipesDisponiveis = false
    },
    alternarEquipeDisponivelSelecionada(timeId) {
      const id = Number(timeId)
      if (!id) return

      if (this.equipesDisponiveisSelecionadas.includes(id)) {
        this.equipesDisponiveisSelecionadas = this.equipesDisponiveisSelecionadas.filter(item => item !== id)
        return
      }

      this.equipesDisponiveisSelecionadas = [...this.equipesDisponiveisSelecionadas, id]
    },
    async abrirAdicionarEquipe() {
      if (!this.campeonatoId || this.isCampeonatoEncerrado) return

      this.mostrarModalAdicionarEquipe = true
      this.isLoadingEquipesDisponiveis = true
      this.equipesDisponiveis = []
      this.equipesDisponiveisSelecionadas = []

      try {
        const { data } = await api.get(`/campeonato/${this.campeonatoId}/equipes/disponiveis`)
        const opcoes = Array.isArray(data) ? data : []
        this.equipesDisponiveis = opcoes
      } catch (error) {
        console.error('Erro ao adicionar equipe:', error)
        this.mostrarModalAdicionarEquipe = false
        await Swal.fire('Erro', error?.response?.data?.error || 'Nao foi possivel carregar os times disponiveis.', 'error')
      } finally {
        this.isLoadingEquipesDisponiveis = false
      }
    },
    async confirmarAdicionarEquipe() {
      if (!this.campeonatoId || this.isCampeonatoEncerrado) return

      const idsSelecionados = [...new Set(
        (Array.isArray(this.equipesDisponiveisSelecionadas) ? this.equipesDisponiveisSelecionadas : [])
          .map(id => Number(id))
          .filter(id => Number.isInteger(id) && id > 0)
      )]

      if (!idsSelecionados.length) return

      this.isAdicionandoEquipe = true
      try {
        const resultados = await Promise.allSettled(
          idsSelecionados.map((timeId) =>
            api.post(`/campeonato/${this.campeonatoId}/equipes`, { timeId })
          )
        )

        const sucesso = resultados.filter(item => item.status === 'fulfilled').length
        const falhas = resultados.length - sucesso

        await this.carregarEquipes({ equipePreferidaId: idsSelecionados[0] })
        this.fecharModalAdicionarEquipe(true)

        if (falhas === 0) {
          await Swal.fire('Sucesso', `${sucesso} time${sucesso === 1 ? '' : 's'} adicionado${sucesso === 1 ? '' : 's'} ao campeonato.`, 'success')
        } else {
          await Swal.fire('Atenção', `${sucesso} time${sucesso === 1 ? '' : 's'} adicionado${sucesso === 1 ? '' : 's'}. ${falhas} nao puderam ser adicionados.`, 'warning')
        }
      } catch (error) {
        console.error('Erro ao confirmar adicao de equipe:', error)
        await Swal.fire('Erro', error?.response?.data?.error || 'Nao foi possivel adicionar o time.', 'error')
      } finally {
        this.isAdicionandoEquipe = false
      }
    },
    async removerEquipe(equipe) {
      if (!this.campeonatoId || this.isCampeonatoEncerrado || !equipe?.id) return

      const confirmacao = await Swal.fire({
        title: 'Remover time do campeonato?',
        text: `O time ${equipe.nome} sera removido deste campeonato.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Remover',
        cancelButtonText: 'Cancelar'
      })

      if (!confirmacao.isConfirmed) return

      this.isRemovendoEquipeId = equipe.id
      try {
        const resposta = await api.delete(`/campeonato/${this.campeonatoId}/equipes/${equipe.id}`)
        const equipeRemovidaSelecionada = Number(this.equipeSelecionadaId) === Number(equipe.id)
        this.aplicarPayloadEquipes(resposta?.data)

        if (this.mostrarModalJogadores && this.equipeSelecionadaId && !equipeRemovidaSelecionada) {
          await this.carregarJogadores(this.equipeSelecionadaId)
        }

        if (equipeRemovidaSelecionada) {
          this.fecharModalJogadores()
        }

        await Swal.fire('Removido', 'Time removido do campeonato com sucesso.', 'success')
      } catch (error) {
        console.error('Erro ao remover equipe:', error)
        await Swal.fire('Erro', error?.response?.data?.error || 'Nao foi possivel remover o time.', 'error')
      } finally {
        this.isRemovendoEquipeId = null
      }
    },
    async atualizarSuspensao(jogador, suspenso) {
      const timeId = Number(jogador?.timeId || this.equipeSelecionadaId || this.equipeSelecionada?.id || 0)
      if (!this.campeonatoId || !Number.isInteger(timeId) || timeId <= 0 || !jogador?.id || this.isCampeonatoEncerrado) {
        await Swal.fire('Erro', 'Nao foi possivel identificar o time deste jogador.', 'error')
        return
      }

      let motivo = ''
      let tipoDuracao = null
      let quantidadePartidas = null
      if (suspenso) {
        const opcoesDuracao = {
          1: '1 partida',
          2: '2 partidas',
          3: '3 partidas',
          4: '4 partidas',
          5: '5 partidas',
          6: '6 partidas',
          7: '7 partidas',
          8: '8 partidas',
          9: '9 partidas',
          10: '10 partidas',
          CAMPEONATO: 'Campeonato todo'
        }

        const confirmacao = await Swal.fire({
          title: `Suspender ${jogador.nome}?`,
          text: 'Selecione por quantas partidas o jogador deve ficar suspenso.',
          input: 'select',
          inputOptions: opcoesDuracao,
          inputValue: '1',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Suspender',
          cancelButtonText: 'Cancelar',
          inputValidator: (value) => {
            if (!value) return 'Selecione a duracao da suspensao.'
            return null
          }
        })

        if (!confirmacao.isConfirmed) return

        const duracaoSelecionada = String(confirmacao.value || '').trim().toUpperCase()
        if (duracaoSelecionada === 'CAMPEONATO') {
          tipoDuracao = 'CAMPEONATO'
          quantidadePartidas = null
          motivo = 'Suspensao manual aplicada ate o fim do campeonato.'
        } else {
          const quantidadeSelecionada = Number(duracaoSelecionada)
          if (!Number.isInteger(quantidadeSelecionada) || quantidadeSelecionada < 1 || quantidadeSelecionada > 10) {
            await Swal.fire('Atencao', 'Selecione uma duracao valida para suspensao manual.', 'warning')
            return
          }
          tipoDuracao = 'PARTIDAS'
          quantidadePartidas = quantidadeSelecionada
          motivo = `Suspensao manual definida por ${quantidadeSelecionada} ${quantidadeSelecionada === 1 ? 'partida' : 'partidas'}.`
        }
      } else {
        const confirmacao = await Swal.fire({
          title: `Remover suspensao de ${jogador.nome}?`,
          text: 'A liberacao manual pode sobrescrever a suspensao automatica por cartoes.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Remover suspensao',
          cancelButtonText: 'Cancelar'
        })

        if (!confirmacao.isConfirmed) return
      }

      this.acaoJogadorId = jogador.id
      try {
        const payload = { suspenso, motivo, timeId }
        if (suspenso) {
          payload.tipoDuracao = tipoDuracao
          payload.quantidadePartidas = quantidadePartidas
        }

        await api.put(
          `/campeonato/${this.campeonatoId}/equipes/${timeId}/jogadores/${jogador.id}/suspensao`,
          payload
        )

        await this.carregarJogadores(timeId)

        if (suspenso) {
          const textoDuracao = tipoDuracao === 'CAMPEONATO'
            ? 'ate o fim do campeonato.'
            : `por ${quantidadePartidas} ${quantidadePartidas === 1 ? 'partida' : 'partidas'}.`
          await Swal.fire('Sucesso', `${jogador.nome} foi suspenso ${textoDuracao}`, 'success')
        } else {
          await Swal.fire('Sucesso', 'Suspensao removida com sucesso.', 'success')
        }
      } catch (error) {
        console.error('Erro ao atualizar suspensao do jogador:', error)
        await Swal.fire('Erro', error?.response?.data?.error || 'Nao foi possivel atualizar a suspensao.', 'error')
      } finally {
        this.acaoJogadorId = null
      }
    }
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

.conteudo {
  flex: 1;
  padding: 24px 28px 32px;
  margin-top: 70px;
  margin-left: 250px;
  transition: margin-left 0.3s ease;
  color: #0f172a;
  background: #f8fafc;
}

.conteudo.collapsed {
  margin-left: 70px;
}

.header {
  margin-bottom: 18px;
}

.header-copy {
  width: 100%;
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.title {
  margin: 14px 0 10px;
  color: #2563eb;
  font-size: 40px;
  line-height: 0.98;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.page-subtitle {
  margin: 0;
  max-width: 720px;
  color: #475569;
  font-size: 17px;
  line-height: 1.6;
  text-decoration: none;
}

.btn-add {
  min-height: 52px;
  border: 1px solid rgba(59, 130, 246, 0.32);
  border-radius: 18px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 18px;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  box-shadow: 0 14px 26px rgba(59, 130, 246, 0.22);
}

.btn-add:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(59, 130, 246, 0.28);
}

.btn-add:disabled {
  opacity: 0.72;
  cursor: default;
  transform: none;
  box-shadow: none;
}

.btn-add-icon {
  width: 16px;
  height: 16px;
}

.btn-add-label-mobile {
  display: none;
}

.painel-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  padding: 24px;
  margin-bottom: 18px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  margin-bottom: 0;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #2563eb;
}

.section-head h2 {
  margin: 6px 0 8px;
  font-size: 28px;
  line-height: 1.05;
  color: #0f172a;
}

.section-head a {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.55;
  text-decoration: none;
}

.estado-card {
  width: 100%;
}

.loader-container-centralizado {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 0;
}

.lista-equipes {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.equipe-card {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid #dbe5f4;
  border-radius: 16px;
  background: #f8fbff;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  cursor: pointer;
}

.equipe-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.14);
  transform: translateY(-1px);
}

.equipe-card.ativa {
  border-color: #3b82f6;
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.25);
}

.equipe-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.equipe-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.equipe-foto {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid #bfdbfe;
  background: #fff;
  flex-shrink: 0;
}

.equipe-info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.equipe-info strong {
  font-size: 20px;
  color: #0f172a;
  line-height: 1.25;
}

.equipe-info span {
  color: #64748b;
  font-size: 13px;
  line-height: 1.35;
}

.equipe-treinador {
  color: #475569 !important;
}

.equipe-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.tag-selecionada {
  border-radius: 999px;
  border: 1px solid #93c5fd;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
  font-size: 12px;
  padding: 4px 10px;
}

.btn-jogadores {
  border: 1px solid rgba(59, 130, 246, 0.35);
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-jogadores:hover {
  background: #dbeafe;
  border-color: rgba(37, 99, 235, 0.5);
}

.btn-jogadores-principal {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 10px 18px rgba(37, 99, 235, 0.2);
}

.btn-jogadores-principal:hover {
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
  border-color: transparent;
}

.btn-jogadores-bloco {
  width: 100%;
}

.btn-remove-secundario {
  border: none;
  background: transparent;
  color: #be123c;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.1;
  padding: 2px 0;
  cursor: pointer;
}

.btn-remove-secundario:hover {
  color: #9f1239;
  text-decoration: underline;
}

.btn-remove-secundario:disabled {
  opacity: 0.65;
  cursor: default;
  text-decoration: none;
}

.tabela-wrap {
  overflow-x: auto;
}

.tabela-jogadores {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 640px;
}

.tabela-jogadores thead th {
  background: #f1f5f9;
  color: #334155;
  font-size: 13px;
  font-weight: 800;
  text-align: left;
  padding: 10px 12px;
  border-top: 1px solid #dbe5f4;
  border-bottom: 1px solid #dbe5f4;
}

.th-acoes {
  width: 140px;
  min-width: 140px;
  text-align: center !important;
}

.tabela-jogadores thead th:first-child {
  border-left: 1px solid #dbe5f4;
  border-top-left-radius: 14px;
}

.tabela-jogadores thead th:last-child {
  border-right: 1px solid #dbe5f4;
  border-top-right-radius: 14px;
}

.tabela-jogadores tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  color: #0f172a;
  font-size: 14px;
  vertical-align: middle;
}

.tabela-jogadores tbody tr {
  height: 56px;
}

.cell-jogador {
  width: 1%;
}

.cell-jogador-inner {
  display: flex;
  align-items: center;
  gap: 10px;
}

.jogador-foto {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  object-fit: cover;
  background: #f1f5f9;
  border: 1px solid #dbe5f4;
  flex-shrink: 0;
}

.jogador-numero-inline {
  min-width: 34px;
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  border: 1px solid #93c5fd;
  background: #eff6ff;
  color: #1d4ed8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  flex-shrink: 0;
}

.jogador-info {
  display: grid;
  gap: 2px;
}

.jogador-info strong {
  font-size: 14px;
  line-height: 1.2;
}

.jogador-info span {
  color: #64748b;
  font-size: 12px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96px;
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid transparent;
}

.status-liberado {
  background: #ecfdf5;
  border-color: #86efac;
  color: #15803d;
}

.status-suspenso {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #b91c1c;
}

.cell-acoes {
  width: 140px;
  min-width: 140px;
  text-align: center;
}

.cell-acoes-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.btn-acao {
  border-radius: 10px;
  border: 1px solid transparent;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  min-width: 110px;
  text-align: center;
  white-space: nowrap;
}

.btn-acao:disabled {
  opacity: 0.6;
  cursor: default;
}

.btn-suspender {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fca5a5;
}

.btn-liberar {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #93c5fd;
}

.estado-vazio {
  border-radius: 18px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #64748b;
  text-align: center;
  padding: 20px;
  font-size: 15px;
}

.modal-overlay-sub {
  z-index: 1300;
}

.modal-adicionar-equipe {
  width: min(880px, 100%);
  padding: 16px 24px 20px;
}

.lista-times-disponiveis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 8px;
}

.time-disponivel-card {
  border: 1px solid #dbe5f4;
  border-radius: 14px;
  background: #f8fbff;
  padding: 12px;
  display: grid;
  gap: 8px;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.time-disponivel-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.14);
  transform: translateY(-1px);
}

.time-disponivel-card.selecionado {
  border-color: #3b82f6;
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
}

.time-disponivel-topo {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.time-disponivel-foto {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid #bfdbfe;
  background: #fff;
  flex-shrink: 0;
}

.time-disponivel-nome {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-disponivel-meta {
  color: #64748b;
  font-size: 13px;
  line-height: 1.35;
}

.modal-adicionar-acoes {
  display: block;
  margin-top: 16px;
}

.btn-cancelar-modal,
.btn-salvar-modal {
  min-height: 42px;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-cancelar-modal {
  min-width: 120px;
  border-color: #cbd5e1;
  background: #f8fafc;
  color: #334155;
}

.btn-cancelar-modal:hover {
  background: #f1f5f9;
}

.btn-salvar-modal {
  width: 100%;
  min-width: 0;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  box-shadow: 0 12px 20px rgba(37, 99, 235, 0.2);
}

.btn-salvar-modal:hover {
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
}

.btn-cancelar-modal:disabled,
.btn-salvar-modal:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  box-shadow: none;
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

@keyframes qpSpin {
  to {
    transform: rotate(360deg);
  }
}

.titulo-modal{
  display: block;
  color: #3b82f6;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.08;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1250;
  background: rgba(15, 23, 42, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.modal-content {
  width: min(1120px, 100%);
  max-height: calc(100vh - 36px);
  overflow: auto;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 24px;
  box-shadow: 0 22px 56px rgba(15, 23, 42, 0.28);
  padding: 20px;
}

:deep(.swal2-container) {
  z-index: 1400 !important;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.modal-header-copy {
  min-width: 0;
}

.modal-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.55;
  text-decoration: none;
}

.btn-close-x {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(59, 130, 246, 0.45);
  border-radius: 999px;
  background: #fff;
  color: #2563eb;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  flex: 0 0 auto;
}

@media (min-width: 769px) {
  .equipe-actions {
    align-self: flex-start;
    margin-top: -4px;
  }

  .modal-content {
    width: min(880px, 100%);
    padding: 16px 24px;
  }

  .modal-header {
    margin-bottom: 8px;
  }

  .tabela-jogadores {
    min-width: 0;
    table-layout: fixed;
  }

  .tabela-jogadores thead th,
  .tabela-jogadores tbody td {
    padding: 7px 9px;
  }

  .tabela-jogadores tbody tr {
    height: 46px;
  }

  .th-acoes,
  .cell-acoes {
    width: auto;
    min-width: 0;
  }

  .tabela-jogadores thead th:nth-child(1),
  .tabela-jogadores tbody td:nth-child(1) {
    width: 45%;
  }

  .tabela-jogadores thead th:nth-child(2),
  .tabela-jogadores tbody td:nth-child(2),
  .tabela-jogadores thead th:nth-child(3),
  .tabela-jogadores tbody td:nth-child(3) {
    width: 9%;
  }

  .tabela-jogadores thead th:nth-child(4),
  .tabela-jogadores tbody td:nth-child(4) {
    width: 18%;
  }

  .tabela-jogadores thead th:nth-child(5),
  .tabela-jogadores tbody td:nth-child(5) {
    width: 19%;
  }

  .tabela-jogadores.tabela-sem-cartoes thead th:nth-child(1),
  .tabela-jogadores.tabela-sem-cartoes tbody td:nth-child(1) {
    width: 56%;
  }

  .tabela-jogadores.tabela-sem-cartoes:not(.tabela-sem-acoes) thead th:nth-child(2),
  .tabela-jogadores.tabela-sem-cartoes:not(.tabela-sem-acoes) tbody td:nth-child(2) {
    width: 20%;
  }

  .tabela-jogadores.tabela-sem-cartoes:not(.tabela-sem-acoes) thead th:nth-child(3),
  .tabela-jogadores.tabela-sem-cartoes:not(.tabela-sem-acoes) tbody td:nth-child(3) {
    width: 24%;
  }

  .tabela-jogadores.tabela-sem-cartoes.tabela-sem-acoes thead th:nth-child(2),
  .tabela-jogadores.tabela-sem-cartoes.tabela-sem-acoes tbody td:nth-child(2) {
    width: 44%;
  }
}

.conteudo.campeonato-finalizado .title,
.conteudo.campeonato-finalizado .section-kicker {
  color: #b91c1c;
}

.conteudo.campeonato-finalizado .equipe-card.ativa {
  border-color: #f87171;
  box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.24);
}

.conteudo.campeonato-finalizado .tag-selecionada {
  color: #b91c1c;
  border-color: #fca5a5;
  background: #fff1f2;
}

@media (max-width: 1024px) {
  .lista-equipes {
    grid-template-columns: 1fr;
  }

  .lista-times-disponiveis {
    grid-template-columns: 1fr;
  }

  .conteudo {
    padding: 24px;
  }

  .title {
    font-size: 34px;
  }

  .section-head h2 {
    font-size: 26px;
  }
}

@media (max-width: 768px) {
  .conteudo {
    margin-left: 0;
    margin-top: 34px;
    padding: 14px;
    overflow-x: hidden;
  }

  .conteudo.collapsed {
    margin-left: 0;
  }

  .header-top {
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
  }

  .title {
    margin: 0 0 8px;
    font-size: 30px;
    line-height: 1.04;
    flex: 1 1 220px;
    min-width: 0;
  }

  .page-subtitle {
    font-size: 14px;
    line-height: 1.55;
  }

  .btn-add {
    min-height: 34px;
    padding: 0 12px;
    border-radius: 12px;
    font-size: 12px;
    margin-left: auto;
  }

  .btn-add-label-desktop {
    display: none;
  }

  .btn-add-label-mobile {
    display: inline;
  }

  .painel-card {
    padding: 18px;
    border-radius: 24px;
  }

  .section-kicker {
    font-size: 11px;
  }

  .section-head h2 {
    font-size: 24px;
  }

  .section-head a {
    font-size: 13px;
    line-height: 1.45;
  }

  .equipe-card {
    gap: 10px;
  }

  .equipe-head {
    flex-direction: row;
    align-items: flex-start;
    gap: 8px;
  }

  .equipe-main {
    flex: 1;
    min-width: 0;
  }

  .equipe-actions {
    width: auto;
    margin-left: auto;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-start;
    gap: 4px;
  }

  .btn-jogadores-bloco {
    width: 100%;
  }

  .btn-remove-secundario {
    margin-left: 0;
  }

  .equipe-info strong {
    font-size: 18px;
  }

  .equipe-info span {
    font-size: 12px;
  }

  .estado-vazio {
    font-size: 14px;
  }

  .modal-overlay {
    padding: 10px;
  }

  .modal-content {
    max-height: calc(100vh - 20px);
    padding: 14px;
    border-radius: 16px;
  }

  .modal-adicionar-equipe {
    padding: 14px;
  }

  .time-disponivel-nome {
    font-size: 16px;
  }

  .btn-salvar-modal {
    width: 100%;
  }

  .modal-close {
    width: 30px;
    height: 30px;
    border-radius: 8px;
  }

  .tabela-wrap {
    overflow-x: hidden;
  }

  .tabela-jogadores {
    min-width: 0;
    table-layout: fixed;
  }

  .tabela-jogadores thead th {
    padding: 8px 6px;
    font-size: 11px;
  }

  .tabela-jogadores thead th:nth-child(1) {
    width: 41%;
  }

  .tabela-jogadores thead th:nth-child(2),
  .tabela-jogadores thead th:nth-child(3) {
    width: 8%;
  }

  .tabela-jogadores thead th:nth-child(4) {
    width: 15%;
  }

  .tabela-jogadores thead th:nth-child(5) {
    width: 28%;
  }

  .tabela-jogadores.tabela-sem-cartoes thead th:nth-child(1) {
    width: 50%;
  }

  .tabela-jogadores.tabela-sem-cartoes:not(.tabela-sem-acoes) thead th:nth-child(2) {
    width: 17%;
  }

  .tabela-jogadores.tabela-sem-cartoes:not(.tabela-sem-acoes) thead th:nth-child(3) {
    width: 33%;
  }

  .tabela-jogadores.tabela-sem-cartoes.tabela-sem-acoes thead th:nth-child(2) {
    width: 50%;
  }

  .tabela-jogadores tbody td {
    padding: 8px 6px;
    font-size: 11px;
  }

  .cell-jogador {
    min-width: 0;
  }

  .cell-jogador-inner {
    gap: 4px;
  }

  .jogador-foto {
    width: 30px;
    height: 30px;
    border-radius: 8px;
  }

  .jogador-numero-inline {
    min-width: 28px;
    height: 20px;
    padding: 0 7px;
    font-size: 11px;
  }

  .jogador-info {
    min-width: 0;
  }

  .jogador-info strong {
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .jogador-info span {
    display: none;
  }

  .status-pill {
    min-width: 0;
    width: 100%;
    padding: 4px 4px;
    font-size: 10px;
  }

  .cell-acoes {
    min-width: 0;
  }

  .cell-acoes-inner {
    width: 100%;
  }

  .btn-acao {
    min-width: 0;
    width: 100%;
    padding: 4px 5px;
    font-size: 10px;
    line-height: 1.15;
    white-space: normal;
    overflow-wrap: anywhere;
  }
}
</style>

<style>
.swal2-container {
  z-index: 3000 !important;
}
</style>
