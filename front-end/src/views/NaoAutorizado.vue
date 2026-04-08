<template>
    <div class="not-authorized">
        <div class="content">
            <div class="header">
                Acesso Negado!
            </div>
            <div class="body">
                <p>
                    Você não tem permissão para acessar esta página.
                </p>
                <div class="botoes">
                    <button class="login" @click="loginComGoogle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                            class="bi bi-check-circle" viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                            <path
                                d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
                        </svg>
                        <span>Login com o Google</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import router from '@/router';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/store';
import api from '@/axios';

const QUADRA_PLAY_LOGIN_KEY = 'quadraPlayLoginAtivo'

export default {
    name: 'NaoAutorizado',
    methods: {
        loginComGoogle() {
            const width = 500, height = 600
            const left = window.screenX + (window.outerWidth - width) / 2
            const top = window.screenY + (window.outerHeight - height) / 2.5
            const backendBaseUrl = String(api?.defaults?.baseURL || 'https://quadra-livre-backend.onrender.com')
                .trim()
                .replace(/\/+$/, '')

            const popup = window.open(
                `${backendBaseUrl}/auth/google`,
                'Login com Google',
                `width=${width},height=${height},left=${left},top=${top}`
            )

            const listener = async event => {
                const frontendEnv = String(process.env.VUE_APP_FRONTEND_URL || '').trim()
                const vercelEnvBruto = String(process.env.VUE_APP_VERCEL_URL || process.env.VERCEL_URL || '').trim()
                const vercelEnv = vercelEnvBruto
                    ? (vercelEnvBruto.startsWith('http') ? vercelEnvBruto : `https://${vercelEnvBruto}`)
                    : ''
                const origensPermitidas = [
                    window.location.origin,
                    'https://www.quadraplaysv.com.br',
                    'https://quadraplaysv.com.br',
                    frontendEnv,
                    vercelEnv
                ]
                    .map(origem => String(origem || '').trim().replace(/\/+$/, ''))
                    .filter(Boolean)
                if (!origensPermitidas.includes(event.origin) && event.origin !== window.location.origin) return

                const { token, erro, email, usuario } = event.data

                if (erro === 'usuario_nao_cadastrado') {
                    window.removeEventListener('message', listener)
                    if (popup) popup.close()
                    const queryCadastro = new URLSearchParams({
                        email: String(email || ''),
                        origem: 'login_google'
                    })
                    window.location.href = `/cadastro?${queryCadastro.toString()}`
                    return
                }

                if (erro) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Login expirado',
                        text: 'Não foi possivel concluir o login com Google. Tente novamente.'
                    })
                    window.removeEventListener('message', listener)
                    if (popup) popup.close()
                    return
                }

                if (token && usuario) {
                    const authStore = useAuthStore()
                    authStore.setAuthData(usuario, token)
                    localStorage.removeItem(QUADRA_PLAY_LOGIN_KEY)

                    const quadraStorage = localStorage.getItem('quadraSelecionada')
                    const quadraSelecionada = quadraStorage ? JSON.parse(quadraStorage) : null
                    const redirect = Array.isArray(this.$route.query.redirect)
                        ? this.$route.query.redirect[0]
                        : this.$route.query.redirect

                    if (typeof redirect === 'string' && redirect.startsWith('/') && redirect !== '/NaoAutorizado') {
                        router.replace(redirect)
                        return
                    }

                    if ([1, 2].includes(usuario.permissaoId)) {
                        router.push({ name: 'Dashboard' })
                    } else if ([3, 4, 5].includes(usuario.permissaoId)) {
                        if (quadraSelecionada?.id) {
                            router.push({ name: 'agendar_quadra', query: { quadraId: quadraSelecionada.id } })
                            localStorage.removeItem('quadraSelecionada')
                        } else {
                            router.push({ name: 'agendar_quadra' })
                        }
                    } else {
                        router.push({ name: 'Home' })
                    }
                }

                window.removeEventListener('message', listener)
                if (popup) popup.close()
            }

            window.addEventListener('message', listener, false)
        }
    }
}
</script>

<style scoped>
.not-authorized {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #3B82F6;
    background-blend-mode: multiply;
    background-image: url("../assets/backgroundLogin.png");
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    padding: 20px;
    box-sizing: border-box;
}

.content {
    background-color: rgba(11, 19, 43, 0.95);
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
    text-align: center;
    max-width: 450px;
    width: 100%;
    overflow: hidden;
    border: 1px solid #152147;
}

.header {
    background-color: #152147;
    width: 100%;
    padding: 25px 0;
    color: white;
    font-size: 36px;
    font-weight: 700;
}

.body {
    padding: 35px 40px;
}

p {
    font-size: 18px;
    color: #E5E7EB;
    margin-bottom: 30px;
    line-height: 1.5;
}

button {
    background-color: #1E3A8A;
    color: white;
    border: none;
    padding: 14px 24px;
    font-size: 16px;
    font-weight: bold;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

button:hover {
    background-color: #3B5ACF;
}

button:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

@media (max-width: 768px) {
    .content {
        max-width: 90%;
    }

    .header {
        font-size: 24px;
        padding: 20px 0;
    }

    .body {
        padding: 25px 20px;
    }

    p {
        font-size: 16px;
    }

    button {
        padding: 12px 20px;
        font-size: 15px;
    }
}
</style>
