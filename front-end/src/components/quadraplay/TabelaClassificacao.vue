<template>
  <div
    class="placar-table"
    :class="{
      'mobile-compact-no-scroll': compactMobileNoScroll,
      'tema-navegacao': theme === 'navegacao',
      'tema-finalizado': theme === 'finalizado'
    }"
  >
    <div v-if="loading" class="loader-container-centralizado">
      <LoadingState
        size="compact"
        :theme="loadingTheme"
        :title="loadingTitle"
        :description="loadingDescription"
      />
    </div>

    <div v-else-if="!times.length" class="sem-dados-centralizado">
      {{ emptyText }}
    </div>

    <div v-else-if="isGrupoFutebol || isGrupoVolei || isGrupoBeachTenis">
      <div v-if="mostrarGrupos" class="grupos-wrapper">
        <section v-for="grupo in gruposParaExibicao" :key="grupo.id" class="grupo-section">
          <div class="grupo-header">
            <div>
              <h3>{{ grupo.nome }}</h3>
            </div>
          </div>

          <table class="placar" :class="classeTabela">
            <thead>
              <tr>
                <th>{{ isMobileViewport ? 'Tm' : 'Time' }}</th>
                <th
                  v-for="coluna in colunasTabela"
                  :key="`${grupo.id}-head-${coluna.key}`"
                  :class="{ 'col-ultimos': coluna.key === 'ultimosJogos' }"
                >
                  {{ obterTituloColuna(coluna) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(time, index) in grupo.times" :key="`${grupo.id}-${obterIdTime(time)}-${index}`">
                <td class="time-info time-info-click" @click="onTimeClick(time)">
                  <span class="posicao">{{ index + 1 }}º</span>
                  <img :src="obterFotoTimeCard(time?.time?.foto ?? time?.foto)" class="time-image" />
                  <span class="nome-time">{{ time.time?.nome }}</span>
                </td>
                <td
                  v-for="coluna in colunasTabela"
                  :key="`${grupo.id}-${obterIdTime(time)}-${coluna.key}`"
                  :class="{ 'ultimos-jogos-cell': coluna.key === 'ultimosJogos' }"
                >
                  <template v-if="coluna.key === 'ultimosJogos'">
                    <div class="ultimos-jogos">
                      <span
                        v-for="(resultado, resultadoIndex) in obterUltimosJogos(time)"
                        :key="`${grupo.id}-${obterIdTime(time)}-res-${resultadoIndex}`"
                        class="resultado-item"
                        :class="classeResultado(resultado)"
                      >
                        {{ simboloResultado(resultado) }}
                      </span>
                    </div>
                  </template>
                  <template v-else>
                    {{ formatarValorColuna(time, coluna.key) }}
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <table v-else class="placar" :class="classeTabela">
        <thead>
          <tr>
            <th>{{ isMobileViewport ? 'Tm' : 'Time' }}</th>
            <th
              v-for="coluna in colunasTabela"
              :key="`head-${coluna.key}`"
              :class="{ 'col-ultimos': coluna.key === 'ultimosJogos' }"
            >
              {{ obterTituloColuna(coluna) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(time, index) in times" :key="`${obterIdTime(time)}-${index}`">
            <td class="time-info time-info-click" @click="onTimeClick(time)">
              <span class="posicao">{{ index + 1 }}º</span>
              <img :src="obterFotoTimeCard(time?.time?.foto ?? time?.foto)" class="time-image" />
              <span class="nome-time">{{ time.time?.nome }}</span>
            </td>
            <td
              v-for="coluna in colunasTabela"
              :key="`${obterIdTime(time)}-${coluna.key}`"
              :class="{ 'ultimos-jogos-cell': coluna.key === 'ultimosJogos' }"
            >
              <template v-if="coluna.key === 'ultimosJogos'">
                <div class="ultimos-jogos">
                  <span
                    v-for="(resultado, resultadoIndex) in obterUltimosJogos(time)"
                    :key="`${obterIdTime(time)}-res-${resultadoIndex}`"
                    class="resultado-item"
                    :class="classeResultado(resultado)"
                  >
                    {{ simboloResultado(resultado) }}
                  </span>
                </div>
              </template>
              <template v-else>
                {{ formatarValorColuna(time, coluna.key) }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="sem-dados-centralizado">
      {{ emptyText }}
    </div>
  </div>

  <div v-if="showGlossary && temTabela && isGrupoFutebol" class="glossario-placar">
    <strong>Glossario</strong>

    <div class="glossario-grid">
      <p v-if="mostrarColuna('pontuacao')"><b>PTS</b>: Pontos</p>
      <p v-if="mostrarColuna('jogos')"><b>J</b>: Jogos</p>
      <p v-if="mostrarColuna('vitorias')"><b>V</b>: Vitorias</p>
      <p v-if="mostrarColuna('empates')"><b>E</b>: Empates</p>
      <p v-if="mostrarColuna('derrotas')"><b>D</b>: Derrotas</p>
      <p v-if="mostrarColuna('golsPro')"><b>GM</b>: Gols marcados</p>
      <p v-if="mostrarColuna('golsSofridos')"><b>GS</b>: Gols sofridos</p>
      <p v-if="mostrarColuna('saldoDeGols')"><b>SG</b>: Saldo de gols</p>
      <p v-if="mostrarColuna('aproveitamento')"><b>%</b>: Aproveitamento</p>
    </div>
  </div>

  <div v-if="showGlossary && temTabela && isGrupoVolei" class="glossario-placar">
    <strong>Glossario</strong>

    <div class="glossario-grid">
      <p v-if="mostrarColuna('pontuacao')"><b>PTS</b>: Pontos</p>
      <p v-if="mostrarColuna('jogos')"><b>J</b>: Jogos</p>
      <p v-if="mostrarColuna('vitorias')"><b>V</b>: Vitorias</p>
      <p v-if="mostrarColuna('derrotas')"><b>D</b>: Derrotas</p>
      <p v-if="mostrarColuna('setsVencidos')"><b>SP</b>: Sets pro</p>
      <p v-if="mostrarColuna('setsContra')"><b>SC</b>: Sets contra</p>
      <p v-if="mostrarColuna('diferencaSets')"><b>DS</b>: Diferenca de sets</p>
      <p v-if="mostrarColuna('pontosPro')"><b>PP</b>: Pontos pro</p>
      <p v-if="mostrarColuna('pontosContra')"><b>PC</b>: Pontos contra</p>
      <p v-if="mostrarColuna('diferencaPontos')"><b>DP</b>: Diferenca de pontos</p>
      <p v-if="mostrarColuna('pontosAverage')"><b>AVG</b>: Pontos average</p>
      <p v-if="mostrarColuna('derrotaWo')"><b>W.O.</b>: Derrota por W.O.</p>
    </div>
  </div>

  <div v-if="showGlossary && temTabela && isGrupoBeachTenis" class="glossario-placar">
    <strong>Glossario</strong>

    <div class="glossario-grid">
      <p v-if="mostrarColuna('pontuacao')"><b>PTS</b>: Pontos</p>
      <p v-if="mostrarColuna('jogos')"><b>J</b>: Jogos</p>
      <p v-if="mostrarColuna('vitorias')"><b>V</b>: Vitorias</p>
      <p v-if="mostrarColuna('derrotas')"><b>D</b>: Derrotas</p>
      <p v-if="mostrarColuna('setsVencidos')"><b>SP</b>: Sets pro</p>
      <p v-if="mostrarColuna('setsContra')"><b>SC</b>: Sets contra</p>
      <p v-if="mostrarColuna('diferencaSets')"><b>DS</b>: Diferenca de sets</p>
      <p v-if="mostrarColuna('gamesPro')"><b>GF</b>: Games a favor</p>
      <p v-if="mostrarColuna('gamesContra')"><b>GC</b>: Games contra</p>
      <p v-if="mostrarColuna('diferencaGames')"><b>DG</b>: Diferenca de games</p>
      <p v-if="mostrarColuna('derrotaWo')"><b>W.O.</b>: Derrota por W.O.</p>
    </div>
  </div>
</template>

<script>
import LoadingState from '@/components/loading/LoadingState.vue'
import {
  getColunasClassificacaoPorModalidade,
  resolverColunasVisiveisClassificacao
} from '@/utils/classificacaoColunas'
import { obterFotoTime } from '@/utils/timeImagem'

export default {
  name: 'TabelaClassificacao',
  components: { LoadingState },
  props: {
    times: { type: Array, default: () => [] },
    modalidade: { type: String, default: 'futebol' },
    loading: { type: Boolean, default: false },
    loadingTitle: { type: String, default: 'Carregando classificação' },
    loadingDescription: { type: String, default: 'Organizando posições, saldo e critérios da fase atual.' },
    emptyText: { type: String, default: 'Nenhum placar encontrado para este campeonato.' },
    showGlossary: { type: Boolean, default: true },
    colunasVisiveis: { type: Array, default: () => [] },
    gruposConfig: { type: Object, default: null },
    exibirPorGrupos: { type: Boolean, default: true },
    compactMobileNoScroll: { type: Boolean, default: false },
    theme: { type: String, default: 'default' },
    loadingTheme: { type: String, default: 'default' }
  },
  data() {
    return {
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1280
    }
  },
  emits: ['time-click'],
  computed: {
    isMobileViewport() {
      return this.viewportWidth <= 768
    },
    modalidadeNormalizada() {
      return String(this.modalidade || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    },
    isGrupoFutebol() {
      return ['futebol', 'futebol de areia', 'futsal'].includes(this.modalidadeNormalizada)
    },
    isGrupoVolei() {
      return ['volei', 'volei de areia', 'futevolei'].includes(this.modalidadeNormalizada)
    },
    isGrupoBeachTenis() {
      return ['beach tenis', 'beach tennis'].includes(this.modalidadeNormalizada)
    },
    classeTabela() {
      return this.isGrupoFutebol ? 'grupo-futebol' : 'grupo-volei'
    },
    temTabela() {
      return !this.loading && Array.isArray(this.times) && this.times.length > 0
    },
    colunasVisiveisResolvidas() {
      return resolverColunasVisiveisClassificacao(this.modalidade, this.colunasVisiveis)
    },
    colunasVisiveisSet() {
      return new Set(this.colunasVisiveisResolvidas)
    },
    colunasTabela() {
      const mapa = new Map(
        getColunasClassificacaoPorModalidade(this.modalidade)
          .map(coluna => [coluna.key, coluna])
      )

      return this.colunasVisiveisResolvidas
        .map(chave => mapa.get(chave))
        .filter(Boolean)
    },
    gruposParaExibicao() {
      if (!this.temTabela || !this.gruposConfig || !Array.isArray(this.gruposConfig.grupos)) {
        return []
      }

      const idsUsados = new Set()
      const grupos = this.gruposConfig.grupos
        .map((grupo, indice) => {
          const idsGrupo = new Set(
            (Array.isArray(grupo?.timeIds) ? grupo.timeIds : [])
              .map(id => Number(id))
              .filter(id => Number.isInteger(id) && id > 0)
          )

          const timesGrupo = this.times.filter(time => idsGrupo.has(this.obterIdTime(time)))
          timesGrupo.forEach(time => idsUsados.add(this.obterIdTime(time)))

          return {
            id: String(grupo?.id || `grupo-${indice + 1}`),
            nome: String(grupo?.nome || '').trim() || `Grupo ${indice + 1}`,
            times: timesGrupo
          }
        })
        .filter(grupo => grupo.times.length)

      const timesSemGrupo = this.times.filter(time => !idsUsados.has(this.obterIdTime(time)))
      if (timesSemGrupo.length) {
        grupos.push({
          id: 'sem-grupo',
          nome: 'Sem grupo',
          times: timesSemGrupo
        })
      }

      return grupos
    },
    temGruposConfigurados() {
      return this.gruposParaExibicao.length > 0
    },
    mostrarGrupos() {
      return this.exibirPorGrupos && this.temGruposConfigurados
    }
  },
  methods: {
    obterFotoTimeCard(foto) {
      return obterFotoTime(foto)
    },
    obterIdTime(time) {
      return Number(time?.timeId ?? time?.time?.id ?? time?.id ?? 0)
    },
    obterTituloColuna(coluna) {
      if (!this.isMobileViewport) return coluna?.abbr || ''
      if (coluna?.key === 'ultimosJogos') return 'ULT'
      if (coluna?.key === 'derrotaWo') return 'WO'
      return coluna?.abbr || ''
    },
    mostrarColuna(chave) {
      return this.colunasVisiveisSet.has(chave)
    },
    formatarValorColuna(time, chave) {
      if (chave === 'aproveitamento') {
        return `${time?.aproveitamento ?? 0}%`
      }

      if (chave === 'pontosAverage') {
        const valor = Number(time?.pontosAverage ?? 0)
        return Number.isFinite(valor) ? valor.toFixed(2) : '0.00'
      }

      return time?.[chave] ?? ''
    },
    onTimeClick(time) {
      const payload = {
        id: this.obterIdTime(time),
        nome: time?.time?.nome ?? time?.nome ?? '',
        foto: time?.time?.foto ?? time?.foto ?? ''
      }

      if (!Number.isFinite(payload.id) || payload.id <= 0) return
      this.$emit('time-click', payload)
    },
    obterUltimosJogos(time) {
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

      const bruto = candidatas.find(valor => Array.isArray(valor) || typeof valor === 'string')
      let resultados = []

      if (Array.isArray(bruto)) {
        resultados = bruto.map(item => this.normalizarResultadoItem(item, time))
      } else if (typeof bruto === 'string') {
        resultados = this.extrairResultadosDeTexto(bruto)
      }

      const normalizados = resultados
        .map(item => this.normalizarResultadoTexto(item))
        .filter(item => ['V', 'E', 'D', '-'].includes(item))
        .slice(0, 3)

      while (normalizados.length < 3) normalizados.push('-')
      return normalizados
    },
    extrairResultadosDeTexto(texto) {
      const bruto = String(texto || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()

      if (!bruto) return []

      const separadores = /[,\s;/|-]/
      const tokens = separadores.test(bruto)
        ? bruto.split(/[,\s;/|-]+/).filter(Boolean)
        : bruto.split('')

      return tokens.map(token => this.normalizarResultadoTexto(token))
    },
    normalizarResultadoItem(item, time) {
      if (item == null) return '-'

      if (typeof item === 'string' || typeof item === 'number') {
        return this.normalizarResultadoTexto(item)
      }

      if (typeof item !== 'object') return '-'

      const valorDireto =
        item.resultado ??
        item.status ??
        item.tipo ??
        item.code ??
        item.valor ??
        item.sigla

      if (valorDireto != null) {
        const direto = this.normalizarResultadoTexto(valorDireto)
        if (direto !== '-') return direto
      }

      if (item.venceu === true || item.vitoria === true) return 'V'
      if (item.empatou === true || item.empate === true) return 'E'
      if (item.perdeu === true || item.derrota === true) return 'D'

      const timeId = this.obterIdTime(time)
      const vencedorId = item.vencedorId ?? item.timeVencedorId ?? item.ganhadorId
      if (timeId != null && vencedorId != null) {
        return String(vencedorId) === String(timeId) ? 'V' : 'D'
      }

      const pontosPro = item.golsPro ?? item.pontosPro ?? item.pontos ?? item.marcados
      const pontosContra = item.golsContra ?? item.golsSofridos ?? item.pontosContra ?? item.sofridos
      if (Number.isFinite(Number(pontosPro)) && Number.isFinite(Number(pontosContra))) {
        if (Number(pontosPro) > Number(pontosContra)) return 'V'
        if (Number(pontosPro) < Number(pontosContra)) return 'D'
        return 'E'
      }

      return '-'
    },
    normalizarResultadoTexto(valor) {
      const token = String(valor || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()

      if (['V', 'W', 'WIN', 'WON', 'VITORIA', 'VITORIAS', 'GANHOU'].includes(token)) return 'V'
      if (['E', 'DRAW', 'EMPATE', 'EMPATES', 'TIE'].includes(token)) return 'E'
      if (['D', 'L', 'LOSS', 'LOST', 'DERROTA', 'DERROTAS', 'PERDEU', 'X'].includes(token)) return 'D'
      if (['-', 'N', 'NULL', 'SEM'].includes(token)) return '-'
      return '-'
    },
    classeResultado(resultado) {
      if (resultado === 'V') return 'resultado-v'
      if (resultado === 'E') return 'resultado-e'
      if (resultado === 'D') return 'resultado-d'
      return 'resultado-n'
    },
    simboloResultado(resultado) {
      if (resultado === 'V') return '\u2713'
      if (resultado === 'D') return '\u2715'
      return '-'
    },
    atualizarViewport() {
      this.viewportWidth = window.innerWidth
    }
  },
  mounted() {
    window.addEventListener('resize', this.atualizarViewport)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.atualizarViewport)
  }
}
</script>

<style scoped>
.placar-table {
  margin-top: 30px;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.grupos-wrapper {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.grupo-section {
  padding: 14px 14px 0;
}

.grupo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.grupo-kicker {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.grupo-header h3 {
  margin: 8px 0 0;
  color: #0f172a;
  font-size: 24px;
  line-height: 1.05;
}

.grupo-total {
  border-radius: 999px;
  padding: 8px 12px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.placar {
  width: 100%;
  min-width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.placar thead th {
  background-color: #3b82f6;
  color: white;
  font-weight: 600;
  padding: 9px 6px;
  font-size: 14px;
  text-align: left;
  white-space: nowrap;
}

.placar-table.tema-navegacao {
  border: 1px solid rgba(191, 219, 254, 0.45);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
}

.placar-table.tema-navegacao .placar thead th {
  background: #2252a8;
  border-bottom: 1px solid rgba(147, 197, 253, 0.36);
  color: #f8fafc;
}

.placar-table.tema-finalizado .placar thead th {
  background: linear-gradient(135deg, #b91c1c, #ef4444);
  border-bottom: 1px solid rgba(248, 113, 113, 0.36);
  color: #fff;
}

.placar thead th:not(:first-child),
.placar tbody td:not(:first-child) {
  text-align: center;
}

.placar tbody tr:hover {
  background-color: #f3f4f6;
}

.placar tbody td {
  color: #374151;
  padding: 8px 6px;
  font-size: 13px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.col-ultimos {
  text-align: center !important;
}

.ultimos-jogos-cell {
  padding-left: 4px;
  padding-right: 4px;
}

.ultimos-jogos {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.resultado-item {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.resultado-v {
  background-color: #16a34a;
  color: #fff;
}

.resultado-e {
  background-color: #9ca3af;
  color: #fff;
}

.resultado-d {
  background-color: #ef4444;
  color: #fff;
}

.resultado-n {
  background-color: #cbd5e1;
  color: #334155;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.time-info.time-info-click {
  cursor: pointer;
}

.time-info.time-info-click .nome-time {
  text-decoration: underline;
}

.posicao {
  width: 26px;
  height: 26px;
  min-width: 26px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  line-height: 1;
  color: #2563eb;
  background: rgba(59, 130, 246, 0.14);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.placar-table.tema-finalizado .posicao {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.14);
  border-color: rgba(239, 68, 68, 0.28);
}

.time-image {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 50%;
  border: 1px solid #d1d5db;
}

.nome-time {
  font-weight: 500;
  color: #7e7e7e;
}

.loader-container-centralizado {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 220px;
}

.loader {
  width: 36px;
  height: 36px;
  border: 4px solid #dbeafe;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.sem-dados-centralizado {
  text-align: center;
  padding: 40px 0;
  font-size: 16px;
  color: #6b7280;
}

.glossario-placar {
  margin-top: 10px;
  padding: 9px 12px;
  background: #f5f6fa;
  border-radius: 8px;
  font-size: 11px;
  color: #333;
}

.glossario-placar strong {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
}

.glossario-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px 14px;
}

.glossario-grid p {
  margin: 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.glossario-grid b {
  color: #152147;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .placar-table {
    margin-top: 18px;
  }

  .grupo-section {
    padding: 12px 12px 0;
  }

  .grupo-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .grupo-header h3 {
    font-size: 20px;
  }

  .placar {
    width: 100%;
    min-width: 560px;
    table-layout: auto;
  }

  .placar thead th {
    padding: 6px 4px;
    font-size: 11px;
    text-align: center;
  }

  .placar thead th:first-child,
  .placar tbody td:first-child {
    text-align: left;
    width: 104px;
    min-width: 104px;
    max-width: 104px;
  }

  .placar thead th:not(:first-child):not(.col-ultimos),
  .placar tbody td:not(:first-child):not(.ultimos-jogos-cell) {
    width: auto;
    min-width: 0;
    max-width: none;
    text-align: center;
  }

  .placar tbody td {
    padding: 5px 4px;
    font-size: 11px;
  }

  .col-ultimos,
  .ultimos-jogos-cell {
    width: auto;
    min-width: 72px;
    max-width: none;
  }

  .resultado-item {
    width: 14px;
    height: 14px;
    font-size: 8px;
  }

  .time-image {
    width: 20px;
    height: 20px;
    flex: 0 0 auto;
  }

  .time-info {
    min-width: 0;
    gap: 5px;
    align-items: center;
  }

  .nome-time {
    max-width: 70px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 10px;
  }

  .posicao {
    width: 20px;
    height: 20px;
    min-width: 20px;
    font-size: 10px;
  }

  .ultimos-jogos {
    gap: 2px;
  }

  .glossario-placar {
    margin-top: 8px;
    padding: 8px 10px;
  }

  .glossario-placar strong {
    margin-bottom: 6px;
    font-size: 12px;
  }

  .glossario-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 5px 10px;
  }

  .glossario-grid p {
    font-size: 11px;
    line-height: 1.25;
    white-space: normal;
  }

  .placar-table.mobile-compact-no-scroll {
    overflow-x: hidden;
  }

  .placar-table.mobile-compact-no-scroll .placar {
    min-width: 0;
    table-layout: fixed;
  }

  .placar-table.mobile-compact-no-scroll .placar thead th,
  .placar-table.mobile-compact-no-scroll .placar tbody td {
    padding: 4px 2px;
    font-size: 10px;
  }

  .placar-table.mobile-compact-no-scroll .placar thead th:first-child,
  .placar-table.mobile-compact-no-scroll .placar tbody td:first-child {
    width: 43%;
    min-width: 0;
    max-width: none;
  }

  .placar-table.mobile-compact-no-scroll .placar thead th:not(:first-child),
  .placar-table.mobile-compact-no-scroll .placar tbody td:not(:first-child) {
    width: auto;
    min-width: 0;
    max-width: none;
  }

  .placar-table.mobile-compact-no-scroll .time-info {
    gap: 2px;
  }

  .placar-table.mobile-compact-no-scroll .time-image {
    width: 16px;
    height: 16px;
  }

  .placar-table.mobile-compact-no-scroll .posicao {
    width: 16px;
    height: 16px;
    min-width: 16px;
    font-size: 9px;
  }

  .placar-table.mobile-compact-no-scroll .nome-time {
    max-width: 100%;
    font-size: 10px;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
}
</style>
