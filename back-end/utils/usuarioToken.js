const jwt = require('jsonwebtoken');
const config = require('../config/app.config');

function montarPayloadUsuario(usuario = {}) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    emailPendente: usuario.emailPendente ?? null,
    emailPendenteExpiraEm: usuario.emailPendenteExpiraEm ?? null,
    telefone: usuario.telefone,
    foto: usuario.foto,
    permissaoId: usuario.permissaoId,
    permissao: usuario.permissao || null,
    quadraId: usuario.quadraId ?? null,
    quadra: usuario.quadra || null,
    jogadorId: usuario.jogadorId ?? null,
    jogador: usuario.jogador || null,
  };
}

function assinarTokenUsuario(usuario = {}) {
  const payload = montarPayloadUsuario(usuario);
  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.JWT_EXPIRATION,
  });

  return { payload, token };
}

module.exports = {
  montarPayloadUsuario,
  assinarTokenUsuario,
};
