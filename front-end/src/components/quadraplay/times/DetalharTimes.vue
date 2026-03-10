<template>
  <div v-if="aberto && !modalGerenciarJogadoresAberto" class="modal-overlay">
    <div class="modal-conteudo modal-placar">
      <div class="header-placar">
        <h2 class="title_placar">Jogadores do {{ formatarInicialMaiuscula(time?.nome) }}</h2>
        <button class="btn-gerenciar" @click="abrirModalGerenciarJogadores" aria-label="Gerenciar Jogadores">
          <span class="btn-gerenciar-texto">Gerenciar Jogadores</span>

          <svg class="btn-gerenciar-icone" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
            viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path
              d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" />
          </svg>
        </button>

      </div>

      <div v-if="isLoading" class="loader-container-centralizado">
        <LoadingState
          size="compact"
          title="Carregando jogadores"
          description="Buscando o elenco, as funções e os vinculos do time selecionado."
        />
      </div>

      <div v-else>
        <div v-if="jogadores.length" class="placar-table">
          <table class="placar">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Posição</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="j in jogadores" :key="j.id">
                <td class="time-info">
                  <span v-if="temNumeroJogador(j.numero)" class="numero-jogador">{{ j.numero }}</span>
                  <img :src="j.foto" alt="Foto" class="time-image time-image-click" @click.stop="gerenciarImagem(j)" />
                  {{ formatarInicialMaiuscula(j.nome) }}
                </td>
                <td>
                  <div class="select-wrap">
                    <select
                      v-model="j.funcaoId"
                      class="select-funcao"
                      :disabled="alterandoFuncaoJogadorId === j.id"
                      @focus="registrarFuncaoAnterior(j)"
                      @change="onChangeFuncaoJogador(j, $event)"
                    >
                      <option v-for="f in funcoes" :key="f.id" :value="f.id">
                        {{ f.nome }}
                      </option>
                      <option :value="novaFuncaoValue">+ Nova posição...</option>
                    </select>

                    <span class="select-arrow">v</span>
                  </div>

                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="sem-dados-centralizado">
          <span class="sem-dados-texto">Nenhum jogador encontrado para este time.</span>
          <div class="sem-dados-acoes">
            <button
              type="button"
              class="btn-sem-dados-acao"
              @click="abrirModalGerenciarJogadoresComAcao('adicionarExistente')"
            >
              Adicionar existente
            </button>
            <button
              type="button"
              class="btn-sem-dados-acao"
              @click="abrirModalGerenciarJogadoresComAcao('adicionar')"
            >
              Adicionar novo
            </button>
            <button
              type="button"
              class="btn-sem-dados-acao"
              @click="abrirModalGerenciarJogadoresComAcao('adicionarMassa')"
            >
              Adicionar em massa
            </button>
          </div>
        </div>
      </div>

      <button class="btn-cancel-placar" @click="$emit('fechar')">Fechar</button>
    </div>
  </div>
  <input ref="inputTrocarImagem" type="file" accept=".jpg,.jpeg,.png" style="display: none"
    @change="handleTrocarImagem" />
    <div v-if="modalGerenciarJogadoresAberto" class="modal-overlay-gerenciar" @click.self="fecharModalGerenciarJogadores">
    <div class="modal-content-gerenciar"
      :class="{ 'modal-content-gerenciar-sem-scroll': gerenciarAcaoLocal === 'adicionar' }"
      @scroll.passive="atualizarPosicaoDropdownsGerenciar">
      <div class="modal-header-gerenciar">
        <h2>Gerenciar Jogadores - {{ formatarInicialMaiuscula(time?.nome) }}</h2>
        <button type="button" class="btn-close-x-gerenciar" @click="fecharModalGerenciarJogadores">x</button>
      </div>

      <div class="abas-container-gerenciar">
        <div class="aba-gerenciar" :class="{ ativa: gerenciarAcaoLocal === 'adicionarExistente' }"
          @click="gerenciarAcaoLocal = 'adicionarExistente'">
          Jogador Existente
        </div>
        <div class="aba-gerenciar" :class="{ ativa: gerenciarAcaoLocal === 'adicionar' }"
          @click="gerenciarAcaoLocal = 'adicionar'">
          Adicionar Novo
        </div>
        <div class="aba-gerenciar" :class="{ ativa: gerenciarAcaoLocal === 'adicionarMassa' }"
          @click="gerenciarAcaoLocal = 'adicionarMassa'">
          Adicionar em massa
        </div>
        <div class="aba-gerenciar" :class="{ ativa: gerenciarAcaoLocal === 'remover' }"
          @click="gerenciarAcaoLocal = 'remover'">
          Remover
        </div>
      </div>

      <div v-if="gerenciarAcaoLocal" class="conteudo-aba-gerenciar">
        <div v-if="gerenciarAcaoLocal === 'adicionar'" class="form-group-gerenciar">
          <label for="nomeJogadorGerenciar">Nome do jogador:</label>
          <input id="nomeJogadorGerenciar" v-model="gerenciarNomeJogador" type="text" placeholder="Digite o nome"
            class="dropdown-gerenciar" />

          <label for="numeroJogadorGerenciar">Número do jogador:</label>
          <input id="numeroJogadorGerenciar" v-model.number="gerenciarNumeroJogador" type="number" min="1" step="1"
            placeholder="Digite o número da camisa" class="dropdown-gerenciar" />

          <label>Vincular usuário</label>
          <div ref="dropdownUsuariosAnchor" class="dropdown-custom-gerenciar">
            <div class="dropdown-selected-gerenciar"
              @click.stop="toggleDropdownUsuarios">
              <img v-if="gerenciarUsuarioSelecionado?.foto" :src="gerenciarUsuarioSelecionado.foto" class="avatar" />
              <span>
                {{ gerenciarUsuarioSelecionado?.nome || 'Selecione um usuário (opcional)' }}
              </span>
            </div>

            <div v-if="gerenciarAbrirDropdownUsuarios" ref="dropdownUsuariosLista"
              class="dropdown-list-gerenciar dropdown-list-gerenciar-solto" :style="dropdownUsuariosStyle" @click.stop>
              <input v-model="gerenciarBuscaUsuario" type="text" placeholder="Buscar usuário..."
                class="input-busca-jogador-gerenciar" @click.stop />

              <ul>
                <li v-for="u in gerenciarUsuariosFiltradosComBusca" :key="u.id" @click.stop="selecionarUsuario(u)">
                  <img :src="u.foto" class="avatar" />
                  <span>{{ u.nome }}</span>
                </li>

                <li v-if="gerenciarUsuariosFiltradosComBusca.length === 0" class="sem-jogador-gerenciar">
                  Nenhum usuário encontrado
                </li>
              </ul>
            </div>
          </div>

          <label for="fotoJogadorGerenciar">Foto (opcional):</label>
          <input id="fotoJogadorGerenciar" ref="inputFotoJogadorGerenciar" type="file" @change="handleImagemUpload" accept=".jpg,.jpeg,.png"
            class="dropdown-gerenciar" />
        </div>

        <div v-if="gerenciarAcaoLocal === 'adicionarExistente'" class="form-group-gerenciar">
          <label>Adicionar jogador existente:</label>
          <div ref="dropdownJogadoresAnchor" class="dropdown-custom-gerenciar">
            <div class="dropdown-selected-gerenciar"
              @click.stop="toggleDropdownJogadores">
              <img v-if="gerenciarJogadorSelecionadoExistente?.foto" :src="gerenciarJogadorSelecionadoExistente.foto"
                class="avatar" />
              <span v-if="gerenciarJogadoresSelecionadosExistentes.length === 0">
                Selecione jogador(es) existente(s)
              </span>
              <span v-else>
                {{ gerenciarJogadoresSelecionadosExistentes.length }} jogador(es) selecionado(s)
              </span>
            </div>

            <div v-if="gerenciarAbrirDropdownJogadores" ref="dropdownJogadoresLista"
              class="dropdown-list-gerenciar dropdown-list-gerenciar-solto" :style="dropdownJogadoresStyle" @click.stop>
              <input v-model="gerenciarBuscaJogador" type="text" placeholder="Buscar por nome ou número..."
                class="input-busca-jogador-gerenciar" @click.stop />

              <ul>
                <li v-if="gerenciarJogadoresExistentesFiltradosComBusca.length === 0" class="sem-jogador-gerenciar">
                  Nenhum jogador disponível
                </li>

                <li v-for="j in gerenciarJogadoresExistentesFiltradosComBusca" :key="j.id"
                  @click.stop="toggleJogadorExistente(j)" :class="{ selecionado: isJogadorSelecionado(j.id) }">
                  <span v-if="temNumeroJogador(j.numero)" class="numero-jogador">{{ j.numero }}</span>
                  <img :src="j.foto" class="avatar" />
                  <span>
                    {{ formatarInicialMaiuscula(j.nome) }}
                    <span v-if="j.times && j.times.length">
                      ({{ formatarInicialMaiuscula(j.times[0].nome) }})
                    </span>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div v-if="gerenciarAcaoLocal === 'remover'" class="form-group-gerenciar">
          <label>Escolha o(s) jogador(es):</label>
          <div ref="dropdownRemoverAnchor" class="dropdown-custom-gerenciar">
            <div class="dropdown-selected-gerenciar"
              @click.stop="toggleDropdownRemover">
              <span v-if="gerenciarJogadoresSelecionadosRemover.length === 0">Selecione jogador(es)</span>
              <span v-else>
                {{ gerenciarJogadoresSelecionadosRemover.length }} jogador(es) selecionado(s)
              </span>
            </div>

            <div v-if="gerenciarAbrirDropdownRemover" ref="dropdownRemoverLista"
              class="dropdown-list-gerenciar dropdown-list-gerenciar-solto" :style="dropdownRemoverStyle" @click.stop>
              <input v-model="gerenciarBuscaJogadorRemover" type="text" placeholder="Buscar por nome ou número..."
                class="input-busca-jogador-gerenciar" @click.stop />

              <ul>
                <li v-for="j in gerenciarJogadoresFiltradosRemover" :key="j.id" @click.stop="toggleJogadorRemover(j)"
                  :class="{ selecionado: isJogadorSelecionadoRemover(j.id) }">
                  <span v-if="temNumeroJogador(j.numero)" class="numero-jogador">{{ j.numero }}</span>
                  <img :src="j.foto" class="avatar" />
                  <span>{{ formatarInicialMaiuscula(j.nome) }}</span>
                </li>

                <li v-if="gerenciarJogadoresFiltradosRemover.length === 0" class="sem-jogador-gerenciar">
                  Nenhum jogador encontrado
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div v-if="gerenciarAcaoLocal === 'adicionarMassa'" class="form-group-gerenciar">
        <label>Adicionar jogadores em massa:</label>
        <textarea v-model="gerenciarNomesJogadoresMassa" class="dropdown-gerenciar" rows="4"
          placeholder="Ex:Tiago 04, Pedro 06, João 10"></textarea>
        <small style="color:#666">
          Informe no formato nome, número, separado por vírgula ou quebra de linha
        </small>
      </div>

      <div class="botoes-gerenciar">
        <button v-if="gerenciarAcaoLocal" class="btn-save1-gerenciar" @click="confirmarGerenciar" :disabled="botaoSalvarGerenciarDesabilitado">
          <span v-if="gerenciarSalvando" class="btn-save1-gerenciar-loading" aria-hidden="true"></span>
          {{ gerenciarSalvando ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/axios';
import LoadingState from '@/components/loading/LoadingState.vue';
import Swal from 'sweetalert2';

export default {
  components: { LoadingState },
  emits: ['fechar', 'atualizar-lista'],
  props: {
    aberto: Boolean,
    time: Object,
    modalidadeSelecionada: String,
    modalidadesDisponiveis: Array
  },
  data() {
    return {
      jogadores: [],
      funcoes: [],
      isLoading: false,
      alterandoFuncaoJogadorId: null,
      funcaoAnteriorPorJogador: {},
      novaFuncaoValue: '__nova_funcao__',
      jogadorImagemAtual: null,
      modalGerenciarJogadoresAberto: false,
      gerenciarAcaoLocal: 'adicionarExistente',
      gerenciarNomeJogador: '',
      gerenciarNumeroJogador: null,
      gerenciarBuscaJogador: '',
      gerenciarBuscaUsuario: '',
      gerenciarArquivoFoto: null,
      gerenciarJogadorSelecionado: null,
      gerenciarJogadorSelecionadoExistente: null,
      gerenciarUsuariosDisponiveis: [],
      gerenciarUsuarioSelecionado: null,
      gerenciarAbrirDropdownUsuarios: false,
      gerenciarJogadores: [],
      gerenciarJogadoresSelecionadosExistentes: [],
      gerenciarJogadoresSelecionadosRemover: [],
      gerenciarAbrirDropdownJogadores: false,
      gerenciarAbrirDropdownRemover: false,
      gerenciarBuscaJogadorRemover: '',
      gerenciarNomesJogadoresMassa: '',
      gerenciarSalvando: false,
      gerenciarDropdownPosicoes: {
        usuarios: null,
        jogadores: null,
        remover: null
      }
    };
  },
  watch: {
    aberto(novo) {
      if (novo && this.time?.id) {
        console.log('Modal aberto, modalidade selecionada:', this.modalidadeSelecionada);
        this.carregarFuncoes();
        this.carregarJogadores(this.time.id);
      } else {
        this.fecharModalGerenciarJogadores();
      }
    },
    modalidadeSelecionada(novoValor) {
      console.log('modalidadeSelecionada mudou no filho:', novoValor);
      if (this.aberto) {
        this.carregarFuncoes();
      }
    },
    time(novo) {
      if (novo?.id && this.modalGerenciarJogadoresAberto) {
        this.carregarJogadoresGerenciar();
        this.carregarUsuariosDisponiveisGerenciar();
      }
    }
  },
  computed: {
    modalidadeSelecionadaId() {
      return this.modalidadeSelecionada;
    },
    gerenciarNumeroJogadorValido() {
      return this.normalizarNumeroJogador(this.gerenciarNumeroJogador) !== null;
    },
    botaoSalvarGerenciarDesabilitado() {
      if (!this.gerenciarAcaoLocal || this.gerenciarSalvando) return true;

      if (this.gerenciarAcaoLocal === 'adicionar') {
        return !this.gerenciarNomeJogador || !this.gerenciarNumeroJogadorValido;
      }

      if (this.gerenciarAcaoLocal === 'adicionarExistente') {
        return this.gerenciarJogadoresSelecionadosExistentes.length === 0;
      }

      if (this.gerenciarAcaoLocal === 'remover') {
        return this.gerenciarJogadoresSelecionadosRemover.length === 0;
      }

      if (this.gerenciarAcaoLocal === 'adicionarMassa') {
        return !this.gerenciarNomesJogadoresMassa;
      }

      return false;
    },
    gerenciarJogadoresExistentesFiltrados() {
      if (!this.time) return [];
      const timeIdAtual = this.time.id;
      return this.gerenciarJogadores.filter(j => !j.times.some(t => t.id === timeIdAtual));
    },
    gerenciarJogadoresExistentesFiltradosComBusca() {
      return this.gerenciarJogadoresExistentesFiltrados.filter(j =>
        this.jogadorCombinaBusca(j, this.gerenciarBuscaJogador)
      );
    },
    gerenciarUsuariosFiltradosComBusca() {
      return this.gerenciarUsuariosDisponiveis
        .filter(u => u.permissaoId !== 1)
        .filter(u => u.nome.toLowerCase().includes(this.gerenciarBuscaUsuario.toLowerCase()));
    },
    gerenciarJogadoresFiltradosRemover() {
      if (!this.gerenciarJogadores || !this.time) return [];
      const timeIdAtual = this.time.id;
      return this.gerenciarJogadores
        .filter(j => j.times.some(t => t.id === timeIdAtual))
        .filter(j => this.jogadorCombinaBusca(j, this.gerenciarBuscaJogadorRemover));
    },
    dropdownUsuariosStyle() {
      return this.gerenciarDropdownPosicoes.usuarios || {};
    },
    dropdownJogadoresStyle() {
      return this.gerenciarDropdownPosicoes.jogadores || {};
    },
    dropdownRemoverStyle() {
      return this.gerenciarDropdownPosicoes.remover || {};
    }
  },
  mounted() {
    document.addEventListener('mousedown', this.handleClickForaDropdownGerenciar);
    document.addEventListener('touchstart', this.handleClickForaDropdownGerenciar);
    window.addEventListener('resize', this.atualizarPosicaoDropdownsGerenciar);
    window.addEventListener('scroll', this.atualizarPosicaoDropdownsGerenciar, true);
  },
  beforeUnmount() {
    document.removeEventListener('mousedown', this.handleClickForaDropdownGerenciar);
    document.removeEventListener('touchstart', this.handleClickForaDropdownGerenciar);
    window.removeEventListener('resize', this.atualizarPosicaoDropdownsGerenciar);
    window.removeEventListener('scroll', this.atualizarPosicaoDropdownsGerenciar, true);
  },
  methods: {
    fecharDropdownsGerenciar() {
      this.gerenciarAbrirDropdownUsuarios = false;
      this.gerenciarAbrirDropdownJogadores = false;
      this.gerenciarAbrirDropdownRemover = false;
    },
    toggleDropdownUsuarios() {
      const vaiAbrir = !this.gerenciarAbrirDropdownUsuarios;
      this.fecharDropdownsGerenciar();
      if (vaiAbrir) {
        this.atualizarPosicaoDropdownGerenciar('usuarios');
        this.gerenciarAbrirDropdownUsuarios = true;
        this.$nextTick(() => this.atualizarPosicaoDropdownGerenciar('usuarios'));
      }
    },
    toggleDropdownJogadores() {
      const vaiAbrir = !this.gerenciarAbrirDropdownJogadores;
      this.fecharDropdownsGerenciar();
      if (vaiAbrir) {
        this.atualizarPosicaoDropdownGerenciar('jogadores');
        this.gerenciarAbrirDropdownJogadores = true;
        this.$nextTick(() => this.atualizarPosicaoDropdownGerenciar('jogadores'));
      }
    },
    toggleDropdownRemover() {
      const vaiAbrir = !this.gerenciarAbrirDropdownRemover;
      this.fecharDropdownsGerenciar();
      if (vaiAbrir) {
        this.atualizarPosicaoDropdownGerenciar('remover');
        this.gerenciarAbrirDropdownRemover = true;
        this.$nextTick(() => this.atualizarPosicaoDropdownGerenciar('remover'));
      }
    },
    atualizarPosicaoDropdownGerenciar(tipo) {
      const mapa = {
        usuarios: 'dropdownUsuariosAnchor',
        jogadores: 'dropdownJogadoresAnchor',
        remover: 'dropdownRemoverAnchor'
      };

      const anchor = this.$refs[mapa[tipo]];
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const margemTela = 8;
      const alturaPadrao = 280;
      const espacoAbaixo = window.innerHeight - rect.bottom - margemTela;
      const espacoAcima = rect.top - margemTela;
      const abreParaCima = espacoAbaixo < 170 && espacoAcima > espacoAbaixo;

      const largura = Math.min(rect.width, window.innerWidth - margemTela * 2);
      const left = Math.max(margemTela, Math.min(rect.left, window.innerWidth - largura - margemTela));
      const maxHeightBase = abreParaCima ? espacoAcima - 14 : espacoAbaixo - 14;
      const maxHeight = Math.min(alturaPadrao, Math.max(120, Math.floor(maxHeightBase)));
      const top = abreParaCima
        ? Math.max(margemTela, rect.top - maxHeight - 8)
        : rect.bottom + 8;

      this.gerenciarDropdownPosicoes[tipo] = {
        top: `${Math.round(top)}px`,
        left: `${Math.round(left)}px`,
        width: `${Math.round(largura)}px`,
        maxHeight: `${maxHeight}px`
      };
    },
    atualizarPosicaoDropdownsGerenciar() {
      if (!this.modalGerenciarJogadoresAberto) return;
      if (this.gerenciarAbrirDropdownUsuarios) this.atualizarPosicaoDropdownGerenciar('usuarios');
      if (this.gerenciarAbrirDropdownJogadores) this.atualizarPosicaoDropdownGerenciar('jogadores');
      if (this.gerenciarAbrirDropdownRemover) this.atualizarPosicaoDropdownGerenciar('remover');
    },
    handleClickForaDropdownGerenciar(event) {
      if (!this.modalGerenciarJogadoresAberto) return;

      const alvo = event.target;
      const areasAbertas = [
        {
          aberto: this.gerenciarAbrirDropdownUsuarios,
          anchor: this.$refs.dropdownUsuariosAnchor,
          lista: this.$refs.dropdownUsuariosLista
        },
        {
          aberto: this.gerenciarAbrirDropdownJogadores,
          anchor: this.$refs.dropdownJogadoresAnchor,
          lista: this.$refs.dropdownJogadoresLista
        },
        {
          aberto: this.gerenciarAbrirDropdownRemover,
          anchor: this.$refs.dropdownRemoverAnchor,
          lista: this.$refs.dropdownRemoverLista
        }
      ];

      const clicouDentroDeDropdownAberto = areasAbertas.some(area =>
        area.aberto &&
        ((area.anchor && area.anchor.contains(alvo)) || (area.lista && area.lista.contains(alvo)))
      );

      if (!clicouDentroDeDropdownAberto) {
        this.fecharDropdownsGerenciar();
      }
    },
    resetarModalGerenciarEstado() {
      this.gerenciarAcaoLocal = 'adicionarExistente';
      this.gerenciarNomeJogador = '';
      this.gerenciarNumeroJogador = null;
      this.gerenciarBuscaJogador = '';
      this.gerenciarBuscaUsuario = '';
      this.gerenciarArquivoFoto = null;
      this.gerenciarJogadorSelecionado = null;
      this.gerenciarJogadorSelecionadoExistente = null;
      this.gerenciarUsuarioSelecionado = null;
      this.gerenciarJogadoresSelecionadosExistentes = [];
      this.gerenciarJogadoresSelecionadosRemover = [];
      this.gerenciarAbrirDropdownUsuarios = false;
      this.gerenciarAbrirDropdownJogadores = false;
      this.gerenciarAbrirDropdownRemover = false;
      this.gerenciarBuscaJogadorRemover = '';
      this.gerenciarNomesJogadoresMassa = '';
      this.gerenciarDropdownPosicoes.usuarios = null;
      this.gerenciarDropdownPosicoes.jogadores = null;
      this.gerenciarDropdownPosicoes.remover = null;
    },
    abrirModalGerenciarJogadores() {
      this.abrirModalGerenciarJogadoresComAcao('adicionarExistente');
    },
    abrirModalGerenciarJogadoresComAcao(acao = 'adicionarExistente') {
      if (!this.time?.id) return;
      this.resetarModalGerenciarEstado();
      this.gerenciarAcaoLocal = acao;
      this.modalGerenciarJogadoresAberto = true;
      this.carregarJogadores(this.time.id);
      this.carregarJogadoresGerenciar();
      this.carregarUsuariosDisponiveisGerenciar();
    },
    fecharModalGerenciarJogadores() {
      this.modalGerenciarJogadoresAberto = false;
      this.resetarModalGerenciarEstado();
    },
    formatarInicialMaiuscula(texto) {
      if (!texto) return '';
      return String(texto).replace(/(^|\s)\S/g, letra => letra.toUpperCase());
    },
    normalizarNumeroJogador(valor) {
      const numero = Number(valor);
      if (!Number.isInteger(numero) || numero <= 0) return null;
      return numero;
    },
    temNumeroJogador(numero) {
      return this.normalizarNumeroJogador(numero) !== null;
    },
    obterJogadorComNumeroNoTime(numero, ignorarJogadorId = null) {
      const numeroNormalizado = this.normalizarNumeroJogador(numero);
      if (!numeroNormalizado) return null;

      return this.jogadores.find(jogador =>
        this.normalizarNumeroJogador(jogador?.numero) === numeroNormalizado &&
        Number(jogador?.id) !== Number(ignorarJogadorId)
      ) || null;
    },
    jogadorCombinaBusca(jogador, busca) {
      const termo = String(busca || '').trim().toLowerCase();
      if (!termo) return true;
      const nome = String(jogador?.nome || '').toLowerCase();
      const numero = String(jogador?.numero ?? '').toLowerCase();
      return nome.includes(termo) || numero.includes(termo);
    },
    normalizarLinhaJogadorMassa(linha) {
      const texto = String(linha || '').trim();
      if (!texto) return null;

      const nomeComNumeroNoFim = texto.match(/^(.+?)\s+(\d+)$/);
      if (nomeComNumeroNoFim) {
        const nome = nomeComNumeroNoFim[1].trim();
        const numero = this.normalizarNumeroJogador(nomeComNumeroNoFim[2]);
        if (!numero || !nome) return null;
        return { nome, numero };
      }

      const numeroNoInicio = texto.match(/^(\d+)\s*[-:;|,]\s*(.+)$/);
      if (numeroNoInicio) {
        const numero = this.normalizarNumeroJogador(numeroNoInicio[1]);
        const nome = numeroNoInicio[2].trim();
        if (!numero || !nome) return null;
        return { nome, numero };
      }

      const numeroNoFim = texto.match(/^(.+?)\s*[-:;|,]\s*(\d+)$/);
      if (numeroNoFim) {
        const nome = numeroNoFim[1].trim();
        const numero = this.normalizarNumeroJogador(numeroNoFim[2]);
        if (!numero || !nome) return null;
        return { nome, numero };
      }

      return null;
    },
    handleImagemUpload(event) {
      const file = event.target.files[0];
      if (file) this.gerenciarArquivoFoto = file;
    },
    selecionarUsuario(usuario) {
      this.gerenciarUsuarioSelecionado = usuario;
      this.gerenciarBuscaUsuario = '';
      this.gerenciarAbrirDropdownUsuarios = false;
    },
    toggleJogadorExistente(jogador) {
      const index = this.gerenciarJogadoresSelecionadosExistentes.findIndex(j => j.id === jogador.id);
      if (index !== -1) {
        this.gerenciarJogadoresSelecionadosExistentes.splice(index, 1);
      } else {
        this.gerenciarJogadoresSelecionadosExistentes.push(jogador);
        this.gerenciarJogadorSelecionadoExistente = jogador;
      }
    },
    isJogadorSelecionado(id) {
      return this.gerenciarJogadoresSelecionadosExistentes.some(j => j.id === id);
    },
    toggleJogadorRemover(jogador) {
      const index = this.gerenciarJogadoresSelecionadosRemover.findIndex(j => j.id === jogador.id);
      if (index !== -1) {
        this.gerenciarJogadoresSelecionadosRemover.splice(index, 1);
      } else {
        this.gerenciarJogadoresSelecionadosRemover.push(jogador);
      }
    },
    isJogadorSelecionadoRemover(id) {
      return this.gerenciarJogadoresSelecionadosRemover.some(j => j.id === id);
    },
    async carregarJogadoresGerenciar() {
      if (!this.time?.modalidadeId) return;
      try {
        const res = await api.get(`/jogadores/${this.time.modalidadeId}`);
        this.gerenciarJogadores = res.data || [];
      } catch (err) {
        console.error(err);
        this.gerenciarJogadores = [];
      }
    },
    async carregarUsuariosDisponiveisGerenciar() {
      try {
        const res = await api.get('/usuarios/resumo');
        this.gerenciarUsuariosDisponiveis = res.data.filter(
          u => !u.possuiJogador && Number(u.totalTimes || 0) === 0 && u.permissaoId === 3
        );
      } catch (err) {
        console.error(err);
        this.gerenciarUsuariosDisponiveis = [];
      }
    },
    async uploadImagemGerenciar() {
      if (!this.gerenciarArquivoFoto) return null;
      const formData = new FormData();
      formData.append('file', this.gerenciarArquivoFoto);
      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return uploadResponse.data.fileUrl || uploadResponse.data.url;
    },
    limparFormularioAdicionarJogador() {
      this.gerenciarNomeJogador = '';
      this.gerenciarNumeroJogador = null;
      this.gerenciarBuscaUsuario = '';
      this.gerenciarUsuarioSelecionado = null;
      this.gerenciarArquivoFoto = null;
      this.gerenciarAbrirDropdownUsuarios = false;

      this.$nextTick(() => {
        if (this.$refs.inputFotoJogadorGerenciar) {
          this.$refs.inputFotoJogadorGerenciar.value = '';
        }
      });
    },
    async adicionarJogadorGerenciar() {
      const nome = this.gerenciarNomeJogador.trim();
      const numeroJogador = this.normalizarNumeroJogador(this.gerenciarNumeroJogador);

      if (!nome) {
        Swal.fire('Atenção', 'Informe o nome do jogador', 'warning');
        return;
      }

      if (!numeroJogador) {
        Swal.fire('Atenção', 'Informe um número válido para o jogador', 'warning');
        return;
      }

      const conflitoNumero = this.obterJogadorComNumeroNoTime(numeroJogador);
      if (conflitoNumero) {
        Swal.fire('Atenção', `Já existe um jogador com o número ${numeroJogador} neste time`, 'warning');
        return;
      }

      const FOTO_PADRAO = 'https://pub-8c7959cad5c04469b16f4b0706a2e931.r2.dev/uploads/Imagem%20padrao.png';
      const urlImagem = await this.uploadImagemGerenciar();

      await api.post('/adicionar', {
        nome,
        numero: numeroJogador,
        foto: urlImagem || FOTO_PADRAO,
        timeId: this.time.id,
        usuarioId: this.gerenciarUsuarioSelecionado?.id
      });

      Swal.fire('Sucesso', 'Jogador adicionado!', 'success');
    },
    async adicionarJogadorExistenteGerenciar() {
      if (this.gerenciarJogadoresSelecionadosExistentes.length === 0) return;

      const conflitosNumeroNoTime = [];
      const numerosDuplicadosNaSelecao = new Set();
      const numerosSelecionados = new Set();

      for (const jogador of this.gerenciarJogadoresSelecionadosExistentes) {
        const numeroJogador = this.normalizarNumeroJogador(jogador?.numero);
        if (!numeroJogador) continue;

        const conflitoNumero = this.obterJogadorComNumeroNoTime(numeroJogador, jogador.id);
        if (conflitoNumero) {
          conflitosNumeroNoTime.push(`${numeroJogador} (${conflitoNumero.nome})`);
          continue;
        }

        if (numerosSelecionados.has(numeroJogador)) {
          numerosDuplicadosNaSelecao.add(numeroJogador);
          continue;
        }

        numerosSelecionados.add(numeroJogador);
      }

      if (conflitosNumeroNoTime.length || numerosDuplicadosNaSelecao.size) {
        let mensagem = '';
        if (conflitosNumeroNoTime.length) {
          mensagem += `Números já usados no time:\n${conflitosNumeroNoTime.join(', ')}`;
        }
        if (numerosDuplicadosNaSelecao.size) {
          mensagem += `${mensagem ? '\n\n' : ''}Números repetidos na seleção:\n${Array.from(numerosDuplicadosNaSelecao).join(', ')}`;
        }
        Swal.fire('Atenção', mensagem, 'warning');
        return;
      }

      for (const jogador of this.gerenciarJogadoresSelecionadosExistentes) {
        await api.post('/mover', {
          jogadorId: jogador.id,
          novoTimeId: this.time.id
        });
      }

      Swal.fire(
        'Sucesso',
        `${this.gerenciarJogadoresSelecionadosExistentes.length} jogador(es) adicionados ao time!`,
        'success'
      );
    },
    async adicionarJogadoresEmMassaGerenciar() {
      const entradasDigitadas = this.gerenciarNomesJogadoresMassa
        .split(/[\n,]+/)
        .map(entrada => entrada.trim())
        .filter(entrada => entrada.length > 0);

      if (entradasDigitadas.length === 0) {
        Swal.fire('Atenção', 'Informe ao menos um jogador no formato nome número', 'warning');
        return;
      }

      const invalidas = [];
      const jogadoresDigitados = [];
      for (const entrada of entradasDigitadas) {
        const jogador = this.normalizarLinhaJogadorMassa(entrada);
        if (!jogador) {
          invalidas.push(entrada);
          continue;
        }
        jogadoresDigitados.push(jogador);
      }

      if (invalidas.length > 0) {
        Swal.fire(
          'Atenção',
          `Formato inválido em ${invalidas.length} item(ns).\nUse: nome número`,
          'warning'
        );
        return;
      }

      const jogadoresPorNumeroTime = new Map(
        this.jogadores
          .map(j => [this.normalizarNumeroJogador(j?.numero), j])
          .filter(([numero]) => numero !== null)
      );
      const numerosExistentesNoTime = [];
      const jogadoresParaAdicionar = [];
      const numerosNoLote = new Set();
      const numerosDuplicadosNoLote = new Set();

      for (const jogador of jogadoresDigitados) {
        if (numerosNoLote.has(jogador.numero)) {
          numerosDuplicadosNoLote.add(jogador.numero);
          continue;
        }
        numerosNoLote.add(jogador.numero);

        if (jogadoresPorNumeroTime.has(jogador.numero)) {
          const jogadorConflito = jogadoresPorNumeroTime.get(jogador.numero);
          numerosExistentesNoTime.push(`${jogador.numero} (${jogadorConflito.nome})`);
          continue;
        }

        jogadoresParaAdicionar.push(jogador);
      }

      if (jogadoresParaAdicionar.length === 0) {
        let mensagem = 'Nenhum jogador foi adicionado.';
        if (numerosExistentesNoTime.length > 0) {
          mensagem += `\n\nNúmeros já usados no time:\n${numerosExistentesNoTime.join(', ')}`;
        }
        if (numerosDuplicadosNoLote.size > 0) {
          mensagem += `\n\nNúmeros duplicados no lote:\n${Array.from(numerosDuplicadosNoLote).join(', ')}`;
        }
        Swal.fire('Atenção', mensagem, 'warning');
        return;
      }

      const FOTO_PADRAO = 'https://pub-8c7959cad5c04469b16f4b0706a2e931.r2.dev/uploads/Imagem%20padrao.png';
      for (const jogador of jogadoresParaAdicionar) {
        await api.post('/adicionar', {
          nome: jogador.nome,
          numero: jogador.numero,
          foto: FOTO_PADRAO,
          timeId: this.time.id
        });
      }

      let mensagem = `${jogadoresParaAdicionar.length} jogador(es) adicionados com sucesso!`;
      if (numerosExistentesNoTime.length > 0) {
        mensagem += `\n\nNúmeros já usados no time:\n${numerosExistentesNoTime.join(', ')}`;
      }
      if (numerosDuplicadosNoLote.size > 0) {
        mensagem += `\n\nNúmeros duplicados no lote:\n${Array.from(numerosDuplicadosNoLote).join(', ')}`;
      }
      Swal.fire('Sucesso', mensagem, 'success');
    },
    async removerJogadorGerenciar() {
      if (this.gerenciarJogadoresSelecionadosRemover.length === 0) return;
      for (const jogador of this.gerenciarJogadoresSelecionadosRemover) {
        await api.delete(`/remover/${this.time.id}/${jogador.id}`);
      }

      Swal.fire('Sucesso', `${this.gerenciarJogadoresSelecionadosRemover.length} jogador(es) removido(s)!`, 'success');
    },
    handleErrorGerenciar(err) {
      console.error(err);
      const mensagem = err.response?.data?.message;
      Swal.fire('Erro', mensagem, 'error');
    },
    async confirmarGerenciar() {
      if (this.gerenciarSalvando) return;
      this.gerenciarSalvando = true;

      try {
        const acaoExecutada = this.gerenciarAcaoLocal;

        if (this.gerenciarAcaoLocal === 'adicionar') await this.adicionarJogadorGerenciar();
        else if (this.gerenciarAcaoLocal === 'adicionarExistente') await this.adicionarJogadorExistenteGerenciar();
        else if (this.gerenciarAcaoLocal === 'remover') await this.removerJogadorGerenciar();
        else if (this.gerenciarAcaoLocal === 'adicionarMassa') await this.adicionarJogadoresEmMassaGerenciar();

        if (acaoExecutada !== 'adicionar') {
          this.fecharModalGerenciarJogadores();
        }

        this.$emit('atualizar-lista');
        if (this.time?.id) {
          await this.carregarJogadores(this.time.id);
        }

        if (acaoExecutada === 'adicionar') {
          this.limparFormularioAdicionarJogador();
          await this.carregarJogadoresGerenciar();
          return;
        }
      } catch (err) {
        this.handleErrorGerenciar(err);
      } finally {
        this.gerenciarSalvando = false;
      }
    },
    async carregarFuncoes() {
      console.log('Carregando funções para modalidadeId:', this.modalidadeSelecionadaId);

      if (!this.modalidadeSelecionadaId) {
        this.funcoes = [];
        return;
      }

      try {
        const res = await api.get(`/listar/funcoes`, {
          params: { modalidadeId: this.modalidadeSelecionadaId }
        });
        this.funcoes = res.data || [];
      } catch (err) {
        console.error('Erro da API:', err);
        this.funcoes = [];
      }
    },
    async carregarJogadores(timeId) {
      this.isLoading = true;

      try {
        const res = await api.get(`/time/${timeId}`);
        const lista = [];

        res.data.forEach(j => {
          let funcaoId = '';
          if (j.funcao) {
            funcaoId = j.funcao.id;
          }

          lista.push({
            id: j.id,
            nome: j.nome,
            numero: j.numero,
            foto: j.foto,
            funcao: j.funcao,
            funcaoId
          });
        });

        this.jogadores = lista;
      } catch (err) {
        console.error(err);
        this.jogadores = [];
      } finally {
        this.isLoading = false;
      }
    },
    registrarFuncaoAnterior(jogador) {
      if (!jogador?.id) return;
      this.funcaoAnteriorPorJogador[jogador.id] = jogador.funcaoId ?? null;
    },
    async onChangeFuncaoJogador(jogador, evento) {
      if (!jogador?.id) return;

      const valorSelecionado = evento?.target?.value ?? jogador.funcaoId;
      const funcaoAnterior = this.funcaoAnteriorPorJogador[jogador.id] ?? jogador.funcao?.id ?? null;

      if (String(valorSelecionado) === this.novaFuncaoValue) {
        const { isConfirmed, value } = await Swal.fire({
          title: 'Nova posição',
          text: 'Digite o nome da nova posição para esta modalidade.',
          input: 'text',
          inputPlaceholder: 'Ex: Atacante',
          showCancelButton: true,
          confirmButtonText: 'Criar',
          cancelButtonText: 'Cancelar'
        });

        if (!isConfirmed || !String(value || '').trim()) {
          jogador.funcaoId = funcaoAnterior;
          return;
        }

        try {
          const resposta = await api.post('/adicionar/funcao', {
            nome: String(value).trim(),
            modalidadeId: Number(this.modalidadeSelecionadaId)
          });

          const novaFuncao = resposta?.data;
          if (novaFuncao?.id) {
            if (!this.funcoes.some(f => Number(f.id) === Number(novaFuncao.id))) {
              this.funcoes.push(novaFuncao);
            }
            jogador.funcaoId = Number(novaFuncao.id);
            await this.alterarFuncao(jogador.id, jogador.funcaoId);
            return;
          }
        } catch (erroCriar) {
          console.error('Erro ao criar função:', erroCriar);
          await Swal.fire('Erro', erroCriar?.response?.data?.message || 'Não foi possível criar a função.', 'error');
        }

        jogador.funcaoId = funcaoAnterior;
        return;
      }

      await this.alterarFuncao(jogador.id, valorSelecionado);
    },
    async alterarFuncao(jogadorId, funcaoId) {
      const valorNormalizado = funcaoId ? Number(funcaoId) : null;
      this.alterandoFuncaoJogadorId = jogadorId;

      try {
        const resposta = await api.put(`/funcao/${jogadorId}`, { funcaoId: valorNormalizado });
        const jogadorAtualizado = resposta?.data;
        const jogadorLista = this.jogadores.find(j => Number(j.id) === Number(jogadorId));

        if (jogadorLista) {
          jogadorLista.funcaoId = valorNormalizado;
          jogadorLista.funcao = jogadorAtualizado?.funcao || this.funcoes.find(f => Number(f.id) === Number(valorNormalizado)) || null;
        }
      } catch (err) {
        console.error('Erro ao atualizar função:', err);
        const jogadorLista = this.jogadores.find(j => Number(j.id) === Number(jogadorId));
        if (jogadorLista) {
          jogadorLista.funcaoId = this.funcaoAnteriorPorJogador[jogadorId] ?? jogadorLista.funcaoId;
        }
        await Swal.fire('Erro', err?.response?.data?.message || 'Não foi possível atualizar a posição.', 'error');
      } finally {
        this.alterandoFuncaoJogadorId = null;
      }
    },
    gerenciarImagem(jogador) {
      Swal.fire({
        title: 'Imagem do jogador',
        text: 'O que você deseja fazer?',
        icon: 'question',
        showDenyButton: true,
        confirmButtonText: 'Trocar imagem',
        denyButtonText: 'Ver imagem',
        cancelButtonText: 'Cancelar',
        showCancelButton: true
      }).then(result => {
        if (result.isConfirmed) {
          this.jogadorImagemAtual = jogador;
          this.$refs.inputTrocarImagem.click();
        }

        if (result.isDenied) {
          Swal.fire({
            imageUrl: jogador.foto,
            imageAlt: jogador.nome,
            showConfirmButton: false,
            width: 400
          });
        }
      });
    },
    async handleTrocarImagem(event) {
      const file = event.target.files[0];
      if (!file || !this.jogadorImagemAtual) return;

      try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const fotoUrl = uploadRes.data.fileUrl || uploadRes.data.url;
        await api.put('/alterar/foto', {
          jogadorId: this.jogadorImagemAtual.id,
          foto: fotoUrl
        });

        this.jogadorImagemAtual.foto = fotoUrl;
        Swal.fire('Sucesso', 'Imagem alterada com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        Swal.fire('Erro', 'Erro ao alterar imagem do jogador', 'error');
      } finally {
        event.target.value = '';
        this.jogadorImagemAtual = null;
      }
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
}

.modal-conteudo.modal-placar {
  background: #fff;
  border-radius: 16px;
  padding: 26px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: min(960px, 100%);
  max-height: 92vh;
  overflow: hidden;
  box-sizing: border-box;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.header-placar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.title_placar {
  color: #3b82f6;
  font-size: 24px;
  font-weight: 900;
  margin: 0;
}

.btn-gerenciar {
  background: #3b82f6;
  color: #fff;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(59, 130, 246, 0.35);
  cursor: pointer;
  font-weight: 800;
  transition: transform 0.15s ease, background-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 10px 18px rgba(59, 130, 246, 0.22);
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.btn-gerenciar:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(59, 130, 246, 0.28);
}

.btn-gerenciar:active {
  transform: translateY(0);
}

.loader-container-centralizado,
.sem-dados-centralizado {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 240px;
  font-size: 16px;
  font-weight: 700;
  color: #475569;
}

.sem-dados-centralizado {
  flex-direction: column;
  gap: 12px;
  text-align: center;
}

.sem-dados-texto {
  margin: 0;
}

.sem-dados-acoes {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 2px;
}

.btn-sem-dados-acao {
  flex: 0 0 auto;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.btn-sem-dados-acao:hover {
  background: #dbeafe;
  border-color: rgba(59, 130, 246, 0.55);
  transform: translateY(-1px);
}

.loader {
  border: 6px solid #f3f3f3;
  border-top: 6px solid #3b82f6;
  border-radius: 50%;
  width: 78px;
  height: 78px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.placar-table {
  max-height: 58vh;
  overflow: auto;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
  position: relative;
  isolation: isolate;
}

.placar-table::-webkit-scrollbar {
  height: 10px;
  width: 10px;
}

.placar-table::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.35);
  border-radius: 999px;
}

.placar-table::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.55);
}

.placar {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 720px;
}

.placar thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #1e3a8a;
  color: #fff;
  font-weight: 900;
  padding: 12px 12px;
  font-size: 14px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.placar tbody td:first-child {
  position: sticky;
  left: 0;
  background: #fff;
  z-index: 3;
}

.placar thead th:first-child {
  position: sticky;
  left: 0;
  background: #1e3a8a;
  z-index: 4;
}

.placar tbody td {
  color: #334155;
  padding: 12px;
  font-size: 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  background: #fff;
}

.placar tbody tr:hover td {
  background: #f8fafc;
}

.placar tbody td:nth-child(2),
.placar thead th:nth-child(2) {
  text-align: center;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.numero-jogador {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  border: 1px solid #93c5fd;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  flex-shrink: 0;
}

.time-image {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 50%;
  border: 1px solid rgba(59, 130, 246, 0.35);
  background: #fff;
}

.time-image-click {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.time-image-click:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.12);
}

.select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 220px;
  max-width: 100%;
}

.select-funcao {
  width: 100%;
  appearance: none;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.14);
  color: #0f172a;
  border-radius: 12px;
  padding: 10px 38px 10px 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.select-funcao:hover {
  border-color: rgba(59, 130, 246, 0.55);
}

.select-funcao:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

.select-arrow {
  position: absolute;
  right: 12px;
  pointer-events: none;
  font-size: 14px;
  color: #334155;
}

.btn-cancel-placar {
  background: transparent;
  color: #3b82f6;
  padding: 12px 16px;
  border: 1px solid rgba(37, 99, 235, 0.35);
  border-radius: 999px;
  cursor: pointer;
  width: 100%;
  font-weight: 900;
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.btn-cancel-placar:hover {
  background: rgba(37, 99, 235, 0.06);
  border-color: rgba(37, 99, 235, 0.55);
  transform: translateY(-1px);
}

.btn-gerenciar-icone {
  display: none;
}

.modal-overlay-gerenciar {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  padding: 18px;
}

.modal-content-gerenciar {
  width: min(720px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  overflow-x: visible;
  background: #fff;
  border-radius: 16px;
  padding: 22px 22px 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.28);
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.modal-content-gerenciar.modal-content-gerenciar-sem-scroll {
  overflow-y: hidden;
}

.modal-header-gerenciar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  margin-bottom: 14px;
}

.modal-header-gerenciar h2 {
  margin: 0;
  color: #3b82f6;
  font-size: 22px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: -0.2px;
}

.btn-close-x-gerenciar {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(37, 99, 235, 0.35);
  border-radius: 999px;
  background: #fff;
  color: #3b82f6;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, color 0.2s ease;
}

.btn-close-x-gerenciar:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.35);
  color: #ef4444;
  transform: translateY(-1px);
}

.abas-container-gerenciar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
  margin-bottom: 14px;
}

.aba-gerenciar {
  flex: 1 1 140px;
  text-align: center;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  background: transparent;
  font-weight: 800;
  color: #334155;
  transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease, color 0.2s ease;
  user-select: none;
  border: 1px solid transparent;
}

.aba-gerenciar:hover {
  background: rgba(59, 130, 246, 0.08);
  transform: translateY(-1px);
}

.aba-gerenciar.ativa {
  background: #3b82f6;
  color: #fff;
  box-shadow: 0 12px 22px rgba(37, 99, 235, 0.22);
  border-color: rgba(255, 255, 255, 0.18);
}

.conteudo-aba-gerenciar {
  margin-top: 10px;
}

.form-group-gerenciar label {
  display: inline-block;
  font-size: 13px;
  font-weight: 800;
  color: #475569;
  margin: 10px 0 6px;
}

.dropdown-gerenciar {
  width: 100%;
  padding: 12px 12px;
  margin-bottom: 10px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  font-size: 14px;
  color: #0f172a;
  background: #fff;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.dropdown-gerenciar:hover {
  border-color: rgba(59, 130, 246, 0.55);
}

.dropdown-gerenciar:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

textarea.dropdown-gerenciar {
  resize: vertical;
  min-height: 110px;
}

.dropdown-custom-gerenciar {
  position: relative;
  cursor: pointer;
  margin-top: 8px;
  margin-bottom: 10px;
  width: 100%;
}

.dropdown-selected-gerenciar {
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

.dropdown-selected-gerenciar:hover {
  border-color: rgba(59, 130, 246, 0.55);
}

.dropdown-selected-gerenciar:active {
  transform: translateY(0);
}

.dropdown-selected-gerenciar img.avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid rgba(59, 130, 246, 0.25);
}

.dropdown-list-gerenciar {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 14px;
  max-height: 280px;
  overflow-y: auto;
  z-index: 1300;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
  padding: 6px 0;
}

.dropdown-list-gerenciar-solto {
  position: fixed;
  margin-top: 0;
}

.input-busca-jogador-gerenciar {
  width: calc(100% - 16px);
  margin: 6px 8px 8px;
  padding: 10px 10px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  outline: none;
  font-size: 14px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input-busca-jogador-gerenciar:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16);
}

.dropdown-list-gerenciar ul {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 210px;
  overflow-y: auto;
}

.dropdown-list-gerenciar li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.dropdown-list-gerenciar li:hover {
  background: #f8fafc;
}

.dropdown-list-gerenciar img.avatar {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.sem-jogador-gerenciar {
  padding: 12px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.selecionado {
  background: rgba(59, 130, 246, 0.12);
  font-weight: 900;
}

.botoes-gerenciar {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.btn-save1-gerenciar {
  flex: 1;
  padding: 12px 0;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  color: #fff;
  font-size: 15px;
  font-weight: 900;
  background: #3b82f6;
  box-shadow: 0 14px 26px rgba(37, 99, 235, 0.22);
  transition: transform 0.15s ease, background-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.btn-save1-gerenciar:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(37, 99, 235, 0.28);
}

.btn-save1-gerenciar:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
  box-shadow: none;
}

.btn-save1-gerenciar-loading {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  animation: girar-btn-save 0.7s linear infinite;
}

@keyframes girar-btn-save {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .modal-conteudo.modal-placar {
    width: 100%;
    padding: 16px;
    border-radius: 12px;
  }

  .header-placar {
    gap: 10px;
  }

  .title_placar {
    font-size: 18px;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .btn-gerenciar {
    flex-shrink: 0;
    width: auto;
    padding: 10px 12px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .btn-gerenciar-texto {
    display: none;
  }

  .btn-gerenciar-icone {
    display: inline-block;
    width: 18px;
    height: 18px;
  }

  .placar {
    min-width: 0;
    width: 100%;
  }

  .placar thead th {
    font-size: 13px;
    padding: 9px 8px;
  }

  .placar tbody td {
    font-size: 13px;
    padding: 8px;
  }

  .time-image {
    width: 28px;
    height: 28px;
  }

  .numero-jogador {
    min-width: 28px;
    height: 20px;
    padding: 0 7px;
    font-size: 11px;
  }

  .select-wrap {
    width: 170px;
  }

  .select-funcao {
    font-size: 12px;
    padding: 8px 34px 8px 10px;
    border-radius: 10px;
  }

  .placar-table {
    max-height: 52vh;
  }

  .btn-cancel-placar {
    font-size: 14px;
    padding: 10px 12px;
  }

  .btn-sem-dados-acao {
    min-height: 34px;
    font-size: 12px;
    padding: 0 12px;
  }

  .modal-overlay-gerenciar {
    align-items: flex-start;
    padding: 16px 10px;
  }

  .modal-content-gerenciar {
    width: 100%;
    max-width: 100%;
    padding: 16px;
    border-radius: 14px;
  }

  .modal-header-gerenciar h2 {
    font-size: 18px;
  }

  .botoes-gerenciar {
    gap: 10px;
  }

  .btn-save1-gerenciar {
    font-size: 14px;
  }

  .abas-container-gerenciar {
    gap: 8px;
    padding: 8px;
  }

  .aba-gerenciar {
    flex: 1 1 48%;
    font-size: 13px;
    padding: 10px 8px;
  }

}
</style>


