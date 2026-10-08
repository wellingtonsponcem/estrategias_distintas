import dotenv from 'dotenv';

dotenv.config();

export class BrevoService {
  privateKey() {
    return process.env.BREVO_API_KEY || '';
  }

  senderEmail() {
    return process.env.BREVO_SENDER_EMAIL || 'ola@wedistinto.com';
  }

  senderName() {
    return process.env.BREVO_SENDER_NAME || 'Distinto • Estratégias';
  }

  isConfigured() {
    const key = this.privateKey();
    return Boolean(key && key !== 'xkeysib-sua_chave_brevo_aqui' && key.startsWith('xkeysib-'));
  }

  /**
   * Envia um e-mail transacional via API REST da Brevo
   */
  async sendEmail({ to, subject, htmlContent }) {
    if (!this.isConfigured()) {
      console.warn(`[Brevo] BREVO_API_KEY não configurada ou de exemplo. Simulando envio para: ${to[0]?.email}`);
      console.log(`[Brevo Simulação] Assunto: ${subject}`);
      return { ok: true, simulated: true };
    }

    try {
      const payload = {
        sender: {
          name: this.senderName(),
          email: this.senderEmail()
        },
        to: to.map(item => ({ email: item.email, name: item.name || item.email })),
        subject,
        htmlContent
      };

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': this.privateKey(),
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('[Brevo Error]', data);
        return { ok: false, error: data.message || 'Erro no envio de e-mail via Brevo.' };
      }

      console.log(`[Brevo] E-mail enviado com sucesso para ${to[0]?.email}. MessageId: ${data.messageId}`);
      return { ok: true, messageId: data.messageId };
    } catch (err) {
      console.error('[Brevo Exception]', err);
      return { ok: false, error: err.message };
    }
  }

  /**
   * Template elegante para envio de dados de acesso
   */
  async sendCredentialsEmail({ name, email, password, loginUrl, role, strategyTitle }) {
    const isClient = role === 'client';
    const subject = isClient 
      ? `🔐 Seus dados de acesso à Estratégia • ${strategyTitle || 'Agência Distinto'}`
      : `👑 Seus dados de acesso ao Painel Administrativo • Agência Distinto`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #0A0E0B; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #EDE6D8;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0A0E0B; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="560" style="max-width: 560px; background-color: #141A16; border: 1px solid #243027; border-radius: 24px; padding: 36px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <span style="font-size: 24px; font-weight: bold; color: #D4AF37; letter-spacing: 2px;">✦ DISTINTO</span>
                  <p style="font-size: 11px; text-transform: uppercase; color: #8C775D; letter-spacing: 3px; margin: 4px 0 0 0;">Inteligência & Posicionamento</p>
                </td>
              </tr>
              <tr>
                <td style="border-top: 1px solid #243027; padding-top: 24px;">
                  <h2 style="font-size: 20px; font-weight: 600; color: #FFFFFF; margin: 0 0 12px 0;">Olá, ${name}!</h2>
                  <p style="font-size: 14px; line-height: 1.6; color: #EDE6D8; opacity: 0.85; margin: 0 0 24px 0;">
                    ${isClient 
                      ? `Seu acesso à apresentação estratégica de <strong>${strategyTitle || 'seu projeto'}</strong> está pronto e liberado na plataforma da Distinto.`
                      : `Sua conta de <strong>Administrador</strong> foi configurada no Painel de Estratégias da Distinto.`
                    }
                  </p>
                  
                  <!-- Box de Credenciais -->
                  <table width="100%" style="background-color: #0A0E0B; border: 1px solid #243027; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding-bottom: 10px;">
                        <span style="font-size: 11px; text-transform: uppercase; color: #8C775D; letter-spacing: 1px; display: block;">E-mail de Login</span>
                        <strong style="font-size: 15px; color: #FFFFFF; font-family: monospace;">${email}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <span style="font-size: 11px; text-transform: uppercase; color: #8C775D; letter-spacing: 1px; display: block;">Senha de Acesso</span>
                        <strong style="font-size: 15px; color: #D4AF37; font-family: monospace;">${password}</strong>
                      </td>
                    </tr>
                  </table>

                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="padding: 10px 0 20px 0;">
                        <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; background-color: #D4AF37; color: #0A0E0B; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 99px; box-shadow: 0 6px 20px rgba(212,175,55,0.3);">
                          Acessar Plataforma →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 12px; line-height: 1.5; color: #8C775D; text-align: center; margin: 0;">
                    Recomendamos salvar este e-mail ou alterar sua senha no primeiro acesso caso deseje.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: [{ email, name }],
      subject,
      htmlContent
    });
  }

  /**
   * Template para recuperação de senha
   */
  async sendPasswordResetEmail({ name, email, resetUrl }) {
    const subject = `🔑 Recuperação de Senha • Portal Distinto`;
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #0A0E0B; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #EDE6D8;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0A0E0B; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="560" style="max-width: 560px; background-color: #141A16; border: 1px solid #243027; border-radius: 24px; padding: 36px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <span style="font-size: 24px; font-weight: bold; color: #D4AF37; letter-spacing: 2px;">✦ DISTINTO</span>
                </td>
              </tr>
              <tr>
                <td style="border-top: 1px solid #243027; padding-top: 24px;">
                  <h2 style="font-size: 20px; font-weight: 600; color: #FFFFFF; margin: 0 0 12px 0;">Recuperação de Senha</h2>
                  <p style="font-size: 14px; line-height: 1.6; color: #EDE6D8; opacity: 0.85; margin: 0 0 24px 0;">
                    Olá, <strong>${name || 'usuário'}</strong>. Recebemos uma solicitação para redefinir a sua senha de acesso ao Portal de Estratégias da Distinto.
                  </p>

                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="padding: 10px 0 24px 0;">
                        <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; background-color: #D4AF37; color: #0A0E0B; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 99px; box-shadow: 0 6px 20px rgba(212,175,55,0.3);">
                          Redefinir Minha Senha →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 12px; line-height: 1.5; color: #8C775D; text-align: center; margin: 0;">
                    Este link é válido por <strong>1 hora</strong>. Se você não solicitou a recuperação, ignore este e-mail.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: [{ email, name }],
      subject,
      htmlContent
    });
  }

  /**
   * Template para pedir ao cliente que corrija o briefing enviado
   */
  async sendBriefingEditEmail({ name, email, companyName, editUrl, note }) {
    const subject = `✏️ Ajustes no seu Briefing • ${companyName || 'Agência Distinto'}`;
    const escapedNote = (note || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #0A0E0B; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #EDE6D8;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0A0E0B; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="560" style="max-width: 560px; background-color: #141A16; border: 1px solid #243027; border-radius: 24px; padding: 36px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <span style="font-size: 24px; font-weight: bold; color: #D4AF37; letter-spacing: 2px;">✦ DISTINTO</span>
                </td>
              </tr>
              <tr>
                <td style="border-top: 1px solid #243027; padding-top: 24px;">
                  <h2 style="font-size: 20px; font-weight: 600; color: #FFFFFF; margin: 0 0 12px 0;">Olá, ${name || 'tudo bem'}!</h2>
                  <p style="font-size: 14px; line-height: 1.6; color: #EDE6D8; opacity: 0.85; margin: 0 0 20px 0;">
                    Revisamos o briefing de <strong>${companyName || 'sua empresa'}</strong> e precisamos de alguns ajustes antes de seguir com a estratégia. Suas respostas já estão preenchidas — basta corrigir o necessário e reenviar.
                  </p>
                  ${escapedNote ? `
                  <table width="100%" style="background-color: #0A0E0B; border: 1px solid #243027; border-radius: 16px; padding: 16px 20px; margin-bottom: 24px;">
                    <tr><td>
                      <span style="font-size: 11px; text-transform: uppercase; color: #8C775D; letter-spacing: 1px; display: block; margin-bottom: 6px;">O que precisa ser ajustado</span>
                      <span style="font-size: 14px; line-height: 1.6; color: #FFFFFF;">${escapedNote}</span>
                    </td></tr>
                  </table>` : ''}

                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="padding: 10px 0 24px 0;">
                        <a href="${editUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; background-color: #D4AF37; color: #0A0E0B; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 99px; box-shadow: 0 6px 20px rgba(212,175,55,0.3);">
                          Corrigir Meu Briefing →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 12px; line-height: 1.5; color: #8C775D; text-align: center; margin: 0;">
                    O link é exclusivo e vale para um único reenvio.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: [{ email, name }],
      subject,
      htmlContent
    });
  }
}

export const brevoService = new BrevoService();
