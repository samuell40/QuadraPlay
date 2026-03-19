const express = require('express');
const http = require('http');
const cors = require('cors');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config();
const passport = require("./auth/passport");
const prisma = require('./lib/prisma');
const { iniciarSocket } = require('./socket');
const {
  encerrarAgendamentosConfirmadosPassados,
  processarAvisosEncerramentoAgendamentosFixos,
} = require('./services/agendamento.service');

// Rotas
const authRoutes = require("./routes/auth.router");
const partida = require('./routes/partida.router');
const usuario = require('./routes/usuario.router');
const jogador = require('./routes/jogador.router');
const treinador = require('./routes/treinador.router');
const quadra = require('./routes/quadra.router');
const placar = require('./routes/placar.router');
const agendamento = require('./routes/agendamento.router');
const time = require('./routes/time.router');
const modalidade = require('./routes/modalidade.router');
const campeonato = require('./routes/campeonatos.router');
const avisos = require('./routes/aviso.router');
const horarioQuadra = require('./routes/horario_quadra.router');
const pushNotification = require('./routes/push-notification.router');
//const { FirstRun } = require('./firstRun');

// Inicialização
const app = express();
app.set('trust proxy', 1);

const server = http.createServer(app);

iniciarSocket(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = new Set([
  'https://www.quadraplaysv.com.br',
  'https://quadraplaysv.com.br',
]);

if (process.env.NODE_ENV !== 'production') {
  [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].forEach((origin) => allowedOrigins.add(origin));
}

function normalizarOrigem(valor) {
  const bruto = String(valor || '').trim();
  if (!bruto) return '';

  try {
    return new URL(bruto).origin;
  } catch (_) {
    try {
      return new URL(`https://${bruto}`).origin;
    } catch {
      return '';
    }
  }
}

function adicionarOrigemPermitida(valor) {
  const origem = normalizarOrigem(valor);
  if (origem) {
    allowedOrigins.add(origem);
  }
}

[
  process.env.FRONTEND_URL,
  process.env.APP_URL,
  process.env.QUADRAPLAY_URL,
  process.env.VERCEL_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
].forEach(adicionarOrigemPermitida);

String(process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
  .forEach(adicionarOrigemPermitida);

function ehOrigemVercel(origin) {
  try {
    const hostname = String(new URL(origin).hostname || '').toLowerCase();
    return hostname.endsWith('.vercel.app');
  } catch (_) {
    return false;
  }
}

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);

    const originNormalizada = normalizarOrigem(origin) || String(origin || '').trim();
    if (allowedOrigins.has(originNormalizada) || ehOrigemVercel(originNormalizada)) {
      return cb(null, true);
    }

    return cb(new Error(`Not allowed by CORS: ${originNormalizada}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}));

function montarHostsPermitidosProxyMidia() {
  const hosts = new Set();
  const urlPublica = String(process.env.URL_PUBLICA || '').trim();
  const hostsExtra = String(process.env.MEDIA_PROXY_HOSTS || '').trim();

  if (urlPublica) {
    try {
      hosts.add(new URL(urlPublica).host.toLowerCase());
    } catch (error) {
      console.warn('[media-proxy] URL_PUBLICA invalida:', urlPublica);
    }
  }

  if (hostsExtra) {
    hostsExtra
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .forEach((host) => hosts.add(host));
  }

  hosts.add('pub-8c7959cad5c04469b16f4b0706a2e931.r2.dev');
  return hosts;
}

const HOSTS_PERMITIDOS_PROXY_MIDIA = montarHostsPermitidosProxyMidia();

function validarUrlImagemProxy(urlImagem) {
  try {
    const url = new URL(String(urlImagem || '').trim());
    const protocoloValido = url.protocol === 'https:' || url.protocol === 'http:';
    if (!protocoloValido) return null;

    const host = String(url.host || '').toLowerCase();
    if (!HOSTS_PERMITIDOS_PROXY_MIDIA.has(host)) return null;
    return url.toString();
  } catch (error) {
    return null;
  }
}

app.get('/media/proxy', async (req, res) => {
  const urlImagem = String(req.query?.url || '').trim();
  const urlValidada = validarUrlImagemProxy(urlImagem);

  if (!urlValidada) {
    return res.status(400).json({ error: 'URL de imagem invalida ou nao permitida.' });
  }

  try {
    const resposta = await fetch(urlValidada);
    if (!resposta.ok) {
      return res.status(404).json({ error: 'Nao foi possivel obter a imagem.' });
    }

    const contentType = String(resposta.headers.get('content-type') || '').toLowerCase();
    if (!contentType.startsWith('image/')) {
      return res.status(415).json({ error: 'A URL informada nao retorna uma imagem valida.' });
    }

    const tamanhoConteudo = Number(resposta.headers.get('content-length') || 0);
    if (Number.isFinite(tamanhoConteudo) && tamanhoConteudo > 8 * 1024 * 1024) {
      return res.status(413).json({ error: 'Imagem excede o tamanho maximo permitido.' });
    }

    const buffer = Buffer.from(await resposta.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('[media-proxy] erro ao buscar imagem:', error?.message || error);
    return res.status(502).json({ error: 'Falha ao carregar imagem externa.' });
  }
});

app.use(passport.initialize());

// Rotas
app.use("/auth", authRoutes);
app.use(usuario);
app.use(jogador);
app.use(treinador);
app.use(quadra);
app.use(placar);
app.use(partida);
app.use(agendamento);
app.use(time);
app.use(modalidade);
app.use(campeonato);
app.use(avisos);
app.use(horarioQuadra);
app.use(pushNotification);
//FirstRun();

// Rota base
app.get('/', (req, res) => {
  res.send('API QuadraLivre funcionando!');
});

// Cloudflare R2 + Multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({ storage });

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
  },
});

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("Nenhum arquivo enviado.");

  const fileName = `${Date.now()}_${req.file.originalname}`;
  const params = {
    Bucket: process.env.CLOUDFLARE_R2_BUCKET,
    Key: `uploads/${fileName}`,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
    ACL: "public-read",
  };

  try {
    await s3.send(new PutObjectCommand(params));
    const fileUrl = `${process.env.URL_PUBLICA}/uploads/${fileName}`;
    res.status(200).json({ fileUrl });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ error: "Erro ao fazer upload do arquivo." });
  }
});

// Inicializa o servidor
const PORT = process.env.PORT || 3000;
const INTERVALO_ENCERRAMENTO_AGENDAMENTO_MS = 60 * 60 * 1000;
const INTERVALO_PROCESSAMENTO_AVISO_FIXO_MS = 6 * 60 * 60 * 1000;

const intervaloEncerramentoAgendamentos = setInterval(() => {
  encerrarAgendamentosConfirmadosPassados().catch((error) => {
    console.error(
      '[agendamento] Erro ao encerrar agendamentos confirmados passados:',
      error?.message || error,
    );
  });
}, INTERVALO_ENCERRAMENTO_AGENDAMENTO_MS);

const intervaloAvisoEncerramentoFixo = setInterval(() => {
  processarAvisosEncerramentoAgendamentosFixos().catch((error) => {
    console.error(
      '[agendamento-fixo] Erro ao processar avisos de encerramento:',
      error?.message || error,
    );
  });
}, INTERVALO_PROCESSAMENTO_AVISO_FIXO_MS);

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  encerrarAgendamentosConfirmadosPassados({ forcar: true }).catch((error) => {
    console.error(
      '[agendamento] Erro no processamento inicial de encerramento:',
      error?.message || error,
    );
  });
  processarAvisosEncerramentoAgendamentosFixos({ forcar: true }).catch((error) => {
    console.error(
      '[agendamento-fixo] Erro no processamento inicial de avisos:',
      error?.message || error,
    );
  });
});

async function encerrarServidor(signal) {
  console.log(`${signal} recebido. Encerrando servidor...`);
  clearInterval(intervaloEncerramentoAgendamentos);
  clearInterval(intervaloAvisoEncerramentoFixo);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  encerrarServidor('SIGINT').catch((error) => {
    console.error('Erro ao encerrar servidor:', error);
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  encerrarServidor('SIGTERM').catch((error) => {
    console.error('Erro ao encerrar servidor:', error);
    process.exit(1);
  });
});
