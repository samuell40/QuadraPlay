const webpush = require('web-push');
const prisma = require('../lib/prisma');

let configuracaoTentada = false;
let pushHabilitado = false;
const ID_PERMISSAO_DESENVOLVEDOR = 1;
const ID_PERMISSAO_ADMINISTRADOR = 2;
const TAG_AGENDAMENTOS_PENDENTES_GLOBAL = 'agendamentos-pendentes-global';
const TAG_PREFIX_NOTIFICACAO_PARTIDA = 'partida-live-';
const PERFIS_PODEM_RECEBER_NOTIFICACAO_AGENDAMENTO = new Set([
  ID_PERMISSAO_DESENVOLVEDOR,
  ID_PERMISSAO_ADMINISTRADOR
]);

function tagNotificacaoAgendamentosPendentesQuadra(quadraId) {
  return `agendamentos-pendentes-quadra-${Number(quadraId || 0) || 0}`;
}

function criarErroPush(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function obterChavePublicaPush() {
  return String(process.env.VAPID_PUBLIC_KEY || '').trim();
}

function configurarPushSePossivel() {
  if (configuracaoTentada) return pushHabilitado;
  configuracaoTentada = true;

  const publicKey = obterChavePublicaPush();
  const privateKey = String(process.env.VAPID_PRIVATE_KEY || '').trim();
  const subject = String(
    process.env.VAPID_SUBJECT || 'mailto:contato@quadraplaysv.com.br'
  ).trim();

  if (!publicKey || !privateKey) {
    console.warn('[push] chaves VAPID ausentes. Web push desabilitado.');
    pushHabilitado = false;
    return pushHabilitado;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    pushHabilitado = true;
  } catch (error) {
    console.error('[push] falha ao configurar VAPID:', error?.message || error);
    pushHabilitado = false;
  }

  return pushHabilitado;
}

function statusNotificacaoPartida(status) {
  const statusNormalizado = String(status || '').toUpperCase();
  if (statusNormalizado === 'EM_ANDAMENTO') return 'AO VIVO';
  if (statusNormalizado === 'AGENDADA') return 'AGENDADA';
  if (statusNormalizado === 'ADIADA') return 'ADIADA';
  if (statusNormalizado === 'FINALIZADA') return 'FINALIZADA';
  if (statusNormalizado === 'CANCELADA') return 'CANCELADA';
  if (statusNormalizado === 'DELETADA') return 'ENCERRADA';
  return 'ATUALIZADA';
}

function normalizarBaseUrl(valor) {
  const base = String(valor || '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(base)) return '';
  return base;
}

function obterBasePublicaBackend() {
  const candidatas = [
    process.env.BACKEND_PUBLIC_URL,
    process.env.BACKEND_URL,
    process.env.API_URL,
    process.env.RENDER_EXTERNAL_URL,
    'https://quadra-livre-backend.onrender.com'
  ];

  for (const candidata of candidatas) {
    const normalizada = normalizarBaseUrl(candidata);
    if (normalizada) return normalizada;
  }

  return 'https://quadra-livre-backend.onrender.com';
}

function montarUrlBannerPush(payload = {}) {
  const statusLabel = statusNotificacaoPartida(payload?.status);
  const horario = String(payload?.horario || '').trim();
  const params = new URLSearchParams({
    provedor: 'Google',
    horario: horario || '--:--',
    timeA: String(payload?.timeA || 'Time A'),
    timeB: String(payload?.timeB || 'Time B'),
    campeonato: String(payload?.campeonatoNome || 'Campeonato'),
    quadra: String(payload?.quadra || 'Quadra'),
    status: String(statusLabel || ''),
    timeAFoto: String(payload?.timeAFoto || ''),
    timeBFoto: String(payload?.timeBFoto || '')
  });

  const atualizadoEm = String(payload?.atualizadoEm || '').trim();
  if (atualizadoEm) params.set('v', atualizadoEm);

  return `${obterBasePublicaBackend()}/notificacoes/push/banner.svg?${params.toString()}`;
}

function montarPayloadNotificacaoPartida(payload = {}) {
  const partidaId = Number(payload?.partidaId || 0);
  const pontosTimeA = Number(payload?.pontosTimeA ?? 0);
  const pontosTimeB = Number(payload?.pontosTimeB ?? 0);
  const timeA = String(payload?.timeA || 'Time A');
  const timeB = String(payload?.timeB || 'Time B');
  const timeAFoto = String(payload?.timeAFoto || '').trim();
  const timeBFoto = String(payload?.timeBFoto || '').trim();
  const campeonatoNome = String(payload?.campeonatoNome || 'Campeonato').trim() || 'Campeonato';
  const status = String(payload?.status || '').toUpperCase();
  const quadra = String(payload?.quadra || '').trim();
  const encerrada = Boolean(payload?.encerrada);
  const statusLabel = statusNotificacaoPartida(status);
  const titulo = `${timeA} ${pontosTimeA} x ${pontosTimeB} ${timeB}`;
  const body = [statusLabel, campeonatoNome, quadra]
    .filter(Boolean)
    .join(' | ');
  const icon = '/ico.png';

  return {
    title: titulo,
    body,
    icon,
    badge: '/ico.png',
    tag: `partida-live-${partidaId}`,
    renotify: true,
    requireInteraction: !encerrada,
    data: {
      partidaId,
      campeonatoId: Number(payload?.campeonatoId || 0) || null,
      status,
      campeonatoNome,
      quadra,
      timeAFoto,
      timeBFoto,
      url: partidaId
        ? `/visualizarplacarhome?partidaId=${partidaId}`
        : '/visualizarplacarhome'
    }
  };
}

function montarPayloadFecharNotificacaoPush(tag, url = '/agendamentos') {
  return {
    closeTagOnly: true,
    tag: String(tag || '').trim(),
    data: {
      url
    }
  };
}

function montarPayloadFecharNotificacoesPushPorPrefixo(prefixo, url = '/visualizarplacarhome') {
  return {
    closeTagPrefix: String(prefixo || '').trim(),
    data: {
      url
    }
  };
}

function montarTituloFilaAgendamentosPendentes(quantidade = 0) {
  const total = Math.max(0, Number(quantidade || 0));
  return total === 1
    ? 'Ha 1 agendamento aguardando aprovacao'
    : `Ha ${total} agendamentos aguardando aprovacao`;
}

function montarPayloadNotificacaoAgendamentosPendentes({
  quantidade = 0,
  escopo = 'global',
  quadraId = null,
  quadraNome = '',
  renotify = true
} = {}) {
  const total = Math.max(0, Number(quantidade || 0));
  const escopoNormalizado = String(escopo || 'global').trim().toLowerCase();
  const nomeQuadra = String(quadraNome || '').trim();
  const quadraIdNum = Number(quadraId || 0) || null;
  const tag = escopoNormalizado === 'quadra' && quadraIdNum
    ? tagNotificacaoAgendamentosPendentesQuadra(quadraIdNum)
    : TAG_AGENDAMENTOS_PENDENTES_GLOBAL;
  const body = escopoNormalizado === 'quadra'
    ? `Pendentes na quadra ${nomeQuadra || 'vinculada'}. Toque para revisar na tela de agendamentos.`
    : 'Pendentes em todas as quadras. Toque para revisar na tela de agendamentos.';

  return {
    title: montarTituloFilaAgendamentosPendentes(total),
    body,
    icon: '/ico.png',
    badge: '/ico.png',
    tag,
    renotify: Boolean(renotify),
    requireInteraction: true,
    silent: !renotify,
    actions: [
      { action: 'abrir_agendamentos', title: 'Abrir agendamentos' }
    ],
    data: {
      tipo: 'AGENDAMENTOS_PENDENTES',
      quantidade: total,
      escopo: escopoNormalizado,
      quadraId: quadraIdNum,
      url: '/agendamentos'
    }
  };
}

function validarAssinatura(subscription = {}) {
  const endpoint = String(subscription?.endpoint || '').trim();
  const p256dh = String(subscription?.keys?.p256dh || '').trim();
  const auth = String(subscription?.keys?.auth || '').trim();

  if (!endpoint || !p256dh || !auth) {
    throw new Error('Assinatura push invalida.');
  }

  return {
    endpoint,
    keys: {
      p256dh,
      auth
    }
  };
}

async function assinarPushUsuario(usuarioId, subscription = {}) {
  const idUsuario = Number(usuarioId || 0);
  if (!idUsuario) {
    throw new Error('Usuario invalido para assinatura push.');
  }

  const assinatura = validarAssinatura(subscription);

  return prisma.pushSubscription.upsert({
    where: { endpoint: assinatura.endpoint },
    create: {
      usuarioId: idUsuario,
      endpoint: assinatura.endpoint,
      p256dh: assinatura.keys.p256dh,
      auth: assinatura.keys.auth
    },
    update: {
      usuarioId: idUsuario,
      p256dh: assinatura.keys.p256dh,
      auth: assinatura.keys.auth
    }
  });
}

async function removerAssinaturaPushUsuario(usuarioId, endpoint = '') {
  const idUsuario = Number(usuarioId || 0);
  const endpointNormalizado = String(endpoint || '').trim();

  if (!idUsuario || !endpointNormalizado) return { count: 0 };

  return prisma.pushSubscription.deleteMany({
    where: {
      usuarioId: idUsuario,
      endpoint: endpointNormalizado
    }
  });
}

async function obterUsuarioElegivelPushNovosAgendamentos(usuarioId) {
  const idUsuario = Number(usuarioId || 0);

  if (!idUsuario) {
    throw criarErroPush('Usuario invalido para atualizar a preferencia.', 400);
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: idUsuario },
    select: {
      id: true,
      ativo: true,
      deletedAt: true,
      permissaoId: true,
      quadraId: true,
      notificarNovosAgendamentos: true
    }
  });

  if (!usuario || !usuario.ativo || usuario.deletedAt) {
    throw criarErroPush('Usuario nao encontrado para essa preferencia.', 404);
  }

  if (!PERFIS_PODEM_RECEBER_NOTIFICACAO_AGENDAMENTO.has(Number(usuario.permissaoId))) {
    throw criarErroPush('Perfil sem acesso a notificacoes de novos agendamentos.', 403);
  }

  if (
    Number(usuario.permissaoId) === ID_PERMISSAO_ADMINISTRADOR &&
    !(Number(usuario.quadraId || 0) > 0)
  ) {
    throw criarErroPush('Administrador sem quadra vinculada para receber alertas.', 400);
  }

  return usuario;
}

async function obterUsuarioElegivelPushPartidasAoVivo(usuarioId) {
  const idUsuario = Number(usuarioId || 0);

  if (!idUsuario) {
    throw criarErroPush('Usuario invalido para atualizar a preferencia.', 400);
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: idUsuario },
    select: {
      id: true,
      ativo: true,
      deletedAt: true,
      notificarPartidasAoVivo: true
    }
  });

  if (!usuario || !usuario.ativo || usuario.deletedAt) {
    throw criarErroPush('Usuario nao encontrado para essa preferencia.', 404);
  }

  return usuario;
}

function tagFilaAgendamentosPorUsuario(usuario = {}) {
  const permissaoId = Number(usuario?.permissaoId || 0);
  if (permissaoId === ID_PERMISSAO_DESENVOLVEDOR) {
    return TAG_AGENDAMENTOS_PENDENTES_GLOBAL;
  }

  return tagNotificacaoAgendamentosPendentesQuadra(usuario?.quadraId);
}

async function enviarPayloadPushParaUsuario(usuarioId, payload = {}, options = {}) {
  const idUsuario = Number(usuarioId || 0);
  if (!idUsuario) return;
  if (!configurarPushSePossivel()) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      usuarioId: idUsuario,
      usuario: {
        ativo: true,
        deletedAt: null
      }
    },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true
    }
  });

  if (!subscriptions.length) return;

  const envios = subscriptions.map((item) =>
    enviarPayloadPushParaAssinatura(item, payload, options)
  );
  await Promise.allSettled(envios);
}

async function obterPreferenciaPushNovosAgendamentosUsuario(usuarioId) {
  const usuario = await obterUsuarioElegivelPushNovosAgendamentos(usuarioId);

  return {
    enabled: Boolean(usuario.notificarNovosAgendamentos)
  };
}

async function obterPreferenciaPushPartidasAoVivoUsuario(usuarioId) {
  const usuario = await obterUsuarioElegivelPushPartidasAoVivo(usuarioId);

  return {
    enabled: Boolean(usuario.notificarPartidasAoVivo)
  };
}

async function atualizarPreferenciaPushNovosAgendamentosUsuario(usuarioId, enabled = false) {
  const usuario = await obterUsuarioElegivelPushNovosAgendamentos(usuarioId);
  const habilitado = Boolean(enabled);

  const atualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      notificarNovosAgendamentos: habilitado
    },
    select: {
      id: true,
      permissaoId: true,
      quadraId: true,
      notificarNovosAgendamentos: true
    }
  });

  if (habilitado) {
    if (Number(atualizado.permissaoId) === ID_PERMISSAO_DESENVOLVEDOR) {
      await atualizarNotificacoesPushFilaAgendamentosPendentes({ renotify: false });
    } else {
      await atualizarNotificacoesPushFilaAgendamentosPendentes({
        quadraId: atualizado.quadraId,
        renotify: false
      });
    }
  } else {
    await enviarPayloadPushParaUsuario(
      atualizado.id,
      montarPayloadFecharNotificacaoPush(tagFilaAgendamentosPorUsuario(atualizado)),
      { TTL: 120, urgency: 'normal' }
    );
  }

  return {
    enabled: Boolean(atualizado.notificarNovosAgendamentos)
  };
}

async function atualizarPreferenciaPushPartidasAoVivoUsuario(usuarioId, enabled = true) {
  const usuario = await obterUsuarioElegivelPushPartidasAoVivo(usuarioId);
  const habilitado = Boolean(enabled);

  const atualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      notificarPartidasAoVivo: habilitado
    },
    select: {
      id: true,
      notificarPartidasAoVivo: true
    }
  });

  if (!habilitado) {
    await enviarPayloadPushParaUsuario(
      atualizado.id,
      montarPayloadFecharNotificacoesPushPorPrefixo(TAG_PREFIX_NOTIFICACAO_PARTIDA),
      { TTL: 120, urgency: 'normal' }
    );
  }

  return {
    enabled: Boolean(atualizado.notificarPartidasAoVivo)
  };
}

async function enviarPayloadPushParaAssinatura(item = {}, payload = {}, options = {}) {
  const assinatura = {
    endpoint: item.endpoint,
    keys: {
      p256dh: item.p256dh,
      auth: item.auth
    }
  };

  try {
    await webpush.sendNotification(assinatura, JSON.stringify(payload), {
      TTL: Number(options?.TTL || 120),
      urgency: String(options?.urgency || 'high')
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode || 0);
    if (statusCode === 404 || statusCode === 410) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: item.endpoint }
      });
      return;
    }

    console.warn(
      '[push] falha ao enviar notificacao:',
      statusCode || '-',
      error?.message || error
    );
  }
}

async function enviarNotificacaoPushParaPartidas(payload = {}) {
  const partidaId = Number(payload?.partidaId || 0);
  if (!partidaId) return;
  if (!configurarPushSePossivel()) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      usuario: {
        ativo: true,
        deletedAt: null,
        notificarPartidasAoVivo: true
      }
    },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true
    }
  });

  if (!subscriptions.length) return;

  const notificacao = montarPayloadNotificacaoPartida(payload);
  const envios = subscriptions.map((item) => enviarPayloadPushParaAssinatura(item, notificacao));
  await Promise.allSettled(envios);
}

async function atualizarNotificacoesPushFilaAgendamentosPendentes({
  quadraId = null,
  renotify = false
} = {}) {
  const quadraIdNum = Number(quadraId || 0) || null;
  if (!configurarPushSePossivel()) return;

  const filtrosUsuarios = [
    { permissaoId: ID_PERMISSAO_DESENVOLVEDOR }
  ];

  if (quadraIdNum) {
    filtrosUsuarios.push({
      permissaoId: ID_PERMISSAO_ADMINISTRADOR,
      quadraId: quadraIdNum
    });
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      usuario: {
        ativo: true,
        deletedAt: null,
        notificarNovosAgendamentos: true,
        OR: filtrosUsuarios
      }
    },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
      usuario: {
        select: {
          id: true,
          permissaoId: true,
          quadraId: true,
          notificarNovosAgendamentos: true,
          quadra: {
            select: { nome: true }
          }
        }
      }
    }
  });

  if (!subscriptions.length) return;

  const possuiDesenvolvedores = subscriptions.some(
    (item) => Number(item?.usuario?.permissaoId) === ID_PERMISSAO_DESENVOLVEDOR
  );
  const possuiAdministradores = quadraIdNum
    ? subscriptions.some(
      (item) =>
        Number(item?.usuario?.permissaoId) === ID_PERMISSAO_ADMINISTRADOR &&
        Number(item?.usuario?.quadraId) === quadraIdNum
    )
    : false;

  const [totalGlobal, totalQuadra] = await Promise.all([
    possuiDesenvolvedores
      ? prisma.agendamento.count({
        where: {
          status: 'Pendente',
          deletedAt: null
        }
      })
      : Promise.resolve(0),
    possuiAdministradores
      ? prisma.agendamento.count({
        where: {
          status: 'Pendente',
          deletedAt: null,
          quadraId: quadraIdNum
        }
      })
      : Promise.resolve(0)
  ]);

  const envios = subscriptions.map((item) => {
    const permissaoId = Number(item?.usuario?.permissaoId);
    const ehDesenvolvedor = permissaoId === ID_PERMISSAO_DESENVOLVEDOR;
    const quantidade = ehDesenvolvedor ? totalGlobal : totalQuadra;
    const tag = ehDesenvolvedor
      ? TAG_AGENDAMENTOS_PENDENTES_GLOBAL
      : tagNotificacaoAgendamentosPendentesQuadra(item?.usuario?.quadraId);
    const payload = quantidade > 0
      ? montarPayloadNotificacaoAgendamentosPendentes({
        quantidade,
        escopo: ehDesenvolvedor ? 'global' : 'quadra',
        quadraId: ehDesenvolvedor ? null : item?.usuario?.quadraId,
        quadraNome: ehDesenvolvedor ? '' : item?.usuario?.quadra?.nome,
        renotify
      })
      : montarPayloadFecharNotificacaoPush(tag);

    return enviarPayloadPushParaAssinatura(item, payload, {
      TTL: 120,
      urgency: renotify ? 'high' : 'normal'
    });
  });

  await Promise.allSettled(envios);
}

module.exports = {
  obterChavePublicaPush,
  assinarPushUsuario,
  removerAssinaturaPushUsuario,
  obterPreferenciaPushPartidasAoVivoUsuario,
  atualizarPreferenciaPushPartidasAoVivoUsuario,
  obterPreferenciaPushNovosAgendamentosUsuario,
  atualizarPreferenciaPushNovosAgendamentosUsuario,
  enviarNotificacaoPushParaPartidas,
  atualizarNotificacoesPushFilaAgendamentosPendentes
};
