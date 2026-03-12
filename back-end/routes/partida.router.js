const express = require('express');
const controller = require('../controllers/partida.controller')
const validarJWT = require('../middlewares/auth');
const router = express.Router();

router.post('/partida', [validarJWT], controller.criarPartidaController)

router.put('/partidas/:partidaId/iniciar', controller.iniciarPartidaController);

router.put('/partidas/:id/finalizar', [validarJWT], controller.finalizarPartidaController)

router.put('/partida/:id/parcial', [validarJWT], controller.atualizarParcialController);

router.put('/placar/:id/incrementar', [validarJWT], controller.incrementarPlacarController);

router.get('/partidas/:id/retornar', controller.retornarPartidaController);

router.post("/:partidaId/jogador/:jogadorId", controller.adicionarJogadorPartidaController);

router.get('/partida/:partidaId', controller.listarJogadoresSelecionadosController);

router.get('/partidas/escalacao/jogadores', controller.listarJogadoresEscalacaoController);

router.post('/atuacao', controller.atualizarAtuacaoJogadorController);

router.put('/partidas/:partidaId/substituir', controller.substituirJogadorController);

router.get('/:partidaId/:timeId/jogadores-fora-partida', controller.getJogadoresForaDaPartidaController);

router.put('/:partidaId/:jogadorId/remover', controller.removerJogadorDeCampoController);

router.get('/detalhar/partida/:id', controller.detalharPartidaController)

router.get('/partidas/:campeonatoId/:faseId/:rodadaId', [validarJWT.opcional], controller.listarPartidasDaRodadaDaFaseController)

router.get('/partidas/status', controller.listarStatusPartidaController);

router.put('/partidas/:id/status', [validarJWT], controller.alterarStatusPartidaController);

router.delete('/partidas/:id', [validarJWT], controller.removerPartidaController);

module.exports = router;
