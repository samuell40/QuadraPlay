const prisma = require("../lib/prisma");
const { enviarEmailStatusAgendamento } = require("./email.service");
const { startOfWeek, endOfWeek, addMinutes } = require("date-fns");

const INCLUDE_AGENDAMENTO_LISTAGEM = {
  quadra: true,
  modalidade: true,
  time: true,
  campeonato: { select: { id: true, nome: true } },
  usuario: { select: { id: true, nome: true, email: true, permissaoId: true } },
};

const ID_PERMISSAO_DESENVOLVEDOR = 1;
const ID_PERMISSAO_ADMINISTRADOR = 2;
const ID_PERMISSAO_USUARIO = 3;
const ID_PERMISSAO_MESARIO = 4;
const ID_PERMISSAO_TREINADOR = 5;
const INTERVALO_RECUSA_VENCIDOS_MS = 60 * 1000;
let ultimoProcessamentoRecusaVencidos = 0;

const PERFIS_COM_REGRAS_AGENDAMENTO = new Set([
  ID_PERMISSAO_USUARIO,
  ID_PERMISSAO_MESARIO,
  ID_PERMISSAO_TREINADOR,
]);
const MIN_HORARIOS_DISPONIVEIS_ENCAIXE = 1;
const JANELA_ENCAIXE_HORAS = 1;
const HORARIOS_PADRAO_QUADRA = Array.from(
  { length: 17 },
  (_, indice) => `${String(indice + 7).padStart(2, "0")}:00`,
);
const ESCOLAS_AULA_VALIDAS = new Set([
  "EEAF",
  "EEJAM",
  "EMFPA",
  "CEMEI",
  "DANÇA",
]);

const gerarCodigoVerificacao = () => {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let codigo = "";
  for (let i = 0; i < 6; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
};

const obterDataHoraAgendamento = (agendamento) => {
  if (agendamento?.datahora) {
    const data = new Date(agendamento.datahora);
    if (!Number.isNaN(data.getTime())) return data;
  }

  if (
    Number.isFinite(Number(agendamento?.ano)) &&
    Number.isFinite(Number(agendamento?.mes)) &&
    Number.isFinite(Number(agendamento?.dia)) &&
    Number.isFinite(Number(agendamento?.hora))
  ) {
    return new Date(
      Number(agendamento.ano),
      Number(agendamento.mes) - 1,
      Number(agendamento.dia),
      Number(agendamento.hora),
      0,
      0
    );
  }

  return null;
};

const obterChaveDataHora = (data) => {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) return "";

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");
  return `${ano}-${mes}-${dia} ${hora}:${minuto}`;
};

const normalizarHorarioGrade = (valor) => {
  const texto = String(valor || "").trim();
  const match = texto.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) return "";

  const hora = Number(match[1]);
  const minuto = Number(match[2] ?? 0);

  if (!Number.isInteger(hora) || hora < 0 || hora > 23) return "";
  if (!Number.isInteger(minuto) || minuto < 0 || minuto > 59) return "";

  return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
};

const obterHorariosQuadraParaDia = async (quadraId, diaSemana) => {
  const horariosConfigurados = await prisma.horarioQuadra.findMany({
    where: {
      quadraId: Number(quadraId),
      diaSemana: Number(diaSemana),
    },
    select: { horario: true },
    orderBy: { horario: "asc" },
  });

  if (!horariosConfigurados.length) {
    return [...HORARIOS_PADRAO_QUADRA];
  }

  const horariosNormalizados = [
    ...new Set(
      horariosConfigurados
        .map((item) => normalizarHorarioGrade(item.horario))
        .filter(Boolean),
    ),
  ];

  return horariosNormalizados.sort();
};

const contarHorariosDisponiveisNoDia = async ({ quadraId, dataInicio }) => {
  const diaSemana = dataInicio.getDay();
  const dia = dataInicio.getDate();
  const mes = dataInicio.getMonth() + 1;
  const ano = dataInicio.getFullYear();

  const [horariosQuadra, agendamentosDoDia] = await Promise.all([
    obterHorariosQuadraParaDia(quadraId, diaSemana),
    prisma.agendamento.findMany({
      where: {
        quadraId: Number(quadraId),
        ano,
        mes,
        dia,
        deletedAt: null,
        status: { not: "Recusado" },
      },
      select: {
        hora: true,
        duracao: true,
        datahora: true,
      },
    }),
  ]);

  const horariosOcupados = new Set();

  agendamentosDoDia.forEach((agendamento) => {
    let horaInicial = Number.isInteger(Number(agendamento?.hora))
      ? Number(agendamento.hora)
      : null;

    if (
      (!Number.isInteger(horaInicial) || horaInicial < 0 || horaInicial > 23) &&
      agendamento?.datahora
    ) {
      const dataDoAgendamento = new Date(agendamento.datahora);
      if (!Number.isNaN(dataDoAgendamento.getTime())) {
        horaInicial = dataDoAgendamento.getHours();
      }
    }

    if (!Number.isInteger(horaInicial) || horaInicial < 0 || horaInicial > 23) return;

    const duracaoHoras = Math.max(1, Number(agendamento?.duracao) || 1);
    for (let indice = 0; indice < duracaoHoras; indice += 1) {
      horariosOcupados.add(`${String(horaInicial + indice).padStart(2, "0")}:00`);
    }
  });

  return horariosQuadra.filter((horario) => !horariosOcupados.has(horario)).length;
};

const obterFiltroSemana = (dataBase) => {
  const inicioSemana = startOfWeek(dataBase, { weekStartsOn: 1 });
  const fimSemana = endOfWeek(dataBase, { weekStartsOn: 1 });

  return {
    OR: [
      {
        datahora: {
          gte: inicioSemana,
          lte: fimSemana,
        },
      },
      {
        datahora: null,
        AND: [
          {
            OR: [
              { ano: { gt: inicioSemana.getFullYear() } },
              {
                ano: inicioSemana.getFullYear(),
                OR: [
                  { mes: { gt: inicioSemana.getMonth() + 1 } },
                  {
                    mes: inicioSemana.getMonth() + 1,
                    dia: { gte: inicioSemana.getDate() },
                  },
                ],
              },
            ],
          },
          {
            OR: [
              { ano: { lt: fimSemana.getFullYear() } },
              {
                ano: fimSemana.getFullYear(),
                OR: [
                  { mes: { lt: fimSemana.getMonth() + 1 } },
                  {
                    mes: fimSemana.getMonth() + 1,
                    dia: { lte: fimSemana.getDate() },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
};

const obterUsuarioValidoParaAgendamento = async (usuarioId) => {
  const idUsuario = Number(usuarioId);

  const usuario = await prisma.usuario.findUnique({
    where: { id: idUsuario },
    select: {
      id: true,
      permissaoId: true,
      ativo: true,
      deletedAt: true,
    },
  });

  if (!usuario || !usuario.ativo || usuario.deletedAt) {
    throw { status: 404, message: "Usuario nao encontrado." };
  }

  return usuario;
};

const validarAgendamentoPorTimeParaUsuario = async ({
  usuarioId,
  timeId,
  usuarioCarregado = null,
}) => {
  const idUsuario = Number(usuarioId);
  const idTime = Number(timeId);

  if (!Number.isInteger(idTime) || idTime <= 0) return;

  const usuario = usuarioCarregado || (await obterUsuarioValidoParaAgendamento(idUsuario));

  const permissaoId = Number(usuario.permissaoId);
  const podeAgendarPorQualquerTime =
    permissaoId === ID_PERMISSAO_DESENVOLVEDOR ||
    permissaoId === ID_PERMISSAO_ADMINISTRADOR;

  if (podeAgendarPorQualquerTime) return;

  if (permissaoId !== ID_PERMISSAO_TREINADOR) {
    throw {
      status: 403,
      message:
        "Somente usuarios com permissao de treinador, administrador ou desenvolvedor podem agendar por time.",
    };
  }

  const vinculoTreinador = await prisma.treinadorTime.findFirst({
    where: {
      usuarioId: idUsuario,
      timeId: idTime,
      ativo: true,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!vinculoTreinador) {
    throw {
      status: 403,
      message: "Voce nao esta vinculado como treinador deste time.",
    };
  }
};

const enriquecerAgendamentosComResumoEvento = async (agendamentos = []) => {
  const base = (Array.isArray(agendamentos) ? agendamentos : []).map((agendamento) => ({
    ...agendamento,
    duracao: agendamento.duracao ?? 1,
  }));

  const relacionadosCampeonato = base.filter(
    (agendamento) => Number(agendamento?.campeonatoId) > 0
  );

  if (!relacionadosCampeonato.length) {
    return base;
  }

  const campeonatoIds = [...new Set(
    relacionadosCampeonato
      .map((agendamento) => Number(agendamento.campeonatoId))
      .filter((id) => Number.isFinite(id) && id > 0)
  )];

  const quadraIds = [...new Set(
    relacionadosCampeonato
      .map((agendamento) => Number(agendamento.quadraId))
      .filter((id) => Number.isFinite(id) && id > 0)
  )];

  if (!campeonatoIds.length || !quadraIds.length) {
    return base;
  }

  const partidas = await prisma.partida.findMany({
    where: {
      campeonatoId: { in: campeonatoIds },
      quadraId: { in: quadraIds },
      status: { notIn: ["CANCELADA", "DELETADA"] },
    },
    select: {
      id: true,
      campeonatoId: true,
      quadraId: true,
      data: true,
      timeA: { select: { id: true, nome: true, foto: true } },
      timeB: { select: { id: true, nome: true, foto: true } },
    },
  });

  const resumoPorChave = new Map();
  partidas.forEach((partida) => {
    const dataPartida = partida?.data ? new Date(partida.data) : null;
    const chaveDataHora = obterChaveDataHora(dataPartida);
    if (!chaveDataHora) return;

    const chave = `${partida.campeonatoId}|${partida.quadraId}|${chaveDataHora}`;
    if (!resumoPorChave.has(chave)) {
      const nomeTimeA = String(partida.timeA?.nome || "Time A").trim() || "Time A";
      const nomeTimeB = String(partida.timeB?.nome || "Time B").trim() || "Time B";

      resumoPorChave.set(
        chave,
        {
          resumoEvento: `${nomeTimeA} x ${nomeTimeB}`,
          partidaResumo: {
            id: Number(partida.id) || null,
            timeA: {
              id: Number(partida.timeA?.id) || null,
              nome: nomeTimeA,
              foto: String(partida.timeA?.foto || "").trim(),
            },
            timeB: {
              id: Number(partida.timeB?.id) || null,
              nome: nomeTimeB,
              foto: String(partida.timeB?.foto || "").trim(),
            },
          },
        }
      );
    }
  });

  return base.map((agendamento) => {
    const dataAgendamento = obterDataHoraAgendamento(agendamento);
    const chaveDataHora = obterChaveDataHora(dataAgendamento);
    const chaveResumo = chaveDataHora
      ? `${agendamento.campeonatoId}|${agendamento.quadraId}|${chaveDataHora}`
      : "";

    const resumoPartida = chaveResumo ? resumoPorChave.get(chaveResumo) : null;

    return {
      ...agendamento,
      resumoEvento:
        resumoPartida?.resumoEvento ||
        agendamento?.campeonato?.nome ||
        "",
      partidaResumo: resumoPartida?.partidaResumo || null,
    };
  });
};

const listarAgendamentosService = async (usuarioId) => {
  await recusarAgendamentosVencidos();
  if (!usuarioId) throw { status: 400, message: "UsuÃ¡rio nÃ£o informado." };

  const agendamentos = await prisma.agendamento.findMany({
    where: { usuarioId, deletedAt: null },
    include: INCLUDE_AGENDAMENTO_LISTAGEM,
    orderBy: { datahora: "asc" },
  });
  return enriquecerAgendamentosComResumoEvento(agendamentos);
};

const listarTodosAgendamentosService = async () => {
  await recusarAgendamentosVencidos();

  const agendamentos = await prisma.agendamento.findMany({
    where: { deletedAt: null },
    include: INCLUDE_AGENDAMENTO_LISTAGEM,
    orderBy: { datahora: "asc" },
  });

  return enriquecerAgendamentosComResumoEvento(agendamentos);
};

const listarAgendamentosPorQuadraService = async (quadraId) => {
  await recusarAgendamentosVencidos();

  if (!quadraId) {
    throw { status: 400, message: "Quadra nÃ£o informada." };
  }

  const agendamentos = await prisma.agendamento.findMany({
    where: { quadraId: Number(quadraId), deletedAt: null },
    include: INCLUDE_AGENDAMENTO_LISTAGEM,
    orderBy: { datahora: "asc" },
  });

  return enriquecerAgendamentosComResumoEvento(agendamentos);
};

const listarAgendamentosConfirmadosService = async (
  quadraId,
  ano,
  mes,
  dia,
) => {
  await recusarAgendamentosVencidos();

  if (!quadraId) {
    throw { status: 400, message: "Quadra nÃ£o informada." };
  }

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      quadraId,
      deletedAt: null,
      status: "Confirmado",
      ano,
      mes,
      dia,
    },
    include: INCLUDE_AGENDAMENTO_LISTAGEM,
    orderBy: { datahora: "asc" },
  });

  return enriquecerAgendamentosComResumoEvento(agendamentos);
};

const listarAgendamentosOcupadosService = async (
  quadraId,
  ano,
  mes,
  dia,
) => {
  await recusarAgendamentosVencidos();

  if (!quadraId) {
    throw { status: 400, message: "Quadra nÃ£o informada." };
  }

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      quadraId,
      deletedAt: null,
      status: { not: "Recusado" },
      ano,
      mes,
      dia,
    },
    include: INCLUDE_AGENDAMENTO_LISTAGEM,
    orderBy: { datahora: "asc" },
  });

  return enriquecerAgendamentosComResumoEvento(agendamentos);
};

const listarAgendamentosConfirmadosSemanaService = async (
  quadraId,
  inicioReferencia,
) => {
  await recusarAgendamentosVencidos();

  if (!quadraId) throw { status: 400, message: "Quadra nÃ£o informada." };

  const dataBase = inicioReferencia
    ? new Date(`${inicioReferencia}T00:00:00`)
    : new Date();

  if (Number.isNaN(dataBase.getTime())) {
    throw { status: 400, message: "Data inicial invalida." };
  }

  const inicioSemana = startOfWeek(dataBase, { weekStartsOn: 1 });
  const fimSemana = endOfWeek(dataBase, { weekStartsOn: 1 });

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      quadraId: Number(quadraId),
      deletedAt: null,
      status: "Confirmado",
      AND: [
        {
          OR: [
            { ano: { gt: inicioSemana.getFullYear() } },
            {
              ano: inicioSemana.getFullYear(),
              OR: [
                { mes: { gt: inicioSemana.getMonth() + 1 } },
                {
                  mes: inicioSemana.getMonth() + 1,
                  dia: { gte: inicioSemana.getDate() },
                },
              ],
            },
          ],
        },
        {
          OR: [
            { ano: { lt: fimSemana.getFullYear() } },
            {
              ano: fimSemana.getFullYear(),
              OR: [
                { mes: { lt: fimSemana.getMonth() + 1 } },
                {
                  mes: fimSemana.getMonth() + 1,
                  dia: { lte: fimSemana.getDate() },
                },
              ],
            },
          ],
        },
      ],
    },
    include: INCLUDE_AGENDAMENTO_LISTAGEM,
    orderBy: { datahora: "asc" },
  });

  return enriquecerAgendamentosComResumoEvento(agendamentos);
};

const criarAgendamentoService = async ({
  usuarioId,
  datahora,
  dia,
  mes,
  ano,
  hora,
  duracao = 1,
  tipo = "TREINO",
  escola = null,
  descricao = null,
  quadraId,
  modalidadeId,
  timeId,
  ignorarRegra = false,
  status = "Pendente",
  fixo = false,
}) => {
  let dataInicio;
  if (datahora) {
    dataInicio = new Date(datahora);
  } else if (ano && mes && dia && hora !== undefined) {
    dataInicio = new Date(ano, mes - 1, dia, hora, 0, 0);
  } else {
    throw {
      status: 400,
      message: "Data/Hora invÃ¡lida ou campos obrigatÃ³rios faltando.",
    };
  }

  if (isNaN(dataInicio.getTime())) {
    throw { status: 400, message: "Data invÃ¡lida." };
  }

  const diaCalc = dataInicio.getDate();
  const mesCalc = dataInicio.getMonth() + 1;
  const anoCalc = dataInicio.getFullYear();
  const horaCalc = dataInicio.getHours();
  const timeIdNum = timeId ? Number(timeId) : null;
  let modalidadeIdCalculada = modalidadeId ? Number(modalidadeId) : null;

  const tipoUpper = String(tipo || "TREINO").toUpperCase().trim();
  const escolaUpper = String(escola || "").toUpperCase().trim();
  const descricaoNormalizada = String(descricao || "").trim();
  const escolaAula = tipoUpper === "AULA" ? escolaUpper : null;
  const descricaoOutro = tipoUpper === "OUTRO" ? descricaoNormalizada : null;
  const exigeModalidade =
    Boolean(fixo) || tipoUpper === "TREINO" || tipoUpper === "AMISTOSO";
  const tipoPermiteEncaixe =
    tipoUpper === "TREINO" || tipoUpper === "AMISTOSO";

  if (!usuarioId || !quadraId || (exigeModalidade && !modalidadeIdCalculada && !timeIdNum)) {
    throw {
      status: 400,
      message: "Campos obrigatorios nao preenchidos.",
    };
  }

  if (tipoUpper === "AULA" && !ESCOLAS_AULA_VALIDAS.has(escolaAula)) {
    throw {
      status: 400,
      message: "Para agendamento do tipo AULA, selecione uma escola valida.",
    };
  }

  if (tipoUpper === "OUTRO" && !descricaoOutro) {
    throw {
      status: 400,
      message: "Para agendamento do tipo OUTRO, informe uma descricao.",
    };
  }

  if (descricaoOutro && descricaoOutro.length > 250) {
    throw {
      status: 400,
      message: "Descricao do agendamento deve ter no maximo 250 caracteres.",
    };
  }

  const usuarioAgendamento = await obterUsuarioValidoParaAgendamento(usuarioId);
  const permissaoUsuarioAgendamento = Number(usuarioAgendamento.permissaoId);
  const deveAplicarRegrasAgendamento =
    PERFIS_COM_REGRAS_AGENDAMENTO.has(permissaoUsuarioAgendamento);

  await validarAgendamentoPorTimeParaUsuario({
    usuarioId,
    timeId,
    usuarioCarregado: usuarioAgendamento,
  });

  const agora = new Date();

  const regrasAntecedencia = {
    TREINO: 24,
    AMISTOSO: 168,
    CAMPEONATO: 720,
    EVENTO: 4320,
    AULA: 24,
    OUTRO: 24,
  };

  const antecedenciaMinimaSugerida =
    regrasAntecedencia[tipoUpper] || regrasAntecedencia.OUTRO;

  const diferencaMs = dataInicio.getTime() - agora.getTime();
  const diferencaHoras = diferencaMs / (1000 * 60 * 60);
  let limiteSemanalAtingidoNoMomento = false;
  let agendamentoPorEncaixe = false;

  if (dataInicio < agora) {
    throw {
      status: 400,
      message: "NÃ£o Ã© possÃ­vel realizar agendamentos no passado.",
    };
  }

  let time = null;
  if (timeIdNum) {
    time = await prisma.time.findUnique({
      where: { id: timeIdNum },
    });
    if (!time) throw { status: 400, message: "Time nao existe." };

    if (exigeModalidade && (!modalidadeIdCalculada || modalidadeIdCalculada <= 0)) {
      modalidadeIdCalculada = Number(time.modalidadeId);
    }
  }

  const [quadra, modalidade] = await Promise.all([
    prisma.quadra.findUnique({ where: { id: Number(quadraId) } }),
    exigeModalidade
      ? prisma.modalidade.findUnique({ where: { id: Number(modalidadeIdCalculada) } })
      : Promise.resolve(null),
  ]);

  if (!quadra) throw { status: 400, message: "Quadra nÃ£o existe." };
  if (quadra.interditada) {
    throw {
      status: 400,
      message:
        "Essa quadra estÃ¡ interditada no momento. NÃ£o Ã© possÃ­vel agendar.",
    };
  }
  if (exigeModalidade && !modalidade) {
    throw { status: 400, message: "Modalidade nao existe." };
  }

  if (deveAplicarRegrasAgendamento) {
    const qtdAgendamentosUsuarioNaSemana = await prisma.agendamento.count({
      where: {
        usuarioId: Number(usuarioId),
        deletedAt: null,
        status: { in: ["Confirmado", "Pendente"] },
        ...obterFiltroSemana(dataInicio),
      },
    });

    limiteSemanalAtingidoNoMomento = qtdAgendamentosUsuarioNaSemana >= 2;

    const ehMesmoDiaDoAgendamento =
      dataInicio.getFullYear() === agora.getFullYear() &&
      dataInicio.getMonth() === agora.getMonth() &&
      dataInicio.getDate() === agora.getDate();
    const dentroJanelaEncaixePorLimite =
      diferencaHoras >= 0 && diferencaHoras <= JANELA_ENCAIXE_HORAS;
    const dentroJanelaEncaixePorDiaAtual = ehMesmoDiaDoAgendamento && diferencaHoras >= 0;
    const precisaContarHorariosDisponiveis =
      tipoPermiteEncaixe &&
      ((limiteSemanalAtingidoNoMomento && dentroJanelaEncaixePorLimite) ||
        (!limiteSemanalAtingidoNoMomento && dentroJanelaEncaixePorDiaAtual));

    let horariosDisponiveisNoDia = 0;
    if (precisaContarHorariosDisponiveis) {
      horariosDisponiveisNoDia = await contarHorariosDisponiveisNoDia({
        quadraId,
        dataInicio,
      });
    }

    if (limiteSemanalAtingidoNoMomento) {
      const podeAplicarEncaixe =
        tipoPermiteEncaixe &&
        dentroJanelaEncaixePorLimite &&
        horariosDisponiveisNoDia >= MIN_HORARIOS_DISPONIVEIS_ENCAIXE;

      if (!podeAplicarEncaixe) {
        throw {
          status: 400,
          message:
            "Este usuario ja atingiu o limite de 2 agendamentos nesta semana.",
        };
      }

      agendamentoPorEncaixe = true;
    } else {
      const podeAplicarEncaixeNoDiaAtual =
        tipoPermiteEncaixe &&
        dentroJanelaEncaixePorDiaAtual &&
        horariosDisponiveisNoDia >= MIN_HORARIOS_DISPONIVEIS_ENCAIXE;

      if (podeAplicarEncaixeNoDiaAtual) {
        agendamentoPorEncaixe = true;
      }
    }
  }

  if (
    deveAplicarRegrasAgendamento &&
    !ignorarRegra &&
    !agendamentoPorEncaixe &&
    diferencaHoras < antecedenciaMinimaSugerida
  ) {
    const tempoTexto =
      antecedenciaMinimaSugerida >= 24
        ? `${antecedenciaMinimaSugerida / 24} dias`
        : `${antecedenciaMinimaSugerida} horas`;

    throw {
      status: 400,
      message: `AntecedÃªncia mÃ­nima nÃ£o respeitada. Para ${tipoUpper}, o agendamento deve ser feito com pelo menos ${tempoTexto} de antecedÃªncia.`,
    };
  }

  if (timeIdNum) {
    if (deveAplicarRegrasAgendamento && fixo && !ignorarRegra) {
      const inicioSemana = startOfWeek(dataInicio, { weekStartsOn: 1 });
      const fimSemana = endOfWeek(dataInicio, { weekStartsOn: 1 });

      const qtdFixosNaSemana = await prisma.agendamento.count({
        where: {
          timeId: timeIdNum,
          fixo: true,
          status: { in: ["Confirmado", "Pendente"] },
          AND: [
            {
              ano: {
                gte: inicioSemana.getFullYear(),
                lte: fimSemana.getFullYear(),
              },
            },
            {
              OR: [
                { mes: { gt: inicioSemana.getMonth() + 1 } },
                {
                  mes: inicioSemana.getMonth() + 1,
                  dia: { gte: inicioSemana.getDate() },
                },
              ],
            },
            {
              OR: [
                { mes: { lt: fimSemana.getMonth() + 1 } },
                {
                  mes: fimSemana.getMonth() + 1,
                  dia: { lte: fimSemana.getDate() },
                },
              ],
            },
          ],
        },
      });

      if (qtdFixosNaSemana >= 2) {
        throw {
          status: 400,
          message:
            "Este time jÃ¡ atingiu o limite de 2 horÃ¡rios FIXOS nesta semana. Tente agendar como horÃ¡rio avulso.",
        };
      }
    }
  }

  const agendamentosDoDia = await prisma.agendamento.findMany({
    where: {
      quadraId: Number(quadraId),
      ano: anoCalc,
      mes: mesCalc,
      dia: diaCalc,
      status: { not: "Recusado" },
    },
  });

  const dataFim = addMinutes(dataInicio, duracao * 60);

  const conflito = agendamentosDoDia.find((ag) => {
    const agInicio = ag.datahora
      ? new Date(ag.datahora)
      : new Date(ag.ano, ag.mes - 1, ag.dia, ag.hora, 0, 0);

    const agFim = addMinutes(agInicio, (ag.duracao || 1) * 60);

    return dataInicio < agFim && dataFim > agInicio;
  });

  if (conflito) {
    throw {
      status: 409,
      message: "HorÃ¡rio jÃ¡ agendado ou conflito de horÃ¡rio.",
    };
  }

  let novoCodigo = gerarCodigoVerificacao();
  let codigoExiste = await prisma.agendamento.findUnique({
    where: { codigoVerificacao: novoCodigo },
  });
  while (codigoExiste) {
    novoCodigo = gerarCodigoVerificacao();
    codigoExiste = await prisma.agendamento.findUnique({
      where: { codigoVerificacao: novoCodigo },
    });
  }

  const dadosAgendamento = {
    dia: diaCalc,
    mes: mesCalc,
    ano: anoCalc,
    hora: horaCalc,
    datahora: dataInicio,
    duracao,
    tipo: tipoUpper,
    escola: escolaAula,
    descricao: descricaoOutro,
    codigoVerificacao: novoCodigo,
    status,
    fixo,
    usuario: { connect: { id: Number(usuarioId) } },
    quadra: { connect: { id: Number(quadraId) } },
    modalidade:
      exigeModalidade && Number.isInteger(Number(modalidadeIdCalculada))
        ? { connect: { id: Number(modalidadeIdCalculada) } }
        : undefined,
    time: Number.isInteger(Number(timeIdNum)) && Number(timeIdNum) > 0
      ? { connect: { id: Number(timeIdNum) } }
      : undefined,
    encaixe: agendamentoPorEncaixe,
    limiteSemanalAtingido: limiteSemanalAtingidoNoMomento,
  };

  const agendamento = await prisma.agendamento.create({
    data: dadosAgendamento,
    include: {
      modalidade: true,
      usuario: { include: { times: { include: { time: true } } } },
      time: true,
    },
  });

  return {
    ...agendamento,
    duracao: agendamento.duracao ?? 1,
  };
};

const cancelarAgendamentoService = async (id) => {
  if (!id) throw { status: 400, message: "ID do agendamento obrigatÃ³rio." };

  const agendamento = await prisma.agendamento.findUnique({
    where: { id: Number(id) },
  });
  if (!agendamento)
    throw { status: 404, message: "Agendamento nÃ£o encontrado." };

  await prisma.agendamento.delete({ where: { id: Number(id) } });
  return true;
};

const atualizarAgendamentoService = async (id, status, motivoRecusa = null) => {
  if (!id || !status)
    throw { status: 400, message: "ID e status sÃ£o obrigatÃ³rios." };

  const agendamento = await prisma.agendamento.findUnique({
    where: { id: Number(id) },
  });

  if (!agendamento)
    throw { status: 404, message: "Agendamento nÃ£o encontrado." };

  const justificativa =
    status === "Recusado" && !motivoRecusa
      ? "O administrador da quadra nÃ£o informou um motivo especÃ­fico."
      : motivoRecusa;

  const atualizado = await prisma.agendamento.update({
    where: { id: Number(id) },
    data: {
      status,
      motivoRecusa: status === "Recusado" ? justificativa : null,
    },
    include: { usuario: true, quadra: true, modalidade: true, time: true },
  });

  try {
    await enviarEmailStatusAgendamento(atualizado);
  } catch (err) {
    console.error("Erro ao enviar email:", err);
  }

  return atualizado;
};

const listarModalidadesPorQuadraService = async (quadraId) => {
  await recusarAgendamentosVencidos();

  if (!quadraId) throw { status: 400, message: "Quadra nÃ£o informada." };

  try {
    const quadra = await prisma.quadra.findUnique({
      where: { id: Number(quadraId) },
      include: { modalidades: true },
    });

    if (!quadra) throw { status: 404, message: "Quadra nÃ£o encontrada." };

    return quadra.modalidades;
  } catch (err) {
    console.error("Erro no service de modalidades:", err);
    throw { status: 500, message: "Erro ao buscar modalidades da quadra." };
  }
};

const listarAgendamentosPorTimeService = async (timeId, inicio, fim) => {
  await recusarAgendamentosVencidos();

  if (!timeId || !inicio || !fim) {
    throw { status: 400, message: "ParÃ¢metros obrigatÃ³rios nÃ£o informados." };
  }

  const dataInicio = new Date(inicio);
  const dataFim = new Date(fim);

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      timeId: Number(timeId),
      deletedAt: null,
      AND: [
        {
          OR: [
            { ano: { gt: dataInicio.getFullYear() } },
            {
              ano: dataInicio.getFullYear(),
              OR: [
                { mes: { gt: dataInicio.getMonth() + 1 } },
                {
                  mes: dataInicio.getMonth() + 1,
                  dia: { gte: dataInicio.getDate() },
                },
              ],
            },
          ],
        },
        {
          OR: [
            { ano: { lt: dataFim.getFullYear() } },
            {
              ano: dataFim.getFullYear(),
              OR: [
                { mes: { lt: dataFim.getMonth() + 1 } },
                {
                  mes: dataFim.getMonth() + 1,
                  dia: { lte: dataFim.getDate() },
                },
              ],
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      dia: true,
      mes: true,
      ano: true,
      hora: true,
      duracao: true,
      status: true,
    },
    orderBy: { datahora: "asc" },
  });

  return agendamentos.map((a) => ({ ...a, duracao: a.duracao ?? 1 }));
};

const recusarAgendamentosVencidos = async () => {
  const agora = new Date();
  if (agora.getTime() - ultimoProcessamentoRecusaVencidos < INTERVALO_RECUSA_VENCIDOS_MS) {
    return;
  }

  const ano = agora.getFullYear();
  const mes = agora.getMonth() + 1;
  const dia = agora.getDate();
  const hora = agora.getHours();

  await prisma.agendamento.updateMany({
    where: {
      status: "Pendente",
      deletedAt: null,
      OR: [
        { datahora: { lt: agora } },
        {
          datahora: null,
          OR: [
            { ano: { lt: ano } },
            { ano, mes: { lt: mes } },
            { ano, mes, dia: { lt: dia } },
            { ano, mes, dia, hora: { lt: hora } },
          ],
        },
      ],
    },
    data: {
      status: "Recusado",
      motivoRecusa: "Prazo de confirmacao expirado (Data passada)",
    },
  });

  ultimoProcessamentoRecusaVencidos = agora.getTime();
};

const atualizarAgendamentosFixosService = async (agendamentos, usuarioId) => {
  if (!agendamentos || agendamentos.length === 0) {
    throw { status: 400, message: "Lista de agendamentos vazia." };
  }

  const primeiro = agendamentos[0];
  const timeId = primeiro.timeId;
  const anoRef = primeiro.ano;
  const mesRef = primeiro.mes;
  const diaRef = primeiro.dia;

  if (!timeId) {
    throw {
      status: 400,
      message: "Time nÃ£o identificado para agendamento fixo.",
    };
  }

  await validarAgendamentoPorTimeParaUsuario({
    usuarioId,
    timeId,
  });

  await prisma.agendamento.deleteMany({
    where: {
      timeId: Number(timeId),
      fixo: true,
      status: { in: ["Pendente", "Confirmado"] },
      OR: [
        { ano: { gt: anoRef } },
        { ano: anoRef, mes: { gt: mesRef } },
        { ano: anoRef, mes: mesRef, dia: { gte: diaRef } },
      ],
    },
  });

  const resultados = [];

  for (const ag of agendamentos) {
    try {
      const criado = await criarAgendamentoService({
        usuarioId: usuarioId,
        datahora: ag.datahora,
        dia: ag.dia,
        mes: ag.mes,
        ano: ag.ano,
        hora: ag.hora,
        duracao: ag.duracao,
        tipo: ag.tipo,
        quadraId: ag.quadraId,
        modalidadeId: ag.modalidadeId,
        timeId: ag.timeId,
        fixo: true,
        ignorarRegra: true,
        status: "Confirmado",
      });
      resultados.push(criado);
    } catch (error) {
      if (error.status === 409 || error.status === 400) {
        console.warn(
          `[FIXO] Pulando dia ${ag.dia}/${ag.mes} por conflito ou regra: ${error.message}`,
        );
        continue;
      }

      continue;
    }
  }

  return resultados;
};

module.exports = {
  criarAgendamentoService,
  listarAgendamentosService,
  listarTodosAgendamentosService,
  listarAgendamentosPorQuadraService,
  cancelarAgendamentoService,
  listarAgendamentosConfirmadosService,
  listarAgendamentosOcupadosService,
  listarAgendamentosConfirmadosSemanaService,
  atualizarAgendamentoService,
  atualizarAgendamentosFixosService,
  listarModalidadesPorQuadraService,
  listarAgendamentosPorTimeService,
  recusarAgendamentosVencidos,
};
