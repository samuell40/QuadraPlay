<template>
    <div class="layout">
        <NavBarHome />

        <div class="conteudo">
            <div class="header">
                <div class="header-copy">
                    <h1 class="title">Times</h1>
                    <a class="page-subtitle">
                        Explore os elencos cadastrados por modalidade e abra cada time para ver os jogadores.
                    </a>
                </div>
            </div>

            <div v-if="isLoading" class="painel-card aainel-loading">
                <LoadingState
                    title="Carregando modalidades"
                    description="Buscando as categorias disponíveis para montar a vitrine de times."
                />
            </div>

            <div v-else>
                <div class="aainel-times">
                    <div class="painel-card modalidades-card">
                        <div class="section-head">
                            <div>
                                <span class="section-kicker">Modalidades</span>
                                <h2>Escolha a modalidade</h2>
                                <a>Troque a visualização para navegar entre os times cadastrados.</a>
                            </div>
                        </div>

                        <div class="abas-container">
                            <div class="aba" v-for="m in modalidades" :key="m.id" :class="{ ativa: modalidadeAtiva === m.id }"
                                @click="selecionarModalidade(m.id)">
                                {{ formatarTextoCapitalizado(m.nome) }}
                            </div>
                        </div>
                    </div>

                    <div v-if="isLoadingTimes" class="painel-card aainel-loading">
                        <LoadingState
                            title="Carregando times"
                            description="Organizando os elencos cadastrados para a modalidade selecionada."
                        />
                    </div>

                    <div v-else-if="times && times.length" class="painel-card times-card">
                        <div class="section-head">
                            <div>
                                <span class="section-kicker">Equipes</span>
                                <h2>Times cadastrados</h2>
                                <a>{{ times.length }} time{{ times.length === 1 ? '' : 's' }} encontrado{{ times.length === 1 ? '' : 's' }} para esta modalidade.</a>
                            </div>
                        </div>

                        <div class="lista-times">
                            <div v-for="time in times" :key="time.id" class="time-card" @click="abrirModalJogadores(time)">
                            <div class="card-conteudo">
                                <div class="foto">
                                    <img :src="obterFotoTimeCard(time.foto)" :alt="time.nome" />
                                </div>

                                <div class="info">
                                    <div class="info-topo">
                                        <h2>{{ time.nome }}</h2>
                                        <span class="jogadores-chip">
                                            {{ time.qtdJogadores }}
                                            jogador{{ time.qtdJogadores === 1 ? '' : 'es' }}
                                        </span>
                                    </div>

                                    <div class="info-linha">
                                        <span class="info-label">Treinador:</span>
                                        <span class="info-valor">{{ time.treinador || 'Sem Treinador Definido' }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>

                    <div v-else class="painel-card estado-vazio">
                        <h2>Nenhum time encontrado</h2>
                        <a>Não há equipes cadastradas para a modalidade selecionada.</a>
                    </div>
                </div>
            </div>
            <!-- MODAL JOGADORES -->
            <div v-if="mostrarModal" class="modal-overlay" @click.self="fecharModal">
                <div class="modal-conteudo modal-placar">
                    <div class="header-placar">
                        <h2 class="title_placar">
                            Jogadores – {{ timeSelecionado?.nome }}
                        </h2>
                    </div>

                    <div v-if="isLoadingJogadores" class="loader-container-centralizado">
                        <LoadingState
                            size="compact"
                            title="Carregando jogadores"
                            description="Buscando o elenco completo e as funções do time selecionado."
                        />
                    </div>

                    <!-- Lista de jogadores -->
                    <div v-else class="modal-jogadores">
                        <div v-for="(lista, funcao) in jogadoresPorFuncao" :key="funcao" class="grupo-funcao">
                            <h3 class="titulo-funcao">
                                {{ funcao.toUpperCase() }}
                            </h3>

                            <div class="grid-jogadores">
                                <div v-for="j in lista" :key="j.id" class="card-jogador">
                                    <img :src="j.foto" />
                                    <div class="nome-jogador">
                                        <span v-if="temNumeroJogador(j.numero)" class="numero-jogador">{{ j.numero }}</span>
                                        <span>{{ formatarTextoCapitalizado(j.nome) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="!jogadores.length" class="sem-dados-centralizado">
                            Nenhum jogador cadastrado.
                        </div>
                    </div>

                    <button class="btn-cancel-placar" @click="fecharModal">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
        <Footer />
    </div>
</template>

<script>
import NavBarHome from '@/components/NavBarHome.vue'
import Footer from '@/components/Footer.vue'
import LoadingState from '@/components/loading/LoadingState.vue'
import api from '@/axios'
import { obterFotoTime } from '@/utils/timeImagem'

export default {
    name: 'TimesHomeView',
    components: { NavBarHome, Footer, LoadingState },

    data() {
        return {
            modalidades: [],
            modalidadeAtiva: null,
            times: [],
            isLoading: true,
            isLoadingTimes: false,
            mostrarModal: false,
            timeSelecionado: null,
            jogadores: [],
            isLoadingJogadores: false
        }
    },

    computed: {
        jogadoresPorFuncao() {
            const grupos = {}

            this.jogadores.forEach(j => {
                const funcao = j.funcao?.nome || 'Sem função'

                if (!grupos[funcao]) {
                    grupos[funcao] = []
                }

                grupos[funcao].push(j)
            })

            return grupos
        }
    },

    methods: {
        formatarTextoCapitalizado(texto) {
            if (!texto) return ''
            return String(texto)
                .toLowerCase()
                .replace(/(^|\s)\S/g, letra => letra.toUpperCase())
        },
        obterFotoTimeCard(foto) {
            return obterFotoTime(foto)
        },
        temNumeroJogador(numero) {
            const numeroNormalizado = Number(numero)
            return Number.isInteger(numeroNormalizado) && numeroNormalizado > 0
        },
        async abrirModalJogadores(time) {
            this.timeSelecionado = time
            this.mostrarModal = true
            this.jogadores = []
            this.isLoadingJogadores = true

            try {
                const { data } = await api.get(`/time/${time.id}`)
                this.jogadores = data
            } catch (err) {
                console.error('Erro ao carregar jogadores', err)
            } finally {
                this.isLoadingJogadores = false
            }
        },

        async carregarModalidades() {
            try {
                const { data } = await api.get('/listar/modalidade')
                this.modalidades = data

                if (data.length) {
                    this.modalidadeAtiva = data[0].id
                    this.carregarTimes()
                }
            } catch (err) {
                console.error('Erro ao carregar modalidades', err)
            } finally {
                this.isLoading = false
            }
        },

        async carregarTimes() {
            if (!this.modalidadeAtiva) {
                this.times = []
                return
            }

            this.isLoadingTimes = true

            try {
                const res = await api.get(`/times/modalidade/${this.modalidadeAtiva}`)
                this.times = res.data.map(t => ({
                    id: t.id,
                    nome: t.nome,
                    foto: t.foto,
                    modalidadeId: t.modalidadeId,
                    qtdJogadores: t._count?.jogadores,
                    treinador: t.treinador?.usuario?.nome,
                }))
            } catch (err) {
                console.error('Erro ao carregar times', err)
            } finally {
                this.isLoadingTimes = false
            }
        },

        fecharModal() {
            this.mostrarModal = false
            this.timeSelecionado = null
            this.jogadores = []
        },

        selecionarModalidade(id) {
            this.modalidadeAtiva = id
            this.carregarTimes()
        },

        obterQtdJogadores(time) {
            return time.jogadores ? time.jogadores.length : 0
        }
    },

    mounted() {
        this.carregarModalidades()
    }
}
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

.conteudo {
    margin-top: 64px;
    padding: 20px 60px;
}

.header {
    margin-bottom: 12px;
}

.header-copy {
    max-width: 660px;
}

.title {
    margin: 8px 0 6px;
    color: #2563eb;
    font-size: 34px;
    line-height: 1;
    letter-spacing: -0.04em;
}

.page-subtitle {
    margin: 0;
    color: #475569;
    font-size: 15px;
    line-height: 1.45;
    max-width: none;
    white-space: normal;
}

.aainel-times {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.painel-card {
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
    padding: 24px;
}

.section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
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

.estado-vazio {
    text-align: center;
    padding: 42px 24px;
}

.estado-vazio h2 {
    margin: 0 0 10px;
    color: #0f172a;
    font-size: 28px;
}

.estado-vazio a {
    margin: 0;
    color: #64748b;
    font-size: 15px;
}

.aainel-loading {
    min-height: 180px;
    display: flex;
    align-items: center;
}

.loader-container-centralizado {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 180px;
}

.loader {
    border: 6px solid #dbeafe;
    border-top: 6px solid #2563eb;
    border-radius: 50%;
    width: 56px;
    height: 56px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.abas-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.modalidades-card {
    padding: 18px 20px;
    border-radius: 24px;
}

.modalidades-card .section-head {
    margin-bottom: 14px;
}

.modalidades-card .section-head h2 {
    margin: 4px 0 6px;
    font-size: 24px;
}

.modalidades-card .section-head a {
    font-size: 13px;
    line-height: 1.45;
}

.modalidades-card .abas-container {
    gap: 10px;
}

.aba {
    min-height: 54px;
    padding: 14px 18px;
    border-radius: 20px;
    cursor: pointer;
    background: rgba(248, 250, 252, 0.92);
    border: 1px solid rgba(148, 163, 184, 0.26);
    font-weight: 700;
    font-size: 15px;
    line-height: 1.35;
    color: #334155;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, color 0.18s ease;
    user-select: none;
}

.modalidades-card .aba {
    min-height: 48px;
    padding: 10px 16px;
    border-radius: 18px;
    font-size: 14px;
}

.aba:hover {
    transform: translateY(-1px);
    border-color: rgba(59, 130, 246, 0.34);
    box-shadow: 0 10px 20px rgba(59, 130, 246, 0.12);
}

.aba.ativa {
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(96, 165, 250, 0.14));
    border-color: rgba(37, 99, 235, 0.52);
    color: #1d4ed8;
}

.lista-times {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
}

.time-card {
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid rgba(226, 232, 240, 0.92);
    border-radius: 22px;
    padding: 18px;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.time-card:hover {
    transform: translateY(-2px);
    border-color: rgba(59, 130, 246, 0.28);
    box-shadow: 0 18px 36px rgba(37, 99, 235, 0.10);
}

.card-conteudo {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    justify-content: flex-start;
}

.foto {
    flex: 0 0 72px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.foto img {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 2px solid #dbeafe;
    object-fit: cover;
    background: #f8fafc;
    box-shadow: 0 6px 14px rgba(59, 130, 246, 0.1);
}

.info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
}

.info-topo {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.info h2 {
    margin: 0;
    font-size: 22px;
    line-height: 1.15;
    color: #0f172a;
    font-weight: 800;
}

.jogadores-chip {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 13px;
    font-weight: 700;
}

.info-linha {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
}

.info-label {
    margin: 0;
    color: #64748b;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.info-valor {
    margin: 0;
    color: #475569;
    font-size: 14px;
    font-weight: 600;
}

.modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
}

.modal-conteudo.modal-placar {
    background-color: #fff;
    border-radius: 16px;
    padding: 0;
    display: flex;
    flex-direction: column;
    width: min(980px, 92vw);
    max-height: 80vh;
    overflow: hidden;
    box-sizing: border-box;
    box-shadow: 0 18px 55px rgba(0, 0, 0, 0.25);
}

.header-placar {
    padding: 18px 22px;
    border-bottom: 1px solid #eef2f7;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.title_placar {
    color: #3b82f6;
    font-size: 24px;
    margin: 0;
}

.btn-fechar-x {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    background: #fff;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    color: #334155;
    transition: 0.15s ease;
}

.btn-fechar-x:hover {
    border-color: #3b82f6;
    color: #1d4ed8;
    background: #eff6ff;
}

.modal-jogadores {
    padding: 18px 18px 18px 22px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    overflow-y: auto;
    max-height: calc(80vh - 140px);
    scrollbar-gutter: stable;
}

.modal-jogadores::-webkit-scrollbar {
    width: 10px;
}

.modal-jogadores::-webkit-scrollbar-track {
    background: transparent;
}

.modal-jogadores::-webkit-scrollbar-thumb {
    background: rgba(15, 23, 42, 0.18);
    border-radius: 999px;
    border: 3px solid transparent;
    background-clip: content-box;
}

.modal-jogadores::-webkit-scrollbar-thumb:hover {
    background: rgba(15, 23, 42, 0.28);
    border: 3px solid transparent;
    background-clip: content-box;
}

.modal-jogadores {
    scrollbar-width: thin;
    scrollbar-color: rgba(15, 23, 42, 0.25) transparent;
}

.titulo-funcao {
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    border-left: 3px solid #3b82f6;
    padding-left: 10px;
    margin-bottom: 16px;
}

.grid-jogadores {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 14px;
}

.card-jogador {
    background: #fff;
    border-radius: 14px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
    text-align: center;
    transition: 0.15s ease;
}

.card-jogador:hover {
    transform: translateY(-3px);
    border-color: #3b82f6;
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.10);
}

.card-jogador img {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    background: #f3f4f6;
    display: block;
}

.nome-jogador {
    margin: 0;
    padding: 8px 10px;
    background: #fff;
    color: #334155;
    font-weight: 800;
    font-size: 13px;
    border-top: 1px solid #eef2f7;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.numero-jogador {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 38px;
    padding: 3px 10px;
    border-radius: 999px;
    border: 1px solid #bfdbfe;
    background: #dbeafe;
    color: #1d4ed8;
    font-size: 15px;
    font-weight: 700;
    line-height: 1;
}

.btn-cancel-placar {
    margin: 18px 22px 22px;
    padding: 16px 20px;
    width: calc(100% - 44px);
    border-radius: 999px;
    border: 2px solid #3b82f6;
    background: transparent;
    color: #3b82f6;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-cancel-placar:hover {
    background: #3b82f6;
    color: #fff;
    box-shadow: 0 10px 20px rgba(59, 130, 246, 0.25);
}

@media (max-width: 768px) {
    .conteudo {
        margin-top: 42px;
        padding: 12px 14px 16px;
    }

    .header {
        margin-top: -15px;
        margin-bottom: 12px;
    }

    .header-copy {
        max-width: 100%;
    }

    .title {
        margin: 0 0 8px;
        font-size: 30px;
        line-height: 1.04;
    }

    .page-subtitle {
        margin-top: 0;
        font-size: 14px;
        line-height: 1.55;
        white-space: normal;
    }

    .painel-card {
        padding: 18px;
        border-radius: 24px;
    }

    .section-head {
        margin-bottom: 16px;
    }

    .section-head h2 {
        font-size: 24px;
    }

    .modalidades-card {
        padding: 14px;
        border-radius: 20px;
    }

    .modalidades-card .section-head {
        margin-bottom: 12px;
    }

    .modalidades-card .section-head h2 {
        font-size: 20px;
    }

    .modalidades-card .section-head a {
        font-size: 13px;
        line-height: 1.45;
    }

    .abas-container {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .modalidades-card .abas-container {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
    }

    .aba {
        min-height: 62px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    .modalidades-card .aba {
        min-height: 42px;
        padding: 6px 4px;
        border-radius: 12px;
        font-size: 11px;
        line-height: 1.2;
    }

    .lista-times {
        grid-template-columns: 1fr;
        gap: 14px;
    }

    .time-card {
        padding: 14px;
        border-radius: 18px;
    }

    .card-conteudo {
        gap: 10px;
        align-items: center;
    }

    .foto {
        flex-basis: 56px;
    }

    .foto img {
        width: 56px;
        height: 56px;
    }

    .info {
        gap: 6px;
    }

    .info h2 {
        font-size: 18px;
    }

    .jogadores-chip {
        min-height: 24px;
        padding: 0 8px;
        font-size: 12px;
    }

    .info-label {
        font-size: 10px;
    }

    .info-valor {
        font-size: 13px;
    }

    .modal-conteudo.modal-placar {
        width: 94vw;
        max-height: 78vh;
        padding: 0;
        overflow: hidden;
    }

    .title_placar {
        font-size: 18px;
    }

    .modal-jogadores {
        max-height: calc(78vh - 140px);
        gap: 18px;
    }

    .grid-jogadores {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 12px;
    }

    .card-jogador img {
        aspect-ratio: 1 / 1;
    }

    .nome-jogador {
        font-size: 12px;
        padding: 6px 8px;
    }
}
</style>




