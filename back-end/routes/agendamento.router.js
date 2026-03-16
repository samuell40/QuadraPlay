const express = require('express');
const { 
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
  listarAgendamentosPorTimeController
} = require('../controllers/agendamento.controller');
const validarJWT = require('../middlewares/auth');

const router = express.Router();

// Criar um novo agendamento
router.post('/agendamento', [validarJWT], criarAgendamentoController);

// Listar agendamentos do usuário logado
router.get('/agendamentos', [validarJWT], listarAgendamentosController);

// Listar todos os agendamentos (admin)
router.get('/agendamentos/todos', [validarJWT], listarTodosAgendamentosController);

// Listar agendamentos admin
router.get('/agendamentos/minha-quadra', [validarJWT], listarAgendamentosAdminController);

// Listar agendamentos por quadra
router.get('/agendamentos/quadra/:quadraId', [validarJWT], listarAgendamentosPorQuadraController);

// Listar agendamentos confirmados por quadra
router.get( "/agendamentos/quadra/:quadraId/confirmados", [validarJWT], listarAgendamentosConfirmadosController );
router.get('/agendamentos/quadra/:quadraId/ocupados', [validarJWT], listarAgendamentosOcupadosController);

// Listar agendamentos confirmados na semana por quadra
router.get('/agendamentos/quadra/:quadraId/confirmados/semana', [validarJWT], listarAgendamentosConfirmadosSemana);
router.get('/public/agendamentos/quadra/:quadraId/confirmados/semana', listarAgendamentosConfirmadosSemana);

// Listar modalidades por quadra (para o modal)
router.get('/quadra/:quadraId/modalidades', [validarJWT], listarModalidadesPorQuadraController);

// Listar agendamentos por time
router.get('/agendamentos/time/:timeId', [validarJWT], listarAgendamentosPorTimeController);

// Cancelar um agendamento
router.delete('/agendamento/:id', [validarJWT], cancelarAgendamentoController);

// Aceitar um agendamento
router.patch('/agendamento/:id/aceitar', [validarJWT], aceitarAgendamentoController);

// Recusar um agendamento
router.patch('/agendamento/:id/recusar', [validarJWT], recusarAgendamentoController);
router.patch('/agendamento/:id/desmarcar', [validarJWT], desmarcarAgendamentoController);

// Rota específica para salvar o lote de agendamentos fixos (substituindo os anteriores)
router.post('/agendamentos/fixos', [validarJWT], atualizarAgendamentosFixosController);

module.exports = router;
