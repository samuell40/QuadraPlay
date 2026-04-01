<template>
  <div class="layout">
    <NavBarQuadras />
    <SidebarCampeonato @sidebar-toggle="sidebarCollapsed = $event" />

    <div class="conteudo" :class="{ collapsed: sidebarCollapsed, 'campeonato-finalizado': isCampeonatoEncerrado }">
      <div class="header">
        <div class="header-copy">
          <h1 class="title">Edição e configurações</h1>
          <a class="page-subtitle">
            Ajuste identidade visual, regras e critérios em um único painel.
          </a>
        </div>
      </div>

      <div v-if="isLoading" class="loader-container-centralizado">
        <LoadingState
          :theme="isCampeonatoEncerrado ? 'danger' : 'default'"
          title="Carregando campeonato"
          description="Buscando regras, critérios, identidade visual e dados gerais da competição."
        />
        <span class="loader-copy">Carregando informações do campeonato.</span>
      </div>

      <template v-else>
      <div v-if="campeonato && isCampeonatoEncerrado && !isMesario" class="aviso-campeonato-finalizado">
        Campeonato encerrado: modo somente visualização. Edição e remoção estão bloqueadas.
      </div>

      <div v-if="campeonato && !isMesario && !isCampeonatoEncerrado" class="card-edicao">
        <div class="section-head">
          <div>
            <span class="section-kicker">Cadastro</span>
            <h2>Informações do campeonato</h2>
            <a>Atualize nome, imagem e quadra vinculada. A data de encerramento acompanha a agenda.</a>
          </div>
        </div>

        <div class="regras-grid">
          <div class="regra-item">
            <label class="regra-label">Nome do campeonato</label>
            <input v-model="formEdicao.nome" class="regra-select" type="text" />
          </div>

          <div class="regra-item">
            <label class="regra-label">Alterar imagem</label>
            <input ref="inputImagem" class="input-file" type="file" accept="image/*" @change="onImagemSelecionada" />
            <button v-if="formEdicao.foto !== imagemOriginal" type="button" class="btn-cancel-file"
              :disabled="uploadingImagem" @click="cancelarImagemSelecionada">
              Cancelar imagem selecionada
            </button>
            <small v-if="uploadingImagem" class="hint-upload">Enviando imagem...</small>
          </div>

          <div class="regra-item">
            <label class="regra-label">Quadra</label>
            <select v-model="formEdicao.quadraId" class="regra-select">
              <option :value="null">Sem quadra</option>
              <option v-for="q in quadras" :key="q.id" :value="q.id">
                {{ q.nome }}
              </option>
            </select>
          </div>

          <div class="regra-item">
            <label class="regra-label">Data de finalização</label>
            <button
              type="button"
              class="regra-help"
              aria-label="Ver como alterar a data de finalização"
              @click="mostrarAjudaDataFinalizacao"
            >
              !
            </button>
            <div class="regra-valor">
              {{ formEdicao.dataFim ? formatarDataResumo(formEdicao.dataFim) : 'Definida automaticamente pela agenda' }}
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn-save" :disabled="salvandoEdicao" @click="salvarEdicao">
            <svg
              v-if="!salvandoEdicao"
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
            <span>{{ salvandoEdicao ? 'Salvando...' : 'Salvar informações' }}</span>
          </button>
        </div>
      </div>

      <div v-if="campeonato && !isMesario && !isCampeonatoEncerrado" class="card-edicao card-horarios">
        <div class="section-head">
          <div>
            <span class="section-kicker">Horarios</span>
            <h2>Agenda base do campeonato</h2>
            <a>Veja, edite e acrescente novos horários da competição na quadra vinculada.</a>
          </div>
        </div>

        <div v-if="!formEdicao.quadraId" class="vazio-criterios">
          Selecione uma quadra no cadastro e salve as informações antes de ajustar os horários.
        </div>

        <template v-else>
          <AgendaCampeonatoEditor v-model="agendaPorData" :min-date="dataMinimaAgendaEdicao" />

          <div class="actions">
            <button class="btn-save" :disabled="salvandoAgenda" @click="salvarAgendaCampeonato">
              <svg
                v-if="!salvandoAgenda"
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
              <span>{{ salvandoAgenda ? 'Salvando...' : 'Salvar horários' }}</span>
            </button>
          </div>
        </template>
      </div>

      <div v-if="campeonato" class="card-regras">
        <div class="section-head">
          <div>
            <span class="section-kicker">Operação</span>
            <h2>Configurações do {{ formatarNomeExibicao(campeonato?.modalidade?.nome) }}</h2>
            <a>Controle regras, ordem de classificação e equipe de mesa da competição.</a>
          </div>
        </div>
        <h2>Configurações do {{ String(campeonato?.modalidade?.nome).toLowerCase() }}</h2>

        <div v-if="!isMesario && !isCampeonatoEncerrado" class="abas-config-container">
          <button
            type="button"
            class="aba-config"
            :class="{ ativa: abaConfigAtiva === 'regras' }"
            @click="abaConfigAtiva = 'regras'"
          >
            Regras do campeonato
          </button>
          <button
            v-if="mostrarAbaCriteriosClassificacao"
            type="button"
            class="aba-config"
            :class="{ ativa: abaConfigAtiva === 'criterios' }"
            @click="abrirAbaCriterios"
          >
            Critérios de classificação
          </button>
          <button
            v-if="podeGerenciarMesarios"
            type="button"
            class="aba-config"
            :class="{ ativa: abaConfigAtiva === 'mesarios' }"
            @click="abrirAbaMesarios"
          >
            Mesários
          </button>
        </div>

        <div v-if="isMesario || isCampeonatoEncerrado" class="regras-visualizacao">
          <div class="regras-grid">
            <div class="regra-item" v-for="campo in camposRegras" :key="`visual-${campo.key}`">
              <label class="regra-label">{{ campo.label }}</label>
              <div class="regra-valor">{{ obterLabelRegra(campo) }}</div>
            </div>
          </div>
        </div>

        <div v-else-if="abaConfigAtiva === 'regras'">
          <div class="regras-grid">
            <div class="regra-item" v-for="campo in camposRegras" :key="campo.key">
              <label class="regra-label">{{ campo.label }}</label>

              <select v-model="formRegras[campo.key]" class="regra-select">
                <option v-for="opcao in campo.options" :key="`${campo.key}-${String(opcao.value)}`" :value="opcao.value">
                  {{ opcao.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="actions">
            <button class="btn-save" :disabled="salvandoRegras" @click="salvarRegras">
              <svg
                v-if="!salvandoRegras"
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
              <span>{{ salvandoRegras ? 'Salvando...' : 'Salvar regras' }}</span>
            </button>
          </div>
        </div>

        <div v-else-if="abaConfigAtiva === 'criterios' && mostrarAbaCriteriosClassificacao" class="criterios-wrapper">
          <a class="descricao-criterios">
            Arraste para definir a ordem de classificação.
          </a>

          <div v-if="!criteriosClassificacao.length" class="vazio-criterios">
            Nenhum critério encontrado para este campeonato.
          </div>

          <div v-else class="lista-criterios">
            <div
              v-for="(criterio, indice) in criteriosClassificacao"
              :key="`${criterio.value}-${indice}`"
              class="criterio-item"
              draggable="true"
              @dragstart="iniciarArrasteCriterio(indice)"
              @dragover.prevent
              @drop="soltarCriterio(indice)"
            >
              <span class="ordem-criterio">{{ indice + 1 }}</span>
              <span class="nome-criterio">{{ criterio.label }}</span>
              <span class="drag-criterio">&#9776;</span>
            </div>
          </div>

          <div class="actions">
            <button class="btn-save" :disabled="salvandoCriterios" @click="salvarCriteriosClassificacao">
              <svg
                v-if="!salvandoCriterios"
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
              <span>{{ salvandoCriterios ? 'Salvando...' : 'Salvar criterios' }}</span>
            </button>
          </div>
        </div>

        <div v-else-if="abaConfigAtiva === 'mesarios'" class="mesarios-wrapper">
          <a class="descricao-criterios">
            Selecione os usuários e mesários que podem atuar neste campeonato. Usuários (permissão 3) selecionados serão promovidos para mesário (permissão 4).
          </a>

          <div class="campo-busca-mesario">
            <input
              v-model.trim="buscaMesario"
              type="text"
              class="regra-select"
              placeholder="Buscar usuario ou mesario por nome ou email"
            />
          </div>

          <div v-if="carregandoMesarios" class="vazio-criterios">
            Carregando usuários e mesários...
          </div>

          <div v-else-if="!mesariosDisponiveis.length" class="vazio-criterios">
            Nenhum usuario disponivel para vinculo.
          </div>

          <div v-else-if="!mesariosFiltrados.length" class="vazio-criterios">
            Nenhum usuario encontrado para a busca informada.
          </div>

          <div v-else class="lista-mesarios">
            <label
              v-for="mesario in mesariosFiltrados"
              :key="mesario.id"
              class="mesario-item"
            >
              <input
                type="checkbox"
                :checked="mesariosSelecionados.includes(mesario.id)"
                @change="alternarMesarioSelecionado(mesario.id)"
              />
              <img v-if="mesario.foto" :src="mesario.foto" alt="" class="mesario-avatar" />
              <div class="mesario-info">
                <strong>{{ mesario.nome }}</strong>
                <div class="mesario-meta">
                  <span>{{ mesario.email }}</span>
                  <span class="mesario-perfil" :class="classePerfilMesario(mesario)">
                    {{ textoPerfilMesario(mesario) }}
                  </span>
                </div>
              </div>
            </label>
          </div>

          <div class="actions">
            <button class="btn-save" :disabled="salvandoMesarios" @click="salvarMesariosCampeonato">
              <svg
                v-if="!salvandoMesarios"
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
              {{ salvandoMesarios ? 'Salvando...' : 'Salvar mesários' }}
            </button>
          </div>
        </div>
      </div>
      <div v-if="campeonato && !isMesario && !isCampeonatoEncerrado" class="actions-finish">
        <button class="btn-finish" :disabled="removendoCampeonato" @click="removerCampeonato">
          <svg
            v-if="!removendoCampeonato"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="btn-save-icon"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
          </svg>
          <span>{{ removendoCampeonato ? 'Removendo...' : 'Remover campeonato' }}</span>
        </button>
      </div>

      <div v-if="!campeonato">
        <a>Nenhum campeonato encontrado.</a>
      </div>
      </template>
    </div>

    <button v-if="mostrarBotaoTopo" type="button" class="btn-topo" :class="{ finalizado: isCampeonatoEncerrado }" @click="subirPagina">
      ↑
    </button>
  </div>
</template>

<script>
import Swal from 'sweetalert2'
import api from '@/axios'
import NavBarQuadras from '@/components/quadraplay/NavBarQuadras.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import SidebarCampeonato from '@/components/quadraplay/SidebarCampeonato.vue'
import AgendaCampeonatoEditor from '@/components/quadraplay/Campeonatos/AgendaCampeonatoEditor.vue'
import { carregarCampeonato } from '@/utils/persistirCampeonato'
import { useCampeonatoStore } from '@/storecampeonato'
import { grupoModalidade, opcoesNumericas, opcoesSuspensao, regrasPadrao} from '@/utils/campeonatoRegras'

export default {
  name: 'ConfiguracoesCampeonatoView',
  components: { SidebarCampeonato, NavBarQuadras, LoadingState, AgendaCampeonatoEditor },

  data() {
    return {
      sidebarCollapsed: false,
      campeonato: null,
      isLoading: true,
      salvandoRegras: false,
      salvandoCriterios: false,
      formRegras: {},
      criteriosClassificacao: [],
      abaConfigAtiva: 'regras',
      indiceArrasteCriterio: null,
      salvandoEdicao: false,
      removendoCampeonato: false,
      uploadingImagem: false,
      mostrarBotaoTopo: false,
      imagemOriginal: '',
      quadras: [],
      agendaPorData: [],
      salvandoAgenda: false,
      formEdicao: {
        nome: '',
        foto: '',
        quadraId: null,
        dataFim: ''
      },
      mesariosDisponiveis: [],
      mesariosSelecionados: [],
      buscaMesario: '',
      carregandoMesarios: false,
      salvandoMesarios: false
    }
  },

  computed: {
    usuarioLogado() {
      try {
        return JSON.parse(localStorage.getItem('usuario') || 'null')
      } catch (error) {
        return null
      }
    },

    isMesario() {
      return Number(this.usuarioLogado?.permissaoId) === 4
    },

    isCampeonatoEncerrado() {
      const status = String(this.campeonato?.status || '').toUpperCase()
      return ['FINALIZADO', 'FINALIZADA', 'CANCELADO', 'CANCELADA', 'DELETADO', 'DELETADA'].includes(status)
    },

    podeGerenciarMesarios() {
      return [1, 2].includes(Number(this.usuarioLogado?.permissaoId))
    },

    grupoAtual() {
      return grupoModalidade(this.campeonato?.modalidade?.nome)
    },

    tipoCampeonatoNormalizado() {
      return String(this.campeonato?.tipo || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    },

    mostrarAbaCriteriosClassificacao() {
      return this.tipoCampeonatoNormalizado !== 'eliminatorias'
    },

    dataMinimaAgendaEdicao() {
      const data = new Date()
      data.setHours(0, 0, 0, 0)

      const ano = data.getFullYear()
      const mes = String(data.getMonth() + 1).padStart(2, '0')
      const dia = String(data.getDate()).padStart(2, '0')
      return `${ano}-${mes}-${dia}`
    },

    camposRegras() {
      const comuns = [
        {
          key: 'suspensaoAmarelos',
          label: 'Suspensão automática por amarelos',
          options: opcoesSuspensao(2, 10)
        },
        {
          key: 'suspensaoVermelhos',
          label: 'Suspensão automática por vermelhos',
          options: opcoesSuspensao(1, 10)
        },
        {
          key: 'separarCartoesPorFase',
          label: 'Separar cartões de cada fase',
          options: [
            { label: 'Não', value: false },
            { label: 'Sim', value: true }
          ]
        },
        {
          key: 'resetarCartoesCadaFase',
          label: 'Resetar cartões ao trocar de fase',
          options: [
            { label: 'Não', value: false },
            { label: 'Sim', value: true }
          ]
        }
      ]

      if (this.grupoAtual === 'VOLEI') {
        return [
          {
            key: 'quantidadeSetsPartida',
            label: 'Quantidade de sets por partida',
            options: [
              { label: '1 set', value: 1 },
              { label: '2 sets', value: 2 },
              { label: '3 sets', value: 3 },
              { label: '4 sets', value: 4 },
              { label: '5 sets', value: 5 },
              { label: '6 sets', value: 6 },
              { label: '7 sets', value: 7 }
            ]
          },
          {
            key: 'pontosPorSet',
            label: 'Quantidade de pontos do set',
            options: opcoesNumericas(0, 50)
          },
          {
            key: 'regraPontosVitoria',
            label: 'Pontos por vitoria',
            options: [
              { label: '2 pontos sempre', value: 'VITORIA_2_SEMPRE' },
              { label: '3 pontos sempre', value: 'VITORIA_3_SEMPRE' },
              { label: '3 pontos para diferença de sets maior que 1', value: 'VITORIA_3_DIF_SETS_MAIOR_1' }
            ]
          },
          {
            key: 'regraPontosDerrota',
            label: 'Pontos por derrota',
            options: [
              { label: '0 pontos sempre', value: 'DERROTA_0_SEMPRE' },
              { label: '1 ponto sempre', value: 'DERROTA_1_SEMPRE' },
              { label: '1 ponto para diferença de sets menor que 2', value: 'DERROTA_1_DIF_SETS_MENOR_2' }
            ]
          },
          {
            key: 'pontosEmpate',
            label: 'Pontos por empate',
            options: opcoesNumericas(0, 10)
          }
        ]
      }

      return [
        {
          key: 'pontosVitoria',
          label: 'Pontos por vitória',
          options: opcoesNumericas(0, 10)
        },
        {
          key: 'pontosEmpate',
          label: 'Pontos por empate',
          options: opcoesNumericas(0, 10)
        },
        {
          key: 'pontosDerrota',
          label: 'Pontos por derrota',
          options: opcoesNumericas(0, 10)
        },
        {
          key: 'duracaoSuspensaoPartidas',
          label: 'Duração da suspensão',
          options: Array.from({ length: 10 }, (_, index) => {
            const quantidade = index + 1
            return {
              label: `${quantidade} ${quantidade === 1 ? 'partida' : 'partidas'}`,
              value: quantidade
            }
          })
        },
        ...comuns
      ]
    },

    mesariosFiltrados() {
      const termo = String(this.buscaMesario || '').trim().toLowerCase()
      const listaBase = this.mesariosDisponiveis.filter(mesario => {
        const nome = String(mesario?.nome || '').toLowerCase()
        const email = String(mesario?.email || '').toLowerCase()
        return !termo || nome.includes(termo) || email.includes(termo)
      })

      const selecionadosSet = new Set(
        (Array.isArray(this.mesariosSelecionados) ? this.mesariosSelecionados : [])
          .map(id => Number(id))
          .filter(id => Number.isInteger(id) && id > 0)
      )

      return [...listaBase].sort((a, b) => {
        const aSelecionado = selecionadosSet.has(Number(a?.id)) ? 1 : 0
        const bSelecionado = selecionadosSet.has(Number(b?.id)) ? 1 : 0
        if (aSelecionado !== bSelecionado) return bSelecionado - aSelecionado

        const aMesario = Number(a?.permissaoId) === 4 ? 1 : 0
        const bMesario = Number(b?.permissaoId) === 4 ? 1 : 0
        if (aMesario !== bMesario) return bMesario - aMesario

        return String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-BR', { sensitivity: 'base' })
      })
    }
  },

  async mounted() {
    window.addEventListener('scroll', this.atualizarVisibilidadeBotaoTopo, { passive: true })
    try {
      this.campeonato = await carregarCampeonato(this.$route)
      if (this.campeonato) {
        const padrao = regrasPadrao(this.grupoAtual)
        this.formRegras = {
          ...padrao,
          ...(this.campeonato.regras || {})
        }
        this.normalizarAbaConfigAtiva()
        await this.carregarQuadras()
        if (this.mostrarAbaCriteriosClassificacao) {
          await this.carregarCriteriosClassificacao()
        } else {
          this.criteriosClassificacao = []
        }
        this.preencherFormularioEdicao()
        this.preencherAgendaEdicao()
      }
    } catch (err) {
      console.error('Erro ao carregar campeonato:', err)
      this.campeonato = null
    } finally {
      this.isLoading = false
    }
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.atualizarVisibilidadeBotaoTopo)
  },

  methods: {
    bloquearEdicaoEncerrado() {
      if (!this.isCampeonatoEncerrado) return false
      Swal.fire('Campeonato encerrado', 'Este campeonato está em modo somente visualização.', 'info')
      return true
    },
    atualizarVisibilidadeBotaoTopo() {
      this.mostrarBotaoTopo = window.scrollY > 260
    },
    subirPagina() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    formatarNomeExibicao(texto) {
      return String(texto || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase())
        .join(' ')
    },
    formatarDataResumo(data) {
      if (!data) return ''

      const dataFormatada = new Date(data)
      if (Number.isNaN(dataFormatada.getTime())) return ''

      return dataFormatada.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    },
    formatarDataParaInput(data) {
      if (!data) return ''
      return new Date(data).toISOString().slice(0, 10)
    },
    mostrarAjudaDataFinalizacao() {
      Swal.fire({
        icon: 'info',
        title: 'Data de finalização',
        text: 'Para alterar essa data, ajuste a agenda base do campeonato logo abaixo e salve os horários. O sistema usa o último horário cadastrado como encerramento do campeonato.',
        confirmButtonText: 'Entendi',
        confirmButtonColor: '#1d4ed8'
      })
    },
    obterLabelRegra(campo) {
      const valor = this.formRegras?.[campo.key]
      const opcao = Array.isArray(campo?.options)
        ? campo.options.find(item => String(item?.value) === String(valor))
        : null

      if (opcao?.label) return opcao.label
      if (valor === null || valor === undefined || valor === '') return '-'
      return String(valor)
    },

    preencherFormularioEdicao() {
      this.formEdicao = {
        nome: this.campeonato?.nome || '',
        foto: this.campeonato?.foto || '',
        quadraId: this.campeonato?.quadraId || null,
        dataFim: this.formatarDataParaInput(this.campeonato?.dataFim)
      }
      this.imagemOriginal = this.formEdicao.foto
      this.$nextTick(() => {
        if (this.$refs.inputImagem) this.$refs.inputImagem.value = ''
      })
    },

    preencherAgendaEdicao() {
      const agendaMap = new Map()

      ;(Array.isArray(this.campeonato?.agendamentos) ? this.campeonato.agendamentos : []).forEach((agendamento) => {
        const dataHora = agendamento?.datahora ? new Date(agendamento.datahora) : null
        if (!(dataHora instanceof Date) || Number.isNaN(dataHora.getTime())) return

        const data = `${dataHora.getFullYear()}-${String(dataHora.getMonth() + 1).padStart(2, '0')}-${String(dataHora.getDate()).padStart(2, '0')}`
        const horario = `${String(dataHora.getHours()).padStart(2, '0')}:${String(dataHora.getMinutes()).padStart(2, '0')}`

        if (!agendaMap.has(data)) {
          agendaMap.set(data, { data, horarios: [] })
        }

        const agendaDia = agendaMap.get(data)
        if (!agendaDia.horarios.includes(horario)) {
          agendaDia.horarios.push(horario)
          agendaDia.horarios.sort((a, b) => this.timeToMinutes(a) - this.timeToMinutes(b))
        }
      })

      this.agendaPorData = [...agendaMap.values()].sort((a, b) => a.data.localeCompare(b.data))
    },

    timeToMinutes(time) {
      const [hora, minuto] = String(time || '').split(':').map(Number)
      return (hora * 60) + minuto
    },

    montarDatasJogosAgenda() {
      return [...this.agendaPorData]
        .sort((a, b) => a.data.localeCompare(b.data))
        .flatMap((item) =>
          (Array.isArray(item?.horarios) ? item.horarios : [])
            .filter(Boolean)
            .map((horario) => {
              const [hora, minuto] = String(horario).split(':').map(Number)
              const [ano, mes, dia] = String(item.data || '').split('-').map(Number)
              return new Date(ano, mes - 1, dia, hora, minuto || 0, 0).toISOString()
            })
        )
    },

    aplicarCampeonatoAtualizado(campeonatoAtualizado) {
      this.campeonato = campeonatoAtualizado
      this.normalizarAbaConfigAtiva()
      this.preencherFormularioEdicao()
      this.preencherAgendaEdicao()

      const store = useCampeonatoStore()
      store.setCampeonato(campeonatoAtualizado)
    },

    async carregarQuadras() {
      if (!this.campeonato?.modalidadeId) {
        this.quadras = []
        return
      }

      try {
        const { data } = await api.get(`/listar/quadras/${this.campeonato.modalidadeId}`)
        this.quadras = Array.isArray(data) ? data : []
      } catch (err) {
        console.error('Erro ao carregar quadras:', err)
        this.quadras = []
      }
    },

    async onImagemSelecionada(event) {
      if (this.bloquearEdicaoEncerrado()) return
      const file = event?.target?.files?.[0]
      if (!file) return

      this.uploadingImagem = true
      try {
        const formData = new FormData()
        formData.append('file', file)

        const { data } = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        this.formEdicao.foto = data?.fileUrl || ''
      } catch (err) {
        console.error('Erro ao enviar imagem:', err)
        await Swal.fire('Erro', 'Não foi possível enviar a imagem.', 'error')
      } finally {
        this.uploadingImagem = false
      }
    },

    cancelarImagemSelecionada() {
      if (this.isCampeonatoEncerrado) return
      this.formEdicao.foto = this.imagemOriginal || ''
      if (this.$refs.inputImagem) this.$refs.inputImagem.value = ''
    },

    async salvarEdicao() {
      if (this.bloquearEdicaoEncerrado()) return
      if (!this.campeonato?.id) return

      this.salvandoEdicao = true
      try {
        const payload = {
          nome: this.formEdicao.nome,
          foto: this.formEdicao.foto,
          quadraId: this.formEdicao.quadraId,
          dataFim: this.formEdicao.dataFim || null
        }

        const { data } = await api.put(`/campeonato/${this.campeonato.id}`, payload)
        this.aplicarCampeonatoAtualizado(data)
        await Swal.fire('Sucesso', 'Informações atualizadas com sucesso.', 'success')
      } catch (err) {
        console.error('Erro ao salvar edicao:', err)
        await Swal.fire('Erro', 'Não foi possível salvar as informações.', 'error')
      } finally {
        this.salvandoEdicao = false
      }
    },

    async salvarAgendaCampeonato() {
      if (this.bloquearEdicaoEncerrado()) return
      if (!this.campeonato?.id) return

      if (!this.formEdicao.quadraId) {
        await Swal.fire('Atenção', 'Selecione uma quadra antes de salvar os horários.', 'warning')
        return
      }

      const datasJogos = this.montarDatasJogosAgenda()
      if (!datasJogos.length) {
        await Swal.fire('Atenção', 'Adicione ao menos um horário para o campeonato.', 'warning')
        return
      }

      this.salvandoAgenda = true
      try {
        const payload = {
          quadraId: this.formEdicao.quadraId,
          usuarioId: Number(this.usuarioLogado?.id || 0) || null,
          datasJogos
        }

        const { data } = await api.put(`/campeonato/${this.campeonato.id}`, payload)
        this.aplicarCampeonatoAtualizado(data)
        await Swal.fire('Sucesso', 'Horarios atualizados com sucesso.', 'success')
      } catch (err) {
        console.error('Erro ao salvar horários do campeonato:', err)
        await Swal.fire(
          'Erro',
          err?.response?.data?.erro || 'Não foi possível salvar os horários.',
          'error'
        )
      } finally {
        this.salvandoAgenda = false
      }
    },

    async salvarRegras() {
      if (this.bloquearEdicaoEncerrado()) return
      if (!this.campeonato?.id) return

      this.salvandoRegras = true

      try {
        const payload = {
          ...this.formRegras,
          grupoRegras: this.grupoAtual
        }

        const { data } = await api.put(`/campeonato/${this.campeonato.id}/regras`, {
          regras: payload
        })

        this.campeonato.regras = data?.regras || payload
        await Swal.fire('Sucesso', 'Regras atualizadas com sucesso.', 'success')
      } catch (err) {
        console.error('Erro ao salvar regras:', err)
        await Swal.fire('Erro', 'Não foi possível salvar as regras.', 'error')
      } finally {
        this.salvandoRegras = false
      }
    },
    normalizarAbaConfigAtiva() {
      if (this.abaConfigAtiva === 'criterios' && !this.mostrarAbaCriteriosClassificacao) {
        this.abaConfigAtiva = 'regras'
      }
    },
    abrirAbaCriterios() {
      if (this.isCampeonatoEncerrado) return
      if (!this.mostrarAbaCriteriosClassificacao) return
      this.abaConfigAtiva = 'criterios'
      if (!this.criteriosClassificacao.length) {
        this.carregarCriteriosClassificacao()
      }
    },
    abrirAbaMesarios() {
      if (this.isCampeonatoEncerrado) return
      this.abaConfigAtiva = 'mesarios'
      if (!this.mesariosDisponiveis.length) {
        this.carregarMesariosCampeonato()
      }
    },
    nomeMesarioPorId(idMesario) {
      const mesario = this.mesariosDisponiveis.find(item => Number(item.id) === Number(idMesario))
      return mesario?.nome || `Mesário #${idMesario}`
    },
    textoPerfilMesario(usuario) {
      const idUsuario = Number(usuario?.id || 0)
      const selecionado = this.mesariosSelecionados.includes(idUsuario)
      return selecionado || Number(usuario?.permissaoId) === 4 ? 'Mesário' : 'Usuário'
    },
    classePerfilMesario(usuario) {
      const idUsuario = Number(usuario?.id || 0)
      const selecionado = this.mesariosSelecionados.includes(idUsuario)
      return selecionado || Number(usuario?.permissaoId) === 4 ? 'perfil-mesario' : 'perfil-usuario'
    },
    alternarMesarioSelecionado(idMesario) {
      if (this.isCampeonatoEncerrado) return
      const id = Number(idMesario)
      if (!id) return

      if (this.mesariosSelecionados.includes(id)) {
        this.mesariosSelecionados = this.mesariosSelecionados.filter(item => item !== id)
      } else {
        this.mesariosSelecionados = [...this.mesariosSelecionados, id]
      }
    },
    removerMesarioSelecionado(idMesario) {
      const id = Number(idMesario)
      this.mesariosSelecionados = this.mesariosSelecionados.filter(item => item !== id)
    },
    async carregarMesariosCampeonato() {
      if (!this.campeonato?.id || !this.podeGerenciarMesarios) return

      this.carregandoMesarios = true
      try {
        const { data } = await api.get(`/campeonato/${this.campeonato.id}/mesarios`)
        this.mesariosDisponiveis = Array.isArray(data?.mesarios) ? data.mesarios : []
        this.mesariosSelecionados = Array.isArray(data?.vinculadosIds)
          ? data.vinculadosIds.map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0)
          : []
      } catch (err) {
        console.error('Erro ao carregar mesários do campeonato:', err)
        this.mesariosDisponiveis = []
        this.mesariosSelecionados = []
      } finally {
        this.carregandoMesarios = false
      }
    },
    async salvarMesariosCampeonato() {
      if (this.bloquearEdicaoEncerrado()) return
      if (!this.campeonato?.id || !this.podeGerenciarMesarios) return

      this.salvandoMesarios = true
      try {
        const payload = {
          mesariosIds: this.mesariosSelecionados
        }

        const { data } = await api.put(`/campeonato/${this.campeonato.id}/mesarios`, payload)
        this.mesariosDisponiveis = Array.isArray(data?.mesarios) ? data.mesarios : this.mesariosDisponiveis
        this.mesariosSelecionados = Array.isArray(data?.vinculadosIds)
          ? data.vinculadosIds.map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0)
          : []

        this.campeonato.regras = {
          ...(this.campeonato.regras || {}),
          mesariosVinculados: [...this.mesariosSelecionados]
        }

        await Swal.fire('Sucesso', 'Mesários atualizados com sucesso.', 'success')
      } catch (err) {
        console.error('Erro ao salvar mesários do campeonato:', err)
        await Swal.fire('Erro', 'ão foi possível salvar os mesários.', 'error')
      } finally {
        this.salvandoMesarios = false
      }
    },
    async carregarCriteriosClassificacao() {
      if (!this.mostrarAbaCriteriosClassificacao) {
        this.criteriosClassificacao = []
        return
      }
      if (!this.campeonato?.id) return

      try {
        const { data } = await api.get(`/ordem/classificacao/${this.campeonato.id}`)
        const ordemApi = Array.isArray(data?.ordem) ? data.ordem : []
        const ordemCampeonato = Array.isArray(this.campeonato?.ordemClassificacao) ? this.campeonato.ordemClassificacao : []
        const ordem = ordemApi.length ? ordemApi : ordemCampeonato

        this.criteriosClassificacao = ordem
          .filter(c => c && typeof c.value === 'string' && typeof c.label === 'string')
          .map(c => ({ value: c.value, label: c.label }))
      } catch (err) {
        console.error('Erro ao carregar critérios de classificação:', err)
        this.criteriosClassificacao = []
      }
    },
    iniciarArrasteCriterio(indice) {
      if (this.isCampeonatoEncerrado) return
      this.indiceArrasteCriterio = indice
    },
    soltarCriterio(indiceDestino) {
      if (this.isCampeonatoEncerrado) return
      if (this.indiceArrasteCriterio === null) return
      const criterioMovido = this.criteriosClassificacao[this.indiceArrasteCriterio]
      this.criteriosClassificacao.splice(this.indiceArrasteCriterio, 1)
      this.criteriosClassificacao.splice(indiceDestino, 0, criterioMovido)
      this.indiceArrasteCriterio = null
    },
    async salvarCriteriosClassificacao() {
      if (this.bloquearEdicaoEncerrado()) return
      if (!this.mostrarAbaCriteriosClassificacao) return
      if (!this.campeonato?.id || !this.criteriosClassificacao.length) return

      this.salvandoCriterios = true
      try {
        const ordem = this.criteriosClassificacao.map(c => ({ value: c.value, label: c.label }))
        await api.put(`/campeonatos/${this.campeonato.id}/classificacao/ordem`, { ordem })
        this.campeonato.ordemClassificacao = ordem
        await Swal.fire('Sucesso', 'Critérios atualizados com sucesso.', 'success')
      } catch (err) {
        console.error('Erro ao salvar critérios de classificação:', err)
        await Swal.fire('Erro', 'Não foi possível salvar os critérios.', 'error')
      } finally {
        this.salvandoCriterios = false
      }
    },

    async removerCampeonato() {
      if (this.bloquearEdicaoEncerrado()) return
      if (!this.campeonato?.id) return

      const confirmacao = await Swal.fire({
        title: 'Remover campeonato?',
        text: 'Essa ação remove o campeonato e ele não aparecerá mais na lista.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar'
      })

      if (!confirmacao.isConfirmed) return

      this.removendoCampeonato = true
      try {
        await api.delete(`/removerCampeonato/${this.campeonato.id}`)
        const store = useCampeonatoStore()
        store.limparCampeonato()
        await Swal.fire('Sucesso', 'Campeonato removido com sucesso.', 'success')
        this.$router.push({ name: 'TelaInicial' })
      } catch (err) {
        console.error('Erro ao remover campeonato:', err)
        await Swal.fire('Erro', 'Não foi possível remover o campeonato.', 'error')
      } finally {
        this.removendoCampeonato = false
      }
    }
  }
}
</script>

<style scoped>
a {
  text-decoration: none;
  color: inherit;
}

.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.conteudo {
  flex: 1;
  padding: 36px;
  margin-top: 70px;
  margin-left: 250px;
  transition: margin-left 0.3s ease, padding 0.3s ease;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #f3f7ff 24%, #f8fafc 100%);
}

.conteudo.collapsed {
  margin-left: 70px;
}

.aviso-campeonato-finalizado {
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(239, 68, 68, 0.28);
  background: rgba(254, 242, 242, 0.9);
  color: #991b1b;
  font-size: 14px;
  font-weight: 700;
}

.header {
  margin-bottom: 18px;
}

.header-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 720px;
}

.title {
  color: #2563eb;
  font-size: 38px;
  font-weight: 800;
  margin: 0;
  line-height: 1.02;
  letter-spacing: -0.04em;
}

.page-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 16px;
  line-height: 1.6;
}

.conteudo.campeonato-finalizado .title {
  color: #b91c1c;
}

.conteudo.campeonato-finalizado .section-kicker {
  color: #b91c1c;
}

.conteudo.campeonato-finalizado .btn-save,
.conteudo.campeonato-finalizado .btn-finish,
.conteudo.campeonato-finalizado .aba-config.ativa {
  background: linear-gradient(135deg, #b91c1c, #ef4444);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fff;
}

.hero-campeonato {
  margin-bottom: 24px;
}

.card-quadra {
  position: relative;
  width: 100%;
  height: 480px;
  border-radius: 26px;
  overflow: hidden;
  box-shadow: 0 28px 56px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(148, 163, 184, 0.22);
  margin-bottom: 0;
}

.imagem-quadra {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  image-rendering: -webkit-optimize-contrast;
  filter: contrast(1.04) saturate(1.04);
  transition: transform 0.5s ease;
}

.card-quadra:hover .imagem-quadra {
  transform: scale(1.03);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.18) 36%, rgba(15, 23, 42, 0.78) 100%),
    linear-gradient(120deg, rgba(37, 99, 235, 0.26), transparent 55%);
}

.hero-content {
  position: absolute;
  left: 28px;
  right: 28px;
  bottom: 28px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #fff;
}

.hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.52);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hero-badge-soft {
  background: rgba(255, 255, 255, 0.14);
}

.hero-title {
  margin: 0;
  font-size: 42px;
  line-height: 0.98;
  letter-spacing: -0.05em;
  font-weight: 800;
  text-shadow: 0 10px 24px rgba(15, 23, 42, 0.35);
}

.hero-subtitle {
  margin: 0;
  max-width: 640px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 15px;
  line-height: 1.55;
}

.card-regras {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.09);
}

.card-edicao {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.09);
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
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.10);
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.section-head h2 {
  color: #0f172a;
  margin: 0 0 6px;
  font-size: 24px;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.section-head a {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

.card-regras > h2 {
  display: none;
}

.abas-config-container {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
  padding: 6px;
  border: 1px solid rgba(148, 163, 184, 0.20);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.85);
  overflow-x: auto;
}

.aba-config {
  flex: 1 0 0;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  color: #64748b;
  font-size: 16px;
  font-weight: 700;
  padding: 12px 14px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.aba-config.ativa {
  color: #1d4ed8;
  border-color: rgba(59, 130, 246, 0.18);
  background: #fff;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.06);
}

.regras-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.criterios-wrapper {
  margin-top: 4px;
}

.descricao-criterios {
  margin: 0 0 14px;
  color: #64748b;
  line-height: 1.6;
}

.vazio-criterios {
  color: #6b7280;
  font-style: italic;
  border: 1px dashed rgba(148, 163, 184, 0.45);
  border-radius: 16px;
  padding: 16px 18px;
  background: rgba(248, 250, 252, 0.86);
}

.lista-criterios {
  border: 1px solid rgba(59, 130, 246, 0.22);
  border-radius: 18px;
  max-height: 360px;
  overflow-y: auto;
  margin-bottom: 4px;
  background: #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.mesarios-wrapper {
  margin-top: 4px;
}

.campo-busca-mesario {
  margin-bottom: 12px;
}

.lista-mesarios {
  border: 1px solid rgba(59, 130, 246, 0.20);
  border-radius: 18px;
  max-height: 320px;
  overflow-y: auto;
  margin-bottom: 12px;
  background: #fff;
}

.mesario-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  background: #fff;
}

.mesario-item:last-child {
  border-bottom: none;
}

.mesario-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  object-fit: cover;
}

.mesario-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mesario-info strong {
  color: #0f172a;
  font-size: 14px;
}

.mesario-meta {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.mesario-info span {
  color: #64748b;
  font-size: 13px;
}

.mesario-perfil {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  border-radius: 999px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid transparent;
}

.mesario-perfil.perfil-mesario {
  color: #166534;
  border-color: #86efac;
  background: #f0fdf4;
}

.mesario-perfil.perfil-usuario {
  color: #1d4ed8;
  border-color: #93c5fd;
  background: #eff6ff;
}

.mesarios-selecionados {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.rotulo-selecionados {
  color: #334155;
  font-weight: 700;
  font-size: 13px;
  margin-top: 4px;
}

.chips-mesarios {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.chip-mesario {
  border: 1px solid #93c5fd;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.sem-vinculo-mesario {
  color: #6b7280;
  font-size: 13px;
}

.criterio-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background: #fff;
  cursor: grab;
  transition: background-color 0.2s ease, transform 0.15s ease;
}

.criterio-item:last-child {
  border-bottom: none;
}

.criterio-item:hover {
  background: #eff6ff;
  transform: translateY(-1px);
}

.ordem-criterio {
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

.nome-criterio {
  flex: 1;
  color: #0f172a;
  font-weight: 600;
}

.drag-criterio {
  color: #64748b;
  font-size: 18px;
}

.regra-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.04);
}

.regra-label {
  font-size: 14px;
  color: #0f172a;
  font-weight: 700;
}

.regra-help {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 20px;
  height: 20px;
  padding: 0;
  min-width: 18px;
  min-height: 18px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.35);
  background: #eff6ff;
  color: #1d4ed8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
}

.regra-help:hover {
  background: #dbeafe;
}

.regra-help:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.35);
  outline-offset: 2px;
}

.regra-select {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 16px;
  background: #fff;
  color: #0f172a;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}

.regra-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}

.regra-valor {
  width: 100%;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 16px;
  color: #111827;
  background: linear-gradient(180deg, #f8fafc, #f1f5f9);
}

.actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 12px 20px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 700;
  letter-spacing: -0.01em;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
  transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.btn-save-icon {
  flex: 0 0 auto;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(37, 99, 235, 0.28);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-finish {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #fff5f5;
  color: #dc2626;
  border: 1.5px solid rgba(220, 38, 38, 0.26);
  border-radius: 18px;
  padding: 14px 18px;
  font-size: 14px;
  cursor: pointer;
  width: 100%;
  font-weight: 700;
  box-shadow: 0 12px 24px rgba(220, 38, 38, 0.10);
}

.btn-finish:hover {
  background-color: #fee2e2;
}

.btn-finish:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.actions-finish {
  margin-top: 14px;
  display: block;
  width: 100%;
}

.input-file {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 12px 14px;
  background: #fff;
}

.hint-upload {
  font-size: 12px;
  color: #64748b;
}

.btn-cancel-file {
  width: fit-content;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: #fff;
  color: #334155;
  border-radius: 999px;
  padding: 9px 12px;
  font-size: 13px;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancel-file:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-topo {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 999px;
  background: #3b82f6;
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.22);
  z-index: 1100;
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.btn-topo:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-topo.finalizado {
  background: linear-gradient(180deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 12px 24px rgba(185, 28, 28, 0.3);
}

.btn-topo.finalizado:hover {
  background: linear-gradient(180deg, #ef4444 0%, #b91c1c 100%);
}

.loader-container-centralizado {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 0;
}

.loader {
  border: 6px solid #f3f3f3;
  border-top: 6px solid #3b82f6;
  border-radius: 50%;
  width: 90px;
  height: 90px;
  animation: spin 1s linear infinite;
}

.loader-copy {
  display: none;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {

  .conteudo,
  .conteudo.collapsed {
    margin-left: 0;
    margin-top: 70px;
    padding: 18px;
  }

  .page-kicker {
    font-size: 11px;
    padding: 6px 10px;
  }

  .title {
    font-size: 28px;
    line-height: 1.04;
    margin-top: 0;
    margin-bottom: 8px;
  }

  .header {
    margin-top: -40px;
    margin-bottom: 12px;
  }

  .page-subtitle {
    font-size: 14px;
    line-height: 1.55;
  }

  .card-quadra {
    height: 320px;
    border-radius: 20px;
  }
.abas-config-container{
  display: flex;
  gap: 5px;        
  padding: 5px;  
  overflow: hidden;
}

.aba-config{
  flex: 1 1 0;
  min-width: 0;
  padding: 9px 6px;      
  font-size: 15px;        
  line-height: 1.15;
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: normal;
}
  .hero-content {
    left: 18px;
    right: 18px;
    bottom: 18px;
    gap: 10px;
  }

  .hero-badges {
    gap: 8px;
  }

  .hero-badge {
    padding: 7px 11px;
    font-size: 11px;
  }

  .hero-title {
    font-size: 28px;
  }

  .hero-subtitle {
    font-size: 13px;
  }

  .card-edicao,
  .card-regras {
    padding: 18px;
    border-radius: 18px;
  }

  .section-head {
    margin-bottom: 14px;
  }

  .section-head h2 {
    font-size: 22px;
  }

  .section-head a {
    font-size: 13px;
  }

  .regras-grid {
    grid-template-columns: 1fr;
  }

  .abas-config-container {
    gap: 8px;
    padding: 5px;
  }

  .regra-select,
  .regra-valor,
  .input-file {
    font-size: 15px;
    padding: 11px 12px;
  }

  .actions {
    justify-content: stretch;
  }

  .btn-save {
    width: 100%;
    justify-content: center;
  }

  .loader-container-centralizado {
    margin-top: 0;
  }

  .loader {
    width: 64px;
    height: 64px;
    border-width: 5px;
  }

  .btn-topo {
    right: 14px;
    bottom: 14px;
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
}
</style>



