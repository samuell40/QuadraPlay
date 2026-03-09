import { io } from 'socket.io-client'
import api from '@/axios'

export const EVENTO_CAMPEONATO_ATUALIZADO = 'campeonato:atualizado'
export const EVENTO_NOTIFICACAO_PARTIDA_AO_VIVO = 'notificacao:partida-ao-vivo'
const SOCKET_BASE_URL_PROD = 'https://quadra-livre-backend.onrender.com'

let socket = null

function resolverUrlSocket() {
  const baseUrl = String(api?.defaults?.baseURL || '').trim()
  if (baseUrl) return baseUrl.replace(/\/+$/, '')
  return SOCKET_BASE_URL_PROD
}

export function obterSocket() {
  if (!socket) {
    socket = io(resolverUrlSocket(), {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      rememberUpgrade: true
    })
  }

  return socket
}

export function inscreverCampeonatoSocket(campeonatoId) {
  const id = Number(campeonatoId)
  if (!id) return

  obterSocket().emit('campeonato:inscrever', { campeonatoId: id })
}

export function desinscreverCampeonatoSocket(campeonatoId) {
  const id = Number(campeonatoId)
  if (!id || !socket) return

  socket.emit('campeonato:desinscrever', { campeonatoId: id })
}
