const placarService = require('../services/placar.service');
const { emitirAtualizacaoCampeonato } = require('../socket');

async function atualizarPlacarController(req, res) {
  try {
    const { id } = req.params;
    const campos = req.body;

    if (!id) {
      return res.status(400).json({ erro: 'ID do placar é obrigatório.' });
    }
    const placar = await placarService.atualizarPlacar(id, campos);

    return res.status(200).json({
      mensagem: 'Placar atualizado com sucesso.',
      placar
    });

  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
}

async function listarPlacarPorCampeonatoController(req, res) {
  try {
    const { campeonatoId } = req.params;

    if (!campeonatoId) {
      return res.status(400).json({
        erro: 'campeonatoId é obrigatório.'
      });
    }

    const placares = await placarService.listarPlacarPorCampeonato(Number(campeonatoId));

    return res.status(200).json({ placares });

  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
}

async function salvarOrdemController(req, res) {
  try {
    const { campeonatoId } = req.params
    const { ordem, colunas, grupos, exibirPorGrupos } = req.body
    const corpoTemGrupos = Object.prototype.hasOwnProperty.call(req.body || {}, 'grupos')
    const corpoTemExibirPorGrupos = Object.prototype.hasOwnProperty.call(req.body || {}, 'exibirPorGrupos')

    const temOrdem = Array.isArray(ordem)
    const temColunas = Array.isArray(colunas)
    const gruposValidos = grupos === null || (!!grupos && typeof grupos === 'object' && !Array.isArray(grupos))
    const exibirPorGruposValido = typeof exibirPorGrupos === 'boolean'

    if (!temOrdem && !temColunas && !corpoTemGrupos && !corpoTemExibirPorGrupos) {

      return res.status(400).json({
        erro: "ordem, colunas, grupos e/ou exibirPorGrupos devem ser enviados em formato valido"
      })

    }

    if (corpoTemGrupos && !gruposValidos) {
      return res.status(400).json({
        erro: "grupos deve ser um objeto ou null"
      })
    }

    if (corpoTemExibirPorGrupos && !exibirPorGruposValido) {
      return res.status(400).json({
        erro: "exibirPorGrupos deve ser um boolean"
      })
    }

    const resultado = await placarService.salvarOrdemClassificacao(
      campeonatoId,
      temOrdem ? ordem : null,
      temColunas ? colunas : null,
      corpoTemGrupos ? grupos : undefined,
      corpoTemExibirPorGrupos ? exibirPorGrupos : undefined
    )

    emitirAtualizacaoCampeonato({
      tipo: 'CLASSIFICACAO_ATUALIZADA',
      campeonatoId: Number(campeonatoId)
    })

    return res.json({
      message: "Configuracao salva com sucesso",
      data: resultado
    })

  }
  catch (error) {
    return res.status(500).json({
      erro: error.message
    })
  }
}

async function listarOrdemClassificacaoController(req, res) {
  try {
    const { campeonatoId } = req.params;
    const configuracao = await placarService.listarOrdemClassificacao(Number(campeonatoId));
    res.json({
      campeonatoId,
      ordem: configuracao?.ordem || [],
      colunas: configuracao?.colunas || [],
      grupos: configuracao?.grupos || null,
      exibirPorGrupos: typeof configuracao?.exibirPorGrupos === 'boolean' ? configuracao.exibirPorGrupos : true
    });
  } catch (error) {
    console.error(error);
    const status = /nao encontrado/i.test(String(error?.message || '')) ? 404 : 500;
    res.status(status).json({ erro: error.message });
  }
}

module.exports = { atualizarPlacarController, listarPlacarPorCampeonatoController, salvarOrdemController, listarOrdemClassificacaoController };
