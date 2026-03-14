const { enviarEmailAlteracaoPermissao, enviarEmailVinculoTime } = require('./email.service');
const prisma = require('../lib/prisma');
const { validarNumeroUnicoNoTime } = require('./jogador.service');

const REGEX_EMAIL_BASICO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function calcularAproveitamento(partidas, vitorias, empates) {
  const totalPartidas = Number(partidas) || 0;
  if (totalPartidas <= 0) return 0;

  const pontosObtidos = (Number(vitorias) || 0) * 3 + (Number(empates) || 0);
  return Math.round((pontosObtidos / (totalPartidas * 3)) * 100);
}

function classificarResultadoPartida({ timeId, partida }) {
  const idTime = Number(timeId);
  const timeAId = Number(partida?.timeAId);
  const timeBId = Number(partida?.timeBId);
  const pontosTimeA = Number(partida?.pontosTimeA) || 0;
  const pontosTimeB = Number(partida?.pontosTimeB) || 0;

  if (idTime === timeAId) {
    if (pontosTimeA > pontosTimeB) return { codigo: 'V', label: 'Vitoria' };
    if (pontosTimeA < pontosTimeB) return { codigo: 'D', label: 'Derrota' };
    return { codigo: 'E', label: 'Empate' };
  }

  if (idTime === timeBId) {
    if (pontosTimeB > pontosTimeA) return { codigo: 'V', label: 'Vitoria' };
    if (pontosTimeB < pontosTimeA) return { codigo: 'D', label: 'Derrota' };
    return { codigo: 'E', label: 'Empate' };
  }

  return { codigo: '-', label: 'Sem resultado' };
}

async function cadastrarUsuario(user) {
  return prisma.usuario.create({
    data: {
      nome: user.nome,
      email: user.email,
      telefone: user.telefone,
      foto: user.foto,
      permissaoId: 3,
      quadraId: null,
      createdAt: new Date(),
    },
    include: {
      permissao: true,
    },
  });
}

async function atualizarUsuario(user) {
  const usuarioAtualizado = await prisma.$transaction(async (tx) => {
    const agora = new Date();

    const usuarioDb = await tx.usuario.findUnique({
      where: { email: user.email },
      include: {
        quadra: true,
        permissao: true,
      },
    });

    if (!usuarioDb || usuarioDb.deletedAt) {
      throw new Error('Usuario nao encontrado');
    }

    const dadosAtualizados = {
      permissaoId: user.permissaoId,
      quadraId: null,
    };

    if (user.permissaoId === 2 && user.quadraId) {
      const quadra = await tx.quadra.findUnique({
        where: { id: user.quadraId },
      });

      dadosAtualizados.quadraId = quadra ? quadra.id : null;
    }

    if (user.permissaoId !== 3) {
      await tx.usuarioTime.updateMany({
        where: {
          usuarioId: usuarioDb.id,
          ativo: true,
          deletedAt: null,
        },
        data: {
          ativo: false,
          deletedAt: agora,
        },
      });
    }

    if (user.permissaoId !== 5) {
      await tx.treinadorTime.deleteMany({
        where: {
          usuarioId: usuarioDb.id,
        },
      });
    }

    const usuarioAtualizado = await tx.usuario.update({
      where: { id: usuarioDb.id },
      data: dadosAtualizados,
      include: {
        quadra: true,
        permissao: true,
      },
    });

    return usuarioAtualizado;
  });

  try {
    await enviarEmailAlteracaoPermissao(usuarioAtualizado);
  } catch (erroEmail) {
    console.error('Erro ao enviar email de alteracao de permissao:', erroEmail);
  }

  return usuarioAtualizado;
}

async function atualizarMeuPerfil({ usuarioId, nome, email, telefone, foto }) {
  const usuarioIdNum = Number(usuarioId);
  if (!Number.isInteger(usuarioIdNum) || usuarioIdNum <= 0) {
    throw new Error('Usuario invalido');
  }

  const nomeNormalizado = String(nome || '').trim();
  const emailNormalizado = String(email || '').trim().toLowerCase();
  const telefoneNormalizado = typeof telefone === 'string' ? telefone.trim() : '';
  const fotoInformada = typeof foto === 'string';
  const fotoNormalizada = fotoInformada ? String(foto).trim() : '';

  if (!nomeNormalizado || !emailNormalizado) {
    throw new Error('Nome e email sao obrigatorios.');
  }

  if (!REGEX_EMAIL_BASICO.test(emailNormalizado)) {
    throw new Error('Informe um email valido.');
  }

  return prisma.$transaction(async (tx) => {
    const usuarioDb = await tx.usuario.findFirst({
      where: {
        id: usuarioIdNum,
        ativo: true,
        deletedAt: null,
      },
      include: {
        permissao: true,
        quadra: true,
      },
    });

    if (!usuarioDb) {
      throw new Error('Usuario nao encontrado');
    }

    const emailEmUso = await tx.usuario.findFirst({
      where: {
        email: emailNormalizado,
        id: { not: usuarioIdNum },
      },
      select: { id: true },
    });

    if (emailEmUso) {
      throw new Error('Este email ja esta em uso por outro usuario.');
    }

    const dadosAtualizados = {
      nome: nomeNormalizado,
      email: emailNormalizado,
      telefone: telefoneNormalizado || null,
      ...(fotoInformada ? { foto: fotoNormalizada || null } : {}),
    };

    const usuarioAtualizado = await tx.usuario.update({
      where: { id: usuarioIdNum },
      data: dadosAtualizados,
      include: {
        permissao: true,
        quadra: true,
        jogador: {
          select: {
            id: true,
            nome: true,
            foto: true,
            numero: true,
            funcao: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

    if (usuarioAtualizado.jogadorId && fotoInformada) {
      await tx.jogador.update({
        where: { id: usuarioAtualizado.jogadorId },
        data: { foto: fotoNormalizada || null },
      });
    }

    return usuarioAtualizado;
  });
}

async function excluirMinhaConta(usuarioId) {
  const usuarioIdNum = Number(usuarioId);
  if (!Number.isInteger(usuarioIdNum) || usuarioIdNum <= 0) {
    throw new Error('Usuario invalido');
  }

  return prisma.$transaction(async (tx) => {
    const usuarioDb = await tx.usuario.findFirst({
      where: {
        id: usuarioIdNum,
        ativo: true,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!usuarioDb) {
      throw new Error('Usuario nao encontrado');
    }

    const agora = new Date();
    const emailAnonimizado = `conta.excluida.${usuarioIdNum}.${agora.getTime()}@quadralivre.local`;

    await tx.usuarioTime.updateMany({
      where: {
        usuarioId: usuarioIdNum,
        ativo: true,
        deletedAt: null,
      },
      data: {
        ativo: false,
        deletedAt: agora,
      },
    });

    await tx.treinadorTime.updateMany({
      where: {
        usuarioId: usuarioIdNum,
        ativo: true,
        deletedAt: null,
      },
      data: {
        ativo: false,
        deletedAt: agora,
      },
    });

    await tx.pushSubscription.deleteMany({
      where: {
        usuarioId: usuarioIdNum,
      },
    });

    await tx.usuario.update({
      where: { id: usuarioIdNum },
      data: {
        nome: 'Conta excluida',
        email: emailAnonimizado,
        telefone: null,
        foto: null,
        quadraId: null,
        jogadorId: null,
        ativo: false,
        deletedAt: agora,
      },
    });

    return { ok: true };
  });
}

async function getUsuarios() {
  const usuarios = await prisma.usuario.findMany({
    where: {
      ativo: true,
      deletedAt: null,
    },
    include: {
      agendamentos: {
        where: { deletedAt: null },
        select: {
          datahora: true,
          ano: true,
          mes: true,
          dia: true,
          hora: true,
        },
      },
      quadra: {
        select: {
          id: true,
          nome: true,
        },
      },
      permissao: {
        select: {
          id: true,
          descricao: true,
        },
      },
      jogador: {
        include: {
          times: {
            select: {
              ativo: true,
              time: {
                select: {
                  id: true,
                  nome: true,
                },
              },
              modalidade: {
                select: {
                  nome: true,
                },
              },
            },
          },
        },
      },
      times: {
        where: {
          ativo: true,
          deletedAt: null,
        },
        select: {
          ativo: true,
          deletedAt: true,
          time: {
            select: {
              id: true,
              nome: true,
              ativo: true,
              deletedAt: true,
            },
          },
        },
      },
      treinadorTimes: {
        where: {
          ativo: true,
          deletedAt: null,
        },
        select: {
          ativo: true,
          deletedAt: true,
          time: {
            select: {
              id: true,
              nome: true,
              ativo: true,
              deletedAt: true,
            },
          },
        },
      },
    },
  });

  return usuarios.map((user) => {
    let jogador = null;
    let timesJogador = [];
    const agendamentosAtivos = Array.isArray(user.agendamentos) ? user.agendamentos : [];
    const agora = new Date();

    const obterDataAgendamento = (agendamento) => {
      if (agendamento?.datahora) {
        return new Date(agendamento.datahora);
      }

      if (
        Number.isInteger(agendamento?.ano) &&
        Number.isInteger(agendamento?.mes) &&
        Number.isInteger(agendamento?.dia)
      ) {
        return new Date(
          agendamento.ano,
          Math.max(0, agendamento.mes - 1),
          agendamento.dia,
          agendamento.hora || 0,
          0,
          0
        );
      }

      return null;
    };

    const datasAgendamentos = agendamentosAtivos
      .map(obterDataAgendamento)
      .filter((data) => data instanceof Date && !Number.isNaN(data.getTime()));

    const agendamentosNoMes = datasAgendamentos.filter(
      (data) =>
        data.getMonth() === agora.getMonth() &&
        data.getFullYear() === agora.getFullYear()
    ).length;

    const ultimaAtividade = datasAgendamentos.length
      ? new Date(Math.max(...datasAgendamentos.map((data) => data.getTime())))
      : null;

    const dataCadastro = user.createdAt || null;

    if (user.jogador) {
      jogador = {
        id: user.jogador.id,
        nome: user.jogador.nome,
        foto: user.jogador.foto,
      };

      timesJogador = user.jogador.times
        .filter((jt) => jt.ativo)
        .map((jt) => ({
          id: jt.time.id,
          nome: jt.time.nome,
          modalidade: jt.modalidade.nome,
        }));
    }

    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      telefone: user.telefone,
      foto: user.foto,
      dataCadastro,
      permissaoId: user.permissaoId,
      permissao: user.permissao,
      quadra: user.quadra,
      jogador,
      timesJogador,
      times: user.times
        .filter((ut) => ut.ativo && !ut.deletedAt && ut.time?.ativo && !ut.time?.deletedAt)
        .map((ut) => ({
          id: ut.time.id,
          nome: ut.time.nome,
        })),
      timesComoTreinador: user.treinadorTimes
        .filter((tt) => tt.ativo && !tt.deletedAt && tt.time?.ativo && !tt.time?.deletedAt)
        .map((tt) => ({
          id: tt.time.id,
          nome: tt.time.nome,
        })),
      totalAgendamentos: agendamentosAtivos.length,
      agendamentosNoMes,
      ultimaAtividade,
    };
  });
}

async function getUsuariosResumo() {
  const usuarios = await prisma.usuario.findMany({
    where: {
      ativo: true,
      deletedAt: null,
    },
    select: {
      id: true,
      nome: true,
      foto: true,
      permissaoId: true,
      jogadorId: true,
      createdAt: true,
      times: {
        where: {
          ativo: true,
          deletedAt: null,
          time: {
            ativo: true,
            deletedAt: null,
          },
        },
        select: {
          timeId: true,
        },
      },
    },
    orderBy: { nome: 'asc' },
  });

  return usuarios.map((user) => ({
    id: user.id,
    nome: user.nome,
    foto: user.foto,
    permissaoId: user.permissaoId,
    createdAt: user.createdAt || null,
    possuiJogador: Boolean(user.jogadorId),
    totalTimes: Array.isArray(user.times) ? user.times.length : 0,
  }));
}

async function getResumoPublicoHome() {
  const [totalQuadras, totalReservas, totalUsuarios] = await prisma.$transaction([
    prisma.quadra.count(),
    prisma.agendamento.count({
      where: {
        deletedAt: null,
        status: { in: ['Pendente', 'Confirmado'] },
      },
    }),
    prisma.usuario.count({
      where: {
        ativo: true,
        deletedAt: null,
      },
    }),
  ]);

  return {
    totalQuadras,
    totalReservas,
    totalUsuarios,
    atualizadoEm: new Date().toISOString(),
  };
}

async function listarPermissoes() {
  return prisma.permissao.findMany({
    orderBy: { id: 'asc' },
  });
}

async function vincularUsuarioTime(usuarioId, timeId, jogadorId) {
  const usuarioIdNum = Number(usuarioId);
  const timeIdNum = Number(timeId);
  const jogadorIdNum = jogadorId ? Number(jogadorId) : null;

  if (!Number.isInteger(usuarioIdNum) || usuarioIdNum <= 0) {
    throw new Error('Usuario invalido');
  }

  if (!Number.isInteger(timeIdNum) || timeIdNum <= 0) {
    throw new Error('Time invalido');
  }

  if (jogadorId != null && (!Number.isInteger(jogadorIdNum) || jogadorIdNum <= 0)) {
    throw new Error('Jogador invalido');
  }

  const resultado = await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.findUnique({
      where: { id: usuarioIdNum },
      select: {
        id: true,
        nome: true,
        email: true,
        foto: true,
        jogadorId: true,
        deletedAt: true,
      },
    });
    if (!usuario || usuario.deletedAt) throw new Error('Usuario nao encontrado');

    const time = await tx.time.findUnique({
      where: { id: timeIdNum },
      select: {
        id: true,
        nome: true,
        modalidadeId: true,
        deletedAt: true,
        modalidade: {
          select: {
            nome: true,
          },
        },
      },
    });
    if (!time || time.deletedAt) throw new Error('Time nao encontrado');

    await tx.usuarioTime.upsert({
      where: {
        usuarioId_timeId: { usuarioId: usuarioIdNum, timeId: timeIdNum },
      },
      update: { ativo: true, deletedAt: null },
      create: { usuarioId: usuarioIdNum, timeId: timeIdNum },
    });

    if (!jogadorIdNum) {
      return {
        vinculo: { usuarioId: usuarioIdNum, timeId: timeIdNum },
        jogadorIdVinculado: null,
        jogadorNomeVinculado: null,
        notificacaoEmail: null,
      };
    }

    const jogador = await tx.jogador.findUnique({
      where: { id: jogadorIdNum },
      select: {
        id: true,
        nome: true,
        numero: true,
        foto: true,
        deletedAt: true,
      },
    });
    if (!jogador || jogador.deletedAt) throw new Error('Jogador nao encontrado');

    const fotoJogadorAtual = String(jogador.foto || '').trim();
    const fotoUsuarioVinculado = String(usuario.foto || '').trim();
    if (fotoUsuarioVinculado && fotoJogadorAtual !== fotoUsuarioVinculado) {
      await tx.jogador.update({
        where: { id: jogadorIdNum },
        data: { foto: fotoUsuarioVinculado },
      });
    }

    if (Number(usuario.jogadorId) !== jogadorIdNum) {
      await tx.usuario.update({
        where: { id: usuarioIdNum },
        data: { jogadorId: jogadorIdNum },
      });
    }

    await validarNumeroUnicoNoTime({
      timeId: timeIdNum,
      numero: jogador.numero,
      jogadorIgnorarId: jogadorIdNum,
      tx,
    });

    await tx.jogadorTime.upsert({
      where: {
        jogadorId_modalidadeId: { jogadorId: jogadorIdNum, modalidadeId: time.modalidadeId },
      },
      update: {
        timeId: timeIdNum,
        ativo: true,
      },
      create: {
        jogadorId: jogadorIdNum,
        timeId: timeIdNum,
        modalidadeId: time.modalidadeId,
      },
    });

    return {
      vinculo: { usuarioId: usuarioIdNum, timeId: timeIdNum },
      jogadorIdVinculado: jogadorIdNum,
      jogadorNomeVinculado: jogador.nome || null,
      notificacaoEmail: {
        usuario,
        time,
      },
    };
  }, {
    timeout: 20000,
  });

  let jogadorAtualizado = null;
  if (resultado.jogadorIdVinculado) {
    jogadorAtualizado = await prisma.jogador.findUnique({
      where: { id: resultado.jogadorIdVinculado },
      include: {
        times: {
          where: { ativo: true },
          include: {
            time: true,
            modalidade: true,
          },
        },
      },
    });
  }

  if (resultado.notificacaoEmail) {
    try {
      await enviarEmailVinculoTime(
        resultado.notificacaoEmail.usuario,
        resultado.notificacaoEmail.time,
        jogadorAtualizado || { nome: resultado.jogadorNomeVinculado }
      );
    } catch (erroEmail) {
      console.error('Erro ao enviar email de vinculo com time:', erroEmail);
    }
  }

  return {
    vinculo: resultado.vinculo,
    jogador: jogadorAtualizado,
  };
}

async function getEstatisticasJogadorVinculado(usuarioId, filtros = {}) {
  const usuarioIdNum = Number(usuarioId);
  if (!Number.isInteger(usuarioIdNum) || usuarioIdNum <= 0) {
    throw new Error('Usuario invalido');
  }

  const modalidadeFiltroNum = Number(filtros?.modalidadeId);
  const modalidadeFiltroId = Number.isInteger(modalidadeFiltroNum) && modalidadeFiltroNum > 0
    ? modalidadeFiltroNum
    : null;

  const anoAtual = new Date().getFullYear();
  const inicioAnoAtual = new Date(anoAtual, 0, 1, 0, 0, 0, 0);
  const inicioProximoAno = new Date(anoAtual + 1, 0, 1, 0, 0, 0, 0);

  const usuario = await prisma.usuario.findFirst({
    where: {
      id: usuarioIdNum,
      ativo: true,
      deletedAt: null,
    },
    select: {
      id: true,
      jogadorId: true,
      jogador: {
        select: {
          id: true,
          nome: true,
          foto: true,
          numero: true,
          funcao: {
            select: {
              id: true,
              nome: true,
            },
          },
          times: {
            where: {
              ativo: true,
              deletedAt: null,
            },
            select: {
              time: {
                select: {
                  id: true,
                  nome: true,
                  foto: true,
                  ativo: true,
                  deletedAt: true,
                },
              },
              modalidade: {
                select: {
                  id: true,
                  nome: true,
                  ativo: true,
                  deletedAt: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!usuario) {
    throw new Error('Usuario nao encontrado');
  }

  const jogadorId = Number(usuario.jogadorId);
  if (!Number.isInteger(jogadorId) || jogadorId <= 0 || !usuario.jogador) {
    const erro = new Error('Usuario nao possui jogador vinculado.');
    erro.code = 'USUARIO_SEM_JOGADOR';
    throw erro;
  }

  const timesVinculados = (Array.isArray(usuario.jogador.times) ? usuario.jogador.times : [])
    .filter((item) => item?.time?.ativo && !item?.time?.deletedAt)
    .filter((item) => item?.modalidade?.ativo && !item?.modalidade?.deletedAt)
    .map((item) => ({
      timeId: Number(item?.time?.id) || null,
      timeNome: item?.time?.nome || '',
      timeFoto: item?.time?.foto || null,
      modalidadeId: Number(item?.modalidade?.id) || null,
      modalidadeNome: item?.modalidade?.nome || '',
    }));

  const modalidadesPorTimeId = new Map();
  timesVinculados.forEach((item) => {
    const timeId = Number(item?.timeId);
    const modalidadeId = Number(item?.modalidadeId);
    if (!Number.isInteger(timeId) || timeId <= 0 || !Number.isInteger(modalidadeId) || modalidadeId <= 0) return;

    if (!modalidadesPorTimeId.has(timeId)) {
      modalidadesPorTimeId.set(timeId, []);
    }

    const vinculadas = modalidadesPorTimeId.get(timeId);
    if (!vinculadas.some((vinculo) => vinculo.modalidadeId === modalidadeId)) {
      vinculadas.push({
        modalidadeId,
        modalidadeNome: item?.modalidadeNome || '',
      });
    }
  });

  const atuacoes = await prisma.jogadorPartida.findMany({
    where: {
      jogadorId,
      partida: {
        status: 'FINALIZADA',
        data: {
          gte: inicioAnoAtual,
          lt: inicioProximoAno,
        },
      },
    },
    select: {
      id: true,
      partidaId: true,
      timeId: true,
      gols: true,
      cartoesAmarelos: true,
      cartoesVermelhos: true,
      partida: {
        select: {
          id: true,
          data: true,
          pontosTimeA: true,
          pontosTimeB: true,
          timeAId: true,
          timeBId: true,
          timeA: {
            select: {
              id: true,
              nome: true,
              foto: true,
            },
          },
          timeB: {
            select: {
              id: true,
              nome: true,
              foto: true,
            },
          },
          campeonatoId: true,
          campeonato: {
            select: {
              id: true,
              nome: true,
              status: true,
              modalidade: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
          quadra: {
            select: {
              nome: true,
            },
          },
         },
       },
     },
    orderBy: [
      { partidaId: 'desc' },
      { id: 'desc' },
    ],
  });

  const partidasMap = new Map();

  for (const atuacao of atuacoes) {
    const partidaId = Number(atuacao?.partidaId);
    if (!Number.isInteger(partidaId) || partidaId <= 0) continue;

    if (!partidasMap.has(partidaId)) {
      const idTime = Number(atuacao?.timeId);
      partidasMap.set(partidaId, {
        partidaId,
        timeId: Number.isInteger(idTime) && idTime > 0 ? idTime : null,
        gols: 0,
        cartoesAmarelos: 0,
        cartoesVermelhos: 0,
        partida: atuacao?.partida || null,
      });
    }

    const acumulado = partidasMap.get(partidaId);
    const idTimeAtual = Number(atuacao?.timeId);
    if (
      (!Number.isInteger(acumulado.timeId) || acumulado.timeId <= 0) &&
      Number.isInteger(idTimeAtual) &&
      idTimeAtual > 0
    ) {
      acumulado.timeId = idTimeAtual;
    }

    acumulado.gols += Number(atuacao?.gols) || 0;
    acumulado.cartoesAmarelos += Number(atuacao?.cartoesAmarelos) || 0;
    acumulado.cartoesVermelhos += Number(atuacao?.cartoesVermelhos) || 0;
  }

  const partidasConsolidadas = Array.from(partidasMap.values()).sort((a, b) => {
    const dataA = new Date(a?.partida?.data || 0).getTime();
    const dataB = new Date(b?.partida?.data || 0).getTime();
    const tsA = Number.isFinite(dataA) ? dataA : 0;
    const tsB = Number.isFinite(dataB) ? dataB : 0;
    return tsB - tsA;
  });

  const campanhasMap = new Map();
  let totalPartidas = 0;
  let totalGols = 0;
  let totalAmarelos = 0;
  let totalVermelhos = 0;
  let totalVitorias = 0;
  let totalEmpates = 0;
  let totalDerrotas = 0;

  const ultimasPartidas = [];

  for (const item of partidasConsolidadas) {
    const partida = item?.partida || {};
    const modalidadeCampeonatoId = Number(partida?.campeonato?.modalidade?.id);
    const vinculosTimeAtual = modalidadesPorTimeId.get(Number(item?.timeId)) || [];
    const vinculoModalidadeTime = modalidadeFiltroId
      ? vinculosTimeAtual.find((vinculo) => vinculo.modalidadeId === modalidadeFiltroId) || null
      : (vinculosTimeAtual.length === 1 ? vinculosTimeAtual[0] : null);
    const modalidadePartidaId = Number.isInteger(modalidadeCampeonatoId) && modalidadeCampeonatoId > 0
      ? modalidadeCampeonatoId
      : Number(vinculoModalidadeTime?.modalidadeId) || null;
    const modalidadePartidaNome = String(
      partida?.campeonato?.modalidade?.nome ||
      vinculoModalidadeTime?.modalidadeNome ||
      ''
    ).trim() || null;

    if (modalidadeFiltroId && Number(modalidadePartidaId) !== modalidadeFiltroId) {
      continue;
    }

    const resultado = classificarResultadoPartida({
      timeId: item?.timeId,
      partida,
    });

    totalPartidas += 1;
    totalGols += Number(item?.gols) || 0;
    totalAmarelos += Number(item?.cartoesAmarelos) || 0;
    totalVermelhos += Number(item?.cartoesVermelhos) || 0;

    if (resultado.codigo === 'V') totalVitorias += 1;
    if (resultado.codigo === 'E') totalEmpates += 1;
    if (resultado.codigo === 'D') totalDerrotas += 1;

    const idCampeonato = Number(partida?.campeonatoId);
    const campanhaKey = Number.isInteger(idCampeonato) && idCampeonato > 0
      ? `campeonato:${idCampeonato}`
      : `avulso:${modalidadePartidaId || 'sem-modalidade'}`;

    if (!campanhasMap.has(campanhaKey)) {
      campanhasMap.set(campanhaKey, {
        campeonatoId: Number.isInteger(idCampeonato) && idCampeonato > 0 ? idCampeonato : null,
        campeonatoNome: partida?.campeonato?.nome || 'Partidas avulsas',
        statusCampeonato: partida?.campeonato?.status || null,
        modalidadeId: modalidadePartidaId,
        modalidadeNome: modalidadePartidaNome,
        timeNome: null,
        partidas: 0,
        gols: 0,
        cartoesAmarelos: 0,
        cartoesVermelhos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        aproveitamento: 0,
      });
    }

    const campanha = campanhasMap.get(campanhaKey);
    campanha.partidas += 1;
    campanha.gols += Number(item?.gols) || 0;
    campanha.cartoesAmarelos += Number(item?.cartoesAmarelos) || 0;
    campanha.cartoesVermelhos += Number(item?.cartoesVermelhos) || 0;
    if (resultado.codigo === 'V') campanha.vitorias += 1;
    if (resultado.codigo === 'E') campanha.empates += 1;
    if (resultado.codigo === 'D') campanha.derrotas += 1;

    if (!campanha.timeNome) {
      if (Number(item?.timeId) === Number(partida?.timeAId)) {
        campanha.timeNome = partida?.timeA?.nome || null;
      } else if (Number(item?.timeId) === Number(partida?.timeBId)) {
        campanha.timeNome = partida?.timeB?.nome || null;
      }
    }

    const meuTime = Number(item?.timeId) === Number(partida?.timeAId)
      ? partida?.timeA
      : Number(item?.timeId) === Number(partida?.timeBId)
        ? partida?.timeB
        : null;

    const adversario = Number(item?.timeId) === Number(partida?.timeAId)
      ? partida?.timeB
      : Number(item?.timeId) === Number(partida?.timeBId)
        ? partida?.timeA
        : null;

    const pontosTimeA = Number(partida?.pontosTimeA) || 0;
    const pontosTimeB = Number(partida?.pontosTimeB) || 0;
    const meuLado = Number(item?.timeId) === Number(partida?.timeAId)
      ? 'A'
      : Number(item?.timeId) === Number(partida?.timeBId)
        ? 'B'
        : null;
    const golsMeuTime = meuLado === 'A'
      ? pontosTimeA
      : meuLado === 'B'
        ? pontosTimeB
        : 0;
    const golsJogador = Number(item?.gols) || 0;
    const participacaoGols = golsMeuTime > 0
      ? Math.round((golsJogador / golsMeuTime) * 100)
      : 0;
    const marcouTodosGolsTime = golsMeuTime > 0 && golsJogador >= golsMeuTime;

    ultimasPartidas.push({
      partidaId: Number(partida?.id) || item.partidaId,
      data: partida?.data || null,
      campeonatoId: campanha.campeonatoId,
      campeonatoNome: campanha.campeonatoNome,
      modalidadeId: modalidadePartidaId,
      modalidadeNome: modalidadePartidaNome,
      timeANome: partida?.timeA?.nome || 'Time A',
      timeAFoto: partida?.timeA?.foto || null,
      timeBNome: partida?.timeB?.nome || 'Time B',
      timeBFoto: partida?.timeB?.foto || null,
      meuTimeNome: meuTime?.nome || campanha.timeNome || 'Meu time',
      adversarioNome: adversario?.nome || 'Adversario',
      placar: `${pontosTimeA} x ${pontosTimeB}`,
      pontosTimeA,
      pontosTimeB,
      meuLado,
      golsMeuTime,
      participacaoGols,
      marcouTodosGolsTime,
      quadraNome: partida?.quadra?.nome || null,
      resultado: resultado.codigo,
      resultadoLabel: resultado.label,
      gols: golsJogador,
      cartoesAmarelos: Number(item?.cartoesAmarelos) || 0,
      cartoesVermelhos: Number(item?.cartoesVermelhos) || 0,
    });
  }

  const campanhas = Array.from(campanhasMap.values())
    .map((campanha) => ({
      ...campanha,
      aproveitamento: calcularAproveitamento(campanha.partidas, campanha.vitorias, campanha.empates),
    }))
    .sort((a, b) => {
      if (b.partidas !== a.partidas) return b.partidas - a.partidas;
      return String(a.campeonatoNome || '').localeCompare(String(b.campeonatoNome || ''));
    });

  return {
    usuarioId: usuarioIdNum,
    jogador: {
      id: usuario.jogador.id,
      nome: usuario.jogador.nome,
      foto: usuario.jogador.foto || null,
      numero: Number(usuario.jogador.numero) || null,
      funcao: usuario.jogador.funcao || null,
      times: timesVinculados,
    },
    resumo: {
      partidas: totalPartidas,
      gols: totalGols,
      cartoesAmarelos: totalAmarelos,
      cartoesVermelhos: totalVermelhos,
      vitorias: totalVitorias,
      empates: totalEmpates,
      derrotas: totalDerrotas,
      aproveitamento: calcularAproveitamento(totalPartidas, totalVitorias, totalEmpates),
      mediaGols: totalPartidas > 0 ? Number((totalGols / totalPartidas).toFixed(2)) : 0,
    },
    campanhas,
    ultimasPartidas: ultimasPartidas.slice(0, 4),
    atualizadoEm: new Date().toISOString(),
  };
}

async function getUsuarioTimesService(usuarioId) {
  return prisma.usuario.findUnique({
    where: { id: Number(usuarioId) },
    include: {
      times: {
        where: {
          ativo: true,
          deletedAt: null,
        },
        include: {
          time: {
            include: {
              modalidade: true,
            },
          },
        },
      },
      treinadorTimes: {
        where: {
          ativo: true,
          deletedAt: null,
        },
        include: {
          time: {
            include: {
              modalidade: true,
            },
          },
        },
      },
    },
  });
}

module.exports = {
  cadastrarUsuario,
  atualizarUsuario,
  atualizarMeuPerfil,
  excluirMinhaConta,
  getUsuarios,
  getUsuariosResumo,
  getResumoPublicoHome,
  getUsuarioTimesService,
  listarPermissoes,
  vincularUsuarioTime,
  getEstatisticasJogadorVinculado,
};
