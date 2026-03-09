const campeonatoService = require('../services/campeonatos.service');

async function criarCampeonatoController(req, res) {
  try {
    const { nome, tipo, dataInicio, dataFim, status, modalidadeId, quadraId, times, datasJogos, foto, regras } = req.body;

    const usuarioId = req.body.usuarioId;

    const novoCampeonato = await campeonatoService.criarCampeonato({
      nome, tipo, dataInicio, dataFim, status, modalidadeId, quadraId, times, datasJogos, usuarioId, foto, regras
    });

    return res.status(201).json(novoCampeonato);

  } catch (error) {
    console.error("Erro no controller:", error);
    return res.status(400).json({
      erro: "Erro ao criar campeonato",
      detalhes: error.message
    });
  }
}

async function obterRegrasCampeonatoController(req, res) {
  try {
    const { id } = req.params;
    const regras = await campeonatoService.getRegrasCampeonato(id);
    return res.status(200).json({ regras });
  } catch (error) {
    return res.status(400).json({ erro: error.message });
  }
}

async function atualizarRegrasCampeonatoController(req, res) {
  try {
    const { id } = req.params;
    const { regras } = req.body;

    if (!regras || typeof regras !== 'object') {
      return res.status(400).json({ erro: 'regras deve ser um objeto.' });
    }

    const regrasAtualizadas = await campeonatoService.atualizarRegrasCampeonato(id, regras);
    return res.status(200).json({ regras: regrasAtualizadas });
  } catch (error) {
    console.error('Erro ao atualizar regras do campeonato:', error);
    return res.status(400).json({ erro: error.message });
  }
}

async function removerCampeonatoController(req, res, next) {
  try {
    const resultado = await campeonatoService.removerCampeonato(req.params.id);
    res.status(200).json({ mensagem: resultado.mensagem });
  } catch (err) {
    console.error(`Erro ao remover campeonato:`, err.message);
    next(err);
  }
}

async function listarCampeonatosPorModalidadeController(req, res) {
  try {
    const { modalidadeId } = req.params;
    const { ano } = req.query;
    if (!modalidadeId) {
      return res.status(400).json({ error: 'ID da modalidade é obrigatório.' });
    }
    const campeonatos = await campeonatoService.listarCampeonatosPorModalidade(Number(modalidadeId), ano);

    return res.status(200).json(campeonatos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar campeonatos.' });
  }
}

async function listarCampeonatosAnoAtualController(req, res) {
  try {
    const todosAnosParam = String(req.query?.todosAnos || '').toLowerCase()
    const incluirTodosAnos = ['1', 'true', 'sim', 'yes'].includes(todosAnosParam)
    const campeonatos = incluirTodosAnos
      ? await campeonatoService.listarTodosCampeonatosAtivos()
      : await campeonatoService.listarCampeonatosAnoAtual()

    return res.status(200).json(campeonatos)
  } catch (error) {
    console.error('Erro ao listar campeonatos do ano atual:', error)

    return res.status(500).json({
      message: 'Erro ao listar campeonatos do ano atual'
    })
  }
}

async function artilhariaCampeonatoController(req, res) {
  try {
    const { campeonatoId } = req.params;

    const artilharia = await campeonatoService.listarArtilhariaCampeonato(campeonatoId);

    return res.json(artilharia);
  } catch (error) {
    console.error('Erro ao buscar artilharia:', error);
    return res.status(500).json({
      erro: 'Erro ao buscar artilharia do campeonato'
    });
  }
}

async function listarCampeonatoPorIdController(req, res) {
  const { id } = req.params;

  try {
    const campeonato = await campeonatoService.getCampeonatoById(id);

    if (!campeonato) {
      return res.status(404).json({ message: 'Campeonato não encontrado' });
    }

    res.json(campeonato);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar campeonato' });
  }
}

async function atualizarCampeonatoController(req, res) {
  try {
    const { id } = req.params;
    const campeonato = await campeonatoService.atualizarDadosCampeonato(id, req.body || {});
    return res.status(200).json(campeonato);
  } catch (error) {
    return res.status(400).json({ erro: error.message });
  }
}

async function listarCampeonatosEmAndamentoMesarioController(req, res) {
  try {
    const usuarioId = Number(req.user?.id);

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario nao autenticado.' });
    }

    const campeonatos = await campeonatoService.listarCampeonatosEmAndamentoMesario(usuarioId);
    return res.status(200).json(campeonatos);
  } catch (error) {
    console.error('Erro ao listar campeonatos do mesario:', error);
    return res.status(500).json({ error: 'Erro ao listar campeonatos do mesario.' });
  }
}

async function listarMesariosCampeonatoController(req, res) {
  try {
    const permissaoId = Number(req.user?.permissaoId);
    if (![1, 2].includes(permissaoId)) {
      return res.status(403).json({ error: 'Sem permissao para listar mesarios do campeonato.' });
    }

    const campeonatoId = Number(req.params.id);
    const dados = await campeonatoService.listarMesariosCampeonato(campeonatoId);
    return res.status(200).json(dados);
  } catch (error) {
    console.error('Erro ao listar mesarios do campeonato:', error);
    return res.status(400).json({ error: error.message || 'Erro ao listar mesarios do campeonato.' });
  }
}

async function atualizarMesariosCampeonatoController(req, res) {
  try {
    const permissaoId = Number(req.user?.permissaoId);
    if (![1, 2].includes(permissaoId)) {
      return res.status(403).json({ error: 'Sem permissao para atualizar mesarios do campeonato.' });
    }

    const campeonatoId = Number(req.params.id);
    const mesariosIds = Array.isArray(req.body?.mesariosIds) ? req.body.mesariosIds : [];

    const dados = await campeonatoService.atualizarMesariosCampeonato(campeonatoId, mesariosIds);
    return res.status(200).json(dados);
  } catch (error) {
    console.error('Erro ao atualizar mesarios do campeonato:', error);
    return res.status(400).json({ error: error.message || 'Erro ao atualizar mesarios do campeonato.' });
  }
}

async function listarEquipesCampeonatoController(req, res) {
  try {
    const permissaoId = Number(req.user?.permissaoId);
    if (![1, 2].includes(permissaoId)) {
      return res.status(403).json({ error: 'Sem permissao para listar equipes do campeonato.' });
    }

    const campeonatoId = Number(req.params.id);
    const dados = await campeonatoService.listarEquipesCampeonato(campeonatoId);
    return res.status(200).json(dados);
  } catch (error) {
    console.error('Erro ao listar equipes do campeonato:', error);
    return res.status(400).json({ error: error.message || 'Erro ao listar equipes do campeonato.' });
  }
}

async function listarEquipesDisponiveisCampeonatoController(req, res) {
  try {
    const permissaoId = Number(req.user?.permissaoId);
    if (![1, 2].includes(permissaoId)) {
      return res.status(403).json({ error: 'Sem permissao para listar equipes disponiveis.' });
    }

    const campeonatoId = Number(req.params.id);
    const dados = await campeonatoService.listarEquipesDisponiveisCampeonato(campeonatoId);
    return res.status(200).json(dados);
  } catch (error) {
    console.error('Erro ao listar equipes disponiveis do campeonato:', error);
    return res.status(400).json({ error: error.message || 'Erro ao listar equipes disponiveis.' });
  }
}

async function adicionarEquipeCampeonatoController(req, res) {
  try {
    const permissaoId = Number(req.user?.permissaoId);
    if (![1, 2].includes(permissaoId)) {
      return res.status(403).json({ error: 'Sem permissao para adicionar equipe no campeonato.' });
    }

    const campeonatoId = Number(req.params.id);
    const timeId = Number(req.body?.timeId);
    const dados = await campeonatoService.adicionarEquipeCampeonato(campeonatoId, timeId);
    return res.status(200).json(dados);
  } catch (error) {
    console.error('Erro ao adicionar equipe no campeonato:', error);
    return res.status(400).json({ error: error.message || 'Erro ao adicionar equipe no campeonato.' });
  }
}

async function removerEquipeCampeonatoController(req, res) {
  try {
    const permissaoId = Number(req.user?.permissaoId);
    if (![1, 2].includes(permissaoId)) {
      return res.status(403).json({ error: 'Sem permissao para remover equipe do campeonato.' });
    }

    const campeonatoId = Number(req.params.id);
    const timeId = Number(req.params.timeId);
    const dados = await campeonatoService.removerEquipeCampeonato(campeonatoId, timeId);
    return res.status(200).json(dados);
  } catch (error) {
    console.error('Erro ao remover equipe do campeonato:', error);
    return res.status(400).json({ error: error.message || 'Erro ao remover equipe do campeonato.' });
  }
}

async function listarJogadoresEquipeCampeonatoController(req, res) {
  try {
    const permissaoId = Number(req.user?.permissaoId);
    if (![1, 2].includes(permissaoId)) {
      return res.status(403).json({ error: 'Sem permissao para listar jogadores da equipe.' });
    }

    const campeonatoId = Number(req.params.id);
    const timeId = Number(req.params.timeId);
    const dados = await campeonatoService.listarJogadoresEquipeCampeonato(campeonatoId, timeId);
    return res.status(200).json(dados);
  } catch (error) {
    console.error('Erro ao listar jogadores da equipe no campeonato:', error);
    return res.status(400).json({ error: error.message || 'Erro ao listar jogadores da equipe no campeonato.' });
  }
}

async function atualizarSuspensaoJogadorEquipeCampeonatoController(req, res) {
  try {
    const permissaoId = Number(req.user?.permissaoId);
    if (![1, 2].includes(permissaoId)) {
      return res.status(403).json({ error: 'Sem permissao para atualizar suspensao de jogador.' });
    }

    const campeonatoId = Number(req.params.id);
    const timeIdParam = Number(req.params.timeId);
    const timeIdBody = Number(req.body?.timeId);
    const timeId = Number.isInteger(timeIdParam) && timeIdParam > 0 ? timeIdParam : timeIdBody;
    const jogadorId = Number(req.params.jogadorId);
    const usuarioId = Number(req.user?.id) || null;
    const dados = await campeonatoService.atualizarSuspensaoJogadorEquipeCampeonato(
      campeonatoId,
      timeId,
      jogadorId,
      req.body || {},
      usuarioId
    );
    return res.status(200).json(dados);
  } catch (error) {
    console.error('Erro ao atualizar suspensao manual de jogador:', error);
    return res.status(400).json({ error: error.message || 'Erro ao atualizar suspensao do jogador.' });
  }
}

async function finalizarCampeonatoController(req, res) {
  try {
    const { id } = req.params;
    const campeonato = await campeonatoService.finalizarCampeonato(id);
    return res.status(200).json(campeonato);
  } catch (error) {
    return res.status(400).json({ erro: error.message });
  }
}

async function listarPlacarPorFaseController(req, res) {
  const { campeonatoId } = req.params;
  const { faseId } = req.query;

  try {
    const placaresPorFase = await campeonatoService.listarPlacarPorFase(campeonatoId, faseId);
    res.status(200).json(placaresPorFase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: error.message || "Erro ao listar placares por fase" });
  }
}

async function listarFasesERodadasController(req, res) {
  try {
    const { campeonatoId } = req.params;

    const fases = await campeonatoService.listarFasesERodadas(campeonatoId);

    return res.status(200).json(fases);
  } catch (error) {
    console.error("Erro ao listar fases e rodadas:", error);
    return res.status(400).json({
      erro: "Erro ao listar fases e rodadas",
      detalhes: error.message
    });
  }
}

async function adicionarFaseController(req, res) {
  try {
    const { campeonatoId } = req.params;
    const { nome, times } = req.body;

    if (!nome) {
      return res.status(400).json({
        error: 'O nome da fase é obrigatório',
      });
    }

    if (!Array.isArray(times) || times.length === 0) {
      return res.status(400).json({
        error: 'Informe os times que participarão da fase',
      });
    }

    const fase = await campeonatoService.criarFase(
      Number(campeonatoId),
      nome,
      times
    );

    return res.status(201).json(fase);
  } catch (error) {
    console.error('Erro ao criar fase:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
}

async function adicionarRodadaController(req, res) {
  try {
    const { faseId } = req.params;
    const { nome } = req.body;

    if (!nome) {
      return res.status(400).json({ message: "Nome da rodada é obrigatório" });
    }

    const rodada = await campeonatoService.criarRodada(parseInt(faseId), nome);

    return res.status(201).json({
      message: "Rodada criada com sucesso",
      rodada,
    });
  } catch (err) {
    console.error("Erro ao criar rodada:", err.message);
    return res.status(400).json({ message: err.message });
  }
}

module.exports = {
  criarCampeonatoController,
  removerCampeonatoController,
  listarCampeonatosPorModalidadeController,
  listarCampeonatosAnoAtualController,
  listarCampeonatosEmAndamentoMesarioController,
  listarMesariosCampeonatoController,
  atualizarMesariosCampeonatoController,
  listarEquipesCampeonatoController,
  listarEquipesDisponiveisCampeonatoController,
  adicionarEquipeCampeonatoController,
  removerEquipeCampeonatoController,
  listarJogadoresEquipeCampeonatoController,
  atualizarSuspensaoJogadorEquipeCampeonatoController,
  artilhariaCampeonatoController,
  listarCampeonatoPorIdController,
  atualizarCampeonatoController,
  finalizarCampeonatoController,
  obterRegrasCampeonatoController,
  atualizarRegrasCampeonatoController,
  listarPlacarPorFaseController,
  listarFasesERodadasController,
  adicionarFaseController,
  adicionarRodadaController
};
