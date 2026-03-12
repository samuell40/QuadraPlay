const nodemailer = require('nodemailer');

const BRAND_NAME = 'QuadraPlay';
const DEFAULT_SUPPORT_EMAIL = 'quadraplaysv@gmail.com';
const SUPPORT_EMAIL = String(
  process.env.SUPPORT_EMAIL ||
    process.env.SMTP_FROM_EMAIL ||
    process.env.SMTP_USER ||
    DEFAULT_SUPPORT_EMAIL
).trim();
const SUPPORT_FROM = `"Suporte - ${BRAND_NAME}" <${SUPPORT_EMAIL}>`;
const NOTICE_FROM = `"Avisos - ${BRAND_NAME}" <${SUPPORT_EMAIL}>`;
const SITE_URL =
  process.env.FRONTEND_URL ||
  process.env.APP_URL ||
  process.env.QUADRAPLAY_URL ||
  'https://quadraplaysv.com.br';
const BRAND_LOGO_URL =
  'https://pub-8c7959cad5c04469b16f4b0706a2e931.r2.dev/uploads/logo.png';

function parseBooleanEnv(value, fallback) {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;

  return fallback;
}

function parseNumberEnv(value, fallback) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return fallback;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const SMTP_HOST = String(
  process.env.SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com'
).trim();
const SMTP_PORT = parseNumberEnv(process.env.SMTP_PORT || process.env.MAIL_PORT, 465);
const SMTP_SECURE = parseBooleanEnv(process.env.SMTP_SECURE, SMTP_PORT === 465);
const SMTP_REQUIRE_TLS = parseBooleanEnv(process.env.SMTP_REQUIRE_TLS, !SMTP_SECURE);
const SMTP_USER = String(process.env.SMTP_USER || process.env.MAIL_USER || SUPPORT_EMAIL).trim();
const SMTP_PASS = String(process.env.SMTP_PASS || process.env.MAIL_PASS || '').trim();
const SMTP_FAMILY = parseNumberEnv(process.env.SMTP_FAMILY, 4);
const SMTP_CONNECTION_TIMEOUT = parseNumberEnv(process.env.SMTP_CONNECTION_TIMEOUT, 20000);
const SMTP_GREETING_TIMEOUT = parseNumberEnv(process.env.SMTP_GREETING_TIMEOUT, 15000);
const SMTP_SOCKET_TIMEOUT = parseNumberEnv(process.env.SMTP_SOCKET_TIMEOUT, 30000);
const RESEND_API_URL = String(process.env.RESEND_API_URL || 'https://api.resend.com/emails').trim();
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || '').trim();
const RESEND_FROM_EMAIL = String(process.env.RESEND_FROM_EMAIL || '').trim();
const RESEND_FROM_NAME = String(process.env.RESEND_FROM_NAME || '').trim();
const EMAIL_PROVIDER = String(
  process.env.EMAIL_PROVIDER ||
    process.env.EMAIL_TRANSPORT ||
    (RESEND_API_KEY ? 'resend' : 'smtp')
).trim().toLowerCase();
let warnedMissingSmtpPass = false;
let warnedMissingResendApiKey = false;

const TONE_MAP = {
  brand: {
    background: '#eff6ff',
    border: '#93c5fd',
    title: '#1d4ed8',
    text: '#1e3a8a',
  },
  success: {
    background: '#ecfdf5',
    border: '#86efac',
    title: '#166534',
    text: '#166534',
  },
  danger: {
    background: '#fef2f2',
    border: '#fca5a5',
    title: '#b91c1c',
    text: '#7f1d1d',
  },
  warning: {
    background: '#fff7ed',
    border: '#fdba74',
    title: '#c2410c',
    text: '#9a3412',
  },
};

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  requireTLS: SMTP_REQUIRE_TLS,
  family: SMTP_FAMILY === 6 ? 6 : 4,
  connectionTimeout: SMTP_CONNECTION_TIMEOUT,
  greetingTimeout: SMTP_GREETING_TIMEOUT,
  socketTimeout: SMTP_SOCKET_TIMEOUT,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value) {
  return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toHtmlLines(value) {
  return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

function strong(value) {
  return `<strong style="color: #0f172a;">${escapeHtml(value)}</strong>`;
}

function renderParagraph(content, options = {}) {
  const {
    size = 16,
    color = '#334155',
    marginBottom = 16,
  } = options;

  return `
    <p style="margin: 0 0 ${marginBottom}px; font-size: ${size}px; line-height: 1.7; color: ${color};">
      ${content}
    </p>
  `;
}

function renderDetailCard(title, items = []) {
  const validItems = items.filter(
    item => item && item.value !== undefined && item.value !== null && item.value !== ''
  );

  if (validItems.length === 0) return '';

  const rows = validItems
    .map((item, index) => {
      const borderTop = index === 0 ? '' : 'border-top: 1px solid #dbe7f5;';

      return `
        <tr>
          <td style="padding: 14px 0; ${borderTop}">
            <p style="margin: 0 0 4px; font-size: 11px; line-height: 1.4; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; font-weight: 700;">
              ${escapeHtml(item.label)}
            </p>
            <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #0f172a; font-weight: 700;">
              ${escapeHtml(item.value)}
            </p>
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0 0; border: 1px solid #dbe7f5; border-radius: 20px; background-color: #f8fbff;">
      <tr>
        <td style="padding: 20px 22px;">
          <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.4; letter-spacing: 0.12em; text-transform: uppercase; color: #2563eb; font-weight: 800;">
            ${escapeHtml(title)}
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${rows}
          </table>
        </td>
      </tr>
    </table>
  `;

  return html.replace(
    new RegExp(
      `${escapeRegExp(SITE_URL)}\\s*(?:[^\\w<]{1,6}\\s*)+${escapeRegExp(SUPPORT_EMAIL)}`
    ),
    SUPPORT_EMAIL
  );
}

function renderCallout({ title, content, tone = 'brand' }) {
  const palette = TONE_MAP[tone] || TONE_MAP.brand;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0 0;">
      <tr>
        <td style="padding: 18px 20px; border-left: 4px solid ${palette.border}; border-radius: 18px; background-color: ${palette.background};">
          <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.5; color: ${palette.title}; font-weight: 800;">
            ${escapeHtml(title)}
          </p>
          <p style="margin: 0; font-size: 15px; line-height: 1.7; color: ${palette.text};">
            ${content}
          </p>
        </td>
      </tr>
    </table>
  `;
}

function renderButton(label, url) {
  if (!label || !url) return '';

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px 0 0;">
      <tr>
        <td align="center" bgcolor="#2563eb" style="border-radius: 999px;">
          <a
            href="${escapeHtml(url)}"
            style="display: inline-block; padding: 14px 22px; font-size: 15px; line-height: 1; font-weight: 800; color: #ffffff; text-decoration: none;"
            target="_blank"
            rel="noopener noreferrer"
          >
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function createEmailLayout({
  preheader,
  eyebrow,
  title,
  recipientName,
  introHtml,
  sectionsHtml = '',
  ctaLabel,
  ctaUrl,
  footerNote,
}) {
  const safePreheader = escapeHtml(preheader || title || BRAND_NAME);
  const safeEyebrow = escapeHtml(eyebrow || 'Atualização da plataforma');
  const greetingHtml = recipientName
    ? renderParagraph(
        `Olá, ${strong(recipientName)}.`,
        { size: 16, color: '#334155', marginBottom: 18 }
      )
    : '';

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="x-ua-compatible" content="ie=edge" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #eef4fb;">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
          ${safePreheader}
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #eef4fb; margin: 0; padding: 24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #0d1736; border-radius: 28px; overflow: hidden;">
                <tr>
                  <td style="height: 6px; background: linear-gradient(90deg, #60a5fa 0%, #38bdf8 100%); font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding: 28px 32px 22px; background-color: #0d1736;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="64" valign="middle">
                          <img
                            src="${escapeHtml(BRAND_LOGO_URL)}"
                            width="48"
                            height="48"
                            alt="${BRAND_NAME}"
                            style="display: block; width: 48px; height: 48px; border: 0; border-radius: 14px;"
                          />
                        </td>
                        <td valign="middle" style="padding-left: 12px;">
                          <p style="margin: 0 0 4px; font-size: 11px; line-height: 1.4; letter-spacing: 0.16em; text-transform: uppercase; color: #93c5fd; font-weight: 800;">
                            Plataforma esportiva
                          </p>
                          <p style="margin: 0; font-size: 28px; line-height: 1; color: #ffffff; font-weight: 800;">
                            ${BRAND_NAME}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 16px 16px; background-color: #0d1736;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 24px;">
                      <tr>
                        <td style="padding: 34px 32px 32px;">
                          <p style="margin: 0 0 12px; font-size: 12px; line-height: 1.4; letter-spacing: 0.12em; text-transform: uppercase; color: #2563eb; font-weight: 800;">
                            ${safeEyebrow}
                          </p>
                          <h1 style="margin: 0 0 18px; font-size: 30px; line-height: 1.15; color: #0f172a; font-weight: 800;">
                            ${escapeHtml(title)}
                          </h1>
                          ${greetingHtml}
                          ${introHtml}
                          ${sectionsHtml}
                          ${renderButton(ctaLabel, ctaUrl)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 32px 30px; background-color: #0d1736;">
                    <p style="margin: 0 0 12px; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
                      ${escapeHtml(
                        footerNote ||
                          `Este é um email automático enviado pela equipe ${BRAND_NAME}.`
                      )}
                    </p>
                    <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #94a3b8;">
                      ${BRAND_NAME} •
                      ${escapeHtml(SITE_URL)}
                      •
                      ${escapeHtml(SUPPORT_EMAIL)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `.replace(
    new RegExp(
      `${escapeRegExp(SITE_URL)}\\s*(?:[^\\w<]{1,6}\\s*)+${escapeRegExp(SUPPORT_EMAIL)}`
    ),
    SUPPORT_EMAIL
  );
}

function htmlToText(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<\/(p|div|tr|table|h1|h2|h3|h4|h5|h6|li|td)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function buildSubject(subject) {
  return `${subject} | ${BRAND_NAME}`;
}

function buildAppUrl(path = '/') {
  try {
    return new URL(path, SITE_URL).toString();
  } catch (error) {
    return SITE_URL;
  }
}

function formatarPermissao(descricao) {
  return String(descricao || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letra => letra.toUpperCase());
}

function formatarDataCurta(data) {
  if (!data) return '';

  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return '';

  try {
    return date.toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' });
  } catch (error) {
    return date.toLocaleDateString('pt-BR');
  }
}

function formatarDataAgendamento(agendamento) {
  return `${String(agendamento.dia).padStart(2, '0')}/${String(agendamento.mes).padStart(2, '0')}/${agendamento.ano}`;
}

function formatarHoraAgendamento(hora) {
  return `${String(hora).padStart(2, '0')}:00`;
}

function parseJsonSafe(content) {
  try {
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function normalizeRecipients(value) {
  const list = Array.isArray(value) ? value : [value];
  return list
    .map(item => String(item || '').trim())
    .filter(Boolean);
}

function resolveResendFrom(from) {
  if (!RESEND_FROM_EMAIL) return from;

  const fallbackName = `Suporte - ${BRAND_NAME}`;
  const extractedName = String(from || '')
    .replace(/<[^>]*>/g, '')
    .replace(/["']/g, '')
    .trim();
  const senderName = (RESEND_FROM_NAME || extractedName || fallbackName).replace(/"/g, '');

  return `"${senderName}" <${RESEND_FROM_EMAIL}>`;
}

async function sendWithResend({ from, to, bcc, subject, html, text }) {
  if (!RESEND_API_KEY) {
    if (!warnedMissingResendApiKey) {
      warnedMissingResendApiKey = true;
      console.warn(
        '[email] RESEND_API_KEY nao configurado. Defina a variavel de ambiente para envio HTTP.'
      );
    }
    throw new Error('RESEND_API_KEY nao configurado.');
  }

  if (typeof fetch !== 'function') {
    throw new Error('Runtime sem suporte a fetch para envio HTTP de email.');
  }

  const toList = normalizeRecipients(to || (bcc ? SUPPORT_EMAIL : undefined));
  const bccList = normalizeRecipients(bcc);

  if (toList.length === 0 && bccList.length === 0) {
    throw new Error('Nenhum destinatario valido para envio de email.');
  }

  const payload = {
    from: resolveResendFrom(from),
    to: toList,
    bcc: bccList.length ? bccList : undefined,
    subject,
    html,
    text: text || htmlToText(html),
    reply_to: SUPPORT_EMAIL,
  };

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const rawBody = await response.text();
  if (!response.ok) {
    const parsedBody = parseJsonSafe(rawBody);
    const detail =
      parsedBody?.message ||
      parsedBody?.error ||
      parsedBody?.name ||
      rawBody ||
      'N/A';

    console.error(
      `[email] Falha RESEND (status=${response.status}) detail=${detail}`
    );

    const error = new Error(`Falha RESEND (status=${response.status}).`);
    error.code = 'RESEND_ERROR';
    error.status = response.status;
    throw error;
  }

  return parseJsonSafe(rawBody) || { ok: true };
}

async function enviarEmail({ from = SUPPORT_FROM, to, bcc, subject, html, text }) {
  if (EMAIL_PROVIDER === 'resend') {
    return sendWithResend({ from, to, bcc, subject, html, text });
  }

  if (EMAIL_PROVIDER !== 'smtp') {
    console.warn(
      `[email] EMAIL_PROVIDER "${EMAIL_PROVIDER}" invalido. Usando fallback SMTP.`
    );
  }

  if (!SMTP_PASS && !warnedMissingSmtpPass) {
    warnedMissingSmtpPass = true;
    console.warn(
      '[email] SMTP_PASS nao configurado. Defina a variavel de ambiente para evitar falha no envio.'
    );
  }

  try {
    return await transporter.sendMail({
      from,
      to: to || (bcc ? SUPPORT_EMAIL : undefined),
      bcc,
      replyTo: SUPPORT_EMAIL,
      subject,
      html,
      text: text || htmlToText(html),
    });
  } catch (error) {
    console.error(
      `[email] Falha SMTP (${SMTP_HOST}:${SMTP_PORT}, secure=${SMTP_SECURE}) code=${error?.code || 'N/A'} command=${error?.command || 'N/A'}`
    );
    throw error;
  }
}

async function enviarEmailNovaModalidade(dev, modalidadeNome) {
  const nomeModalidadeFormatado =
    String(modalidadeNome || '').charAt(0).toUpperCase() + String(modalidadeNome || '').slice(1);

  const html = createEmailLayout({
    preheader: `Nova modalidade cadastrada: ${nomeModalidadeFormatado}`,
    eyebrow: 'Atualização administrativa',
    title: 'Nova modalidade cadastrada',
    recipientName: dev.nome,
    introHtml:
      renderParagraph(
        `A modalidade ${strong(nomeModalidadeFormatado)} foi cadastrada com sucesso na plataforma.`
      ) +
      renderParagraph(
        'Esse comunicado mantém a equipe alinhada com as mudanças do sistema.',
        { size: 15, color: '#475569', marginBottom: 0 }
      ),
    sectionsHtml: renderDetailCard('Resumo da atualização', [
      { label: 'Modalidade', value: nomeModalidadeFormatado },
      { label: 'Origem', value: 'Cadastro interno no QuadraPlay' },
    ]),
    ctaLabel: 'Ver modalidades',
    ctaUrl: buildAppUrl('/modalidades'),
    footerNote:
      'Aviso enviado para a equipe responsável por acompanhar as modalidades disponíveis na plataforma.',
  });

  return enviarEmail({
    to: dev.email,
    subject: buildSubject('Nova modalidade cadastrada'),
    html,
  });
}

async function enviarEmailAlteracaoPermissao(usuario) {
  if (![1, 2, 4].includes(usuario.permissaoId)) return;

  const descricaoFormatada = formatarPermissao(usuario.permissao.descricao);
  const quadraNome = usuario.quadra?.nome || '';

  const introHtml =
    usuario.permissaoId === 2 && quadraNome
      ? renderParagraph(
          `Seu perfil foi atualizado para ${strong(descricaoFormatada)} e vinculado à quadra ${strong(quadraNome)}.`
        )
      : renderParagraph(
          `Sua função na plataforma foi atualizada para ${strong(descricaoFormatada)}.`
        );

  const html = createEmailLayout({
    preheader: `Seu perfil agora possui acesso como ${descricaoFormatada}`,
    eyebrow: 'Atualização de acesso',
    title: 'Seu perfil foi atualizado',
    recipientName: usuario.nome,
    introHtml,
    sectionsHtml:
      renderDetailCard('Seu novo acesso', [
        { label: 'Permissão', value: descricaoFormatada },
        { label: 'Quadra', value: quadraNome },
      ]) +
      renderCallout({
        tone: 'brand',
        title: 'Mudança confirmada',
        content:
          'Se você perceber qualquer inconsistência no acesso, entre em contato com nosso suporte',
      }),
    ctaLabel: 'Acessar plataforma',
    ctaUrl: buildAppUrl('/'),
    footerNote:
      'Sempre que houver uma mudança relevante de acesso ou responsabilidade, você será avisado por aqui.',
  });

  return enviarEmail({
    to: usuario.email,
    subject: buildSubject('Seu perfil foi atualizado'),
    html,
  });
}

async function enviarEmailVinculoTime(usuario, time, jogador) {
  const nomeTime = time?.nome || 'Time';
  const nomeModalidade = time?.modalidade?.nome || 'Modalidade';
  const nomeJogador = jogador?.nome || usuario?.nome || 'Jogador';

  const html = createEmailLayout({
    preheader: `Você agora faz parte do time ${nomeTime}`,
    eyebrow: 'Novo vínculo esportivo',
    title: 'Você entrou em um novo time',
    recipientName: usuario.nome,
    introHtml:
      renderParagraph(
        `Seu perfil foi vinculado ao time ${strong(nomeTime)} da modalidade ${strong(nomeModalidade)}.`
      ) +
      renderParagraph(
        'O cadastro foi registrado com sucesso e já está disponível na plataforma.',
        { size: 15, color: '#475569', marginBottom: 0 }
      ),
    sectionsHtml: renderDetailCard('Dados do vínculo', [
      { label: 'Time', value: nomeTime },
      { label: 'Modalidade', value: nomeModalidade },
      { label: 'Registro do jogador', value: nomeJogador },
    ]),
    ctaLabel: 'Ver times',
    ctaUrl: buildAppUrl('/times'),
    footerNote:
      'Se alguma informação do seu vínculo estiver incorreta, fale com o nosso suporte',
  });

  return enviarEmail({
    to: usuario.email,
    subject: buildSubject('Novo vínculo com time'),
    html,
  });
}

async function enviarEmailVinculoMesarioCampeonato(mesario, campeonato) {
  if (!mesario?.email) return;

  const nomeMesario = mesario?.nome || 'Mesário';
  const nomeCampeonato = campeonato?.nome || 'Campeonato';
  const nomeModalidade = campeonato?.modalidade?.nome || '';
  const nomeQuadra = campeonato?.quadra?.nome || '';

  const html = createEmailLayout({
    preheader: `Vínculo confirmado no campeonato ${nomeCampeonato}`,
    eyebrow: 'Campeonatos',
    title: 'Vínculo confirmado em campeonato',
    recipientName: nomeMesario,
    introHtml:
      renderParagraph(
        `Seu vínculo como ${strong('Mesário')} no campeonato ${strong(nomeCampeonato)} foi confirmado.`
      ) +
      renderParagraph(
        'A partir de agora, você pode acompanhar as atividades relacionadas a essa competição dentro da plataforma.',
        { size: 15, color: '#475569', marginBottom: 0 }
      ),
    sectionsHtml: renderDetailCard('Resumo do campeonato', [
      { label: 'Função', value: 'Mesário' },
      { label: 'Campeonato', value: nomeCampeonato },
      { label: 'Modalidade', value: nomeModalidade },
      { label: 'Quadra', value: nomeQuadra },
    ]),
    ctaLabel: 'Abrir plataforma',
    ctaUrl: buildAppUrl('/'),
    footerNote:
      'Este email confirma o seu vínculo operacional para o campeonato informado.',
  });

  return enviarEmail({
    to: mesario.email,
    subject: buildSubject('Vínculo confirmado em campeonato'),
    html,
  });
}

async function enviarEmailVinculoTreinador(usuario, time) {
  if (!usuario?.email) return;

  const nomeUsuario = usuario?.nome || 'Usuário';
  const nomeTime = time?.nome || 'Time';
  const nomeModalidade = time?.modalidade?.nome || '';

  const html = createEmailLayout({
    preheader: `Seu perfil agora está vinculado como treinador do time ${nomeTime}`,
    eyebrow: 'Atualização de perfil',
    title: 'Perfil atualizado para treinador',
    recipientName: nomeUsuario,
    introHtml:
      renderParagraph(
        `Sua permissão foi atualizada para ${strong('Treinador')} e seu perfil foi conectado ao time ${strong(nomeTime)}.`
      ) +
      renderParagraph(
        'Esse novo vínculo já pode ser consultado na plataforma.',
        { size: 15, color: '#475569', marginBottom: 0 }
      ),
    sectionsHtml: renderDetailCard('Resumo do vínculo', [
      { label: 'Permissão', value: 'Treinador' },
      { label: 'Time', value: nomeTime },
      { label: 'Modalidade', value: nomeModalidade },
    ]),
    ctaLabel: 'Ver times',
    ctaUrl: buildAppUrl('/times'),
    footerNote:
      'Em caso de divergência nos dados do seu time ou da modalidade, procure a administração responsável.',
  });

  return enviarEmail({
    to: usuario.email,
    subject: buildSubject('Perfil atualizado para treinador'),
    html,
  });
}

async function enviarEmailStatusAgendamento(agendamento) {
  const confirmado = agendamento.status === 'Confirmado';
  const statusFormatado = confirmado ? 'confirmado' : 'recusado';
  const nomeUsuario = String(agendamento?.usuario?.nome || 'Usuario').trim();
  const emailUsuario = String(agendamento?.usuario?.email || '').trim();
  const nomeQuadra = String(agendamento?.quadra?.nome || 'quadra selecionada').trim();
  const nomeModalidade = String(agendamento?.modalidade?.nome || '').trim();
  const contextoModalidade = nomeModalidade
    ? ` para a modalidade ${strong(nomeModalidade)}`
    : '';

  if (!emailUsuario) {
    console.warn('[email] Agendamento sem email do usuario. Envio de status ignorado.');
    return;
  }
  const blocoStatus = confirmado
    ? renderCallout({
        tone: 'success',
        title: 'Horário reservado',
        content:
          'Seu pedido foi aprovado. Recomendamos chegar com antecedência para aproveitar o horário reservado.',
      })
    : renderCallout({
        tone: agendamento.motivoRecusa ? 'danger' : 'warning',
        title: agendamento.motivoRecusa ? 'Motivo da recusa' : 'Solicitação recusada',
        content: agendamento.motivoRecusa
          ? toHtmlLines(agendamento.motivoRecusa)
          : 'A solicitação não foi aprovada. Consulte outros horários disponíveis na plataforma.',
      });

  const html = createEmailLayout({
    preheader: `Seu agendamento foi ${statusFormatado}`,
    eyebrow: 'Atualização de agendamento',
    title: confirmado ? 'Seu agendamento foi confirmado' : 'Seu agendamento foi recusado',
    recipientName: nomeUsuario,
    introHtml: renderParagraph(
      `Analisamos sua solicitação e o agendamento na quadra ${strong(nomeQuadra)}${contextoModalidade} foi ${strong(statusFormatado)}.`
    ),
    sectionsHtml:
      renderDetailCard('Dados do agendamento', [
        { label: 'Quadra', value: nomeQuadra },
        { label: 'Modalidade', value: nomeModalidade },
        { label: 'Data', value: formatarDataAgendamento(agendamento) },
        { label: 'Horário', value: formatarHoraAgendamento(agendamento.hora) },
        { label: 'Status', value: confirmado ? 'Confirmado' : 'Recusado' },
      ]) + blocoStatus,
    ctaLabel: 'Ver meus agendamentos',
    ctaUrl: buildAppUrl('/meusagendamentos'),
    footerNote:
      'Se precisar reagendar ou consultar outros horários, acesse a plataforma e acompanhe a disponibilidade da quadra.',
  });

  return enviarEmail({
    to: emailUsuario,
    subject: buildSubject(
      confirmado ? 'Agendamento confirmado' : 'Agendamento recusado'
    ),
    html,
  });
}

async function enviarEmailNovoAviso(emailsDestinatarios, aviso) {
  if (!emailsDestinatarios || emailsDestinatarios.length === 0) return;

  const tituloAviso = aviso?.titulo || 'Novo aviso';
  const descricaoAviso = aviso?.descricao || '';
  const origemAviso = aviso?.quadra?.nome || 'Comunicado geral';
  const dataAviso = formatarDataCurta(aviso?.data);

  const html = createEmailLayout({
    preheader: `Novo aviso publicado: ${tituloAviso}`,
    eyebrow: 'Mural da plataforma',
    title: 'Novo aviso no mural',
    introHtml:
      renderParagraph(
        'Um novo comunicado foi publicado para manter você atualizado sobre a plataforma e as atividades da quadra.'
      ) +
      renderCallout({
        tone: 'brand',
        title: tituloAviso,
        content: toHtmlLines(descricaoAviso),
      }),
    sectionsHtml: renderDetailCard('Detalhes do aviso', [
      { label: 'Origem', value: origemAviso },
      { label: 'Publicado em', value: dataAviso },
    ]),
    ctaLabel: 'Ler avisos',
    ctaUrl: buildAppUrl('/meusavisos'),
    footerNote:
      'Consulte o mural com frequência para acompanhar novidades importantes da plataforma, da quadra e dos campeonatos.',
  });

  return enviarEmail({
    from: NOTICE_FROM,
    bcc: emailsDestinatarios,
    subject: buildSubject(`Novo aviso: ${tituloAviso}`),
    html,
  });
}

module.exports = {
  enviarEmail,
  enviarEmailNovaModalidade,
  enviarEmailAlteracaoPermissao,
  enviarEmailVinculoTime,
  enviarEmailVinculoMesarioCampeonato,
  enviarEmailVinculoTreinador,
  enviarEmailStatusAgendamento,
  enviarEmailNovoAviso,
};
