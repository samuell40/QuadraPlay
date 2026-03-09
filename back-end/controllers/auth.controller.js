const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config/app.config');
const { findUserByEmail } = require('../services/auth.service');

const FRONTEND_CALLBACK_BASE =
  process.env.FRONTEND_URL ||
  process.env.APP_URL ||
  process.env.QUADRAPLAY_URL ||
  'https://www.quadraplaysv.com.br';

function montarRedirectGoogleCallback(query = '') {
  return `${String(FRONTEND_CALLBACK_BASE).replace(/\/+$/, '')}/google-callback${query}`;
}

function montarGoogleCallbackBackend(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol || 'https';
  const host = forwardedHost || req.get('host');

  if (host) {
    return `${protocol}://${host}/auth/google/callback`;
  }

  return process.env.GOOGLE_CALLBACK_URL || 'https://quadra-livre-backend.onrender.com/auth/google/callback';
}

function redirecionarErroGoogle(res, erro, extras = {}) {
  const params = new URLSearchParams({ erro: String(erro || 'erro_callback_google') });

  Object.entries(extras).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const texto = String(value).trim();
    if (!texto) return;
    params.set(key, texto);
  });

  return res.redirect(montarRedirectGoogleCallback(`?${params.toString()}`));
}

function isAuthCodeInvalido(error) {
  const message = String(error?.message || '');
  const code = String(error?.code || '');
  const oauthData = error?.oauthError?.data ? String(error.oauthError.data) : '';
  const bruto = `${message} ${code} ${oauthData}`;

  return /invalid_grant|Malformed auth code/i.test(bruto);
}

async function verificarUsuario(req, accessToken, refreshToken, profile, done) {
  try {
    const email = profile?.emails?.[0]?.value;

    if (!email) {
      return done(null, false, { message: 'Email não fornecido pelo Google' });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return done(null, false, { message: 'usuario_nao_cadastrado', email });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}


function iniciarLoginGoogle(req, res, next) {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
    callbackURL: montarGoogleCallbackBackend(req),
  })(req, res, next);
}

function callbackLoginGoogle(req, res, next) {
  if (req.query.error === 'access_denied') {
    return res.send(`<script> window.close(); </script>`);
  }

  const code = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
  if (!code) {
    return redirecionarErroGoogle(res, 'codigo_google_invalido');
  }

  passport.authenticate('google', {
    session: false,
    callbackURL: montarGoogleCallbackBackend(req),
  }, async (err, user, info) => {
    try {
      if (err) throw err;

      if (!user) {
        const email = info?.email || '';
        return redirecionarErroGoogle(res, 'usuario_nao_cadastrado', { email });
      }

      if (!user.id || !user.nome || !user.email) {
        return res.status(500).json({ erro: 'Dados do usuário incompletos' });
      }

      const tokenPayload = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        foto: user.foto,
        permissaoId: user.permissaoId,
        permissao: user.permissao,
        quadraId: user.quadraId,
        quadra: user.quadra,
        jogadorId: user.jogadorId ?? null,
        jogador: user.jogador || null,
      };

      const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: config.JWT_EXPIRATION });
      const payload = encodeURIComponent(JSON.stringify({ token, usuario: tokenPayload }));
      const redirectUrl = montarRedirectGoogleCallback(`?data=${payload}`);
      return res.redirect(redirectUrl);

    } catch (error) {
      if (isAuthCodeInvalido(error)) {
        return redirecionarErroGoogle(res, 'codigo_google_invalido');
      }

      console.error('Erro no callbackLoginGoogle:', error);
      return res.status(500).json({ erro: 'erro_callback_google', detalhes: error.message });
    }
  })(req, res, next);
}

module.exports = {
  verificarUsuario,
  iniciarLoginGoogle,
  callbackLoginGoogle,
};
