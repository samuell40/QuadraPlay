const TIPOS_COM_MODALIDADE = new Set(['TREINO', 'AMISTOSO'])

function normalizarIdentificador(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
}

export function obterPrimeiroNome(nomeCompleto) {
  const nome = String(nomeCompleto || '').trim()
  if (!nome) return ''
  return nome.split(/\s+/)[0] || ''
}

export function formatarTipoLabel(tipo) {
  const valor = normalizarIdentificador(tipo)
  if (!valor) return ''
  return valor.charAt(0) + valor.slice(1).toLowerCase()
}

export function formatarEscolaAulaLabel(escola) {
  const escolaNormalizada = normalizarIdentificador(escola)
  if (!escolaNormalizada) return ''

  if (escolaNormalizada === 'DANCA') return 'Dança'

  return String(escola || '').trim().toUpperCase()
}

export function obterDescricaoReserva(agendamento) {
  const permissaoId = Number(agendamento?.usuario?.permissaoId)
  const nomeTime = String(agendamento?.time?.nome || '').trim()
  const nomeModalidade = String(agendamento?.modalidade?.nome || '').trim()
  const descricaoOutro = String(agendamento?.descricao || '').trim()
  const tipo = normalizarIdentificador(agendamento?.tipo)

  if (permissaoId === 5 && nomeTime) {
    return nomeTime
  }

  if (TIPOS_COM_MODALIDADE.has(tipo)) {
    return nomeModalidade || formatarTipoLabel(tipo)
  }

  if (tipo === 'AULA') {
    return formatarEscolaAulaLabel(agendamento?.escola) || 'Aula'
  }

  if (tipo === 'EVENTO') return 'Evento'
  if (tipo === 'OUTRO') return descricaoOutro || 'Outro'
  if (tipo === 'CAMPEONATO' || agendamento?.campeonatoId) return 'Campeonato'

  return formatarTipoLabel(tipo) || nomeModalidade || nomeTime || 'Reservado'
}

export function obterTextoAgendamento(agendamento) {
  const primeiroNome = obterPrimeiroNome(agendamento?.usuario?.nome)
  const descricaoReserva = obterDescricaoReserva(agendamento)

  if (primeiroNome && descricaoReserva) return `${primeiroNome} - ${descricaoReserva}`
  return primeiroNome || descricaoReserva || 'Reservado'
}
