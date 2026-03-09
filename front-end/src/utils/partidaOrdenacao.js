const PRIORIDADE_STATUS_PARTIDA = Object.freeze({
  EM_ANDAMENTO: 0,
  AGENDADA: 1,
  AGENDADA_HOJE: 1,
  ADIADA: 1,
  FINALIZADA: 2,
  FINALIZADO: 2,
  CANCELADA: 3,
  CANCELADO: 3,
  DELETADA: 3,
  DELETADO: 3
})

function normalizarStatusPartida(status) {
  return String(status || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
}

function obterTimestampPartida(partida) {
  const timestamp = new Date(partida?.data || partida?.createdAt || 0).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

export function obterPrioridadeStatusPartida(status) {
  const statusNormalizado = normalizarStatusPartida(status)
  return PRIORIDADE_STATUS_PARTIDA[statusNormalizado] ?? 4
}

export function compararPartidasPorStatusEDataDesc(a, b) {
  const prioridadeA = obterPrioridadeStatusPartida(a?.status)
  const prioridadeB = obterPrioridadeStatusPartida(b?.status)

  if (prioridadeA !== prioridadeB) {
    return prioridadeA - prioridadeB
  }

  const dataA = obterTimestampPartida(a)
  const dataB = obterTimestampPartida(b)
  if (dataA !== dataB) {
    return dataB - dataA
  }

  const idA = Number(a?.id || 0)
  const idB = Number(b?.id || 0)
  return idB - idA
}

export function ordenarPartidasPorStatusEDataDesc(partidas) {
  const lista = Array.isArray(partidas) ? [...partidas] : []
  return lista.sort(compararPartidasPorStatusEDataDesc)
}
