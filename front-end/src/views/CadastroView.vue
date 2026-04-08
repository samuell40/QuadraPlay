<template>
  <div class="cadastro">
    <div class="form-container">
      <form class="form-menu" @submit.prevent="cadastrarUsuario">
        <div class="form-header">
          <label class="header-title">Quadra Play</label>
        </div>

        <div class="title-container">
          <label class="form-title">Cadastrar-se</label>
        </div>

        <div v-if="exibirMensagemConclusaoConta" class="cadastro-info-banner">
          Falta só mais um passo para concluir sua conta.
        </div>

        <div class="form-body">
          <div class="input-group">
            <label>Email</label>
            <input
              type="email"
              v-model.trim="form.email"
              placeholder="Digite seu email"
              autocomplete="email"
              required
              @input="persistirEmailCadastro"
            />
          </div>

          <div class="input-group">
            <label>Nome</label>
            <input type="text" v-model="form.nome" placeholder="Digite seu nome" required />
          </div>

          <div class="input-group">
            <label>Telefone</label>
            <input type="tel" v-model="form.telefone" placeholder="Digite seu telefone" @input="formatarTelefone"
              required />
          </div>

          <div class="input-group">
            <label>Foto</label>
            <input type="file" id="imagem" ref="inputImagem" @change="handleFileChange" accept=".jpg, .jpeg, .png">
            <small class="descricao-foto">
              Esta foto será utilizada na listagem da artilharia e na escalação das partidas.
            </small>
          </div>

          <button type="submit" class="cadastro-button">Realizar Cadastro</button>
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

export default {
  data() {
    return {
      form: {
        nome: '',
        email: '',
        telefone: '',
        imagem: null,
      },
      exibirMensagemConclusaoConta: false,
      deveAutenticarPosCadastro: false,
    };
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
  methods: {
    limparFormularioCadastro() {
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
      try {
        if (!this.form.telefone || this.form.telefone.length < 14) {
          Swal.fire({
            icon: 'warning',
            title: 'Atenção',
            text: 'Por favor, informe um número de telefone válido.',
          });
          return;
        }

        let urlImagem = null;

        if (this.form.imagem) {
          const formData = new FormData();
          formData.append('file', this.form.imagem);

          const uploadResponse = await api.post('/upload', formData);
          urlImagem = uploadResponse.data.fileUrl;
        }
        else {
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
      this.form.imagem = event.target.files[0];
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
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');

.cadastro {
  display: flex;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  height: auto;
  padding: 16px;
  box-sizing: border-box;
  justify-content: center;
  align-items: center;
  background-color: #0B132B;
  font-family: 'Montserrat', sans-serif;
  color: white;
}

.form-container {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  min-height: 100%;
  background-color: #0B132B;
  display: flex;
  justify-content: center;
  align-items: center;
}

.form-menu {
  width: 100%;
  min-height: 620px;
  max-height: calc(100vh - 32px);
  max-height: calc(100dvh - 32px);
  height: auto;
  overflow-y: auto;
  background-color: #0F1835;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.form-header {
  width: 100%;
  height: 66px;
  background-color: #152147;
  border-radius: 15px 15px 0 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}

.header-title {
  font-size: 28px;
  font-weight: bold;
}

.form-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 0 5% 20px;
  box-sizing: border-box;
}

.title-container {
  width: 90%;
  display: flex;
  justify-content: flex-start;
  padding-left: 5%;
  box-sizing: border-box;
  margin-top: -20px;
}

.form-title {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
}

.cadastro-info-banner {
  width: 90%;
  margin: 0 auto 1.4rem;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.14);
  border: 1px solid rgba(96, 165, 250, 0.3);
  color: #dbeafe;
  font-size: 14px;
  line-height: 1.5;
  box-sizing: border-box;
}

.input-group {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 2rem;
}

.input-group label {
  font-weight: bold;
  margin-bottom: 5px;
  box-sizing: border-box;
}

.input-group input {
  background-color: #0F1835;
  padding: 10px;
  border-radius: 5px !important;
  border: 1px solid #3B82F6;
  color: white;
  width: 100%;
  box-sizing: border-box;
}

.input-group input:hover {
  background-color: #172144;
}

.input-group input::placeholder {
  color: white;
  opacity: 1;
}

.input-group input[type="file"] {
  text-align: right;
  width: 100%;
  box-sizing: border-box;
}

.cadastro-button {
  background-color: #1E3A8A;
  padding: 10px;
  width: 100%;
  color: white;
  font-weight: bold;
  border: 0;
  border-radius: 5px;
  margin-bottom: 1rem;
}

.cadastro-button:hover {
  background-color: #2C4FAA;
}

.descricao-foto {
  font-size: 12px;
  color: #93C5FD;
  margin-top: 6px;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .cadastro {
    padding: 10px;
    align-items: flex-start;
  }

  .form-container {
    max-width: none;
    min-height: auto;
  }

  .form-menu {
    min-height: calc(100vh - 20px);
    min-height: calc(100dvh - 20px);
    max-height: none;
    border-radius: 12px;
  }

  .form-header {
    height: 58px;
    margin-bottom: 1.2rem;
    border-radius: 12px 12px 0 0;
  }

  .header-title {
    font-size: 22px;
  }

  .title-container {
    width: 100%;
    padding-left: 0;
    padding-inline: 5%;
    margin-top: 0;
    margin-bottom: 0.8rem;
  }

  .form-title {
    font-size: 24px;
  }

  .form-body {
    padding: 0 5% 16px;
  }

  .input-group {
    margin-bottom: 1rem;
  }

  .input-group input {
    font-size: 16px;
  }
}
</style>
