import { pool } from './db.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Pipeline Automatizado de Criação de Estratégia
 * Cria banco de dados + usuário genérico + arquivo HTML + Git Push / Deploy Vercel
 */
export async function createStrategyPipeline({
  title,
  clientName,
  clientEmail,
  slug,
  subtitle = '',
  metaPrincipal = '',
  territorio = '',
  genericPassword = null,
  htmlContent = null,
  autoGitPush = true
}) {
  const cleanSlug = (slug || title.toLowerCase().replace(/[^a-z0-9]/g, '-')).replace(/-+/g, '-');
  const password = genericPassword || `${cleanSlug}123`;

  console.log(`\n==============================================`);
  console.log(`🚀 INICIANDO PIPELINE AUTOMÁTICO: ${title}`);
  console.log(`==============================================`);

  try {
    // 1. Inserir ou Atualizar Estratégia no Neon Postgres
    console.log(`1️⃣ Registrando Estratégia no Neon DB...`);
    const stratRes = await pool.query(`
      INSERT INTO strategies (slug, title, client_name, subtitle, meta_principal, territorio, file_path)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (slug) DO UPDATE 
      SET title = EXCLUDED.title, client_name = EXCLUDED.client_name, subtitle = EXCLUDED.subtitle,
          meta_principal = EXCLUDED.meta_principal, territorio = EXCLUDED.territorio
      RETURNING *
    `, [cleanSlug, title, clientName, subtitle, metaPrincipal, territorio, `${cleanSlug}.html`]);
    const strategy = stratRes.rows[0];

    // 2. Inserir ou Atualizar Usuário Cliente
    console.log(`2️⃣ Criando Usuário e Senha Genérica...`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let user;
    const existingUser = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [clientEmail.trim()]);
    if (existingUser.rows.length > 0) {
      user = existingUser.rows[0];
      await pool.query('UPDATE users SET name = $1, password_hash = $2 WHERE id = $3', [clientName, passwordHash, user.id]);
    } else {
      const newUserRes = await pool.query(
        `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'client') RETURNING *`,
        [clientName, clientEmail.trim(), passwordHash]
      );
      user = newUserRes.rows[0];
    }

    // 3. Vincular Acesso do Usuário à Estratégia
    await pool.query(`
      INSERT INTO strategy_access (user_id, strategy_id) 
      VALUES ($1, $2) 
      ON CONFLICT DO NOTHING
    `, [user.id, strategy.id]);

    // 4. Gerar Arquivo Slide-Doc HTML se fornecido ou copiar base
    const htmlFilePath = path.join(rootDir, 'public', 'estrategias', `${cleanSlug}.html`);
    if (htmlContent) {
      fs.writeFileSync(htmlFilePath, htmlContent, 'utf-8');
      console.log(`3️⃣ Arquivo Slide-Doc gerado em: public/estrategias/${cleanSlug}.html`);
    }

    // 5. Deploy / Git Push Automático para Vercel
    if (autoGitPush) {
      console.log(`4️⃣ Preparando Commit & Deploy para Vercel via Git...`);
      try {
        execSync('git add .', { cwd: rootDir, stdio: 'pipe' });
        execSync(`git commit -m "feat(estrategia): nova estratégia ${title} (${cleanSlug})"`, { cwd: rootDir, stdio: 'pipe' });
        execSync('git push origin main', { cwd: rootDir, stdio: 'pipe' });
        console.log(`✅ Push para GitHub/Vercel concluído com sucesso!`);
      } catch (gitErr) {
        console.warn(`[Git Push Warning] Não foi possível fazer push automático: ${gitErr.message}`);
      }
    }

    console.log(`\n==============================================`);
    console.log(`🎉 ESTRATÉGIA CRIADA COM SUCESSO!`);
    console.log(`==============================================`);
    console.log(`📁 Projeto: ${title} (${cleanSlug})`);
    console.log(`👤 Cliente: ${clientName}`);
    console.log(`🔑 E-mail de Login: ${clientEmail}`);
    console.log(`🔒 Senha Gerada: ${password}`);
    console.log(`🔗 Link Direto: /estrategias/${cleanSlug}`);
    console.log(`==============================================\n`);

    return {
      success: true,
      strategy,
      credentials: {
        email: clientEmail,
        password: password,
        loginUrl: `/`,
        strategyUrl: `/estrategias/${cleanSlug}`
      }
    };
  } catch (err) {
    console.error('❌ Erro no Pipeline de Criação:', err);
    throw err;
  }
}
