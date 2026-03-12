<template>
  <div class="modal-overlay" @click.self="$emit('fechar')">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">{{ quadra?.nome }}</h2>
        <button type="button" class="btn-close-x" @click="$emit('fechar')" aria-label="Fechar modal">
          x
        </button>
      </div>

      <div class="tabs-container" v-if="podeAgendarFixo">
        <div class="tabs-list">
          <button class="tab-item separator-right" :class="{ active: modoAgendamento === 'avulso' }"
            @click="modoAgendamento = 'avulso'">
            Agendamento Avulso
          </button>
          <button class="tab-item" :class="{ active: modoAgendamento === 'fixo' }" @click="modoAgendamento = 'fixo'">
            Agendamento Fixo (Mensal)
          </button>
        </div>
      </div>

      <div class="modal-body">

        <div v-if="modoAgendamento === 'avulso'">
          <div class="campo mb-3">
            <label><strong>Tipo de agendamento:</strong></label>
            <select v-model="tipo" class="form-select">
              <option disabled value="">Selecione</option>
              <option value="TREINO">Treino - 24h de antecedência</option>
              <option value="AMISTOSO">Amistoso - 7 dias de antecedência</option>
              <option value="EVENTO">Evento - 180 dias de antecedência</option>
              <option value="AULA">Aula - 24h de antecedência</option>
              <option value="OUTRO">Outro - 24h de antecedência</option>
            </select>
          </div>

          <div v-if="exigeTimeTreinador" class="campo mb-3">
            <label><strong>Time:</strong></label>
            <div class="select-wrapper">
              <select v-model="timeSelecionado" class="form-select">
                <option disabled :value="null">Selecione um time</option>
                <option v-for="t in times" :key="t.id" :value="Number(t.id)">
                  {{ t.nome }}
                </option>
              </select>
            </div>
          </div>

          <div v-if="exigeModalidade" class="campo mb-3">
            <label><strong>Modalidade:</strong></label>
            <div class="select-wrapper">
              <div v-if="isLoadingModalidades" class="loader"></div>
              <select v-else v-model="modalidadeSelecionada" class="form-select">
                <option disabled :value="null">Selecione</option>
                <option v-for="m in modalidades" :key="m.id" :value="Number(m.id)">
                  {{ m.nome }}
                </option>
              </select>
            </div>
          </div>

          <div v-if="tipoUpper === 'AULA'" class="campo mb-3">
            <label><strong>Escola:</strong></label>
            <div class="select-wrapper">
              <select v-model="escolaSelecionada" class="form-select">
                <option disabled :value="null">Selecione a escola</option>
                <option v-for="escola in escolasAula" :key="escola.codigo" :value="escola.codigo">
                  {{ escola.codigo }} - {{ escola.nome }}
                </option>
              </select>
            </div>
          </div>

          <div v-if="tipoUpper === 'OUTRO'" class="campo mb-3">
            <label><strong>Descrição do agendamento:</strong></label>
            <textarea
              v-model="descricaoOutro"
              class="form-textarea"
              rows="3"
              maxlength="250"
              placeholder="Descreva o motivo do agendamento"
            ></textarea>
          </div>

          <div class="linha-selects">
            <div class="campo">
              <label><strong>Data:</strong></label>
              <Datepicker v-model="data" teleport="body" :teleport-center="true" position="center" locale="pt-BR" cancelText="Cancelar" selectText="Selecionar"
                :week-start="0" :day-names="['D', 'S', 'T', 'Q', 'Q', 'S', 'S']" :min-date="minDateObj"
                :max-date="maxDateObj" :allowed-dates="verificarDataPermitida" :day-class="getDayClass"
                :enable-time-picker="false" auto-apply @update:model-value="gerarHorariosDisponiveis"
                :format="formatDate" placeholder="Escolha um dia"
                input-class-name="form-select dp-custom-input" />
            </div>

            <div class="campo" v-if="exibirDuracao">
              <label><strong>Duração:</strong></label>
              <select v-model="duracao" class="form-select">
                <option disabled value="">Duração</option>
                <option value="1">1 hora</option>
                <option value="2">2 horas</option>
              </select>
            </div>
          </div>

          <div v-if="mostrarAvisoEncaixeHoje" class="alerta-encaixe-hoje">
            <strong>Atenção:</strong> para hoje, agendamentos por encaixe devem ser solicitados com pelo menos
            1 hora de antecedência do horário escolhido.
          </div>

          <div v-if="diaFechado" class="alerta-fechado">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>A quadra não está disponível nesta data ({{ nomeDiaSemanaSelecionado }}).</span>
          </div>

          <div v-else>
            <label v-if="data && horariosDisponiveis.length === 0"><strong>Horários Disponíveis:</strong></label>
            <label v-if="horariosDisponiveis.length > 0"><strong>Horários Disponíveis:</strong></label>
            <div v-if="isLoadingHorarios" class="horarios-loading">
              <span class="loader-horarios" aria-hidden="true"></span>
              <span>Carregando horários...</span>
            </div>
            <div v-else class="horarios-grid">
              <button v-for="h in horariosDisponiveis" :key="h" :class="{ selecionado: h === hora }"
                :disabled="horariosIndisponiveis.includes(h)" @click="hora = h" class="btn-horario">
                {{ h }}
              </button>
            </div>
            <p v-if="data && horariosDisponiveis.length === 0 && !diaFechado && !isLoadingHorarios" class="msg-sem-horario">
              Não há horários livres para este dia.
            </p>
          </div>
        </div>

        <div v-else class="modo-fixo-container">
          <div v-if="exigeTimeTreinador" class="campo mb-3">
            <label><strong>Time:</strong></label>
            <div class="select-wrapper">
              <select v-model="timeSelecionado" class="form-select">
                <option disabled :value="null">Selecione um time</option>
                <option v-for="t in times" :key="t.id" :value="Number(t.id)">
                  {{ t.nome }}
                </option>
              </select>
            </div>
          </div>
          <div v-if="exigeModalidade" class="campo mb-3">
            <label><strong>Modalidade:</strong></label>
            <div class="select-wrapper">
              <div v-if="isLoadingModalidades" class="loader"></div>
              <select v-else v-model="modalidadeSelecionada" class="form-select">
                <option disabled :value="null">Selecione</option>
                <option v-for="m in modalidades" :key="m.id" :value="Number(m.id)">
                  {{ m.nome }}
                </option>
              </select>
            </div>
          </div>
          <div class="info-box">
            <p><strong>Treino Fixo:</strong> Selecione até <strong>2 dias</strong> da semana. O sistema agendará
              automaticamente para as próximas 5 semanas.</p>
          </div>

          <div class="campo mb-3" v-if="exibirDuracao">
            <label><strong>Duração dos treinos:</strong></label>
            <select v-model="duracao" class="form-select">
              <option disabled value="">Duração</option>
              <option value="1">1 hora</option>
              <option value="2">2 horas</option>
            </select>
          </div>

          <label><strong>Dias da Semana (Máx. 2):</strong></label>
          <div class="dias-semana-grid">
            <template v-for="(dia, index) in diasSemanaCompleto" :key="index">
              <button v-if="diasComFuncionamento.includes(index)" class="btn-dia-semana"
                :class="{ active: diasFixosSelecionados.includes(index) }"
                :disabled="!diasFixosSelecionados.includes(index) && diasFixosSelecionados.length >= 2"
                @click="toggleDiaFixo(index)">
                {{ dia }}
              </button>
            </template>
          </div>

          <div v-if="diasFixosSelecionados.length > 0" class="config-horarios-fixos">

            <div v-for="diaIndex in diasFixosSelecionados.sort()" :key="diaIndex" class="bloco-dia-fixo">
              <div class="titulo-dia-fixo">
                <strong>{{ diasSemanaCompleto[diaIndex] }}:</strong>
                <span class="subtexto-horario" v-if="!horariosFixos[diaIndex]">(Selecione um horário)</span>
                <span class="subtexto-horario selecionado" v-else>Selecionado: {{ horariosFixos[diaIndex] }}</span>
              </div>

              <div class="horarios-grid fixo-grid">
                <button v-for="h in getHorariosPermitidosParaDiaFixo(diaIndex)" :key="h" class="btn-horario"
                  :class="{ selecionado: horariosFixos[diaIndex] === h }" @click="horariosFixos[diaIndex] = h">
                  {{ h }}
                </button>

                <p v-if="getHorariosPermitidosParaDiaFixo(diaIndex).length === 0" class="msg-sem-horario-sm">
                  Fechado neste dia.
                </p>
              </div>
            </div>

          </div>
        </div>

        <div class="modal-actions">
          <button @click="confirmarGeral" class="btn-confirmar" :disabled="!validarFormulario()">
            {{ modoAgendamento === 'fixo' ? 'Gerar Agendamentos' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2'
import { useAuthStore } from '@/store'
import api from '@/axios'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

export default {
  name: 'AgendamentoModal',
  components: { Datepicker },
  props: {
    quadra: Object,
    times: { type: Array, default: () => [] },
    usarDadosPrecarregados: { type: Boolean, default: false },
    modalidadesPrecarregadas: { type: Array, default: () => [] },
    gradeConfigPrecarregada: { type: Array, default: () => [] }
  },
  emits: ['confirmar', 'fechar'],

  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },

  data() {
    const agora = new Date()
    const umMes = new Date()
    umMes.setMonth(agora.getMonth() + 1)

    return {
      modoAgendamento: 'avulso',
      timeSelecionado: null,
      modalidades: [],
      modalidadeSelecionada: null,
      isLoadingModalidades: true,
      tipo: "",
      duracao: "",
      data: null,
      hora: "",
      escolaSelecionada: null,
      descricaoOutro: '',
      escolasAula: [
        { codigo: 'EEAF', nome: 'Escola Estadual Aristófanes Fernandes' },
        { codigo: 'EEJAM', nome: 'Escola Estadual Joaquim Adelino de Medeiros' },
        { codigo: 'EMFPA', nome: 'Escola Municipal Francisca Pires de Medeiros' },
        { codigo: 'CEMEI', nome: 'Centro Municipal de Ensino Infantil Professor José Felicio' },
        { codigo: 'DANÇA', nome: 'Dança' },
      ],
      minDateObj: agora,
      maxDateObj: umMes,

      gradeConfig: [],
      diaFechado: false,
      nomeDiaSemanaSelecionado: '',

      horariosDisponiveis: [],
      horariosIndisponiveis: [],
      isLoadingHorarios: false,

      diasSemanaCompleto: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
      diasFixosSelecionados: [],
      horariosFixos: {},
    }
  },

  computed: {
    podeSelecionarTime() {
      return [1, 2, 5].includes(Number(this.authStore.usuario?.permissaoId));
    },
    podeAgendarFixo() {
      const p = this.authStore.usuario?.permissaoId;
      return p === 1 || p === 2 || p === 5;
    },
    tipoUpper() {
      return String(this.tipo || '').toUpperCase().trim();
    },
    timeSelecionadoObj() {
      const idTime = Number(this.timeSelecionado);
      if (!Number.isInteger(idTime) || idTime <= 0) return null;
      return (Array.isArray(this.times) ? this.times : [])
        .find((time) => Number(time?.id) === idTime) || null;
    },
    exigeTimeTreinador() {
      if (!this.podeSelecionarTime) return false;
      if (this.modoAgendamento === 'fixo') return true;
      return this.tipoUpper === 'TREINO' || this.tipoUpper === 'AMISTOSO';
    },
    exigeModalidade() {
      if (this.podeSelecionarTime) return false;
      if (this.modoAgendamento === 'fixo') return true;
      return this.tipoUpper === 'TREINO' || this.tipoUpper === 'AMISTOSO';
    },
    modalidadePadronizada() {
      let nomeModalidade = "";

      if (this.podeSelecionarTime) {
        nomeModalidade = this.timeSelecionadoObj?.modalidade?.nome || "";
      } else if (this.exigeModalidade) {
        const modalidadeSelecionada = this.modalidades.find(m => Number(m.id) === Number(this.modalidadeSelecionada));
        nomeModalidade = modalidadeSelecionada?.nome || "";
      }

      return String(nomeModalidade || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();
    },
    exibirDuracao() {
      if (!this.exigeModalidade) return false;
      const modalidadesDuracao = ['volei', 'volei de areia', 'futevolei']
      return modalidadesDuracao.includes(this.modalidadePadronizada)
    },
    mostrarAvisoEncaixeHoje() {
      if (this.modoAgendamento !== 'avulso') return false;
      if (!this.data) return false;
      return this.ehDataHoje(this.data);
    },
    diasComFuncionamento() {
      if (!this.gradeConfig || this.gradeConfig.length === 0) {
        return [0, 1, 2, 3, 4, 5, 6];
      }
      const diasSet = new Set();
      this.gradeConfig.forEach(g => {
        if (g.diaSemana !== undefined) diasSet.add(Number(g.diaSemana));
        if (g.dia_semana !== undefined) diasSet.add(Number(g.dia_semana));
      });
      return Array.from(diasSet);
    }
  },

  watch: {
    tipo() {
      if (this.podeSelecionarTime && !this.exigeTimeTreinador) {
        this.timeSelecionado = null;
      }
      if (!this.exigeModalidade) {
        this.modalidadeSelecionada = null;
      }
      if (this.tipoUpper !== 'AULA') {
        this.escolaSelecionada = null;
      }
      if (this.tipoUpper !== 'OUTRO') {
        this.descricaoOutro = '';
      }
    },
    modoAgendamento() {
      if (this.podeSelecionarTime && !this.exigeTimeTreinador) {
        this.timeSelecionado = null;
      }
      if (!this.exigeModalidade) {
        this.modalidadeSelecionada = null;
      }
      if (this.modoAgendamento !== 'avulso' || this.tipoUpper !== 'AULA') {
        this.escolaSelecionada = null;
      }
      if (this.modoAgendamento !== 'avulso' || this.tipoUpper !== 'OUTRO') {
        this.descricaoOutro = '';
      }
    },
    timeSelecionado() {
      if (!this.podeSelecionarTime) return;
      this.modalidadeSelecionada = this.obterModalidadeIdParaAgendamento();
    },
  },

  async mounted() {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('agend-modal-datepicker-open');

    if (this.usarDadosPrecarregados) {
      this.modalidades = Array.isArray(this.modalidadesPrecarregadas) ? this.modalidadesPrecarregadas : [];
      this.gradeConfig = Array.isArray(this.gradeConfigPrecarregada) ? this.gradeConfigPrecarregada : [];
      this.isLoadingModalidades = false;
      return;
    }

    try {
      if (this.quadra?.id) {
        const modRes = await api.get(`/quadra/${this.quadra.id}/modalidades`)
        this.modalidades = modRes.data

        try {
          const gradeRes = await api.get(`/grade-horarios/${this.quadra.id}`)
          let dados = gradeRes.data;
          if (Array.isArray(dados)) {
            this.gradeConfig = dados;
          } else {
            this.gradeConfig = [];
          }
        } catch (e) {
          console.warn("Sem grade configurada, usando padrão.", e);
          this.gradeConfig = [];
        }
      }
    } catch (err) {
      console.error("Erro inicial:", err)
    } finally {
      this.isLoadingModalidades = false
    }
  },

  unmounted() {
    document.body.style.overflow = '';
    document.body.classList.remove('agend-modal-datepicker-open');
  },

  methods: {
    obterTimeIdParaAgendamento() {
      if (!this.exigeTimeTreinador) return null;
      const idTime = Number(this.timeSelecionado);
      return Number.isInteger(idTime) && idTime > 0 ? idTime : null;
    },
    obterModalidadeIdParaAgendamento() {
      if (this.podeSelecionarTime) {
        const idModalidade = Number(
          this.timeSelecionadoObj?.modalidadeId || this.timeSelecionadoObj?.modalidade?.id
        );
        return Number.isInteger(idModalidade) && idModalidade > 0 ? idModalidade : null;
      }
      if (!this.exigeModalidade) return null;
      const idModalidade = Number(this.modalidadeSelecionada);
      return Number.isInteger(idModalidade) && idModalidade > 0 ? idModalidade : null;
    },
    obterEscolaAulaParaAgendamento() {
      if (this.tipoUpper !== 'AULA') return null;
      const escola = String(this.escolaSelecionada || '').trim();
      return escola || null;
    },
    obterDescricaoOutroParaAgendamento() {
      if (this.tipoUpper !== 'OUTRO') return null;
      const descricao = String(this.descricaoOutro || '').trim();
      return descricao || null;
    },
    verificarDataPermitida(date) {
      const dia = date.getDay();
      return this.diasComFuncionamento.includes(dia);
    },

    getDayClass(date) {
      const dia = date.getDay();
      if (!this.diasComFuncionamento.includes(dia)) {
        return 'dia-fechado-visual';
      }
      return '';
    },

    getDiaSemanaSeguro(dateObj) {
      if (!dateObj) return null;
      const safeDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 12, 0, 0);
      return safeDate.getDay();
    },
    ehDataHoje(dateObj) {
      if (!dateObj) return false;
      const dataSelecionada = new Date(dateObj);
      if (Number.isNaN(dataSelecionada.getTime())) return false;

      const hoje = new Date();
      return dataSelecionada.getFullYear() === hoje.getFullYear()
        && dataSelecionada.getMonth() === hoje.getMonth()
        && dataSelecionada.getDate() === hoje.getDate();
    },

    formatDateAPI(date) {
      if (!date) return '';
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    },

    normalizarHorario(valor) {
      if (valor === null || valor === undefined || valor === '') return '';
      if (typeof valor === 'number') {
        if (!Number.isFinite(valor) || valor < 0 || valor > 23) return '';
        return `${String(Math.trunc(valor)).padStart(2, '0')}:00`;
      }

      const texto = String(valor).trim();
      const match = texto.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
      if (!match) return '';

      const hora = Number(match[1]);
      const minuto = Number(match[2] ?? 0);
      if (!Number.isFinite(hora) || !Number.isFinite(minuto)) return '';
      if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59) return '';

      return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
    },

    normalizarListaHorarios(lista) {
      const unicos = new Set();
      (Array.isArray(lista) ? lista : []).forEach((item) => {
        const horario = this.normalizarHorario(item);
        if (horario) unicos.add(horario);
      });
      return Array.from(unicos).sort();
    },

    getGradePadrao() {
      const lista = [];
      for (let h = 7; h <= 23; h++) {
        lista.push(`${String(h).padStart(2, '0')}:00`);
      }
      return lista;
    },

    async gerarHorariosDisponiveis() {
      if (!this.data) {
        this.isLoadingHorarios = false;
        return;
      }

      this.hora = ""
      this.horariosDisponiveis = []
      this.horariosIndisponiveis = []
      this.diaFechado = false;
      this.isLoadingHorarios = true;

      const diaSemana = this.getDiaSemanaSeguro(this.data);
      this.nomeDiaSemanaSelecionado = this.diasSemanaCompleto[diaSemana];

      let horariosDaQuadra = [];

      if (!this.gradeConfig || this.gradeConfig.length === 0) {
        horariosDaQuadra = this.getGradePadrao();
      } else {
        const slotsDoDia = this.gradeConfig
          .filter(g => (g.diaSemana != undefined && g.diaSemana == diaSemana) || (g.dia_semana != undefined && g.dia_semana == diaSemana))
          .map(g => this.normalizarHorario(g.horario))
          .filter(Boolean);

        if (slotsDoDia.length > 0) {
          horariosDaQuadra = this.normalizarListaHorarios(slotsDoDia);
        } else {
          this.diaFechado = true;
          this.isLoadingHorarios = false;
          return;
        }
      }

      const horariosBase = this.normalizarListaHorarios(horariosDaQuadra);

      try {
        const dataStr = this.formatDateAPI(this.data)
        const [ano, mes, dia] = dataStr.split('-').map(Number);

        const { data: agendamentos } = await api.get(
          `/agendamentos/quadra/${this.quadra.id}/ocupados`,
          { params: { ano, mes, dia } }
        )

        const indisponiveisSet = new Set();

        agendamentos.forEach(a => {
          const horaBase = Number(a.hora);
          if (!Number.isFinite(horaBase)) return;

          for (let i = 0; i < (a.duracao ?? 1); i++) {
            const hString = this.normalizarHorario(horaBase + i);
            if (hString) indisponiveisSet.add(hString);
          }
        });

        this.horariosIndisponiveis = Array.from(indisponiveisSet).sort();

        this.horariosDisponiveis = horariosBase.filter(h => !this.horariosIndisponiveis.includes(h));
        this.horariosDisponiveis.sort();

      } catch (err) {
        console.error("Erro ao buscar agendamentos:", err)
        this.horariosDisponiveis = horariosBase;
      } finally {
        this.isLoadingHorarios = false;
      }
    },

    getHorariosPermitidosParaDiaFixo(diaIndex) {
      if (!this.gradeConfig || this.gradeConfig.length === 0) {
        return this.getGradePadrao();
      }

      const slots = this.gradeConfig
        .filter(g => (g.diaSemana != undefined && g.diaSemana == diaIndex) || (g.dia_semana != undefined && g.dia_semana == diaIndex))
        .map(g => this.normalizarHorario(g.horario))
        .filter(Boolean);

      return this.normalizarListaHorarios(slots);
    },

    validarFormulario() {
      if (this.exigeTimeTreinador && !this.obterTimeIdParaAgendamento()) return false;
      if (this.exigeModalidade && !this.obterModalidadeIdParaAgendamento()) return false;
      if (this.modoAgendamento === 'avulso') {
        if (!this.data || this.diaFechado || !this.hora || !this.tipo) return false;
        if (this.tipoUpper === 'AULA' && !this.obterEscolaAulaParaAgendamento()) return false;
        if (this.tipoUpper === 'OUTRO' && !this.obterDescricaoOutroParaAgendamento()) return false;
        if (this.exibirDuracao && !this.duracao) return false;
        return true;
      }
      else if (this.modoAgendamento === 'fixo') {
        if (this.diasFixosSelecionados.length === 0) return false;
        const todos = this.diasFixosSelecionados.every(dia => {
          const val = this.horariosFixos[dia];
          return val && val.length >= 4;
        });
        if (!todos) return false;
        if (this.exibirDuracao && !this.duracao) return false;
        return true;
      }
      return false;
    },

    confirmarGeral() {
      if (!this.authStore.usuario?.id) {
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Usuário não logado.', confirmButtonColor: '#1E3A8A' });
        return;
      }
      this.modoAgendamento === 'avulso' ? this.confirmarAvulso() : this.confirmarFixo();
    },

    formatDate(date) {
      if (!date) return '';
      const d = new Date(date)
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
    },

    confirmarAvulso() {
      const horaSelecionada = parseInt(this.hora.split(':')[0])
      const minutoSelecionado = parseInt(this.hora.split(':')[1] || '0')

      const dataStr = this.formatDateAPI(this.data)
      const [ano, mes, dia] = dataStr.split('-').map(Number);
      const duracaoFinal = this.exibirDuracao ? parseFloat(this.duracao) : 1;

      const datahora = new Date(ano, mes - 1, dia, horaSelecionada, minutoSelecionado, 0);

      this.$emit('confirmar', {
        usuarioId: this.authStore.usuario.id,
        quadraId: this.quadra.id,
        modalidadeId: this.obterModalidadeIdParaAgendamento(),
        timeId: this.obterTimeIdParaAgendamento(),
        dia, mes, ano,
        hora: horaSelecionada,
        datahora: datahora.toISOString(),
        duracao: duracaoFinal,
        tipo: this.tipo,
        escola: this.obterEscolaAulaParaAgendamento(),
        descricao: this.obterDescricaoOutroParaAgendamento(),
        fixo: false
      })
    },

    toggleDiaFixo(index) {
      if (this.diasFixosSelecionados.includes(index)) {
        this.diasFixosSelecionados = this.diasFixosSelecionados.filter(i => i !== index);
        delete this.horariosFixos[index];
      } else {
        const permitidos = this.getHorariosPermitidosParaDiaFixo(index);
        if (this.gradeConfig.length > 0 && permitidos.length === 0) {
          Swal.fire({ toast: true, icon: 'warning', title: 'A quadra não abre neste dia.', timer: 2000, showConfirmButton: false, position: 'top-end' });
          return;
        }
        if (this.diasFixosSelecionados.length < 2) {
          this.diasFixosSelecionados.push(index);
        } else {
          Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Limite de 2 dias fixos.', showConfirmButton: false, timer: 3000 });
        }
      }
    },

    confirmarFixo() {
      const agora = new Date();
      const agendamentosParaCriar = [];
      const duracaoFinal = this.exibirDuracao ? parseInt(this.duracao) : 1;

      const invalido = this.diasFixosSelecionados.some(dia => {
        const h = this.horariosFixos[dia];
        if (!h) return true;
        if (this.gradeConfig.length === 0) return false;
        return !this.getHorariosPermitidosParaDiaFixo(dia).includes(h);
      });

      if (invalido) {
        Swal.fire('Horário Inválido', 'Selecione um horário para cada dia marcado.', 'warning');
        return;
      }

      for (let i = 1; i <= 35; i++) {
        const dataFutura = new Date();
        dataFutura.setDate(agora.getDate() + i);
        const diaSemana = dataFutura.getDay();

        if (this.diasFixosSelecionados.includes(diaSemana)) {
          const horaString = this.horariosFixos[diaSemana];
          const [horaStr, minStr] = horaString.split(':');
          const horaInt = parseInt(horaStr);
          const minInt = parseInt(minStr || '0');

          const diffMs = dataFutura.setHours(horaInt, minInt, 0, 0) - new Date().getTime();
          if ((diffMs / (1000 * 60 * 60)) < 24) continue;

          const dataIso = new Date(dataFutura.getFullYear(), dataFutura.getMonth(), dataFutura.getDate(), horaInt, minInt, 0);

          agendamentosParaCriar.push({
            usuarioId: this.authStore.usuario.id,
            quadraId: this.quadra.id,
            modalidadeId: this.obterModalidadeIdParaAgendamento(),
            timeId: this.obterTimeIdParaAgendamento(),
            dia: dataFutura.getDate(),
            mes: dataFutura.getMonth() + 1,
            ano: dataFutura.getFullYear(),
            hora: horaInt,
            datahora: dataIso.toISOString(),
            duracao: duracaoFinal,
            tipo: 'TREINO',
            fixo: true
          });
        }
      }

      if (agendamentosParaCriar.length === 0) {
        Swal.fire('Ops!', 'Sem datas válidas (min 24h de antecedência).', 'warning');
        return;
      }
      this.$emit('confirmar', { lote: agendamentosParaCriar, fixo: true });
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  color: #4b5563;
  border-radius: 12px;
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

@media (min-width: 769px) {
  .modal-overlay {
    align-items: flex-start;
    padding: 84px 16px 16px;
    overflow-y: auto;
  }

  .modal-content {
    max-height: calc(100dvh - 100px);
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    align-items: flex-start;
    padding: 84px 10px 10px;
    overflow-y: auto;
  }

  .modal-content {
    width: min(100%, 100vw - 20px);
    max-height: calc(100dvh - 94px);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #fff;
}

.modal-title {
  margin: 0;
  color: #3F85F6;
  font-size: 20px;
  font-weight: 700;
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

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.tabs-container {
  background-color: #fff;
}

.tabs-list {
  display: flex;
  width: 100%;
}

.tab-item {
  flex: 1;
  background: #fff;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 14px 0;
  font-size: 15px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  position: relative;
}

.separator-right {
  border-right: 1px solid #3F85F6;
}

.tab-item:hover {
  color: #3F85F6;
}

.tab-item.active {
  color: #3F85F6;
  border-bottom-color: #3F85F6;
}

.form-select {
  color: #374151;
  height: 42px !important;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  width: 100%;
  font-size: 14px;
  background-color: #fff;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-select:focus {
  border-color: #1E3A8A;
  outline: none;
  box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1);
}

.form-textarea {
  color: #374151;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  width: 100%;
  font-size: 14px;
  background-color: #fff;
  transition: border-color 0.2s;
  font-family: inherit;
  resize: vertical;
  min-height: 84px;
}

.form-textarea:focus {
  border-color: #1E3A8A;
  outline: none;
  box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1);
}

:deep(.dp-custom-input) {
  height: 42px !important;
  border-radius: 6px !important;
  border: 1px solid #d1d5db !important;
  color: #374151 !important;
}

.linha-selects {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.campo {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.mb-3 {
  margin-bottom: 16px;
}

.dias-semana-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  justify-content: center;
}

.btn-dia-semana {
  border: 1px solid #d1d5db;
  background-color: #fff;
  color: #6b7280;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-dia-semana:hover:not(:disabled) {
  border-color: #1E3A8A;
  color: #1E3A8A;
}

.btn-dia-semana.active {
  background-color: #1E3A8A;
  border-color: #1E3A8A;
  color: white;
  box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);
}

.btn-dia-semana:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f3f4f6;
}

.config-horarios-fixos {
  background-color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bloco-dia-fixo {
  border-bottom: 1px dashed #d1d5db;
  padding-bottom: 16px;
}

.bloco-dia-fixo:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.titulo-dia-fixo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  color: #374151;
}

.subtexto-horario {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.subtexto-horario.selecionado {
  color: #1E3A8A;
  font-weight: 700;
}

.fixo-grid {
  margin-top: 0;
}

.horarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.horarios-loading {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
}

.loader-horarios {
  width: 16px;
  height: 16px;
  border: 2px solid #cbd5e1;
  border-top-color: #1E3A8A;
  border-radius: 999px;
  animation: spin-horarios 0.8s linear infinite;
  flex-shrink: 0;
}

.btn-horario {
  height: 36px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: #fff;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-horario:hover:not(:disabled) {
  border-color: #1E3A8A;
  color: #1E3A8A;
}

.btn-horario.selecionado {
  background-color: #1E3A8A;
  color: #fff;
  border-color: #1E3A8A;
}

.btn-horario:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
  border-color: #e5e7eb;
}

.info-box {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 20px;
  text-align: center;
}

.alerta-fechado {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 30px;
  border-radius: 8px;
  border: 1px dashed #ef4444;
  margin-top: 10px;
  text-align: center;
  gap: 10px;
}

.alerta-encaixe-hoje {
  margin-top: -6px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #fde68a;
  background: #fffbeb;
  color: #92400e;
  font-size: 13px;
  line-height: 1.45;
}

.alerta-fechado svg {
  color: #ef4444;
}

.msg-sem-horario,
.msg-sem-horario-sm {
  text-align: center;
  color: #9ca3af;
  margin-top: 15px;
  font-style: italic;
}

.msg-sem-horario-sm {
  font-size: 12px;
  margin-top: 5px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.modal-actions button {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: opacity 0.2s;
}

.btn-confirmar {
  background-color: #1E3A8A;
  color: #fff;
}

.btn-confirmar:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.btn-confirmar:hover:not(:disabled) {
  opacity: 0.9;
}

.select-wrapper {
  position: relative;
  width: 100%;
}

.loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1E3A8A;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }

  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes spin-horarios {
  to {
    transform: rotate(360deg);
  }
}

:deep(.dia-fechado-visual) {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

</style>

<style>
@media (max-width: 820px) {
  body.agend-modal-datepicker-open .dp--menu-wrapper {
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    margin: 0 !important;
    z-index: 10050 !important;
  }

  body.agend-modal-datepicker-open .dp__menu {
    max-width: calc(100vw - 24px);
  }
}
</style>
