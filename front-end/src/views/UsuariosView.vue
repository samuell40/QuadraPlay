<template>
  <div class="layout">
    <SideBar />
    <div class="conteudo">
      <NavBarUse class="page-nav" />

      <section class="page-header">
        <div class="header-copy">
          <h1 class="title">Gestão de usuários</h1>
        </div>
      </section>

      <section class="controls-panel">
        <div class="panel-head">
          <div class="panel-copy">
            <p class="section-kicker">BUSCA</p>
            <h2 class="section-title">{{ tituloBuscaUsuarios }}</h2>
            <p class="section-subtitle">
              Filtre por nome e acesse rapidamente detalhes, contatos e configurações de acesso.
            </p>
          </div>

          <span class="panel-pill">{{ resumoPainelUsuarios }}</span>
        </div>

        <label class="search-shell" for="busca-usuarios">
          <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input id="busca-usuarios" type="text" :placeholder="placeholderBuscaUsuarios" v-model="busca"
            class="search-input" :disabled="isLoading" />
        </label>
      </section>

      <section class="users-panel">
        <div class="panel-head">
          <div class="panel-copy">
            <p class="section-kicker">USUÁRIOS</p>
          </div>
        </div>

        <div class="abas-config-container user-tabs">
          <button
            v-for="aba in abasUsuarios"
            :key="aba.id"
            type="button"
            class="aba-config"
            :class="{ ativa: abaUsuariosAtiva === aba.id }"
            @click="abaUsuariosAtiva = aba.id"
          >
            {{ aba.label }}
          </button>
        </div>

        <div v-if="isLoading" class="state-card state-card-loading">
          <LoadingState
            title="Carregando usuários"
            description="Buscando os perfis disponíveis para gerenciamento e filtragem."
          />
        </div>

        <div v-else-if="usuariosFiltrados.length > 0" class="usuarios">
          <article class="card" v-for="usuario in usuariosFiltrados" :key="usuario.id">
            <div class="card-conteudo">
              <div class="card-profile">
                <div class="foto">
                  <img :src="usuario.foto" alt="Foto do usuário" />
                </div>

                <div class="info">
                  <div class="identity-block">
                    <div class="info-header">
                      <h2>{{ usuario.nome }}</h2>
                    </div>
                  </div>

                  <div class="contact-list">
                    <div class="detalhe-contato">
                      <span>{{ usuario.email || 'E-mail não informado' }}</span>
                      <button v-if="usuario.email" type="button" class="contact-action contact-action-mail"
                        @click="contatoGmail(usuario)" aria-label="Abrir e-mail do usuário">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                          <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" />
                          <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z" />
                          <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
                          <path fill="#c62828"
                            d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z" />
                          <path fill="#fbc02d"
                            d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0C43.076,8,45,9.924,45,12.298z" />
                        </svg>
                      </button>
                    </div>

                    <div class="detalhe-contato">
                      <span>{{ usuario.telefone || 'Telefone não informado' }}</span>
                      <button v-if="usuario.telefone" type="button" class="contact-action contact-action-wa"
                        @click="contatoWhatsApp(usuario)" aria-label="Abrir WhatsApp do usuário">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#25D366" viewBox="0 0 16 16">
                          <path
                            d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="botoes">
                <button class="btn-editar" @click="editarUsuario(usuario)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="btn-action-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <path
                      d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m.256 7a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1zm3.63-4.54c.18-.613 1.048-.613 1.229 0l.043.148a.64.64 0 0 0 .921.382l.136-.074c.561-.306 1.175.308.87.869l-.075.136a.64.64 0 0 0 .382.92l.149.045c.612.18.612 1.048 0 1.229l-.15.043a.64.64 0 0 0-.38.921l.074.136c.305.561-.309 1.175-.87.87l-.136-.075a.64.64 0 0 0-.92.382l-.045.149c-.18.612-1.048.612-1.229 0l-.043-.15a.64.64 0 0 0-.921-.38l-.136.074c-.561.305-1.175-.309-.87-.87l.075-.136a.64.64 0 0 0-.382-.92l-.148-.045c-.613-.18-.613-1.048 0-1.229l.148-.043a.64.64 0 0 0 .382-.921l-.074-.136c-.306-.561.308-1.175.869-.87l.136.075a.64.64 0 0 0 .92-.382zM14 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0" />
                  </svg>
                  <span class="btn-action-label btn-action-label-desktop">
                    {{ permissaoLogadoId === 2 ? 'Gerenciar usuário' : 'Alterar permissões' }}
                  </span>
                  <span class="btn-action-label btn-action-label-mobile">
                    {{ permissaoLogadoId === 2 ? 'Gerenciar' : 'Permissões' }}
                  </span>
                </button>

                <button class="btn-detalhar" @click="detalhesUsuario(usuario)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="btn-action-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                    <path
                      d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                  </svg>
                  <span class="btn-action-label">Detalhar</span>
                </button>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="state-card state-card-empty">
          <p class="state-title">Nenhum usuário encontrado.</p>
          <p class="state-copy">Tente outro termo de busca para localizar um perfil desta visão.</p>
        </div>
      </section>
    </div>

    <!-- Modal de detalhar -->
    <div v-if="mostrarDetalhes" class="modal-overlay " @click.self="fecharDetalhes">
      <div class="modal-content modal-detalhes-user">
        <div class="modal-user-header">
          <div class="header-left">
            <h2 class="modal-title">Detalhes do Usuário</h2>
          </div>

          <button class="btn-close-x btn-close-x-user" @click="fecharDetalhes" aria-label="Fechar detalhes">
            x
          </button>
        </div>

        <div class="modal-detalhes-body">
          <div class="user-top-grid">
            <div class="user-profile">
              <div class="avatar-wrap">
                <img class="avatar-lg" :src="usuarioSelecionado.foto" />
              </div>

              <div class="user-identity">
                <div class="user-name">{{ usuarioSelecionado.nome }}</div>
                <div class="badge-permissao">
                  <span>{{ permissaoSelecionadaLabel }}</span>
                </div>
              </div>
            </div>

            <div class="info-card contato-card">
              <div class="card-title">Contato</div>

              <div class="info-row">
                <div class="info-label">E-mail</div>
                <div class="info-value info-actions">
                  <span class="text-clip">{{ usuarioSelecionado.email || 'Não informado' }}</span>

                  <button v-if="usuarioSelecionado.email" class="icon-btn" @click="contatoGmail(usuarioSelecionado)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" />
                      <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z" />
                      <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
                      <path fill="#c62828"
                        d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z" />
                      <path fill="#fbc02d"
                        d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0C43.076,8,45,9.924,45,12.298z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="info-row">
                <div class="info-label">Telefone</div>
                <div class="info-value info-actions">
                  <span class="text-clip">{{ usuarioSelecionado.telefone || 'Não informado' }}</span>

                  <button v-if="usuarioSelecionado.telefone" class="icon-btn icon-btn-wa"
                    @click="contatoWhatsApp(usuarioSelecionado)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#25D366" viewBox="0 0 16 16">
                      <path
                        d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="user-grid">

            <div class="info-card perfil-card">
              <div class="card-title">Perfil</div>

              <div class="perfil-highlight">
                <div class="perfil-highlight-title">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="shield-icon">
                    <path d="M12 2.75l7 3.1v5.1c0 4.06-2.45 7.86-7 10.3-4.55-2.44-7-6.24-7-10.3v-5.1l7-3.1z"
                      stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
                    <path d="M9.4 12.3l1.7 1.7 3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round" />
                  </svg>
                  <span>Perfil</span>
                </div>

                <div class="perfil-cadastro">
                  Cadastrado desde: <strong>{{ dataCadastroSelecionado }}</strong>
                </div>
              </div>

              <div class="info-row" v-if="usuarioSelecionado.permissaoId === 2">
                <div class="info-label">Quadra</div>
                <div class="info-value">{{ usuarioSelecionado.quadra?.nome || 'Não vinculada' }}</div>
              </div>

              <div class="info-row" v-if="usuarioSelecionado.permissaoId === 5">
                <div class="info-label">Times (Treinador)</div>
                <div class="info-value">{{ usuarioSelecionado.timesComoTreinador?.map(t => t.nome).join(', ') || 'Nenhum' }}</div>
              </div>

              <div class="info-row" v-if="usuarioSelecionado.permissaoId === 3">
                <div class="info-label">Times</div>
                <div class="info-value">{{ usuarioSelecionado.times?.map(t => t.nome).join(', ') || 'Nenhum' }}</div>
              </div>

              <div class="info-row" v-if="usuarioSelecionado.permissaoId === 3 && usuarioSelecionado.jogador">
                <div class="info-label">Jogador</div>
                <div class="info-value">{{ usuarioSelecionado.jogador.nome }}</div>
              </div>
            </div>

            <div class="info-card stats-card">
              <div class="card-title">Estatísticas</div>

              <div class="stats-inline">
                <div class="stat">
                  <span class="stat-label">Agendamentos no mês de {{ nomeMesAtual }}:</span>
                  <span class="stat-value">{{ agendamentosNoMesSelecionado }}</span>
                </div>

                <div class="stat">
                  <span class="stat-label">Última atividade:</span>
                  <span class="stat-text">{{ ultimaAtividadeSelecionado }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button class="btn-fechar-premium" @click="fecharDetalhes">
          Fechar
        </button>
      </div>
    </div>
    <div v-if="mostrarEditar" class="modal-overlay">
      <div class="modal-content modal-content-edicao">
        <div class="modal-header-edicao">
          <h2>Alterar Permissões</h2>
          <button type="button" class="btn-close-x" @click="fecharEditar" :disabled="isSalvando"
            aria-label="Fechar modal">
            x
          </button>
        </div>

        <div v-if="isCarregandoModal" class="loader-wrapper">
          <LoadingState
            size="compact"
            title="Carregando permissões"
            description="Preparando os dados do usuário para edição de acesso."
          />
        </div>

        <div v-else>
          <div class="abas-container">
            <div class="aba" v-for="p in permissoesFiltradas" :key="p.id" :class="{ ativa: form.permissaoId === p.id }"
              @click="form.permissaoId = p.id">
              {{ p.id === 3 ? 'Vincular a um Time' : p.descricao }}
            </div>
          </div>

          <!-- DESENVOLVEDOR -> ADMIN -->
          <div class="campo" v-if="form.permissaoId === 2 && permissaoLogadoId === 1">
            <strong>Quadra:</strong>
            <select v-model.number="form.quadra">
              <option disabled value="">Selecione uma quadra</option>
              <option v-for="q in quadras" :key="q.id" :value="q.id">
                {{ q.nome }}
              </option>
            </select>
          </div>

          <!-- USUARIO -->
          <div class="campo" v-if="form.permissaoId === 3 || form.permissaoId === 5">
            <strong>Time:</strong>
            <select v-model.number="form.timeId" @change="carregarJogadoresTime">
              <option disabled value="">Selecione o time</option>
              <option v-for="t in times" :key="t.id" :value="t.id">
                {{ t.nome }}
              </option>
            </select>
          </div>

          <div class="campo" v-if="form.permissaoId === 3">
            <strong>Jogador (opcional):</strong>

            <div class="dropdown-custom" ref="dropdownJogador">
              <div class="dropdown-selected" @click="abrirDropdown = !abrirDropdown">
                <img v-if="jogadorSelecionadoObj?.foto" :src="jogadorSelecionadoObj.foto" class="avatar" />
                <span :class="{ 'dropdown-placeholder': !jogadorSelecionadoObj }">
                  {{ jogadorSelecionadoObj?.nome || 'Selecione o jogador' }}
                </span>
              </div>

              <div v-if="abrirDropdown" class="dropdown-list">
                <input type="text" v-model="buscaJogador" placeholder="Buscar jogador..." class="input-busca-jogador"
                  @click.stop />

                <ul>
                  <li v-for="j in jogadoresFiltrados" :key="j.id" @click.stop="selecionarJogador(j)">
                    <img :src="j.foto" class="avatar" />
                    <span>{{ j.nome }}</span>
                  </li>

                  <li v-if="isLoadingJogadores" class="sem-jogador">
                    Carregando jogadores...
                  </li>
                  <li v-else-if="jogadoresFiltrados.length === 0" class="sem-jogador">
                    Nenhum jogador encontrado
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="botoes-edicao">
            <button class="btn-salvarEdicao" @click="salvarEdicao" :disabled="isSalvando">
              <span v-if="!isSalvando">Salvar</span>
              <span v-else class="loader-pequeno"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SideBar from '@/components/SideBar.vue'
import NavBarUse from '@/components/NavBarUser.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import api from '@/axios'
import Swal from 'sweetalert2'
import { useAuthStore } from '@/store'

export default {
  name: 'UsuariosView',
  components: { SideBar, NavBarUse, LoadingState },

  data() {
    return {
      usuarios: [],
      busca: '',
      buscaJogador: '',
      isLoading: true,
      isLoadingJogadores: false,
      isCarregandoModal: false,
      isSalvando: false,
      mostrarDetalhes: false,
      mostrarEditar: false,
      usuarioSelecionado: {},
      permissoes: [],
      quadras: [],
      times: [],
      jogadores: [],
      mostrarContato: false,
      abrirDropdown: false,
      abaUsuariosAtiva: 'usuarios',
      form: {
        email: '',
        permissaoId: null,
        quadra: '',
        timeId: '',
        jogadorId: null,
      },
    }
  },

  computed: {
    metadadosAbasUsuarios() {
      return {
        desenvolvedores: { label: 'Desenvolvedores', singular: 'desenvolvedor' },
        administradores: { label: 'Administradores', singular: 'administrador' },
        usuarios: { label: 'Usuários', singular: 'usuário' },
        treinadores: { label: 'Treinadores', singular: 'treinador' },
      }
    },

    abaUsuariosSelecionada() {
      const primeiraAbaVisivel = this.abasUsuarios[0]?.id
      return this.metadadosAbasUsuarios[this.abaUsuariosAtiva]
        || this.metadadosAbasUsuarios[primeiraAbaVisivel]
        || this.metadadosAbasUsuarios.usuarios
    },

    usuarioLogado() {
      const authStore = useAuthStore()
      return authStore.usuario || {}
    },

    permissaoLogadoId() {
      return Number(this.usuarioLogado?.permissaoId || 0)
    },

    jogadorSelecionadoObj() {
      return this.jogadores.find(j => j.id === this.form.jogadorId)
    },

    usuarioLogadoEmail() {
      return this.usuarioLogado.email
    },

    abasUsuarios() {
      const ordemAbas = ['usuarios', 'desenvolvedores', 'administradores', 'treinadores']
      const permissaoLogado = this.permissaoLogadoId

      let abasVisiveis = ordemAbas
      if (permissaoLogado === 1) {
        abasVisiveis = ordemAbas
      } else if (permissaoLogado === 2) {
        abasVisiveis = ordemAbas.filter(id => !['desenvolvedores', 'administradores'].includes(id))
      } else {
        abasVisiveis = ordemAbas.filter(id => id !== 'desenvolvedores')
      }

      return abasVisiveis.map(id => ({
        id,
        label: this.metadadosAbasUsuarios[id].label,
      }))
    },

    usuariosBaseFiltrados() {
      return this.usuarios
        .filter(u =>
          u.nome.toLowerCase().includes(this.busca.toLowerCase())
        )
        .filter(u => u.email !== this.usuarioLogadoEmail)
        .filter(u => {
          if (this.permissaoLogadoId === 2) {
            return [3, 4, 5].includes(Number(u.permissaoId))
          }
          return true
        })
    },

    usuariosFiltrados() {
      const mapaAbas = {
        usuarios: [3, 4],
        treinadores: [5],
        administradores: [2],
        desenvolvedores: [1],
      }

      const permissoesDaAba = mapaAbas[this.abaUsuariosAtiva] || []
      return this.usuariosBaseFiltrados.filter(u => permissoesDaAba.includes(Number(u.permissaoId)))
    },

    totalUsuariosVisiveis() {
      return this.usuariosBaseFiltrados.length
    },

    totalUsuariosComContato() {
      return this.usuariosBaseFiltrados.filter(u => Boolean(u.email || u.telefone)).length
    },

    totalPerfisOperacionais() {
      return this.usuariosBaseFiltrados.filter(u => [2, 3, 4, 5].includes(Number(u.permissaoId))).length
    },

    tituloBuscaUsuarios() {
      return `Encontrar ${this.abaUsuariosSelecionada.singular}`
    },

    placeholderBuscaUsuarios() {
      return `Digite o nome do ${this.abaUsuariosSelecionada.singular}...`
    },

    resumoPainelUsuarios() {
      if (this.busca.trim()) {
        return `${this.usuariosFiltrados.length} resultado(s) em ${this.abaUsuariosSelecionada.label}`
      }

      return `${this.usuariosFiltrados.length} perfil(is) em ${this.abaUsuariosSelecionada.label}`
    },

    jogadoresDisponiveis() {
      return this.jogadores.filter(j =>
        !j.vinculado || j.id === this.form.jogadorId
      )
    },

    permissoesFiltradas() {
      if (this.permissaoLogadoId === 1) {
        return this.permissoes.filter(p => Number(p.id) !== 4)
      }

      if (this.permissaoLogadoId === 2) {
        return this.permissoes.filter(p =>
          [3, 5].includes(Number(p.id))
        )
      }

      return []
    },

    jogadoresFiltrados() {
      return this.jogadoresDisponiveis.filter(j =>
        j.nome.toLowerCase().includes(this.buscaJogador.toLowerCase())
      )
    },

    permissaoSelecionadaLabel() {
      return String(this.usuarioSelecionado?.permissao?.descricao || 'Sem permissão').toUpperCase()
    },

    dataCadastroSelecionado() {
      const valor =
        this.usuarioSelecionado?.dataCadastro ||
        this.usuarioSelecionado?.createdAt ||
        this.usuarioSelecionado?.criadoEm ||
        null
      return this.formatarDataExtenso(valor)
    },

    agendamentosNoMesSelecionado() {
      return Number(this.usuarioSelecionado?.agendamentosNoMes || 0)
    },

    nomeMesAtual() {
      const nomeMes = new Date().toLocaleDateString('pt-BR', { month: 'long' })
      return nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)
    },

    ultimaAtividadeSelecionado() {
      return this.formatarDataHora(this.usuarioSelecionado?.ultimaAtividade)
    },
  },

  watch: {
    abasUsuarios: {
      immediate: true,
      handler(abas) {
        if (!abas.length) return

        if (!abas.some(aba => aba.id === this.abaUsuariosAtiva)) {
          this.abaUsuariosAtiva = abas[0].id
        }
      },
    },
  },

  mounted() {
    this.carregarUsuarios()
    document.addEventListener('click', this.fecharModal)

  },

  methods: {
    fecharModal(event) {
      const dropdown = this.$refs.dropdownJogador
      if (dropdown && !dropdown.contains(event.target)) {
        this.abrirDropdown = false
      }
    },

    detalhesUsuario(usuario) {
      this.usuarioSelecionado = usuario
      this.mostrarDetalhes = true
    },

    selecionarJogador(jogador) {
      this.form.jogadorId = jogador.id
      this.buscaJogador = ''
      this.abrirDropdown = false
    },

    fecharDetalhes() {
      this.mostrarDetalhes = false
    },

    formatarDataHora(data) {
      if (!data) return 'Sem atividade'

      const dataObj = new Date(data)
      if (Number.isNaN(dataObj.getTime())) return 'Sem atividade'

      return dataObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    },

    formatarDataExtenso(data) {
      if (!data) return 'Não informado'

      const dataObj = new Date(data)
      if (Number.isNaN(dataObj.getTime())) return 'Não informado'

      const base = dataObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })

      return base.replace(/ de ([^ ]+)/, (_, mes) => ` de ${mes.charAt(0).toUpperCase()}${mes.slice(1)}`)
    },

    async listarPermissoes() {
      const resPerm = await api.get('/permissoes')
      this.permissoes = resPerm.data
    },

    async listarQuadras() {
      const resQuadra = await api.get('/quadra')
      this.quadras = resQuadra.data
    },

    async listarTimes() {
      const resTimes = await api.get('/times')
      this.times = resTimes.data
    },

    async carregarUsuarios() {
      this.isLoading = true
      try {
        const response = await api.get('/usuarios')
        this.usuarios = response.data || []
      } catch (error) {
        console.error('Erro ao carregar usuários:', error)
        this.usuarios = []
      } finally {
        this.isLoading = false
      }
    },

    async editarUsuario(usuario) {
      this.usuarioSelecionado = usuario
      this.isCarregandoModal = true
      this.mostrarEditar = true

      try {
        await Promise.all([
          this.listarPermissoes(),
          this.listarQuadras(),
          this.listarTimes(),
        ])

        this.jogadores = []
        this.buscaJogador = ''
        this.abrirDropdown = false
        this.form.email = usuario.email
        this.form.permissaoId = Number(usuario.permissaoId)
        this.form.quadra = usuario.quadra?.id ?? ''
        this.form.timeId = usuario.times?.[0]?.id || ''
        this.form.jogadorId = null

        if (this.form.permissaoId === 5) {
          this.form.timeId = usuario.timesComoTreinador?.[0]?.id || ''
        }

        if (this.form.permissaoId === 3 && this.form.timeId) {
          await this.carregarJogadoresTime()

          if (usuario.jogador) {
            this.form.jogadorId = usuario.jogador.id
          }
        }

      } finally {
        this.isCarregandoModal = false
      }
    },

    async carregarJogadoresTime() {
      this.jogadores = []
      this.buscaJogador = ''
      this.abrirDropdown = false
      this.isLoadingJogadores = Boolean(this.form.timeId)

      if (!this.form.timeId) {
        this.form.jogadorId = null
        this.isLoadingJogadores = false
        return
      }

      try {
        const { data } = await api.get(`/time/${this.form.timeId}`)
        let jogadoresTime = data || []
        if (this.usuarioSelecionado?.jogador) {
          const existe = jogadoresTime.some(
            j => j.id === this.usuarioSelecionado.jogador.id
          )
          if (!existe) {
            jogadoresTime.unshift(this.usuarioSelecionado.jogador)
          }
          this.form.jogadorId = this.usuarioSelecionado.jogador.id
        } else if (!jogadoresTime.some(j => Number(j.id) === Number(this.form.jogadorId))) {
          this.form.jogadorId = null
        }

        this.jogadores = jogadoresTime

      } catch (err) {
        console.error('Erro ao carregar jogadores do time:', err)
        this.jogadores = []
      } finally {
        this.isLoadingJogadores = false
      }
    },

    obterDescricaoPermissao(id, fallback = '') {
      const permissaoId = Number(id)
      const permissaoEncontrada = this.permissoes.find(p => Number(p.id) === permissaoId)
      if (permissaoEncontrada?.descricao) return permissaoEncontrada.descricao
      if (fallback) return fallback

      const mapa = {
        1: 'Desenvolvedor',
        2: 'Administrador',
        3: 'Usuário',
        4: 'Mesário',
        5: 'Treinador',
      }

      return mapa[permissaoId] || 'Permissão'
    },

    async salvarEdicao() {
      this.isSalvando = true
      try {
        if (Number(this.usuarioSelecionado?.permissaoId) === 4 && Number(this.form.permissaoId) === 4) {
          await Swal.fire({
            icon: 'warning',
            title: 'Selecione outra permissão',
            text: 'Para mesário, escolha uma nova permissão antes de salvar.',
          })
          return
        }

        if (!this.form.permissaoId) {
          await Swal.fire({
            icon: 'warning',
            title: 'Atenção',
            text: 'Selecione uma permissão válida.',
          })
          return
        }

        if (this.form.permissaoId === 2 && !this.form.quadra) {
          await Swal.fire({
            icon: 'warning',
            title: 'Atenção',
            text: 'Administrador precisa estar vinculado a uma quadra.',
          })
          return
        }

        if (this.form.permissaoId === 3 && !this.form.timeId) {
          await Swal.fire({
            icon: 'warning',
            title: 'Atenção',
            text: 'Selecione um time para vincular o usuário.',
          })
          return
        }

        if (this.form.permissaoId === 5 && !this.form.timeId) {
          await Swal.fire({
            icon: 'warning',
            title: 'Atenção',
            text: 'Selecione um time para o treinador.',
          })
          return
        }

        const permissaoAtualId = Number(this.usuarioSelecionado?.permissaoId)
        const permissaoNovaId = Number(this.form.permissaoId)
        const permissaoAtualLabel = this.obterDescricaoPermissao(
          permissaoAtualId,
          this.usuarioSelecionado?.permissao?.descricao || ''
        )
        const permissaoNovaLabel = this.obterDescricaoPermissao(permissaoNovaId)
        const alterandoPermissao = permissaoAtualId !== permissaoNovaId

        const confirmacao = await Swal.fire({
          icon: 'question',
          title: alterandoPermissao ? 'Confirmar alteração de permissão?' : 'Confirmar atualização?',
          text: alterandoPermissao
            ? `Deseja alterar ${this.usuarioSelecionado?.nome || 'este usuário'} de ${permissaoAtualLabel} para ${permissaoNovaLabel}?`
            : `Deseja salvar as alterações de acesso de ${this.usuarioSelecionado?.nome || 'este usuário'}?`,
          showCancelButton: true,
          confirmButtonText: 'Sim, salvar',
          cancelButtonText: 'Voltar',
          confirmButtonColor: '#1E3A8A',
          cancelButtonColor: '#94a3b8',
          reverseButtons: true,
        })

        if (!confirmacao.isConfirmed) {
          return
        }

        await api.put('/editar/permissao/usuario', {
          email: this.form.email,
          permissaoId: this.form.permissaoId,
          quadraId: this.form.quadra,
        })

        if (this.form.permissaoId === 3 && this.form.timeId) {
          await api.post('/vincular', {
            usuarioId: this.usuarioSelecionado.id,
            timeId: this.form.timeId,
            jogadorId: this.form.jogadorId || null,
          })
        }

        if (this.form.permissaoId === 5) {
          await api.post('/vincular/treinador', {
            usuarioId: this.usuarioSelecionado.id,
            timeId: this.form.timeId,
          })
        }

        Swal.fire('Sucesso', 'Usuário atualizado com sucesso!', 'success')
        this.mostrarEditar = false
        this.carregarUsuarios()
      } catch (err) {
        console.error(err)
        Swal.fire('Erro', err.response?.data?.error || err.message, 'error')
      } finally {
        this.isSalvando = false
      }
    },

    abrirModalContato(usuario) {
      this.usuarioSelecionado = usuario
      this.mostrarContato = true
    },

    fecharModalContato() {
      this.mostrarContato = false
    },

    contatoWhatsApp(usuario) {
      if (!usuario.telefone) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção',
          text: 'Usuário não possui telefone cadastrado.',
        })
        return
      }

      const numeroLimpo = usuario.telefone.replace(/\D/g, '')
      window.open(`https://wa.me/${numeroLimpo}`, '_blank')
      this.fecharModalContato()
    },

    contatoGmail(usuario) {
      if (!usuario.email) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção',
          text: 'Usuário não possui e-mail cadastrado.',
        })
        return
      }

      window.open(
        `https://mail.google.com/mail/?view=cm&fs=1&to=${usuario.email}`,
        '_blank'
      )

      this.fecharModalContato()
    },

    fecharEditar() {
      this.mostrarEditar = false
    },
  },
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.conteudo {
  flex: 1;
  margin-left: 250px;
  padding: 20px 32px 32px;
  min-width: 0;
  overflow-x: hidden;
}

.page-nav {
  margin-bottom: 18px;
}

.page-header {
  margin-bottom: 22px;
}

.header-copy,
.panel-copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.page-kicker,
.section-kicker,
.metric-kicker {
  margin: 0;
  font-size: 12px;
  line-height: 1;
  letter-spacing: 0.16em;
  font-weight: 800;
  text-transform: uppercase;
  color: #2563eb;
}

.title {
  margin: 0;
  font-size: 42px;
  line-height: 1.04;
  font-weight: 800;
  color: #2563eb;
}

.page-subtitle,
.section-subtitle,
.metric-caption,
.state-copy {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: #64748b;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.overview-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 18px 14px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  box-shadow: 0 14px 24px rgba(15, 23, 42, 0.06);
}

.metric-value {
  margin: 0;
  font-size: 30px;
  line-height: 1;
  font-weight: 800;
  color: #0f172a;
}

.overview-card-contact .metric-value {
  color: #059669;
}

.overview-card-operational .metric-value {
  color: #d97706;
}

.controls-panel,
.users-panel {
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 14px 24px rgba(15, 23, 42, 0.06);
}

.controls-panel {
  margin-bottom: 18px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 16px;
}

.section-title {
  margin: 0;
  font-size: 20px;
  line-height: 1.15;
  font-weight: 800;
  color: #0f172a;
}

.panel-pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.abas-config-container {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
  padding: 6px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.85);
  overflow-x: auto;
}

.aba-config {
  flex: 1 0 0;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  color: #64748b;
  font-size: 16px;
  font-weight: 700;
  padding: 12px 14px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.aba-config.ativa {
  color: #1d4ed8;
  border-color: rgba(59, 130, 246, 0.18);
  background: #fff;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.06);
}

.search-shell {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 50px;
  padding: 0 14px 0 44px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #f8fafc;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.search-shell:focus-within {
  border-color: rgba(37, 99, 235, 0.45);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  background: #ffffff;
}

.search-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #334155;
  outline: none;
}

select {
  padding: 12px 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 12px;
  font-size: 14px;
  margin-top: 5px;
  background: #fff;
  color: #0f172a;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

select:hover {
  border-color: rgba(59, 130, 246, 0.55);
}

select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

.dropdown-selected {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 12px;
  background-color: #fff;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  min-height: 44px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.dropdown-placeholder {
  color: #0f172a;
  font-weight: 400;
}

.dropdown-selected:hover {
  border-color: rgba(59, 130, 246, 0.55);
}

.dropdown-selected:active {
  transform: translateY(0);
}

.input-busca-jogador {
  width: 100%;
  padding: 10px 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  outline: none;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input-busca-jogador:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16);
}

.usuarios {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, #fbfdff 0%, #ffffff 100%);
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.06);
}

.card-conteudo {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.card-profile {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.foto {
  flex: 0 0 102px;
  width: 102px;
  height: 102px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 999px;
  padding: 4px;
  background: linear-gradient(145deg, #90dcff 0%, #56b8ff 45%, #2e78f4 100%);
  box-shadow: 0 0 0 2px #ebf6ff, 0 0 0 4px rgba(86, 184, 255, 0.3), 0 6px 14px rgba(45, 116, 229, 0.24);
}

.foto img {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  border: 2px solid #d9eaff;
  background: #d7dfec;
  object-fit: cover;
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
}

.identity-block {
  min-width: 0;
  width: 100%;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.info h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.08;
  color: #0f172a;
  font-weight: 800;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  align-self: stretch;
}

.detalhe-contato {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.88) 0%, rgba(248, 250, 252, 0.96) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  width: 100%;
}

.detalhe-contato span {
  min-width: 0;
  font-size: 12px;
  color: #334155;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-action {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.contact-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
}

.contact-action-mail {
  background: rgba(59, 130, 246, 0.06);
}

.contact-action-wa {
  background: rgba(34, 197, 94, 0.08);
}

.botoes {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.btn-editar,
.btn-detalhar,
.btn-salvarEdicao {
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.btn-editar:hover,
.btn-detalhar:hover,
.btn-salvarEdicao:hover {
  transform: translateY(-1px);
}

.btn-editar,
.btn-detalhar {
  flex: 1;
  min-height: 38px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
   gap: 8px;
  padding: 0 12px;
  white-space: nowrap;
}

.btn-action-icon {
  flex-shrink: 0;
}

.btn-action-label {
  min-width: 0;
}

.btn-action-label-mobile {
  display: none;
}

.btn-editar,
.btn-salvarEdicao {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.22);
}

.btn-detalhar {
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.btn-detalhar:hover {
  background: rgba(15, 23, 42, 0.1);
}

.btn-salvarEdicao {
  width: 100%;
  min-height: 44px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
}

.botoes-edicao {
  display: flex;
  margin-top: 20px;
}

.botoes-edicao .btn-salvarEdicao {
  width: 100%;
}

.state-card {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  padding: 24px;
  border-radius: 22px;
  border: 1px dashed rgba(148, 163, 184, 0.35);
  background: #f8fafc;
}

.state-card-loading {
  border-style: solid;
}

.state-card-empty {
  min-height: 180px;
}

.state-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.loader {
  border: 5px solid #e2e8f0;
  border-top: 5px solid #3b82f6;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  animation: spin 1s linear infinite;
}

.loader-inline {
  width: 52px;
  height: 52px;
}

.loader-small {
  width: 38px;
  height: 38px;
  border-width: 4px;
}

.loader-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 1000;
}

.modal-content {
  background: #ffffff;
  padding: 24px;
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  width: min(760px, 92vw);
  max-width: 92vw;
}

.modal-content h2 {
  margin-bottom: 20px;
  color: #3b82f6;
}

.modal-content.modal-content-edicao {
  border-radius: 16px;
  width: min(1024px, 94vw);
  max-width: 94vw;
}

.modal-header-edicao {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  margin-bottom: 14px;
}

.modal-header-edicao h2 {
  margin: 0;
}

.btn-close-x {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(59, 130, 246, 0.55);
  border-radius: 999px;
  background: #fff;
  color: #3b82f6;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.btn-close-x:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.35);
  color: #ef4444;
  transform: translateY(-1px);
}

.btn-close-x:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-fechar {
  margin-top: 15px;
  background-color: #3b82f6;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.campo {
  display: flex;
  flex-direction: column;
}

.campo strong {
  color: #2d3748;
  font-size: 14px;
}

.dropdown-custom {
  position: relative;
  cursor: pointer;
  margin-top: 5px;
}

.dropdown-list {
  position: absolute;
  width: 100%;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.dropdown-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.dropdown-list ul {
  max-height: 180px;
  overflow-y: auto;
}

.sem-jogador {
  padding: 10px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.abas-container {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  padding: 10px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
  margin-bottom: 14px;
  overflow-x: auto;
}

.aba {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  background: transparent;
  font-weight: 800;
  line-height: 1.25;
  color: #334155;
  transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease, color 0.2s ease;
  user-select: none;
  border: 1px solid transparent;
}

.aba:hover {
  background: rgba(59, 130, 246, 0.08);
  transform: translateY(-1px);
}

.aba.ativa {
  background: #3b82f6;
  color: #fff;
  box-shadow: 0 12px 22px rgba(37, 99, 235, 0.22);
  border-color: rgba(255, 255, 255, 0.18);
}

.loader-pequeno {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #fff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: inline-block;
  animation: spin 1s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.modal-content.modal-detalhes-user {
  width: min(840px, 90%);
  max-height: calc(100vh - 96px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  border: 1px solid #d4dced;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.24);
  padding: 12px;
}

.modal-detalhes-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  padding-right: 4px;
  margin-right: -4px;
}

.modal-detalhes-body::-webkit-scrollbar {
  width: 8px;
}

.modal-detalhes-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-detalhes-body::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.22);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.modal-detalhes-body {
  scrollbar-width: thin;
  scrollbar-color: rgba(15, 23, 42, 0.28) transparent;
}

.modal-user-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid #dbe3f0;
  padding-bottom: 6px;
  margin-bottom: 6px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-title {
  margin: 0;
  font-size: 21px;
  line-height: 32px;
  font-weight: 900;
  color: #3873d7;
  letter-spacing: 0.2px;
}

.btn-close-x-user {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(59, 130, 246, 0.55);
  background: #fff;
  color: #3b82f6;
  cursor: pointer;
  font-size: 17px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.btn-close-x-user:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.35);
  color: #ef4444;
  transform: translateY(-1px);
}

.user-top-grid {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 8px;
  margin-top: 6px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 12px;
  background: #edf2fa;
  border: 1px solid #c9d7ee;
}

.avatar-wrap {
  width: 118px;
  height: 118px;
  border-radius: 999px;
  padding: 3px;
  background: linear-gradient(145deg, #90dcff 0%, #56b8ff 45%, #2e78f4 100%);
  box-shadow: 0 0 0 2px #ebf6ff, 0 0 0 4px rgba(86, 184, 255, 0.30), 0 6px 14px rgba(45, 116, 229, 0.24);
}

.avatar-lg {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  object-fit: cover;
  border: 2px solid #d9eaff;
  background: #d7dfec;
}

.user-identity {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-name {
  font-weight: 900;
  font-size: 17px;
  line-height: 1.05;
  text-transform: uppercase;
  color: #202f4a;
}

.badge-permissao {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 12px;
  min-height: 30px;
  font-size: 12px;
  font-weight: 800;
  color: #3b82f6;
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  white-space: nowrap;
  box-shadow: none;
  width: fit-content;
  align-self: flex-start;
}

.badge-permissao-panel {
  margin-top: 8px;
}

.shield-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.user-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-top: 8px;
}

.stats-card {
  grid-column: 1 / -1;
}

.info-card {
  border-radius: 12px;
  border: 1px solid #d2dceb;
  padding: 10px;
}

.card-title {
  font-size: 12px;
  font-weight: 900;
  color: #233556;
  margin-bottom: 6px;
}

.info-row {
  display: grid;
  grid-template-columns: 124px 1fr;
  gap: 6px;
  padding: 7px 9px;
  border-radius: 10px;
  border: 1px solid #d9e2f0;
  
  margin-bottom: 6px;
}

.perfil-card .info-row:last-child {
  margin-bottom: 0;
}

.contato-card .info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 14px;
  font-weight: 900;
  color: #253a5b;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #2e3f5b;
}

.perfil-highlight {
  border: 1px solid #d9e2f0;
  border-radius: 10px;
  padding: 7px 9px;
  margin-bottom: 6px;
}

.perfil-highlight-title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #2a3f62;
  font-size: 15px;
  font-weight: 700;
  border-bottom: 1px solid #d4deee;
  padding-bottom: 5px;
}

.perfil-cadastro {
  margin-top: 6px;
  color: #3f526f;
  font-size: 14px;
}

.perfil-cadastro strong {
  color: #25395b;
  font-weight: 900;
}

.info-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.text-clip {
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid #cad6e9;
  background: #ecf2fb;
  cursor: pointer;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: #e3ebf8;
}

.stats-inline {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.stats-card .stat {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  padding: 8px 9px;
  border-radius: 10px;
  border: 1px solid #dbe3f1;
}

.stat-label {
  font-size: 14px;
  font-weight: 500;
  color: #445774;
}

.stat-value,
.stat-text {
  font-size: 14px;
  font-weight: 700;
  color: #233758;
}

.btn-fechar-premium {
  width: 100%;
  margin-top: 8px;
  padding: 9px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 15px;
  background: #f5f7fb;
  color:  #3b82f6;
  border: 2px solid #3b82f6;
  flex-shrink: 0;
}


@media (max-width: 768px) {
  .modal-content.modal-detalhes-user {
    width: calc(100% - 16px);
    max-height: calc(100vh - 36px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 10px;
    border-radius: 16px;
  }

  .modal-detalhes-body {
    padding-right: 2px;
    margin-right: -2px;
  }

  .modal-user-header {
    padding-bottom: 8px;
    margin-bottom: 8px;
  }

  .modal-title {
    font-size: 20px;
    line-height: 1.2;
  }

  .btn-close-x-user {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .user-profile {
    flex-direction: row;
    align-items: center;
    gap: 10px;
    padding: 8px;
  }

  .user-top-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .avatar-wrap {
    width: 92px;
    height: 92px;
    box-shadow: 0 0 0 2px #ebf6ff, 0 0 0 4px rgba(86, 184, 255, 0.32), 0 6px 14px rgba(45, 116, 229, 0.2);
  }

  .user-name {
    font-size: 20px;
  }

  .user-identity {
    min-width: 0;
    gap: 6px;
  }

  .badge-permissao {
    font-size: 12px;
    padding: 6px 10px;
  }

  .user-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    margin-top: 8px;
  }

  .info-card {
    border-radius: 14px;
    padding: 8px;
  }

  .card-title {
    margin-bottom: 4px;
  }

  .info-row {
    grid-template-columns: 1fr;
    gap: 4px;
    padding: 8px;
    border-radius: 10px;
    margin-bottom: 5px;
  }

  .info-label,
  .info-value {
    font-size: 13px;
  }

  .perfil-highlight {
    padding: 7px 8px;
    margin-bottom: 5px;
  }

  .perfil-highlight-title {
    font-size: 14px;
    padding-bottom: 4px;
  }

  .perfil-cadastro {
    margin-top: 5px;
    font-size: 13px;
  }

  .info-actions {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .icon-btn {
    width: 38px;
    height: 38px;
  }

  .stats-inline {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .stats-card .stat {
    gap: 4px;
    padding: 7px 8px;
  }

  .btn-fechar-premium {
    margin-top: 6px;
    padding: 10px;
    border-radius: 14px;
  }
}

@media (max-width: 540px) {
  .modal-content.modal-detalhes-user {
    width: calc(100% - 12px);
    max-height: calc(100vh - 28px);
    padding: 9px;
  }

  .modal-title {
    font-size: 18px;
  }

  .user-profile {
    gap: 8px;
    padding: 7px;
  }

  .avatar-wrap {
    width: 78px;
    height: 78px;
  }

  .user-name {
    font-size: 18px;
  }

  .badge-permissao {
    padding: 5px 9px;
    font-size: 11px;
  }

  .info-card {
    padding: 7px;
  }

  .info-row {
    padding: 7px;
  }

  .btn-fechar-premium {
    padding: 9px;
  }
}
@media (max-width: 768px) {
  .SideBar {
    transform: translateX(-100%);
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 250px;
    background: #fff;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.2);
    z-index: 100;
  }

  .SideBar.open {
    transform: translateX(0);
  }

  .conteudo {
    margin-left: 0;
    padding: 12px 16px 16px 16px !important;
    width: 100%;
    box-sizing: border-box;
  }

  .title {
    font-size: 24px;
    line-height: 1.2;
    margin: 0 0 8px 0;
    padding-left: 52px;
    min-height: 42px;
    display: flex;
    align-items: center;
  }

  .usuarios {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .card {
    min-height: auto;
  }

  .card-conteudo {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    text-align: left;
  }

  .foto {
    flex: 0 0 80px;
    width: 80px;
    height: 80px;
    padding: 3px;
    box-shadow: 0 0 0 2px #ebf6ff, 0 0 0 3px rgba(86, 184, 255, 0.28), 0 5px 10px rgba(45, 116, 229, 0.2);
  }

  .foto img {
    width: 100%;
    height: 100%;
  }

  .info h2 {
    font-size: 18px;
  }

  .info-header {
    justify-content: flex-start;
    gap: 6px;
  }

  .info {
    min-width: 0;
    width: 100%;
  }

  .info p {
    font-size: 13px;
  }

  .botoes {
    flex-direction: row;
    gap: 8px;
  }

  .botoes .btn-editar,
  .botoes .btn-detalhar {
    width: calc(50% - 4px);
    padding: 8px 0;
  }

  .btn-salvarEdicao {
    width: 100%;
    padding: 8px 0;
  }

  .modal-content {
    width: 95%;
    padding: 20px;
  }

  .modal-content.modal-content-edicao {
    width: 95%;
    max-width: 95%;
  }

  .modal-header-edicao {
    margin-bottom: 12px;
    padding-bottom: 12px;
  }

  .abas-container {
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
  }

  .aba {
    flex: 1 1 48%;
    font-size: 13px;
    padding: 10px 8px;
  }

  select {
    font-size: 14px;
  }
}

@media (max-width: 1200px) {
  .overview-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .panel-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .usuarios {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .conteudo {
    margin-left: 0;
    padding: 12px 14px 18px;
    width: auto;
    box-sizing: border-box;
  }

  .page-nav {
    margin-bottom: 18px;
  }

  .page-header {
    margin-top: 50px;
    margin-bottom: 18px;
  }

  .title {
    font-size: 24px;
    line-height: 1.12;
    margin: 0;
    padding-left: 0;
    min-height: 0;
    display: block;
  }

  .page-subtitle,
  .section-subtitle,
  .detalhe-contato span {
    font-size: 13px;
  }

  .overview-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .overview-card {
    padding: 10px 8px 9px;
    border-radius: 14px;
    gap: 5px;
  }

  .page-kicker,
  .section-kicker,
  .metric-kicker {
    font-size: 9px;
    letter-spacing: 0.08em;
  }

  .metric-value {
    font-size: 20px;
  }

  .metric-caption {
    font-size: 9px;
    line-height: 1.25;
  }

  .controls-panel,
  .users-panel,
  .modal-content {
    padding: 18px;
    border-radius: 22px;
  }

  .panel-head {
    gap: 12px;
  }

  .panel-pill {
    min-height: 30px;
    font-size: 11px;
  }

  .abas-config-container {
    gap: 8px;
    padding: 5px;
  }

  .aba-config {
    flex: 1 1 0;
    min-width: 0;
    padding: 9px 6px;
    font-size: 15px;
    line-height: 1.15;
    text-align: center;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .search-shell {
    min-height: 46px;
    padding-left: 40px;
    border-radius: 16px;
  }

  .search-icon {
    left: 13px;
    width: 17px;
    height: 17px;
  }

  .usuarios {
    gap: 12px;
  }

  .card {
    padding: 12px;
    border-radius: 18px;
    gap: 12px;
    min-height: auto;
  }

  .card-conteudo {
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: 12px;
  }

  .card-profile {
    display: grid;
    grid-template-columns: 84px minmax(0, 1fr);
    grid-template-areas:
      "foto identity"
      "contact contact";
    gap: 10px;
    align-items: center;
  }

  .foto {
    grid-area: foto;
    flex: 0 0 84px;
    width: 84px;
    height: 84px;
    padding: 3px;
    box-shadow: 0 0 0 2px #ebf6ff, 0 0 0 3px rgba(86, 184, 255, 0.28), 0 5px 10px rgba(45, 116, 229, 0.2);
  }

  .info {
    display: contents;
  }

  .identity-block,
  .contact-list {
    max-width: none;
  }

  .identity-block {
    grid-area: identity;
    width: 100%;
    align-self: center;
  }

  .info h2 {
    font-size: 20px;
    line-height: 1.04;
  }

  .info-header {
    gap: 6px;
    justify-content: flex-start;
  }

  .contact-list {
    grid-area: contact;
    gap: 6px;
    width: 100%;
  }

  .detalhe-contato {
    padding: 8px 10px;
    border-radius: 12px;
    gap: 7px;
  }

  .contact-action {
    width: 30px;
    height: 30px;
    border-radius: 9px;
  }

  .botoes {
    gap: 8px;
    flex-direction: row;
    margin-top: 3px;
    width: 100%;
  }

  .btn-editar,
  .btn-detalhar {
    flex: 1 1 0;
    min-height: 40px;
    font-size: 13px;
    padding: 0 10px;
  }

  .btn-action-label-desktop {
    display: none;
  }

  .btn-action-label-mobile {
    display: inline;
  }

  .modal-content.modal-detalhes-user {
    width: 100%;
    max-height: 88vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 10px;
    border-radius: 22px;
  }

  .modal-detalhes-body {
    padding-right: 2px;
    margin-right: -2px;
  }

  .modal-user-header {
    padding-bottom: 8px;
    margin-bottom: 8px;
  }

  .modal-title {
    font-size: 20px;
    line-height: 1.2;
  }

  .btn-close-x-user {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .user-profile {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 8px;
  }

  .user-top-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .avatar-wrap {
    width: 84px;
    height: 84px;
    box-shadow: 0 0 0 2px #ebf6ff, 0 0 0 4px rgba(86, 184, 255, 0.3), 0 6px 14px rgba(45, 116, 229, 0.2);
  }

  .user-name {
    font-size: 19px;
  }

  .badge-permissao {
    font-size: 11px;
    padding: 6px 10px;
  }

  .user-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    margin-top: 8px;
  }

  .info-card {
    border-radius: 14px;
    padding: 8px;
  }

  .info-row {
    grid-template-columns: 1fr;
    gap: 4px;
    padding: 8px;
    border-radius: 10px;
    margin-bottom: 5px;
  }

  .info-actions {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .icon-btn {
    width: 38px;
    height: 38px;
  }

  .stats-inline {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .stats-card .stat {
    flex-wrap: wrap;
    gap: 4px;
    padding: 7px 8px;
  }

  .btn-fechar-premium {
    margin-top: 6px;
    padding: 10px;
    border-radius: 14px;
  }

  .modal-header-edicao {
    margin-bottom: 12px;
    padding-bottom: 12px;
  }

  .abas-container {
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
  }

  .aba {
    flex: 1 1 48%;
    font-size: 13px;
    padding: 10px 8px;
  }

  select {
    font-size: 14px;
  }
}

@media (max-width: 540px) {
  .modal-content.modal-detalhes-user {
    max-height: 88vh;
    padding: 9px;
  }

  .modal-title {
    font-size: 18px;
  }

  .avatar-wrap {
    width: 76px;
    height: 76px;
  }

  .user-name {
    font-size: 18px;
  }

  .badge-permissao {
    padding: 5px 9px;
    font-size: 11px;
  }
}
</style>

