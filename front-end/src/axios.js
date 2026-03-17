import axios from 'axios';
import Swal from 'sweetalert2';
import router from './router';
import { bumpDataVersion } from './utils/dataVersion';
import { limparDadosAutenticacao } from './utils/authToken';

const isDev = import.meta.env.DEV;
const METODOS_MUTACAO = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const API_BASE_URL_PROD = 'https://quadra-livre-backend.onrender.com';

function resolverBaseUrlApi() {
  const baseUrlEnv = String(
    process.env.VUE_APP_API_BASE_URL
    || process.env.VUE_APP_API_URL
    || ''
  ).trim();
  if (baseUrlEnv) return baseUrlEnv.replace(/\/+$/, '');

  return API_BASE_URL_PROD;
}

function deveInvalidarDados(config = {}) {
  if (!config || config.skipDataVersionBump) return false;

  const metodo = String(config.method || 'get').toUpperCase();
  return METODOS_MUTACAO.has(metodo);
}

const api = axios.create({
  baseURL: resolverBaseUrlApi()
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.requiresAuth && isDev) {
      console.warn('Token não encontrado. A requisição autenticada pode falhar.');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (deveInvalidarDados(response.config)) {
      const metodo = String(response.config?.method || '').toUpperCase();
      const url = String(response.config?.url || '');
      bumpDataVersion(`${metodo} ${url}`.trim());
    }

    return response;
  },
  (error) => {
    const silent = Boolean(error.config?.silent);

    if (error.response) {
      const status = error.response.status;
      const msg =
        error.response.data?.message ||
        error.response.data?.erro ||
        error.response.data?.error ||
        error.response.data?.detalhes ||
        'Ocorreu um erro inesperado.';
      const rotaAtualObj = router.currentRoute?.value || {};
      const ehRotaPublica = Boolean(rotaAtualObj?.meta?.public);
      const msgNormalizada = String(msg || '').toLowerCase();
      const erroTokenExpirado =
        status === 401 &&
        msgNormalizada.includes('token expirado');
      const erroTokenAusente =
        (status === 401 || status === 422) &&
        (
          msgNormalizada.includes('token nulo') ||
          msgNormalizada.includes('token ausente') ||
          msgNormalizada.includes('formato de token')
        );

      if (erroTokenExpirado) {
        limparDadosAutenticacao();
        Swal.fire({
          icon: 'warning',
          title: 'Sessão expirada',
          text: 'FaÃ§a login novamente para continuar.'
        });
        if (router.currentRoute?.value?.name !== 'Home') {
          router.push({ name: 'Home' });
        }
        return Promise.reject(error);
      }

      if (silent) {
        if (isDev) {
          console.warn('Requisição falhou:', status, msg);
        }
        return Promise.reject(error);
      }

      if (erroTokenAusente && ehRotaPublica) {
        if (isDev) {
          console.warn('Rota protegida chamada sem token em tela pública:', error.config?.url);
        }
        return Promise.reject(error);
      }

      if (status === 401) {
        console.error('Erro de autenticação:', msg);
        Swal.fire({ icon: 'error', title: 'Erro de autenticação', text: msg });
        const rotaAtual = router.currentRoute?.value?.fullPath;
        if (rotaAtual && rotaAtual !== '/NaoAutorizado') {
          router.push({ name: 'NaoAutorizado', query: { redirect: rotaAtual } });
        } else {
          router.push({ name: 'NaoAutorizado' });
        }
      } else if (status === 403) {
        console.error('Acesso negado:', msg);
        Swal.fire({ icon: 'error', title: 'Acesso negado', text: msg });
      } else if (status === 422) {
        console.error('Erro de validação:', msg);
        Swal.fire({ icon: 'warning', title: 'Erro de validação', text: msg });
      } else {
        console.error('Erro da API:', msg);
        Swal.fire({ icon: 'error', title: 'Erro', text: msg });
      }
    } else {
      if (silent) {
        if (isDev) {
          console.warn('Requisição sem resposta:', error.message);
        }
        return Promise.reject(error);
      }

      console.error('Erro inesperado:', error.message);
      Swal.fire({
        icon: 'error',
        title: 'Erro de conexão',
        text: 'Verifique sua internet e tente novamente.'
      });
    }

    return Promise.reject(error);
  }
);

export default api;
