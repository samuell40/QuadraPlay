<template>
  <div class="modal-overlay" @click.self="fecharModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-titulo">{{ titulo }}</h2>
        <button class="btn-close-x" @click="fecharModal" :disabled="loading" aria-label="Fechar modal">
          x
        </button>
      </div>
      <p class="modal-descricao">{{ descricao }}</p>

      <textarea
        v-model="motivo"
        class="modal-textarea-fixo"
        :placeholder="placeholder"
        @input="erro = false"
      ></textarea>

      <span v-if="erro" class="mensagem-erro">{{ mensagemErro }}</span>

      <div class="modal-actions-container">
        <button class="modal-btn-confirmar" @click="confirmarAcao" :disabled="loading">
          <span v-if="loading" class="loader-btn"></span>
          <span v-else>{{ textoConfirmar }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'

const props = defineProps({
  agendamentoId: {
    type: Number,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  titulo: {
    type: String,
    default: 'Motivo da Recusa',
  },
  descricao: {
    type: String,
    default: 'Explique porque o agendamento nao pode ser aceito:',
  },
  placeholder: {
    type: String,
    default: 'Ex: A quadra passara por manutencao neste horario, por favor escolha outro dia...',
  },
  textoConfirmar: {
    type: String,
    default: 'Confirmar Recusa',
  },
  motivoObrigatorio: {
    type: Boolean,
    default: true,
  },
  mensagemErro: {
    type: String,
    default: 'Por favor, informe o motivo da recusa.',
  },
})

const emit = defineEmits(['fechar', 'confirmar'])

const motivo = ref('')
const erro = ref(false)

const fecharModal = () => {
  if (!props.loading) {
    emit('fechar')
  }
}

const confirmarAcao = () => {
  if (props.motivoObrigatorio && !motivo.value.trim()) {
    erro.value = true
    return
  }

  emit('confirmar', { id: props.agendamentoId, motivo: motivo.value.trim() })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  font-family: 'Montserrat', sans-serif;
  padding: 20px;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 600px;
  padding: 28px;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  animation: fadeInScale 0.3s ease-out;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-titulo {
  font-size: 26px;
  font-weight: 800;
  color: #3b82f6;
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

.btn-close-x:hover:not(:disabled) {
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

.modal-descricao {
  font-size: 15px;
  color: #6b7280;
  margin-bottom: 24px;
  text-align: left;
  line-height: 1.5;
}

.modal-textarea-fixo {
  resize: none;
  width: 100%;
  box-sizing: border-box;
  min-height: 150px;
  font-family: inherit;
  font-size: 15px;
  padding: 16px;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  outline: none;
  transition: all 0.2s;
  background-color: #f9fafb;
}

.modal-textarea-fixo:focus {
  border-color: #3b82f6;
  background-color: #fff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.mensagem-erro {
  color: #dc2626;
  font-size: 14px;
  font-weight: 600;
  margin-top: 8px;
  display: block;
}

.modal-actions-container {
  display: block;
  width: 100%;
  margin-top: 24px;
}

.modal-btn-confirmar {
  width: 100%;
  padding: 14px 0;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: #1e3a8a;
  color: white;
}

.modal-btn-confirmar:hover:not(:disabled) {
  background-color: #1e3a8a;
  transform: translateY(-2px);
}

.modal-btn-confirmar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loader-btn {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: girar 0.8s linear infinite;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .modal-content {
    padding: 24px;
  }

  .modal-titulo {
    font-size: 22px;
  }
}
</style>
