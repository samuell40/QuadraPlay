import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import DashboardView from '@/views/DashboardView.vue';
import AgendamentosView from '../views/AgendamentosView.vue';
import NaoAutorizado from '@/views/NaoAutorizado.vue';
import CadastroView from '../views/CadastroView.vue';
import GerenciarQuadrasView from '@/views/GerenciarQuadrasView.vue';
import VisualizarPlacarHomeView from '@/views/VisualizarPlacarHomeView.vue';
import GerenciarPartidaView from '@/views/quadra_play/GerenciarPartidaView.vue';
import UsuariosView from '../views/UsuariosView';
import MeusAgendamentosView from '../views/usuario/MeusAgendamentosView.vue';
import AgendarQuadrasView from '@/views/usuario/AgendarQuadrasView.vue';
import AgendarQuadrasAdmView from '@/views/AgendarQuadrasAdmView.vue';
import HorariosView from '@/views/HorariosView.vue';
import HorariosPublicoView from '@/views/HorariosPublicoView.vue';
import GoogleCallback from '@/views/GoogleCallback.vue';
import GerenciartimesView from '@/views/quadra_play/GerenciartimesView.vue';
import GerenciarEquipesCampeonatoView from '@/views/quadra_play/GerenciarEquipesCampeonatoView.vue';
import HistoricoCampeonatosView from '@/views/quadra_play/HistoricoCampeonatosView.vue';
import TimesHomeView from '@/views/TimesView.vue';
import ConfiguracoesCampeonatoView from '@/views/quadra_play/configuracoesCampeonatoView.vue';
import ClassificacaoView from '@/views/quadra_play/ClassificacaoView.vue';
import MeusAvisosView from '../views/usuario/MeusAvisosView.vue';
import EstatisticasJogadorView from '../views/usuario/EstatisticasJogadorView.vue';
import telaInicialView from '@/views/quadra_play/telaInicialView.vue';
import { obterSessaoAutenticada } from '@/utils/authToken';

const QUADRA_PLAY_LOGIN_KEY = 'quadraPlayLoginAtivo';
const LAST_AUTH_ROUTE_KEY = 'quadraPlayUltimaRota';
const ROTAS_EXCECAO_QUADRA_PLAY = new Set(['NaoAutorizado', 'GoogleCallback', 'ConfirmarEmail']);
const ROTAS_PUBLICAS_LIBERADAS_QUADRA_PLAY = new Set(['Home', 'visualizar_placarhome', 'times', 'horarios_publico']);

function usuarioPossuiIndicadorJogador(usuario = null) {
  if (!usuario || typeof usuario !== 'object') return false;
  return (
    Object.prototype.hasOwnProperty.call(usuario, 'jogadorId') ||
    Object.prototype.hasOwnProperty.call(usuario, 'jogador')
  );
}

function obterJogadorIdVinculado(usuario = null) {
  const jogadorIdDireto = Number(usuario?.jogadorId);
  if (Number.isInteger(jogadorIdDireto) && jogadorIdDireto > 0) {
    return jogadorIdDireto;
  }

  const jogadorIdObjeto = Number(usuario?.jogador?.id);
  if (Number.isInteger(jogadorIdObjeto) && jogadorIdObjeto > 0) {
    return jogadorIdObjeto;
  }

  return null;
}

function obterUltimaRotaAutenticada() {
  const ultimaRota = String(localStorage.getItem(LAST_AUTH_ROUTE_KEY) || '').trim();
  if (!ultimaRota || ultimaRota === '/') return '';
  if (ultimaRota.startsWith('/NaoAutorizado') || ultimaRota.startsWith('/google-callback')) return '';
  return ultimaRota;
}

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { public: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true, roles: [1, 2], keepAlive: false },
  },
  {
    path: '/agendamentos',
    name: 'Agendamentos',
    component: AgendamentosView,
    meta: { requiresAuth: true, roles: [1, 2] },
  },
  {
    path: '/agendarquadra',
    name: 'agendar_quadra',
    component: AgendarQuadrasView,
    meta: { requiresAuth: true, roles: [3, 4, 5], keepAlive: false },
  },
  {
    path: '/agendarquadrasadm',
    name: 'agendar_quadra_adm',
    component: AgendarQuadrasAdmView,
    meta: { requiresAuth: true, roles: [1, 2], keepAlive: false },
  },
  {
    path: '/meusagendamentos',
    name: 'meus_agendamentos',
    component: MeusAgendamentosView,
    meta: { requiresAuth: true, roles: [3, 4, 5] },
  },
  {
    path: '/meusavisos',
    name: 'meus_avisos',
    component: MeusAvisosView,
    meta: { requiresAuth: true, roles: [3, 4, 5] },
  },
  {
    path: '/minhasestatisticas',
    name: 'minhas_estatisticas',
    component: EstatisticasJogadorView,
    meta: { requiresAuth: true, roles: [3, 4, 5], requiresJogadorVinculado: true },
  },
  {
    path: '/gerenciarquadras',
    name: 'gerenciar_quadras',
    component: GerenciarQuadrasView,
    meta: { requiresAuth: true, roles: [1, 2] },
  },
  {
    path: '/gerenciartimes',
    name: 'gerenciar_times',
    component: GerenciartimesView,
    meta: { requiresAuth: true, roles: [1, 2], requiresQuadraPlayLogin: true },
  },
  {
    path: '/gerenciar-equipes',
    name: 'gerenciar_equipes',
    component: GerenciarEquipesCampeonatoView,
    meta: { requiresAuth: true, roles: [1, 2], requiresQuadraPlayLogin: true },
  },
  {
    path: '/historico-campeonatos',
    name: 'historico_campeonatos',
    component: HistoricoCampeonatosView,
    meta: { requiresAuth: true, roles: [1, 2], requiresQuadraPlayLogin: true },
  },
  {
    path: '/times',
    name: 'times',
    component: TimesHomeView,
    meta: { public: true },
  },
  {
    path: '/gerenciarpartida',
    name: 'gerenciar_partida',
    component: GerenciarPartidaView,
    meta: { requiresAuth: true, roles: [1, 2, 4], requiresQuadraPlayLogin: true, keepAlive: false },
  },
  {
    path: '/partida',
    name: 'Partida',
    component: () => import('@/views/quadra_play/PartidaView.vue'),
    meta: { requiresAuth: true, roles: [1, 2, 4], requiresQuadraPlayLogin: true, keepAlive: false }
  },
  {
    path: '/visualizarplacarhome',
    name: 'visualizar_placarhome',
    component: VisualizarPlacarHomeView,
    meta: { public: true, keepAlive: false },
  },
  {
    path: '/usuarios',
    name: 'usuarios',
    component: UsuariosView,
    meta: { requiresAuth: true, roles: [1, 2], keepAlive: false },
  },
  {
    path: '/NaoAutorizado',
    name: 'NaoAutorizado',
    component: NaoAutorizado,
    meta: { public: true, keepAlive: false },
  },
  {
    path: '/google-callback',
    name: 'GoogleCallback',
    component: GoogleCallback,
    meta: { public: true, keepAlive: false },
  },
  {
    path: '/cadastro',
    name: 'Cadastro',
    component: CadastroView,
    meta: { public: true, keepAlive: false },
  },
  {
    path: '/confirmar-email',
    name: 'ConfirmarEmail',
    component: () => import('@/views/ConfirmarEmailView.vue'),
    meta: { public: true, keepAlive: false },
  },
  {
    path: '/horarios',
    name: 'Horarios',
    component: HorariosView,
    meta: { requiresAuth: true, roles: [1, 2] },
  },
  {
    path: '/horarios-publico',
    name: 'horarios_publico',
    component: HorariosPublicoView,
    meta: { public: true, keepAlive: false },
  },

  {
    path: '/telainicial',
    name: 'TelaInicial',
    component: telaInicialView,
    meta: { requiresAuth: true, roles: [1, 2, 4], requiresQuadraPlayLogin: true },
  },
  {
    path: '/detalharcampeonatos',
    name: 'Detalhar_Campeonatos',
    component: ConfiguracoesCampeonatoView,
    meta: { requiresAuth: true, roles: [1, 2], requiresQuadraPlayLogin: true },
  },
  {
    path: '/classificacao',
    name: 'Classificacao',
    component: ClassificacaoView,
    meta: { requiresAuth: true, roles: [1, 2], requiresQuadraPlayLogin: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.path === '/') {
      return { top: 0, left: 0 }
    }

    if (savedPosition) return savedPosition
    return { top: 0, left: 0 }
  }
});

function podeRestaurarUltimaRota(ultimaRota, contexto = {}) {
  const rota = String(ultimaRota || '').trim();
  if (!rota) return false;

  const token = String(contexto.token || '').trim();
  const usuario = contexto.usuario || null;
  const loginQuadraPlayAtivo = Boolean(contexto.loginQuadraPlayAtivo);

  const resolvida = router.resolve(rota);
  if (!resolvida?.matched?.length) return false;

  const nomeRota = String(resolvida?.name || '');
  const meta = resolvida?.meta || {};

  if (!nomeRota || nomeRota === 'Home' || nomeRota === 'NaoAutorizado' || nomeRota === 'GoogleCallback') {
    return false;
  }

  if (meta.requiresAuth && !token) return false;
  if (meta.requiresQuadraPlayLogin && !loginQuadraPlayAtivo) return false;

  if (
    loginQuadraPlayAtivo &&
    !meta.requiresQuadraPlayLogin &&
    !ROTAS_EXCECAO_QUADRA_PLAY.has(nomeRota) &&
    !ROTAS_PUBLICAS_LIBERADAS_QUADRA_PLAY.has(nomeRota)
  ) {
    return false;
  }

  if (meta.roles) {
    const permissaoId = Number(usuario?.permissaoId);
    if (!Number.isInteger(permissaoId) || !meta.roles.includes(permissaoId)) {
      return false;
    }
  }

  if (meta.requiresJogadorVinculado && usuarioPossuiIndicadorJogador(usuario)) {
    if (!obterJogadorIdVinculado(usuario)) {
      return false;
    }
  }

  return true;
}

router.beforeEach((to, from, next) => {
  const { token, usuario } = obterSessaoAutenticada();
  const loginQuadraPlayAtivo = localStorage.getItem(QUADRA_PLAY_LOGIN_KEY) === '1';
  const primeiraNavegacao = !Array.isArray(from?.matched) || from.matched.length === 0;

  if (primeiraNavegacao && to.name === 'Home' && token) {
    const ultimaRota = obterUltimaRotaAutenticada();
    if (ultimaRota && ultimaRota !== to.fullPath) {
      if (podeRestaurarUltimaRota(ultimaRota, { token, usuario, loginQuadraPlayAtivo })) {
        return next(ultimaRota);
      }
      localStorage.removeItem(LAST_AUTH_ROUTE_KEY);
    }
  }

  if (to.meta.requiresAuth && !token) {
    return next({ name: 'Home' });
  }

  if (to.meta.requiresQuadraPlayLogin && !loginQuadraPlayAtivo) {
    return next({ name: 'Home' });
  }

  if (
    loginQuadraPlayAtivo &&
    !to.meta.requiresQuadraPlayLogin &&
    !ROTAS_EXCECAO_QUADRA_PLAY.has(to.name) &&
    !ROTAS_PUBLICAS_LIBERADAS_QUADRA_PLAY.has(to.name)
  ) {
    return next({ name: 'Home' });
  }

  if (to.meta.roles) {
    const permissaoId = Number(usuario?.permissaoId);
    if (!Number.isInteger(permissaoId) || !to.meta.roles.includes(permissaoId)) {
      if (String(to.name || '') === 'Detalhar_Campeonatos' && permissaoId === 4) {
        return next({ name: 'gerenciar_partida', query: { ...to.query } });
      }
      return next({ name: 'Home' });
    }
  }

  if (to.meta.requiresJogadorVinculado && usuarioPossuiIndicadorJogador(usuario)) {
    if (!obterJogadorIdVinculado(usuario)) {
      return next({ name: 'agendar_quadra' });
    }
  }

  next();
});

router.afterEach((to) => {
  if (!to?.meta?.requiresAuth) return;
  if (String(to?.name || '') === 'NaoAutorizado') return;
  localStorage.setItem(LAST_AUTH_ROUTE_KEY, to.fullPath);
});

export default router;
