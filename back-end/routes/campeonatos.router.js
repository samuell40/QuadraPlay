const express = require('express');
const router = express.Router();
const controller = require('../controllers/campeonatos.controller')
const validarJWT = require('../middlewares/auth');

router.post('/criar/campeonato', controller.criarCampeonatoController);

router.delete('/removerCampeonato/:id', controller.removerCampeonatoController);

router.get('/listar/:modalidadeId', controller.listarCampeonatosPorModalidadeController);

router.get('/todos/campeonatos', controller.listarCampeonatosAnoAtualController)

router.get('/campeonatos/mesario/andamento', [validarJWT], controller.listarCampeonatosEmAndamentoMesarioController);
router.get('/campeonato/:id/mesarios', [validarJWT], controller.listarMesariosCampeonatoController);
router.put('/campeonato/:id/mesarios', [validarJWT], controller.atualizarMesariosCampeonatoController);
router.get('/campeonato/:id/equipes', [validarJWT], controller.listarEquipesCampeonatoController);
router.get('/campeonato/:id/equipes/disponiveis', [validarJWT], controller.listarEquipesDisponiveisCampeonatoController);
router.post('/campeonato/:id/equipes', [validarJWT], controller.adicionarEquipeCampeonatoController);
router.delete('/campeonato/:id/equipes/:timeId', [validarJWT], controller.removerEquipeCampeonatoController);
router.get('/campeonato/:id/equipes/:timeId/jogadores', [validarJWT], controller.listarJogadoresEquipeCampeonatoController);
router.put('/campeonato/:id/equipes/:timeId/jogadores/:jogadorId/suspensao', [validarJWT], controller.atualizarSuspensaoJogadorEquipeCampeonatoController);

router.get('/:campeonatoId/artilharia', controller.artilhariaCampeonatoController );

router.get('/campeonato/:id', controller.listarCampeonatoPorIdController);

router.put('/campeonato/:id', controller.atualizarCampeonatoController);

router.patch('/campeonato/:id/finalizar', controller.finalizarCampeonatoController);
router.post('/campeonato/:id/gerar-mata-mata', [validarJWT], controller.gerarMataMataPontosCorridosController);

router.get('/campeonato/:id/regras', controller.obterRegrasCampeonatoController);

router.put('/campeonato/:id/regras', controller.atualizarRegrasCampeonatoController);

router.get('/placar/fase/:campeonatoId/', controller.listarPlacarPorFaseController);

router.get('/fases/:campeonatoId/', controller.listarFasesERodadasController);

router.post('/campeonatos/:campeonatoId/fases', controller.adicionarFaseController);

router.post("/rodada/:campeonatoId/:faseId", controller.adicionarRodadaController);

module.exports = router;
