<template>
  <div class="google-callback">
    <p>{{ mensagem }}</p>
  </div>
</template>

<script>
import router from '@/router';
import { useAuthStore } from '@/store';

const QUADRA_PLAY_LOGIN_KEY = 'quadraPlayLoginAtivo';
const ORIGEM_PADRAO_FRONTEND = 'https://www.quadraplaysv.com.br';

function montarDestinoPosLogin(usuario) {
  const permissaoId = Number(usuario?.permissaoId);

  if ([1, 2].includes(permissaoId)) {
    return { name: 'Dashboard' };
  }

  if ([3, 4, 5].includes(permissaoId)) {
    return { name: 'agendar_quadra' };
  }

  return { name: 'Home' };
}

function montarDestinoCadastro(email = '') {
  const queryCadastro = new URLSearchParams({
    email: String(email || ''),
    origem: 'login_google',
  });

  return `/cadastro?${queryCadastro.toString()}`;
}

function extrairPayloadDaURL() {
  const params = new URLSearchParams(window.location.search);
  const erro = params.get('erro');
  const email = params.get('email');
  const data = params.get('data');

  if (erro) {
    return { erro, email };
  }

  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch (_) {
    try {
      return JSON.parse(decodeURIComponent(data));
    } catch {
      return null;
    }
  }
}

export default {
  name: 'GoogleCallback',
  data() {
    return {
      mensagem: 'Processando login com Google...',
    };
  },
  async mounted() {
    const payload = extrairPayloadDaURL();

    if (!payload) {
      this.mensagem = 'Nao foi possivel concluir o login. Redirecionando...';
      setTimeout(() => router.replace({ name: 'Home' }), 1500);
      return;
    }

    if (payload?.erro === 'usuario_nao_cadastrado' && window.opener && !window.opener.closed) {
      const targetOrigin = window.location.origin || ORIGEM_PADRAO_FRONTEND;
      const destinoCadastro = montarDestinoCadastro(payload.email);

      try {
        window.opener.location.replace(`${targetOrigin}${destinoCadastro}`);
      } catch (_) {
        window.opener.postMessage({ redirecionarPara: destinoCadastro }, targetOrigin);
      }

      window.close();
      return;
    }

    if (window.opener && !window.opener.closed) {
      const targetOrigin = window.location.origin || ORIGEM_PADRAO_FRONTEND;
      window.opener.postMessage(payload, targetOrigin);
      window.close();
      return;
    }

    if (payload.erro === 'usuario_nao_cadastrado') {
      window.location.replace(montarDestinoCadastro(payload.email));
      return;
    }

    if (payload.erro === 'codigo_google_invalido') {
      this.mensagem = 'Codigo de autenticacao expirado. Tente novamente.';
      setTimeout(() => router.replace({ name: 'Home' }), 1500);
      return;
    }

    if (payload.token && payload.usuario) {
      const authStore = useAuthStore();
      authStore.setAuthData(payload.usuario, payload.token);
      localStorage.removeItem(QUADRA_PLAY_LOGIN_KEY);
      await router.replace(montarDestinoPosLogin(payload.usuario));
      return;
    }

    this.mensagem = 'Nao foi possivel concluir o login com Google. Redirecionando...';
    setTimeout(() => router.replace({ name: 'Home' }), 1500);
  },
};
</script>

<style scoped>
.google-callback {
  padding: 16px;
}
</style>
