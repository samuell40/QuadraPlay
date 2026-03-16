<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="fechar">
    <div class="modal-content modal-grupos modal-grupos-base">
      <div class="modal-header">
        <div class="modal-header-copy">
          <span class="title">Organizar grupos</span>
        </div>
        <button type="button" class="btn-close-x" @click="fechar">x</button>
      </div>

      <div v-if="carregando" class="estado-box">
        Carregando configuracao de grupos...
      </div>

      <template v-else>
        <section class="config-shell">
          <div class="config-block config-block-compact">
            <div class="config-block-head">
              <span class="section-kicker">Estrutura</span>
              <h3>Quantidade de grupos</h3>
              <p>Escolha quantos grupos vao organizar a fase atual antes de sortear ou distribuir os times.</p>
            </div>

            <label class="toolbar-field toolbar-field-full">
              <select v-model.number="quantidadeGrupos" @change="atualizarQuantidadeGrupos">
                <option v-for="quantidade in opcoesQuantidade" :key="quantidade" :value="quantidade">
                  {{ quantidade }}
                </option>
              </select>
            </label>

            <div class="toolbar-resumo">
              <span>{{ times.length }} time(s) no campeonato</span>
              <span>{{ grupos.length }} grupo(s) configurado(s)</span>
              <span>{{ totalSemGrupo }} sem grupo</span>
            </div>
          </div>

          <div class="acoes-grid">
            <button class="acao-card acao-card-primary" :disabled="salvando || !times.length" @click="sortearGrupos">
              <span class="acao-kicker">Automático</span>
              <strong>Sortear grupos</strong>
              <small>Distribui os times automaticamente e salva na classificação na hora.</small>
            </button>

            <button class="acao-card" :disabled="salvando || !times.length" @click="abrirModalDistribuicao">
              <span class="acao-kicker">Manual</span>
              <strong>Definir grupo das equipes</strong>
              <small>Abra uma tela dedicada para escolher em qual grupo cada equipe vai ficar.</small>
            </button>
          </div>

        </section>

        <div class="botoes botoes-fechar">
          <button class="btn-cancel btn-full" :disabled="salvando" @click="fechar">
            Fechar
          </button>
        </div>
      </template>
    </div>
  </div>

  <div v-if="modelValue && mostrarModalDistribuicao" class="modal-overlay modal-overlay-sub" @click.self="fecharModalDistribuicao">
    <div ref="modalDistribuicao" class="modal-content modal-grupos modal-distribuicao">
      <div class="modal-header">
        <div class="modal-header-copy">
          <span class="title">Definir grupo das equipes</span>
          <p class="descricao">
            Ajuste os nomes dos grupos e distribua cada time manualmente.
          </p>
        </div>
        <button type="button" class="btn-close-x" @click="fecharModalDistribuicao">x</button>
      </div>

      <div class="toolbar-resumo">
        <span>{{ times.length }} time(s)</span>
        <span>{{ grupos.length }} grupo(s)</span>
        <span>{{ totalSemGrupo }} sem grupo</span>
      </div>

      <div class="grupos-grid">
        <section v-for="(grupo, indice) in grupos" :key="grupo.id" class="grupo-card">
          <div class="grupo-card-top">
            <div class="grupo-card-head">
              <input
                v-model="grupo.nome"
                type="text"
                maxlength="40"
                :placeholder="gerarNomeGrupoPadrao(indice)"
              />
              <span class="grupo-badge">
                {{ timesDoGrupo(grupo.id).length }} time(s)
              </span>
            </div>

            <button
              type="button"
              class="btn-add-time"
              :class="{ ativo: grupoSelecionandoId === grupo.id }"
              :disabled="salvando || !timesDisponiveis.length"
              @click="alternarListaTimesGrupo(grupo.id, $event)"
            >
              Adicionar time
            </button>
          </div>

          <div class="grupo-lista">
            <div
              v-for="time in timesDoGrupo(grupo.id)"
              :key="`${grupo.id}-${time.id}`"
              class="grupo-time-chip"
            >
              <div class="grupo-time-chip-copy">
                <img :src="obterFotoTimeCard(time.foto)" :alt="time.nome" />
                <span>{{ time.nome }}</span>
              </div>

              <button
                type="button"
                class="grupo-time-remove"
                @click="removerTimeDoGrupo(time.id)"
              >
                x
              </button>
            </div>

            <p v-if="!timesDoGrupo(grupo.id).length" class="grupo-vazio">
              Nenhum time atribuido.
            </p>
          </div>
        </section>
      </div>

      <section v-if="grupoSelecionadoAtual" class="grupo-select-popover" :style="estiloGrupoSeletor">
        <div class="grupo-select-top">
          <strong class="grupo-select-label">
            {{ nomeGrupoExibicao(grupoSelecionadoAtual.grupo, grupoSelecionadoAtual.indice) }}
          </strong>
          <button type="button" class="grupo-select-close" @click="fecharSeletorGrupo">x</button>
        </div>

        <div v-if="timesDisponiveis.length" class="grupo-select-body">
          <div class="grupo-multiselect-menu grupo-select-menu">
            <button
              v-for="time in timesDisponiveis"
              :key="`${grupoSelecionadoAtual.grupo.id}-disponivel-${time.id}`"
              type="button"
              class="grupo-multiselect-option"
              :class="{ selecionado: timeSelecionadoNoGrupo(grupoSelecionadoAtual.grupo.id, time.id) }"
              @click="toggleSelecaoTimeGrupo(grupoSelecionadoAtual.grupo.id, time.id)"
            >
              <div class="grupo-multiselect-option-copy">
                <img :src="obterFotoTimeCard(time.foto)" :alt="time.nome" />
                <div>
                  <strong>{{ time.nome }}</strong>
                  <small>{{ time._count?.jogadores || 0 }} jogador(es)</small>
                </div>
              </div>

              <span class="grupo-multiselect-check">
                {{ timeSelecionadoNoGrupo(grupoSelecionadoAtual.grupo.id, time.id) ? 'Selecionado' : 'Selecionar' }}
              </span>
            </button>
          </div>

          <button
            type="button"
            class="btn-save btn-full grupo-select-action"
            :disabled="!obterSelecaoGrupo(grupoSelecionadoAtual.grupo.id).length"
            @click="adicionarTimesSelecionadosAoGrupo(grupoSelecionadoAtual.grupo.id)"
          >
            Adicionar selecionados
          </button>
        </div>

        <p v-else class="grupo-selector-vazio">
          Todos os times ja foram distribuidos.
        </p>
      </section>

      <div class="botoes botoes-salvar-full">
        <button class="btn-save btn-full" :disabled="salvando || !times.length" @click="salvar">
          <span class="btn-save-content">
            <span v-if="salvando" class="btn-save-spinner" aria-hidden="true"></span>
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
            <span>{{ salvando ? 'Salvando...' : 'Salvar distribuicao' }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/axios'
import Swal from 'sweetalert2'
import { obterFotoTime } from '@/utils/timeImagem'

export default {
  name: 'ModalConfigurarGrupos',
  props: {
    modelValue: { type: Boolean, default: false },
    campeonatoId: { type: [String, Number], required: true }
  },
  emits: ['update:modelValue', 'salvo'],
  data() {
    return {
      carregando: false,
      salvando: false,
      mostrarModalDistribuicao: false,
      grupoSelecionandoId: '',
      estiloGrupoSeletor: {},
      selecaoTimePorGrupo: {},
      times: [],
      quantidadeGrupos: 2,
      grupos: [],
      atribuicoes: {}
    }
  },
  computed: {
    opcoesQuantidade() {
      return Array.from({ length: 15 }, (_, indice) => indice + 2)
    },
    totalSemGrupo() {
      return this.times.filter(time => !this.atribuicoes[time.id]).length
    },
    timesDisponiveis() {
      return this.times.filter(time => !this.atribuicoes[time.id])
    },
    grupoSelecionadoAtual() {
      if (!this.grupoSelecionandoId) return null
      const indice = this.grupos.findIndex(grupo => grupo.id === this.grupoSelecionandoId)
      if (indice === -1) return null
      return {
        grupo: this.grupos[indice],
        indice
      }
    }
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(valor) {
        if (valor) {
          this.carregarDados()
        } else {
          this.mostrarModalDistribuicao = false
          this.fecharSeletorGrupo()
        }
      }
    }
  },
  methods: {
    obterFotoTimeCard(foto) {
      return obterFotoTime(foto)
    },
    gerarNomeGrupoPadrao(indice) {
      const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      if (indice >= 0 && indice < alfabeto.length) {
        return `Grupo ${alfabeto[indice]}`
      }
      return `Grupo ${indice + 1}`
    },
    nomeGrupoExibicao(grupo, indice) {
      return String(grupo?.nome || '').trim() || this.gerarNomeGrupoPadrao(indice)
    },
    normalizarQuantidade(valor) {
      const numero = Number(valor)
      if (!Number.isInteger(numero) || numero < 2) return 2
      return Math.min(numero, 16)
    },
    construirGrupos(quantidade, gruposBase = []) {
      const gruposAtuais = Array.isArray(gruposBase) ? gruposBase : []

      return Array.from({ length: quantidade }, (_, indice) => {
        const grupoAtual = gruposAtuais[indice] || {}
        return {
          id: `grupo-${indice + 1}`,
          nome: String(grupoAtual.nome || '').trim()
        }
      })
    },
    aplicarConfiguracao(gruposConfig) {
      const quantidade = this.normalizarQuantidade(
        gruposConfig?.quantidade ?? gruposConfig?.grupos?.length ?? 2
      )

      this.quantidadeGrupos = quantidade
      this.grupos = this.construirGrupos(quantidade, gruposConfig?.grupos)

      const atribuicoes = {}
      for (const time of this.times) {
        atribuicoes[time.id] = ''
      }

      const gruposAtuais = Array.isArray(gruposConfig?.grupos) ? gruposConfig.grupos : []
      gruposAtuais.slice(0, quantidade).forEach((grupoAtual, indice) => {
        const grupoId = `grupo-${indice + 1}`
        const timeIds = Array.isArray(grupoAtual?.timeIds) ? grupoAtual.timeIds : []
        timeIds.forEach(timeId => {
          const timeIdNum = Number(timeId)
          if (!Number.isInteger(timeIdNum) || !Object.prototype.hasOwnProperty.call(atribuicoes, timeIdNum)) return
          atribuicoes[timeIdNum] = grupoId
        })
      })

      this.atribuicoes = atribuicoes
      this.selecaoTimePorGrupo = {}
    },
    async carregarDados() {
      if (!this.campeonatoId) return

      this.carregando = true

      try {
        const [timesResponse, configuracaoResponse] = await Promise.all([
          api.get(`/${this.campeonatoId}/times`),
          api.get(`/ordem/classificacao/${this.campeonatoId}`)
        ])

        this.times = Array.isArray(timesResponse.data) ? timesResponse.data : []
        this.aplicarConfiguracao(configuracaoResponse.data?.grupos || null)
      } catch (error) {
        console.error('Erro ao carregar configuração de grupos:', error)
        this.times = []
        this.aplicarConfiguracao(null)
        await Swal.fire('Erro', 'Não foi possível carregar os grupos do campeonato.', 'error')
      } finally {
        this.carregando = false
      }
    },
    fechar() {
      this.mostrarModalDistribuicao = false
      this.fecharSeletorGrupo()
      this.$emit('update:modelValue', false)
    },
    abrirModalDistribuicao() {
      this.mostrarModalDistribuicao = true
      this.fecharSeletorGrupo()
    },
    fecharModalDistribuicao() {
      this.mostrarModalDistribuicao = false
      this.fecharSeletorGrupo()
      this.selecaoTimePorGrupo = {}
    },
    atualizarQuantidadeGrupos() {
      const quantidade = this.normalizarQuantidade(this.quantidadeGrupos)
      const gruposAnteriores = this.grupos.slice()
      const gruposPermitidos = new Set(
        Array.from({ length: quantidade }, (_, indice) => `grupo-${indice + 1}`)
      )

      this.quantidadeGrupos = quantidade
      this.grupos = this.construirGrupos(quantidade, gruposAnteriores)

      const atribuicoes = { ...this.atribuicoes }
      Object.keys(atribuicoes).forEach(timeId => {
        if (atribuicoes[timeId] && !gruposPermitidos.has(atribuicoes[timeId])) {
          atribuicoes[timeId] = ''
        }
      })
      this.atribuicoes = atribuicoes

      if (this.grupoSelecionandoId && !gruposPermitidos.has(this.grupoSelecionandoId)) {
        this.fecharSeletorGrupo()
      }
      this.selecaoTimePorGrupo = {}
    },
    atualizarGrupoTime(timeId, grupoId) {
      this.atribuicoes = {
        ...this.atribuicoes,
        [timeId]: grupoId || ''
      }
    },
    alternarListaTimesGrupo(grupoId, event) {
      if (!grupoId) return
      if (this.grupoSelecionandoId === grupoId) {
        this.fecharSeletorGrupo()
        return
      }

      this.grupoSelecionandoId = grupoId
      this.posicionarSeletorGrupo(event?.currentTarget)
      this.selecaoTimePorGrupo = {
        ...this.selecaoTimePorGrupo,
        [grupoId]: Array.isArray(this.selecaoTimePorGrupo[grupoId]) ? this.selecaoTimePorGrupo[grupoId] : []
      }
    },
    fecharSeletorGrupo() {
      this.grupoSelecionandoId = ''
      this.estiloGrupoSeletor = {}
    },
    posicionarSeletorGrupo(triggerEl) {
      const modalEl = this.$refs.modalDistribuicao
      if (!modalEl || !triggerEl) return

      const modalRect = modalEl.getBoundingClientRect()
      const triggerRect = triggerEl.getBoundingClientRect()
      const largura = Math.min(360, Math.max(280, modalRect.width - 32))
      let left = triggerRect.left - modalRect.left

      if (left + largura > modalRect.width - 16) {
        left = modalRect.width - largura - 16
      }

      left = Math.max(16, left)

      const espacoAbaixo = modalRect.bottom - triggerRect.bottom - 24
      const espacoAcima = triggerRect.top - modalRect.top - 24
      const alturaBase = 360
      const abrirAcima = espacoAbaixo < 240 && espacoAcima > espacoAbaixo
      const alturaMaxima = Math.min(
        alturaBase,
        Math.max(220, abrirAcima ? espacoAcima : espacoAbaixo)
      )
      const top = abrirAcima
        ? Math.max(16, triggerRect.top - modalRect.top - alturaMaxima - 10)
        : triggerRect.bottom - modalRect.top + 10

      this.estiloGrupoSeletor = {
        top: `${top}px`,
        left: `${left}px`,
        width: `${largura}px`,
        height: `${alturaMaxima}px`,
        maxHeight: `${alturaMaxima}px`
      }
    },
    obterSelecaoGrupo(grupoId) {
      return Array.isArray(this.selecaoTimePorGrupo[grupoId]) ? this.selecaoTimePorGrupo[grupoId] : []
    },
    timeSelecionadoNoGrupo(grupoId, timeId) {
      return this.obterSelecaoGrupo(grupoId).includes(Number(timeId))
    },
    toggleSelecaoTimeGrupo(grupoId, timeId) {
      const timeIdNum = Number(timeId)
      if (!grupoId || !Number.isInteger(timeIdNum) || timeIdNum <= 0) return

      const selecaoAtual = this.obterSelecaoGrupo(grupoId)
      const proximaSelecao = selecaoAtual.includes(timeIdNum)
        ? selecaoAtual.filter(id => id !== timeIdNum)
        : [...selecaoAtual, timeIdNum]

      this.selecaoTimePorGrupo = {
        ...this.selecaoTimePorGrupo,
        [grupoId]: proximaSelecao
      }
    },
    adicionarTimesSelecionadosAoGrupo(grupoId) {
      if (!grupoId) return

      const selecionados = this.obterSelecaoGrupo(grupoId)
      if (!selecionados.length) return

      const atribuicoes = { ...this.atribuicoes }
      selecionados.forEach(timeId => {
        atribuicoes[timeId] = grupoId
      })
      this.atribuicoes = atribuicoes

      this.selecaoTimePorGrupo = {
        ...this.selecaoTimePorGrupo,
        [grupoId]: []
      }

      if (!this.timesDisponiveis.length) {
        this.fecharSeletorGrupo()
      }
    },
    adicionarTimeAoGrupo(grupoId, timeId) {
      if (!grupoId || !timeId) return
      this.atualizarGrupoTime(timeId, grupoId)
      this.selecaoTimePorGrupo = {
        ...this.selecaoTimePorGrupo,
        [grupoId]: []
      }
      if (!this.timesDisponiveis.length) {
        this.grupoSelecionandoId = ''
      }
    },
    removerTimeDoGrupo(timeId) {
      if (!timeId) return
      this.atualizarGrupoTime(timeId, '')
    },
    timesDoGrupo(grupoId) {
      return this.times.filter(time => this.atribuicoes[time.id] === grupoId)
    },
    embaralharTimes(lista) {
      const copia = Array.isArray(lista) ? [...lista] : []

      for (let indice = copia.length - 1; indice > 0; indice -= 1) {
        const indiceAleatorio = Math.floor(Math.random() * (indice + 1))
        const atual = copia[indice]
        copia[indice] = copia[indiceAleatorio]
        copia[indiceAleatorio] = atual
      }

      return copia
    },
    montarPayloadGrupos() {
      return {
        quantidade: this.quantidadeGrupos,
        grupos: this.grupos.map((grupo, indice) => ({
          id: grupo.id,
          nome: String(grupo.nome || '').trim() || this.gerarNomeGrupoPadrao(indice),
          timeIds: this.timesDoGrupo(grupo.id).map(time => Number(time.id))
        }))
      }
    },
    obterTargetSwal() {
      return this.mostrarModalDistribuicao ? '.modal-distribuicao' : '.modal-grupos-base'
    },
    async persistirGrupos(payload, mensagemSucesso) {
      const { data } = await api.put(`/campeonatos/${this.campeonatoId}/classificacao/ordem`, {
        grupos: payload
      })

      const gruposSalvos = data?.data?.grupos || payload
      this.$emit('salvo', gruposSalvos)
      await Swal.fire({
        title: 'Sucesso',
        text: mensagemSucesso,
        icon: 'success',
        target: this.obterTargetSwal()
      })
      return gruposSalvos
    },
    async sortearGrupos() {
      if (!this.times.length) return

      this.salvando = true

      try {
        this.atualizarQuantidadeGrupos()

        const atribuicoes = {}
        this.times.forEach(time => {
          atribuicoes[time.id] = ''
        })

        const timesEmbaralhados = this.embaralharTimes(this.times)
        timesEmbaralhados.forEach((time, indice) => {
          const grupo = this.grupos[indice % this.grupos.length]
          if (!grupo) return
          atribuicoes[time.id] = grupo.id
        })

        this.atribuicoes = atribuicoes

        const payload = this.montarPayloadGrupos()
        await this.persistirGrupos(payload, 'Grupos sorteados com sucesso.')
        this.fechar()
      } catch (error) {
        console.error('Erro ao sortear grupos:', error)
        await Swal.fire('Erro', 'Não foi possível sortear os grupos.', 'error')
      } finally {
        this.salvando = false
      }
    },
    async removerGrupos() {
      const confirmacao = await Swal.fire({
        title: 'Remover agrupamento?',
        text: 'A classificação volta a aparecer em uma tabela única.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Remover',
        cancelButtonText: 'Cancelar'
      })

      if (!confirmacao.isConfirmed) return

      this.salvando = true

      try {
        await api.put(`/campeonatos/${this.campeonatoId}/classificacao/ordem`, { grupos: null })
        this.$emit('salvo', null)
        await Swal.fire({
          title: 'Sucesso',
          text: 'Agrupamento removido com sucesso.',
          icon: 'success',
          target: this.obterTargetSwal()
        })
        this.fechar()
      } catch (error) {
        console.error('Erro ao remover grupos:', error)
        await Swal.fire({
          title: 'Erro',
          text: 'Não foi possível remover os grupos.',
          icon: 'error',
          target: this.obterTargetSwal()
        })
      } finally {
        this.salvando = false
      }
    },
    async salvar() {
      this.salvando = true

      try {
        const payload = this.montarPayloadGrupos()
        await this.persistirGrupos(payload, 'Grupos salvos com sucesso.')
        this.fecharModalDistribuicao()
        this.fechar()
      } catch (error) {
        console.error('Erro ao salvar grupos:', error)
        await Swal.fire({
          title: 'Erro',
          text: 'Não foi possível salvar os grupos.',
          icon: 'error',
          target: this.obterTargetSwal()
        })
      } finally {
        this.salvando = false
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.56);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
  padding: 20px;
}

.modal-content {
  background: #fff;
  border-radius: 24px;
  width: min(920px, 100%);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.modal-header-copy {
  min-width: 0;
}

.title {
  display: block;
  color: #3b82f6;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.08;
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

.descricao {
  margin: 10px 0 0;
  color: #64748b;
  line-height: 1.6;
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

.config-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-block {
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
  padding: 18px;
}

.config-block-compact {
  padding: 14px 16px;
  border-radius: 18px;
}

.config-block-compact .config-block-head h3 {
  margin: 6px 0 4px;
  font-size: 20px;
}

.config-block-compact .config-block-head p {
  font-size: 14px;
  line-height: 1.5;
}

.config-block-compact .toolbar-field {
  gap: 6px;
}

.config-block-compact .toolbar-field-full {
  margin-top: 10px;
}

.config-block-compact .toolbar-field select {
  padding: 12px 14px;
  font-size: 15px;
}

.config-block-compact .toolbar-resumo {
  gap: 8px;
  margin-top: 10px;
}

.config-block-compact .toolbar-resumo span {
  padding: 6px 10px;
  font-size: 12px;
}

.config-block-head h3 {
  margin: 8px 0 6px;
  color: #0f172a;
  font-size: 23px;
}

.config-block-head p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
}

.toolbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.toolbar-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #0f172a;
  font-weight: 600;
}

.toolbar-field-full {
  width: 100%;
  margin-top: 14px;
}

.toolbar-field select {
  width: 100%;
  min-width: 0;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 16px;
  background: #fff;
}

.toolbar-resumo {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.toolbar-resumo span {
  border-radius: 999px;
  padding: 8px 12px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
}

.acoes-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.acao-card {
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.05);
  padding: 18px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.acao-card:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.32);
  box-shadow: 0 22px 42px rgba(37, 99, 235, 0.12);
}

.acao-card:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.acao-card strong {
  color: #0f172a;
  font-size: 20px;
  line-height: 1.15;
}

.acao-card small {
  color: #64748b;
  line-height: 1.45;
  font-size: 13px;
}

.acao-card-primary {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-color: rgba(37, 99, 235, 0.24);
}

.acao-kicker {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 7px 12px;
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.grupos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.grupo-card,
.times-card {
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
}

.grupo-card {
  padding: 18px;
}

.grupo-card-top {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  margin-bottom: 14px;
}

.grupo-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.grupo-card-top input {
  flex: 1;
  min-width: 0;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 15px;
}

.btn-add-time {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border: 1px solid rgba(59, 130, 246, 0.28);
  border-radius: 14px;
  background: rgba(59, 130, 246, 0.08);
  color: #1d4ed8;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
}

.btn-add-time:hover:not(:disabled) {
  border-color: rgba(59, 130, 246, 0.42);
  background: rgba(59, 130, 246, 0.12);
  box-shadow: 0 14px 28px rgba(59, 130, 246, 0.1);
}

.btn-add-time.ativo {
  border-color: rgba(37, 99, 235, 0.48);
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1d4ed8;
  box-shadow: 0 18px 36px rgba(37, 99, 235, 0.12);
}

.btn-add-time:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.grupo-badge {
  border-radius: 999px;
  padding: 8px 10px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.grupo-select-popover {
  position: absolute;
  z-index: 20;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(191, 219, 254, 0.95);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  padding: 12px;
  overflow: hidden;
}

.grupo-select-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.grupo-select-label {
  color: #1e3a8a;
  font-size: 14px;
  font-weight: 800;
}

.grupo-select-close {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 999px;
  background: #f8fafc;
  color: #475569;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  flex: 0 0 auto;
}

.grupo-select-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
}

.grupo-select-menu {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.grupo-select-action {
  flex: 0 0 auto;
}

.grupo-multiselect-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid rgba(191, 219, 254, 0.9);
  border-radius: 16px;
  background: #f8fbff;
}

.grupo-multiselect-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: #fff;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.grupo-multiselect-option:hover {
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(59, 130, 246, 0.1);
}

.grupo-multiselect-option.selecionado {
  border-color: rgba(37, 99, 235, 0.42);
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  box-shadow: 0 18px 36px rgba(37, 99, 235, 0.14);
}

.grupo-multiselect-option-copy {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.grupo-multiselect-option-copy img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  flex: 0 0 34px;
}

.grupo-multiselect-option-copy strong,
.grupo-multiselect-option-copy small {
  display: block;
}

.grupo-multiselect-option-copy strong {
  color: #0f172a;
  font-size: 14px;
}

.grupo-multiselect-option-copy small {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
}

.grupo-multiselect-check {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 6px 9px;
  background: rgba(148, 163, 184, 0.12);
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.grupo-multiselect-option.selecionado .grupo-multiselect-check {
  background: rgba(37, 99, 235, 0.16);
  color: #1d4ed8;
}

.grupo-selector-vazio {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  text-align: center;
  padding: 10px 6px 12px;
}

.grupo-lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 96px;
}

.grupo-time-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  padding: 10px 12px;
  background: #fff;
  color: #0f172a;
  font-weight: 600;
}

.grupo-time-chip-copy {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.grupo-time-chip-copy span {
  min-width: 0;
}

.grupo-time-chip img,
.time-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.grupo-time-remove {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(239, 68, 68, 0.22);
  border-radius: 999px;
  background: #fff5f5;
  color: #dc2626;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  flex: 0 0 auto;
}

.grupo-vazio {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
}

.times-card {
  padding: 20px;
}

.times-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.times-card-head h3 {
  margin: 6px 0 0;
  color: #0f172a;
  font-size: 24px;
}

.times-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  padding: 12px 14px;
  background: #fff;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.time-info strong,
.time-info small {
  display: block;
}

.time-info strong {
  color: #0f172a;
}

.time-info small {
  color: #64748b;
  margin-top: 4px;
}

.time-row select {
  min-width: 180px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 15px;
  background: #fff;
}

.estado-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  border: 1px dashed rgba(148, 163, 184, 0.45);
  border-radius: 18px;
  color: #64748b;
  text-align: center;
  padding: 18px;
}

.estado-box-secundario {
  min-height: 120px;
}

.modal-overlay-sub {
  z-index: 2200;
}

.modal-grupos-base {
  width: min(760px, 100%);
}

.modal-distribuicao {
  position: relative;
  width: min(980px, 100%);
}

.botoes {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-save,
.btn-cancel,
.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 999px;
  padding: 0 18px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
}

.btn-save {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
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
  animation: btnSaveSpin 0.75s linear infinite;
  flex: 0 0 14px;
}

.btn-save-icon {
  flex: 0 0 auto;
}

.btn-cancel {
  background: transparent;
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.35);
}

.botoes-fechar {
  justify-content: flex-start;
}

.botoes-salvar-full {
  justify-content: flex-start;
}

.btn-full {
  width: 100%;
}

.btn-danger {
  background: #fff1f2;
  color: #be123c;
  border: 1px solid rgba(244, 63, 94, 0.22);
}

.btn-save:disabled,
.btn-cancel:disabled,
.btn-danger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@keyframes btnSaveSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 12px;
  }

  .modal-content {
    border-radius: 20px;
    max-height: calc(100vh - 24px);
    padding: 16px;
  }

  .modal-header {
    position: relative;
    padding-right: 52px;
    flex-direction: row;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
  }

  .title {
    font-size: 24px;
  }

  .descricao {
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.5;
  }

  .btn-close-x {
    position: absolute;
    top: 0;
    right: 0;
  }

  .config-shell {
    gap: 12px;
  }

  .config-block,
  .config-block-compact,
  .times-card,
  .grupo-card {
    border-radius: 16px;
    padding: 14px;
  }

  .config-block-compact {
    padding: 12px;
  }

  .config-block-head h3,
  .config-block-compact .config-block-head h3,
  .times-card-head h3 {
    font-size: 18px;
  }

  .config-block-compact .config-block-head h3 {
    margin: 4px 0 3px;
    font-size: 17px;
  }

  .config-block-head p,
  .config-block-compact .config-block-head p {
    font-size: 13px;
    line-height: 1.45;
  }

  .config-block-compact .config-block-head p {
    font-size: 12px;
    line-height: 1.35;
  }

  .toolbar-field-full {
    margin-top: 8px;
  }

  .config-block-compact .toolbar-field-full {
    margin-top: 6px;
  }

  .toolbar-field select,
  .time-row select,
  .grupo-card-top input {
    min-height: 42px;
    padding: 10px 12px;
    font-size: 14px;
  }

  .toolbar-resumo {
    gap: 6px;
    margin-top: 8px;
  }

  .config-block-compact .toolbar-resumo {
    flex-wrap: nowrap;
    gap: 4px;
    margin-top: 6px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .config-block-compact .toolbar-resumo::-webkit-scrollbar {
    display: none;
  }

  .toolbar-resumo span,
  .grupo-badge {
    padding: 6px 9px;
    font-size: 11px;
  }

  .config-block-compact .toolbar-resumo span {
    flex: 0 0 auto;
    white-space: nowrap;
    padding: 5px 8px;
    font-size: 10px;
  }

  .toolbar,
  .acoes-grid,
  .time-row,
  .botoes {
    flex-direction: column;
    align-items: stretch;
  }

  .acao-card {
    border-radius: 18px;
    padding: 14px;
    gap: 6px;
  }

  .acao-card strong {
    font-size: 18px;
  }

  .acao-card small {
    font-size: 12px;
    line-height: 1.4;
  }

  .acao-kicker {
    padding: 6px 10px;
    font-size: 11px;
  }

  .toolbar-field select,
  .time-row select {
    width: 100%;
    min-width: 0;
  }

  .acoes-grid {
    grid-template-columns: 1fr;
  }

  .grupos-grid {
    gap: 12px;
    margin-bottom: 16px;
  }

  .grupo-card-top,
  .times-card-head,
  .time-row {
    gap: 10px;
  }

  .grupo-card-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .grupo-card-top {
    margin-bottom: 10px;
  }

  .btn-add-time {
    min-height: 40px;
    font-size: 13px;
  }

  .grupo-multiselect-menu {
    gap: 6px;
    padding: 8px;
    border-radius: 14px;
  }

  .grupo-multiselect-option {
    padding: 8px 10px;
    border-radius: 12px;
    gap: 8px;
  }

  .grupo-multiselect-option-copy img {
    width: 30px;
    height: 30px;
    flex-basis: 30px;
  }

  .grupo-multiselect-option-copy strong {
    font-size: 13px;
  }

  .grupo-multiselect-option-copy small,
  .grupo-selector-vazio {
    font-size: 11px;
  }

  .grupo-select-popover {
    width: calc(100% - 24px) !important;
    left: 12px !important;
    right: 12px;
    border-radius: 16px;
    padding: 10px;
  }

  .grupo-select-label {
    font-size: 13px;
  }

  .grupo-select-close {
    width: 26px;
    height: 26px;
    font-size: 13px;
  }

  .grupo-multiselect-check {
    padding: 5px 8px;
    font-size: 10px;
  }

  .grupo-selector-vazio {
    font-size: 11px;
  }

  .grupo-lista,
  .times-lista {
    gap: 8px;
  }

  .grupo-lista {
    min-height: 72px;
  }

  .grupo-time-chip {
    padding: 8px 10px;
    border-radius: 12px;
    gap: 8px;
    font-size: 13px;
  }

  .grupo-time-remove {
    width: 26px;
    height: 26px;
    font-size: 14px;
  }

  .grupo-time-chip img,
  .time-avatar {
    width: 32px;
    height: 32px;
  }

  .time-row {
    border-radius: 14px;
    padding: 10px 12px;
  }

  .time-info {
    gap: 10px;
  }

  .time-info small {
    margin-top: 2px;
    font-size: 12px;
  }

  .botoes {
    gap: 8px;
    margin-top: 16px;
  }

  .btn-save,
  .btn-cancel,
  .btn-danger {
    min-height: 42px;
    font-size: 13px;
  }
}
</style>
