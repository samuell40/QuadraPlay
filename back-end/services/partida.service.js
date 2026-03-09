const prisma = require('../lib/prisma');

const CRITERIOS_CLASSIFICACAO = {
  FUTEBOL: new Set([
    'pontuacao',
    'vitorias',
    'saldoDeGols',
    'golsPro',
    'golsSofridos',
    'empates',
    'derrotas',
    'confrontoDireto',
    'sorteio'
  ]),
  VOLEI: new Set([
    'pontuacao',
    'vitorias',
    'diferencaSets',
    'diferencaPontos',
    'setsVencidos',
    'pontosAverage',
    'confrontoDireto',
    'derrotaWo',
    'sorteio'
  ]),
  BEACH_TENIS: new Set([
    'pontuacao',
    'vitorias',
    'diferencaSets',
    'diferencaGames',
    'setsVencidos',
    'gamesPro',
    'confrontoDireto',
    'derrotaWo',
    'sorteio'
  ])
};

const ORDEM_CRITERIOS_CLASSIFICACAO = {
  FUTEBOL: [
    'pontuacao',
    'vitorias',
    'saldoDeGols',
    'golsPro',
    'golsSofridos',
    'empates',
    'derrotas',
    'confrontoDireto',
    'sorteio'
  ],
  VOLEI: [
    'pontuacao',
    'vitorias',
    'diferencaSets',
    'diferencaPontos',
    'setsVencidos',
    'pontosAverage',
    'confrontoDireto',
    'derrotaWo',
    'sorteio'
  ],
  BEACH_TENIS: [
    'pontuacao',
    'vitorias',
    'diferencaSets',
    'diferencaGames',
    'setsVencidos',
    'gamesPro',
    'confrontoDireto',
    'derrotaWo',
    'sorteio'
  ]
};

function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function obterInicioDoProximoDia(dataBase = new Date()) {
  const data = new Date(dataBase);
  data.setHours(0, 0, 0, 0);
  data.setDate(data.getDate() + 1);
  return data;
}

function obterDataValidaPartida(valor) {
  if (!valor) return null;
  const data = valor instanceof Date ? new Date(valor.getTime()) : new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  data.setSeconds(0, 0);
  return data;
}

function obterChaveDataHoraPartida(valor) {
  const data = obterDataValidaPartida(valor);
  if (!data) return '';

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  return `${ano}-${mes}-${dia} ${hora}:${minuto}`;
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

function isBeachTenisModalidade(nomeModalidade) {
  const nome = normalizarTexto(nomeModalidade);
  return nome.includes('beach') && (nome.includes('tenis') || nome.includes('tennis'));
}

function isFutebolModalidadeExclusiva(nomeModalidade) {
  return normalizarTexto(nomeModalidade) === 'futebol';
}

function grupoCriteriosModalidade(nomeModalidade) {
  if (isBeachTenisModalidade(nomeModalidade)) {
    return 'BEACH_TENIS';
  }

  return grupoModalidade(nomeModalidade) === 'VOLEI' ? 'VOLEI' : 'FUTEBOL';
}

function regrasPadraoPorModalidade(nomeModalidade) {
  const grupo = grupoModalidade(nomeModalidade);

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
    };
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
  };
}

function normalizarRegrasCampeonato(regras, nomeModalidade) {
  return {
    ...regrasPadraoPorModalidade(nomeModalidade),
    ...(regras || {})
  };
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

function normalizarOrdemClassificacao(ordemClassificacao, nomeModalidade) {
  const grupo = grupoCriteriosModalidade(nomeModalidade);
  const criteriosValidos = CRITERIOS_CLASSIFICACAO[grupo] || CRITERIOS_CLASSIFICACAO.FUTEBOL;
  const ordemPadrao = ORDEM_CRITERIOS_CLASSIFICACAO[grupo] || ORDEM_CRITERIOS_CLASSIFICACAO.FUTEBOL;
  const ordemNormalizada = [];

  if (Array.isArray(ordemClassificacao)) {
    for (const criterio of ordemClassificacao) {
      const value = String(criterio?.value || '');
      if (!criteriosValidos.has(value) || ordemNormalizada.some(item => item.value === value)) {
        continue;
      }

      ordemNormalizada.push(criterio);
    }
  }

  for (const value of ordemPadrao) {
    if (ordemNormalizada.some(item => item.value === value)) {
      continue;
    }

    ordemNormalizada.push({ value });
  }

  return ordemNormalizada;
}

function compararValoresCriterio(criterio, valorA, valorB) {
  if (criterio === 'derrotaWo') {
    return valorA - valorB;
  }

  return valorB - valorA;
}

function somarEstatisticasSets(sets = []) {
  return (Array.isArray(sets) ? sets : []).reduce((acc, setAtual) => {
    acc.pontosA += Number(setAtual?.pontosA ?? 0) || 0;
    acc.pontosB += Number(setAtual?.pontosB ?? 0) || 0;
    acc.gamesA += Number(setAtual?.gamesA ?? 0) || 0;
    acc.gamesB += Number(setAtual?.gamesB ?? 0) || 0;
    return acc;
  }, {
    pontosA: 0,
    pontosB: 0,
    gamesA: 0,
    gamesB: 0
  });
}

async function recalcularPosicoesDoPlacar(
  campeonatoId,
  faseId,
  ordemClassificacao = [],
  regras = {},
  grupo = 'FUTEBOL',
  nomeModalidade = ''
) {
  const placares = await prisma.placar.findMany({
    where: {
      campeonatoId: Number(campeonatoId),
      faseId: faseId ? Number(faseId) : null,
      visivel: true,
      deletedAt: null
    },
    include: { time: true }
  });

  const ordem = normalizarOrdemClassificacao(ordemClassificacao, nomeModalidade);

  async function confrontoDiretoDiff(timeAId, timeBId) {
    const partidas = await prisma.partida.findMany({
      where: {
        campeonatoId: Number(campeonatoId),
        faseId: faseId ? Number(faseId) : null,
        status: 'FINALIZADA',
        OR: [
          { timeAId, timeBId },
          { timeAId: timeBId, timeBId: timeAId }
        ]
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

  const confrontoCache = new Map();

  async function getConfronto(aId, bId) {
    const chave = `${aId}-${bId}`;
    if (confrontoCache.has(chave)) return confrontoCache.get(chave);
    const valor = await confrontoDiretoDiff(aId, bId);
    confrontoCache.set(chave, valor);
    confrontoCache.set(`${bId}-${aId}`, -valor);
    return valor;
  }

  const copia = placares.slice();

  for (let i = 0; i < copia.length; i += 1) {
    for (let j = i + 1; j < copia.length; j += 1) {
      const a = copia[i];
      const b = copia[j];
      let resultado = 0;

      for (const criterio of ordem) {
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

      if (ordem.length === 0 && resultado === 0) {
        resultado = (b.pontuacao ?? 0) - (a.pontuacao ?? 0);
      }

      if (resultado > 0) {
        copia[i] = b;
        copia[j] = a;
      }
    }
  }

  for (let i = 0; i < copia.length; i += 1) {
    await prisma.placar.update({
      where: { id: copia[i].id },
      data: { posicao: i + 1 }
    });
  }
}

async function recalcularPlacarCampeonatoFase(campeonatoId, faseId) {
  if (!campeonatoId || !faseId) return;

  const campeonato = await prisma.campeonato.findUnique({
    where: { id: Number(campeonatoId) },
    select: {
      id: true,
      regras: true,
      ordemClassificacao: true,
      modalidade: { select: { nome: true } }
    }
  });

  if (!campeonato) return;

  const regras = normalizarRegrasCampeonato(campeonato.regras, campeonato.modalidade?.nome);
  const grupo = grupoModalidade(campeonato.modalidade?.nome);
  const isBeachTenis = isBeachTenisModalidade(campeonato.modalidade?.nome);

  const placares = await prisma.placar.findMany({
    where: {
      campeonatoId: Number(campeonatoId),
      faseId: Number(faseId),
      deletedAt: null
    }
  });

  const acumuladoPorTime = new Map();
  for (const p of placares) {
    acumuladoPorTime.set(p.timeId, {
      jogos: 0,
      pontuacao: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      golsPro: 0,
      golsSofridos: 0,
      saldoDeGols: 0,
      setsVencidos: 0,
      setsContra: 0,
      diferencaSets: 0,
      gamesPro: 0,
      gamesContra: 0,
      diferencaGames: 0,
      pontosPro: 0,
      pontosContra: 0,
      diferencaPontos: 0,
      pontosAverage: 0,
      derrotaWo: 0,
      aproveitamento: 0
    });
  }

  const partidasFinalizadas = await prisma.partida.findMany({
    where: {
      campeonatoId: Number(campeonatoId),
      faseId: Number(faseId),
      status: 'FINALIZADA'
    },
    select: {
      timeAId: true,
      timeBId: true,
      pontosTimeA: true,
      pontosTimeB: true,
      woTimeA: true,
      woTimeB: true,
      sets: {
        select: {
          pontosA: true,
          pontosB: true,
          gamesA: true,
          gamesB: true
        }
      }
    }
  });

  for (const partida of partidasFinalizadas) {
    const a = acumuladoPorTime.get(partida.timeAId);
    const b = acumuladoPorTime.get(partida.timeBId);
    if (!a || !b) continue;

    a.jogos += 1;
    b.jogos += 1;

    if (grupo === 'FUTEBOL') {
      const golsA = Number(partida.pontosTimeA) || 0;
      const golsB = Number(partida.pontosTimeB) || 0;

      a.golsPro += golsA;
      a.golsSofridos += golsB;
      a.saldoDeGols = a.golsPro - a.golsSofridos;

      b.golsPro += golsB;
      b.golsSofridos += golsA;
      b.saldoDeGols = b.golsPro - b.golsSofridos;

      if (golsA > golsB) {
        a.vitorias += 1;
        b.derrotas += 1;
        a.pontuacao += Number(regras.pontosVitoria) || 0;
        b.pontuacao += Number(regras.pontosDerrota) || 0;
      } else if (golsB > golsA) {
        b.vitorias += 1;
        a.derrotas += 1;
        b.pontuacao += Number(regras.pontosVitoria) || 0;
        a.pontuacao += Number(regras.pontosDerrota) || 0;
      } else {
        a.empates += 1;
        b.empates += 1;
        a.pontuacao += Number(regras.pontosEmpate) || 0;
        b.pontuacao += Number(regras.pontosEmpate) || 0;
      }
    } else {
      const setsA = Number(partida.pontosTimeA) || 0;
      const setsB = Number(partida.pontosTimeB) || 0;
      const woA = !!partida.woTimeA;
      const woB = !!partida.woTimeB;
      const totaisSets = somarEstatisticasSets(partida.sets);

      a.setsVencidos += setsA;
      a.setsContra += setsB;
      a.diferencaSets = a.setsVencidos - a.setsContra;
      b.setsVencidos += setsB;
      b.setsContra += setsA;
      b.diferencaSets = b.setsVencidos - b.setsContra;

      if (isBeachTenis) {
        a.gamesPro += totaisSets.gamesA;
        a.gamesContra += totaisSets.gamesB;
        a.diferencaGames = a.gamesPro - a.gamesContra;

        b.gamesPro += totaisSets.gamesB;
        b.gamesContra += totaisSets.gamesA;
        b.diferencaGames = b.gamesPro - b.gamesContra;
      } else {
        a.pontosPro += totaisSets.pontosA;
        a.pontosContra += totaisSets.pontosB;
        a.diferencaPontos = a.pontosPro - a.pontosContra;

        b.pontosPro += totaisSets.pontosB;
        b.pontosContra += totaisSets.pontosA;
        b.diferencaPontos = b.pontosPro - b.pontosContra;
      }

      if (woA && !woB) {
        a.derrotas += 1;
        a.derrotaWo += 1;
        b.vitorias += 1;
        const pts = calcularPontosVoleiParaResultado(setsB, setsA, regras);
        b.pontuacao += pts.pontosVencedor;
        a.pontuacao += pts.pontosPerdedor;
        continue;
      }

      if (woB && !woA) {
        b.derrotas += 1;
        b.derrotaWo += 1;
        a.vitorias += 1;
        const pts = calcularPontosVoleiParaResultado(setsA, setsB, regras);
        a.pontuacao += pts.pontosVencedor;
        b.pontuacao += pts.pontosPerdedor;
        continue;
      }

      if (setsA > setsB) {
        a.vitorias += 1;
        b.derrotas += 1;

        const pts = calcularPontosVoleiParaResultado(setsA, setsB, regras);
        a.pontuacao += pts.pontosVencedor;
        b.pontuacao += pts.pontosPerdedor;
      } else if (setsB > setsA) {
        b.vitorias += 1;
        a.derrotas += 1;

        const pts = calcularPontosVoleiParaResultado(setsB, setsA, regras);
        b.pontuacao += pts.pontosVencedor;
        a.pontuacao += pts.pontosPerdedor;
      }
    }
  }

  const maxPontosPartida = grupo === 'FUTEBOL'
    ? Number(regras.pontosVitoria) || 0
    : (regras.regraPontosVitoria === 'VITORIA_2_SEMPRE' ? 2 : 3);

  for (const placar of placares) {
    const novo = acumuladoPorTime.get(placar.timeId);
    if (!novo) continue;

    novo.aproveitamento = novo.jogos > 0 && maxPontosPartida > 0
      ? Math.round((novo.pontuacao / (novo.jogos * maxPontosPartida)) * 100)
      : 0;
    novo.diferencaSets = novo.setsVencidos - novo.setsContra;
    novo.diferencaGames = novo.gamesPro - novo.gamesContra;
    novo.diferencaPontos = novo.pontosPro - novo.pontosContra;
    novo.pontosAverage = novo.pontosContra > 0
      ? Number((novo.pontosPro / novo.pontosContra).toFixed(3))
      : (novo.pontosPro > 0 ? Number(novo.pontosPro) : 0);

    await prisma.placar.update({
      where: { id: placar.id },
      data: {
        jogos: novo.jogos,
        pontuacao: novo.pontuacao,
        vitorias: novo.vitorias,
        empates: novo.empates,
        derrotas: novo.derrotas,
        golsPro: novo.golsPro,
        golsSofridos: novo.golsSofridos,
        saldoDeGols: novo.saldoDeGols,
        setsVencidos: novo.setsVencidos,
        setsContra: novo.setsContra,
        diferencaSets: novo.diferencaSets,
        gamesPro: novo.gamesPro,
        gamesContra: novo.gamesContra,
        diferencaGames: novo.diferencaGames,
        pontosPro: novo.pontosPro,
        pontosContra: novo.pontosContra,
        diferencaPontos: novo.diferencaPontos,
        pontosAverage: novo.pontosAverage,
        derrotaWo: novo.derrotaWo,
        aproveitamento: novo.aproveitamento
      }
    });
  }

  await recalcularPosicoesDoPlacar(
    campeonatoId,
    faseId,
    campeonato.ordemClassificacao || [],
    regras,
    grupo,
    campeonato.modalidade?.nome
  );
}

async function validarSuspensaoJogador({ campeonatoId, faseId, jogadorId }) {
  const jogadorIdNum = Number(jogadorId);
  if (!campeonatoId || !jogadorIdNum) return;

  const suspensoes = await mapearSuspensaoJogadores({
    campeonatoId,
    faseId,
    jogadorIds: [jogadorIdNum]
  });

  const status = suspensoes.get(jogadorIdNum);
  if (!status?.suspenso) return;

  throw new Error(status.motivoSuspensao || 'Jogador suspenso.');
}

function extrairSuspensoesManuais(regras) {
  const lista = Array.isArray(regras?.suspensoesManuais) ? regras.suspensoesManuais : [];
  const mapa = new Map();

  for (const item of lista) {
    const jogadorId = Number(item?.jogadorId);
    if (!Number.isInteger(jogadorId) || jogadorId <= 0) continue;

    const suspenso = Boolean(item?.suspenso);
    const motivo = String(item?.motivo || '').trim();
    const timeId = Number(item?.timeId);
    const tipoDuracaoBase = String(item?.tipoDuracao || '').toUpperCase();
    const tipoDuracao = tipoDuracaoBase === 'PARTIDAS' ? 'PARTIDAS' : 'CAMPEONATO';
    const quantidadePartidasBruta = Number(item?.quantidadePartidas);
    const quantidadePartidas = tipoDuracao === 'PARTIDAS'
      && Number.isInteger(quantidadePartidasBruta)
      && quantidadePartidasBruta > 0
      && quantidadePartidasBruta <= 10
      ? quantidadePartidasBruta
      : null;

    mapa.set(jogadorId, {
      suspenso,
      motivoSuspensao: motivo || (suspenso
        ? 'Jogador suspenso manualmente pela administracao.'
        : 'Suspensao retirada manualmente pela administracao.'),
      atualizadoEm: item?.atualizadoEm || null,
      timeId: Number.isInteger(timeId) && timeId > 0 ? timeId : null,
      tipoDuracao: quantidadePartidas ? 'PARTIDAS' : 'CAMPEONATO',
      quantidadePartidas
    });
  }

  return mapa;
}

function normalizarDuracaoSuspensaoPartidas(valor) {
  const duracao = Number(valor);
  if (!Number.isFinite(duracao) || duracao <= 0) return 1;
  return Math.max(1, Math.trunc(duracao));
}

function possuiLimitesSuspensaoPorCartoes({ limiteAmarelos = NaN, limiteVermelhos = NaN } = {}) {
  const usaLimiteAmarelos = Number.isFinite(limiteAmarelos) && limiteAmarelos > 0;
  const usaLimiteVermelhos = Number.isFinite(limiteVermelhos) && limiteVermelhos > 0;
  return usaLimiteAmarelos || usaLimiteVermelhos;
}

async function carregarContextoSuspensao(campeonatoId, faseId) {
  if (!campeonatoId) return null;

  const campeonato = await prisma.campeonato.findUnique({
    where: { id: Number(campeonatoId) },
    select: {
      regras: true,
      modalidade: { select: { nome: true } }
    }
  });

  if (!campeonato) return null;

  const regras = normalizarRegrasCampeonato(campeonato.regras, campeonato.modalidade?.nome);
  const limiteAmarelos = Number(regras.suspensaoAmarelos);
  const limiteVermelhos = Number(regras.suspensaoVermelhos);
  const usaLimitesPorCartoes = possuiLimitesSuspensaoPorCartoes({
    limiteAmarelos,
    limiteVermelhos
  });
  const duracaoSuspensaoPartidas = normalizarDuracaoSuspensaoPartidas(regras.duracaoSuspensaoPartidas);
  const suspensoesManuais = extrairSuspensoesManuais(regras);

  if (!usaLimitesPorCartoes && !suspensoesManuais.size) {
    return {
      ativo: false,
      limiteAmarelos,
      limiteVermelhos,
      duracaoSuspensaoPartidas,
      filtrosPartida: null,
      suspensoesManuais
    };
  }

  let filtrosPartida = null;
  if (usaLimitesPorCartoes) {
    filtrosPartida = {
      campeonatoId: Number(campeonatoId),
      status: 'FINALIZADA'
    };

    const faseIdNum = Number(faseId);
    if ((regras.separarCartoesPorFase || regras.resetarCartoesCadaFase) && Number.isFinite(faseIdNum) && faseIdNum > 0) {
      filtrosPartida.faseId = faseIdNum;
    }
  }

  return {
    ativo: true,
    limiteAmarelos,
    limiteVermelhos,
    duracaoSuspensaoPartidas,
    filtrosPartida,
    suspensoesManuais
  };
}

function avaliarSuspensaoPorCartoes({
  amarelos = 0,
  vermelhos = 0,
  limiteAmarelos = NaN,
  limiteVermelhos = NaN
}) {
  const amarelosNum = Number(amarelos) || 0;
  const vermelhosNum = Number(vermelhos) || 0;

  const usaLimiteAmarelos = Number.isFinite(limiteAmarelos) && limiteAmarelos > 0;
  const usaLimiteVermelhos = Number.isFinite(limiteVermelhos) && limiteVermelhos > 0;

  const atingiuAmarelos = usaLimiteAmarelos && amarelosNum >= limiteAmarelos;
  const vermelhosEquivalentesPorAmarelos = atingiuAmarelos ? 1 : 0;
  const vermelhosConsiderados = vermelhosNum + vermelhosEquivalentesPorAmarelos;
  const atingiuVermelhos = usaLimiteVermelhos && vermelhosConsiderados >= limiteVermelhos;

  if (atingiuAmarelos) {
    return {
      suspenso: true,
      motivo: 'AMARELOS',
      motivoSuspensao: `Jogador suspenso: atingiu ${limiteAmarelos} cartoes amarelos (equivale a 1 cartao vermelho).`,
      amarelos: amarelosNum,
      vermelhos: vermelhosNum,
      vermelhosConsiderados
    };
  }

  if (atingiuVermelhos) {
    return {
      suspenso: true,
      motivo: 'VERMELHOS',
      motivoSuspensao: `Jogador suspenso: atingiu ${limiteVermelhos} cartoes vermelhos.`,
      amarelos: amarelosNum,
      vermelhos: vermelhosNum,
      vermelhosConsiderados
    };
  }

  return {
    suspenso: false,
    motivo: null,
    motivoSuspensao: null,
    amarelos: amarelosNum,
    vermelhos: vermelhosNum,
    vermelhosConsiderados
  };
}

async function mapearCartoesAcumuladosJogadores(jogadorIds, filtrosPartida) {
  const ids = Array.from(
    new Set((Array.isArray(jogadorIds) ? jogadorIds : [])
      .map(id => Number(id))
      .filter(id => Number.isFinite(id) && id > 0))
  );

  if (!ids.length || !filtrosPartida) {
    return new Map();
  }

  const acumulados = await prisma.jogadorPartida.groupBy({
    by: ['jogadorId'],
    where: {
      jogadorId: { in: ids },
      partida: { is: filtrosPartida }
    },
    _sum: {
      cartoesAmarelos: true,
      cartoesVermelhos: true
    }
  });

  const porJogador = new Map();
  for (const item of acumulados) {
    porJogador.set(Number(item.jogadorId), {
      amarelos: Number(item._sum?.cartoesAmarelos) || 0,
      vermelhos: Number(item._sum?.cartoesVermelhos) || 0
    });
  }

  return porJogador;
}

function criarChaveJogadorPartida(jogadorId, partidaId) {
  return `${Number(jogadorId)}:${Number(partidaId)}`;
}

async function mapearTimePorJogadorNoCampeonato(campeonatoId, jogadorIds) {
  const ids = Array.from(
    new Set((Array.isArray(jogadorIds) ? jogadorIds : [])
      .map(id => Number(id))
      .filter(id => Number.isFinite(id) && id > 0))
  );

  const resultado = new Map();
  if (!Number.isFinite(Number(campeonatoId)) || Number(campeonatoId) <= 0 || !ids.length) {
    return resultado;
  }

  const vinculos = await prisma.jogadorTime.findMany({
    where: {
      jogadorId: { in: ids },
      ativo: true,
      deletedAt: null,
      time: {
        campeonatos: {
          some: {
            campeonatoId: Number(campeonatoId),
            ativo: true,
            deletedAt: null
          }
        }
      }
    },
    select: {
      jogadorId: true,
      timeId: true
    },
    orderBy: [
      { jogadorId: 'asc' },
      { timeId: 'asc' }
    ]
  });

  for (const vinculo of vinculos) {
    const jogadorId = Number(vinculo?.jogadorId);
    const timeId = Number(vinculo?.timeId);
    if (!Number.isInteger(jogadorId) || jogadorId <= 0) continue;
    if (!Number.isInteger(timeId) || timeId <= 0) continue;
    if (!resultado.has(jogadorId)) {
      resultado.set(jogadorId, timeId);
    }
  }

  return resultado;
}

async function listarPartidasFinalizadasPorTimes(filtrosPartida, timeIds) {
  const ids = Array.from(
    new Set((Array.isArray(timeIds) ? timeIds : [])
      .map(id => Number(id))
      .filter(id => Number.isFinite(id) && id > 0))
  );

  if (!ids.length || !filtrosPartida) return [];

  return prisma.partida.findMany({
    where: {
      ...filtrosPartida,
      OR: [
        { timeAId: { in: ids } },
        { timeBId: { in: ids } }
      ]
    },
    select: {
      id: true,
      timeAId: true,
      timeBId: true,
      data: true,
      updatedAt: true,
      ultimaEdicaoEm: true
    },
    orderBy: [
      { data: 'asc' },
      { id: 'asc' }
    ]
  });
}

function indexarPartidasPorTime(partidas) {
  const mapa = new Map();

  for (const partida of Array.isArray(partidas) ? partidas : []) {
    const timeAId = Number(partida?.timeAId);
    const timeBId = Number(partida?.timeBId);

    if (Number.isInteger(timeAId) && timeAId > 0) {
      if (!mapa.has(timeAId)) mapa.set(timeAId, []);
      mapa.get(timeAId).push(partida);
    }

    if (Number.isInteger(timeBId) && timeBId > 0) {
      if (!mapa.has(timeBId)) mapa.set(timeBId, []);
      mapa.get(timeBId).push(partida);
    }
  }

  return mapa;
}

async function mapearAtuacoesJogadoresPorPartida(jogadorIds, partidaIds) {
  const idsJogadores = Array.from(
    new Set((Array.isArray(jogadorIds) ? jogadorIds : [])
      .map(id => Number(id))
      .filter(id => Number.isFinite(id) && id > 0))
  );

  const idsPartidas = Array.from(
    new Set((Array.isArray(partidaIds) ? partidaIds : [])
      .map(id => Number(id))
      .filter(id => Number.isFinite(id) && id > 0))
  );

  const resultado = new Map();
  if (!idsJogadores.length || !idsPartidas.length) return resultado;

  const atuacoes = await prisma.jogadorPartida.findMany({
    where: {
      jogadorId: { in: idsJogadores },
      partidaId: { in: idsPartidas }
    },
    select: {
      jogadorId: true,
      partidaId: true,
      cartoesAmarelos: true,
      cartoesVermelhos: true
    }
  });

  for (const atuacao of atuacoes) {
    const jogadorId = Number(atuacao?.jogadorId);
    const partidaId = Number(atuacao?.partidaId);
    if (!Number.isInteger(jogadorId) || jogadorId <= 0) continue;
    if (!Number.isInteger(partidaId) || partidaId <= 0) continue;

    const chave = criarChaveJogadorPartida(jogadorId, partidaId);
    const acumulado = resultado.get(chave) || {
      cartoesAmarelos: 0,
      cartoesVermelhos: 0
    };

    acumulado.cartoesAmarelos += Number(atuacao?.cartoesAmarelos) || 0;
    acumulado.cartoesVermelhos += Number(atuacao?.cartoesVermelhos) || 0;
    resultado.set(chave, acumulado);
  }

  return resultado;
}

function formatarMensagemSuspensaoPendente(motivoBase, partidasRestantes) {
  const quantidade = Number(partidasRestantes) || 0;
  if (quantidade <= 0) return motivoBase || 'Jogador suspenso.';

  const textoPartidas = `${quantidade} ${quantidade === 1 ? 'partida' : 'partidas'}`;
  const motivo = String(motivoBase || 'Jogador suspenso.').trim();
  return `${motivo} Suspensao em andamento: restam ${textoPartidas} para cumprir.`;
}

function obterTimestampValido(valor) {
  if (!valor) return null;
  const timestamp = new Date(valor).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function obterTimestampReferenciaPartidaFinalizada(partida) {
  return obterTimestampValido(partida?.ultimaEdicaoEm)
    ?? obterTimestampValido(partida?.updatedAt)
    ?? obterTimestampValido(partida?.data)
    ?? 0;
}

function calcularPartidasRestantesSuspensaoManual({
  suspensaoManual = {},
  partidasDoTime = []
}) {
  const quantidade = Number(suspensaoManual?.quantidadePartidas);
  if (!Number.isInteger(quantidade) || quantidade <= 0) return 0;

  const aplicadoEm = obterTimestampValido(suspensaoManual?.atualizadoEm);
  if (!aplicadoEm) return quantidade;

  let partidasCumpridas = 0;
  for (const partida of Array.isArray(partidasDoTime) ? partidasDoTime : []) {
    const referenciaPartida = obterTimestampReferenciaPartidaFinalizada(partida);
    if (referenciaPartida > aplicadoEm) {
      partidasCumpridas += 1;
    }
  }

  return Math.max(quantidade - partidasCumpridas, 0);
}

function calcularStatusSuspensaoAutomaticaComHistorico({
  jogadorId,
  partidasDoTime = [],
  atuacoesPorPartida = new Map(),
  limiteAmarelos = NaN,
  limiteVermelhos = NaN,
  duracaoSuspensaoPartidas = 1
}) {
  const idJogador = Number(jogadorId);
  if (!Number.isInteger(idJogador) || idJogador <= 0) {
    return {
      suspenso: false,
      motivo: null,
      motivoSuspensao: null,
      partidasRestantesSuspensao: 0
    };
  }

  const duracao = normalizarDuracaoSuspensaoPartidas(duracaoSuspensaoPartidas);
  let amarelosAcumulados = 0;
  let vermelhosAcumulados = 0;
  let suspensoesPendentes = 0;
  let ultimoMotivoSuspensao = null;

  for (const partida of Array.isArray(partidasDoTime) ? partidasDoTime : []) {
    if (suspensoesPendentes > 0) {
      suspensoesPendentes -= 1;
    }

    const chave = criarChaveJogadorPartida(idJogador, Number(partida?.id));
    const atuacao = atuacoesPorPartida.get(chave);
    if (!atuacao) continue;

    amarelosAcumulados += Number(atuacao.cartoesAmarelos) || 0;
    vermelhosAcumulados += Number(atuacao.cartoesVermelhos) || 0;

    let statusCartoes = avaliarSuspensaoPorCartoes({
      amarelos: amarelosAcumulados,
      vermelhos: vermelhosAcumulados,
      limiteAmarelos,
      limiteVermelhos
    });

    while (statusCartoes.suspenso) {
      suspensoesPendentes += duracao;
      ultimoMotivoSuspensao = statusCartoes.motivoSuspensao;

      if (statusCartoes.motivo === 'AMARELOS') {
        amarelosAcumulados = Math.max(0, amarelosAcumulados - (Number(limiteAmarelos) || 0));
      } else if (statusCartoes.motivo === 'VERMELHOS') {
        vermelhosAcumulados = Math.max(0, vermelhosAcumulados - (Number(limiteVermelhos) || 0));
      } else {
        break;
      }

      statusCartoes = avaliarSuspensaoPorCartoes({
        amarelos: amarelosAcumulados,
        vermelhos: vermelhosAcumulados,
        limiteAmarelos,
        limiteVermelhos
      });
    }
  }

  if (suspensoesPendentes > 0) {
    return {
      suspenso: true,
      motivo: 'SUSPENSAO_EM_ANDAMENTO',
      motivoSuspensao: formatarMensagemSuspensaoPendente(ultimoMotivoSuspensao, suspensoesPendentes),
      partidasRestantesSuspensao: suspensoesPendentes
    };
  }

  return {
    suspenso: false,
    motivo: null,
    motivoSuspensao: null,
    partidasRestantesSuspensao: 0
  };
}

async function mapearSuspensaoJogadores({ campeonatoId, faseId, jogadorIds }) {
  const ids = Array.from(
    new Set((Array.isArray(jogadorIds) ? jogadorIds : [])
      .map(id => Number(id))
      .filter(id => Number.isFinite(id) && id > 0))
  );

  const resultado = new Map();
  if (!ids.length || !campeonatoId) return resultado;

  const contexto = await carregarContextoSuspensao(campeonatoId, faseId);
  if (!contexto?.ativo) return resultado;

  const cartoesPorJogador = await mapearCartoesAcumuladosJogadores(ids, contexto.filtrosPartida);
  const usaLimitesPorCartoes = possuiLimitesSuspensaoPorCartoes(contexto);
  const statusAutomaticoPorJogador = new Map();

  if (usaLimitesPorCartoes) {
    const timePorJogador = await mapearTimePorJogadorNoCampeonato(campeonatoId, ids);
    const timeIds = Array.from(new Set(Array.from(timePorJogador.values())));
    const partidasFinalizadas = await listarPartidasFinalizadasPorTimes(contexto.filtrosPartida, timeIds);
    const partidasPorTime = indexarPartidasPorTime(partidasFinalizadas);
    const atuacoesPorPartida = await mapearAtuacoesJogadoresPorPartida(
      ids,
      partidasFinalizadas.map(partida => Number(partida.id))
    );

    for (const jogadorId of ids) {
      const timeId = timePorJogador.get(jogadorId);
      if (!timeId) continue;

      const partidasDoTime = partidasPorTime.get(timeId) || [];
      const statusAutomatico = calcularStatusSuspensaoAutomaticaComHistorico({
        jogadorId,
        partidasDoTime,
        atuacoesPorPartida,
        limiteAmarelos: contexto.limiteAmarelos,
        limiteVermelhos: contexto.limiteVermelhos,
        duracaoSuspensaoPartidas: contexto.duracaoSuspensaoPartidas
      });

      statusAutomaticoPorJogador.set(jogadorId, statusAutomatico);
    }
  }

  const jogadoresComSuspensaoManualPorPartidas = ids.filter((jogadorId) => {
    const suspensaoManual = contexto.suspensoesManuais?.get(jogadorId);
    return Boolean(
      suspensaoManual?.suspenso
      && suspensaoManual?.tipoDuracao === 'PARTIDAS'
      && Number.isInteger(Number(suspensaoManual?.quantidadePartidas))
      && Number(suspensaoManual?.quantidadePartidas) > 0
    );
  });

  const timePorJogadorSuspensaoManual = new Map();
  const partidasPorTimeSuspensaoManual = new Map();

  if (jogadoresComSuspensaoManualPorPartidas.length) {
    const jogadoresSemTimeDefinido = [];

    for (const jogadorId of jogadoresComSuspensaoManualPorPartidas) {
      const suspensaoManual = contexto.suspensoesManuais?.get(jogadorId);
      const timeManual = Number(suspensaoManual?.timeId);
      if (Number.isInteger(timeManual) && timeManual > 0) {
        timePorJogadorSuspensaoManual.set(jogadorId, timeManual);
      } else {
        jogadoresSemTimeDefinido.push(jogadorId);
      }
    }

    if (jogadoresSemTimeDefinido.length) {
      const timePorJogador = await mapearTimePorJogadorNoCampeonato(campeonatoId, jogadoresSemTimeDefinido);
      for (const [jogadorId, timeId] of timePorJogador.entries()) {
        timePorJogadorSuspensaoManual.set(jogadorId, timeId);
      }
    }

    const timeIds = Array.from(new Set(
      Array.from(timePorJogadorSuspensaoManual.values())
        .map(id => Number(id))
        .filter(id => Number.isInteger(id) && id > 0)
    ));

    if (timeIds.length) {
      const partidasFinalizadas = await listarPartidasFinalizadasPorTimes(
        {
          campeonatoId: Number(campeonatoId),
          status: 'FINALIZADA'
        },
        timeIds
      );
      const indexadoPorTime = indexarPartidasPorTime(partidasFinalizadas);
      for (const [timeId, partidas] of indexadoPorTime.entries()) {
        partidasPorTimeSuspensaoManual.set(timeId, partidas);
      }
    }
  }

  for (const jogadorId of ids) {
    const cartoes = cartoesPorJogador.get(jogadorId) || { amarelos: 0, vermelhos: 0 };
    const suspensaoManual = contexto.suspensoesManuais?.get(jogadorId);
    if (suspensaoManual) {
      if (suspensaoManual.suspenso) {
        if (suspensaoManual.tipoDuracao === 'PARTIDAS') {
          const timeId = Number(suspensaoManual.timeId || timePorJogadorSuspensaoManual.get(jogadorId) || 0);
          const partidasDoTime = partidasPorTimeSuspensaoManual.get(timeId) || [];
          const partidasRestantes = calcularPartidasRestantesSuspensaoManual({
            suspensaoManual,
            partidasDoTime
          });

          if (partidasRestantes > 0) {
            resultado.set(jogadorId, {
              suspenso: true,
              motivo: 'MANUAL',
              motivoSuspensao: formatarMensagemSuspensaoPendente(
                suspensaoManual.motivoSuspensao,
                partidasRestantes
              ),
              amarelos: cartoes.amarelos,
              vermelhos: cartoes.vermelhos,
              vermelhosConsiderados: cartoes.vermelhos,
              origemSuspensao: 'MANUAL',
              suspensaoManual: true,
              partidasRestantesSuspensao: partidasRestantes
            });
          } else {
            resultado.set(jogadorId, {
              suspenso: false,
              motivo: null,
              motivoSuspensao: null,
              amarelos: cartoes.amarelos,
              vermelhos: cartoes.vermelhos,
              vermelhosConsiderados: cartoes.vermelhos,
              origemSuspensao: 'MANUAL_EXPIRADA',
              suspensaoManual: false,
              partidasRestantesSuspensao: 0
            });
          }
          continue;
        }

        resultado.set(jogadorId, {
          suspenso: true,
          motivo: 'MANUAL',
          motivoSuspensao: suspensaoManual.motivoSuspensao,
          amarelos: cartoes.amarelos,
          vermelhos: cartoes.vermelhos,
          vermelhosConsiderados: cartoes.vermelhos,
          origemSuspensao: 'MANUAL',
          suspensaoManual: true,
          partidasRestantesSuspensao: 0
        });
      } else {
        resultado.set(jogadorId, {
          suspenso: false,
          motivo: null,
          motivoSuspensao: null,
          amarelos: cartoes.amarelos,
          vermelhos: cartoes.vermelhos,
          vermelhosConsiderados: cartoes.vermelhos,
          origemSuspensao: 'MANUAL_LIBERADA',
          suspensaoManual: false,
          partidasRestantesSuspensao: 0
        });
      }
      continue;
    }

    const statusPorCartoes = statusAutomaticoPorJogador.get(jogadorId) || avaliarSuspensaoPorCartoes({
      amarelos: cartoes.amarelos,
      vermelhos: cartoes.vermelhos,
      limiteAmarelos: contexto.limiteAmarelos,
      limiteVermelhos: contexto.limiteVermelhos
    });

    resultado.set(jogadorId, {
      ...statusPorCartoes,
      amarelos: cartoes.amarelos,
      vermelhos: cartoes.vermelhos,
      vermelhosConsiderados: cartoes.vermelhos,
      origemSuspensao: statusPorCartoes.suspenso ? 'AUTOMATICA' : null,
      suspensaoManual: null
    });
  }

  return resultado;
}

async function listarJogadoresParaEscalacao({ campeonatoId, faseId, timeId }) {
  const timeIdNum = Number(timeId);
  if (!timeIdNum) throw new Error('timeId invalido');

  const campeonatoIdNum = Number(campeonatoId);

  const [time, campeonato] = await Promise.all([
    prisma.time.findUnique({
      where: { id: timeIdNum },
      include: {
        jogadores: {
          include: {
            jogador: {
              include: {
                funcao: true,
                atuacoes: true
              }
            }
          }
        }
      }
    }),
    Number.isInteger(campeonatoIdNum) && campeonatoIdNum > 0
      ? prisma.campeonato.findUnique({
        where: { id: campeonatoIdNum },
        select: { modalidadeId: true }
      })
      : Promise.resolve(null)
  ]);

  if (!time) throw new Error('Time nao encontrado');

  const modalidadeReferenciaId = Number(campeonato?.modalidadeId || time.modalidadeId || 0);

  const jogadoresBase = time.jogadores
    .map(jt => jt?.jogador)
    .filter(Boolean)
    .map(j => ({
      id: j.id,
      nome: j.nome,
      numero: j.numero,
      foto: j.foto,
      funcao: (
        modalidadeReferenciaId > 0 &&
        Number(j?.funcao?.modalidadeId) === modalidadeReferenciaId
      ) ? j.funcao : null,
      atuacoes: j.atuacoes
    }));

  const suspensoes = await mapearSuspensaoJogadores({
    campeonatoId,
    faseId,
    jogadorIds: jogadoresBase.map(j => j.id)
  });

  return jogadoresBase.map(jogador => {
    const suspensao = suspensoes.get(Number(jogador.id));
    return {
      ...jogador,
      suspenso: !!suspensao?.suspenso,
      motivoSuspensao: suspensao?.motivoSuspensao || null
    };
  });
}

async function criarPartida(data, usuarioId) {
  const modalidadeId = Number(data.modalidadeId);
  const timeAId = Number(data.timeAId);
  const timeBId = Number(data.timeBId);
  const campeonatoId = Number(data.campeonatoId);
  const faseId = Number(data.faseId);
  const rodadaId = Number(data.rodadaId);
  const usuarioCriadorId = Number(usuarioId);
  const quadraId = Number(data.quadraId);
  const dataPartida = data?.data ? new Date(data.data) : null;
  const statusPartida = String(data?.status || 'AGENDADA').toUpperCase();
  const statusPermitidos = new Set(['AGENDADA', 'ADIADA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA']);

  if (!statusPermitidos.has(statusPartida)) {
    throw new Error('Status de partida inválido.');
  }

  if (['AGENDADA', 'ADIADA'].includes(statusPartida) && (!dataPartida || Number.isNaN(dataPartida.getTime()))) {
    throw new Error('Data da partida é obrigatória para agendamento.');
  }

  if (dataPartida && Number.isNaN(dataPartida.getTime())) {
    throw new Error('Data da partida inválida.');
  }

  if (['AGENDADA', 'ADIADA'].includes(statusPartida) && dataPartida < obterInicioDoProximoDia()) {
    throw new Error('A data da partida deve ser a partir de amanha.');
  }

  const quadraIdFinal = quadraId || null;

  if (statusPartida === 'AGENDADA') {
    const campeonato = await prisma.campeonato.findUnique({
      where: { id: campeonatoId },
      select: {
        id: true,
        quadraId: true,
        agendamentos: {
          where: {
            deletedAt: null,
            status: 'Confirmado'
          },
          select: {
            datahora: true
          }
        }
      }
    });

    if (!campeonato) {
      throw new Error('Campeonato nao encontrado.');
    }

    const chavePartida = obterChaveDataHoraPartida(dataPartida);
    const slotValido = (campeonato.agendamentos || []).some((agendamento) =>
      obterChaveDataHoraPartida(agendamento?.datahora) === chavePartida
    );

    if (!slotValido) {
      throw new Error('A data da partida deve usar um horario cadastrado na agenda do campeonato.');
    }

    const conflitoPartida = await prisma.partida.findFirst({
      where: {
        campeonatoId,
        quadraId: quadraIdFinal || campeonato.quadraId || undefined,
        data: dataPartida,
        status: { notIn: ['CANCELADA', 'DELETADA'] }
      },
      select: { id: true }
    });

    if (conflitoPartida) {
      throw new Error('Ja existe uma partida agendada para esse horario.');
    }
  }

  const dataCreate = {
    status: statusPartida,
    data: dataPartida || new Date(),

    modalidade: {
      connect: { id: modalidadeId }
    },

    campeonato: {
      connect: { id: campeonatoId }
    },

    fase: {
      connect: { id: faseId }
    },

    rodada: {
      connect: { id: rodadaId }
    },

    timeA: {
      connect: { id: timeAId }
    },

    timeB: {
      connect: { id: timeBId }
    },

    usuarioCriador: {
      connect: { id: usuarioCriadorId }
    }
  };

  if (statusPartida === 'EM_ANDAMENTO') {
    dataCreate.inicioPartida = new Date();
  }

  if (quadraIdFinal) {
    dataCreate.quadra = {
      connect: { id: quadraIdFinal }
    };
  }

  const partida = await prisma.partida.create({
    data: dataCreate,
    include: {
      campeonato: true,
      modalidade: true,
      fase: true,
      rodada: true,
      timeA: true,
      timeB: true,
      quadra: true,
      usuarioCriador: true
    }
  });

  return partida;
}

async function iniciarPartida(partidaId, jogadores) {

  return await prisma.$transaction(async (tx) => {

    const partida = await tx.partida.findUnique({
      where: { id: Number(partidaId) },
      select: {
        id: true,
        campeonatoId: true,
        faseId: true
      }
    });

    // Atualiza status
    const partidaAtualizada = await tx.partida.update({
      where: { id: Number(partidaId) },
      data: {
        status: "EM_ANDAMENTO",
        inicioPartida: new Date(),
      }
    });

    // Vincula jogadores da partida sem duplicar cadastro para o mesmo jogador.
    if (Array.isArray(jogadores) && jogadores.length > 0) {
      const jogadoresNormalizados = jogadores
        .map(j => ({
          jogadorId: Number(j?.jogadorId),
          timeId: Number(j?.timeId)
        }))
        .filter(j => j.jogadorId > 0 && j.timeId > 0)

      const jogadoresPorId = new Map()
      for (const j of jogadoresNormalizados) {
        jogadoresPorId.set(j.jogadorId, j)
      }
      const jogadoresUnicos = Array.from(jogadoresPorId.values())
      const idsJogadores = jogadoresUnicos.map(j => j.jogadorId)

      const suspensoes = await mapearSuspensaoJogadores({
        campeonatoId: partida.campeonatoId,
        faseId: partida.faseId,
        jogadorIds: idsJogadores
      });

      for (const j of jogadoresUnicos) {
        const status = suspensoes.get(j.jogadorId);
        if (!status?.suspenso) continue;
        throw new Error(status.motivoSuspensao || 'Jogador suspenso.');
      }

      const vinculosExistentes = await tx.jogadorPartida.findMany({
        where: {
          partidaId: Number(partidaId),
          jogadorId: { in: idsJogadores }
        },
        select: { jogadorId: true }
      })

      const idsExistentes = new Set(vinculosExistentes.map(v => Number(v.jogadorId)))

      if (idsExistentes.size > 0) {
        await tx.jogadorPartida.updateMany({
          where: {
            partidaId: Number(partidaId),
            jogadorId: { in: Array.from(idsExistentes) }
          },
          data: { emCampo: true }
        })
      }

      const novosVinculos = jogadoresUnicos.filter(j => !idsExistentes.has(j.jogadorId))

      if (novosVinculos.length > 0) {
        await tx.jogadorPartida.createMany({
          data: novosVinculos.map(j => ({
            partidaId: Number(partidaId),
            jogadorId: j.jogadorId,
            timeId: j.timeId,
            emCampo: true
          }))
        })
      }
    }

    return partidaAtualizada;
  });
}

async function retornarPartida(partidaId) {
  const partida = await prisma.partida.findFirst({
    where: {
      id: Number(partidaId),
      status: {
        in: ['AGENDADA', 'ADIADA', 'EM_ANDAMENTO', 'FINALIZADA']
      }
    },
    select: {
      id: true,
      data: true,
      tempoSegundos: true,
      pontosTimeA: true,
      pontosTimeB: true,
      faltasTimeA: true,
      faltasTimeB: true,
      substituicoesTimeA: true,
      substituicoesTimeB: true,
      cartoesAmarelosTimeA: true,
      cartoesVermelhosTimeA: true,
      cartoesAmarelosTimeB: true,
      cartoesVermelhosTimeB: true,
      woTimeA: true,
      woTimeB: true,
      modalidadeId: true,
      quadraId: true,
      campeonatoId: true,
      faseId: true,
      rodadaId: true,
      timeAId: true,
      timeBId: true,
      inicioPartida: true,
      status: true,
      ultimaEdicaoEm: true,
      modalidade: true,
      campeonato: {
        select: {
          id: true,
          nome: true,
          regras: true,
          quadra: {
            select: {
              id: true,
              nome: true
            }
          },
          modalidade: {
            select: { nome: true }
          }
        }
      },
      quadra: true,
      timeA: true,
      timeB: true,
      sets: {
        orderBy: { numero: 'asc' }
      },

      jogadoresPartida: {
        include: {
          jogador: {
            include: {
              funcao: true,
              times: { include: { time: true } }
            }
          }
        }
      },
      participantes: {
        include: { usuario: true, permissao: true }
      },

      usuarioCriador: true,
      usuarioUltimaEdicao: {
        select: {
          id: true,
          nome: true
        }
      }
    }
  });

  return {
    id: partida.id,
    data: partida.data,
    tempoSegundos: partida.tempoSegundos,
    pontosTimeA: partida.pontosTimeA,
    pontosTimeB: partida.pontosTimeB,
    faltasTimeA: partida.faltasTimeA,
    faltasTimeB: partida.faltasTimeB,
    substituicoesTimeA: partida.substituicoesTimeA,
    substituicoesTimeB: partida.substituicoesTimeB,
    cartoesAmarelosTimeA: partida.cartoesAmarelosTimeA,
    cartoesVermelhosTimeA: partida.cartoesVermelhosTimeA,
    cartoesAmarelosTimeB: partida.cartoesAmarelosTimeB,
    cartoesVermelhosTimeB: partida.cartoesVermelhosTimeB,
    woTimeA: partida.woTimeA,
    woTimeB: partida.woTimeB,
    modalidadeId: partida.modalidadeId,
    quadraId: partida.quadraId,
    campeonatoId: partida.campeonatoId,
    faseId: partida.faseId,
    rodadaId: partida.rodadaId,
    timeAId: partida.timeAId,
    timeBId: partida.timeBId,
    inicioPartida: partida.inicioPartida,
    status: partida.status,
    modalidade: partida.modalidade,
    campeonato: partida.campeonato
      ? {
          ...partida.campeonato,
          regras: normalizarRegrasCampeonato(
            partida.campeonato.regras,
            partida.campeonato.modalidade?.nome || partida.modalidade?.nome
          )
        }
      : null,
    quadra: partida.quadra,
    timeA: partida.timeA,
    timeB: partida.timeB,
    sets: partida.sets,
    jogadoresPartida: partida.jogadoresPartida,
    participantes: partida.participantes,
    usuarioCriador: partida.usuarioCriador,
    ultimaEdicaoEm: partida.ultimaEdicaoEm,
    usuarioUltimaEdicao: partida.usuarioUltimaEdicao
  };

}

async function finalizarPartida(partidaId, payload = null, usuarioEditorId = null) {
  const idNum = Number(partidaId)
  const editorIdNum = Number(usuarioEditorId)
  const dadosEdicao = Number.isFinite(editorIdNum) && editorIdNum > 0
    ? {
        usuarioUltimaEdicaoId: editorIdNum,
        ultimaEdicaoEm: new Date()
      }
    : {}

  const partida = await prisma.partida.findUnique({
    where: { id: idNum },
    select: { id: true, status: true }
  })

  if (partida.status === 'FINALIZADA') {
    if (payload && Object.keys(payload).length) {
      const partidaComContexto = await prisma.partida.update({
        where: { id: idNum },
        data: {
          ...payload,
          ...dadosEdicao
        },
        select: {
          campeonatoId: true,
          faseId: true
        }
      })

      await recalcularPlacarCampeonatoFase(partidaComContexto.campeonatoId, partidaComContexto.faseId)
    }

    const atualizada = await retornarPartida(idNum)
    return { mensagem: 'Dados atualizados sem alterar o status.', partida: atualizada }
  }

  if (partida.status !== 'EM_ANDAMENTO') {
    throw new Error(`Não é possível finalizar: status atual é ${partida.status}.`)
  }

  const partidaFinalizada = await prisma.partida.update({
    where: { id: idNum },
    data: {
      status: 'FINALIZADA'
    },
    select: {
      campeonatoId: true,
      faseId: true
    }
  })

  await recalcularPlacarCampeonatoFase(partidaFinalizada.campeonatoId, partidaFinalizada.faseId)

  const atualizada = await retornarPartida(idNum)
  return { mensagem: 'Partida finalizada com sucesso.', partida: atualizada }
}

async function atualizarParcial(
  id,
  {
    pontosTimeA,
    pontosTimeB,
    tempoSegundos,
    woTimeA,
    woTimeB,
    sets,
    faltasTimeA,
    faltasTimeB,
    substituicoesTimeA,
    substituicoesTimeB,
    cartoesAmarelosTimeA,
    cartoesVermelhosTimeA,
    cartoesAmarelosTimeB,
    cartoesVermelhosTimeB
  },
  usuarioEditorId = null
) {
  const partidaId = Number(id)

  const partidaBase = await prisma.partida.findUnique({
    where: { id: partidaId },
    include: { modalidade: true }
  })

  if (!partidaBase) throw new Error('Partida não encontrada')

  const modalidade = (partidaBase.modalidade.nome || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const isVolei = modalidade.includes('volei')
  const isFutebol = modalidade.includes('futebol')
  const isFutsal = modalidade.includes('futsal')
  const isBeachTenis = isBeachTenisModalidade(modalidade)
  let regrasCampeonato = null

  if (isVolei || isBeachTenis) {
    const campeonato = await prisma.campeonato.findUnique({
      where: { id: Number(partidaBase.campeonatoId) },
      select: {
        regras: true,
        modalidade: { select: { nome: true } }
      }
    })

    regrasCampeonato = normalizarRegrasCampeonato(
      campeonato?.regras,
      campeonato?.modalidade?.nome || partidaBase.modalidade?.nome
    )
  }

  const dataUpdate = {}

  if (pontosTimeA !== undefined) dataUpdate.pontosTimeA = Number(pontosTimeA)
  if (pontosTimeB !== undefined) dataUpdate.pontosTimeB = Number(pontosTimeB)
  if (tempoSegundos !== undefined) dataUpdate.tempoSegundos = Number(tempoSegundos)
  if (woTimeA !== undefined) dataUpdate.woTimeA = !!woTimeA
  if (woTimeB !== undefined) dataUpdate.woTimeB = !!woTimeB

  if (isFutebol || isFutsal) {
    if (faltasTimeA !== undefined) dataUpdate.faltasTimeA = Number(faltasTimeA)
    if (faltasTimeB !== undefined) dataUpdate.faltasTimeB = Number(faltasTimeB)

    if (substituicoesTimeA !== undefined) dataUpdate.substituicoesTimeA = Number(substituicoesTimeA)
    if (substituicoesTimeB !== undefined) dataUpdate.substituicoesTimeB = Number(substituicoesTimeB)

    if (cartoesAmarelosTimeA !== undefined) dataUpdate.cartoesAmarelosTimeA = Number(cartoesAmarelosTimeA)
    if (cartoesVermelhosTimeA !== undefined) dataUpdate.cartoesVermelhosTimeA = Number(cartoesVermelhosTimeA)

    if (cartoesAmarelosTimeB !== undefined) dataUpdate.cartoesAmarelosTimeB = Number(cartoesAmarelosTimeB)
    if (cartoesVermelhosTimeB !== undefined) dataUpdate.cartoesVermelhosTimeB = Number(cartoesVermelhosTimeB)
  }

  if ((isVolei || isBeachTenis) && Array.isArray(sets)) {
    const maxSets = Math.max(1, Number(regrasCampeonato?.quantidadeSetsPartida ?? 5))
    const setsA = Number(dataUpdate.pontosTimeA ?? partidaBase.pontosTimeA ?? 0)
    const setsB = Number(dataUpdate.pontosTimeB ?? partidaBase.pontosTimeB ?? 0)

    if (setsA < 0 || setsB < 0) {
      throw new Error('Quantidade de sets nao pode ser negativa.')
    }

    if (setsA > maxSets || setsB > maxSets || (setsA + setsB) > maxSets) {
      throw new Error(`Quantidade de sets por partida excede o limite configurado (${maxSets}).`)
    }

    for (const set of sets) {
      const numeroSet = Number(set.numero)
      const pontosASet = Number(set.pontosA ?? 0)
      const pontosBSet = Number(set.pontosB ?? 0)
      const gamesASet = Number(set.gamesA ?? 0)
      const gamesBSet = Number(set.gamesB ?? 0)

      if (numeroSet < 1 || numeroSet > maxSets) {
        throw new Error(`Set invalido. O numero do set deve ficar entre 1 e ${maxSets}.`)
      }

      if (pontosASet < 0 || pontosBSet < 0 || gamesASet < 0 || gamesBSet < 0) {
        throw new Error('Pontos e games do set nao podem ser negativos.')
      }

      await prisma.setPartida.upsert({
        where: {
          partidaId_numero: {
            partidaId,
            numero: numeroSet
          }
        },
        update: {
          pontosA: pontosASet,
          pontosB: pontosBSet,
          gamesA: gamesASet,
          gamesB: gamesBSet
        },
        create: {
          partidaId,
          numero: numeroSet,
          pontosA: pontosASet,
          pontosB: pontosBSet,
          gamesA: gamesASet,
          gamesB: gamesBSet
        }
      })
    }
  }

  const editorIdNum = Number(usuarioEditorId)
  if (
    partidaBase.status === 'FINALIZADA' &&
    Number.isFinite(editorIdNum) &&
    editorIdNum > 0
  ) {
    dataUpdate.usuarioUltimaEdicaoId = editorIdNum
    dataUpdate.ultimaEdicaoEm = new Date()
  }

  await prisma.partida.update({
    where: { id: partidaId },
    data: dataUpdate
  })

  if (partidaBase.status === 'FINALIZADA') {
    await recalcularPlacarCampeonatoFase(partidaBase.campeonatoId, partidaBase.faseId)
  }

  const partidaAtualizada = await prisma.partida.findUnique({
    where: { id: partidaId },
    include: {
      campeonato: {
        select: {
          id: true,
          nome: true,
          quadra: {
            select: {
              id: true,
              nome: true
            }
          }
        }
      },
      quadra: {
        select: {
          id: true,
          nome: true,
          endereco: true
        }
      },
      timeA: { include: { placares: true } },
      timeB: { include: { placares: true } },
      modalidade: true,
      jogadoresPartida: { include: { jogador: true } },
      participantes: { include: { usuario: true } },
      usuarioUltimaEdicao: {
        select: {
          id: true,
          nome: true
        }
      },
      sets: true
    }
  })

  return partidaAtualizada
}

async function incrementarPlacar(placarId, incremento) {
  const camposIncrementaveis = {
    jogos: incremento.jogos,
    pontuacao: incremento.pontuacao,
    vitorias: incremento.vitorias,
    empates: incremento.empates,
    derrotas: incremento.derrotas,
    golsPro: incremento.golsPro,
    golsSofridos: incremento.golsSofridos,
    saldoDeGols: incremento.saldoDeGols,
    setsVencidos: incremento.setsVencidos,
    setsContra: incremento.setsContra,
    diferencaSets: incremento.diferencaSets,
    gamesPro: incremento.gamesPro,
    gamesContra: incremento.gamesContra,
    diferencaGames: incremento.diferencaGames,
    pontosPro: incremento.pontosPro,
    pontosContra: incremento.pontosContra,
    diferencaPontos: incremento.diferencaPontos,
    pontosAverage: incremento.pontosAverage,
    derrotaWo: incremento.derrotaWo
  };

  const data = Object.fromEntries(
    Object.entries(camposIncrementaveis)
      .filter(([_, value]) => typeof value === "number")
      .map(([key, value]) => [key, { increment: value }])
  );

  return prisma.placar.update({
    where: { id: Number(placarId) },
    data,
    include: { time: true }
  });
}

async function vincularJogadorPartida(partidaId, jogadorId, timeId, stats = {}) {
  const partida = await prisma.partida.findUnique({ where: { id: partidaId } });
  if (!partida) throw new Error("Partida não encontrada");

  await validarSuspensaoJogador({
    campeonatoId: partida.campeonatoId,
    faseId: partida.faseId,
    jogadorId
  })

  const jogador = await prisma.jogador.findUnique({ where: { id: jogadorId } });
  if (!jogador) throw new Error("Jogador não encontrado");

  if (timeId !== partida.timeAId && timeId !== partida.timeBId) {
    throw new Error("Time não pertence a esta partida");
  }

  const vinculoExistente = await prisma.jogadorPartida.findFirst({
    where: {
      partidaId: Number(partidaId),
      jogadorId: Number(jogadorId)
    }
  });

  if (vinculoExistente) {
    const dadosAtualizacao = {
      timeId: Number(timeId),
      emCampo: true
    };

    if (typeof stats.gols === 'number') dadosAtualizacao.gols = stats.gols;
    if (typeof stats.cartoesAmarelos === 'number') dadosAtualizacao.cartoesAmarelos = stats.cartoesAmarelos;
    if (typeof stats.cartoesVermelhos === 'number') dadosAtualizacao.cartoesVermelhos = stats.cartoesVermelhos;

    return prisma.jogadorPartida.update({
      where: { id: vinculoExistente.id },
      data: dadosAtualizacao
    });
  }

  const vinculo = await prisma.jogadorPartida.create({
    data: {
      partidaId: Number(partidaId),
      jogadorId: Number(jogadorId),
      timeId: Number(timeId),
      gols: stats.gols,
      cartoesAmarelos: stats.cartoesAmarelos,
      cartoesVermelhos: stats.cartoesVermelhos,
      emCampo: true
    },
  });

  return vinculo;
}

async function listarJogadoresSelecionados(partidaId) {
  const jogadoresPartida = await prisma.jogadorPartida.findMany({
    where: {
      partidaId: Number(partidaId),
      emCampo: true
    },
    include: {
      time: {
        select: {
          id: true,
          nome: true,
          foto: true
        }
      },
      jogador: {
        select: {
          id: true,
          nome: true,
          numero: true,
          foto: true,
          funcao: {
            select: { nome: true }
          }
        }
      }
    }
  });

  const jogadoresUnicos = new Map();

  for (const jp of jogadoresPartida) {
    const jogadorId = Number(jp.jogador.id);
    const existente = jogadoresUnicos.get(jogadorId);

    if (!existente) {
      jogadoresUnicos.set(jogadorId, {
        id: jp.jogador.id,
        nome: jp.jogador.nome,
        numero: jp.jogador.numero,
        foto: jp.jogador.foto,
        funcao: jp.jogador.funcao?.nome,

        timeId: jp.time.id,
        timeNome: jp.time.nome,
        timeFoto: jp.time.foto,

        gols: Number(jp.gols) || 0,
        cartoesAmarelos: Number(jp.cartoesAmarelos) || 0,
        cartoesVermelhos: Number(jp.cartoesVermelhos) || 0
      });
      continue;
    }

    existente.gols += Number(jp.gols) || 0;
    existente.cartoesAmarelos += Number(jp.cartoesAmarelos) || 0;
    existente.cartoesVermelhos += Number(jp.cartoesVermelhos) || 0;
  }

  return Array.from(jogadoresUnicos.values());
}

async function atualizarAtuacaoJogadorPartida({
  jogadorId,
  partidaId,
  gols = 0,
  cartoesAmarelos = 0,
  cartoesVermelhos = 0
}) {
  const partida = await prisma.partida.findUnique({
    where: { id: Number(partidaId) },
    include: {
      modalidade: {
        select: {
          nome: true
        }
      }
    }
  });

  const jogador = await prisma.jogador.findUnique({
    where: { id: Number(jogadorId) }
  });

  let atuacao = await prisma.jogadorPartida.findFirst({
    where: {
      jogadorId: Number(jogadorId),
      partidaId: Number(partidaId)
    }
  });

  const amarelos = Number(cartoesAmarelos) || 0;
  const vermelhos = Number(cartoesVermelhos) || 0;
  const golsInc = Number(gols) || 0;
  const expulsarPorVermelho =
    isFutebolModalidadeExclusiva(partida?.modalidade?.nome) &&
    vermelhos > 0;

  if (!atuacao) {
    atuacao = await prisma.jogadorPartida.create({
      data: {
        jogadorId: Number(jogadorId),
        partidaId: Number(partidaId),
        timeId: jogador.timeId,
        gols: golsInc,
        cartoesAmarelos: amarelos,
        cartoesVermelhos: vermelhos,
        emCampo: !expulsarPorVermelho
      }
    });

    const isTimeA = jogador.timeId === partida.timeAId;
    const updatePartida = {};

    if (amarelos !== 0)
      updatePartida[isTimeA ? 'cartoesAmarelosTimeA' : 'cartoesAmarelosTimeB'] = { increment: amarelos };

    if (vermelhos !== 0)
      updatePartida[isTimeA ? 'cartoesVermelhosTimeA' : 'cartoesVermelhosTimeB'] = { increment: vermelhos };

    if (Object.keys(updatePartida).length) {
      await prisma.partida.update({
        where: { id: Number(partidaId) },
        data: updatePartida
      });
    }

    return atuacao;
  }

  const novosAmarelos = (Number(atuacao.cartoesAmarelos) || 0) + amarelos;
  const novosVermelhos = (Number(atuacao.cartoesVermelhos) || 0) + vermelhos;

  const incrementoVermelhos = novosVermelhos - (Number(atuacao.cartoesVermelhos) || 0);

  atuacao = await prisma.jogadorPartida.update({
    where: { id: atuacao.id },
    data: {
      gols: (Number(atuacao.gols) || 0) + golsInc,
      cartoesAmarelos: novosAmarelos,
      cartoesVermelhos: novosVermelhos,
      emCampo: expulsarPorVermelho ? false : atuacao.emCampo
    }
  });

  const isTimeA = atuacao.timeId === partida.timeAId;
  const updatePartida = {};

  if (amarelos !== 0)
    updatePartida[isTimeA ? 'cartoesAmarelosTimeA' : 'cartoesAmarelosTimeB'] = { increment: amarelos };

  if (incrementoVermelhos !== 0)
    updatePartida[isTimeA ? 'cartoesVermelhosTimeA' : 'cartoesVermelhosTimeB'] = { increment: incrementoVermelhos };

  if (Object.keys(updatePartida).length) {
    await prisma.partida.update({
      where: { id: Number(partidaId) },
      data: updatePartida
    });
  }

  return atuacao;
}

async function substituirJogadorPartida(
  partidaId,
  jogadorSaiId,
  jogadorEntraId
) {

  const partida = await prisma.partida.findUnique({
    where: { id: Number(partidaId) },
    include: { modalidade: true }
  });

  if (!partida) {
    throw new Error("Partida não encontrada");
  }

  if (partida.status === 'FINALIZADA') {
    throw new Error("Não é possível alterar substituições em partida finalizada");
  }

  await validarSuspensaoJogador({
    campeonatoId: partida.campeonatoId,
    faseId: partida.faseId,
    jogadorId: Number(jogadorEntraId)
  })

  const jogadorSai = await prisma.jogadorPartida.findFirst({
    where: {
      partidaId: Number(partidaId),
      jogadorId: Number(jogadorSaiId),
      emCampo: true
    }
  });

  if (!jogadorSai) {
    throw new Error("Jogador de saída não está em campo nesta partida");
  }

  const jogadorEntraExistente = await prisma.jogadorPartida.findFirst({
    where: {
      partidaId: Number(partidaId),
      jogadorId: Number(jogadorEntraId)
    }
  });

  let tipoTime;
  if (partida.timeAId === jogadorSai.timeId) tipoTime = "A";
  else if (partida.timeBId === jogadorSai.timeId) tipoTime = "B";

  await prisma.jogadorPartida.updateMany({
    where: {
      partidaId: Number(partidaId),
      jogadorId: Number(jogadorSaiId),
      emCampo: true
    },
    data: { emCampo: false }
  });

  let novoJogador;

  if (jogadorEntraExistente) {
    await prisma.jogadorPartida.updateMany({
      where: {
        partidaId: Number(partidaId),
        jogadorId: Number(jogadorEntraId)
      },
      data: {
        emCampo: true,
        timeId: jogadorSai.timeId
      }
    });

    novoJogador = await prisma.jogadorPartida.findFirst({
      where: {
        partidaId: Number(partidaId),
        jogadorId: Number(jogadorEntraId)
      },
      orderBy: { id: 'desc' }
    });
  } else {
    novoJogador = await prisma.jogadorPartida.create({
      data: {
        partidaId: Number(partidaId),
        jogadorId: Number(jogadorEntraId),
        timeId: jogadorSai.timeId,
        gols: 0,
        cartoesAmarelos: 0,
        cartoesVermelhos: 0,
        emCampo: true
      }
    });
  }

  const updateData =
    tipoTime === "A"
      ? { substituicoesTimeA: { increment: 1 } }
      : { substituicoesTimeB: { increment: 1 } };

  await prisma.partida.update({
    where: { id: Number(partidaId) },
    data: updateData
  });


  return novoJogador;
}

async function getJogadoresForaDaPartida(partidaId, timeId) {
  partidaId = Number(partidaId)
  timeId = Number(timeId)

  const jogadoresEmCampo = await prisma.jogadorPartida.findMany({
    where: {
      partidaId,
      emCampo: true
    },
    select: { jogadorId: true }
  })

  const idsEmCampo = jogadoresEmCampo.map(j => j.jogadorId)

  const jogadoresFora = await prisma.jogadorTime.findMany({
    where: {
      timeId,
      jogadorId: {
        notIn: idsEmCampo.length ? idsEmCampo : [0]
      }
    },
    include: {
      jogador: {
        include: { funcao: true }
      }
    }
  })

  return jogadoresFora.map(jt => ({
    id: jt.jogador.id,
    nome: jt.jogador.nome,
    numero: jt.jogador.numero,
    foto: jt.jogador.foto,
    funcao: jt.jogador.funcao?.nome,
    timeId
  }))
}

async function removerJogadorDeCampo(partidaId, jogadorId) {
  const partida = await prisma.partida.findUnique({
    where: { id: Number(partidaId) }
  });

  if (!partida) {
    throw new Error("Partida não encontrada");
  }

  if (partida.status === 'FINALIZADA') {
    throw new Error("Não é possível alterar jogadores em partida finalizada");
  }

  const jogadoresAtualizados = await prisma.jogadorPartida.updateMany({
    where: {
      partidaId: Number(partidaId),
      jogadorId: Number(jogadorId),
      emCampo: true
    },
    data: { emCampo: false }
  });

  if (!jogadoresAtualizados.count) {
    throw new Error("Jogador não está em campo nesta partida");
  }

  const jogadorAtualizado = await prisma.jogadorPartida.findFirst({
    where: {
      partidaId: Number(partidaId),
      jogadorId: Number(jogadorId)
    },
    orderBy: { id: 'desc' }
  });

  return jogadorAtualizado;
}

async function detalharPartida(partidaId) {
  const partida = await prisma.partida.findUnique({
    where: { id: Number(partidaId) },
    include: {
      campeonato: {
        select: {
          id: true,
          nome: true,
          quadra: {
            select: {
              id: true,
              nome: true
            }
          }
        }
      },
      modalidade: {
        select: {
          id: true,
          nome: true
        }
      },
      quadra: {
        select: {
          id: true,
          nome: true,
          endereco: true
        }
      },
      timeA: {
        select: {
          id: true,
          nome: true,
          foto: true
        }
      },
      timeB: {
        select: {
          id: true,
          nome: true,
          foto: true
        }
      },
      jogadoresPartida: {
        include: {
          jogador: {
            select: {
              id: true,
              nome: true,
              numero: true,
              foto: true
            }
          }
        }
      },
      sets: {
        orderBy: {
          numero: 'asc'
        }
      }
    }
  })

  if (!partida) {
    throw new Error('Partida não encontrada')
  }

  const idsJogadores = Array.from(new Set(
    (Array.isArray(partida.jogadoresPartida) ? partida.jogadoresPartida : [])
      .map(jp => Number(jp?.jogadorId))
      .filter(id => Number.isFinite(id) && id > 0)
  ))

  const suspensoes = await mapearSuspensaoJogadores({
    campeonatoId: partida.campeonatoId,
    faseId: partida.faseId,
    jogadorIds: idsJogadores
  })

  partida.jogadoresPartida = (partida.jogadoresPartida || []).map(jp => {
    const suspensao = suspensoes.get(Number(jp?.jogadorId))
    return {
      ...jp,
      suspenso: !!suspensao?.suspenso,
      motivoSuspensao: suspensao?.motivoSuspensao || null
    }
  })

  return partida
}

async function listarPartidasDaRodadaDaFase(
  campeonatoId,
  faseId,
  rodadaId,
  { detalhes = false, usuario = null } = {}
) {
  try {
    const usuarioId = Number(usuario?.id);
    const permissaoId = Number(usuario?.permissaoId);
    const filtros = {
      campeonatoId: Number(campeonatoId),
      faseId: Number(faseId),
      rodadaId: Number(rodadaId),
      status: { not: 'DELETADA' }
    };

    if (permissaoId === 4) {
      if (!Number.isFinite(usuarioId) || usuarioId <= 0) {
        return [];
      }

      filtros.usuarioCriadorId = usuarioId;
    }

    let partidas = [];

    if (detalhes) {
      partidas = await prisma.partida.findMany({
        where: filtros,
        include: {
          timeA: true,
          timeB: true,
          quadra: true,
          usuarioCriador: true,
          usuarioUltimaEdicao: {
            select: {
              id: true,
              nome: true
            }
          },
          modalidade: true,
          fase: true,
          rodada: true,
          campeonato: true,
          sets: { orderBy: { numero: 'asc' } },
          jogadoresPartida: {
            include: {
              jogador: {
                include: {
                  funcao: true,
                  times: { include: { time: true } }
                }
              },
              time: true
            }
          },
          participantes: {
            include: {
              usuario: true,
              permissao: true
            }
          }
        },
        orderBy: { data: 'asc' }
      });
    } else {
      partidas = await prisma.partida.findMany({
        where: filtros,
        select: {
          id: true,
          data: true,
          createdAt: true,
          status: true,
          pontosTimeA: true,
          pontosTimeB: true,
          campeonatoId: true,
          faseId: true,
          rodadaId: true,
          modalidadeId: true,
          quadraId: true,
          timeAId: true,
          timeBId: true,
          ultimaEdicaoEm: true,
          timeA: {
            select: {
              id: true,
              nome: true,
              foto: true
            }
          },
          timeB: {
            select: {
              id: true,
              nome: true,
              foto: true
            }
          },
          quadra: {
            select: {
              id: true,
              nome: true
            }
          },
          usuarioCriador: {
            select: {
              id: true,
              nome: true
            }
          },
          usuarioUltimaEdicao: {
            select: {
              id: true,
              nome: true
            }
          }
        },
        orderBy: { data: 'asc' }
      });
    }

    return partidas
  } catch (error) {
    console.error('Erro ao listar partidas da fase/rodada:', error)
    throw new Error('Não foi possível listar as partidas')
  }
}

function listarStatusPartida() {
  return [
    'AGENDADA',
    'ADIADA',
    'EM_ANDAMENTO',
    'FINALIZADA',
    'CANCELADA'
  ];
}

async function alterarStatusPartida(partidaId, novoStatus, usuarioEditorId = null, novaData = null) {
  const partida = await prisma.partida.findUnique({
    where: { id: Number(partidaId) },
    select: {
      id: true,
      status: true,
      campeonatoId: true,
      faseId: true,
      rodadaId: true,
      data: true
    }
  });

  if (!partida) {
    throw new Error('Partida nao encontrada.');
  }

  if (String(partida.status || '').toUpperCase() === 'FINALIZADA') {
    throw new Error('Nao e permitido alterar o status de partidas finalizadas.');
  }

  const statusNormalizado = String(novoStatus || '').toUpperCase();
  if (!listarStatusPartida().includes(statusNormalizado)) {
    throw new Error('Status de partida invalido.');
  }

  if (String(partida.status || '').toUpperCase() === 'EM_ANDAMENTO' && statusNormalizado === 'ADIADA') {
    throw new Error('Nao e permitido adiar uma partida em andamento.');
  }

  const dadosAtualizacao = {
    status: statusNormalizado
  };

  if (statusNormalizado === 'EM_ANDAMENTO') {
    dadosAtualizacao.inicioPartida = new Date();
  }

  if (statusNormalizado === 'ADIADA') {
    const dataAdiamento = new Date(novaData);

    if (!novaData || Number.isNaN(dataAdiamento.getTime())) {
      throw new Error('Data do adiamento invalida.');
    }

    if (dataAdiamento.getTime() <= Date.now()) {
      throw new Error('A nova data da partida precisa ser futura.');
    }

    if (dataAdiamento < obterInicioDoProximoDia()) {
      throw new Error('A nova data da partida deve ser a partir de amanha.');
    }

    dadosAtualizacao.data = dataAdiamento;
    dadosAtualizacao.inicioPartida = null;
  }

  const editorIdNum = Number(usuarioEditorId);
  if (Number.isFinite(editorIdNum) && editorIdNum > 0) {
    dadosAtualizacao.usuarioUltimaEdicaoId = editorIdNum;
    dadosAtualizacao.ultimaEdicaoEm = new Date();
  }

  const partidaAtualizada = await prisma.partida.update({
    where: { id: partida.id },
    data: dadosAtualizacao
  });

  if (statusNormalizado === 'FINALIZADA' || statusNormalizado === 'CANCELADA') {
    await recalcularPlacarCampeonatoFase(partida.campeonatoId, partida.faseId)
  }

  return partidaAtualizada;
}

async function removerPartida(partidaId, usuarioEditorId = null) {
  const idNum = Number(partidaId);
  if (!idNum) {
    throw new Error('Partida invalida.');
  }

  const partida = await prisma.partida.findUnique({
    where: { id: idNum },
    select: {
      id: true,
      status: true,
      campeonatoId: true,
      faseId: true,
      rodadaId: true
    }
  });

  if (!partida) {
    throw new Error('Partida nao encontrada.');
  }

  if (!['CANCELADA', 'EM_ANDAMENTO'].includes(partida.status)) {
    throw new Error('Somente partidas canceladas ou em andamento podem ser removidas.');
  }

  const editorIdNum = Number(usuarioEditorId);
  const dadosEdicao = Number.isFinite(editorIdNum) && editorIdNum > 0
    ? {
        usuarioUltimaEdicaoId: editorIdNum,
        ultimaEdicaoEm: new Date()
      }
    : {};

  return prisma.partida.update({
    where: { id: idNum },
    data: {
      status: 'DELETADA',
      ...dadosEdicao
    }
  });
}

module.exports = {
  criarPartida,
  iniciarPartida,
  finalizarPartida,
  atualizarParcial,
  incrementarPlacar,
  retornarPartida,
  vincularJogadorPartida,
  listarJogadoresSelecionados,
  atualizarAtuacaoJogadorPartida,
  substituirJogadorPartida,
  getJogadoresForaDaPartida,
  mapearSuspensaoJogadores,
  listarJogadoresParaEscalacao,
  removerJogadorDeCampo,
  detalharPartida,
  listarPartidasDaRodadaDaFase,
  listarStatusPartida,
  alterarStatusPartida,
  removerPartida
};

