const prisma = require('../lib/prisma');

async function findUserByEmail(email) {
  const user = await prisma.usuario.findFirst({
    where: {
      email,
      ativo: true,
      deletedAt: null,
    },
    include: {
      quadra: true,
      permissao: true,
      times: true,
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
    }
  });

  return user;
}

module.exports = { findUserByEmail };
