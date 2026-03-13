const Usuario = require('../services/usuario.service');
const jwt = require('jsonwebtoken');
const config = require('../config/app.config');

async function cadastrarUsuarioController(req, res) {
  try {
    const { nome, email, telefone, foto } = req.body;

    if (!nome || !email) {
      return res.status(400).json({
        error: 'Nome e email sao obrigatorios.',
      });
    }

    const cadastro = await Usuario.cadastrarUsuario({
      nome,
      email,
      telefone,
      foto,
    });

    const tokenPayload = {
      id: cadastro.id,
      nome: cadastro.nome,
      email: cadastro.email,
      telefone: cadastro.telefone,
      foto: cadastro.foto,
      permissaoId: cadastro.permissaoId,
      permissao: cadastro.permissao || null,
      quadraId: cadastro.quadraId ?? null,
      quadra: cadastro.quadra || null,
      jogadorId: cadastro.jogadorId ?? null,
      jogador: cadastro.jogador || null,
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, {
      expiresIn: config.JWT_EXPIRATION,
    });

    return res.status(201).json({
      usuario: tokenPayload,
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'Erro ao cadastrar usuario.',
    });
  }
}

async function atualizarUsuarioController(req, res) {
  try {
    const { email, permissaoId, quadraId } = req.body;

    if (!email || !permissaoId) {
      return res.status(400).json({
        error: 'Email e permissao sao obrigatorios.',
      });
    }

    const usuarioAtualizado = await Usuario.atualizarUsuario({
      email,
      permissaoId,
      quadraId,
    });

    return res.status(200).json(usuarioAtualizado);
  } catch (err) {
    console.error(err);

    return res.status(400).json({
      error: err.message || 'Erro ao atualizar usuario.',
    });
  }
}

async function atualizarMeuPerfilController(req, res) {
  try {
    const usuarioId = Number(req.user?.id);
    const { nome, email, telefone, foto } = req.body || {};

    const usuarioAtualizado = await Usuario.atualizarMeuPerfil({
      usuarioId,
      nome,
      email,
      telefone,
      foto,
    });

    const tokenPayload = {
      id: usuarioAtualizado.id,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      telefone: usuarioAtualizado.telefone,
      foto: usuarioAtualizado.foto,
      permissaoId: usuarioAtualizado.permissaoId,
      permissao: usuarioAtualizado.permissao || null,
      quadraId: usuarioAtualizado.quadraId ?? null,
      quadra: usuarioAtualizado.quadra || null,
      jogadorId: usuarioAtualizado.jogadorId ?? null,
      jogador: usuarioAtualizado.jogador || null,
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, {
      expiresIn: config.JWT_EXPIRATION,
    });

    return res.status(200).json({
      usuario: tokenPayload,
      token,
    });
  } catch (err) {
    console.error(err);

    const mensagem = err.message || 'Erro ao atualizar perfil.';
    const status = mensagem.toLowerCase().includes('nao encontrado') ? 404 : 400;

    return res.status(status).json({
      error: mensagem,
    });
  }
}

async function excluirMinhaContaController(req, res) {
  try {
    const usuarioId = Number(req.user?.id);
    await Usuario.excluirMinhaConta(usuarioId);

    return res.status(200).json({
      message: 'Conta excluida com sucesso.',
    });
  } catch (err) {
    console.error(err);

    const mensagem = err.message || 'Erro ao excluir conta.';
    const status = mensagem.toLowerCase().includes('nao encontrado') ? 404 : 400;

    return res.status(status).json({
      error: mensagem,
    });
  }
}

async function listarUsuariosController(req, res) {
  try {
    const usuarios = await Usuario.getUsuarios();
    return res.status(200).json(usuarios);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'Erro ao buscar usuarios.',
    });
  }
}

async function listarUsuariosResumoController(req, res) {
  try {
    const usuarios = await Usuario.getUsuariosResumo();
    return res.status(200).json(usuarios);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'Erro ao buscar resumo de usuarios.',
    });
  }
}

async function listarPermissoesController(req, res) {
  try {
    const permissoes = await Usuario.listarPermissoes();
    return res.status(200).json(permissoes);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'Erro ao buscar permissoes.',
    });
  }
}

async function vincularUsuarioTimeController(req, res) {
  try {
    const { usuarioId, timeId, jogadorId } = req.body;

    if (!usuarioId || !timeId) {
      return res.status(400).json({
        error: 'Usuario e time sao obrigatorios.',
      });
    }

    const resultado = await Usuario.vincularUsuarioTime(
      usuarioId,
      timeId,
      jogadorId
    );

    return res.status(201).json({
      message: 'Vinculo realizado com sucesso',
      vinculo: resultado.vinculo,
      jogador: resultado.jogador,
    });
  } catch (error) {
    console.error('Erro ao vincular usuario ao time:', error);
    return res.status(400).json({
      error: error.message || 'Erro ao vincular usuario ao time.',
    });
  }
}

async function listarUsuarioTimesController(req, res) {
  try {
    const { id } = req.params;

    const usuario = await Usuario.getUsuarioTimesService(id);

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario nao encontrado',
      });
    }

    const permissaoTreinador = Number(usuario.permissaoId) === 5;
    const origem = permissaoTreinador ? usuario.treinadorTimes : usuario.times;

    const ids = new Set();
    const times = (Array.isArray(origem) ? origem : [])
      .map((vinculo) => vinculo?.time)
      .filter((time) => {
        const id = Number(time?.id);
        if (!Number.isInteger(id) || id <= 0) return false;
        if (ids.has(id)) return false;
        ids.add(id);
        return true;
      });

    return res.status(200).json(times);
  } catch (err) {
    console.error('Erro ao buscar times do usuario:', err);
    return res.status(500).json({
      error: 'Erro interno ao buscar times do usuario',
    });
  }
}

async function minhasEstatisticasJogadorController(req, res) {
  try {
    const usuarioId = Number(req.user?.id);
    const modalidadeId = Number(req.query?.modalidadeId);
    const estatisticas = await Usuario.getEstatisticasJogadorVinculado(usuarioId, {
      modalidadeId: Number.isInteger(modalidadeId) && modalidadeId > 0 ? modalidadeId : null,
    });
    return res.status(200).json(estatisticas);
  } catch (err) {
    console.error('Erro ao buscar estatisticas do jogador vinculado:', err);

    if (err?.code === 'USUARIO_SEM_JOGADOR') {
      return res.status(404).json({
        error: err.message || 'Usuario nao possui jogador vinculado.',
      });
    }

    const mensagem = String(err?.message || 'Erro ao buscar estatisticas do jogador.');
    const mensagemNormalizada = mensagem.toLowerCase();

    if (mensagemNormalizada.includes('nao encontrado')) {
      return res.status(404).json({ error: mensagem });
    }

    if (mensagemNormalizada.includes('invalido')) {
      return res.status(400).json({ error: mensagem });
    }

    return res.status(500).json({
      error: 'Erro ao buscar estatisticas do jogador.',
    });
  }
}

module.exports = {
  cadastrarUsuarioController,
  atualizarUsuarioController,
  atualizarMeuPerfilController,
  excluirMinhaContaController,
  listarUsuariosController,
  listarUsuariosResumoController,
  listarPermissoesController,
  vincularUsuarioTimeController,
  listarUsuarioTimesController,
  minhasEstatisticasJogadorController,
};
