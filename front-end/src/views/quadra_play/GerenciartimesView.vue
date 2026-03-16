<template>
  <div class="layout">
    <NavBarQuadras />

    <div class="main">
      <SidebarQuadra @sidebar-toggle="sidebarCollapsed = $event" />

      <div class="conteudo" :class="{ collapsed: sidebarCollapsed }">
        <div class="header">
          <div class="header-copy">
            <div class="header-top">
              <h1 class="title">Gerenciar Times</h1>

              <button class="btn-add" @click="abrirModalAdicionarTime">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                  class="bi bi-plus-circle-fill btn-add-icon" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z" />
                </svg>
                Adicionar time
              </button>
            </div>

            <a class="page-subtitle">
              Cadastre equipes, troque a modalidade ativa e abra os detalhes para editar elenco e informações do time.
            </a>
          </div>
        </div>

        <div v-if="isLoading" class="painel-card estado-card">
          <LoadingState
            title="Carregando modalidades"
            description="Buscando categorias ativas para liberar o gerenciamento de equipes."
          />
        </div>

        <div v-else>
          <div class="painel-card modalidades-card">
            <div class="section-head">
              <div>
                <span class="section-kicker">Modalidades</span>
                <h2>Selecione a modalidade</h2>
                <a>Troque a visualização para gerenciar os times cadastrados em cada categoria.</a>
              </div>
            </div>

            <div class="abas-container">
              <div class="aba" v-for="modalidade in modalidadesDisponiveis" :key="modalidade.id"
                :class="{ ativa: modalidadeSelecionada === modalidade.id }" @click="selecionarModalidade(modalidade.id)">
                {{ formatarNomeModalidade(modalidade.nome) }}
              </div>
            </div>
          </div>
          <!-- MODAIS -->
          <AdicionarTimeModal :aberto="modalAdicionarTimeAberto" :modalidadesDisponiveis="modalidadesDisponiveis"
            @fechar="fecharModalAdicionarTime" @atualizar="carregarTimes" />

          <DetalharTimes :aberto="modalDetalharTimeAberto" :time="timeSelecionadoDetalhe"
            :modalidadeSelecionada="modalidadeSelecionada" @fechar="fecharModalDetalharTime"
            @atualizar-lista="carregarTimes" />

          <div class="painel-card times-aanel">
            <div class="section-head">
              <div>
                <span class="section-kicker">Times</span>
                <h2>{{ tituloListaTimes }}</h2>
              </div>
            </div>

            <div v-if="isLoadingTimes" class="estado-card-conteudo">
              <LoadingState
                size="compact"
                title="Carregando times"
                description="Buscando elenco, treinador e dados da modalidade selecionada."
              />
            </div>

            <div v-else-if="times && times.length" class="lista-times">
              <div v-for="time in times" :key="time.id" class="card">
                <div class="card-conteudo">
                  <div
                    class="foto foto-click"
                    :class="{ 'foto-sem-imagem': !time.foto }"
                    @click.stop="gerenciarImagemTime(time)"
                  >
                    <img :src="obterFotoTimeCard(time.foto)" :alt="time.nome" />
                  </div>

                  <div class="info">
                    <h2>{{ time.nome }}</h2>
                    <a>
                      {{ obterQtdJogadores(time) }}
                      jogador{{ obterQtdJogadores(time) === 1 ? '' : 'es' }}
                    </a>
                    <a>Treinador: {{ time.treinador || 'Não informado' }}</a>
                  </div>
                </div>

                <div class="botoes">
                  <button class="btn-editar" @click="abrirModalDetalharTime(time)">
                    <span class="btn-action-content">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="btn-action-icon" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                      </svg>
                      <span>Detalhes</span>
                    </span>
                  </button>

                  <button class="btn-detalhar" @click="removerTime(time.id)">
                    <span class="btn-action-content">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="btn-action-icon" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                      </svg>
                      <span>Remover</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="estado-vazio">
              <span>Nenhum time encontrado para esta modalidade.</span>
              <button class="btn-add btn-add-vazio" @click="abrirModalAdicionarTime">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                  class="bi bi-plus-circle-fill btn-add-icon" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z" />
                </svg>
                Adicionar time
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <input
    ref="inputTrocarImagemTime"
    type="file"
    accept=".jpg,.jpeg,.png"
    style="display: none"
    @change="handleTrocarImagemTime"
  />
</template>

<script>
import NavBarQuadras from '@/components/quadraplay/NavBarQuadras.vue';
import LoadingState from '@/components/loading/LoadingState.vue';
import SidebarQuadra from '@/components/quadraplay/SidebarQuadra.vue';
import AdicionarTimeModal from '@/components/quadraplay/times/AdicionarTimesModal.vue';
import DetalharTimes from '@/components/quadraplay/times/DetalharTimes.vue';
import Swal from 'sweetalert2';
import api from '@/axios';
import { obterFotoTime } from '@/utils/timeImagem';

export default {
  name: 'GerenciartimesView',
  components: {
    NavBarQuadras,
    LoadingState,
    SidebarQuadra,
    AdicionarTimeModal,
    DetalharTimes
  },
  data() {
    return {
      sidebarCollapsed: false,
      isLoading: true,
      modalidadesDisponiveis: [],
      modalidadeSelecionada: null,
      times: [],
      timeSelecionadoDetalhe: null,
      modalAdicionarTimeAberto: false,
      modalDetalharTimeAberto: false,
      acaoGerenciarModalidade: '',
      fotoTime: '',
      timeParaAdicionar: '',
      timeParaRemover: '',
      isLoadingTimes: false,
      timeImagemAtual: null
    };
  },
  mounted() {
    this.carregarModalidades().finally(() => { this.isLoading = false; });
  },
  computed: {
    nomeModalidadeSelecionada() {
      const modalidade = this.modalidadesDisponiveis.find(item => Number(item.id) === Number(this.modalidadeSelecionada));
      return modalidade?.nome || '';
    },
    tituloListaTimes() {
      const nome = this.formatarNomeModalidade(this.nomeModalidadeSelecionada || 'modalidade');
      return `Times de ${nome}`;
    },
  },
  watch: {
    modalidadeSelecionada() {
      this.carregarTimes();
    }
  },
  methods: {
    abrirModalAdicionarTime() { this.modalAdicionarTimeAberto = true; this.timeParaAdicionar = ''; this.fotoTime = ''; },
    fecharModalAdicionarTime() { this.modalAdicionarTimeAberto = false; this.timeParaAdicionar = ''; this.fotoTime = ''; },

    abrirModalRemoverTime() { this.modalRemoverTimeAberto = true; this.carregarTimes(); this.timeParaRemover = ''; },
    fecharModalRemoverTime() { this.modalRemoverTimeAberto = false; this.timeParaRemover = ''; },

    abrirModalRemoverTimeComId(id) { this.timeParaRemover = id; this.modalRemoverTimeAberto = true; },

    abrirModalDetalharTime(time) {
      this.timeSelecionadoDetalhe = time;
      this.modalDetalharTimeAberto = true;
    },
    fecharModalDetalharTime() {
      this.modalDetalharTimeAberto = false;
      this.timeSelecionadoDetalhe = null;
    },

    editarTime(time) {
      Swal.fire('Editar', `Abrir modal de editar para: ${time.nome}`, 'info');
    },
    formatarNomeModalidade(nome) {
      const texto = String(nome || '').trim();
      if (!texto) return '';
      return texto.charAt(0).toUpperCase() + texto.slice(1);
    },
    obterIniciaisTime(nome) {
      const aartes = String(nome || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

      return aartes.map(parte => parte.charAt(0).toUpperCase()).join('') || '--';
    },
    obterFotoTimeCard(foto) {
      return obterFotoTime(foto);
    },
    selecionarModalidade(id) {
      if (this.modalidadeSelecionada === id) return;
      this.modalidadeSelecionada = id;
    },
    gerenciarImagemTime(time) {
      Swal.fire({
        title: 'Imagem do time',
        text: 'O que voce deseja fazer?',
        icon: 'question',
        showDenyButton: true,
        confirmButtonText: 'Trocar imagem',
        denyButtonText: 'Ver imagem',
        cancelButtonText: 'Cancelar',
        showCancelButton: true
      }).then(result => {
        if (result.isConfirmed) {
          this.timeImagemAtual = time;
          this.$refs.inputTrocarImagemTime.click();
        }

        if (result.isDenied) {
          Swal.fire({
            imageUrl: this.obterFotoTimeCard(time.foto),
            imageAlt: time.nome,
            showConfirmButton: false,
            width: 400
          });
        }
      });
    },
    async handleTrocarImagemTime(event) {
      const file = event.target.files[0];
      if (!file || !this.timeImagemAtual) return;

      try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const fotoUrl = uploadRes.data.fileUrl || uploadRes.data.url;
        await api.put('/time/alterar/foto', {
          timeId: this.timeImagemAtual.id,
          foto: fotoUrl
        });

        const timeLista = this.times.find(t => Number(t.id) === Number(this.timeImagemAtual.id));
        if (timeLista) timeLista.foto = fotoUrl;
        if (this.timeSelecionadoDetalhe && Number(this.timeSelecionadoDetalhe.id) === Number(this.timeImagemAtual.id)) {
          this.timeSelecionadoDetalhe.foto = fotoUrl;
        }

        Swal.fire('Sucesso', 'Imagem do time alterada com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        Swal.fire('Erro', 'Não foi possível alterar a imagem do time.', 'error');
      } finally {
        event.target.value = '';
        this.timeImagemAtual = null;
      }
    },

    async carregarModalidades() {
      try {
        const res = await api.get('/listar/modalidade');
        this.modalidadesDisponiveis = res.data;

        if (this.modalidadesDisponiveis.length) {
          this.modalidadeSelecionada = this.modalidadesDisponiveis[0].id;
          this.carregarTimes();
        }
      } catch (error) {
        Swal.fire('Erro', 'Não foi possível carregar as modalidades.', 'error');
      }
    },

    async carregarTimes() {
      if (!this.modalidadeSelecionada) {
        this.times = [];
        return;
      }

      this.isLoadingTimes = true;
      try {
        const res = await api.get(`/times/modalidade/${this.modalidadeSelecionada}`);
        const data = res.data;
        this.times = data.map(t => ({
          id: t.id,
          nome: t.nome,
          foto: t.foto,
          modalidadeId: t.modalidadeId,
          qtdJogadores: t._count?.jogadores,
          treinador: t.treinador?.usuario?.nome
        }));

      } catch (err) {
        Swal.fire('Erro', 'Não foi possível carregar os times.', 'error');
      } finally {
        this.isLoadingTimes = false;
      }
    },
    async removerTime(id) {
      const confirmacao = await Swal.fire({
        title: 'Tem certeza?',
        text: "Essa ação vai remover o time permanentemente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar'
      });

      if (!confirmacao.isConfirmed) {
        return;
      }
      this.isLoadingTimes = true;

      try {
        await api.delete(`/time/remover/${id}`);
        Swal.fire('Removido!', 'O time foi removido com sucesso.', 'success');
        await this.carregarTimes();
      } catch (error) {
        console.error(error);
        Swal.fire('Erro', 'Não foi possível remover o time.', 'error');
      } finally {
        this.isLoadingTimes = false;
      }
    },

    obterQtdJogadores(time) { return typeof time.qtdJogadores === 'number' ? time.qtdJogadores : 0; }
  }
};
</script>

<style scoped>
a {
  text-decoration: none;
  color: inherit;
}

.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main {
  display: flex;
  flex: 1;
}

.conteudo {
  flex: 1;
  padding: 32px;
  margin-top: 70px;
  margin-left: 250px;
  transition: margin-left 0.3s ease;
  background: #f8fafc;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.conteudo.collapsed {
  margin-left: 70px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.header-copy {
  width: 100%;
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.title {
  margin: 14px 0 10px;
  color: #2563eb;
  font-size: 40px;
  line-height: 0.98;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.page-subtitle {
  margin: 0;
  max-width: 760px;
  color: #475569;
  font-size: 17px;
  line-height: 1.6;
}

.btn-add {
  flex: 0 0 auto;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid rgba(59, 130, 246, 0.32);
  border-radius: 14px;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: -0.02em;
  white-space: nowrap;
  box-shadow: 0 14px 26px rgba(59, 130, 246, 0.22);
  transition: transform 0.15s ease, background-color 0.2s ease, box-shadow 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-add:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(59, 130, 246, 0.28);
}

.btn-add-icon {
  flex: 0 0 auto;
}

.painel-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  padding: 24px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.section-head h2 {
  margin: 6px 0 8px;
  color: #0f172a;
  font-size: 28px;
  line-height: 1.05;
}

.section-head a {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.55;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.modalidades-card {
  margin-bottom: 20px;
  padding: 20px 22px;
}

.abas-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.aba {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 10px 12px;
  border-radius: 14px;
  cursor: pointer;
  background: #f8fafc;
  color: #334155;
  font-weight: 700;
  letter-spacing: -0.1px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  transition: transform 0.15s ease, background-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.aba:hover {
  background: #eef4ff;
  transform: translateY(-1px);
  box-shadow: 0 10px 16px rgba(15, 23, 42, 0.06);
}

.aba.ativa {
  background: #3b82f6;
  color: #fff;
  border-color: rgba(59, 130, 246, 0.45);
  box-shadow: 0 14px 24px rgba(59, 130, 246, 0.22);
}

.times-aanel {
  min-width: 0;
}

.lista-times {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #fff;
  border-radius: 22px;
  padding: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.12);
}

.card-conteudo {
  display: flex;
  gap: 16px;
  align-items: center;
  min-width: 0;
}

.foto {
  flex: 0 0 80px;
  width: 80px;
  height: 80px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  border: 2px solid rgba(59, 130, 246, 0.28);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.10);
}

.foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.foto-click {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.foto-click:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.16);
}

.foto-sem-imagem {
  color: #2563eb;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.info h2 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.info a {
  margin: 0;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
}

.botoes {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.btn-editar,
.btn-detalhar {
  flex: 1;
  min-height: 44px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.btn-action-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-action-icon {
  flex: 0 0 auto;
}

.btn-editar {
  border: none;
  background: #3b82f6;
  color: #fff;
  box-shadow: 0 10px 18px rgba(59, 130, 246, 0.20);
}

.btn-editar:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(59, 130, 246, 0.28);
}

.btn-detalhar {
  background: transparent;
  border: 1px solid #e5e7eb;
  color: #64748b;
}

.btn-detalhar:hover {
  border-color: rgba(239, 68, 68, 0.45);
  color: #ef4444;
  background: rgba(239, 68, 68, 0.06);
  transform: translateY(-1px);
}

.estado-card {
  min-height: 240px;
}

.estado-card-conteudo,
.estado-vazio {
  min-height: 220px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.estado-vazio {
  color: #64748b;
  text-align: center;
  font-size: 15px;
  flex-direction: column;
  gap: 12px;
}

.btn-add-vazio {
  min-height: 38px;
  padding: 0 14px;
  box-shadow: none;
}

.loader-container-centralizado {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 180px;
}

.loader {
  border: 6px solid #f3f3f3;
  border-top: 6px solid #3b82f6;
  border-radius: 50%;
  width: 82px;
  height: 82px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .conteudo {
    margin-left: 0;
    margin-top: 34px;
    padding: 14px;
  }

  .conteudo.collapsed {
    margin-left: 0;
  }

  .header {
    margin-bottom: 12px;
  }

  .header-copy {
    max-width: 100%;
  }

  .header-top {
    gap: 10px;
  }

  .title {
    margin: 0 0 8px;
    font-size: 30px;
    line-height: 1.04;
  }

  .page-subtitle {
    font-size: 14px;
    line-height: 1.55;
  }

  .btn-add {
    min-height: 34px;
    padding: 0 12px;
    border-radius: 12px;
    font-size: 12px;
  }

  .painel-card {
    padding: 18px;
    border-radius: 24px;
  }

  .section-head {
    margin-bottom: 14px;
    flex-direction: column;
    align-items: stretch;
  }

  .section-head h2 {
    font-size: 24px;
  }

  .modalidades-card {
    padding: 14px 16px;
    margin-bottom: 16px;
  }

  .abas-container {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .aba {
    min-height: 42px;
    padding: 6px 4px;
    border-radius: 12px;
    font-size: 11px;
    line-height: 1.2;
  }

  .times-aanel {
    padding: 16px;
  }

  .lista-times {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .card-conteudo {
    align-items: flex-start;
    text-align: left;
  }

  .foto {
    flex: 0 0 68px;
    width: 68px;
    height: 68px;
  }

  .info h2 {
    font-size: 18px;
  }

  .info a {
    font-size: 13px;
  }

  .card .botoes {
    gap: 10px;
  }

  .btn-editar,
  .btn-detalhar {
    min-height: 42px;
    font-size: 12px;
  }
}
</style>




