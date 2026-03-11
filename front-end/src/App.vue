<template>
  <router-view v-slot="{ Component, route }">
    <keep-alive :include="keepAliveRouteNames" :max="25">
      <component
        :is="Component"
        v-if="deveManterEmCache(route)"
        :key="obterChaveCacheRota(route)"
      />
    </keep-alive>

    <component
      :is="Component"
      v-if="!deveManterEmCache(route)"
      :key="route.fullPath"
    />
  </router-view>
</template>

<script>
import {
  EVENTO_NOTIFICACAO_PARTIDA_AO_VIVO,
  obterSocket
} from '@/services/socket'
import {
  inicializarNotificacoesPush,
  removerAssinaturaPushLocal
} from '@/services/pushNotifications'
import {
  getDataVersion,
  subscribeDataVersion
} from '@/services/dataVersion'

const SOCKET_DEBUG = import.meta.env.DEV

export default {
  name: 'App',

  data() {
    return {
      socket: null,
      onSocketPartidaAoVivo: null,
      onSocketConnect: null,
      onSocketConnectError: null,
      onSocketDisconnect: null,
      onSocketAny: null,
      notificacoesNativasPorPartida: {},
      pushNotificacoesAtivas: false,
      keepAliveRouteNames: [],
      routeRevisionMap: {},
      routeDirtyMap: {},
      routeVisitedMap: {},
      lastDataVersionProcessada: getDataVersion(),
      unsubscribeDataVersion: null
    }
  },

  mounted() {
    this.inicializarCacheRotas()
    this.unsubscribeDataVersion = subscribeDataVersion(this.onDataVersionChange)
    this.conectarSocketNotificacoes()
    this.inicializarPushNotificacoes()
  },

  beforeUnmount() {
    if (typeof this.unsubscribeDataVersion === 'function') {
      this.unsubscribeDataVersion()
      this.unsubscribeDataVersion = null
    }
    this.desconectarSocketNotificacoes()
  },

  watch: {
    $route: {
      immediate: true,
      handler(rotaAtual) {
        this.tratarEntradaRota(rotaAtual)
      }
    }
  },

  methods: {
    inicializarCacheRotas() {
      const nomes = this.$router.getRoutes()
        .filter((route) => typeof route?.name === 'string')
        .filter((route) => route?.meta?.keepAlive !== false)
        .map((route) => String(route.name))

      this.keepAliveRouteNames = Array.from(new Set(nomes))
    },

    deveManterEmCache(route) {
      if (!route || typeof route?.name !== 'string') return false
      return route?.meta?.keepAlive !== false
    },

    obterNomeRota(route) {
      return typeof route?.name === 'string' ? String(route.name) : ''
    },

    obterChaveCacheRota(route) {
      const nomeRota = this.obterNomeRota(route)
      if (!nomeRota) return String(route?.fullPath || '')

      const revisao = Number(this.routeRevisionMap[nomeRota] || 0)
      return `${nomeRota}:${revisao}`
    },

    tratarEntradaRota(route) {
      if (!this.deveManterEmCache(route)) return

      const nomeRota = this.obterNomeRota(route)
      if (!nomeRota) return

      if (this.routeRevisionMap[nomeRota] == null) {
        this.routeRevisionMap[nomeRota] = 0
      }

      const jaVisitada = Boolean(this.routeVisitedMap[nomeRota])
      const rotaSuja = Boolean(this.routeDirtyMap[nomeRota])

      if (jaVisitada && rotaSuja) {
        this.routeRevisionMap[nomeRota] = Number(this.routeRevisionMap[nomeRota] || 0) + 1
        this.routeDirtyMap[nomeRota] = false
      }

      this.routeVisitedMap[nomeRota] = true
    },

    onDataVersionChange(detail = {}) {
      const versao = Number(detail?.version ?? getDataVersion())
      if (!Number.isFinite(versao)) return
      if (versao <= Number(this.lastDataVersionProcessada || 0)) return

      this.lastDataVersionProcessada = versao

      Object.keys(this.routeVisitedMap).forEach((nomeRota) => {
        if (this.routeVisitedMap[nomeRota]) {
          this.routeDirtyMap[nomeRota] = true
        }
      })

      const motivo = String(detail?.reason || '').toLowerCase()
      if (motivo === 'auth-login') {
        this.inicializarPushNotificacoes()
      }
      if (motivo === 'auth-logout') {
        this.limparAssinaturaPushLocal()
      }
    },

    async inicializarPushNotificacoes() {
      this.pushNotificacoesAtivas = await inicializarNotificacoesPush()
    },

    async limparAssinaturaPushLocal() {
      await removerAssinaturaPushLocal()
      this.pushNotificacoesAtivas = false
    },

    conectarSocketNotificacoes() {
      this.socket = obterSocket()

      if (!this.onSocketPartidaAoVivo) {
        this.onSocketPartidaAoVivo = (payload) => this.tratarNotificacaoPartidaAoVivo(payload)
      }

      if (!this.onSocketConnect) {
        this.onSocketConnect = () => {
          if (SOCKET_DEBUG) {
            console.log('[socket] conectado para notificacoes:', this.socket?.id)
          }
        }
      }

      if (!this.onSocketConnectError) {
        this.onSocketConnectError = (error) => {
          if (SOCKET_DEBUG) {
            console.error('[socket] erro de conexão:', error?.message || error)
          }
        }
      }

      if (!this.onSocketDisconnect) {
        this.onSocketDisconnect = (reason) => {
          if (SOCKET_DEBUG) {
            console.warn('[socket] desconectado:', reason)
          }
        }
      }

      if (!this.onSocketAny) {
        this.onSocketAny = (evento, payload) => {
          if (evento === 'ping' || evento === 'pong') return
          if (SOCKET_DEBUG) {
            console.log('[socket] evento recebido:', evento, payload || '')
          }
        }
      }

      this.socket.off('connect', this.onSocketConnect)
      this.socket.off('connect_error', this.onSocketConnectError)
      this.socket.off('disconnect', this.onSocketDisconnect)
      this.socket.offAny(this.onSocketAny)

      this.socket.on('connect', this.onSocketConnect)
      this.socket.on('connect_error', this.onSocketConnectError)
      this.socket.on('disconnect', this.onSocketDisconnect)
      this.socket.onAny(this.onSocketAny)

      this.socket.off(EVENTO_NOTIFICACAO_PARTIDA_AO_VIVO, this.onSocketPartidaAoVivo)
      this.socket.on(EVENTO_NOTIFICACAO_PARTIDA_AO_VIVO, this.onSocketPartidaAoVivo)

      if (!this.socket.connected) {
        this.socket.connect()
      }
    },

    desconectarSocketNotificacoes() {
      if (this.socket && this.onSocketPartidaAoVivo) {
        this.socket.off(EVENTO_NOTIFICACAO_PARTIDA_AO_VIVO, this.onSocketPartidaAoVivo)
      }
      if (this.socket && this.onSocketConnect) {
        this.socket.off('connect', this.onSocketConnect)
      }
      if (this.socket && this.onSocketConnectError) {
        this.socket.off('connect_error', this.onSocketConnectError)
      }
      if (this.socket && this.onSocketDisconnect) {
        this.socket.off('disconnect', this.onSocketDisconnect)
      }
      if (this.socket && this.onSocketAny) {
        this.socket.offAny(this.onSocketAny)
      }
      this.onSocketPartidaAoVivo = null
      this.onSocketConnect = null
      this.onSocketConnectError = null
      this.onSocketDisconnect = null
      this.onSocketAny = null

      Object.values(this.notificacoesNativasPorPartida || {}).forEach((notificacao) => {
        try {
          if (notificacao && typeof notificacao.close === 'function') {
            notificacao.close()
          }
        } catch (error) {
          if (SOCKET_DEBUG) {
            console.warn('[notificacao] erro ao fechar notificação nativa:', error)
          }
        }
      })

      this.notificacoesNativasPorPartida = {}
    },

    async garantirPermissaoNotificacao() {
      if (typeof window === 'undefined' || !('Notification' in window)) return
      if (Notification.permission !== 'default') return

      try {
        await Notification.requestPermission()
      } catch (error) {
        console.warn('Não foi possível solicitar permissão de notificação:', error)
      }
    },

    ehStatusEncerrado(status) {
      const statusNormalizado = String(status || '').toUpperCase()
      return ['FINALIZADA', 'CANCELADA', 'DELETADA'].includes(statusNormalizado)
    },

    rotuloStatusLive(status) {
      const statusNormalizado = String(status || '').toUpperCase()
      if (statusNormalizado === 'EM_ANDAMENTO') return 'AO VIVO'
      if (statusNormalizado === 'AGENDADA' || statusNormalizado === 'AGENDADA_HOJE') return 'AGENDADA'
      if (statusNormalizado === 'ADIADA') return 'ADIADA'
      if (statusNormalizado === 'FINALIZADA') return 'FINALIZADA'
      if (statusNormalizado === 'CANCELADA') return 'CANCELADA'
      return 'EM ACOMPANHAMENTO'
    },

    normalizarPayloadPartidaAoVivo(payload = {}) {
      const partidaId = Number(payload?.partidaId || 0)
      const status = String(payload?.status || '').toUpperCase()
      const atualizadoEm = String(payload?.atualizadoEm || new Date().toISOString())
      const atualizadoTimestamp = new Date(atualizadoEm).getTime()
      const timeAFoto = String(payload?.timeAFoto || '').trim()
      const timeBFoto = String(payload?.timeBFoto || '').trim()

      return {
        tipo: String(payload?.tipo || 'PARTIDA_ATUALIZADA'),
        partidaId,
        campeonatoId: Number(payload?.campeonatoId || 0) || null,
        campeonatoNome: String(payload?.campeonatoNome || 'Campeonato').trim() || 'Campeonato',
        timeA: String(payload?.timeA || 'Time A'),
        timeB: String(payload?.timeB || 'Time B'),
        timeAFoto,
        timeBFoto,
        pontosTimeA: Number(payload?.pontosTimeA ?? 0),
        pontosTimeB: Number(payload?.pontosTimeB ?? 0),
        status,
        encerrada: Boolean(payload?.encerrada) || this.ehStatusEncerrado(status),
        quadra: String(payload?.quadra || '').trim(),
        atualizadoEm: Number.isFinite(atualizadoTimestamp) ? atualizadoEm : new Date().toISOString()
      }
    },

    notificarPartidaAoVivoNoSistema(partida) {
      if (typeof window === 'undefined' || !('Notification' in window)) return
      if (Notification.permission !== 'granted') return

      const id = Number(partida?.partidaId || 0)
      if (!id) return

      const titulo = `${partida.timeA} ${partida.pontosTimeA} x ${partida.pontosTimeB} ${partida.timeB}`
      const statusLabel = this.rotuloStatusLive(partida.status)
      const body = [
        statusLabel,
        partida.campeonatoNome || 'Campeonato',
        partida.quadra || ''
      ].filter(Boolean).join(' | ')

      const tag = `partida-live-${id}`
      const encerrada = Boolean(partida.encerrada)
      const icon = partida.timeAFoto || partida.timeBFoto || '/logo.png'
      const image = partida.timeBFoto || partida.timeAFoto || undefined

      try {
        const notificacaoAnterior = this.notificacoesNativasPorPartida[id]
        if (notificacaoAnterior && typeof notificacaoAnterior.close === 'function') {
          notificacaoAnterior.close()
        }

        const notificacao = new Notification(titulo, {
          body,
          icon,
          badge: '/logo.png',
          image,
          tag,
          renotify: true,
          requireInteraction: !encerrada,
          silent: true
        })

        notificacao.onclick = () => {
          window.focus()
          this.abrirPainelPartidasAoVivo(partida)
          notificacao.close()
        }

        const mapa = { ...this.notificacoesNativasPorPartida, [id]: notificacao }
        this.notificacoesNativasPorPartida = mapa
      } catch (error) {
        if (SOCKET_DEBUG) {
          console.warn('Falha ao mostrar notificação nativa:', error)
        }
      }
    },

    abrirPainelPartidasAoVivo(partida = {}) {
      const query = {}
      if (Number(partida?.partidaId || 0)) {
        query.partidaId = Number(partida.partidaId)
      }

      if (this.$route?.name !== 'visualizar_placarhome') {
        this.$router.push({ name: 'visualizar_placarhome', query }).catch(() => {})
      }
    },

    tratarNotificacaoPartidaAoVivo(payload = {}) {
      const partida = this.normalizarPayloadPartidaAoVivo(payload)
      if (!partida.partidaId) return

      if (SOCKET_DEBUG) {
        console.log('[socket] notificação ao vivo recebida:', partida)
      }

      if (this.pushNotificacoesAtivas) return
      this.notificarPartidaAoVivoNoSistema(partida)
    }
  }
}
</script>

<style>
#app {
  font-family: 'Montserrat', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
}
img:focus {
  outline: none;
}

body {
  margin: 0;
  font-family: 'Montserrat', sans-serif;
}
</style>
