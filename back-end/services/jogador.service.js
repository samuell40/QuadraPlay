const prisma = require('../lib/prisma');

async function validarNumeroUnicoNoTime({
  timeId,
  numero,
  jogadorIgnorarId = null,
  tx = prisma
}) {
  const numeroNormalizado = Number(numero);
  if (!Number.isInteger(numeroNormalizado) || numeroNormalizado <= 0) {
    return;
  }

  const where = {
    timeId: Number(timeId),
    ativo: true,
    jogador: {
      numero: numeroNormalizado,
      ativo: true,
      deletedAt: null
    }
  };

  if (jogadorIgnorarId) {
    where.jogadorId = { not: Number(jogadorIgnorarId) };
  }

  const conflito = await tx.jogadorTime.findFirst({
    where,
    include: {
      jogador: true
    }
  });

  if (conflito?.jogador) {
    throw new Error(`O numero ${numeroNormalizado} ja esta em uso neste time pelo jogador ${conflito.jogador.nome}.`);
  }
}

async function adicionarJogador(dados) {
  const time = await prisma.time.findUnique({
    where: { id: dados.timeId },
    include: { modalidade: true },
  });
  if (!time) throw new Error("Time não encontrado");

  let usuarioVinculado = null;
  if (dados.usuarioId) {
    usuarioVinculado = await prisma.usuario.findUnique({
      where: { id: Number(dados.usuarioId) },
      select: {
        id: true,
        jogadorId: true,
        ativo: true,
        deletedAt: true,
        foto: true,
      },
    });

    if (!usuarioVinculado || !usuarioVinculado.ativo || usuarioVinculado.deletedAt) {
      throw new Error("Usuario informado nao existe");
    }

    if (usuarioVinculado.jogadorId) {
      throw new Error("Usuario informado ja esta vinculado a um jogador");
    }
  }

  let funcaoIdFinal = dados.funcaoId;

  await validarNumeroUnicoNoTime({
    timeId: dados.timeId,
    numero: dados.numero
  });

  if (!funcaoIdFinal) {
    let funcaoNenhuma = await prisma.funcaoJogador.findFirst({
      where: {
        nome: "Nenhuma",
        modalidadeId: time.modalidadeId,
      },
    });

    if (!funcaoNenhuma) {
      funcaoNenhuma = await prisma.funcaoJogador.create({
        data: {
          nome: "Nenhuma",
          modalidadeId: time.modalidadeId,
        },
      });
    }

    funcaoIdFinal = funcaoNenhuma.id;
  }

  const jogador = await prisma.jogador.create({
    data: {
      nome: dados.nome,
      numero: dados.numero ?? null,
      foto: dados.foto || usuarioVinculado?.foto || null,
      funcaoId: funcaoIdFinal,
    },
    include: {
      funcao: true,
      times: {
        include: {
          time: true,
          modalidade: true,
        },
      },
    },
  });

  await prisma.jogadorTime.create({
    data: {
      jogadorId: jogador.id,
      timeId: dados.timeId,
      modalidadeId: time.modalidadeId,
    },
  });

  if (dados.usuarioId) {
    await prisma.usuario.update({
      where: { id: Number(dados.usuarioId) },
      data: {
        jogadorId: jogador.id,
      },
    });

    await prisma.usuarioTime.upsert({
      where: {
        usuarioId_timeId: {
          usuarioId: Number(dados.usuarioId),
          timeId: dados.timeId,
        },
      },
      update: {},
      create: {
        usuarioId: Number(dados.usuarioId),
        timeId: dados.timeId,
      },
    });
  }

  return jogador;
}

async function removerJogadorTime(jogadorId, timeId) {
  jogadorId = Number(jogadorId);
  timeId = Number(timeId);

  const vinculo = await prisma.jogadorTime.findFirst({
    where: {
      jogadorId,
      timeId,
    },
  });

  if (!vinculo) {
    throw new Error('Jogador não está vinculado a este time');
  }
  await prisma.jogadorTime.delete({
    where: {
      id: vinculo.id,
    },
  });

  return { message: 'Jogador removido do time com sucesso' };
}

async function atualizarFotoJogador(jogadorId, foto) {
  jogadorId = Number(jogadorId);

  const jogador = await prisma.jogador.findUnique({
    where: { id: jogadorId },
  });

  if (!jogador) {
    throw new Error("Jogador não encontrado");
  }

  const jogadorAtualizado = await prisma.jogador.update({
    where: { id: jogadorId },
    data: {
      foto,
    },
    include: {
      funcao: true,
      times: {
        include: {
          time: true,
          modalidade: true,
        },
      },
    },
  });

  return jogadorAtualizado;
}

async function listarJogadoresPorTime(timeId) {
  const time = await prisma.time.findUnique({
    where: { id: Number(timeId) },
    include: {
      jogadores: {
        where: {
          ativo: true,
          deletedAt: null,
        },
        include: {
          jogador: {
            include: {
              funcao: true,
              atuacoes: true,
              usuario: {
                select: {
                  id: true,
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

  if (!time) throw new Error("Time não encontrado");

  return time.jogadores.map(jt => ({
    id: jt.jogador.id,
    nome: jt.jogador.nome,
    numero: jt.jogador.numero,
    foto: jt.jogador.foto,
    funcao: jt.jogador.funcao,
    atuacoes: jt.jogador.atuacoes,
    vinculado: Boolean(
      jt.jogador.usuario &&
      jt.jogador.usuario.ativo &&
      !jt.jogador.usuario.deletedAt
    ),
  }));
}

async function listarTodosJogadores(modalidadeId) {
  const jogadores = await prisma.jogador.findMany({
    include: {
      funcao: true,
      atuacoes: true,
      times: {
        include: {
          time: true,
          modalidade: true,
        },
      },
    },
  });

  return jogadores.map(j => ({
    id: j.id,
    nome: j.nome,
    numero: j.numero,
    foto: j.foto,
    funcao: j.funcao,
    atuacoes: j.atuacoes,
    times: j.times
      .filter(jt => jt.modalidadeId === Number(modalidadeId))
      .map(jt => ({
        id: jt.time.id,
        nome: jt.time.nome,
        modalidadeId: jt.modalidadeId,
      })),
  }));
}

async function atualizarFuncaoJogador(jogadorId, funcaoId) {
  const jogador = await prisma.jogador.findUnique({
    where: { id: jogadorId },
  });

  if (!jogador) {
    throw new Error("Jogador não encontrado");
  }

  if (funcaoId !== null) {
    const funcao = await prisma.funcaoJogador.findUnique({
      where: { id: funcaoId },
    });

    if (!funcao) {
      throw new Error("Função de jogador não encontrada");
    }
  }

  return prisma.jogador.update({
    where: { id: jogadorId },
    data: { funcaoId },
    include: {
      funcao: true,
      times: {
        include: {
          time: true,
          modalidade: true,
        },
      },
    },
  });
}

async function adicionarFuncaoJogador(dados) {
  const { nome, modalidadeId } = dados;

  const existente = await prisma.funcaoJogador.findFirst({
    where: {
      nome: nome.trim(),
      modalidadeId: Number(modalidadeId),
    },
  });

  if (existente) {
    throw new Error("Essa função já existe para essa modalidade");
  }

  const funcao = await prisma.funcaoJogador.create({
    data: {
      nome: nome.trim(),
      modalidadeId: Number(modalidadeId),
    },
  });

  return funcao;
}

async function removerFuncaoJogador(dados) {
  const { id, modalidadeId } = dados;

  const existente = await prisma.funcaoJogador.findFirst({
    where: {
      id: Number(id),
      modalidadeId: Number(modalidadeId),
    },
  });

  if (!existente) {
    throw new Error("Função não encontrada para essa modalidade");
  }

  await prisma.jogador.updateMany({
    where: {
      funcaoId: Number(id),
    },
    data: {
      funcaoId: null,
    },
  });

  await prisma.funcaoJogador.delete({
    where: { id: Number(id) },
  });

  return { message: "Função removida com sucesso" };
}

async function listarFuncoesJogador(modalidadeId) {
  const funcoes = await prisma.funcaoJogador.findMany({
    where: { modalidadeId: Number(modalidadeId) },
    include: {
      _count: {
        select: { jogadores: true }
      }
    }
  });
  return funcoes;
}

async function moverJogadorDeTime(jogadorId, novoTimeId) {
  const jogador = await prisma.jogador.findUnique({
    where: { id: jogadorId },
    include: {
      times: { include: { time: { include: { modalidade: true } } } }
    }
  });
  if (!jogador) throw new Error("Jogador não encontrado");

  const novoTime = await prisma.time.findUnique({
    where: { id: novoTimeId },
    include: { modalidade: true }
  });
  if (!novoTime) throw new Error("Time não encontrado");

  const modalidadeId = novoTime.modalidadeId;
  await validarNumeroUnicoNoTime({
    timeId: novoTimeId,
    numero: jogador.numero,
    jogadorIgnorarId: jogadorId
  });

  const vinculoAntigo = jogador.times.find(
    jt => jt.time.modalidadeId === modalidadeId
  );

  if (vinculoAntigo) {
    await prisma.jogadorTime.delete({
      where: { id: vinculoAntigo.id }
    });
  }

  await prisma.jogadorTime.create({
    data: {
      jogadorId,
      timeId: novoTimeId,
      modalidadeId
    }
  });

  return prisma.jogador.findUnique({
    where: { id: jogadorId },
    include: {
      times: { include: { time: true, modalidade: true } }
    }
  });
}

module.exports = {
  adicionarJogador,
  removerJogadorTime,
  atualizarFotoJogador,
  listarJogadoresPorTime,
  listarTodosJogadores,
  adicionarFuncaoJogador,
  removerFuncaoJogador,
  listarFuncoesJogador,
  atualizarFuncaoJogador,
  moverJogadorDeTime,
  validarNumeroUnicoNoTime
};

