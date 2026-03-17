const express = require('express');
const validarJWT = require('../middlewares/auth');
const controller = require('../controllers/push-notification.controller');

const router = express.Router();

router.get('/notificacoes/push/public-key', controller.obterChavePublicaPushController);

router.get('/notificacoes/push/banner.svg', controller.renderizarBannerPushController);

router.post('/notificacoes/push/subscribe', [validarJWT], controller.assinarPushController);

router.post('/notificacoes/push/unsubscribe', [validarJWT], controller.desassinarPushController);

router.get(
  '/notificacoes/push/partidas/preferencia',
  [validarJWT],
  controller.obterPreferenciaPushPartidasAoVivoController
);

router.patch(
  '/notificacoes/push/partidas/preferencia',
  [validarJWT],
  controller.atualizarPreferenciaPushPartidasAoVivoController
);

router.get(
  '/notificacoes/push/agendamentos/preferencia',
  [validarJWT],
  controller.obterPreferenciaPushNovosAgendamentosController
);

router.patch(
  '/notificacoes/push/agendamentos/preferencia',
  [validarJWT],
  controller.atualizarPreferenciaPushNovosAgendamentosController
);

module.exports = router;
