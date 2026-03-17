import { defineStore } from 'pinia';
import { bumpDataVersion } from './utils/dataVersion';
import { limparDadosAutenticacao, obterSessaoAutenticada } from './utils/authToken';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    usuario: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    getUser: (state) => state.usuario,
    getToken: (state) => state.token,
  },
  actions: {
    setAuthData(user, token) {
      this.usuario = user;
      this.token = token;

      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(user));
      bumpDataVersion('auth-login');
    },
    clearAuthData() {
      this.usuario = null;
      this.token = null;
      limparDadosAutenticacao();
    },
    login(user, token) {
      this.setAuthData(user, token);
    },
    logout() {
      this.clearAuthData();
    },
    carregarDados() {
      const { token, usuario } = obterSessaoAutenticada();

      if (token && usuario) {
        this.setAuthData(usuario, token);
        return;
      }

      this.usuario = null;
      this.token = null;
    },
  },
});
