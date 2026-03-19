const {
  criarAgendamentoService,
  listarAgendamentosService,
  listarTodosAgendamentosService,
  listarAgendamentosPorQuadraService,
  listarAgendamentosConfirmadosService,
  listarAgendamentosOcupadosService,
  listarAgendamentosConfirmadosSemanaService,
  cancelarAgendamentoService,
  atualizarAgendamentoService,
  desmarcarAgendamentoService,
  atualizarAgendamentosFixosService,
  listarModalidadesPorQuadraService,
  listarAgendamentosPorTimeService,
} = require("../services/agendamento.service");

const criarAgendamentoController = async (req, res) => {
  try {
    const usuarioId = req.user?.id || req.body.usuarioId;
    if (!usuarioId)
      return res.status(400).json({ error: "Usuário não informado." });

    const {
      datahora,
      duracao,
      tipo,
      escola,
      descricao,
      quadraId,
      modalidadeId,
      timeId,
      ignorarRegra,
      status,
      fixo,
    } = req.body;

    if (!datahora || !quadraId) {
      return res
        .status(400)
        .json({
          error: "Campos obrigatorios (datahora e quadra) nao preenchidos.",
        });
    }

    const agendamento = await criarAgendamentoService({
      usuarioId,
      datahora,
      duracao: Number(duracao ?? 1),
      tipo: tipo ?? "TREINO",
      escola: escola ?? null,
      descricao: descricao ?? null,
      quadraId: Number(quadraId),
      modalidadeId: modalidadeId ? Number(modalidadeId) : null,
      timeId: timeId ? Number(timeId) : null,
      ignorarRegra,
      status: status ?? "Pendente",
      fixo: fixo ?? false,
    });

    return res.status(201).json(agendamento);
  } catch (err) {
    console.error("Erro ao criar agendamento:", err);
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Erro ao criar agendamento." });
  }
};

const atualizarAgendamentosFixosController = async (req, res) => {
  try {
    const usuarioId = req.user?.id || req.body.usuarioId;
    const { lote } = req.body;

    const listaAgendamentos = Array.isArray(req.body) ? req.body : lote;

    if (!usuarioId) {
      return res.status(400).json({ error: "Usuário não informado." });
    }

    const resultados = await atualizarAgendamentosFixosService(
      listaAgendamentos,
      usuarioId,
    );

    return res.status(201).json(resultados);
  } catch (err) {
    console.error("Erro ao criar agendamentos em lote:", err);
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Erro ao processar agendamentos fixos." });
  }
};

const listarAgendamentosController = async (req, res) => {
  try {
    const usuarioId = req.user?.id;

    const agendamentos = await listarAgendamentosService(usuarioId);
    return res.status(200).json(agendamentos);
  } catch (err) {
    console.error(err);
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Erro ao listar agendamentos." });
  }
};

const listarTodosAgendamentosController = async (req, res) => {
  try {
    const agendamentos = await listarTodosAgendamentosService();
    return res.status(200).json(agendamentos);
  } catch (err) {
    console.error(err);
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Erro ao listar todos os agendamentos." });
  }
};

const listarAgendamentosPorQuadraController = async (req, res) => {
  try {
    const { quadraId } = req.params;

    if (!quadraId) {
      return res.status(400).json({ message: "Quadra não informada" });
    }
    const agendamentos = await listarAgendamentosPorQuadraService(quadraId);
    return res.status(200).json(agendamentos);
  } catch (err) {
    console.error(err);
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Erro ao listar agendamentos da quadra." });
  }
};

const listarAgendamentosAdminController = async (req, res) => {
  try {
    const quadraId = req.user?.quadraId;
    if (!quadraId) {
      return res
        .status(400)
        .json({ message: "Usuário não está vinculado a nenhuma quadra." });
    }

    const agendamentos = await listarAgendamentosPorQuadraService(quadraId);
    return res.status(200).json(agendamentos);
  } catch (err) {
    console.error(err);
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Erro ao listar agendamentos da quadra." });
  }
};
const listarAgendamentosConfirmadosController = async (req, res) => {
  try {
    const { quadraId } = req.params;
    const { ano, mes, dia } = req.query;

    const agendamentos = await listarAgendamentosConfirmadosService(
      Number(quadraId),
      Number(ano),
      Number(mes),
      Number(dia),
    );

    res.json(agendamentos);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || "Erro ao listar agendamentos confirmados",
    });
  }
};

const listarAgendamentosOcupadosController = async (req, res) => {
  try {
    const { quadraId } = req.params;
    const { ano, mes, dia } = req.query;

    const agendamentos = await listarAgendamentosOcupadosService(
      Number(quadraId),
      Number(ano),
      Number(mes),
      Number(dia),
    );

    res.json(agendamentos);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || "Erro ao listar agendamentos ocupados",
    });
  }
};

const listarAgendamentosConfirmadosSemana = async (req, res) => {
  try {
    const { quadraId } = req.params;
    const { inicio } = req.query;
    const agendamentos = await listarAgendamentosConfirmadosSemanaService(
      Number(quadraId),
      inicio,
    );
    res.json(agendamentos);
  } catch (err) {
    res
      .status(err.status || 500)
      .json({ message: err.message || "Erro interno." });
  }
};

const cancelarAgendamentoController = async (req, res) => {
  try {
    const { id } = req.params;
    await cancelarAgendamentoService(id);
    return res
      .status(200)
      .json({ message: "Agendamento deletado com sucesso." });
  } catch (err) {
    console.error(err);
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Erro ao deletar agendamento." });
  }
};

const aceitarAgendamentoController = async (req, res) => {
  try {
    const { id } = req.params;
    const agendamento = await atualizarAgendamentoService(id, "Confirmado");
    return res.status(200).json(agendamento);
  } catch (err) {
    console.error(err);
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Erro ao aceitar agendamento." });
  }
};

const recusarAgendamentoController = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivoRecusa } = req.body;
    const agendamento = await atualizarAgendamentoService(
      id,
      "Recusado",
      motivoRecusa,
    );
    return res.status(200).json(agendamento);
  } catch (err) {
    console.error(err);
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Erro ao recusar agendamento." });
  }
};

const desmarcarAgendamentoController = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivoRecusa } = req.body;
    const agendamento = await desmarcarAgendamentoService(id, req.user, motivoRecusa);
    return res.status(200).json(agendamento);
  } catch (err) {
    console.error(err);
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Erro ao desmarcar agendamento." });
  }
};

const listarModalidadesPorQuadraController = async (req, res) => {
  try {
    const { quadraId } = req.params;
    const modalidades = await listarModalidadesPorQuadraService(quadraId);
    return res.status(200).json(modalidades);
  } catch (err) {
    console.error(err);
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Erro ao listar modalidades." });
  }
};

const listarAgendamentosPorTimeController = async (req, res) => {
  try {
    const { timeId } = req.params;
    const { inicio, fim } = req.query;

    if (!timeId) {
      return res.status(400).json({ message: "Time não informado." });
    }

    const agendamentos = await listarAgendamentosPorTimeService(
      timeId,
      inicio,
      fim,
    );
    res.json(agendamentos);
  } catch (err) {
    console.error("Erro ao listar agendamentos por time:", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Erro ao listar agendamentos do time." });
  }
};

module.exports = {
  criarAgendamentoController,
  atualizarAgendamentosFixosController,
  listarAgendamentosController,
  listarTodosAgendamentosController,
  listarAgendamentosAdminController,
  listarAgendamentosPorQuadraController,
  listarAgendamentosConfirmadosController,
  listarAgendamentosOcupadosController,
  listarAgendamentosConfirmadosSemana,
  cancelarAgendamentoController,
  aceitarAgendamentoController,
  recusarAgendamentoController,
  desmarcarAgendamentoController,
  listarModalidadesPorQuadraController,
  listarAgendamentosPorTimeController,
};
