import { bumpDataVersion } from '@/utils/dataVersion';

const AUTH_STORAGE_KEYS = [
  'token',
  'usuario',
  'quadraPlayLoginAtivo',
  'quadraPlayUltimaRota',
];

function lerValorStorage(chave) {
  return String(window.localStorage.getItem(chave) || '').trim();
}

function normalizarBase64Url(valor) {
  const base64 = String(valor || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  return base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
}

function decodificarPayloadJwt(token) {
  const partes = String(token || '').split('.');
  if (partes.length < 2) return null;

  try {
    return JSON.parse(window.atob(normalizarBase64Url(partes[1])));
  } catch {
    return null;
  }
}

export function limparDadosAutenticacao(reason = 'auth-logout') {
  AUTH_STORAGE_KEYS.forEach((chave) => window.localStorage.removeItem(chave));
  bumpDataVersion(reason);
}

export function obterTokenArmazenado() {
  const token = lerValorStorage('token');
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }

  return token;
}

export function tokenExpiradoOuInvalido(token) {
  const payload = decodificarPayloadJwt(token);
  const exp = Number(payload?.exp);

  if (!payload || !Number.isFinite(exp) || exp <= 0) {
    return true;
  }

  return exp <= Math.floor(Date.now() / 1000);
}

export function obterUsuarioArmazenado() {
  try {
    return JSON.parse(window.localStorage.getItem('usuario') || 'null');
  } catch {
    return null;
  }
}

export function obterSessaoAutenticada() {
  const token = obterTokenArmazenado();
  const usuario = obterUsuarioArmazenado();

  if (!token || !usuario) {
    if (token || usuario) {
      limparDadosAutenticacao();
    }
    return { token: null, usuario: null };
  }

  if (tokenExpiradoOuInvalido(token)) {
    limparDadosAutenticacao();
    return { token: null, usuario: null };
  }

  return { token, usuario };
}
