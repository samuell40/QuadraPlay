<template>
  <div v-if="aberto" class="modal-overlay" @click.self="$emit('fechar')">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title-group">
          <h2>Selecione os Jogadores</h2>
          <span v-if="regraOpcional" class="title-optional-badge">Opcional</span>
        </div>
        <button type="button" class="btn-close-x" @click="$emit('fechar')">x</button>
      </div>

      <div class="colunas">
        <div class="coluna">
          <h3>{{ time1Nome }}</h3>

          <div class="contador">
            <template v-if="regraLivre">
              Selecionados: {{ selecionadosTime1.length }}
            </template>
            <template v-else>
              Selecionados: {{ selecionadosTime1.length }} / {{ regra.porTime }}
            </template>
          </div>

          <div v-for="(jogadores, funcao) in jogadoresPorFuncaoTime1" :key="funcao">
            <h4 class="funcao-titulo">{{ funcao }}</h4>

            <div v-for="j in jogadores" :key="j.id" class="jogador-card" :class="{ suspenso: jogadorSuspenso(j) }">
              <label class="jogador-label" :class="{ suspenso: jogadorSuspenso(j) }">
                <input
                  type="checkbox"
                  v-model="selecionadosTime1"
                  :value="j.id"
                  :disabled="checkboxDesabilitado(j, 'time1')"
                />

                <div class="jogador-info">
                  <span v-if="temNumeroJogador(j.numero)" class="numero-jogador">{{ j.numero }}</span>
                  <img :src="j.foto" alt="Foto" class="foto-jogador" />
                  <div class="dados-jogador">
                    <span class="nome" :class="{ suspenso: jogadorSuspenso(j) }">{{ j.nome }}</span>
                    <span v-if="jogadorSuspenso(j)" class="tag-suspenso" :title="j.motivoSuspensao || 'Jogador suspenso'">
                      Suspenso
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="coluna">
          <h3>{{ time2Nome }}</h3>

          <div class="contador">
            <template v-if="regraLivre">
              Selecionados: {{ selecionadosTime2.length }}
            </template>
            <template v-else>
              Selecionados: {{ selecionadosTime2.length }} / {{ regra.porTime }}
            </template>
          </div>

          <div v-for="(jogadores, funcao) in jogadoresPorFuncaoTime2" :key="funcao">
            <h4 class="funcao-titulo">{{ funcao }}</h4>

            <div v-for="j in jogadores" :key="j.id" class="jogador-card" :class="{ suspenso: jogadorSuspenso(j) }">
              <label class="jogador-label" :class="{ suspenso: jogadorSuspenso(j) }">
                <input
                  type="checkbox"
                  v-model="selecionadosTime2"
                  :value="j.id"
                  :disabled="checkboxDesabilitado(j, 'time2')"
                />

                <div class="jogador-info">
                  <span v-if="temNumeroJogador(j.numero)" class="numero-jogador">{{ j.numero }}</span>
                  <img :src="j.foto" alt="Foto" class="foto-jogador" />
                  <div class="dados-jogador">
                    <span class="nome" :class="{ suspenso: jogadorSuspenso(j) }">{{ j.nome }}</span>
                    <span v-if="jogadorSuspenso(j)" class="tag-suspenso" :title="j.motivoSuspensao || 'Jogador suspenso'">
                      Suspenso
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="botoes">
        <button class="btn-save1" :disabled="salvando" @click="confirmar">
          <span class="btn-save-content">
            <span v-if="salvando" class="btn-save-spinner" aria-hidden="true"></span>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="btn-save-icon"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
              <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05"/>
            </svg>
            <span>{{ salvando ? 'Iniciando...' : 'Iniciar Partida' }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2'

export default {
  props: {
    aberto: Boolean,
    jogadoresTime1: {
      type: Array,
      default: () => []
    },
    jogadoresTime2: {
      type: Array,
      default: () => []
    },
    time1Nome: String,
    time2Nome: String,
    regra: {
      type: Object,
      required: true
    },
    salvando: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      selecionadosTime1: [],
      selecionadosTime2: []
    }
  },

  watch: {
    aberto(valor) {
      if (valor) {
        this.selecionadosTime1 = []
        this.selecionadosTime2 = []
      }
    }
  },

  computed: {
    regraLivre() {
      return !!this.regra?.livre
    },
    regraOpcional() {
      return !!this.regra?.opcional || (this.regraLivre && Number(this.regra?.minPorTime ?? 1) === 0)
    },
    jogadoresPorFuncaoTime1() {
      return this.agruparPorFuncao(this.jogadoresTime1)
    },
    jogadoresPorFuncaoTime2() {
      return this.agruparPorFuncao(this.jogadoresTime2)
    }
  },

  methods: {
    temNumeroJogador(numero) {
      const numeroNormalizado = Number(numero)
      return Number.isInteger(numeroNormalizado) && numeroNormalizado > 0
    },
    jogadorSuspenso(jogador) {
      return !!jogador?.suspenso
    },

    estaSuspensoPorId(jogadores, jogadorId) {
      const jogador = (Array.isArray(jogadores) ? jogadores : []).find(j => Number(j.id) === Number(jogadorId))
      return this.jogadorSuspenso(jogador)
    },

    checkboxDesabilitado(jogador, time) {
      if (this.salvando) return true
      if (this.jogadorSuspenso(jogador)) return true

      const selecionados = time === 'time1' ? this.selecionadosTime1 : this.selecionadosTime2
      return !this.regraLivre &&
        selecionados.length >= this.regra.porTime &&
        !selecionados.includes(jogador.id)
    },

    agruparPorFuncao(jogadores) {
      return jogadores.reduce((acc, jogador) => {
        const funcao =
          jogador.funcao && jogador.funcao.nome
            ? jogador.funcao.nome
            : 'Sem Funcao'

        if (!acc[funcao]) acc[funcao] = []
        acc[funcao].push(jogador)
        return acc
      }, {})
    },

    confirmar() {
      if (this.salvando) return

      const suspensosSelecionadosTime1 = this.selecionadosTime1.filter(id =>
        this.estaSuspensoPorId(this.jogadoresTime1, id)
      )
      const suspensosSelecionadosTime2 = this.selecionadosTime2.filter(id =>
        this.estaSuspensoPorId(this.jogadoresTime2, id)
      )

      if (suspensosSelecionadosTime1.length || suspensosSelecionadosTime2.length) {
        Swal.fire({
          icon: 'warning',
          title: 'Jogador suspenso',
          text: 'Remova os jogadores suspensos da escalação para iniciar a partida.',
          confirmButtonColor: '#3b82f6'
        })
        return
      }

      if (this.regraLivre) {
        const minPorTime = Number(this.regra?.minPorTime ?? 1)
        if (
          this.selecionadosTime1.length < minPorTime ||
          this.selecionadosTime2.length < minPorTime
        ) {
          Swal.fire({
            icon: 'warning',
            title: 'Número inválido de jogadores',
            text: `Cada time deve ter pelo menos ${minPorTime} jogador(es).`,
            confirmButtonColor: '#3b82f6'
          })
          return
        }
      } else {
        if (
          this.selecionadosTime1.length !== this.regra.porTime ||
          this.selecionadosTime2.length !== this.regra.porTime
        ) {
          Swal.fire({
            icon: 'warning',
            title: 'Número inválido de jogadores',
            text: `Cada time deve ter exatamente ${this.regra.porTime} jogadores.`,
            confirmButtonColor: '#3b82f6'
          })
          return
        }

        const totalJogadores =
          this.selecionadosTime1.length +
          this.selecionadosTime2.length

        if (totalJogadores !== this.regra.total) {
          Swal.fire({
            icon: 'warning',
            title: 'Quantidade total incorreta',
            text: `A partida deve ter exatamente ${this.regra.total} jogadores.`,
            confirmButtonColor: '#3b82f6'
          })
          return
        }
      }

      this.$emit('confirmar', {
        time1: this.selecionadosTime1,
        time2: this.selecionadosTime2
      })
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px 32px;
  border-radius: 12px;
  width: 900px;
  max-width: 95%;
  max-height: 90vh;

  display: flex;
  flex-direction: column;
}

.modal-content h2 {
  margin-bottom: 16px;
  color: #3b82f6;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-header h2 {
  margin-bottom: 0;
}

.title-optional-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.btn-close-x {
  width: 34px;
  height: 34px;
  border: 1px solid #3b82f6;
  border-radius: 999px;
  background: #fff;
  color: #3b82f6;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  flex: 0 0 auto;
}

.contador {
  font-size: 17px;
  font-weight: 600;
  color: #374151;
  text-align: center;
  background: #fff;
  padding: 6px 0;
  position: sticky;
  top: 48px;
  z-index: 1;
  border-bottom: 1px solid #e5e7eb;
}

.colunas {
  display: flex;
  gap: 20px;
  flex: 1;
  overflow: hidden;
}

.coluna {
  flex: 1;
  border: 1px solid #3b82f6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  padding: 10px 15px;
  overflow-y: auto;
}

.coluna::-webkit-scrollbar {
  width: 6px;
}

.coluna::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.coluna h3 {
  border-bottom: 1px solid #3b82f6;
  padding: 10px;
  margin: -10px -15px 10px -15px;
  color: #3b82f6;
  font-weight: bold;
  font-size: 20px;
  text-align: center;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 1;
}

.funcao-titulo {
  margin: 10px 0 8px;
  color: #7e7e7e;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
  font-size: 16px;
}

.jogador-card {
  margin-bottom: 8px;
  padding: 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  box-sizing: border-box;
}

.jogador-card.suspenso {
  border: 1px solid #fecaca;
  background: #fef2f2;
}

.jogador-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.jogador-label.suspenso {
  cursor: not-allowed;
}

.jogador-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dados-jogador {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
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

.foto-jogador {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #ccc;
}

.nome {
  font-weight: 600;
  font-size: 14px;
}

.nome.suspenso {
  color: #b91c1c;
}

.tag-suspenso {
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #b91c1c;
  background: #fee2e2;
  border: 1px solid #fca5a5;
}

.botoes {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.btn-save1 {
  flex: 1;
  padding: 12px 0;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  color: white;
  font-size: 16px;
  background-color: #3b82f6;
}

.btn-save1:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.btn-save-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-save-spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  animation: btnSaveSpin 0.75s linear infinite;
  flex: 0 0 14px;
}

.btn-save-icon {
  flex: 0 0 auto;
}

@keyframes btnSaveSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .colunas {
    flex-direction: column;
  }

  .coluna {
    max-height: 35vh;
  }

  .numero-jogador {
    min-width: 28px;
    height: 20px;
    padding: 0 7px;
    font-size: 11px;
  }
}
</style>
