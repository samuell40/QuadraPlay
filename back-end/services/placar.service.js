const prisma = require('../lib/prisma');

const CRITERIOS_FUTEBOL = [
  { value: 'pontuacao', label: 'Pontuacao' },
  { value: 'vitorias', label: 'Vitorias' },
  { value: 'saldoDeGols', label: 'Saldo de gols' },
  { value: 'golsPro', label: 'Gols pro' },
  { value: 'golsSofridos', label: 'Gols sofridos' },
  { value: 'empates', label: 'Empates' },
  { value: 'derrotas', label: 'Derrotas' },
  { value: 'confrontoDireto', label: 'Confronto direto' },
  { value: 'sorteio', label: 'Sorteio' }
];

const CRITERIOS_VOLEI = [
  { value: 'pontuacao', label: 'Pontuacao' },
  { value: 'vitorias', label: 'Vitorias' },
  { value: 'diferencaSets', label: 'Saldo de sets' },
  { value: 'diferencaPontos', label: 'Saldo de pontos' },
  { value: 'setsVencidos', label: 'Sets ganhos' },
  { value: 'pontosAverage', label: 'Pontos average (AV)' },
  { value: 'confrontoDireto', label: 'Confronto direto' },
  { value: 'derrotaWo', label: 'W.O. (menos)' },
  { value: 'sorteio', label: 'Sorteio' }
];

const CRITERIOS_BEACH_TENIS = [
  { value: 'pontuacao', label: 'Pontuacao' },
  { value: 'vitorias', label: 'Vitorias' },
  { value: 'diferencaSets', label: 'Saldo de sets' },
  { value: 'diferencaGames', label: 'Saldo de games' },
  { value: 'setsVencidos', label: 'Sets ganhos' },
  { value: 'gamesPro', label: 'Games ganhos' },
  { value: 'confrontoDireto', label: 'Confronto direto' },
  { value: 'derrotaWo', label: 'W.O. (menos)' },
  { value: 'sorteio', label: 'Sorteio' }
];

const COLUNAS_PADRAO = {
  futebol: [
    'pontuacao',
    'jogos',
    'vitorias',
    'empates',
    'derrotas',
    'golsPro',
    'golsSofridos',
    'saldoDeGols',
    'aproveitamento',
    'ultimosJogos'
  ],
  volei: [
    'pontuacao',
    'jogos',
    'vitorias',
    'derrotas',
    'setsVencidos',
    'setsContra',
    'diferencaSets',
    'pontosPro',
    'pontosContra',
    'diferencaPontos',
    'pontosAverage',
    'derrotaWo',
    'ultimosJogos'
  ],
  beachTenis: [
    'pontuacao',
    'jogos',
    'vitorias',
    'derrotas',
    'setsVencidos',
    'setsContra',
    'diferencaSets',
    'gamesPro',
    'gamesContra',
    'diferencaGames',
    'derrotaWo',
    'ultimosJogos'
  ]
};

function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function grupoModalidade(nomeModalidade) {
  const nome = normalizarTexto(nomeModalidade);
  if (
    nome.includes('volei') ||
    nome.includes('futevolei') ||
    (nome.includes('beach') && (nome.includes('tenis') || nome.includes('tennis')))
  ) {
    return 'VOLEI';
  }
  return 'FUTEBOL';
}

function grupoModalidadeColunas(nomeModalidade) {
  const nome = normalizarTexto(nomeModalidade);
  if (nome.includes('beach') && (nome.includes('tenis') || nome.includes('tennis'))) {
    return 'BEACH_TENIS';
  }
  return grupoModalidade(nomeModalidade);
}

function criteriosPadraoPorModalidade(nomeModalidade) {
  const grupo = grupoModalidadeColunas(nomeModalidade);
  if (grupo === 'BEACH_TENIS') return CRITERIOS_BEACH_TENIS;
  return grupo === 'VOLEI' ? CRITERIOS_VOLEI : CRITERIOS_FUTEBOL;
}

function compararValoresCriterio(criterio, valorA, valorB) {
  if (criterio === 'derrotaWo') {
    return valorA - valorB;
  }

  return valorB - valorA;
}

function colunasPadraoPorModalidade(nomeModalidade) {
  const grupo = grupoModalidadeColunas(nomeModalidade);
  if (grupo === 'BEACH_TENIS') return COLUNAS_PADRAO.beachTenis;
  return grupo === 'VOLEI' ? COLUNAS_PADRAO.volei : COLUNAS_PADRAO.futebol;
}

function normalizarOrdemClassificacao(ordem, nomeModalidade) {
  const padrao = criteriosPadraoPorModalidade(nomeModalidade);

  if (!Array.isArray(ordem) || ordem.length === 0) {
    return [...padrao];
  }

  const mapaPadrao = new Map(padrao.map(criterio => [criterio.value, criterio]));
  const ordemNormalizada = [];

  for (const criterio of ordem) {
    const value = String(criterio?.value || '');
    if (!mapaPadrao.has(value) || ordemNormalizada.some(item => item.value === value)) {
      continue;
    }

    const criterioPadrao = mapaPadrao.get(value);
    ordemNormalizada.push({
      value,
      label: String(criterio?.label || criterioPadrao.label || value)
    });
  }

  for (const criterioPadrao of padrao) {
    if (ordemNormalizada.some(item => item.value === criterioPadrao.value)) {
      continue;
    }

    ordemNormalizada.push({ ...criterioPadrao });
  }

  return ordemNormalizada.length ? ordemNormalizada : [...padrao];
}

function normalizarColunasClassificacao(colunas, nomeModalidade) {
  const padrao = colunasPadraoPorModalidade(nomeModalidade);

  if (!Array.isArray(colunas) || colunas.length === 0) {
    return [...padrao];
  }

  const validas = new Set(padrao);
  const colunasNormalizadas = [];

  for (const coluna of colunas) {
    const chave = String(coluna || '');
    if (validas.has(chave) && !colunasNormalizadas.includes(chave)) {
      colunasNormalizadas.push(chave);
    }
  }

  return colunasNormalizadas.length ? colunasNormalizadas : [...padrao];
}

function regrasPadraoPorModalidade(nomeModalidade) {
  const grupo = grupoModalidade(nomeModalidade);
  if (grupo === 'VOLEI') {
    return {
      regraPontosVitoria: 'VITORIA_2_SEMPRE',
      regraPontosDerrota: 'DERROTA_0_SEMPRE',
      pontosEmpate: 0,
      pontosVitoria: 3,
      pontosDerrota: 0
    };
  }
  return {
    pontosVitoria: 3,
    pontosEmpate: 1,
    pontosDerrota: 0
  };
}

function normalizarRegrasCampeonato(regras, nomeModalidade) {
  return {
    ...regrasPadraoPorModalidade(nomeModalidade),
    ...(regras || {})
  };
}

function gerarNomeGrupoPadrao(indice) {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (indice >= 0 && indice < alfabeto.length) {
    return `Grupo ${alfabeto[indice]}`;
  }
  return `Grupo ${indice + 1}`;
}

function normalizarIdsNumericos(lista) {
  if (!Array.isArray(lista)) return [];

  const ids = [];
  const vistos = new Set();

  for (const valor of lista) {
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero <= 0 || vistos.has(numero)) continue;
    ids.push(numero);
    vistos.add(numero);
  }

  return ids;
}

function normalizarConfiguracaoGrupos(gruposConfig, timeIdsCampeonato = []) {
  if (!gruposConfig || typeof gruposConfig !== 'object') {
    return null;
  }

  const gruposEntrada = Array.isArray(gruposConfig.grupos) ? gruposConfig.grupos : [];
  const quantidadeBase = Number(gruposConfig.quantidade ?? gruposEntrada.length ?? 0);
  const quantidade = Number.isInteger(quantidadeBase) && quantidadeBase > 0
    ? Math.min(quantidadeBase, 16)
    : (gruposEntrada.length ? Math.min(gruposEntrada.length, 16) : 2);

  const timeIdsReferencia = normalizarIdsNumericos(timeIdsCampeonato);
  const possuiReferenciaTimes = timeIdsReferencia.length > 0;
  const timeIdsValidos = new Set(timeIdsReferencia);
  const timeIdsUsados = new Set();
  const grupos = [];

  for (let indice = 0; indice < quantidade; indice += 1) {
    const grupoEntrada = gruposEntrada[indice] || {};
    const nome = String(grupoEntrada.nome || '').trim() || gerarNomeGrupoPadrao(indice);
    const timeIdsEntrada = normalizarIdsNumericos(grupoEntrada.timeIds || grupoEntrada.times || []);
    const timeIds = [];

    for (const timeId of timeIdsEntrada) {
      if ((possuiReferenciaTimes && !timeIdsValidos.has(timeId)) || timeIdsUsados.has(timeId)) continue;
      timeIds.push(timeId);
      timeIdsUsados.add(timeId);
    }

    grupos.push({
      id: `grupo-${indice + 1}`,
      nome,
      timeIds
    });
  }

  return { quantidade, grupos };
}

function hidratarConfiguracaoGrupos(gruposConfig, timeIdsCampeonato = []) {
  const gruposNormalizados = normalizarConfiguracaoGrupos(gruposConfig, timeIdsCampeonato);
  if (!gruposNormalizados) return null;

  const timeIdsValidos = normalizarIdsNumericos(timeIdsCampeonato);
  const possuiReferenciaTimes = timeIdsValidos.length > 0;
  const timeIdsUsados = new Set(
    gruposNormalizados.grupos.flatMap(grupo => normalizarIdsNumericos(grupo.timeIds))
  );

  return {
    ...gruposNormalizados,
    semGrupo: possuiReferenciaTimes
      ? timeIdsValidos.filter(timeId => !timeIdsUsados.has(timeId))
      : []
  };
}

function montarConfiguracaoClassificacao(campeonato, timeIdsCampeonato = []) {
  return {
    ordem: normalizarOrdemClassificacao(
      campeonato?.ordemClassificacao,
      campeonato?.modalidade?.nome
    ),
    colunas: normalizarColunasClassificacao(
      campeonato?.regras?.colunasClassificacao,
      campeonato?.modalidade?.nome
    ),
    grupos: hidratarConfiguracaoGrupos(campeonato?.regras?.grupos, timeIdsCampeonato),
    exibirPorGrupos: typeof campeonato?.regras?.exibirClassificacaoPorGrupo === 'boolean'
      ? campeonato.regras.exibirClassificacaoPorGrupo
      : true
  };
}

function deveUsarFallbackConfiguracaoClassificacao(error) {
  const mensagem = String(error?.message || '').toLowerCase();

  return [
    'ordemclassificacao',
    'deletedat',
    'unknown field',
    'unknown argument',
    'does not exist',
    'column',
    'coluna'
  ].some(fragmento => mensagem.includes(fragmento));
}

function calcularPontosVoleiParaResultado(setsVencedor, setsPerdedor, regras) {
  const diff = Math.abs((Number(setsVencedor) || 0) - (Number(setsPerdedor) || 0));

  let pontosVencedor = 2;
  if (regras.regraPontosVitoria === 'VITORIA_3_SEMPRE') {
    pontosVencedor = 3;
  } else if (regras.regraPontosVitoria === 'VITORIA_3_DIF_SETS_MAIOR_1') {
    pontosVencedor = diff > 1 ? 3 : 2;
  }

  let pontosPerdedor = 0;
  if (regras.regraPontosDerrota === 'DERROTA_1_SEMPRE') {
    pontosPerdedor = 1;
  } else if (regras.regraPontosDerrota === 'DERROTA_1_DIF_SETS_MENOR_2') {
    pontosPerdedor = diff < 2 ? 1 : 0;
  }

  return { pontosVencedor, pontosPerdedor };
}

async function atualizarPlacar(id, dados) {
  return prisma.placar.update({
    where: { id: Number(id) },
    data: dados,
    include: {
      time: true,
      campeonato: true
    }
  });
}

async function listarPlacarPorCampeonato(campeonatoId) {
  return prisma.placar.findMany({
    where: {
      campeonatoId: Number(campeonatoId),
      visivel: true
    },
    include: {
      time: true,
      campeonato: true
    },
    orderBy: {
      pontuacao: 'desc'
    }
  });
}

async function salvarOrdemClassificacao(
  campeonatoId,
  novaOrdem = null,
  colunasVisiveis = null,
  gruposConfig = undefined,
  exibirPorGrupos = undefined
) {
  const id = Number(campeonatoId);
  const atualizarOrdem = Array.isArray(novaOrdem);
  const atualizarColunas = Array.isArray(colunasVisiveis);
  const atualizarGrupos = gruposConfig === null || (!!gruposConfig && typeof gruposConfig === 'object' && !Array.isArray(gruposConfig));
  const atualizarExibicaoPorGrupos = typeof exibirPorGrupos === 'boolean';

  if (!atualizarOrdem && !atualizarColunas && !atualizarGrupos && !atualizarExibicaoPorGrupos) {
    throw new Error('Informe ao menos ordem, colunas, grupos ou exibirPorGrupos para atualizar.');
  }

  const campeonatoAtual = await prisma.campeonato.findUnique({
    where: { id },
    select: {
      id: true,
      regras: true,
      ordemClassificacao: true,
      modalidade: { select: { nome: true } },
      times: {
        where: { ativo: true, time: { deletedAt: null } },
        select: { timeId: true }
      }
    }
  });

  if (!campeonatoAtual) {
    throw new Error('Campeonato nao encontrado');
  }

  const dataUpdate = {};
  const timeIdsCampeonato = Array.isArray(campeonatoAtual.times)
    ? campeonatoAtual.times.map(item => Number(item.timeId))
    : [];

  if (atualizarOrdem) {
    dataUpdate.ordemClassificacao = normalizarOrdemClassificacao(novaOrdem, campeonatoAtual.modalidade?.nome);
  }

  if (atualizarColunas || atualizarGrupos || atualizarExibicaoPorGrupos) {
    const regrasBase = normalizarRegrasCampeonato(campeonatoAtual.regras, campeonatoAtual.modalidade?.nome);
    const regrasAtualizadas = { ...regrasBase };

    if (atualizarColunas) {
      regrasAtualizadas.colunasClassificacao = normalizarColunasClassificacao(
        colunasVisiveis,
        campeonatoAtual.modalidade?.nome
      );
    }

    if (atualizarGrupos) {
      regrasAtualizadas.grupos = gruposConfig === null
        ? null
        : normalizarConfiguracaoGrupos(gruposConfig, timeIdsCampeonato);
    }

    if (atualizarExibicaoPorGrupos) {
      regrasAtualizadas.exibirClassificacaoPorGrupo = exibirPorGrupos;
    }

    dataUpdate.regras = regrasAtualizadas;
  }

  const campeonato = await prisma.campeonato.update({
    where: { id },
    data: dataUpdate,
    select: {
      id: true,
      regras: true,
      ordemClassificacao: true,
      modalidade: { select: { nome: true } },
      times: {
        where: { ativo: true, time: { deletedAt: null } },
        select: { timeId: true }
      }
    }
  });

  const ordemFinal = normalizarOrdemClassificacao(
    campeonato.ordemClassificacao,
    campeonato.modalidade?.nome
  );
  const colunasFinal = normalizarColunasClassificacao(
    campeonato.regras?.colunasClassificacao,
    campeonato.modalidade?.nome
  );
  const timeIdsAtualizados = Array.isArray(campeonato.times)
    ? campeonato.times.map(item => Number(item.timeId))
    : timeIdsCampeonato;
  const gruposFinal = hidratarConfiguracaoGrupos(campeonato.regras?.grupos, timeIdsAtualizados);
  const exibirPorGruposFinal = typeof campeonato.regras?.exibirClassificacaoPorGrupo === 'boolean'
    ? campeonato.regras.exibirClassificacaoPorGrupo
    : true;

  if (!atualizarOrdem) {
    return {
      ordem: ordemFinal,
      colunas: colunasFinal,
      grupos: gruposFinal,
      exibirPorGrupos: exibirPorGruposFinal
    };
  }

  const regras = normalizarRegrasCampeonato(campeonato.regras, campeonato.modalidade?.nome);
  const grupo = grupoModalidade(campeonato.modalidade?.nome);

  const placares = await prisma.placar.findMany({
    where: { campeonatoId: id, visivel: true, deletedAt: null },
    include: { time: true }
  });

  async function calcularConfrontoDireto(timeAId, timeBId) {
    const partidas = await prisma.partida.findMany({
      where: {
        campeonatoId: id,
        OR: [
          { timeAId, timeBId },
          { timeAId: timeBId, timeBId: timeAId }
        ],
        status: 'FINALIZADA'
      }
    });

    let pontosA = 0;
    let pontosB = 0;

    for (const p of partidas) {
      if (p.pontosTimeA > p.pontosTimeB) {
        if (grupo === 'FUTEBOL') {
          const v = Number(regras.pontosVitoria) || 0;
          const d = Number(regras.pontosDerrota) || 0;
          if (p.timeAId === timeAId) {
            pontosA += v;
            pontosB += d;
          } else {
            pontosB += v;
            pontosA += d;
          }
        } else {
          const pts = calcularPontosVoleiParaResultado(p.pontosTimeA, p.pontosTimeB, regras);
          if (p.timeAId === timeAId) {
            pontosA += pts.pontosVencedor;
            pontosB += pts.pontosPerdedor;
          } else {
            pontosB += pts.pontosVencedor;
            pontosA += pts.pontosPerdedor;
          }
        }
      } else if (p.pontosTimeB > p.pontosTimeA) {
        if (grupo === 'FUTEBOL') {
          const v = Number(regras.pontosVitoria) || 0;
          const d = Number(regras.pontosDerrota) || 0;
          if (p.timeBId === timeAId) {
            pontosA += v;
            pontosB += d;
          } else {
            pontosB += v;
            pontosA += d;
          }
        } else {
          const pts = calcularPontosVoleiParaResultado(p.pontosTimeB, p.pontosTimeA, regras);
          if (p.timeBId === timeAId) {
            pontosA += pts.pontosVencedor;
            pontosB += pts.pontosPerdedor;
          } else {
            pontosB += pts.pontosVencedor;
            pontosA += pts.pontosPerdedor;
          }
        }
      } else {
        const e = Number(regras.pontosEmpate) || 0;
        pontosA += e;
        pontosB += e;
      }
    }

    return pontosB - pontosA;
  }

  const confrontoCache = {};
  async function getConfronto(aId, bId) {
    const chave = `${aId}-${bId}`;
    if (confrontoCache[chave] !== undefined) return confrontoCache[chave];
    const valor = await calcularConfrontoDireto(aId, bId);
    confrontoCache[chave] = valor;
    confrontoCache[`${bId}-${aId}`] = -valor;
    return valor;
  }

  for (let i = 0; i < placares.length; i++) {
    for (let j = i + 1; j < placares.length; j++) {
      const a = placares[i];
      const b = placares[j];
      let resultado = 0;

      for (const criterio of ordemFinal) {
        if (criterio.value === 'confrontoDireto') {
          resultado = await getConfronto(a.timeId, b.timeId);
          if (resultado !== 0) break;
          continue;
        }

        if (criterio.value === 'sorteio') {
          resultado = Math.random() - 0.5;
          break;
        }

        const valorA = a[criterio.value] ?? 0;
        const valorB = b[criterio.value] ?? 0;
        if (valorB !== valorA) {
          resultado = compararValoresCriterio(criterio.value, valorA, valorB);
          break;
        }
      }

      if (resultado > 0) {
        placares[i] = b;
        placares[j] = a;
      }
    }
  }

  for (let i = 0; i < placares.length; i++) {
    await prisma.placar.update({
      where: { id: placares[i].id },
      data: { posicao: i + 1 }
    });
  }

  return {
    ordem: ordemFinal,
    colunas: colunasFinal,
    grupos: gruposFinal,
    exibirPorGrupos: exibirPorGruposFinal,
    placares: placares.map((p, index) => ({
      id: p.id,
      timeId: p.timeId,
      campeonatoId: p.campeonatoId,
      pontuacao: p.pontuacao,
      saldoDeGols: p.saldoDeGols,
      vitorias: p.vitorias,
      empates: p.empates,
      derrotas: p.derrotas,
      golsPro: p.golsPro,
      golsSofridos: p.golsSofridos,
      visivel: p.visivel,
      deletedAt: p.deletedAt,
      posicao: index + 1,
      time: p.time
    }))
  };
}

async function listarOrdemClassificacao(campeonatoId) {
  const campeonatoIdNumerico = Number(campeonatoId);

  if (!Number.isInteger(campeonatoIdNumerico) || campeonatoIdNumerico <= 0) {
    throw new Error('campeonatoId invalido');
  }

  try {
    const campeonato = await prisma.campeonato.findUnique({
      where: { id: campeonatoIdNumerico },
      select: {
        id: true,
        nome: true,
        modalidadeId: true,
        modalidade: { select: { nome: true } },
        ordemClassificacao: true,
        regras: true,
        times: {
          where: { ativo: true, time: { deletedAt: null } },
          select: { timeId: true }
        }
      }
    });

    if (!campeonato) {
      throw new Error('Campeonato nao encontrado');
    }

    const timeIdsCampeonato = Array.isArray(campeonato.times)
      ? campeonato.times.map(item => Number(item.timeId))
      : [];

    return montarConfiguracaoClassificacao(campeonato, timeIdsCampeonato);
  } catch (error) {
    if (!deveUsarFallbackConfiguracaoClassificacao(error)) {
      throw error;
    }

    const campeonato = await prisma.campeonato.findUnique({
      where: { id: campeonatoIdNumerico },
      select: {
        id: true,
        nome: true,
        modalidadeId: true,
        modalidade: { select: { nome: true } },
        regras: true
      }
    });

    if (!campeonato) {
      throw new Error('Campeonato nao encontrado');
    }

    return montarConfiguracaoClassificacao(campeonato);
  }
}

module.exports = {
  atualizarPlacar,
  listarPlacarPorCampeonato,
  salvarOrdemClassificacao,
  listarOrdemClassificacao
};
