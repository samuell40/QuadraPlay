const prisma = require('../lib/prisma');
const partidaService = require('./partida.service');
const {
  enviarEmailVinculoMesarioCampeonato,
  enviarEmailStatusAgendamento
} = require('./email.service');

const FOTO_PADRAO_CAMPEONATO = 'https://pub-8c7959cad5c04469b16f4b0706a2e931.r2.dev/uploads/imagem_campeonatos.png';

const CRITERIOS_MODALIDADE = {
  futebol: [
    { value: "pontuacao", label: "Pontuação" },
    { value: "vitorias", label: "Vitórias" },
    { value: "saldoDeGols", label: "Saldo de gols" },
    { value: "golsPro", label: "Gols pró" },
    { value: "golsSofridos", label: "Gols sofridos" },
    { value: "empates", label: "Empates" },
    { value: "derrotas", label: "Derrotas" },
    { value: "confrontoDireto", label: "Confronto direto" },
    { value: "sorteio", label: "Sorteio" }
  ],
  futsal: [],
  futebolDeAreia: [],
  volei: [
    { value: "pontuacao", label: "Pontuação" },
    { value: "setsVencidos", label: "Sets vencidos" },
    { value: "sorteio", label: "Sorteio" }
  ],
  voleiDeAreia: [],
  futevolei: []
};

CRITERIOS_MODALIDADE.futsal = CRITERIOS_MODALIDADE.futebol;
CRITERIOS_MODALIDADE.futebolDeAreia = CRITERIOS_MODALIDADE.futebol;
CRITERIOS_MODALIDADE.voleiDeAreia = CRITERIOS_MODALIDADE.volei;
CRITERIOS_MODALIDADE.futevolei = CRITERIOS_MODALIDADE.volei;
CRITERIOS_MODALIDADE.beachtenis = CRITERIOS_MODALIDADE.volei;
CRITERIOS_MODALIDADE.beachtennis = CRITERIOS_MODALIDADE.volei;

const CRITERIOS_FUTEBOL = [
  { value: "pontuacao", label: "Pontuacao" },
  { value: "vitorias", label: "Vitorias" },
  { value: "saldoDeGols", label: "Saldo de gols" },
  { value: "golsPro", label: "Gols pro" },
  { value: "golsSofridos", label: "Gols sofridos" },
  { value: "empates", label: "Empates" },
  { value: "derrotas", label: "Derrotas" },
  { value: "confrontoDireto", label: "Confronto direto" },
  { value: "sorteio", label: "Sorteio" }
];

const CRITERIOS_VOLEI_ATUALIZADOS = [
  { value: "pontuacao", label: "Pontuacao" },
  { value: "vitorias", label: "Vitorias" },
  { value: "diferencaSets", label: "Saldo de sets" },
  { value: "diferencaPontos", label: "Saldo de pontos" },
  { value: "setsVencidos", label: "Sets ganhos" },
  { value: "pontosAverage", label: "Pontos average (AV)" },
  { value: "confrontoDireto", label: "Confronto direto" },
  { value: "derrotaWo", label: "W.O. (menos)" },
  { value: "sorteio", label: "Sorteio" }
];

const CRITERIOS_BEACH_TENIS = [
  { value: "pontuacao", label: "Pontuacao" },
  { value: "vitorias", label: "Vitorias" },
  { value: "diferencaSets", label: "Saldo de sets" },
  { value: "diferencaGames", label: "Saldo de games" },
  { value: "setsVencidos", label: "Sets ganhos" },
  { value: "gamesPro", label: "Games ganhos" },
  { value: "confrontoDireto", label: "Confronto direto" },
  { value: "derrotaWo", label: "W.O. (menos)" },
  { value: "sorteio", label: "Sorteio" }
];

CRITERIOS_MODALIDADE.futebol = CRITERIOS_FUTEBOL;
CRITERIOS_MODALIDADE.futsal = CRITERIOS_FUTEBOL;
CRITERIOS_MODALIDADE.futebolDeAreia = CRITERIOS_FUTEBOL;
CRITERIOS_MODALIDADE.volei = CRITERIOS_VOLEI_ATUALIZADOS;
CRITERIOS_MODALIDADE.voleiDeAreia = CRITERIOS_VOLEI_ATUALIZADOS;
CRITERIOS_MODALIDADE.futevolei = CRITERIOS_VOLEI_ATUALIZADOS;
CRITERIOS_MODALIDADE.beachtenis = CRITERIOS_BEACH_TENIS;
CRITERIOS_MODALIDADE.beachtennis = CRITERIOS_BEACH_TENIS;

function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function paraDataValida(valor) {
  if (!valor) return null;
  const data = valor instanceof Date ? new Date(valor.getTime()) : new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  data.setSeconds(0, 0);
  return data;
}

function obterChaveDataHora(data) {
  const dataValida = paraDataValida(data);
  if (!dataValida) return '';

  const ano = dataValida.getFullYear();
  const mes = String(dataValida.getMonth() + 1).padStart(2, '0');
  const dia = String(dataValida.getDate()).padStart(2, '0');
  const hora = String(dataValida.getHours()).padStart(2, '0');
  const minuto = String(dataValida.getMinutes()).padStart(2, '0');
  return `${ano}-${mes}-${dia} ${hora}:${minuto}`;
}

function ordenarDatasAsc(lista = []) {
  return [...lista].sort((a, b) => a.getTime() - b.getTime());
}

function duracaoAgendamentoEmMinutos(agendamento) {
  const duracaoHoras = Number(agendamento?.duracao || 1);
  return Number.isFinite(duracaoHoras) && duracaoHoras > 0 ? duracaoHoras * 60 : 60;
}

function intervalosConflitam(inicioA, duracaoA, inicioB, duracaoB) {
  const inicioAData = paraDataValida(inicioA);
  const inicioBData = paraDataValida(inicioB);
  if (!inicioAData || !inicioBData) return false;

  const fimA = new Date(inicioAData.getTime() + duracaoA);
  const fimB = new Date(inicioBData.getTime() + duracaoB);
  return inicioAData < fimB && inicioBData < fimA;
}

function formatarDataHoraCurta(data) {
  const dataValida = paraDataValida(data);
  if (!dataValida) return '';

  try {
    return dataValida.toLocaleString('pt-BR', {
      timeZone: 'America/Fortaleza',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dataValida.toLocaleString('pt-BR');
  }
}

function montarMotivoRecusaPorPrioridadeCampeonato({ nomeCampeonato, nomeQuadra, datahora }) {
  const dataHoraFormatada = formatarDataHoraCurta(datahora);
  const nomeQuadraSeguro = nomeQuadra || 'a quadra selecionada';
  const nomeCampeonatoSeguro = nomeCampeonato || 'o campeonato';

  return `Seu agendamento foi cancelado porque a quadra ${nomeQuadraSeguro} foi reservada para ${nomeCampeonatoSeguro} em ${dataHoraFormatada}. Campeonatos possuem prioridade sobre reservas comuns.`;
}

function normalizarDatasJogos(datasJogos = []) {
  return ordenarDatasAsc(
    [...new Map(
      (Array.isArray(datasJogos) ? datasJogos : [])
        .map(paraDataValida)
        .filter(Boolean)
        .map(dataItem => [obterChaveDataHora(dataItem), dataItem])
    ).values()]
  );
}

function montarFiltrosDiasAgendamento(datas = []) {
  return [...new Map(
    normalizarDatasJogos(datas).map(dataItem => {
      const chave = `${dataItem.getFullYear()}-${dataItem.getMonth() + 1}-${dataItem.getDate()}`;
      return [chave, {
        ano: dataItem.getFullYear(),
        mes: dataItem.getMonth() + 1,
        dia: dataItem.getDate()
      }];
    })
  ).values()];
}

function montarPayloadAgendamentoCampeonato(dataObj, {
  quadraId,
  usuarioId,
  modalidadeId,
  campeonatoId
}) {
  return {
    datahora: dataObj,
    dia: dataObj.getDate(),
    mes: dataObj.getMonth() + 1,
    ano: dataObj.getFullYear(),
    hora: dataObj.getHours(),
    quadraId: Number(quadraId),
    usuarioId: usuarioId || null,
    modalidadeId: Number(modalidadeId),
    campeonatoId: campeonatoId ? Number(campeonatoId) : undefined,
    status: 'Confirmado',
    tipo: 'CAMPEONATO',
    duracao: 1
  };
}

async function cancelarConflitosAgendamentoCampeonato(tx, {
  quadraId,
  datasJogos,
  nomeCampeonato
}) {
  const datasParaConflito = normalizarDatasJogos(datasJogos)
    .filter(dataItem => dataItem.getTime() >= Date.now());

  if (!quadraId || !datasParaConflito.length) {
    return [];
  }

  const filtrosDias = montarFiltrosDiasAgendamento(datasParaConflito);
  if (!filtrosDias.length) {
    return [];
  }

  const conflitosCandidatos = await tx.agendamento.findMany({
    where: {
      quadraId: Number(quadraId),
      campeonatoId: null,
      deletedAt: null,
      status: { in: ['Confirmado', 'Pendente'] },
      OR: filtrosDias
    },
    include: {
      usuario: true,
      quadra: true,
      modalidade: true,
      time: true
    }
  });

  const conflitos = conflitosCandidatos.filter((agendamentoExistente) => {
    const inicioAgendamento = paraDataValida(
      agendamentoExistente.datahora || new Date(
        agendamentoExistente.ano,
        agendamentoExistente.mes - 1,
        agendamentoExistente.dia,
        agendamentoExistente.hora,
        0,
        0
      )
    );

    return datasParaConflito.some((dataEvento) =>
      intervalosConflitam(
        inicioAgendamento,
        duracaoAgendamentoEmMinutos(agendamentoExistente),
        dataEvento,
        60
      )
    );
  });

  const conflitosAtualizados = [];
  for (const conflito of conflitos) {
    const dataConflito = paraDataValida(
      conflito.datahora || new Date(conflito.ano, conflito.mes - 1, conflito.dia, conflito.hora, 0, 0)
    );
    const motivoRecusa = montarMotivoRecusaPorPrioridadeCampeonato({
      nomeCampeonato,
      nomeQuadra: conflito.quadra?.nome,
      datahora: dataConflito
    });

    await tx.agendamento.update({
      where: { id: conflito.id },
      data: {
        status: 'Recusado',
        motivoRecusa
      }
    });

    conflitosAtualizados.push({
      ...conflito,
      status: 'Recusado',
      motivoRecusa
    });
  }

  return conflitosAtualizados;
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

function criteriosClassificacaoPorModalidade(nomeModalidade) {
  if (isBeachTenisModalidade(nomeModalidade)) {
    return CRITERIOS_BEACH_TENIS;
  }

  return grupoModalidade(nomeModalidade) === 'VOLEI'
    ? CRITERIOS_VOLEI_ATUALIZADOS
    : CRITERIOS_FUTEBOL;
}

function normalizarOrdemClassificacao(ordem, nomeModalidade) {
  const padrao = criteriosClassificacaoPorModalidade(nomeModalidade);

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

const REGRAS_PADRAO_CAMPEONATO = regrasPadraoPorModalidade('futebol');
const STATUS_CAMPEONATO_ENCERRADO = new Set([
  'FINALIZADO',
  'FINALIZADA',
  'CANCELADO',
  'CANCELADA',
  'DELETADO',
  'DELETADA'
]);

function statusCampeonatoEncerrado(status) {
  return STATUS_CAMPEONATO_ENCERRADO.has(String(status || '').toUpperCase());
}

async function encerrarPartidasAbertasDoCampeonato(tx, campeonatoId) {
  const id = Number(campeonatoId);
  if (!id) return [];

  const agora = new Date();
  const partidasEmAndamento = await tx.partida.findMany({
    where: {
      campeonatoId: id,
      status: 'EM_ANDAMENTO'
    },
    select: {
      id: true,
      faseId: true
    }
  });

  if (partidasEmAndamento.length) {
    await tx.partida.updateMany({
      where: {
        id: { in: partidasEmAndamento.map((partida) => Number(partida.id)) }
      },
      data: {
        status: 'FINALIZADA',
        ultimaEdicaoEm: agora
      }
    });
  }

  await tx.partida.updateMany({
    where: {
      campeonatoId: id,
      status: { in: ['AGENDADA', 'ADIADA'] }
    },
    data: {
      status: 'CANCELADA',
      ultimaEdicaoEm: agora
    }
  });

  return [...new Set(
    partidasEmAndamento
      .map((partida) => Number(partida.faseId || 0))
      .filter((faseId) => faseId > 0)
  )];
}

function faseEhEliminatoria(nomeFase) {
  const nomeNormalizado = normalizarTexto(nomeFase);
  return /(eliminat|mata ?mata|playoff)/.test(nomeNormalizado);
}

function obterQuantidadeClassificadosMataMata(totalTimes) {
  const total = Number(totalTimes) || 0;
  if (total >= 8) return 8;
  if (total >= 4) return 4;
  if (total >= 2) return 2;
  return 0;
}

function obterNomeRodadaInicialMataMata(quantidadeClassificados) {
  if (Number(quantidadeClassificados) >= 8) return 'Quartas de Final';
  if (Number(quantidadeClassificados) >= 4) return 'Semifinal';
  return 'Final';
}

function montarConfrontosMataMata(timeIdsOrdenados = []) {
  const ids = Array.isArray(timeIdsOrdenados)
    ? timeIdsOrdenados.map(Number).filter((id) => Number.isInteger(id) && id > 0)
    : [];

  const tamanho = ids.length;
  if (!tamanho || tamanho % 2 !== 0) return [];

  const confrontos = [];
  for (let indice = 0; indice < tamanho / 2; indice += 1) {
    confrontos.push({
      timeAId: ids[indice],
      timeBId: ids[tamanho - 1 - indice]
    });
  }

  return confrontos;
}

function obterInicioDoProximoDia(dataBase = new Date()) {
  const data = new Date(dataBase);
  data.setHours(0, 0, 0, 0);
  data.setDate(data.getDate() + 1);
  return data;
}

function extrairSuspensoesManuais(regras) {
  const lista = Array.isArray(regras?.suspensoesManuais) ? regras.suspensoesManuais : [];
  const mapa = new Map();

  for (const item of lista) {
    const jogadorId = Number(item?.jogadorId);
    if (!Number.isInteger(jogadorId) || jogadorId <= 0) continue;

    const suspenso = Boolean(item?.suspenso);
    const motivo = String(item?.motivo || '').trim();
    const atualizadoPor = Number(item?.atualizadoPor);
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
      jogadorId,
      suspenso,
      motivo: motivo || (suspenso
        ? 'Suspensao manual definida pela administracao.'
        : 'Suspensao retirada manualmente pela administracao.'),
      atualizadoEm: item?.atualizadoEm || null,
      atualizadoPor: Number.isInteger(atualizadoPor) && atualizadoPor > 0 ? atualizadoPor : null,
      timeId: Number.isInteger(timeId) && timeId > 0 ? timeId : null,
      tipoDuracao: quantidadePartidas ? 'PARTIDAS' : 'CAMPEONATO',
      quantidadePartidas
    });
  }

  return mapa;
}

function serializarSuspensoesManuais(mapa) {
  return Array.from(mapa.values())
    .sort((a, b) => Number(a.jogadorId) - Number(b.jogadorId))
    .map((item) => ({
      jogadorId: Number(item.jogadorId),
      suspenso: Boolean(item.suspenso),
      motivo: String(item.motivo || '').trim() || (item.suspenso
        ? 'Suspensao manual definida pela administracao.'
        : 'Suspensao retirada manualmente pela administracao.'),
      atualizadoEm: item.atualizadoEm || new Date().toISOString(),
      atualizadoPor: item.atualizadoPor ?? null,
      timeId: Number.isInteger(Number(item.timeId)) && Number(item.timeId) > 0 ? Number(item.timeId) : null,
      tipoDuracao: String(item.tipoDuracao || '').toUpperCase() === 'PARTIDAS' ? 'PARTIDAS' : 'CAMPEONATO',
      quantidadePartidas: Number.isInteger(Number(item.quantidadePartidas))
        && Number(item.quantidadePartidas) > 0
        && Number(item.quantidadePartidas) <= 10
        ? Number(item.quantidadePartidas)
        : null
    }));
}

function normalizarRegrasCampeonato(regras, nomeModalidade) {
  return {
    ...regrasPadraoPorModalidade(nomeModalidade),
    ...(regras || {})
  };
}

async function criarCampeonato(data) {
  const {
    nome,
    tipo,
    dataInicio,
    dataFim,
    status,
    modalidadeId,
    quadraId,
    times,
    datasJogos,
    usuarioId,
    foto,
    regras
  } = data;

  const listaDatasReais = normalizarDatasJogos(datasJogos);
  const timesArray = Array.isArray(times) ? times : [];
  const fotoNormalizada = String(foto || '').trim() || FOTO_PADRAO_CAMPEONATO;
  const usuarioIdNum = Number(usuarioId);
  const usuarioAgendamentoId = Number.isFinite(usuarioIdNum) && usuarioIdNum > 0 ? usuarioIdNum : null;
  const dataInicioInformada = dataInicio ? paraDataValida(dataInicio) : null;
  const dataFimInformada = dataFim ? paraDataValida(dataFim) : null;

  if (!nome || !String(nome).trim()) {
    throw new Error('Nome do campeonato e obrigatorio.');
  }

  if (!tipo) {
    throw new Error('Tipo do campeonato e obrigatorio.');
  }

  if (!modalidadeId) {
    throw new Error('Modalidade e obrigatoria.');
  }

  if (!quadraId) {
    throw new Error('Quadra e obrigatoria.');
  }

  if (!listaDatasReais.length) {
    throw new Error('Selecione ao menos uma data e horario para o campeonato.');
  }

  const dataMinimaAgenda = new Date();
  dataMinimaAgenda.setHours(0, 0, 0, 0);
  dataMinimaAgenda.setDate(dataMinimaAgenda.getDate() + 1);

  if (listaDatasReais.some(dataItem => dataItem < dataMinimaAgenda)) {
    throw new Error('Os horarios do campeonato devem ser cadastrados a partir de amanha.');
  }

  if (dataInicio && !dataInicioInformada) {
    throw new Error('Data inicial do campeonato invalida.');
  }

  if (dataFim && !dataFimInformada) {
    throw new Error('Data final do campeonato invalida.');
  }

  const dataInicioCampeonato = dataInicioInformada || listaDatasReais[0];
  const dataFimCampeonato = dataFimInformada || listaDatasReais[listaDatasReais.length - 1];

  if (dataFimCampeonato < dataInicioCampeonato) {
    throw new Error('A data final do campeonato nao pode ser menor que a data inicial.');
  }

  const agendamentosRecusadosParaNotificar = [];

  const campeonatoId = await prisma.$transaction(async (tx) => {
    const modalidadeDB = await tx.modalidade.findUnique({
      where: { id: Number(modalidadeId) }
    });

    if (!modalidadeDB) throw new Error("Modalidade não encontrada no banco.");
    const chaveAuto = modalidadeDB.nome
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, "") 
      .replace(/\s+/g, '') 
      .replace('deareia', 'DeAreia');

    const ordemClassificacao = normalizarOrdemClassificacao(
      CRITERIOS_MODALIDADE[chaveAuto] || [],
      modalidadeDB.nome
    );

    const conflitosAtualizados = await cancelarConflitosAgendamentoCampeonato(tx, {
      quadraId,
      datasJogos: listaDatasReais,
      nomeCampeonato: nome
    });
    agendamentosRecusadosParaNotificar.push(...conflitosAtualizados);

    const agendamentosParaCriar = listaDatasReais.map(dataObj => {
      const payloadAgendamento = montarPayloadAgendamentoCampeonato(dataObj, {
        quadraId,
        usuarioId: usuarioAgendamentoId,
        modalidadeId: modalidadeDB.id
      });

      delete payloadAgendamento.campeonatoId;
      return payloadAgendamento;
    });

    const campeonato = await tx.campeonato.create({
      data: {
        nome,
        tipo,
        foto: fotoNormalizada,
        regras: normalizarRegrasCampeonato(regras, modalidadeDB.nome),
        dataInicio: dataInicioCampeonato,
        dataFim: dataFimCampeonato,
        status: status || 'EM_ANDAMENTO',
        modalidadeId: modalidadeDB.id,
        quadraId: Number(quadraId),
        ordemClassificacao, 
        times: {
          create: timesArray.map(timeId => ({ timeId: Number(timeId) }))
        },
        agendamentos: { create: agendamentosParaCriar },
        placares: { create: timesArray.map(timeId => ({ timeId: Number(timeId) })) }
      }
    });

    if (tipo === "PONTOS_CORRIDOS") {
      const fase = await tx.fase.create({ data: { nome: "1° Fase", campeonatoId: campeonato.id } });
      await tx.rodada.create({ data: { nome: "Rodada 1", faseId: fase.id } });
      await tx.placar.updateMany({ where: { campeonatoId: campeonato.id }, data: { faseId: fase.id } });
    }

    if (tipo === "PONTOS_CORRIDOS_ELIMINATORIAS") {
      const fase1 = await tx.fase.create({ data: { nome: "1° Fase", campeonatoId: campeonato.id } });
      await tx.rodada.create({ data: { nome: "Rodada 1", faseId: fase1.id } });
      await tx.placar.updateMany({ where: { campeonatoId: campeonato.id }, data: { faseId: fase1.id } });

      const fase2 = await tx.fase.create({ data: { nome: "Eliminatórias", campeonatoId: campeonato.id } });
      for (const rodadaNome of ["Quartas de Final", "Semifinal", "Final"]) {
        await tx.rodada.create({ data: { nome: rodadaNome, faseId: fase2.id } });
      }
    }

    if (tipo === "ELIMINATORIAS") {
      const fase = await tx.fase.create({ data: { nome: "Eliminatórias", campeonatoId: campeonato.id } });
      for (const rodadaNome of ["Quartas de Final", "Semifinal", "Final"]) {
        await tx.rodada.create({ data: { nome: rodadaNome, faseId: fase.id } });
      }
    }

    return campeonato.id;
  }, {
    timeout: 20000
  });

  const campeonatoCriado = await prisma.campeonato.findUnique({
    where: { id: campeonatoId },
    include: {
      modalidade: true,
      quadra: true,
      times: { include: { time: true } },
      agendamentos: true,
      placares: true
    }
  });

  if (!campeonatoCriado) {
    throw new Error('Falha ao carregar campeonato criado.');
  }

  if (agendamentosRecusadosParaNotificar.length > 0) {
    const envios = agendamentosRecusadosParaNotificar
      .filter(item => item?.usuario?.email)
      .map(item => enviarEmailStatusAgendamento(item));

    const resultados = await Promise.allSettled(envios);
    resultados.forEach((resultado) => {
      if (resultado.status === 'rejected') {
        console.error('Erro ao enviar email de recusa por prioridade de campeonato:', resultado.reason);
      }
    });
  }

  return campeonatoCriado;
}

async function removerCampeonato(campeonatoId) {
  if (!campeonatoId) {
    throw new Error('ID do campeonato é obrigatório.');
  }

  const idNum = Number(campeonatoId);

  const existe = await prisma.campeonato.findUnique({ where: { id: idNum } });
  if (!existe) throw new Error('Campeonato não encontrado.');

  const agora = new Date();

  await prisma.$transaction([
    prisma.partida.updateMany({
      where: { campeonatoId: idNum },
      data: { status: 'DELETADA' }
    }),

    prisma.placar.updateMany({
      where: { campeonatoId: idNum },
      data: { visivel: false, deletedAt: agora }
    }),

    prisma.campeonatoTime.updateMany({
      where: { campeonatoId: idNum },
      data: { ativo: false, deletedAt: agora }
    }),

    prisma.agendamento.updateMany({
      where: { campeonatoId: idNum },
      data: { status: 'Cancelado', deletedAt: agora }
    }),

    prisma.campeonato.update({
      where: { id: idNum },
      data: { ativo: false, deletedAt: agora }
    })
  ]);

  return { mensagem: 'Campeonato e seus registros foram desativados com sucesso.' };
}

async function listarCampeonatosPorModalidade(modalidadeId, ano) {
  try {
    const anoFiltro = ano ? Number(ano) : new Date().getFullYear();

    const campeonatos = await prisma.campeonato.findMany({
      where: {
        modalidadeId: modalidadeId,
        ativo: true,
        deletedAt: null,
        dataInicio: {
          gte: new Date(`${anoFiltro}-01-01`),
          lte: new Date(`${anoFiltro}-12-31`)
        }
      },
      include: {
        modalidade: true,
        quadra: true,
        times: {
          where: { ativo: true, deletedAt: null },
          include: { time: true }
        },
        placares: {
          where: { visivel: true, deletedAt: null },
          include: { time: true },
          orderBy: { posicao: 'asc' }
        },
        agendamentos: {
          where: { deletedAt: null }
        }
      },
      orderBy: { dataInicio: 'desc' }
    });

    // Ajuste: adiciona os critérios de classificação
    return campeonatos.map(c => ({
      ...c,
      ordemClassificacao: normalizarOrdemClassificacao(c.ordemClassificacao, c.modalidade?.nome),
      criteriosClassificacao: normalizarOrdemClassificacao(c.ordemClassificacao, c.modalidade?.nome)
    }));

  } catch (error) {
    console.error(error);
    throw new Error('Erro ao listar campeonatos por modalidade.');
  }
}

async function listarCampeonatosAnoAtual() {
  const anoAtual = new Date().getFullYear();
  const dataInicio = new Date(`${anoAtual}-01-01`);
  const dataFim = new Date(`${anoAtual}-12-31T23:59:59.999`);

  const campeonatos = await prisma.campeonato.findMany({
    where: {
      ativo: true,
      deletedAt: null,
      dataInicio: { gte: dataInicio, lte: dataFim }
    },
    include: {
      modalidade: true,
      quadra: true,
      placares: {
        where: { visivel: true, deletedAt: null },
        include: { time: true },
        orderBy: { posicao: 'asc' }
      }
    },
    orderBy: { dataInicio: 'desc' }
  });

  // Ajuste: inclui os critérios de classificação
  return campeonatos.map(c => ({
    ...c,
    ordemClassificacao: normalizarOrdemClassificacao(c.ordemClassificacao, c.modalidade?.nome),
    criteriosClassificacao: normalizarOrdemClassificacao(c.ordemClassificacao, c.modalidade?.nome)
  }));
}

async function listarTodosCampeonatosAtivos() {
  const campeonatos = await prisma.campeonato.findMany({
    where: {
      ativo: true,
      deletedAt: null
    },
    include: {
      modalidade: true,
      quadra: true,
      placares: {
        where: { visivel: true, deletedAt: null },
        include: { time: true },
        orderBy: { posicao: 'asc' }
      }
    },
    orderBy: { dataInicio: 'desc' }
  });

  return campeonatos.map(c => ({
    ...c,
    ordemClassificacao: normalizarOrdemClassificacao(c.ordemClassificacao, c.modalidade?.nome),
    criteriosClassificacao: normalizarOrdemClassificacao(c.ordemClassificacao, c.modalidade?.nome)
  }));
}

function extrairMesariosVinculados(regras) {
  if (!regras || typeof regras !== 'object') return [];
  const ids = Array.isArray(regras.mesariosVinculados) ? regras.mesariosVinculados : [];

  return ids
    .map(id => Number(id))
    .filter(id => Number.isInteger(id) && id > 0);
}

function ordenarUsuariosGestaoMesarios(usuarios = [], vinculadosIds = []) {
  const vinculadosSet = new Set(
    (Array.isArray(vinculadosIds) ? vinculadosIds : [])
      .map(id => Number(id))
      .filter(id => Number.isInteger(id) && id > 0)
  );

  return [...usuarios].sort((a, b) => {
    const aVinculado = vinculadosSet.has(Number(a?.id)) ? 1 : 0;
    const bVinculado = vinculadosSet.has(Number(b?.id)) ? 1 : 0;
    if (aVinculado !== bVinculado) return bVinculado - aVinculado;

    const aMesario = Number(a?.permissaoId) === 4 ? 1 : 0;
    const bMesario = Number(b?.permissaoId) === 4 ? 1 : 0;
    if (aMesario !== bMesario) return bMesario - aMesario;

    return String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-BR', { sensitivity: 'base' });
  });
}

async function listarCampeonatosEmAndamentoMesario(usuarioId) {
  const id = Number(usuarioId);

  if (!id) {
    throw new Error('usuarioId invalido');
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { permissaoId: true, ativo: true, deletedAt: true }
  });

  if (!usuario || !usuario.ativo || usuario.deletedAt) {
    throw new Error('Usuario nao encontrado');
  }

  if (Number(usuario.permissaoId) !== 4) {
    return [];
  }

  const campeonatosEmAndamento = await prisma.campeonato.findMany({
    where: {
      ativo: true,
      deletedAt: null,
      status: 'EM_ANDAMENTO'
    },
    include: {
      modalidade: true,
      quadra: true
    },
    orderBy: { dataInicio: 'desc' }
  });

  const campeonatosVinculados = campeonatosEmAndamento.filter(campeonato =>
    extrairMesariosVinculados(campeonato.regras).includes(id)
  );

  return campeonatosVinculados;
}

async function listarMesariosCampeonato(campeonatoId) {
  const id = Number(campeonatoId);
  if (!id) {
    throw new Error('ID do campeonato invalido.');
  }

  const campeonato = await prisma.campeonato.findUnique({
    where: { id },
    select: {
      id: true,
      regras: true
    }
  });

  if (!campeonato) {
    throw new Error('Campeonato nao encontrado.');
  }

  const vinculadosIds = extrairMesariosVinculados(campeonato.regras);

  const usuariosGestaoMesarios = await prisma.usuario.findMany({
    where: {
      permissaoId: { in: [3, 4] },
      ativo: true,
      deletedAt: null
    },
    select: {
      id: true,
      nome: true,
      email: true,
      foto: true,
      permissaoId: true
    }
  });

  const mesarios = ordenarUsuariosGestaoMesarios(usuariosGestaoMesarios, vinculadosIds);

  return {
    mesarios,
    vinculadosIds
  };
}

async function atualizarMesariosCampeonato(campeonatoId, mesariosIds = []) {
  const id = Number(campeonatoId);
  if (!id) {
    throw new Error('ID do campeonato invalido.');
  }

  const campeonato = await prisma.campeonato.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      regras: true,
      modalidade: {
        select: { nome: true }
      },
      quadra: {
        select: { nome: true }
      }
    }
  });

  if (!campeonato) {
    throw new Error('Campeonato nao encontrado.');
  }

  const idsVinculadosAntes = extrairMesariosVinculados(campeonato.regras);
  const idsLimpos = [...new Set((Array.isArray(mesariosIds) ? mesariosIds : [])
    .map(valor => Number(valor))
    .filter(valor => Number.isInteger(valor) && valor > 0))];

  let usuariosValidos = [];
  if (idsLimpos.length > 0) {
    usuariosValidos = await prisma.usuario.findMany({
      where: {
        id: { in: idsLimpos },
        permissaoId: { in: [3, 4] },
        ativo: true,
        deletedAt: null
      },
      select: {
        id: true,
        nome: true,
        email: true,
        permissaoId: true
      }
    });

    if (usuariosValidos.length !== idsLimpos.length) {
      throw new Error('Um ou mais usuarios informados nao sao validos para gestao de mesarios.');
    }

    const idsParaPromover = usuariosValidos
      .filter(item => Number(item.permissaoId) === 3)
      .map(item => Number(item.id))
      .filter(item => Number.isInteger(item) && item > 0);

    if (idsParaPromover.length > 0) {
      await prisma.usuario.updateMany({
        where: {
          id: { in: idsParaPromover },
          permissaoId: 3,
          ativo: true,
          deletedAt: null
        },
        data: {
          permissaoId: 4
        }
      });

      usuariosValidos = usuariosValidos.map((item) => (
        idsParaPromover.includes(Number(item.id))
          ? { ...item, permissaoId: 4 }
          : item
      ));
    }
  }

  const regrasBase = (campeonato.regras && typeof campeonato.regras === 'object')
    ? campeonato.regras
    : {};

  const regrasAtualizadas = {
    ...regrasBase,
    mesariosVinculados: idsLimpos
  };

  await prisma.campeonato.update({
    where: { id },
    data: { regras: regrasAtualizadas }
  });

  const novosVinculosIds = idsLimpos.filter(idMesario => !idsVinculadosAntes.includes(idMesario));
  if (novosVinculosIds.length > 0) {
    const mesariosNovos = usuariosValidos.filter(item => novosVinculosIds.includes(Number(item.id)));
    const envios = mesariosNovos.map(mesario =>
      enviarEmailVinculoMesarioCampeonato(mesario, campeonato)
    );

    const resultadosEnvio = await Promise.allSettled(envios);
    resultadosEnvio.forEach((resultado) => {
      if (resultado.status === 'rejected') {
        console.error('Erro ao enviar email de vinculo de mesario no campeonato:', resultado.reason);
      }
    });
  }

  return listarMesariosCampeonato(id);
}

async function listarEquipesCampeonato(campeonatoId) {
  const id = Number(campeonatoId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('ID do campeonato invalido.');
  }

  const campeonato = await prisma.campeonato.findFirst({
    where: {
      id,
      ativo: true,
      deletedAt: null
    },
    select: {
      id: true,
      nome: true,
      status: true,
      modalidadeId: true,
      modalidade: {
        select: {
          id: true,
          nome: true
        }
      },
      times: {
        where: {
          ativo: true,
          deletedAt: null,
          time: {
            ativo: true,
            deletedAt: null
          }
        },
        orderBy: {
          time: {
            nome: 'asc'
          }
        },
        include: {
          time: {
            include: {
              treinador: {
                include: {
                  usuario: {
                    select: {
                      id: true,
                      nome: true
                    }
                  }
                }
              },
              _count: {
                select: {
                  jogadores: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!campeonato) {
    throw new Error('Campeonato nao encontrado.');
  }

  return {
    campeonatoId: campeonato.id,
    campeonatoNome: campeonato.nome,
    campeonatoStatus: campeonato.status,
    modalidade: campeonato.modalidade,
    equipes: (campeonato.times || []).map((item) => {
      const treinador = item?.time?.treinador;

      return {
        id: item.time.id,
        nome: item.time.nome,
        foto: item.time.foto,
        modalidadeId: item.time.modalidadeId,
        qtdJogadores: Number(item.time?._count?.jogadores) || 0,
        treinador: treinador && treinador.ativo && !treinador.deletedAt
          ? treinador.usuario?.nome || null
          : null
      };
    })
  };
}

async function listarEquipesDisponiveisCampeonato(campeonatoId) {
  const id = Number(campeonatoId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('ID do campeonato invalido.');
  }

  const campeonato = await prisma.campeonato.findFirst({
    where: {
      id,
      ativo: true,
      deletedAt: null
    },
    select: {
      id: true,
      modalidadeId: true
    }
  });

  if (!campeonato) {
    throw new Error('Campeonato nao encontrado.');
  }

  const times = await prisma.time.findMany({
    where: {
      modalidadeId: campeonato.modalidadeId,
      ativo: true,
      deletedAt: null,
      campeonatos: {
        none: {
          campeonatoId: id,
          ativo: true,
          deletedAt: null
        }
      }
    },
    include: {
      treinador: {
        include: {
          usuario: {
            select: {
              id: true,
              nome: true
            }
          }
        }
      },
      _count: {
        select: {
          jogadores: true
        }
      }
    },
    orderBy: {
      nome: 'asc'
    }
  });

  return times.map((time) => ({
    id: time.id,
    nome: time.nome,
    foto: time.foto,
    modalidadeId: time.modalidadeId,
    qtdJogadores: Number(time?._count?.jogadores) || 0,
    treinador: time.treinador && time.treinador.ativo && !time.treinador.deletedAt
      ? time.treinador.usuario?.nome || null
      : null
  }));
}

async function adicionarEquipeCampeonato(campeonatoId, timeId) {
  const idCampeonato = Number(campeonatoId);
  const idTime = Number(timeId);

  if (!Number.isInteger(idCampeonato) || idCampeonato <= 0) {
    throw new Error('ID do campeonato invalido.');
  }

  if (!Number.isInteger(idTime) || idTime <= 0) {
    throw new Error('ID do time invalido.');
  }

  await prisma.$transaction(async (tx) => {
    const campeonato = await tx.campeonato.findFirst({
      where: {
        id: idCampeonato,
        ativo: true,
        deletedAt: null
      },
      select: {
        id: true,
        status: true,
        modalidadeId: true
      }
    });

    if (!campeonato) {
      throw new Error('Campeonato nao encontrado.');
    }

    if (statusCampeonatoEncerrado(campeonato.status)) {
      throw new Error('Nao e possivel adicionar time em campeonato encerrado.');
    }

    const time = await tx.time.findFirst({
      where: {
        id: idTime,
        ativo: true,
        deletedAt: null
      },
      select: {
        id: true,
        modalidadeId: true
      }
    });

    if (!time) {
      throw new Error('Time nao encontrado.');
    }

    if (Number(time.modalidadeId) !== Number(campeonato.modalidadeId)) {
      throw new Error('O time precisa ser da mesma modalidade do campeonato.');
    }

    const vinculo = await tx.campeonatoTime.findUnique({
      where: {
        campeonatoId_timeId: {
          campeonatoId: idCampeonato,
          timeId: idTime
        }
      }
    });

    if (vinculo?.ativo && !vinculo?.deletedAt) {
      throw new Error('Esse time ja participa do campeonato.');
    }

    if (vinculo) {
      await tx.campeonatoTime.update({
        where: {
          campeonatoId_timeId: {
            campeonatoId: idCampeonato,
            timeId: idTime
          }
        },
        data: {
          ativo: true,
          deletedAt: null
        }
      });
    } else {
      await tx.campeonatoTime.create({
        data: {
          campeonatoId: idCampeonato,
          timeId: idTime
        }
      });
    }

    await tx.placar.updateMany({
      where: {
        campeonatoId: idCampeonato,
        timeId: idTime
      },
      data: {
        visivel: true,
        deletedAt: null
      }
    });

    const fasesAtivas = await tx.fase.findMany({
      where: {
        campeonatoId: idCampeonato,
        ativo: true,
        deletedAt: null
      },
      select: {
        id: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    const placaresExistentes = await tx.placar.findMany({
      where: {
        campeonatoId: idCampeonato,
        visivel: true,
        deletedAt: null
      },
      select: {
        faseId: true,
        posicao: true
      }
    });

    const proximaPosicaoPorFase = new Map();
    for (const placar of placaresExistentes) {
      const chave = placar.faseId == null ? 'null' : String(placar.faseId);
      const posicaoAtual = Number(placar.posicao) || 0;
      const maior = proximaPosicaoPorFase.get(chave) || 0;
      proximaPosicaoPorFase.set(chave, Math.max(maior, posicaoAtual));
    }

    if (fasesAtivas.length) {
      const dadosPlacares = fasesAtivas.map((fase) => {
        const chave = String(fase.id);
        const proximaPosicao = (proximaPosicaoPorFase.get(chave) || 0) + 1;
        proximaPosicaoPorFase.set(chave, proximaPosicao);

        return {
          campeonatoId: idCampeonato,
          timeId: idTime,
          faseId: fase.id,
          posicao: proximaPosicao
        };
      });

      await tx.placar.createMany({
        data: dadosPlacares,
        skipDuplicates: true
      });
    } else {
      const placarSemFase = await tx.placar.findFirst({
        where: {
          campeonatoId: idCampeonato,
          timeId: idTime,
          faseId: null
        },
        select: {
          id: true
        }
      });

      if (!placarSemFase) {
        const chave = 'null';
        const proximaPosicao = (proximaPosicaoPorFase.get(chave) || 0) + 1;
        await tx.placar.create({
          data: {
            campeonatoId: idCampeonato,
            timeId: idTime,
            faseId: null,
            posicao: proximaPosicao
          }
        });
      }
    }
  });

  return listarEquipesCampeonato(idCampeonato);
}

async function removerEquipeCampeonato(campeonatoId, timeId) {
  const idCampeonato = Number(campeonatoId);
  const idTime = Number(timeId);

  if (!Number.isInteger(idCampeonato) || idCampeonato <= 0) {
    throw new Error('ID do campeonato invalido.');
  }

  if (!Number.isInteger(idTime) || idTime <= 0) {
    throw new Error('ID do time invalido.');
  }

  await prisma.$transaction(async (tx) => {
    const campeonato = await tx.campeonato.findFirst({
      where: {
        id: idCampeonato,
        ativo: true,
        deletedAt: null
      },
      select: {
        id: true,
        status: true
      }
    });

    if (!campeonato) {
      throw new Error('Campeonato nao encontrado.');
    }

    if (statusCampeonatoEncerrado(campeonato.status)) {
      throw new Error('Nao e possivel remover time de campeonato encerrado.');
    }

    const vinculo = await tx.campeonatoTime.findFirst({
      where: {
        campeonatoId: idCampeonato,
        timeId: idTime,
        ativo: true,
        deletedAt: null
      },
      select: {
        campeonatoId: true,
        timeId: true
      }
    });

    if (!vinculo) {
      throw new Error('Esse time nao esta vinculado ao campeonato.');
    }

    const partidaVinculada = await tx.partida.findFirst({
      where: {
        campeonatoId: idCampeonato,
        OR: [
          { timeAId: idTime },
          { timeBId: idTime }
        ],
        status: {
          notIn: ['CANCELADA', 'DELETADA']
        }
      },
      select: {
        id: true
      }
    });

    if (partidaVinculada) {
      throw new Error('Nao e possivel remover um time com partidas vinculadas no campeonato.');
    }

    const agora = new Date();

    await tx.campeonatoTime.update({
      where: {
        campeonatoId_timeId: {
          campeonatoId: idCampeonato,
          timeId: idTime
        }
      },
      data: {
        ativo: false,
        deletedAt: agora
      }
    });

    await tx.placar.updateMany({
      where: {
        campeonatoId: idCampeonato,
        timeId: idTime,
        deletedAt: null
      },
      data: {
        visivel: false,
        deletedAt: agora
      }
    });
  });

  return listarEquipesCampeonato(idCampeonato);
}

async function listarJogadoresEquipeCampeonato(campeonatoId, timeId) {
  const idCampeonato = Number(campeonatoId);
  const idTime = Number(timeId);

  if (!Number.isInteger(idCampeonato) || idCampeonato <= 0) {
    throw new Error('ID do campeonato invalido.');
  }

  if (!Number.isInteger(idTime) || idTime <= 0) {
    throw new Error('ID do time invalido.');
  }

  const campeonato = await prisma.campeonato.findFirst({
    where: {
      id: idCampeonato,
      ativo: true,
      deletedAt: null
    },
    select: {
      id: true,
      nome: true,
      status: true
    }
  });

  if (!campeonato) {
    throw new Error('Campeonato nao encontrado.');
  }

  const vinculo = await prisma.campeonatoTime.findFirst({
    where: {
      campeonatoId: idCampeonato,
      timeId: idTime,
      ativo: true,
      deletedAt: null
    },
    select: {
      campeonatoId: true
    }
  });

  if (!vinculo) {
    throw new Error('Esse time nao esta vinculado ao campeonato.');
  }

  const time = await prisma.time.findFirst({
    where: {
      id: idTime,
      ativo: true,
      deletedAt: null
    },
    select: {
      id: true,
      nome: true,
      foto: true,
      jogadores: {
        where: {
          ativo: true,
          deletedAt: null,
          jogador: {
            ativo: true,
            deletedAt: null
          }
        },
        orderBy: {
          jogador: {
            nome: 'asc'
          }
        },
        select: {
          jogadorId: true,
          jogador: {
            select: {
              id: true,
              nome: true,
              numero: true,
              foto: true,
              funcao: {
                select: {
                  id: true,
                  nome: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!time) {
    throw new Error('Time nao encontrado.');
  }

  const jogadorIds = (time.jogadores || [])
    .map((item) => Number(item?.jogador?.id || item?.jogadorId))
    .filter((id) => Number.isInteger(id) && id > 0);

  const cartoesPorJogador = new Map();
  if (jogadorIds.length) {
    const acumulados = await prisma.jogadorPartida.groupBy({
      by: ['jogadorId'],
      where: {
        jogadorId: { in: jogadorIds },
        timeId: idTime,
        partida: {
          is: {
            campeonatoId: idCampeonato,
            status: 'FINALIZADA'
          }
        }
      },
      _sum: {
        cartoesAmarelos: true,
        cartoesVermelhos: true
      }
    });

    for (const item of acumulados) {
      cartoesPorJogador.set(Number(item.jogadorId), {
        amarelos: Number(item._sum?.cartoesAmarelos) || 0,
        vermelhos: Number(item._sum?.cartoesVermelhos) || 0
      });
    }
  }

  const suspensoes = await partidaService.mapearSuspensaoJogadores({
    campeonatoId: idCampeonato,
    faseId: null,
    jogadorIds
  });

  return {
    campeonatoId: idCampeonato,
    campeonatoNome: campeonato.nome,
    campeonatoStatus: campeonato.status,
    time: {
      id: time.id,
      nome: time.nome,
      foto: time.foto
    },
    jogadores: (time.jogadores || []).map((item) => {
      const jogador = item?.jogador || {};
      const jogadorId = Number(jogador.id || item?.jogadorId);
      const cartoes = cartoesPorJogador.get(jogadorId) || { amarelos: 0, vermelhos: 0 };
      const suspensao = suspensoes.get(jogadorId) || {};

      return {
        id: jogadorId,
        nome: jogador.nome || '',
        numero: jogador.numero ?? null,
        foto: jogador.foto || null,
        funcao: jogador.funcao || null,
        cartoesAmarelos: cartoes.amarelos,
        cartoesVermelhos: cartoes.vermelhos,
        suspenso: Boolean(suspensao.suspenso),
        motivoSuspensao: suspensao.motivoSuspensao || null,
        origemSuspensao: suspensao.origemSuspensao || null,
        suspensaoManual: Object.prototype.hasOwnProperty.call(suspensao, 'suspensaoManual')
          ? Boolean(suspensao.suspensaoManual)
          : null
      };
    })
  };
}

async function atualizarSuspensaoJogadorEquipeCampeonato(campeonatoId, timeId, jogadorId, payload = {}, usuarioId = null) {
  const idCampeonato = Number(campeonatoId);
  const idTime = Number(timeId);
  const idJogador = Number(jogadorId);

  if (!Number.isInteger(idCampeonato) || idCampeonato <= 0) {
    throw new Error('ID do campeonato invalido.');
  }

  if (!Number.isInteger(idTime) || idTime <= 0) {
    throw new Error('ID do time invalido.');
  }

  if (!Number.isInteger(idJogador) || idJogador <= 0) {
    throw new Error('ID do jogador invalido.');
  }

  if (typeof payload?.suspenso !== 'boolean') {
    throw new Error('O campo suspenso precisa ser booleano.');
  }

  const motivo = String(payload?.motivo || '').trim();
  const suspenso = Boolean(payload.suspenso);
  const tipoDuracaoSolicitado = String(payload?.tipoDuracao || '').toUpperCase();
  const quantidadePartidasSolicitada = Number(payload?.quantidadePartidas);
  const tipoDuracao = suspenso
    ? (tipoDuracaoSolicitado === 'PARTIDAS' ? 'PARTIDAS' : 'CAMPEONATO')
    : 'CAMPEONATO';
  const quantidadePartidas = suspenso && tipoDuracao === 'PARTIDAS'
    ? (Number.isInteger(quantidadePartidasSolicitada) ? quantidadePartidasSolicitada : null)
    : null;
  const editorId = Number(usuarioId);
  const editorValido = Number.isInteger(editorId) && editorId > 0 ? editorId : null;

  if (suspenso && tipoDuracao === 'PARTIDAS' && (!quantidadePartidas || quantidadePartidas < 1 || quantidadePartidas > 10)) {
    throw new Error('A quantidade de partidas da suspensao manual precisa ser entre 1 e 10.');
  }

  const motivoPadraoSuspensao = suspenso
    ? (tipoDuracao === 'PARTIDAS'
      ? `Suspensao manual definida por ${quantidadePartidas} ${quantidadePartidas === 1 ? 'partida' : 'partidas'}.`
      : 'Suspensao manual definida ate o fim do campeonato.')
    : 'Suspensao retirada manualmente pela administracao.';

  await prisma.$transaction(async (tx) => {
    const campeonato = await tx.campeonato.findFirst({
      where: {
        id: idCampeonato,
        ativo: true,
        deletedAt: null
      },
      select: {
        id: true,
        status: true,
        regras: true
      }
    });

    if (!campeonato) {
      throw new Error('Campeonato nao encontrado.');
    }

    if (statusCampeonatoEncerrado(campeonato.status)) {
      throw new Error('Nao e possivel editar suspensoes em campeonato encerrado.');
    }

    const vinculo = await tx.campeonatoTime.findFirst({
      where: {
        campeonatoId: idCampeonato,
        timeId: idTime,
        ativo: true,
        deletedAt: null
      },
      select: {
        campeonatoId: true
      }
    });

    if (!vinculo) {
      throw new Error('Esse time nao esta vinculado ao campeonato.');
    }

    const jogadorNoTime = await tx.jogadorTime.findFirst({
      where: {
        jogadorId: idJogador,
        timeId: idTime,
        ativo: true,
        deletedAt: null
      },
      select: {
        id: true
      }
    });

    if (!jogadorNoTime) {
      throw new Error('Jogador nao pertence ao time informado.');
    }

    const regrasBase = campeonato.regras && typeof campeonato.regras === 'object'
      ? campeonato.regras
      : {};

    const suspensoesManuais = extrairSuspensoesManuais(regrasBase);
    suspensoesManuais.set(idJogador, {
      jogadorId: idJogador,
      suspenso,
      motivo: motivo || (suspenso
        ? motivoPadraoSuspensao
        : 'Suspensao retirada manualmente pela administracao.'),
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: editorValido,
      timeId: idTime,
      tipoDuracao,
      quantidadePartidas
    });

    await tx.campeonato.update({
      where: {
        id: idCampeonato
      },
      data: {
        regras: {
          ...regrasBase,
          suspensoesManuais: serializarSuspensoesManuais(suspensoesManuais)
        }
      }
    });
  });

  const cartoes = await prisma.jogadorPartida.groupBy({
    by: ['jogadorId'],
    where: {
      jogadorId: idJogador,
      timeId: idTime,
      partida: {
        is: {
          campeonatoId: idCampeonato,
          status: 'FINALIZADA'
        }
      }
    },
    _sum: {
      cartoesAmarelos: true,
      cartoesVermelhos: true
    }
  });

  const cartoesAcumulados = cartoes[0]?._sum || {};
  const suspensoes = await partidaService.mapearSuspensaoJogadores({
    campeonatoId: idCampeonato,
    faseId: null,
    jogadorIds: [idJogador]
  });
  const statusSuspensao = suspensoes.get(idJogador) || {};

  return {
    jogadorId: idJogador,
    timeId: idTime,
    campeonatoId: idCampeonato,
    cartoesAmarelos: Number(cartoesAcumulados.cartoesAmarelos) || 0,
    cartoesVermelhos: Number(cartoesAcumulados.cartoesVermelhos) || 0,
    suspenso: Boolean(statusSuspensao.suspenso),
    motivoSuspensao: statusSuspensao.motivoSuspensao || null,
    origemSuspensao: statusSuspensao.origemSuspensao || null,
    suspensaoManual: Object.prototype.hasOwnProperty.call(statusSuspensao, 'suspensaoManual')
      ? Boolean(statusSuspensao.suspensaoManual)
      : null,
    partidasRestantesSuspensao: Number(statusSuspensao.partidasRestantesSuspensao) || 0
  };
}

async function listarArtilhariaCampeonato(campeonatoId, limite = 5) {
  const artilharia = await prisma.jogadorPartida.groupBy({
    by: ['jogadorId'],
    where: {
      partida: {
        campeonatoId: Number(campeonatoId),
        status: 'FINALIZADA'
      }
    },
    _sum: {
      gols: true
    },
    orderBy: {
      _sum: {
        gols: 'desc'
      }
    },
    take: limite
  });

  const jogadoresIds = artilharia.map(a => a.jogadorId);

  const jogadores = await prisma.jogador.findMany({
    where: {
      id: { in: jogadoresIds }
    },
    include: {
      times: {
        include: {
          time: true
        }
      }
    }
  });

  // Retorna dados já com nome, foto, gols e times
  return artilharia.map(item => {
    const jogador = jogadores.find(j => j.id === item.jogadorId);

    return {
      jogadorId: item.jogadorId,
      nome: jogador?.nome,
      foto: jogador?.foto,
      gols: item._sum.gols,
      times: jogador?.times.map(t => t.time.nome) || []
    };
  });
}

async function getCampeonatoById(id) {
  try {
    const campeonato = await prisma.campeonato.findUnique({
      where: { id: Number(id) },
      include: {
        modalidade: true,
        quadra: true,
        times: {
          where: { ativo: true, deletedAt: null },
          include: { time: true }
        },
        partidas: true,
        placares: true,
        agendamentos: {
          where: { deletedAt: null, status: 'Confirmado' },
          orderBy: { datahora: 'asc' }
        }
      }
    });

    if (!campeonato) return null;
    return {
      ...campeonato,
      ordemClassificacao: normalizarOrdemClassificacao(campeonato.ordemClassificacao, campeonato.modalidade?.nome),
      regras: normalizarRegrasCampeonato(campeonato.regras, campeonato.modalidade?.nome)
    };
  } catch (err) {
    throw err;
  }
}

async function getRegrasCampeonato(campeonatoId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: { id: Number(campeonatoId) },
    select: {
      id: true,
      modalidade: { select: { nome: true } },
      regras: true
    }
  });

  if (!campeonato) throw new Error("Campeonato nao encontrado");

  return normalizarRegrasCampeonato(campeonato.regras, campeonato.modalidade?.nome);
}

async function atualizarRegrasCampeonato(campeonatoId, regras) {
  const campeonatoAtual = await prisma.campeonato.findUnique({
    where: { id: Number(campeonatoId) },
    select: {
      id: true,
      modalidade: { select: { nome: true } }
    }
  });

  if (!campeonatoAtual) throw new Error("Campeonato nao encontrado");

  const atualizado = await prisma.campeonato.update({
    where: { id: Number(campeonatoId) },
    data: {
      regras: normalizarRegrasCampeonato(regras, campeonatoAtual.modalidade?.nome)
    },
    select: {
      id: true,
      regras: true
    }
  });

  return normalizarRegrasCampeonato(atualizado.regras, campeonatoAtual.modalidade?.nome);
}

async function atualizarDadosCampeonato(campeonatoId, dados) {
  const id = Number(campeonatoId);
  if (!id) throw new Error('ID de campeonato invalido');

  const existente = await prisma.campeonato.findUnique({
    where: { id },
    include: {
      modalidade: true,
      quadra: true,
      times: {
        where: { ativo: true, deletedAt: null },
        include: { time: true }
      },
      partidas: {
        where: { status: { notIn: ['CANCELADA', 'DELETADA'] } }
      },
      placares: true,
      agendamentos: {
        where: { deletedAt: null, status: 'Confirmado' },
        orderBy: { datahora: 'asc' }
      }
    }
  });

  if (!existente) throw new Error('Campeonato nao encontrado');

  const payload = {};
  const datasJogosInformadas = Array.isArray(dados?.datasJogos)
    ? normalizarDatasJogos(dados.datasJogos)
    : null;
  const agendaAtual = normalizarDatasJogos(
    (Array.isArray(existente.agendamentos) ? existente.agendamentos : []).map((agendamento) =>
      agendamento?.datahora || new Date(
        agendamento.ano,
        agendamento.mes - 1,
        agendamento.dia,
        agendamento.hora,
        0,
        0
      )
    )
  );
  const usuarioIdInformado = Number(dados?.usuarioId);
  const usuarioAgendamentoId = Number.isFinite(usuarioIdInformado) && usuarioIdInformado > 0
    ? usuarioIdInformado
    : (Array.isArray(existente.agendamentos) ? existente.agendamentos.find(item => item?.usuarioId)?.usuarioId : null) || null;

  if (typeof dados.nome === 'string' && dados.nome.trim()) {
    payload.nome = dados.nome.trim();
  }

  if (typeof dados.foto === 'string') {
    payload.foto = dados.foto.trim() || null;
  }

  if (dados.quadraId !== undefined) {
    payload.quadraId = dados.quadraId ? Number(dados.quadraId) : null;
  }

  if (dados.dataFim !== undefined) {
    payload.dataFim = dados.dataFim ? paraDataValida(dados.dataFim) : null;
    if (dados.dataFim && !payload.dataFim) {
      throw new Error('Data final do campeonato invalida');
    }
  }

  if (typeof dados.status === 'string' && dados.status.trim()) {
    const statusNormalizado = dados.status.trim().toUpperCase();
    const statusPermitidos = ['EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO'];
    if (!statusPermitidos.includes(statusNormalizado)) {
      throw new Error('Status de campeonato invalido');
    }
    payload.status = statusNormalizado;
  }

  if (datasJogosInformadas && !datasJogosInformadas.length) {
    throw new Error('Adicione ao menos um horario para o campeonato.');
  }

  const quadraIdFinal = payload.quadraId !== undefined ? payload.quadraId : existente.quadraId;
  const quadraAlterada = payload.quadraId !== undefined && Number(payload.quadraId || 0) !== Number(existente.quadraId || 0);
  const agendaFinal = datasJogosInformadas || agendaAtual;
  const houveAtualizacaoAgenda = Array.isArray(dados?.datasJogos) || quadraAlterada;
  const nomeCampeonatoFinal = payload.nome || existente.nome;

  if (dados.quadraId !== undefined && !quadraIdFinal && (agendaAtual.length || existente.partidas.length)) {
    throw new Error('Nao e possivel remover a quadra de um campeonato com horarios ou partidas.');
  }

  if (houveAtualizacaoAgenda && !quadraIdFinal) {
    throw new Error('Selecione uma quadra para configurar os horarios do campeonato.');
  }

  if (datasJogosInformadas) {
    const mapaAgendaAtual = new Map(agendaAtual.map(dataItem => [obterChaveDataHora(dataItem), dataItem]));
    const mapaAgendaFinal = new Map(agendaFinal.map(dataItem => [obterChaveDataHora(dataItem), dataItem]));
    const datasAdicionadas = agendaFinal.filter(dataItem => !mapaAgendaAtual.has(obterChaveDataHora(dataItem)));

    if (datasAdicionadas.some(dataItem => dataItem.getTime() < Date.now())) {
      throw new Error('Novos horarios do campeonato devem ser cadastrados a partir do momento atual.');
    }

    const chavesRemovidas = [...mapaAgendaAtual.keys()].filter(chave => !mapaAgendaFinal.has(chave));
    if (chavesRemovidas.length) {
      const partidasForaDaAgenda = existente.partidas.filter((partida) =>
        chavesRemovidas.includes(obterChaveDataHora(partida?.data))
      );

      if (partidasForaDaAgenda.length > 0) {
        throw new Error('Existem partidas vinculadas a horarios removidos da agenda. Ajuste ou remova essas partidas antes de salvar.');
      }
    }

    payload.dataInicio = agendaFinal[0];
    if (payload.dataFim && payload.dataFim.getTime() < agendaFinal[agendaFinal.length - 1].getTime()) {
      throw new Error('A data de finalizacao nao pode ser menor que o ultimo horario da agenda.');
    }
    if (dados.dataFim === undefined) {
      payload.dataFim = agendaFinal[agendaFinal.length - 1];
    }
  }

  const dataInicioComparacao = payload.dataInicio || existente.dataInicio;
  if (payload.dataFim && dataInicioComparacao && payload.dataFim.getTime() < new Date(dataInicioComparacao).getTime()) {
    throw new Error('A data final do campeonato nao pode ser menor que a data inicial.');
  }

  const campeonatoSeraFinalizado =
    payload.status === 'FINALIZADO' &&
    !statusCampeonatoEncerrado(existente.status);

  if (campeonatoSeraFinalizado && payload.dataFim == null) {
    payload.dataFim = existente.dataFim || new Date();
  }

  const agendamentosRecusadosParaNotificar = [];
  let fasesComPartidasFinalizadas = [];

  const atualizado = await prisma.$transaction(async (tx) => {
    if (houveAtualizacaoAgenda) {
      const mapaAgendamentosExistentes = new Map(
        existente.agendamentos.map((agendamento) => {
          const dataAgendamento = paraDataValida(
            agendamento?.datahora || new Date(
              agendamento.ano,
              agendamento.mes - 1,
              agendamento.dia,
              agendamento.hora,
              0,
              0
            )
          );

          return [obterChaveDataHora(dataAgendamento), agendamento];
        })
      );
      const mapaAgendaFinal = new Map(agendaFinal.map(dataItem => [obterChaveDataHora(dataItem), dataItem]));

      const idsParaCancelar = [...mapaAgendamentosExistentes.entries()]
        .filter(([chave]) => !mapaAgendaFinal.has(chave))
        .map(([, agendamento]) => agendamento.id);
      const datasParaCriar = [...mapaAgendaFinal.entries()]
        .filter(([chave]) => !mapaAgendamentosExistentes.has(chave))
        .map(([, dataItem]) => dataItem);

      const conflitosAtualizados = await cancelarConflitosAgendamentoCampeonato(tx, {
        quadraId: quadraIdFinal,
        datasJogos: quadraAlterada ? agendaFinal : datasParaCriar,
        nomeCampeonato: nomeCampeonatoFinal
      });
      agendamentosRecusadosParaNotificar.push(...conflitosAtualizados);

      if (idsParaCancelar.length > 0) {
        await tx.agendamento.updateMany({
          where: { id: { in: idsParaCancelar } },
          data: {
            status: 'Cancelado',
            deletedAt: new Date()
          }
        });
      }

      if (existente.agendamentos.length > 0) {
        await tx.agendamento.updateMany({
          where: {
            campeonatoId: id,
            deletedAt: null,
            status: 'Confirmado'
          },
          data: {
            quadraId: Number(quadraIdFinal),
            usuarioId: usuarioAgendamentoId,
            modalidadeId: Number(existente.modalidadeId)
          }
        });
      }

      if (datasParaCriar.length > 0) {
        await tx.agendamento.createMany({
          data: datasParaCriar.map((dataItem) =>
            montarPayloadAgendamentoCampeonato(dataItem, {
              quadraId: quadraIdFinal,
              usuarioId: usuarioAgendamentoId,
              modalidadeId: existente.modalidadeId,
              campeonatoId: id
            })
          )
        });
      }

      if (quadraAlterada) {
        await tx.partida.updateMany({
          where: {
            campeonatoId: id,
            status: { notIn: ['CANCELADA', 'DELETADA'] }
          },
          data: {
            quadraId: quadraIdFinal ? Number(quadraIdFinal) : null
          }
        });
      }
    }

    if (campeonatoSeraFinalizado) {
      fasesComPartidasFinalizadas = await encerrarPartidasAbertasDoCampeonato(tx, id);
    }

    return tx.campeonato.update({
      where: { id },
      data: payload,
      include: {
        modalidade: true,
        quadra: true,
        times: {
          where: { ativo: true, deletedAt: null },
          include: { time: true }
        },
        partidas: true,
        placares: true,
        agendamentos: {
          where: { deletedAt: null, status: 'Confirmado' },
          orderBy: { datahora: 'asc' }
        }
      }
    });
  });

  if (fasesComPartidasFinalizadas.length > 0) {
    await Promise.all(
      fasesComPartidasFinalizadas.map((faseId) => partidaService.recalcularPlacarCampeonatoFase(id, faseId))
    );
  }

  if (agendamentosRecusadosParaNotificar.length > 0) {
    const envios = agendamentosRecusadosParaNotificar
      .filter(item => item?.usuario?.email)
      .map(item => enviarEmailStatusAgendamento(item));

    const resultados = await Promise.allSettled(envios);
    resultados.forEach((resultado) => {
      if (resultado.status === 'rejected') {
        console.error('Erro ao enviar email de recusa por prioridade de campeonato:', resultado.reason);
      }
    });
  }

  return {
    ...atualizado,
    ordemClassificacao: normalizarOrdemClassificacao(atualizado.ordemClassificacao, atualizado.modalidade?.nome),
    regras: normalizarRegrasCampeonato(atualizado.regras, atualizado.modalidade?.nome)
  };
}

async function finalizarCampeonato(campeonatoId) {
  const id = Number(campeonatoId);
  if (!id) throw new Error('ID de campeonato invalido');

  const existente = await prisma.campeonato.findUnique({
    where: { id },
    select: { id: true, status: true, dataFim: true }
  });

  if (!existente) throw new Error('Campeonato nao encontrado');

  let fasesComPartidasFinalizadas = [];

  const atualizado = await prisma.$transaction(async (tx) => {
    fasesComPartidasFinalizadas = await encerrarPartidasAbertasDoCampeonato(tx, id);

    return tx.campeonato.update({
      where: { id },
      data: {
        status: 'FINALIZADO',
        dataFim: existente.dataFim || new Date()
      },
      include: {
        modalidade: true,
        quadra: true,
        times: true,
        partidas: true,
        placares: true
      }
    });
  });

  if (fasesComPartidasFinalizadas.length > 0) {
    await Promise.all(
      fasesComPartidasFinalizadas.map((faseId) => partidaService.recalcularPlacarCampeonatoFase(id, faseId))
    );
  }

  return {
    ...atualizado,
    regras: normalizarRegrasCampeonato(atualizado.regras, atualizado.modalidade?.nome)
  };
}

async function gerarMataMataPontosCorridos(campeonatoId, opcoes = {}) {
  const idCampeonato = Number(campeonatoId);
  const usuarioId = Number(opcoes?.usuarioId);
  const faseOrigemIdInformada = Number(opcoes?.faseOrigemId);

  if (!Number.isInteger(idCampeonato) || idCampeonato <= 0) {
    throw new Error('ID do campeonato invalido.');
  }

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    throw new Error('Usuario invalido para gerar o mata-mata.');
  }

  return prisma.$transaction(async (tx) => {
    const campeonato = await tx.campeonato.findFirst({
      where: {
        id: idCampeonato,
        ativo: true,
        deletedAt: null
      },
      select: {
        id: true,
        nome: true,
        tipo: true,
        status: true,
        modalidadeId: true,
        quadraId: true,
        fases: {
          where: {
            ativo: true,
            deletedAt: null
          },
          select: {
            id: true,
            nome: true,
            rodadas: {
              where: { ativo: true },
              select: {
                id: true,
                nome: true
              },
              orderBy: { id: 'asc' }
            }
          },
          orderBy: { id: 'asc' }
        },
        partidas: {
          where: {
            status: { notIn: ['CANCELADA', 'DELETADA'] }
          },
          select: {
            id: true,
            faseId: true,
            rodadaId: true,
            data: true,
            status: true
          }
        },
        agendamentos: {
          where: {
            deletedAt: null,
            status: 'Confirmado'
          },
          select: {
            datahora: true
          },
          orderBy: { datahora: 'asc' }
        }
      }
    });

    if (!campeonato) {
      throw new Error('Campeonato nao encontrado.');
    }

    if (statusCampeonatoEncerrado(campeonato.status)) {
      throw new Error('Nao e possivel gerar o mata-mata em campeonato encerrado.');
    }

    const tipoCampeonato = String(campeonato.tipo || '').toUpperCase();
    if (tipoCampeonato !== 'PONTOS_CORRIDOS_ELIMINATORIAS') {
      throw new Error('Transicao para mata-mata disponivel apenas para pontos corridos + eliminatorias.');
    }

    const fasesAtivas = Array.isArray(campeonato.fases) ? campeonato.fases : [];
    const faseEliminatoria = fasesAtivas.find((fase) => faseEhEliminatoria(fase.nome));
    if (!faseEliminatoria) {
      throw new Error('Fase de eliminatorias nao encontrada no campeonato.');
    }

    const faseOrigem = Number.isInteger(faseOrigemIdInformada) && faseOrigemIdInformada > 0
      ? fasesAtivas.find((fase) => Number(fase.id) === faseOrigemIdInformada)
      : fasesAtivas.find((fase) => !faseEhEliminatoria(fase.nome));

    if (!faseOrigem) {
      throw new Error('Fase classificatoria nao encontrada para gerar o mata-mata.');
    }

    if (Number(faseOrigem.id) === Number(faseEliminatoria.id) || faseEhEliminatoria(faseOrigem.nome)) {
      throw new Error('Selecione uma fase de liga/classificacao para gerar o mata-mata.');
    }

    const partidasFaseOrigem = (campeonato.partidas || []).filter(
      (partida) => Number(partida.faseId) === Number(faseOrigem.id)
    );
    if (!partidasFaseOrigem.length) {
      throw new Error('Nao ha partidas na fase classificatoria para calcular classificados.');
    }

    const partidasPendentes = partidasFaseOrigem.filter(
      (partida) => String(partida.status || '').toUpperCase() !== 'FINALIZADA'
    );
    if (partidasPendentes.length) {
      throw new Error('Finalize todas as partidas da fase classificatoria antes de gerar o mata-mata.');
    }

    const partidasEliminatoriasExistentes = (campeonato.partidas || []).filter(
      (partida) => Number(partida.faseId) === Number(faseEliminatoria.id)
    );
    if (partidasEliminatoriasExistentes.length) {
      throw new Error('A fase eliminatoria ja possui confrontos cadastrados.');
    }

    const placaresFaseOrigem = await tx.placar.findMany({
      where: {
        campeonatoId: idCampeonato,
        faseId: Number(faseOrigem.id),
        visivel: true,
        deletedAt: null
      },
      include: {
        time: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      orderBy: [
        { posicao: 'asc' },
        { pontuacao: 'desc' },
        { vitorias: 'desc' },
        { saldoDeGols: 'desc' },
        { golsPro: 'desc' },
        { timeId: 'asc' }
      ]
    });

    const placaresOrdenados = placaresFaseOrigem.filter(
      (placar) => Number.isInteger(Number(placar.timeId)) && Number(placar.timeId) > 0
    );

    const quantidadeClassificados = obterQuantidadeClassificadosMataMata(placaresOrdenados.length);
    if (!quantidadeClassificados) {
      throw new Error('Sao necessarios ao menos 2 times classificados para gerar o mata-mata.');
    }

    const classificados = placaresOrdenados.slice(0, quantidadeClassificados);
    const confrontos = montarConfrontosMataMata(classificados.map((item) => Number(item.timeId)));
    if (!confrontos.length) {
      throw new Error('Nao foi possivel montar os confrontos da eliminatoria.');
    }

    const rodadaInicialNome = obterNomeRodadaInicialMataMata(quantidadeClassificados);
    let rodadaInicial = (faseEliminatoria.rodadas || []).find(
      (rodada) => normalizarTexto(rodada.nome) === normalizarTexto(rodadaInicialNome)
    );

    if (!rodadaInicial) {
      rodadaInicial = await tx.rodada.create({
        data: {
          nome: rodadaInicialNome,
          faseId: Number(faseEliminatoria.id),
          ativo: true
        }
      });
    }

    const chavesDatasOcupadas = new Set(
      (campeonato.partidas || [])
        .map((partida) => obterChaveDataHora(partida?.data))
        .filter(Boolean)
    );

    const inicioDoProximoDia = obterInicioDoProximoDia();
    const mapaSlotsLivres = new Map();
    for (const agendamento of campeonato.agendamentos || []) {
      const dataHora = paraDataValida(agendamento?.datahora);
      if (!dataHora || dataHora < inicioDoProximoDia) continue;

      const chave = obterChaveDataHora(dataHora);
      if (!chave || chavesDatasOcupadas.has(chave) || mapaSlotsLivres.has(chave)) continue;
      mapaSlotsLivres.set(chave, dataHora);
    }

    const slotsDisponiveis = Array.from(mapaSlotsLivres.values())
      .sort((a, b) => a.getTime() - b.getTime());

    if (slotsDisponiveis.length < confrontos.length) {
      throw new Error(
        `Nao ha horarios livres suficientes na agenda do campeonato para gerar ${confrontos.length} confronto(s).`
      );
    }

    const partidasGeradas = [];
    for (let indice = 0; indice < confrontos.length; indice += 1) {
      const confronto = confrontos[indice];
      const dataPartida = slotsDisponiveis[indice];

      const partidaCriada = await tx.partida.create({
        data: {
          status: 'AGENDADA',
          data: dataPartida,
          campeonatoId: idCampeonato,
          faseId: Number(faseEliminatoria.id),
          rodadaId: Number(rodadaInicial.id),
          modalidadeId: Number(campeonato.modalidadeId),
          quadraId: campeonato.quadraId ? Number(campeonato.quadraId) : null,
          timeAId: Number(confronto.timeAId),
          timeBId: Number(confronto.timeBId),
          usuarioCriadorId: usuarioId
        },
        select: {
          id: true,
          data: true,
          status: true,
          faseId: true,
          rodadaId: true,
          timeAId: true,
          timeBId: true
        }
      });

      partidasGeradas.push(partidaCriada);
    }

    return {
      campeonatoId: idCampeonato,
      faseOrigemId: Number(faseOrigem.id),
      faseOrigemNome: String(faseOrigem.nome || ''),
      faseEliminatoriaId: Number(faseEliminatoria.id),
      faseEliminatoriaNome: String(faseEliminatoria.nome || ''),
      rodadaInicialId: Number(rodadaInicial.id),
      rodadaInicialNome: String(rodadaInicial.nome || rodadaInicialNome),
      quantidadeClassificados,
      classificados: classificados.map((item, indice) => ({
        posicao: indice + 1,
        timeId: Number(item.timeId),
        nomeTime: String(item?.time?.nome || '')
      })),
      partidasGeradas
    };
  });
}

async function listarPlacarPorFase(campeonatoId, faseId = null) {
  if (!campeonatoId) throw new Error("campeonatoId é obrigatório");

  const faseIdNum = Number(faseId);
  const whereFase = {
    campeonatoId: Number(campeonatoId),
    ativo: true
  };

  if (Number.isFinite(faseIdNum) && faseIdNum > 0) {
    whereFase.id = faseIdNum;
  }

  // Busca fases do campeonato (ou apenas a fase solicitada)
  const fases = await prisma.fase.findMany({
    where: whereFase,
    orderBy: { id: 'asc' },
    include: {
      placares: {
        where: { visivel: true, deletedAt: null },
        include: { time: true },
        orderBy: { posicao: 'asc' }
      }
    }
  });

  // Retorna cada fase com seus placares
  return fases.map(fase => ({
    faseId: fase.id,
    nomeFase: fase.nome,
    placares: fase.placares
  }));
}

async function listarFasesERodadas(campeonatoId) {
  if (!campeonatoId) {
    throw new Error("campeonatoId é obrigatório");
  }

  const fases = await prisma.fase.findMany({
    where: { campeonatoId: Number(campeonatoId), ativo: true },
    orderBy: { id: "asc" },
    include: {
      rodadas: {
        orderBy: { id: "asc" }
      }
    }
  });

  return fases;
}

async function criarFase(campeonatoId, nome, times) {
  try {
    const fase = await prisma.fase.create({
      data: {
        nome,
        campeonatoId,
        ativo: true,
      },
    });

    const placaresData = times.map(timeId => ({
      campeonatoId,
      faseId: fase.id,
      timeId,
    }));

    await prisma.placar.createMany({
      data: placaresData,
      skipDuplicates: true,
    });

    return fase;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function criarRodada(faseId, nomeRodada) {
  const fase = await prisma.fase.findUnique({
    where: { id: faseId },
  });

  if (!fase) {
    throw new Error("Fase não encontrada");
  }

  const rodada = await prisma.rodada.create({
    data: {
      nome: nomeRodada,
      faseId: faseId,
    },
  });

  return rodada;
}

function resultadoTimeNaPartida(partida, timeId) {
  const ehTimeA = Number(partida.timeAId) === Number(timeId);
  const ehTimeB = Number(partida.timeBId) === Number(timeId);
  if (!ehTimeA && !ehTimeB) return null;

  const pontosA = Number(partida.pontosTimeA) || 0;
  const pontosB = Number(partida.pontosTimeB) || 0;
  const woA = Boolean(partida.woTimeA);
  const woB = Boolean(partida.woTimeB);

  if (woA && !woB) return ehTimeA ? 'D' : 'V';
  if (woB && !woA) return ehTimeA ? 'V' : 'D';
  if (pontosA > pontosB) return ehTimeA ? 'V' : 'D';
  if (pontosB > pontosA) return ehTimeA ? 'D' : 'V';
  return 'E';
}

function chaveHistorico(faseId, timeId) {
  return `${Number(faseId)}:${Number(timeId)}`;
}

function adicionarResultadoNoHistorico(historicoMap, faseId, timeId, resultado) {
  if (!faseId || !timeId || !resultado) return;
  if (!['V', 'E', 'D'].includes(resultado)) return;

  const chave = chaveHistorico(faseId, timeId);
  const atual = historicoMap.get(chave) || [];
  if (atual.length >= 3) return;

  atual.push(resultado);
  historicoMap.set(chave, atual);
}

async function listarPlacarPorFaseComUltimosJogos(campeonatoId, faseId = null) {
  const fases = await listarPlacarPorFase(campeonatoId, faseId);
  if (!Array.isArray(fases) || !fases.length) return [];

  const fasesFiltradas = fases;

  if (!fasesFiltradas.length) return [];

  const fasesIds = fasesFiltradas.map(fase => Number(fase.faseId));
  const partidasFinalizadas = await prisma.partida.findMany({
    where: {
      campeonatoId: Number(campeonatoId),
      faseId: { in: fasesIds },
      status: 'FINALIZADA'
    },
    select: {
      id: true,
      faseId: true,
      timeAId: true,
      timeBId: true,
      pontosTimeA: true,
      pontosTimeB: true,
      woTimeA: true,
      woTimeB: true,
      data: true
    },
    orderBy: [
      { data: 'desc' },
      { id: 'desc' }
    ]
  });

  const historicoPorTimeEFase = new Map();
  for (const partida of partidasFinalizadas) {
    const resultadoA = resultadoTimeNaPartida(partida, partida.timeAId);
    const resultadoB = resultadoTimeNaPartida(partida, partida.timeBId);

    adicionarResultadoNoHistorico(historicoPorTimeEFase, partida.faseId, partida.timeAId, resultadoA);
    adicionarResultadoNoHistorico(historicoPorTimeEFase, partida.faseId, partida.timeBId, resultadoB);
  }

  return fasesFiltradas.map(fase => ({
    ...fase,
    placares: (fase.placares || []).map(placar => ({
      ...placar,
      ultimosJogos: historicoPorTimeEFase.get(chaveHistorico(fase.faseId, placar.timeId)) || []
    }))
  }));
}

module.exports = {
  CRITERIOS_MODALIDADE,
  REGRAS_PADRAO_CAMPEONATO,
  criarCampeonato,
  removerCampeonato,
  listarCampeonatosPorModalidade,
  listarCampeonatosAnoAtual,
  listarTodosCampeonatosAtivos,
  listarCampeonatosEmAndamentoMesario,
  listarMesariosCampeonato,
  atualizarMesariosCampeonato,
  listarEquipesCampeonato,
  listarEquipesDisponiveisCampeonato,
  adicionarEquipeCampeonato,
  removerEquipeCampeonato,
  listarJogadoresEquipeCampeonato,
  atualizarSuspensaoJogadorEquipeCampeonato,
  listarArtilhariaCampeonato,
  getCampeonatoById,
  atualizarDadosCampeonato,
  finalizarCampeonato,
  gerarMataMataPontosCorridos,
  getRegrasCampeonato,
  atualizarRegrasCampeonato,
  listarPlacarPorFase: listarPlacarPorFaseComUltimosJogos,
  listarFasesERodadas,
  criarFase,
  criarRodada
};
