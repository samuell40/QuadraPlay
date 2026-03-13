const TIPOS_COM_MODALIDADE = new Set(['TREINO', 'AMISTOSO'])
const ESCOLAS_AULA = {
  EEAF: 'Escola Estadual Arist\u00f3fanes Fernandes',
  EEJAM: 'Escola Estadual Joaquim Adelino de Medeiros',
  EMFPA: 'Escola Municipal Francisca Pires de Medeiros',
  CEMEI: 'Centro Municipal de Ensino Infantil Professor Jos\u00e9 Felicio',
  DANCA: 'Dan\u00e7a'
}

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

  if (escolaNormalizada === 'DANCA') return 'Dan\u00e7a'

  return String(escola || '').trim().toUpperCase()
}

export function obterNomeEscolaAula(escola) {
  const escolaNormalizada = normalizarIdentificador(escola)
  if (!escolaNormalizada) return ''

  return ESCOLAS_AULA[escolaNormalizada] || formatarEscolaAulaLabel(escola)
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
