<template>
  <div class="cadastro">
    <div class="form-container">
      <form class="form-menu" @submit.prevent="cadastrarUsuario">
        <div class="form-header">
          <div class="header-brand">
            <img :src="logoQuadraPlay" alt="Quadra Play" class="header-logo" />
            <label class="header-title">QUADRA PLAY | CADASTRE-SE</label>
          </div>
        </div>

        <div class="title-container">
          <p class="form-subtitle">{{ subtituloCadastro }}</p>
        </div>

        <div class="form-body">
          <div class="input-group">
            <label>Nome</label>
            <div class="input-shell has-leading-icon">
              <svg viewBox="0 0 16 16" aria-hidden="true" class="input-icon icon-fill">
                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
              </svg>
              <input v-model.trim="form.nome" type="text" placeholder="Digite seu nome" required />
            </div>
          </div>

          <div class="input-group">
            <label>Telefone</label>
            <div class="input-shell has-leading-icon">
              <svg viewBox="0 0 16 16" aria-hidden="true" class="input-icon icon-fill">
                <path
                  d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z"
                />
              </svg>
              <input
                v-model="form.telefone"
                type="tel"
                placeholder="Digite seu telefone"
                autocomplete="tel"
                required
                @input="formatarTelefone"
              />
            </div>
          </div>

          <div class="input-group">
            <label>Foto</label>
            <input
              id="imagem"
              ref="inputImagem"
              type="file"
              class="input-file-hidden"
              accept=".jpg, .jpeg, .png"
              @change="handleFileChange"
            />

            <div class="foto-upload-card">
              <button type="button" class="foto-upload-trigger" @click="abrirSeletorImagem">
                <span class="foto-preview" :class="{ 'tem-preview': !!previewImagemUrl }">
                  <img v-if="previewImagemUrl" :src="previewImagemUrl" alt="Pré-visualização da foto" />
                  <svg v-else viewBox="0 0 16 16" aria-hidden="true">
                    <path
                      d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1z"
                    />
                    <path
                      d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4z"
                    />
                    <path
                      d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0"
                    />
                  </svg>
                </span>

                <span class="foto-upload-action">
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M8 3v10" />
                    <path d="M3 8h10" />
                  </svg>
                  <span>{{ textoBotaoFoto }}</span>
                </span>
              </button>
            </div>

            <small class="descricao-foto">
              Esta foto será utilizada na listagem da artilharia e na escalação das partidas.
            </small>
          </div>

          <button type="submit" class="cadastro-button" :disabled="!cadastroPodeSerEnviado || salvandoCadastro">
            <span class="cadastro-button-content">
              <span v-if="salvandoCadastro" class="cadastro-button-spinner" aria-hidden="true"></span>
              <svg v-else viewBox="0 0 16 16" aria-hidden="true" class="cadastro-button-icon">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
              </svg>
              <span>{{ salvandoCadastro ? 'Realizando cadastro...' : 'Realizar Cadastro' }}</span>
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2';
import api from '@/axios';
import { useAuthStore } from '@/store';
import imagem_padrao from '@/assets/imagem_padrao_usuario.png';
import logoQuadraPlay from '@/assets/logo.png';

const REGEX_EMAIL_BASICO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  data() {
    return {
      logoQuadraPlay,
      form: {
        nome: '',
        email: '',
        telefone: '',
        imagem: null,
      },
      previewImagemUrl: '',
      exibirMensagemConclusaoConta: false,
      deveAutenticarPosCadastro: false,
      salvandoCadastro: false,
    };
  },
  computed: {
    subtituloCadastro() {
      if (this.exibirMensagemConclusaoConta) {
        return 'Falta só mais um passo para concluir sua conta.';
      }

      return 'Preencha seus dados para começar a usar a plataforma.';
    },
    cadastroPodeSerEnviado() {
      const nomeValido = String(this.form.nome || '').trim().length > 0;
      const email = String(this.form.email || '').trim();
      const emailValido = REGEX_EMAIL_BASICO.test(email);
      const telefoneValido = String(this.form.telefone || '').trim().length >= 14;

      return nomeValido && emailValido && telefoneValido;
    },
    textoBotaoFoto() {
      return this.form.imagem ? 'Trocar Foto' : 'Adicionar Foto';
    },
  },
  mounted() {
    const emailFromQuery = this.$route.query.email;
    this.deveAutenticarPosCadastro = String(this.$route.query.origem || '') === 'login_google';
    this.exibirMensagemConclusaoConta =
      this.deveAutenticarPosCadastro ||
      String(this.$route.query.etapa || '').trim() === 'concluir_conta';

    if (emailFromQuery) {
      this.form.email = emailFromQuery;
      localStorage.setItem('emailCadastro', emailFromQuery);
    } else {
      const emailSalvo = localStorage.getItem('emailCadastro');
      if (emailSalvo) {
        this.form.email = emailSalvo;
      }
    }
  },
  beforeUnmount() {
    this.limparPreviewImagem();
  },
  methods: {
    limparPreviewImagem() {
      if (this.previewImagemUrl) {
        URL.revokeObjectURL(this.previewImagemUrl);
        this.previewImagemUrl = '';
      }
    },
    limparFormularioCadastro() {
      this.limparPreviewImagem();
      this.form = {
        nome: '',
        email: '',
        telefone: '',
        imagem: null,
      };

      if (this.$refs.inputImagem) {
        this.$refs.inputImagem.value = null;
      }

      localStorage.removeItem('emailCadastro');
    },
    persistirEmailCadastro() {
      const email = String(this.form.email || '').trim();

      if (email) {
        localStorage.setItem('emailCadastro', email);
        return;
      }

      localStorage.removeItem('emailCadastro');
    },
    abrirSeletorImagem() {
      if (this.$refs.inputImagem) {
        this.$refs.inputImagem.click();
      }
    },
    obterQuadraSelecionada() {
      try {
        const quadraStorage = localStorage.getItem('quadraSelecionada');
        return quadraStorage ? JSON.parse(quadraStorage) : null;
      } catch (error) {
        return null;
      }
    },
    redirecionarPosLogin(usuario) {
      const permissaoId = Number(usuario?.permissaoId);
      const quadraSelecionada = this.obterQuadraSelecionada();

      if ([1, 2].includes(permissaoId)) {
        this.$router.push({ name: 'Dashboard' });
        return;
      }

      if ([3, 4, 5].includes(permissaoId)) {
        if (quadraSelecionada?.id) {
          this.$router.push({ name: 'agendar_quadra', query: { quadraId: quadraSelecionada.id } });
          localStorage.removeItem('quadraSelecionada');
        } else {
          this.$router.push({ name: 'agendar_quadra' });
        }
        return;
      }

      this.$router.push('/');
    },
    async cadastrarUsuario() {
      if (this.salvandoCadastro || !this.cadastroPodeSerEnviado) {
        return;
      }

      this.salvandoCadastro = true;

      try {

        let urlImagem = null;

        if (this.form.imagem) {
          const formData = new FormData();
          formData.append('file', this.form.imagem);

          const uploadResponse = await api.post('/upload', formData);
          urlImagem = uploadResponse.data.fileUrl;
        } else {
          urlImagem = imagem_padrao;
        }

        const { data } = await api.post('/cadastrar/usuario', {
          nome: this.form.nome,
          email: this.form.email,
          telefone: this.form.telefone,
          foto: urlImagem,
        });

        const usuarioCriado = data?.usuario || null;
        const tokenCriado = data?.token || '';

        this.limparFormularioCadastro();

        if (this.deveAutenticarPosCadastro && usuarioCriado && tokenCriado) {
          const authStore = useAuthStore();
          authStore.setAuthData(usuarioCriado, tokenCriado);
          localStorage.removeItem('quadraPlayLoginAtivo');

          await Swal.fire({
            icon: 'success',
            title: 'Cadastro concluído!',
            text: 'Entrando automaticamente...',
            timer: 1400,
            showConfirmButton: false,
          });

          this.redirecionarPosLogin(usuarioCriado);
          return;
        }

        if (this.deveAutenticarPosCadastro) {
          await Swal.fire({
            icon: 'success',
            title: 'Cadastro concluído!',
            text: 'Redirecionando para agendar quadra...',
            timer: 1400,
            showConfirmButton: false,
          });
          this.$router.push({ name: 'agendar_quadra' });
          return;
        }
      } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);

        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: error.response?.data?.error || 'Não foi possível concluir o cadastro.',
        });

        return;
      } finally {
        this.salvandoCadastro = false;
      }

      Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: 'Usuário cadastrado com sucesso!',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        this.$router.push('/');
      });
    },
    handleFileChange(event) {
      const arquivo = event.target.files?.[0] || null;
      this.limparPreviewImagem();
      this.form.imagem = arquivo;

      if (arquivo) {
        this.previewImagemUrl = URL.createObjectURL(arquivo);
      }
    },
    formatarTelefone(event) {
      let valor = event.target.value.replace(/\D/g, '');

      if (!valor) {
        this.form.telefone = '';
        return;
      }

      if (valor.length > 11) valor = valor.slice(0, 11);

      if (valor.length <= 2) {
        this.form.telefone = `(${valor}`;
      } else if (valor.length <= 6) {
        this.form.telefone = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
      } else if (valor.length <= 10) {
        this.form.telefone = `(${valor.slice(0, 2)}) ${valor.slice(2, 6)}-${valor.slice(6)}`;
      } else {
        this.form.telefone = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
      }
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');

.cadastro {
  position: relative;
  display: flex;
  width: 100%;
  max-width: 100vw;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 14px 10px;
  justify-content: center;
  align-items: center;
  overflow-x: clip;
  overflow-y: hidden;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 50% 108%, rgba(56, 189, 248, 0.26), transparent 22%),
    radial-gradient(circle at 22% 72%, rgba(96, 165, 250, 0.16), transparent 18%),
    radial-gradient(circle at 78% 72%, rgba(96, 165, 250, 0.16), transparent 18%),
    linear-gradient(180deg, #0a1230 0%, #101b46 52%, #0b1537 100%);
  font-family: 'Montserrat', sans-serif;
  color: #ffffff;
}

.cadastro::before,
.cadastro::after {
  content: '';
  position: absolute;
  inset: auto;
  width: 520px;
  height: 520px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.18), transparent 68%);
  filter: blur(8px);
  pointer-events: none;
}

.cadastro::before {
  left: -120px;
  bottom: -120px;
}

.cadastro::after {
  right: -120px;
  bottom: -120px;
}

.form-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
}

.form-menu {
  width: 100%;
  padding-bottom: 22px;
  overflow: hidden;
  min-width: 0;
  box-sizing: border-box;
  border-radius: 26px;
  border: 1px solid rgba(87, 137, 255, 0.34);
  background:
    linear-gradient(180deg, rgba(16, 29, 73, 0.96), rgba(11, 21, 56, 0.98));
  box-shadow:
    0 26px 60px rgba(2, 8, 30, 0.46),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 0 1px rgba(59, 130, 246, 0.08);
}

.form-header {
  min-height: 74px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background:
    linear-gradient(180deg, rgba(30, 64, 175, 0.36), rgba(23, 38, 93, 0.9));
  border-bottom: 1px solid rgba(96, 165, 250, 0.22);
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.04);
}

.header-brand {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.header-logo {
  width: 54px;
  height: 54px;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(37, 99, 235, 0.24));
}

.header-title {
  color: #f8fbff;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  line-height: 1.15;
}

.title-container {
  width: 100%;
  padding: 16px 24px 6px;
  text-align: center;
  min-width: 0;
  box-sizing: border-box;
}

.form-subtitle {
  margin: 0;
  color: rgba(226, 232, 240, 0.84);
  font-size: 13px;
  line-height: 1.55;
}

.form-body {
  display: flex;
  flex-direction: column;
  padding: 0 24px;
  min-width: 0;
  box-sizing: border-box;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 16px;
  min-width: 0;
}

.input-group label {
  color: #f8fafc;
  font-size: 15px;
  font-weight: 700;
}

.input-shell {
  position: relative;
  min-width: 0;
}

.input-shell input {
  width: 100%;
  min-height: 52px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid rgba(96, 165, 250, 0.54);
  background: rgba(21, 34, 79, 0.86);
  color: #ffffff;
  font: inherit;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.input-shell.has-leading-icon input {
  padding-left: 46px;
}

.input-shell input::placeholder {
  color: rgba(226, 232, 240, 0.7);
}

.input-shell input:hover {
  background: rgba(24, 38, 89, 0.92);
}

.input-shell input:focus {
  border-color: rgba(96, 165, 250, 0.9);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.16);
}

.input-shell input:-webkit-autofill,
.input-shell input:-webkit-autofill:hover,
.input-shell input:-webkit-autofill:focus,
.input-shell input:-webkit-autofill:active {
  -webkit-text-fill-color: #ffffff;
  caret-color: #ffffff;
  border: 1px solid rgba(96, 165, 250, 0.54);
  -webkit-box-shadow:
    0 0 0 1000px rgba(21, 34, 79, 0.96) inset,
    0 0 0 4px transparent;
  box-shadow:
    0 0 0 1000px rgba(21, 34, 79, 0.96) inset,
    0 0 0 4px transparent;
  transition: background-color 9999s ease-out, color 9999s ease-out;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  width: 18px;
  height: 18px;
  color: rgba(226, 232, 240, 0.86);
  transform: translateY(-50%);
  pointer-events: none;
}

.input-icon path,
.foto-preview svg path,
.foto-upload-action svg path {
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.input-icon.icon-fill path {
  fill: currentColor;
  stroke: none;
}

.input-file-hidden {
  display: none;
}

.foto-upload-card {
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(96, 165, 250, 0.22);
  background: rgba(18, 31, 75, 0.72);
  min-width: 0;
  box-sizing: border-box;
}

.foto-upload-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.foto-preview {
  width: 84px;
  height: 84px;
  flex: 0 0 84px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #bfdbfe;
  border: 1.5px dashed rgba(96, 165, 250, 0.42);
  background:
    radial-gradient(circle at 50% 30%, rgba(59, 130, 246, 0.2), rgba(29, 78, 216, 0.12));
  overflow: hidden;
}

.foto-preview.tem-preview {
  border-style: solid;
}

.foto-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.foto-preview svg {
  width: 38px;
  height: 38px;
}

.foto-upload-action {
  min-height: 42px;
  flex: 1;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(96, 165, 250, 0.45);
  background: linear-gradient(180deg, rgba(37, 66, 154, 0.88), rgba(22, 42, 103, 0.95));
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  overflow: hidden;
  box-sizing: border-box;
}

.foto-upload-action svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.foto-upload-action span:last-child {
  min-width: 0;
}

.descricao-foto {
  margin-top: 6px;
  color: rgba(191, 219, 254, 0.84);
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}

.cadastro-button {
  width: 100%;
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 4px;
  padding: 0 18px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(180deg, #3872ff 0%, #2554d9 100%);
  color: #ffffff;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.01em;
  box-shadow:
    0 14px 26px rgba(37, 84, 217, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  cursor: pointer;
  transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.cadastro-button-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.cadastro-button-icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
  flex-shrink: 0;
}

.cadastro-button-spinner {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.cadastro-button:hover:not(:disabled) {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.cadastro-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
  filter: grayscale(0.1);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 769px) {
  .cadastro {
    padding: 24px 12px;
  }

  .form-container {
    max-width: min(1280px, calc(100vw - 56px));
  }

  .form-header {
    min-height: 84px;
    padding: 0 48px;
  }

  .header-brand {
    gap: 18px;
  }

  .header-logo {
    width: 64px;
    height: 64px;
  }

  .header-title {
    font-size: 29px;
  }

  .title-container {
    padding: 18px 48px 12px;
  }

  .form-body {
    padding: 0 48px;
  }

  .foto-upload-card {
    padding: 18px;
  }
}

@media (max-width: 768px) {
  .cadastro {
    padding: 10px 8px;
    align-items: flex-start;
  }

  .form-container {
    max-width: 100%;
  }

  .form-header {
    min-height: 66px;
    padding: 0 14px;
  }

  .header-brand {
    width: 100%;
    gap: 10px;
    flex-wrap: nowrap;
  }

  .header-logo {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
  }

  .header-title {
    font-size: clamp(12px, 4.2vw, 17px);
    letter-spacing: 0;
    line-height: 1;
    white-space: nowrap;
  }

  .title-container {
    padding: 14px 18px 6px;
  }

  .form-body {
    padding: 0 18px;
  }

  .input-shell input {
    min-height: 50px;
  }

  .foto-upload-trigger {
    align-items: stretch;
    flex-direction: column;
  }

  .foto-preview {
    width: 80px;
    height: 80px;
    flex-basis: 80px;
  }

  .foto-upload-action {
    width: 100%;
  }

  .cadastro-button {
    font-size: 16px;
  }
}
</style>
