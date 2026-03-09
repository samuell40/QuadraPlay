function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function grupoModalidade(nomeModalidade) {
  const nome = normalizarTexto(nomeModalidade)
  if (nome.includes('volei') || nome.includes('futevolei') || (nome.includes('beach') && (nome.includes('tenis') || nome.includes('tennis')))) {
    return 'VOLEI'
  }
  return 'FUTEBOL'
}

function regrasPadrao(grupo) {
  if (grupo === 'VOLEI') {
    return {
      grupoRegras: 'VOLEI',
      quantidadeSetsPartida: 5,
      pontosPorSet: 25,
      regraPontosVitoria: 'VITORIA_2_SEMPRE',
      regraPontosDerrota: 'DERROTA_0_SEMPRE',
      pontosEmpate: 0,
      suspensaoAmarelos: null,
      suspensaoVermelhos: null,
      separarCartoesPorFase: false,
      resetarCartoesCadaFase: false
    }
  }

  return {
    grupoRegras: 'FUTEBOL',
    pontosVitoria: 3,
    pontosEmpate: 1,
    pontosDerrota: 0,
    duracaoSuspensaoPartidas: 1,
    suspensaoAmarelos: null,
    suspensaoVermelhos: null,
    separarCartoesPorFase: false,
    resetarCartoesCadaFase: false
  }
}

function opcoesSuspensao(inicio = 1, fim = 10) {
  const opcoes = [{ label: 'Nao', value: null }]
  for (let i = inicio; i <= fim; i += 1) {
    const singular = inicio === 1 ? 'vermelho' : 'amarelo'
    const plural = inicio === 1 ? 'vermelhos' : 'amarelos'
    opcoes.push({ label: `${i} ${i === 1 ? singular : plural}`, value: i })
  }
  return opcoes
}

function opcoesNumericas(inicio = 0, fim = 10) {
  const opcoes = []
  for (let i = inicio; i <= fim; i += 1) {
    opcoes.push({ label: String(i), value: i })
  }
  return opcoes
}

export {
  grupoModalidade,
  opcoesNumericas,
  opcoesSuspensao,
  regrasPadrao
}
