import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { pool } from './db.js';
import { brevoService } from './brevo.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'distinto_jwt_secret_key_2026';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(rootDir, 'public')));
app.use('/assets', express.static(path.join(rootDir, 'public/assets')));
app.use('/dist', express.static(path.join(rootDir, 'dist')));

// Middleware de Autenticação JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso não autorizado. Faça login.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Sessão expirada ou inválida.' });
    }
    req.user = user;
    next();
  });
}

// Middleware de autorização para ADMIN
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito para administradores.' });
  }
  next();
}

// Helper para montar URL base
function getBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

// ==========================================
// ROUTER DE API (Compatível com /api e sem prefixo)
// ==========================================
const apiRouter = express.Router();

// 1. ROTAS DE AUTENTICAÇÃO
apiRouter.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Preencha o e-mail e a senha.' });
  }

  try {
    const userQuery = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const user = userQuery.rows[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    // Se for admin, vai para o dashboard
    if (user.role === 'admin') {
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: 'admin' },
        redirectUrl: '/admin'
      });
    }

    // Se for cliente, buscar qual estratégia ele tem acesso
    const accessQuery = await pool.query(`
      SELECT s.slug, s.title, s.client_name
      FROM strategy_access sa
      JOIN strategies s ON sa.strategy_id = s.id
      WHERE sa.user_id = $1 AND s.active = true
      LIMIT 1
    `, [user.id]);

    if (accessQuery.rows.length === 0) {
      return res.status(403).json({
        error: 'Você não possui nenhuma estratégia associada a este usuário. Entre em contato com a Distinto.'
      });
    }

    const strategy = accessQuery.rows[0];
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: 'client', strategySlug: strategy.slug },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: 'client' },
      redirectUrl: `/estrategias/${strategy.slug}`
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno no servidor ao processar login.' });
  }
});

// Checar sessão atual
apiRouter.get('/auth/me', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

// Solicitar recuperação de senha (Forgot Password)
apiRouter.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Informe o e-mail cadastrado.' });
  }

  try {
    const userQuery = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (userQuery.rows.length === 0) {
      return res.json({ message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação em instantes.' });
    }

    const user = userQuery.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hora

    await pool.query(
      `INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, resetToken, expiresAt]
    );

    const resetUrl = `${getBaseUrl(req)}/reset-password?token=${resetToken}`;
    
    // Disparar e-mail via Brevo
    await brevoService.sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      resetUrl
    });

    res.json({ message: 'E-mail de recuperação enviado com sucesso!' });
  } catch (err) {
    console.error('Erro na recuperação de senha:', err);
    res.status(500).json({ error: 'Erro ao processar recuperação de senha.' });
  }
});

// Redefinir senha com o token
apiRouter.post('/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
  }

  try {
    const tokenQuery = await pool.query(
      `SELECT pr.*, u.email, u.name 
       FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.token = $1 AND pr.used = false AND pr.expires_at > NOW()`,
      [token]
    );

    if (tokenQuery.rows.length === 0) {
      return res.status(400).json({ error: 'Link de recuperação expirado ou inválido. Solicite novamente.' });
    }

    const reset = tokenQuery.rows[0];
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password.trim(), salt);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, reset.user_id]);
    await pool.query('UPDATE password_resets SET used = true WHERE id = $3', [true, reset.id]);

    res.json({ message: 'Senha redefinida com sucesso! Você já pode fazer login.' });
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    res.status(500).json({ error: 'Erro ao processar nova senha.' });
  }
});

// 2. ROTAS DE ESTRATÉGIAS
apiRouter.get('/strategies', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const result = await pool.query(`
        SELECT 
          s.*,
          COALESCE(
            json_agg(
              json_build_object('id', u.id, 'name', u.name, 'email', u.email)
            ) FILTER (WHERE u.id IS NOT NULL),
            '[]'
          ) as clients
        FROM strategies s
        LEFT JOIN strategy_access sa ON s.id = sa.strategy_id
        LEFT JOIN users u ON sa.user_id = u.id
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `);
      return res.json(result.rows);
    } else {
      const result = await pool.query(`
        SELECT s.*
        FROM strategies s
        JOIN strategy_access sa ON s.id = sa.strategy_id
        WHERE sa.user_id = $1 AND s.active = true
      `, [req.user.id]);
      return res.json(result.rows);
    }
  } catch (err) {
    console.error('Erro ao listar estratégias:', err);
    res.status(500).json({ error: 'Erro ao listar estratégias.' });
  }
});

apiRouter.post('/strategies', authenticateToken, requireAdmin, async (req, res) => {
  const {
    slug, title, client_name, subtitle, description,
    meta_principal, territorio, prazo, approach, logo_url, file_path
  } = req.body;

  if (!slug || !title || !client_name) {
    return res.status(400).json({ error: 'Slug, título e nome do cliente são obrigatórios.' });
  }

  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');

  try {
    const existing = await pool.query('SELECT id FROM strategies WHERE slug = $1', [cleanSlug]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Já existe uma estratégia com este slug/identificador.' });
    }

    const result = await pool.query(`
      INSERT INTO strategies (
        slug, title, client_name, subtitle, description,
        meta_principal, territorio, prazo, approach, logo_url, file_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      cleanSlug, title, client_name, subtitle || '', description || '',
      meta_principal || '', territorio || '', prazo || '', approach || '',
      logo_url || '/assets/logo.png', file_path || 'index.html'
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar estratégia:', err);
    res.status(500).json({ error: 'Erro ao criar estratégia.' });
  }
});

apiRouter.delete('/strategies/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { confirmSlug } = req.body;

  try {
    const strat = await pool.query('SELECT * FROM strategies WHERE id = $1', [id]);
    if (strat.rows.length === 0) {
      return res.status(404).json({ error: 'Estratégia não encontrada.' });
    }

    const strategy = strat.rows[0];
    if (confirmSlug !== strategy.slug) {
      return res.status(400).json({
        error: `Para confirmar a exclusão, você deve digitar o slug exato: "${strategy.slug}"`
      });
    }

    await pool.query('DELETE FROM strategies WHERE id = $1', [id]);
    res.json({ message: `Estratégia "${strategy.title}" excluída com sucesso.` });
  } catch (err) {
    console.error('Erro ao excluir estratégia:', err);
    res.status(500).json({ error: 'Erro ao excluir estratégia.' });
  }
});

// 3. ROTAS DE CLIENTES
apiRouter.get('/users/clients', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.role, u.created_at,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'title', s.title, 'slug', s.slug)
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as strategies
      FROM users u
      LEFT JOIN strategy_access sa ON u.id = sa.user_id
      LEFT JOIN strategies s ON sa.strategy_id = s.id
      WHERE u.role = 'client'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar clientes:', err);
    res.status(500).json({ error: 'Erro ao listar clientes.' });
  }
});

apiRouter.post('/users/clients', authenticateToken, requireAdmin, async (req, res) => {
  const { name, email, password, strategyId, sendEmail } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password.trim(), salt);

    const userRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'client') RETURNING id, name, email, role, created_at`,
      [name, email.trim(), passwordHash]
    );
    const newUser = userRes.rows[0];

    let strategyTitle = '';
    if (strategyId) {
      await pool.query(
        `INSERT INTO strategy_access (user_id, strategy_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [newUser.id, strategyId]
      );
      const stratInfo = await pool.query('SELECT title FROM strategies WHERE id = $1', [strategyId]);
      if (stratInfo.rows.length > 0) {
        strategyTitle = stratInfo.rows[0].title;
      }
    }

    if (sendEmail) {
      await brevoService.sendCredentialsEmail({
        name,
        email: email.trim(),
        password: password.trim(),
        loginUrl: getBaseUrl(req),
        role: 'client',
        strategyTitle
      });
    }

    res.status(201).json(newUser);
  } catch (err) {
    console.error('Erro ao cadastrar cliente:', err);
    res.status(500).json({ error: 'Erro ao cadastrar cliente.' });
  }
});

apiRouter.put('/users/clients/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, password, strategyIds, sendEmail } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2', [email.trim(), id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Já existe outro usuário cadastrado com este e-mail.' });
    }

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password.trim(), salt);
      await pool.query(
        `UPDATE users SET name = $1, email = $2, password_hash = $3 WHERE id = $4 AND role = 'client'`,
        [name, email.trim(), passwordHash, id]
      );
    } else {
      await pool.query(
        `UPDATE users SET name = $1, email = $2 WHERE id = $3 AND role = 'client'`,
        [name, email.trim(), id]
      );
    }

    if (Array.isArray(strategyIds)) {
      await pool.query('DELETE FROM strategy_access WHERE user_id = $1', [id]);
      for (const stratId of strategyIds) {
        if (stratId) {
          await pool.query(
            'INSERT INTO strategy_access (user_id, strategy_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, stratId]
          );
        }
      }
    }

    if (sendEmail && password && password.trim() !== '') {
      await brevoService.sendCredentialsEmail({
        name,
        email: email.trim(),
        password: password.trim(),
        loginUrl: getBaseUrl(req),
        role: 'client'
      });
    }

    const updatedUser = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.role, u.created_at,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'title', s.title, 'slug', s.slug)
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as strategies
      FROM users u
      LEFT JOIN strategy_access sa ON u.id = sa.user_id
      LEFT JOIN strategies s ON sa.strategy_id = s.id
      WHERE u.id = $1
      GROUP BY u.id
    `, [id]);

    res.json(updatedUser.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar cliente:', err);
    res.status(500).json({ error: 'Erro ao atualizar dados do cliente.' });
  }
});

apiRouter.delete('/users/clients/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = $1 AND role = 'client'", [id]);
    res.json({ message: 'Cliente excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir cliente:', err);
    res.status(500).json({ error: 'Erro ao excluir cliente.' });
  }
});

// 4. ROTAS DE ADMINISTRADORES
apiRouter.get('/users/admins', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role, created_at
      FROM users
      WHERE role = 'admin'
      ORDER BY created_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar administradores:', err);
    res.status(500).json({ error: 'Erro ao listar administradores.' });
  }
});

apiRouter.post('/users/admins', authenticateToken, requireAdmin, async (req, res) => {
  const { name, email, password, sendEmail } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password.trim(), salt);

    const userRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin') RETURNING id, name, email, role, created_at`,
      [name, email.trim(), passwordHash]
    );
    const newAdmin = userRes.rows[0];

    if (sendEmail) {
      await brevoService.sendCredentialsEmail({
        name,
        email: email.trim(),
        password: password.trim(),
        loginUrl: `${getBaseUrl(req)}/admin`,
        role: 'admin'
      });
    }

    res.status(201).json(newAdmin);
  } catch (err) {
    console.error('Erro ao cadastrar administrador:', err);
    res.status(500).json({ error: 'Erro ao cadastrar administrador.' });
  }
});

apiRouter.put('/users/admins/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, password, sendEmail } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2', [email.trim(), id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Já existe outro usuário cadastrado com este e-mail.' });
    }

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password.trim(), salt);
      await pool.query(
        `UPDATE users SET name = $1, email = $2, password_hash = $3 WHERE id = $4 AND role = 'admin'`,
        [name, email.trim(), passwordHash, id]
      );
    } else {
      await pool.query(
        `UPDATE users SET name = $1, email = $2 WHERE id = $3 AND role = 'admin'`,
        [name, email.trim(), id]
      );
    }

    if (sendEmail && password && password.trim() !== '') {
      await brevoService.sendCredentialsEmail({
        name,
        email: email.trim(),
        password: password.trim(),
        loginUrl: `${getBaseUrl(req)}/admin`,
        role: 'admin'
      });
    }

    const updatedAdmin = await pool.query(`SELECT id, name, email, role, created_at FROM users WHERE id = $1`, [id]);
    res.json(updatedAdmin.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar administrador:', err);
    res.status(500).json({ error: 'Erro ao atualizar dados do administrador.' });
  }
});

apiRouter.delete('/users/admins/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Você não pode excluir sua própria conta de administrador conectada.' });
  }

  try {
    await pool.query("DELETE FROM users WHERE id = $1 AND role = 'admin'", [id]);
    res.json({ message: 'Administrador excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir administrador:', err);
    res.status(500).json({ error: 'Erro ao excluir administrador.' });
  }
});

// ACESSO DUPLO: Registrar rotas de API tanto em /api quanto na raiz
app.use('/api', apiRouter);
app.use('/', apiRouter);

// ==========================================
// ROTAS DE PÁGINAS FRONTEND
// ==========================================

// Rota para a Apresentação da Estratégia
app.get('/estrategias/:slug', (req, res) => {
  const { slug } = req.params;
  const customFilePath = path.join(rootDir, 'public', 'estrategias', `${slug}.html`);
  res.sendFile(customFilePath, (err) => {
    if (err) {
      res.sendFile(path.join(rootDir, 'public', 'index.html'));
    }
  });
});

// Rota do Painel Admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'admin.html'));
});

// Rota Principal (Login / Portal)
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'login.html'));
});

// Rota do Manual de Criação de Estratégias
app.get('/manual', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'manual.html'));
});

// Rota de Redefinição de Senha
app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'reset-password.html'));
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Estratégias Distinto rodando na porta ${PORT}`);
    console.log(`🌐 Painel Admin: http://localhost:${PORT}/admin`);
    console.log(`🔑 Login: http://localhost:${PORT}/`);
    console.log(`📊 Estratégia Kelly: http://localhost:${PORT}/estrategias/kelly-loganima`);
  });
}

export default app;
