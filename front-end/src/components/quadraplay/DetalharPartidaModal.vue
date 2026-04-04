<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="fecharModalPartida">
    <div class="modal-partida" :class="partidaTemaClasse">
      <div v-if="loadingDetalhePartida" class="modal-loader-shell">
        <LoadingState
          size="compact"
          :theme="temaLoadingDetalhe"
          title="Carregando detalhes da partida"
          description="Buscando placar, escalação e estatísticas do confronto selecionado."
        />
      </div>

      <div v-else-if="partidaDetalhada" class="conteudo-partida">
        <div class="header-partida">
          <h2 class="titulo-partida">Detalhes da Partida (Campeonato {{ partidaDetalhada.campeonato?.nome }})</h2>
          <button type="button" class="btn-close-x" aria-label="Fechar modal" @click="fecharModalPartida">x</button>
        </div>

        <div class="infos">
          <p class="quadra-linha">
          {{ partidaDetalhada?.quadra?.nome}}
          </p>
          <p v-if="!isDetalheVolei && !isPartidaAgendada" class="faltas-linha">
            <strong>Faltas:</strong>
            {{ partidaDetalhada.faltasTimeA ?? 0 }} x {{ partidaDetalhada.faltasTimeB ?? 0 }}
          </p>
        </div>

        <div class="placar-modal">
          <div class="time">
            <img v-if="partidaDetalhada.timeA?.foto" :src="partidaDetalhada.timeA.foto" alt="Escudo time A" />
            <strong>{{ partidaDetalhada.timeA?.nome }}</strong>
            <p v-if="!isDetalheVolei && nomesGoleadoresTimeA" class="goleadores-linha" :title="nomesGoleadoresTimeA">
              {{ nomesGoleadoresTimeA }}
            </p>
          </div>

          <div class="resultado-agendada">
            <span class="status-badge status-badge-central" :class="statusClass(partidaDetalhada, 'text')">
              <span v-if="partidaDetalhada?.status === 'EM_ANDAMENTO'" class="status-live-dot"
                aria-hidden="true"></span>
              {{ statusLabel(partidaDetalhada) }}
            </span>
            <span v-if="exibirDataCentro && dataPartidaDestaque" class="data-partida-destaque">
              {{ dataPartidaDestaque }}
            </span>
            <span class="resultado">
              <template v-if="isPartidaAgendada">x</template>
              <template v-else>{{ partidaDetalhada.pontosTimeA ?? 0 }} x {{ partidaDetalhada.pontosTimeB ?? 0 }}</template>
            </span>
          </div>

          <div class="time">
            <img v-if="partidaDetalhada.timeB?.foto" :src="partidaDetalhada.timeB.foto" alt="Escudo time B" />
            <strong>{{ partidaDetalhada.timeB?.nome }}</strong>
            <p v-if="!isDetalheVolei && nomesGoleadoresTimeB" class="goleadores-linha" :title="nomesGoleadoresTimeB">
              {{ nomesGoleadoresTimeB }}
            </p>
          </div>
        </div>

        <div v-if="!isDetalheVolei" class="jogadores-container">
          <div class="time-mobile-title">
            {{ partidaDetalhada.timeA?.nome }}
            <div class="jogadores-time">
              <p v-if="semEscalacaoTimeA" class="sem-escalacao">Escalacão não Definida</p>
              <div v-else v-for="jp in jogadoresTimeA" :key="jp.id" class="jogador-item"
                :class="{ 'jogador-suspenso': jogadorSuspenso(jp) }">
                <span v-if="temNumeroJogador(jp.jogador?.numero)" class="numero-jogador">{{ jp.jogador?.numero }}</span>
                <img v-if="jp.jogador?.foto" :src="jp.jogador.foto" class="foto-jogador" alt="Foto do jogador" />
                <div class="dados-jogador">
                  <span class="nome" :class="{ 'nome-suspenso': jogadorSuspenso(jp) }">{{ jp.jogador?.nome }}</span>
                  <span v-if="jogadorSuspenso(jp)" class="status-suspenso" :title="jp.motivoSuspensao || 'Jogador suspenso'">
                    Suspenso
                  </span>
                  <div v-if="temEstatisticas(jp)" class="estatisticas">
                    <span v-if="temGols(jp)" class="estat-item gols" title="Bola">
                      ⚽
                      <span class="estat-valor">{{ valorPositivo(jp.gols) }}</span>
                    </span>
                    <span v-if="temCartaoAmarelo(jp)" class="estat-item cartao amarelo" title="Cartão amarelo">
                      <svg class="estat-icon icon-cartao" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                        <rect x="4" y="2.5" width="12" height="15" rx="2" ry="2" fill="currentColor" />
                      </svg>
                      <span class="estat-valor">{{ valorPositivo(jp.cartoesAmarelos) }}</span>
                    </span>
                    <span v-if="temCartaoVermelho(jp)" class="estat-item cartao vermelho" title="Cartão vermelho">
                      <svg class="estat-icon icon-cartao" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                        <rect x="4" y="2.5" width="12" height="15" rx="2" ry="2" fill="currentColor" />
                      </svg>
                      <span class="estat-valor">{{ valorPositivo(jp.cartoesVermelhos) }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="time-mobile-title">
            {{ partidaDetalhada.timeB?.nome }}
            <div class="jogadores-time">
              <p v-if="semEscalacaoTimeB" class="sem-escalacao">Escalação não Definida</p>
              <div v-else v-for="jp in jogadoresTimeB" :key="jp.id" class="jogador-item"
                :class="{ 'jogador-suspenso': jogadorSuspenso(jp) }">
                <span v-if="temNumeroJogador(jp.jogador?.numero)" class="numero-jogador">{{ jp.jogador?.numero }}</span>
                <img v-if="jp.jogador?.foto" :src="jp.jogador.foto" class="foto-jogador" alt="Foto do jogador" />
                <div class="dados-jogador">
                  <span class="nome" :class="{ 'nome-suspenso': jogadorSuspenso(jp) }">{{ jp.jogador?.nome }}</span>
                  <span v-if="jogadorSuspenso(jp)" class="status-suspenso" :title="jp.motivoSuspensao || 'Jogador suspenso'">
                    Suspenso
                  </span>
                  <div v-if="temEstatisticas(jp)" class="estatisticas">
                    <span v-if="temGols(jp)" class="estat-item gols" title="Bola">
                      ⚽
                      <span class="estat-valor">{{ valorPositivo(jp.gols) }}</span>
                    </span>
                    <span v-if="temCartaoAmarelo(jp)" class="estat-item cartao amarelo" title="Cartão amarelo">
                      <svg class="estat-icon icon-cartao" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                        <rect x="4" y="2.5" width="12" height="15" rx="2" ry="2" fill="currentColor" />
                      </svg>
                      <span class="estat-valor">{{ valorPositivo(jp.cartoesAmarelos) }}</span>
                    </span>
                    <span v-if="temCartaoVermelho(jp)" class="estat-item cartao vermelho" title="Cartão vermelho">
                      <svg class="estat-icon icon-cartao" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                        <rect x="4" y="2.5" width="12" height="15" rx="2" ry="2" fill="currentColor" />
                      </svg>
                      <span class="estat-valor">{{ valorPositivo(jp.cartoesVermelhos) }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="acoes-modal">
          <button
            class="btn-compartilhar"
            :disabled="loadingDetalhePartida || loadingCompartilhamento || !partidaDetalhada"
            :aria-label="loadingCompartilhamento ? 'Gerando imagem para compartilhar' : 'Compartilhar resultado'"
            @click="salvarImagemResultado"
          >
            <span class="btn-compartilhar-content">
              <span v-if="loadingCompartilhamento" class="btn-compartilhar-spinner" aria-hidden="true"></span>
              <template v-else>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-share-fill btn-compartilhar-icon"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5" />
                </svg>
                <span>Compartilhar</span>
              </template>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2'
import api from '@/axios'
import LoadingState from '@/components/loading/LoadingState.vue'
import { obterFotoTime } from '@/utils/timeImagem'
import logoQuadraPlay from '@/assets/logo.png'
import logoPrefeituraSaoVicente from '@/assets/Captura de tela 2026-01-31 114733.png'
import {
  isStatusPartidaPendente,
  obterRotuloStatusPartida,
  obterStatusExibicaoPartida
} from '@/utils/partidaStatus'

const STATUS_CONFIG = {
  FINALIZADA: { label: 'ENCERRADA', card: 'partida-finalizada', text: 'status-finalizada' },
  EM_ANDAMENTO: { label: 'EM ANDAMENTO', card: 'partida-andamento', text: 'status-andamento' },
  AGENDADA: { label: 'AGENDADA', card: 'partida-agendada', text: 'status-agendada' },
  AGENDADA_HOJE: { label: 'AGENDADA PARA HOJE', card: 'partida-agendada', text: 'status-agendada' },
  ADIADA: { label: 'ADIADA', card: 'partida-agendada', text: 'status-agendada' },
  CANCELADA: { label: 'CANCELADA', card: 'partida-cancelada', text: 'status-cancelada' }
}

export default {
  name: 'DetalharPartidaModal',
  components: { LoadingState },
  props: {
    modelValue: { type: Boolean, default: false },
    partidaId: { type: [Number, String], default: null },
    partidaStatus: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      loadingDetalhePartida: false,
      partidaDetalhada: null,
      loadingCompartilhamento: false
    }
  },
  computed: {
    partidaIdNormalizado() {
      const id = Number(this.partidaId)
      return Number.isFinite(id) && id > 0 ? id : null
    },
    modalidadeDetalheNormalizada() {
      return String(this.partidaDetalhada?.modalidade?.nome || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    },
    isDetalheVolei() {
      return ['volei', 'volei de areia', 'futevolei', 'beach tenis', 'beach tennis'].includes(this.modalidadeDetalheNormalizada)
    },
    isPartidaAgendada() {
      return isStatusPartidaPendente(this.partidaDetalhada)
    },
    isPartidaEmAndamento() {
      return String(this.partidaDetalhada?.status || '') === 'EM_ANDAMENTO'
    },
    isPartidaFinalizada() {
      return String(this.partidaDetalhada?.status || '') === 'FINALIZADA'
    },
    semEscalacaoTimeA() {
      return this.isPartidaAgendada || this.jogadoresTimeA.length === 0
    },
    semEscalacaoTimeB() {
      return this.isPartidaAgendada || this.jogadoresTimeB.length === 0
    },
    jogadoresTimeA() {
      if (!this.partidaDetalhada) return []
      return (this.partidaDetalhada.jogadoresPartida || [])
        .filter(j => j.timeId === this.partidaDetalhada.timeA?.id)
    },
    jogadoresTimeB() {
      if (!this.partidaDetalhada) return []
      return (this.partidaDetalhada.jogadoresPartida || [])
        .filter(j => j.timeId === this.partidaDetalhada.timeB?.id)
    },
    nomesGoleadoresTimeA() {
      return this.listarNomesGoleadores(this.jogadoresTimeA)
    },
    nomesGoleadoresTimeB() {
      return this.listarNomesGoleadores(this.jogadoresTimeB)
    },
    exibirDataCentro() {
      return this.isPartidaAgendada || this.isPartidaFinalizada
    },
    dataPartidaDestaque() {
      const dataBase = this.partidaDetalhada?.data ||
        this.partidaDetalhada?.datahora ||
        this.partidaDetalhada?.createdAt

      if (!dataBase) return ''

      const dt = new Date(dataBase)
      if (Number.isNaN(dt.getTime())) return ''

      return dt.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },
    statusExibicaoPartidaAtual() {
      return obterStatusExibicaoPartida(this.partidaDetalhada || this.partidaStatus)
    },
    partidaTemaClasse() {
      return STATUS_CONFIG[this.statusExibicaoPartidaAtual]?.card || ''
    },
    temaLoadingDetalhe() {
      return ['FINALIZADA', 'CANCELADA'].includes(this.statusExibicaoPartidaAtual) ? 'danger' : 'default'
    }
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(val) {
        if (val) {
          this.carregarDetalhePartida()
        } else {
          this.partidaDetalhada = null
          this.loadingDetalhePartida = false
        }
      }
    },
    partidaId() {
      if (this.modelValue) {
        this.carregarDetalhePartida()
      }
    }
  },
  methods: {
    async carregarDetalhePartida() {
      if (!this.partidaIdNormalizado) {
        this.partidaDetalhada = null
        return
      }

      this.loadingDetalhePartida = true
      this.partidaDetalhada = null

      try {
        const { data } = await api.get(`/detalhar/partida/${this.partidaIdNormalizado}`)
        this.partidaDetalhada = data
      } catch (err) {
        console.error('Erro ao detalhar partida:', err)
        Swal.fire('Erro', 'Não foi possível carregar os detalhes da partida.', 'error')
        this.fecharModalPartida()
      } finally {
        this.loadingDetalhePartida = false
      }
    },
    fecharModalPartida() {
      this.$emit('update:modelValue', false)
      this.partidaDetalhada = null
      this.loadingDetalhePartida = false
    },
    statusClass(partida, tipo) {
      const statusExibicao = obterStatusExibicaoPartida(partida)
      return STATUS_CONFIG[statusExibicao]?.[tipo] || ''
    },
    statusLabel(partida) {
      return obterRotuloStatusPartida(partida)
    },
    async salvarImagemResultado() {
      if (!this.partidaDetalhada || this.loadingCompartilhamento) return

      this.loadingCompartilhamento = true

      try {
        const payload = await this.gerarArquivoCompartilhamento()
        this.baixarImagemCompartilhamento(payload.url, payload.arquivoNome)
      } catch (error) {
        console.error('Erro ao salvar imagem da partida:', error)
        this.abrirSwalCompartilhamento({
          title: 'Erro',
          text: 'Não foi possível gerar a imagem para salvar.',
          icon: 'error'
        })
      } finally {
        this.loadingCompartilhamento = false
      }
    },
    abrirSwalCompartilhamento(opcoes = {}) {
      const customClassEntrada = opcoes?.customClass || {}
      const didOpenEntrada = opcoes?.didOpen

      return Swal.fire({
        ...opcoes,
        heightAuto: false,
        backdrop: true,
        customClass: {
          ...customClassEntrada,
          container: `swal-share-modal ${customClassEntrada.container || ''}`.trim()
        },
        didOpen: (popup) => {
          const container = popup?.closest?.('.swal2-container')
          if (container) {
            container.style.zIndex = '7000'
          }
          if (typeof didOpenEntrada === 'function') {
            didOpenEntrada(popup)
          }
        }
      })
    },
    async gerarArquivoCompartilhamento() {
      const blob = await this.gerarImagemResultadoBlob()
      const arquivoNome = `resultado-partida-${this.partidaIdNormalizado || 'quadraplay'}.jpg`
      const arquivo = new File([blob], arquivoNome, { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      setTimeout(() => URL.revokeObjectURL(url), 60_000)

      return {
        arquivo,
        arquivoNome,
        url,
        texto: this.montarTextoCompartilhamento()
      }
    },
    montarTextoCompartilhamento() {
      const partida = this.partidaDetalhada || {}
      const timeA = partida.timeA?.nome || 'Time A'
      const timeB = partida.timeB?.nome || 'Time B'
      const resultado = this.isPartidaAgendada
        ? 'x'
        : `${partida.pontosTimeA ?? 0} x ${partida.pontosTimeB ?? 0}`
      const status = this.statusLabel(partida)
      const campeonato = partida.campeonato?.nome || 'Campeonato'
      const quadra = partida.quadra?.nome || 'Quadra'

      return `${timeA} ${resultado} ${timeB} | ${status} | ${campeonato} | ${quadra}`
    },
    baixarImagemCompartilhamento(url, arquivoNome) {
      if (!url) return

      const link = document.createElement('a')
      link.href = url
      link.download = arquivoNome || 'resultado-partida.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    carregarImagemCanvas(url) {
      return new Promise((resolve) => {
        const src = String(url || '').trim()
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
          imagem.crossOrigin = 'anonymous'
        }
        imagem.decoding = 'async'
        imagem.onload = () => finalizar(imagem)
        imagem.onerror = () => finalizar(null)
        imagem.src = src
      })
    },
    async carregarImagemCanvasComFallback(urlPrincipal, urlFallback = '') {
      const imagemPrincipal = await this.carregarImagemCanvas(urlPrincipal)
      if (imagemPrincipal) return imagemPrincipal

      const fallback = String(urlFallback || '').trim()
      if (!fallback || fallback === String(urlPrincipal || '').trim()) {
        return null
      }

      return this.carregarImagemCanvas(fallback)
    },
    normalizarUrlImagemAbsoluta(url) {
      const src = String(url || '').trim()
      if (!src) return ''
      if (/^(data:|blob:)/i.test(src)) return src
      if (/^https?:\/\//i.test(src)) return src
      if (/^\/?(assets|img|images)\//i.test(src)) return src

      const baseApi = String(api?.defaults?.baseURL || '').trim().replace(/\/+$/, '')
      if (!baseApi) return src

      if (/^\/uploads\//i.test(src)) return `${baseApi}${src}`
      if (/^uploads\//i.test(src)) return `${baseApi}/${src}`
      return src
    },
    obterFotoTimeCanvas(foto) {
      const fotoNormalizada = obterFotoTime(foto)
      const urlAbsoluta = this.normalizarUrlImagemAbsoluta(fotoNormalizada)

      if (!/^https?:\/\//i.test(urlAbsoluta)) {
        return {
          principal: urlAbsoluta,
          fallback: urlAbsoluta
        }
      }

      const baseApi = String(api?.defaults?.baseURL || '').trim().replace(/\/+$/, '')
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
    quebrarTexto(ctx, texto, larguraMaxima) {
      const palavras = String(texto || '').trim().split(/\s+/).filter(Boolean)
      if (!palavras.length) return []

      const linhas = []
      let linhaAtual = palavras[0]

      for (let i = 1; i < palavras.length; i += 1) {
        const tentativa = `${linhaAtual} ${palavras[i]}`
        if (ctx.measureText(tentativa).width <= larguraMaxima) {
          linhaAtual = tentativa
        } else {
          linhas.push(linhaAtual)
          linhaAtual = palavras[i]
        }
      }

      linhas.push(linhaAtual)
      return linhas
    },
    obterSiglaTime(nome) {
      const partes = String(nome || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)

      if (!partes.length) return '--'
      if (partes.length === 1) return partes[0].slice(0, 3).toUpperCase()
      return partes.slice(0, 3).map(parte => parte.charAt(0).toUpperCase()).join('')
    },
    desenharAvatarTimeCanvas(ctx, imagem, x, y, raio, nomeTime, corFallback) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, raio, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      if (imagem) {
        ctx.drawImage(imagem, x - raio, y - raio, raio * 2, raio * 2)
      } else {
        const gradiente = ctx.createLinearGradient(x - raio, y - raio, x + raio, y + raio)
        gradiente.addColorStop(0, corFallback)
        gradiente.addColorStop(1, '#ffffff')
        ctx.fillStyle = gradiente
        ctx.fillRect(x - raio, y - raio, raio * 2, raio * 2)

        ctx.fillStyle = '#0f172a'
        ctx.font = `800 ${Math.max(28, Math.round(raio * 0.7))}px Montserrat, Arial, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(this.obterSiglaTime(nomeTime), x, y + 2)
      }
      ctx.restore()

      ctx.beginPath()
      ctx.arc(x, y, raio, 0, Math.PI * 2)
      ctx.lineWidth = 6
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.stroke()
    },
    desenharNomeCompletoTime(ctx, nome, x, yInicial, larguraMaxima) {
      const nomeCompleto = String(nome || '').trim() || 'Time'
      let tamanhoFonte = 40
      let linhas = []

      while (tamanhoFonte >= 22) {
        ctx.font = `700 ${tamanhoFonte}px Montserrat, Arial, sans-serif`
        linhas = this.quebrarTexto(ctx, nomeCompleto, larguraMaxima)
        if (linhas.length <= 4) break
        tamanhoFonte -= 2
      }

      const alturaLinha = Math.round(tamanhoFonte * 1.18)
      linhas.forEach((linha, indice) => {
        ctx.fillText(linha, x, yInicial + indice * alturaLinha)
      })

      return linhas.length
    },
    async gerarImagemResultadoBlob() {
      const partida = this.partidaDetalhada || {}
      const largura = 1536
      const altura = 1097
      const canvas = document.createElement('canvas')
      canvas.width = largura
      canvas.height = altura
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Não foi possível iniciar o canvas de compartilhamento')
      }

      const centroX = largura / 2
      const centroY = altura / 2
      const campeonatoNome = String(partida.campeonato?.nome || 'Campeonato').trim() || 'Campeonato'
      const quadraNome = String(partida.quadra?.nome || 'Quadra').trim() || 'Quadra'
      const dataPartidaRef = new Date(partida?.data || partida?.createdAt)
      const dataPartidaTexto = Number.isNaN(dataPartidaRef.getTime())
        ? '-'
        : dataPartidaRef.toLocaleDateString('pt-BR')
      const statusPartidaTexto = String(this.statusLabel(partida) || '').trim().toUpperCase()
      const statusExibicaoPartida = obterStatusExibicaoPartida(partida)
      const isPartidaEmAndamentoCanvas = String(statusExibicaoPartida || '').toUpperCase() === 'EM_ANDAMENTO'
      const topoInfoQuadraData = quadraNome
      const timeANome = String(partida.timeA?.nome || 'Time A').trim() || 'Time A'
      const timeBNome = String(partida.timeB?.nome || 'Time B').trim() || 'Time B'
      const placarA = this.isPartidaAgendada ? '-' : String(partida.pontosTimeA ?? 0)
      const placarB = this.isPartidaAgendada ? '-' : String(partida.pontosTimeB ?? 0)
      const artilheiroA = this.obterJogadorDestaqueCanvas(partida.timeA?.id)
      const artilheiroB = this.obterJogadorDestaqueCanvas(partida.timeB?.id)

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      const gradienteCeu = ctx.createLinearGradient(0, 0, 0, altura)
      gradienteCeu.addColorStop(0, '#06113e')
      gradienteCeu.addColorStop(0.42, '#0b1f67')
      gradienteCeu.addColorStop(1, '#0a163f')
      ctx.fillStyle = gradienteCeu
      ctx.fillRect(0, 0, largura, altura)

      const brilhoCentral = ctx.createRadialGradient(centroX, centroY + 40, 80, centroX, centroY + 40, 760)
      brilhoCentral.addColorStop(0, 'rgba(96, 165, 250, 0.28)')
      brilhoCentral.addColorStop(1, 'rgba(96, 165, 250, 0)')
      ctx.fillStyle = brilhoCentral
      ctx.fillRect(0, 0, largura, altura)

      const brilhoEsquerdo = ctx.createRadialGradient(210, 640, 50, 210, 640, 430)
      brilhoEsquerdo.addColorStop(0, 'rgba(59, 130, 246, 0.42)')
      brilhoEsquerdo.addColorStop(1, 'rgba(59, 130, 246, 0)')
      ctx.fillStyle = brilhoEsquerdo
      ctx.fillRect(0, 0, largura, altura)

      const brilhoDireito = ctx.createRadialGradient(largura - 210, 640, 40, largura - 210, 640, 420)
      brilhoDireito.addColorStop(0, 'rgba(239, 68, 68, 0.4)')
      brilhoDireito.addColorStop(1, 'rgba(239, 68, 68, 0)')
      ctx.fillStyle = brilhoDireito
      ctx.fillRect(0, 0, largura, altura)

      const desenharLuzesLaterais = (xInicial, xFinal, yBase, corPrincipal, invertido = false) => {
        const total = 22
        for (let i = 0; i < total; i += 1) {
          const frac = i / (total - 1)
          const x = xInicial + (xFinal - xInicial) * frac
          const y = yBase + Math.sin(frac * Math.PI) * 76
          const raio = 10 + frac * 8
          const alpha = 0.08 + frac * 0.45
          const gradiente = ctx.createRadialGradient(x, y, 1, x, y, raio * 2.6)
          gradiente.addColorStop(0, `rgba(${corPrincipal}, ${alpha.toFixed(3)})`)
          gradiente.addColorStop(1, `rgba(${corPrincipal}, 0)`)
          ctx.fillStyle = gradiente
          ctx.beginPath()
          ctx.arc(x, y, raio * (invertido ? 0.95 : 1), 0, Math.PI * 2)
          ctx.fill()
        }
      }

      desenharLuzesLaterais(0, 430, 570, '96, 165, 250')
      desenharLuzesLaterais(largura, largura - 430, 570, '248, 113, 113', true)

      const painelX = 70
      const painelY = 185
      const painelLargura = largura - 140
      const painelAltura = 760

      this.desenharRetanguloArredondado(ctx, painelX, painelY, painelLargura, painelAltura, 46)
      const gradientePainel = ctx.createLinearGradient(painelX, painelY, painelX + painelLargura, painelY + painelAltura)
      gradientePainel.addColorStop(0, 'rgba(9, 33, 105, 0.78)')
      gradientePainel.addColorStop(0.52, 'rgba(12, 28, 85, 0.86)')
      gradientePainel.addColorStop(1, 'rgba(37, 16, 67, 0.78)')
      ctx.fillStyle = gradientePainel
      ctx.fill()

      const painelBrilho = ctx.createLinearGradient(painelX, painelY + 26, painelX + painelLargura, painelY + 26)
      painelBrilho.addColorStop(0, 'rgba(56, 189, 248, 0)')
      painelBrilho.addColorStop(0.26, 'rgba(56, 189, 248, 0.86)')
      painelBrilho.addColorStop(0.52, 'rgba(224, 242, 254, 0.95)')
      painelBrilho.addColorStop(0.78, 'rgba(244, 114, 182, 0.76)')
      painelBrilho.addColorStop(1, 'rgba(244, 114, 182, 0)')

      ctx.strokeStyle = 'rgba(125, 211, 252, 0.55)'
      ctx.lineWidth = 2
      this.desenharRetanguloArredondado(ctx, painelX, painelY, painelLargura, painelAltura, 46)
      ctx.stroke()

      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.font = '700 26px Montserrat, Arial, sans-serif'
      ctx.fillStyle = 'rgba(224, 242, 254, 0.98)'
      const linhasTopoInfo = this.quebrarTexto(ctx, topoInfoQuadraData, 600).slice(0, 2)
      const xTopoInfo = painelX + 34
      const yTopoInfoBase = painelY + 54
      let larguraMaxInfo = 0
      linhasTopoInfo.forEach((linha, indice) => {
        ctx.fillText(linha, xTopoInfo, yTopoInfoBase + (indice * 30))
        larguraMaxInfo = Math.max(larguraMaxInfo, ctx.measureText(linha).width)
      })

      const yTraçoTopo = painelY + 24
      const xTraçoInicio = xTopoInfo + larguraMaxInfo + 24
      const xTraçoFim = painelX + painelLargura - 24
      if (xTraçoFim > xTraçoInicio) {
        const gradienteTopoDireita = ctx.createLinearGradient(xTraçoInicio, yTraçoTopo, xTraçoFim, yTraçoTopo)
        gradienteTopoDireita.addColorStop(0, 'rgba(56, 189, 248, 0.12)')
        gradienteTopoDireita.addColorStop(0.3, 'rgba(56, 189, 248, 0.9)')
        gradienteTopoDireita.addColorStop(0.64, 'rgba(224, 242, 254, 0.95)')
        gradienteTopoDireita.addColorStop(1, 'rgba(244, 114, 182, 0.75)')
        ctx.fillStyle = gradienteTopoDireita
        ctx.fillRect(xTraçoInicio, yTraçoTopo, xTraçoFim - xTraçoInicio, 4)
      }

      const linhaCentral = ctx.createLinearGradient(painelX + 180, 0, painelX + painelLargura - 180, 0)
      linhaCentral.addColorStop(0, 'rgba(125, 211, 252, 0)')
      linhaCentral.addColorStop(0.5, 'rgba(125, 211, 252, 0.85)')
      linhaCentral.addColorStop(1, 'rgba(125, 211, 252, 0)')
      ctx.fillStyle = linhaCentral
      ctx.fillRect(painelX + 160, painelY + 500, painelLargura - 320, 2)

      const fotoTimeAUrl = this.obterFotoTimeCanvas(partida.timeA?.foto)
      const fotoTimeBUrl = this.obterFotoTimeCanvas(partida.timeB?.foto)

      const [fotoTimeA, fotoTimeB, logoMarca, logoPrefeitura] = await Promise.all([
        this.carregarImagemCanvasComFallback(fotoTimeAUrl.principal, fotoTimeAUrl.fallback),
        this.carregarImagemCanvasComFallback(fotoTimeBUrl.principal, fotoTimeBUrl.fallback),
        this.carregarImagemCanvas(logoQuadraPlay),
        this.carregarImagemCanvas(logoPrefeituraSaoVicente)
      ])

      const desenharEscudo = (imagem, x, y, raio, corAro, nomeTime) => {
        ctx.save()
        ctx.shadowColor = corAro
        ctx.shadowBlur = 26
        ctx.beginPath()
        ctx.arc(x, y, raio + 10, 0, Math.PI * 2)
        ctx.strokeStyle = corAro
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.restore()

        ctx.save()
        ctx.beginPath()
        ctx.arc(x, y, raio, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()

        if (imagem) {
          ctx.drawImage(imagem, x - raio, y - raio, raio * 2, raio * 2)
        } else {
          const gradiente = ctx.createLinearGradient(x - raio, y - raio, x + raio, y + raio)
          gradiente.addColorStop(0, corAro)
          gradiente.addColorStop(1, '#ffffff')
          ctx.fillStyle = gradiente
          ctx.fillRect(x - raio, y - raio, raio * 2, raio * 2)
          ctx.fillStyle = '#0f172a'
          ctx.font = `800 ${Math.max(44, Math.round(raio * 0.62))}px Montserrat, Arial, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(this.obterSiglaTime(nomeTime), x, y + 2)
        }
        ctx.restore()

        ctx.beginPath()
        ctx.arc(x, y, raio, 0, Math.PI * 2)
        ctx.lineWidth = 9
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)'
        ctx.stroke()
      }

      if (logoMarca) {
        ctx.drawImage(logoMarca, 48, 24, 84, 84)
      }

      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#f8fafc'
      ctx.font = '700 40px Montserrat, Arial, sans-serif'
      ctx.fillText('QuadraPlaySV', 146, 64)

      if (logoPrefeitura) {
        const alturaLogoPref = 62
        const proporcaoLogoPref = (logoPrefeitura.width / logoPrefeitura.height) || 1
        const larguraLogoPref = Math.min(250, Math.round(alturaLogoPref * proporcaoLogoPref))
        const xLogoPref = largura - larguraLogoPref - 48
        const yLogoPref = 30

        this.desenharRetanguloArredondado(ctx, xLogoPref - 10, yLogoPref - 6, larguraLogoPref + 20, alturaLogoPref + 12, 14)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fill()

        ctx.drawImage(logoPrefeitura, xLogoPref, yLogoPref, larguraLogoPref, alturaLogoPref)
      }

      const xTimeA = painelX + 280
      const xTimeB = largura - (painelX + 280)
      const yEscudo = painelY + 260
      const raioEscudo = 130

      desenharEscudo(fotoTimeA, xTimeA, yEscudo, raioEscudo, 'rgba(56, 189, 248, 0.9)', timeANome)
      desenharEscudo(fotoTimeB, xTimeB, yEscudo, raioEscudo, 'rgba(248, 113, 113, 0.9)', timeBNome)

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const obterCoresStatus = (statusExibicao) => {
        if (statusExibicao === 'EM_ANDAMENTO') {
          return {
            fundo: 'rgba(22, 163, 74, 0.12)',
            borda: 'rgba(22, 163, 74, 0.35)',
            texto: '#16a34a'
          }
        }

        if (statusExibicao === 'FINALIZADA') {
          return {
            fundo: 'rgba(189, 28, 28, 0.12)',
            borda: 'rgba(189, 28, 28, 0.35)',
            texto: '#bd1c1c'
          }
        }

        if (statusExibicao === 'CANCELADA') {
          return {
            fundo: 'rgba(220, 38, 38, 0.1)',
            borda: 'rgba(220, 38, 38, 0.35)',
            texto: '#dc2626'
          }
        }

        if (['AGENDADA', 'AGENDADA_HOJE', 'ADIADA'].includes(String(statusExibicao || '').toUpperCase())) {
          return {
            fundo: '#f59e0b',
            borda: '#fbbf24',
            texto: '#ffffff'
          }
        }

        return {
          fundo: 'rgba(37, 99, 235, 0.1)',
          borda: 'rgba(37, 99, 235, 0.35)',
          texto: '#2563eb'
        }
      }

      if (statusPartidaTexto) {
        const statusCores = obterCoresStatus(statusExibicaoPartida)
        const yStatus = painelY + 132
        const yDataCentro = painelY + 194
        const alturaBadgeStatus = 52

        ctx.font = '800 34px Montserrat, Arial, sans-serif'
        const larguraTextoStatus = ctx.measureText(statusPartidaTexto).width
        const larguraBadgeStatus = Math.max(260, larguraTextoStatus + 54)
        const xBadgeStatus = centroX - (larguraBadgeStatus / 2)
        const yBadgeStatus = yStatus - (alturaBadgeStatus / 2)

        this.desenharRetanguloArredondado(
          ctx,
          xBadgeStatus,
          yBadgeStatus,
          larguraBadgeStatus,
          alturaBadgeStatus,
          999
        )
        ctx.fillStyle = statusCores.fundo
        ctx.fill()

        ctx.strokeStyle = statusCores.borda
        ctx.lineWidth = 2
        this.desenharRetanguloArredondado(
          ctx,
          xBadgeStatus,
          yBadgeStatus,
          larguraBadgeStatus,
          alturaBadgeStatus,
          999
        )
        ctx.stroke()

        ctx.fillStyle = statusCores.texto
        ctx.fillText(statusPartidaTexto, centroX, yStatus + 1)

        if (!isPartidaEmAndamentoCanvas && dataPartidaTexto && dataPartidaTexto !== '-') {
          ctx.font = '900 52px Montserrat, Arial, sans-serif'
          ctx.fillStyle = '#38bdf8'
          ctx.fillText(dataPartidaTexto, centroX, yDataCentro)
        }
      }

      ctx.font = '900 220px Montserrat, Arial, sans-serif'
      ctx.fillStyle = '#f8fafc'
      ctx.fillText(placarA, centroX - 170, painelY + 300)
      ctx.font = '900 132px Montserrat, Arial, sans-serif'
      ctx.fillStyle = '#38bdf8'
      ctx.fillText('X', centroX, painelY + 303)
      ctx.font = '900 220px Montserrat, Arial, sans-serif'
      ctx.fillStyle = '#f8fafc'
      ctx.fillText(placarB, centroX + 170, painelY + 300)

      const desenharNomeTime = (nome, x, y, larguraMaxima) => {
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = '#f8fafc'
        let tamanho = 76
        let linhas = []

        while (tamanho >= 42) {
          ctx.font = `700 ${tamanho}px Montserrat, Arial, sans-serif`
          linhas = this.quebrarTexto(ctx, nome, larguraMaxima).slice(0, 2)
          if (linhas.length <= 2) break
          tamanho -= 4
        }

        const alturaLinha = Math.round(tamanho * 1.04)
        linhas.forEach((linha, indice) => {
          ctx.fillText(linha, x, y + indice * alturaLinha)
        })
        return y + (linhas.length - 1) * alturaLinha
      }

      const yNomeBase = painelY + 468
      const yNomeA = desenharNomeTime(timeANome, xTimeA, yNomeBase, 470)
      const yNomeB = desenharNomeTime(timeBNome, xTimeB, yNomeBase, 470)
      const yDestaque = Math.max(yNomeA, yNomeB) + 70

      const desenharDestaque = (texto, x, corNumero) => {
        if (!texto) return
        const textoLimpo = String(texto).trim()
        if (!textoLimpo) return

        const partes = textoLimpo.split(/\s+/)
        const primeira = partes[0] || ''
        const restante = partes.slice(1).join(' ')
        const numeroEhTag = /^#?\d+$/i.test(primeira)
        const numeroTexto = numeroEhTag ? primeira.replace('#', '') : ''
        const nomeTexto = numeroEhTag ? restante : textoLimpo

        const numeroFonte = '700 52px Montserrat, Arial, sans-serif'
        const nomeFonte = '600 52px Montserrat, Arial, sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'

        let larguraNumero = 0
        if (numeroTexto) {
          ctx.font = numeroFonte
          larguraNumero = ctx.measureText(numeroTexto).width
        }
        ctx.font = nomeFonte
        const larguraNome = ctx.measureText(nomeTexto).width
        const larguraGap = numeroTexto && nomeTexto ? 18 : 0
        const larguraTotal = larguraNumero + larguraGap + larguraNome
        const xInicial = x - (larguraTotal / 2)

        let cursor = xInicial
        if (numeroTexto) {
          ctx.font = numeroFonte
          ctx.fillStyle = corNumero
          ctx.fillText(numeroTexto, cursor, yDestaque)
          cursor += larguraNumero + larguraGap
        }

        if (nomeTexto) {
          ctx.font = nomeFonte
          ctx.fillStyle = '#e2e8f0'
          ctx.fillText(nomeTexto, cursor, yDestaque)
        }
      }

      desenharDestaque(artilheiroA, xTimeA, '#38bdf8')
      desenharDestaque(artilheiroB, xTimeB, '#fb7185')

      const yLinhasCamp = painelY + painelAltura - 132
      const esquerdaGrad = ctx.createLinearGradient(painelX + 120, 0, centroX - 300, 0)
      esquerdaGrad.addColorStop(0, 'rgba(56, 189, 248, 0)')
      esquerdaGrad.addColorStop(1, 'rgba(56, 189, 248, 0.95)')
      ctx.strokeStyle = esquerdaGrad
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(painelX + 150, yLinhasCamp)
      ctx.lineTo(centroX - 210, yLinhasCamp)
      ctx.stroke()

      const direitaGrad = ctx.createLinearGradient(centroX + 300, 0, painelX + painelLargura - 120, 0)
      direitaGrad.addColorStop(0, 'rgba(248, 113, 113, 0.95)')
      direitaGrad.addColorStop(1, 'rgba(248, 113, 113, 0)')
      ctx.strokeStyle = direitaGrad
      ctx.beginPath()
      ctx.moveTo(centroX + 210, yLinhasCamp)
      ctx.lineTo(painelX + painelLargura - 150, yLinhasCamp)
      ctx.stroke()

      const textoCampeonato = `CAMPEONATO ${campeonatoNome.toUpperCase()}`
      const desenharTextoEspacado = (texto, x, y, espacamento) => {
        const caracteres = Array.from(String(texto || ''))
        let larguraTotal = 0
        caracteres.forEach((char, indice) => {
          larguraTotal += ctx.measureText(char).width
          if (indice < caracteres.length - 1) larguraTotal += espacamento
        })
        let cursor = x - (larguraTotal / 2)
        caracteres.forEach((char, indice) => {
          ctx.fillText(char, cursor, y)
          cursor += ctx.measureText(char).width
          if (indice < caracteres.length - 1) cursor += espacamento
        })
      }

      ctx.fillStyle = '#e2e8f0'
      ctx.font = '600 56px Montserrat, Arial, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      desenharTextoEspacado(textoCampeonato, centroX, painelY + painelAltura - 76, 5.2)

      const brilhoBordaInferior = ctx.createLinearGradient(painelX + 120, 0, painelX + painelLargura - 120, 0)
      brilhoBordaInferior.addColorStop(0, 'rgba(56, 189, 248, 0)')
      brilhoBordaInferior.addColorStop(0.5, 'rgba(56, 189, 248, 0.95)')
      brilhoBordaInferior.addColorStop(1, 'rgba(56, 189, 248, 0)')
      ctx.fillStyle = brilhoBordaInferior
      ctx.fillRect(painelX + 84, painelY + painelAltura - 4, painelLargura - 168, 3)

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((arquivo) => {
          if (arquivo) resolve(arquivo)
          else reject(new Error('Falha ao gerar imagem da partida'))
        }, 'image/jpeg', 0.92)
      })

      return blob
    },
    obterJogadorDestaqueCanvas(timeId) {
      const id = Number(timeId)
      if (!Number.isFinite(id) || id <= 0) return ''

      const jogadores = Array.isArray(this.partidaDetalhada?.jogadoresPartida)
        ? this.partidaDetalhada.jogadoresPartida
        : []

      const candidatos = jogadores
        .filter(jp => Number(jp?.timeId) === id && this.temGols(jp))
        .sort((a, b) => this.valorPositivo(b?.gols) - this.valorPositivo(a?.gols))

      const principal = candidatos[0]
      if (!principal) return ''

      const nome = String(principal?.jogador?.nome || '').trim()
      if (!nome) return ''

      const numero = this.temNumeroJogador(principal?.jogador?.numero)
        ? String(Number(principal.jogador.numero))
        : ''

      return numero ? `${numero} ${nome}` : nome
    },
    formatarDataPartida(data) {
      const dt = new Date(data)
      if (Number.isNaN(dt.getTime())) return '-'

      const diaSemana = dt.toLocaleDateString('pt-BR', { weekday: 'long' })
      const dataFormatada = dt.toLocaleDateString('pt-BR')
      const diaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)

      return `${diaCapitalizado} - ${dataFormatada}`
    },
    listarNomesGoleadores(jogadoresPartida) {
      const nomes = [...new Set((Array.isArray(jogadoresPartida) ? jogadoresPartida : [])
        .filter(j => this.temGols(j))
        .map(j => String(j?.jogador?.nome || '').trim())
        .filter(Boolean))]
      return nomes.join(' • ')
    },
    obterGoleadoresComQuantidade(timeId) {
      const id = Number(timeId)
      if (!Number.isFinite(id) || id <= 0) return []

      const mapa = new Map()
      const jogadores = Array.isArray(this.partidaDetalhada?.jogadoresPartida)
        ? this.partidaDetalhada.jogadoresPartida
        : []

      jogadores.forEach((jp) => {
        if (Number(jp?.timeId) !== id) return
        const gols = this.valorPositivo(jp?.gols)
        if (!gols) return

        const nome = String(jp?.jogador?.nome || '').trim()
        if (!nome) return

        mapa.set(nome, (mapa.get(nome) || 0) + gols)
      })

      return Array.from(mapa.entries()).map(([nome, gols]) => (
        gols > 1 ? `${nome} (${gols})` : nome
      ))
    },
    obterLinhasGoleadoresCanvas() {
      const partida = this.partidaDetalhada || {}
      const nomeTimeA = String(partida?.timeA?.nome || 'Time A').trim()
      const nomeTimeB = String(partida?.timeB?.nome || 'Time B').trim()

      const goleadoresA = this.obterGoleadoresComQuantidade(partida?.timeA?.id)
      const goleadoresB = this.obterGoleadoresComQuantidade(partida?.timeB?.id)
      const linhas = []

      if (goleadoresA.length > 0) {
        linhas.push(`${nomeTimeA}: ${goleadoresA.join(', ')}`)
      }

      if (goleadoresB.length > 0) {
        linhas.push(`${nomeTimeB}: ${goleadoresB.join(', ')}`)
      }

      return linhas
    },
    valorPositivo(valor) {
      const numero = Number(valor)
      return Number.isFinite(numero) && numero > 0 ? numero : 0
    },
    temGols(jogadorPartida) {
      return this.valorPositivo(jogadorPartida?.gols) > 0
    },
    temCartaoAmarelo(jogadorPartida) {
      return this.valorPositivo(jogadorPartida?.cartoesAmarelos) > 0
    },
    temCartaoVermelho(jogadorPartida) {
      return this.valorPositivo(jogadorPartida?.cartoesVermelhos) > 0
    },
    temNumeroJogador(numero) {
      const numeroNormalizado = Number(numero)
      return Number.isInteger(numeroNormalizado) && numeroNormalizado > 0
    },
    jogadorSuspenso(jogadorPartida) {
      return !!jogadorPartida?.suspenso
    },
    temEstatisticas(jogadorPartida) {
      return this.temGols(jogadorPartida) ||
        this.temCartaoAmarelo(jogadorPartida) ||
        this.temCartaoVermelho(jogadorPartida)
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 84px 16px 16px;
  overflow-y: auto;
  z-index: 3000;
}

.modal-partida {
  --modal-surface-accent: rgba(59, 130, 246, 0.18);
  --modal-surface-end: #f5f9ff;
  --modal-border-color: rgba(59, 130, 246, 0.24);
  --modal-title-color: #245ec8;
  --modal-close-border: rgba(59, 130, 246, 0.55);
  --modal-close-color: #3b82f6;
  --modal-close-hover-bg: rgba(59, 130, 246, 0.08);
  --modal-close-hover-border: rgba(59, 130, 246, 0.35);
  --modal-close-hover-color: #2563eb;
  --modal-heading-color: #245ec8;
  --modal-info-color: #4b5563;
  --modal-quadra-color: #1f2937;
  --modal-team-color: #0f2f70;
  --modal-goleadores-color: #7e7e7e;
  --modal-image-border: #dbeafe;
  --modal-result-color: #2c62c7;
  --modal-date-color: #1d4ed8;
  --modal-player-box-border: rgba(148, 163, 184, 0.28);
  --modal-player-box-bg: rgba(255, 255, 255, 0.96);
  --modal-empty-color: #64748b;
  --modal-number-border: #93c5fd;
  --modal-number-bg: #eff6ff;
  --modal-number-color: #1d4ed8;
  --modal-footer-bg: linear-gradient(100deg, #12265f 0%, #1a3d90 58%, #2c66ef 100%);
  --modal-footer-divider: rgba(191, 219, 254, 0.45);
  --modal-share-bg: linear-gradient(135deg, #0e2160 0%, #163780 52%, #244db1 100%);
  --modal-share-border: rgba(96, 165, 250, 0.34);
  --modal-share-hover-shadow: rgba(37, 99, 235, 0.34);
  background:
    radial-gradient(120% 75% at 50% 100%, var(--modal-surface-accent) 0%, rgba(59, 130, 246, 0) 70%),
    linear-gradient(180deg, #ffffff 0%, var(--modal-surface-end) 100%);
  border: 1px solid var(--modal-border-color);
  border-radius: 24px;
  padding: 20px;
  width: min(760px, 100%);
  min-width: 0;
  max-width: 100%;
  max-height: calc(100dvh - 100px);
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  box-shadow: 0 26px 60px rgba(15, 23, 42, 0.28);
}

.modal-partida.partida-finalizada,
.modal-partida.partida-cancelada {
  --modal-surface-accent: rgba(248, 113, 113, 0.16);
  --modal-surface-end: #fff5f5;
  --modal-border-color: rgba(220, 38, 38, 0.28);
  --modal-title-color: #b91c1c;
  --modal-close-border: rgba(248, 113, 113, 0.58);
  --modal-close-color: #dc2626;
  --modal-close-hover-bg: rgba(239, 68, 68, 0.12);
  --modal-close-hover-border: rgba(220, 38, 38, 0.35);
  --modal-close-hover-color: #b91c1c;
  --modal-heading-color: #b91c1c;
  --modal-info-color: #7c2d12;
  --modal-quadra-color: #7f1d1d;
  --modal-team-color: #991b1b;
  --modal-goleadores-color: #b45309;
  --modal-image-border: #fecaca;
  --modal-result-color: #dc2626;
  --modal-date-color: #b91c1c;
  --modal-player-box-border: rgba(248, 113, 113, 0.3);
  --modal-player-box-bg: linear-gradient(180deg, rgba(254, 242, 242, 0.92), rgba(255, 255, 255, 0.98));
  --modal-empty-color: #991b1b;
  --modal-number-border: #fca5a5;
  --modal-number-bg: #fef2f2;
  --modal-number-color: #b91c1c;
  --modal-footer-bg: linear-gradient(100deg, #6f1212 0%, #991b1b 54%, #dc2626 100%);
  --modal-footer-divider: rgba(254, 202, 202, 0.5);
  --modal-share-bg: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 56%, #ef4444 100%);
  --modal-share-border: rgba(254, 202, 202, 0.34);
  --modal-share-hover-shadow: rgba(220, 38, 38, 0.32);
}

.modal-partida.partida-agendada {
  --modal-surface-accent: rgba(251, 191, 36, 0.18);
  --modal-surface-end: #fffaf0;
  --modal-border-color: rgba(245, 158, 11, 0.3);
  --modal-title-color: #b45309;
  --modal-close-border: rgba(245, 158, 11, 0.5);
  --modal-close-color: #d97706;
  --modal-close-hover-bg: rgba(245, 158, 11, 0.12);
  --modal-close-hover-border: rgba(217, 119, 6, 0.35);
  --modal-close-hover-color: #b45309;
  --modal-heading-color: #b45309;
  --modal-info-color: #92400e;
  --modal-quadra-color: #78350f;
  --modal-team-color: #92400e;
  --modal-goleadores-color: #a16207;
  --modal-image-border: #fde68a;
  --modal-result-color: #d97706;
  --modal-date-color: #b45309;
  --modal-player-box-border: rgba(245, 158, 11, 0.24);
  --modal-player-box-bg: linear-gradient(180deg, rgba(255, 251, 235, 0.94), rgba(255, 255, 255, 0.98));
  --modal-empty-color: #b45309;
  --modal-number-border: #fcd34d;
  --modal-number-bg: #fffbeb;
  --modal-number-color: #b45309;
  --modal-footer-bg: linear-gradient(100deg, #92400e 0%, #b45309 54%, #f59e0b 100%);
  --modal-footer-divider: rgba(253, 230, 138, 0.45);
  --modal-share-bg: linear-gradient(135deg, #78350f 0%, #b45309 52%, #f59e0b 100%);
  --modal-share-border: rgba(252, 211, 77, 0.34);
  --modal-share-hover-shadow: rgba(245, 158, 11, 0.3);
}

.modal-partida.partida-andamento {
  --modal-surface-accent: rgba(34, 197, 94, 0.16);
  --modal-surface-end: #f2fff6;
  --modal-border-color: rgba(22, 163, 74, 0.28);
  --modal-title-color: #15803d;
  --modal-close-border: rgba(34, 197, 94, 0.52);
  --modal-close-color: #16a34a;
  --modal-close-hover-bg: rgba(34, 197, 94, 0.12);
  --modal-close-hover-border: rgba(22, 163, 74, 0.35);
  --modal-close-hover-color: #15803d;
  --modal-heading-color: #15803d;
  --modal-info-color: #166534;
  --modal-quadra-color: #14532d;
  --modal-team-color: #166534;
  --modal-goleadores-color: #4d7c0f;
  --modal-image-border: #86efac;
  --modal-result-color: #16a34a;
  --modal-date-color: #15803d;
  --modal-player-box-border: rgba(34, 197, 94, 0.28);
  --modal-player-box-bg: linear-gradient(180deg, rgba(240, 253, 244, 0.94), rgba(255, 255, 255, 0.98));
  --modal-empty-color: #166534;
  --modal-number-border: #86efac;
  --modal-number-bg: #f0fdf4;
  --modal-number-color: #15803d;
  --modal-footer-bg: linear-gradient(100deg, #14532d 0%, #166534 54%, #16a34a 100%);
  --modal-footer-divider: rgba(187, 247, 208, 0.48);
  --modal-share-bg: linear-gradient(135deg, #14532d 0%, #166534 52%, #16a34a 100%);
  --modal-share-border: rgba(134, 239, 172, 0.34);
  --modal-share-hover-shadow: rgba(22, 163, 74, 0.3);
}

.conteudo-partida {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-partida {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.titulo-partida {
  font-size: clamp(24px, 2.7vw, 36px);
  line-height: 1.1;
  color: var(--modal-title-color);
  margin: 0;
  letter-spacing: -0.03em;
  font-weight: 800;
  word-break: break-word;
}

.btn-close-x {
  width: 36px;
  height: 36px;
  border: 1px solid var(--modal-close-border);
  border-radius: 999px;
  background: #fff;
  color: var(--modal-close-color);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  flex: 0 0 auto;
  margin-top: 2px;
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.btn-close-x:hover {
  background: var(--modal-close-hover-bg);
  border-color: var(--modal-close-hover-border);
  color: var(--modal-close-hover-color);
  transform: translateY(-1px);
}

.placar-modal {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 14px;
  margin: 8px 0 12px;
}

.time-mobile-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--modal-heading-color);
}

.placar-modal .time {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #374151;
  min-width: 0;
}

.goleadores-linha {
  margin: 0;
  width: 100%;
  color: var(--modal-goleadores-color);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;   
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.placar-modal img {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--modal-image-border);
  box-shadow: 0 8px 14px rgba(15, 23, 42, 0.14);
}

.placar-modal .time strong {
  font-size: 24px;
  line-height: 1.1;
  color: var(--modal-team-color);
}

.resultado {
  font-size: clamp(40px, 5.4vw, 74px);
  font-weight: 800;
  color: var(--modal-result-color);
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1;
}

.resultado-agendada {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.status-badge-central {
  margin-bottom: 2px;
}

.data-partida-destaque {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--modal-date-color);
  font-size: clamp(20px, 2.3vw, 30px);
  font-weight: 900;
  letter-spacing: 0.6px;
  white-space: nowrap;
  box-shadow: none;
}

.infos {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.infos p {
  margin: 0;
  color: var(--modal-info-color);
  font-size: 14px;
}

.faltas-linha {
  font-weight: 700;
}

.quadra-linha {
  font-weight: 700;
  color: var(--modal-quadra-color);
}

.loader {
  border: 6px solid #f3f3f3;
  border-top: 6px solid #3b82f6;
  border-radius: 50%;
  width: 90px;
  height: 90px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.jogadores-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  max-height: 190px;
  overflow-y: auto;
  padding-right: 4px;
}

.jogadores-time {
  border: 1px solid var(--modal-player-box-border);
  border-radius: 16px;
  padding: 8px;
  background: var(--modal-player-box-bg);
  min-height: 74px;
}

.sem-escalacao {
  margin: 4px 0;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--modal-empty-color);
}

.jogador-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  box-sizing: border-box;
}

.jogador-item.jogador-suspenso {
  background: #fff1f2;
}

.jogador-item:last-child {
  border-bottom: none;
}

.foto-jogador {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #ccc;
}

.dados-jogador {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.nome {
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 190px;
}

.numero-jogador {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--modal-number-border);
  background: var(--modal-number-bg);
  color: var(--modal-number-color);
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
  flex-shrink: 0;
}

.nome.nome-suspenso {
  color: #b91c1c;
}

.status-suspenso {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #fca5a5;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 11px;
  font-weight: 700;
}

.estatisticas {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 0;
  flex-shrink: 0;
}

.estat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  line-height: 1;
  font-weight: 700;
}

.estat-icon {
  width: 16px;
  height: 16px;
  display: block;
}

.estat-valor {
  font-size: 13px;
}

.gols {
  color: #1e3a8a;
}

.cartao {
  color: #64748b;
}

.cartao.amarelo {
  color: #ca8a04;
}

.cartao.vermelho {
  color: #dc2626;
}

.acoes-modal {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 12px;
  margin-left: -20px;
  margin-right: -20px;
  margin-bottom: -20px;
  padding: 22px 18px 14px;
  border: 0;
  border-radius: 0 0 24px 24px;
  background: var(--modal-footer-bg);
  clip-path: polygon(0 22px, 40px 0, calc(100% - 40px) 0, 100% 22px, 100% 100%, 0 100%);
  overflow: hidden;
}

.acoes-modal::before {
  content: '';
  position: absolute;
  left: 28px;
  right: 28px;
  top: 10px;
  height: 1px;
  background: var(--modal-footer-divider);
}

.btn-compartilhar {
  background: var(--modal-share-bg);
  color: #ffffff;
  border: 1px solid var(--modal-share-border);
  border-radius: 999px;
  cursor: pointer;
  min-height: 48px;
  min-width: min(300px, 100%);
  margin-top: 2px;
  font-size: 20px;
  font-weight: 700;
  padding: 0 20px;
  box-shadow: 0 10px 22px rgba(12, 26, 72, 0.42);
  transition: transform 0.15s ease, box-shadow 0.18s ease, opacity 0.2s ease;
  position: relative;
  z-index: 1;
}

.btn-compartilhar:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px var(--modal-share-hover-shadow);
}

.btn-compartilhar:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-compartilhar-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-compartilhar-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #ffffff;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

.btn-compartilhar-icon {
  width: 18px;
  height: 18px;
}

:deep(.swal2-container.swal-share-modal) {
  z-index: 7000 !important;
}

:deep(.swal2-container.swal-share-modal .swal2-popup) {
  border-radius: 16px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 12px;
  text-transform: uppercase;
}

.status-badge.status-andamento {
  color: #16a34a;
  background: rgba(22, 163, 74, 0.12);
  border: 1px solid rgba(22, 163, 74, 0.35);
}

.status-badge.status-finalizada {
  color: #bd1c1c;
  background: rgba(189, 28, 28, 0.12);
  border: 1px solid rgba(189, 28, 28, 0.35);
}

.status-badge.status-agendada {
  color: #a16207;
  background: rgba(234, 179, 8, 0.14);
  border: 1px solid rgba(234, 179, 8, 0.45);
}

.status-badge.status-cancelada {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.35);
}

.status-live-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #22c55e;
  display: inline-block;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  animation: statusDotPulse 1s infinite;
}

@keyframes statusDotPulse {
  0% {
    transform: scale(0.9);
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }

  70% {
    transform: scale(1.2);
    opacity: 0.7;
    box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
  }

  100% {
    transform: scale(0.9);
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    align-items: flex-start;
    padding: 84px 10px 10px;
    overflow-y: auto;
  }

  .modal-partida {
    width: min(100%, 100vw - 20px);
    min-width: 0;
    max-width: 100%;
    max-height: calc(100dvh - 94px);
    overflow-y: auto;
    padding: 16px;
    border-radius: 16px;
  }

  .header-partida {
    align-items: flex-start;
    gap: 10px;
  }

  .titulo-partida {
    text-align: left;
    font-size: clamp(24px, 7vw, 30px);
    line-height: 1.08;
  }

  .btn-close-x {
    width: 38px;
    height: 38px;
    font-size: 20px;
    margin-top: -4px;
  }

  .placar-modal {
    grid-template-columns: 1fr auto 1fr;
    gap: 10px;
    text-align: center;
    margin-top: 8px;
  }

  .placar-modal .time {
    font-size: 13px;
  }

  .placar-modal .time strong {
    font-size: 22px;
  }

  .goleadores-linha {
    font-size: 11px;
    max-width: 120px;
  }

  .placar-modal img {
    width: 52px;
    height: 52px;
  }

  .resultado {
    font-size: clamp(30px, 8vw, 38px);
  }

  .data-partida-destaque {
    font-size: 17px;
    padding: 0;
  }

  .acoes-modal {
    margin-top: 10px;
    margin-left: -16px;
    margin-right: -16px;
    margin-bottom: -16px;
    padding: 16px 10px 12px;
    border-radius: 0 0 16px 16px;
    clip-path: polygon(0 14px, 22px 0, calc(100% - 22px) 0, 100% 14px, 100% 100%, 0 100%);
  }

  .acoes-modal::before {
    left: 16px;
    right: 16px;
    top: 7px;
  }

  .jogadores-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: none;
    overflow: visible;
  }

  .jogador-item {
    gap: 8px;
    align-items: center;
  }

  .foto-jogador {
    width: 38px;
    height: 38px;
  }

  .dados-jogador .nome {
    font-size: 13px;
    max-width: 130px;
  }

  .estatisticas {
    flex-wrap: nowrap;
    gap: 6px;
  }

  .btn-compartilhar {
    min-height: 46px;
    min-width: min(290px, 100%);
    font-size: 18px;
  }
}
</style>


