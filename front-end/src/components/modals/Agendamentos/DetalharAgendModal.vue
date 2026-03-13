<template>
  <div class="modal-overlay" @click.self="$emit('fechar')">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="titulo_h2">Detalhes do Agendamento</h2>
        <span class="badge-tipo">{{ tipoExibicao }}</span>
      </div>

      <div class="detalhes-box">
        <p><strong>Realizado por:</strong> {{ obterNomeUsuario(agendamento) }}</p>

        <p>
          <strong>Data:</strong> {{ formatarDataHora(agendamento) }}
        </p>

        <p><strong>Duração:</strong> {{ agendamento.duracao }} hora(s)</p>

        <template v-if="ehPartida && confrontoPartida">
          <p>
            <strong>Confronto:</strong>
            {{ confrontoPartida.timeA.nome }} x {{ confrontoPartida.timeB.nome }}
          </p>

          <p v-if="nomeCampeonato" class="campeonato-apoio">
            <strong>Campeonato:</strong> {{ nomeCampeonato }}
          </p>
        </template>

        <template v-else-if="ehCampeonato">
          <p><strong>Campeonato:</strong> {{ nomeCampeonato || 'Campeonato vinculado' }}</p>
          <p v-if="resumoCampeonato"><strong>Detalhe:</strong> {{ resumoCampeonato }}</p>
        </template>

        <template v-else>
          <p v-if="nomeEscolaAula"><strong>Escola:</strong> {{ nomeEscolaAula }}</p>
          <p v-else-if="descricaoOutro"><strong>Descrição:</strong> {{ descricaoOutro }}</p>
          <p v-else><strong>Time:</strong> {{ obterNomeTime(agendamento) }}</p>
        </template>

        <p v-if="tipoNormalizado !== 'OUTRO' && descricaoAgendamento">
          <strong>Descrição:</strong> {{ descricaoAgendamento }}
        </p>

        <div v-if="agendamento.motivoRecusa" class="alerta-recusa">
          <strong>Motivo da Recusa:</strong> {{ agendamento.motivoRecusa }}
        </div>
      </div>

      <button class="btn-cancelar" @click="$emit('fechar')">Fechar</button>
    </div>
  </div>
</template>

<script>
import { obterNomeEscolaAula } from '@/utils/agendamentoExibicao'

export default {
  name: 'DetalheAgendModal',
  props: {
    agendamento: { type: Object, required: true }
  },
  computed: {
    ehCampeonato() {
      return this.ehAgendamentoCampeonato(this.agendamento)
    },
    confrontoPartida() {
      return this.obterConfrontoPartida(this.agendamento)
    },
    ehPartida() {
      return Boolean(this.ehCampeonato && this.confrontoPartida)
    },
    tipoExibicao() {
      return this.obterTipoExibicao(this.agendamento)
    },
    nomeCampeonato() {
      return this.obterNomeCampeonato(this.agendamento)
    },
    resumoCampeonato() {
      return this.obterResumoCampeonato(this.agendamento)
    },
    tipoNormalizado() {
      return String(this.agendamento?.tipo || '').trim().toUpperCase()
    },
    nomeEscolaAula() {
      if (this.tipoNormalizado !== 'AULA') return ''
      return obterNomeEscolaAula(this.agendamento?.escola)
    },
    descricaoOutro() {
      if (this.tipoNormalizado !== 'OUTRO') return ''
      const descricao = String(this.agendamento?.descricao || '').trim()
      return descricao ? this.normalizarTextoExibicao(descricao) : ''
    },
    descricaoAgendamento() {
      const descricao = String(this.agendamento?.descricao || '').trim()
      return descricao ? this.normalizarTextoExibicao(descricao) : ''
    }
  },
  methods: {
    normalizarTextoExibicao(texto) {
      if (typeof texto !== 'string') return texto
      return texto
    },

    obterNomeUsuario(ag) {
      if (ag?.usuario?.nome) return this.normalizarTextoExibicao(ag.usuario.nome)
      if (typeof ag?.usuario === 'string' && ag.usuario.trim()) return this.normalizarTextoExibicao(ag.usuario)
      if (typeof ag?.usuarioNome === 'string' && ag.usuarioNome.trim()) return this.normalizarTextoExibicao(ag.usuarioNome)
      return 'Usu\u00e1rio desconhecido'
    },

    obterNomeTime(ag) {
      if (ag?.time?.nome) return this.normalizarTextoExibicao(ag.time.nome)
      if (typeof ag?.time === 'string' && ag.time.trim()) return this.normalizarTextoExibicao(ag.time)
      if (typeof ag?.timeNome === 'string' && ag.timeNome.trim()) return this.normalizarTextoExibicao(ag.timeNome)
      return 'N\u00e3o vinculado'
    },

    ehAgendamentoCampeonato(ag) {
      const tipoNormalizado = String(ag?.tipo || '').trim().toUpperCase()
      return (
        tipoNormalizado === 'CAMPEONATO' ||
        Number(ag?.campeonatoId) > 0 ||
        Boolean(ag?.campeonato?.nome)
      )
    },

    extrairConfrontoDoResumo(resumoEvento, nomeCampeonato = '') {
      const resumo = String(resumoEvento || '').trim()
      if (!resumo) return null

      const nomeCampeonatoNormalizado = String(nomeCampeonato || '').trim().toLowerCase()
      if (nomeCampeonatoNormalizado && resumo.toLowerCase() === nomeCampeonatoNormalizado) {
        return null
      }

      const partes = resumo
        .split(/\s+x\s+/i)
        .map((parte) => this.normalizarTextoExibicao(parte.trim()))
        .filter(Boolean)

      if (partes.length !== 2) return null

      return {
        timeA: { nome: partes[0], foto: '' },
        timeB: { nome: partes[1], foto: '' }
      }
    },

    obterConfrontoPartida(ag) {
      const nomeCampeonato = this.obterNomeCampeonato(ag)
      const partidaResumo = ag?.partidaResumo
      const nomeTimeA = this.normalizarTextoExibicao(String(partidaResumo?.timeA?.nome || '').trim())
      const nomeTimeB = this.normalizarTextoExibicao(String(partidaResumo?.timeB?.nome || '').trim())

      if (nomeTimeA && nomeTimeB) {
        return {
          timeA: {
            nome: nomeTimeA,
            foto: String(partidaResumo?.timeA?.foto || '').trim()
          },
          timeB: {
            nome: nomeTimeB,
            foto: String(partidaResumo?.timeB?.foto || '').trim()
          }
        }
      }

      return this.extrairConfrontoDoResumo(ag?.resumoEvento, nomeCampeonato)
    },

    obterNomeCampeonato(ag) {
      if (ag?.campeonato?.nome) {
        return this.normalizarTextoExibicao(ag.campeonato.nome)
      }

      if (this.ehAgendamentoCampeonato(ag)) {
        const resumo = String(ag?.resumoEvento || '').trim()
        const confronto = this.extrairConfrontoDoResumo(resumo)
        if (!confronto && resumo) {
          return this.normalizarTextoExibicao(resumo)
        }
      }

      return ''
    },

    obterResumoCampeonato(ag) {
      if (!this.ehAgendamentoCampeonato(ag)) return ''

      const resumo = String(ag?.resumoEvento || '').trim()
      if (!resumo) return ''

      const confronto = this.extrairConfrontoDoResumo(resumo, this.obterNomeCampeonato(ag))
      if (confronto) return ''

      const nomeCampeonato = String(this.obterNomeCampeonato(ag) || '').trim().toLowerCase()
      if (nomeCampeonato && resumo.toLowerCase() === nomeCampeonato) return ''

      return this.normalizarTextoExibicao(resumo)
    },

    obterTipoExibicao(ag) {
      if (this.ehAgendamentoCampeonato(ag) && this.obterConfrontoPartida(ag)) {
        return 'PARTIDA'
      }

      if (this.ehAgendamentoCampeonato(ag)) {
        return 'CAMPEONATO'
      }

      const tipoNormalizado = String(ag?.tipo || '').trim().toUpperCase()
      return tipoNormalizado || 'AGENDAMENTO'
    },

    formatarDataHora(ag) {
      if (ag.datahora) {
        const dataObj = new Date(ag.datahora)
        return (
          dataObj.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) +
          ' as ' +
          dataObj.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })
        )
      }

      const dia = String(ag.dia).padStart(2, '0')
      const mes = String(ag.mes).padStart(2, '0')
      const ano = ag.ano
      const hora = String(ag.hora).padStart(2, '0')

      return `${dia}/${mes}/${ano} as ${hora}:00`
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
  padding: 16px;
}

.modal-content {
  width: min(900px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  padding: 28px 30px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.28);
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.titulo_h2 {
  margin: 0;
  color: #3b82f6;
  font-size: 32px;
  font-weight: 900;
  letter-spacing: -0.3px;
  line-height: 1.15;
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.badge-tipo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: 1px solid rgba(37, 99, 235, 0.22);
  box-shadow: 0 10px 18px rgba(37, 99, 235, 0.18);
  white-space: nowrap;
  flex-shrink: 0;
}

.detalhes-box {
  margin-top: 10px;
  margin-bottom: 18px;
  padding: 18px 18px 16px;
  border-radius: 16px;
  background: #f9fbff;
  border: 1px solid rgba(59, 130, 246, 0.22);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.06);
}

.detalhes-box p {
  margin: 10px 0;
  font-size: 15px;
  color: #334155;
  line-height: 1.45;
}

.detalhes-box p strong {
  color: #0f172a;
  font-weight: 900;
}

.campeonato-apoio {
  margin-top: 0;
}

.alerta-recusa {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  background: #fff1f2;
  color: #991b1b;
  border: 1px solid rgba(239, 68, 68, 0.28);
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.06);
}

.alerta-recusa strong {
  font-weight: 900;
}

.btn-cancelar {
  width: 100%;
  margin-top: 10px;
  padding: 12px 16px;
  border: 1px solid rgba(37, 99, 235, 0.25);
  border-radius: 999px;
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 14px 26px rgba(37, 99, 235, 0.18);
  transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.btn-cancelar:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(37, 99, 235, 0.24);
  filter: brightness(0.98);
}

.btn-cancelar:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 12px;
  }

  .modal-content {
    padding: 16px 14px;
    border-radius: 14px;
  }

  .modal-header {
    flex-wrap: nowrap;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .titulo_h2 {
    font-size: 20px;
    line-height: 1.15;
    flex: 1;
    min-width: 0;
  }

  .badge-tipo {
    padding: 6px 10px;
    font-size: 12px;
  }

  .detalhes-box {
    padding: 12px 12px 10px;
    border-radius: 14px;
  }

  .detalhes-box p {
    margin: 8px 0;
    font-size: 14px;
  }

  .btn-cancelar {
    padding: 12px 14px;
    margin-top: 12px;
  }
}
</style>
