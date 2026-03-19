const {
  obterChavePublicaPush,
  assinarPushUsuario,
  removerAssinaturaPushUsuario,
  obterPreferenciaPushPartidasAoVivoUsuario,
  atualizarPreferenciaPushPartidasAoVivoUsuario,
  obterPreferenciaPushNovosAgendamentosUsuario,
  atualizarPreferenciaPushNovosAgendamentosUsuario
} = require('../services/push-notification.service');

function escaparXml(valor = '') {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizarTexto(valor, fallback = '') {
  const texto = String(valor || '').trim();
  return texto || String(fallback || '').trim();
}

function limitarTexto(valor, limite = 24) {
  const texto = normalizarTexto(valor);
  if (!texto) return '';
  if (texto.length <= limite) return texto;
  return `${texto.slice(0, Math.max(1, limite - 3)).trimEnd()}...`;
}

function normalizarUrlImagem(valor) {
  const url = String(valor || '').trim();
  if (!/^https?:\/\//i.test(url)) return '';
  return url;
}

function siglaTime(nome = '') {
  const texto = String(nome || '').trim();
  if (!texto) return 'TIME';

  const partes = texto
    .split(/\s+/)
    .map((p) => p.replace(/[^\p{L}0-9]/gu, ''))
    .filter(Boolean);

  if (!partes.length) return 'TIME';
  if (partes.length === 1) return partes[0].slice(0, 3).toUpperCase();

  return partes.slice(0, 3).map((p) => p[0]).join('').toUpperCase();
}

function montarBannerPushSvg({
  provedor = 'Google',
  horario = '',
  timeA = 'Time A',
  timeB = 'Time B',
  campeonato = 'Campeonato',
  quadra = '',
  status = '',
  timeAFoto = '',
  timeBFoto = ''
} = {}) {
  const provedorLabel = escaparXml(limitarTexto(provedor || 'Google', 18) || 'Google');
  const horarioLabel = escaparXml(limitarTexto(horario, 10));
  const campeonatoLabel = escaparXml(limitarTexto(campeonato, 34) || 'Campeonato');
  const quadraLabel = escaparXml(limitarTexto(quadra, 36) || 'Quadra');
  const statusLabel = escaparXml(limitarTexto(status, 16));
  const timeASigla = escaparXml(siglaTime(timeA));
  const timeBSigla = escaparXml(siglaTime(timeB));
  const timeAUrl = escaparXml(normalizarUrlImagem(timeAFoto));
  const timeBUrl = escaparXml(normalizarUrlImagem(timeBFoto));
  const subtitulo = [statusLabel, campeonatoLabel].filter(Boolean).join(' | ');
  const subtituloLabel = subtitulo || campeonatoLabel;

  const logoA = timeAUrl
    ? `<image href="${timeAUrl}" x="148" y="165" width="140" height="140" preserveAspectRatio="xMidYMid slice" clip-path="url(#clipA)" />`
    : `<circle cx="218" cy="235" r="70" fill="#1f2937" stroke="#f8fafc" stroke-width="2"/><text x="218" y="244" text-anchor="middle" fill="#f8fafc" font-size="34" font-weight="700">${timeASigla}</text>`;

  const logoB = timeBUrl
    ? `<image href="${timeBUrl}" x="912" y="165" width="140" height="140" preserveAspectRatio="xMidYMid slice" clip-path="url(#clipB)" />`
    : `<circle cx="982" cy="235" r="70" fill="#1f2937" stroke="#f8fafc" stroke-width="2"/><text x="982" y="244" text-anchor="middle" fill="#f8fafc" font-size="34" font-weight="700">${timeBSigla}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="628" viewBox="0 0 1200 628">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155" />
      <stop offset="48%" stop-color="#4b5563" />
      <stop offset="100%" stop-color="#1f2937" />
    </linearGradient>
    <radialGradient id="shine" cx="50%" cy="45%" r="58%">
      <stop offset="0%" stop-color="rgba(59,130,246,0.30)" />
      <stop offset="100%" stop-color="rgba(15,23,42,0)" />
    </radialGradient>
    <clipPath id="clipA"><circle cx="218" cy="235" r="70"/></clipPath>
    <clipPath id="clipB"><circle cx="982" cy="235" r="70"/></clipPath>
  </defs>

  <rect width="1200" height="628" fill="url(#bg)" />
  <rect width="1200" height="628" fill="url(#shine)" />

  <rect x="80" y="72" width="1040" height="484" rx="72" fill="rgba(15,23,42,0.44)" stroke="rgba(255,255,255,0.10)" />

  <text x="600" y="138" text-anchor="middle" fill="#e5e7eb" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="600">${provedorLabel}</text>
  <text x="600" y="208" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="64" font-weight="700">${horarioLabel || '--:--'}</text>
  <text x="600" y="276" text-anchor="middle" fill="#d1d5db" font-family="Segoe UI, Arial, sans-serif" font-size="46" font-weight="500">${subtituloLabel}</text>

  ${logoA}
  ${logoB}

  <line x1="160" y1="372" x2="1040" y2="372" stroke="rgba(255,255,255,0.34)" stroke-width="2" />
  <text x="600" y="442" text-anchor="middle" fill="#f8fafc" font-family="Segoe UI, Arial, sans-serif" font-size="48" font-weight="600">${quadraLabel}</text>
</svg>`;
}

async function obterChavePublicaPushController(req, res) {
  const publicKey = obterChavePublicaPush();

  if (!publicKey) {
    return res.status(503).json({
      error: 'Notificacoes push indisponiveis no momento.'
    });
  }

  return res.status(200).json({ publicKey });
}

async function assinarPushController(req, res) {
  try {
    const usuarioId = Number(req.user?.id || 0);
    const subscription = req.body?.subscription || req.body;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario nao autenticado.' });
    }

    await assinarPushUsuario(usuarioId, subscription);

    return res.status(201).json({ success: true });
  } catch (error) {
    return res.status(400).json({
      error: error?.message || 'Nao foi possivel salvar a assinatura push.'
    });
  }
}

async function desassinarPushController(req, res) {
  try {
    const usuarioId = Number(req.user?.id || 0);
    const endpoint = String(req.body?.endpoint || req.body?.subscription?.endpoint || '').trim();

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario nao autenticado.' });
    }

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint de assinatura obrigatorio.' });
    }

    await removerAssinaturaPushUsuario(usuarioId, endpoint);

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({
      error: error?.message || 'Nao foi possivel remover a assinatura push.'
    });
  }
}

async function obterPreferenciaPushNovosAgendamentosController(req, res) {
  try {
    const usuarioId = Number(req.user?.id || 0);

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario nao autenticado.' });
    }

    const preferencia = await obterPreferenciaPushNovosAgendamentosUsuario(usuarioId);
    return res.status(200).json(preferencia);
  } catch (error) {
    return res.status(Number(error?.statusCode || 400)).json({
      error: error?.message || 'Nao foi possivel carregar a preferencia de notificacao.'
    });
  }
}

async function obterPreferenciaPushPartidasAoVivoController(req, res) {
  try {
    const usuarioId = Number(req.user?.id || 0);

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario nao autenticado.' });
    }

    const preferencia = await obterPreferenciaPushPartidasAoVivoUsuario(usuarioId);
    return res.status(200).json(preferencia);
  } catch (error) {
    return res.status(Number(error?.statusCode || 400)).json({
      error: error?.message || 'Nao foi possivel carregar a preferencia de notificacao.'
    });
  }
}

async function atualizarPreferenciaPushNovosAgendamentosController(req, res) {
  try {
    const usuarioId = Number(req.user?.id || 0);

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario nao autenticado.' });
    }

    const preferencia = await atualizarPreferenciaPushNovosAgendamentosUsuario(
      usuarioId,
      req.body?.enabled
    );

    return res.status(200).json(preferencia);
  } catch (error) {
    return res.status(Number(error?.statusCode || 400)).json({
      error: error?.message || 'Nao foi possivel atualizar a preferencia de notificacao.'
    });
  }
}

async function atualizarPreferenciaPushPartidasAoVivoController(req, res) {
  try {
    const usuarioId = Number(req.user?.id || 0);

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario nao autenticado.' });
    }

    const preferencia = await atualizarPreferenciaPushPartidasAoVivoUsuario(
      usuarioId,
      req.body?.enabled
    );

    return res.status(200).json(preferencia);
  } catch (error) {
    return res.status(Number(error?.statusCode || 400)).json({
      error: error?.message || 'Nao foi possivel atualizar a preferencia de notificacao.'
    });
  }
}

function renderizarBannerPushController(req, res) {
  const svg = montarBannerPushSvg({
    provedor: req.query?.provedor,
    horario: req.query?.horario,
    timeA: req.query?.timeA,
    timeB: req.query?.timeB,
    campeonato: req.query?.campeonato,
    quadra: req.query?.quadra,
    status: req.query?.status,
    timeAFoto: req.query?.timeAFoto,
    timeBFoto: req.query?.timeBFoto
  });

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).send(svg);
}

module.exports = {
  obterChavePublicaPushController,
  assinarPushController,
  desassinarPushController,
  obterPreferenciaPushPartidasAoVivoController,
  atualizarPreferenciaPushPartidasAoVivoController,
  obterPreferenciaPushNovosAgendamentosController,
  atualizarPreferenciaPushNovosAgendamentosController,
  renderizarBannerPushController
};
