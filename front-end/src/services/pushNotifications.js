import api from '@/axios'

const ROTA_CHAVE_PUBLICA = '/notificacoes/push/public-key'
const ROTA_ASSINAR = '/notificacoes/push/subscribe'
const CHAVE_PREFERENCIA_LOCAL_PARTIDAS = 'quadraplay:notificarPartidasAoVivo'
export const EVENTO_PREFERENCIA_PUSH_PARTIDAS = 'push:preferencia-partidas'

let inicializacaoEmAndamento = null

function possuiSuportePush() {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false
  if (!('serviceWorker' in navigator)) return false
  if (!('PushManager' in window)) return false
  return true
}

function usuarioAutenticado() {
  const token = String(window.localStorage.getItem('token') || '').trim()
  return Boolean(token)
}

function base64UrlToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

async function registrarServiceWorker() {
  const existente = await navigator.serviceWorker.getRegistration('/')
  if (existente) return existente
  return navigator.serviceWorker.register('/service-worker.js')
}

async function garantirPermissaoNotificacao() {
  if (!possuiSuportePush()) return 'denied'

  if (Notification.permission === 'default') {
    try {
      return await Notification.requestPermission()
    } catch (error) {
      return Notification.permission
    }
  }

  return Notification.permission
}

export async function solicitarPermissaoNotificacaoNativa() {
  return garantirPermissaoNotificacao()
}

async function obterChavePublicaVapid() {
  const resposta = await api.get(ROTA_CHAVE_PUBLICA, { silent: true })
  return String(resposta?.data?.publicKey || '').trim()
}

async function obterAssinaturaPush(registration, vapidPublicKey) {
  const assinaturaExistente = await registration.pushManager.getSubscription()
  if (assinaturaExistente) return assinaturaExistente

  const applicationServerKey = base64UrlToUint8Array(vapidPublicKey)
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey
  })
}

async function enviarAssinaturaParaBackend(subscription) {
  await api.post(
    ROTA_ASSINAR,
    { subscription: subscription?.toJSON ? subscription.toJSON() : subscription },
    { silent: true }
  )
}

async function inicializarNotificacoesPushInterno() {
  if (!possuiSuportePush()) return false
  if (!usuarioAutenticado()) return false

  const permissao = await garantirPermissaoNotificacao()
  if (permissao !== 'granted') return false

  const registration = await registrarServiceWorker()
  if (!registration) return false

  const vapidPublicKey = await obterChavePublicaVapid()
  if (!vapidPublicKey) return false

  const subscription = await obterAssinaturaPush(registration, vapidPublicKey)
  if (!subscription) return false

  await enviarAssinaturaParaBackend(subscription)
  return true
}

export async function inicializarNotificacoesPush() {
  if (inicializacaoEmAndamento) {
    return inicializacaoEmAndamento
  }

  inicializacaoEmAndamento = inicializarNotificacoesPushInterno()
    .catch(() => false)
    .finally(() => {
      inicializacaoEmAndamento = null
    })

  return inicializacaoEmAndamento
}

export function lerPreferenciaLocalNotificacaoPartidasAoVivo() {
  if (typeof window === 'undefined') return true

  const valor = String(window.localStorage.getItem(CHAVE_PREFERENCIA_LOCAL_PARTIDAS) || '').trim()
  if (!valor) return true
  return valor !== '0'
}

export function salvarPreferenciaLocalNotificacaoPartidasAoVivo(enabled, options = {}) {
  const ativo = Boolean(enabled)

  if (typeof window === 'undefined') return ativo

  window.localStorage.setItem(CHAVE_PREFERENCIA_LOCAL_PARTIDAS, ativo ? '1' : '0')

  if (options.broadcast !== false) {
    window.dispatchEvent(new CustomEvent(EVENTO_PREFERENCIA_PUSH_PARTIDAS, {
      detail: { enabled: ativo }
    }))
  }

  return ativo
}

export async function removerAssinaturaPushLocal() {
  if (!possuiSuportePush()) return false

  try {
    const registration = await navigator.serviceWorker.getRegistration('/')
    if (!registration) return false

    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return false

    await subscription.unsubscribe()
    return true
  } catch (error) {
    return false
  }
}
