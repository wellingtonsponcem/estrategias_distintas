import { pool } from './db.js';
import bcrypt from 'bcryptjs';

async function initDB() {
  console.log('🔄 Conectando ao Neon PostgreSQL e criando tabelas...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Tabela de Usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'client', -- 'admin' ou 'client'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Tabela de Estratégias
    await client.query(`
      CREATE TABLE IF NOT EXISTS strategies (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        subtitle TEXT,
        description TEXT,
        meta_principal VARCHAR(255),
        territorio VARCHAR(255),
        prazo VARCHAR(255),
        approach VARCHAR(255),
        logo_url VARCHAR(500),
        cover_url VARCHAR(500),
        notion_url TEXT,
        drive_url TEXT,
        file_path VARCHAR(255) DEFAULT 'index.html',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. Tabela de Acesso de Clientes a Estratégias
    await client.query(`
      CREATE TABLE IF NOT EXISTS strategy_access (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        strategy_id INTEGER REFERENCES strategies(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE (user_id, strategy_id)
      );
    `);

    // 4. Tabela de Recuperação de Senhas
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 5. Tabela de Briefings Estratégicos dos Clientes
    await client.query(`
      CREATE TABLE IF NOT EXISTS briefings (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        whatsapp VARCHAR(100),
        niche VARCHAR(255),
        status VARCHAR(50) DEFAULT 'novo',
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Inserir Admin inicial se não existir
    const adminEmail = 'admin@distinto.com.br';
    const adminCheck = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    let adminId;
    if (adminCheck.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const adminHash = await bcrypt.hash('admin123', salt);
      const resAdmin = await client.query(
        `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id`,
        ['Administrador Distinto', adminEmail, adminHash, 'admin']
      );
      adminId = resAdmin.rows[0].id;
      console.log('✅ Usuário Admin criado com sucesso: admin@distinto.com.br (Senha: admin123)');
    } else {
      adminId = adminCheck.rows[0].id;
      console.log('ℹ️ Usuário Admin já existente.');
    }

    // Inserir Estratégia da Kelly Bruzeguini se não existir
    const kellySlug = 'kelly-loganima';
    const stratCheck = await client.query('SELECT id FROM strategies WHERE slug = $1', [kellySlug]);

    let strategyId;
    if (stratCheck.rows.length === 0) {
      const resStrat = await client.query(`
        INSERT INTO strategies (
          slug, title, client_name, subtitle, description,
          meta_principal, territorio, prazo, approach, logo_url, file_path
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING id
      `, [
        kellySlug,
        'Instituto Longânima',
        'Dra. Kelly Bruzeguini Eira',
        'Um novo olhar sobre o envelhecer.',
        'Estratégia de conteúdos do Instituto Longânima, posicionar Kelly como referência para o público 50+ e gerar 20 novos pacientes/mês até dez/2026.',
        '20 Pacientes / mês',
        'Maturidade Ativa 50+',
        'Até Dez/2026',
        'Funil Evergreen + Autoridade Clínica',
        '/assets/logo.png',
        'kelly-loganima.html'
      ]);
      strategyId = resStrat.rows[0].id;
      console.log('✅ Estratégia da Kelly Bruzeguini cadastrada com sucesso.');
    } else {
      strategyId = stratCheck.rows[0].id;
      console.log('ℹ️ Estratégia da Kelly já existente.');
    }

    // Inserir Usuário Cliente da Kelly
    const kellyEmail = 'kelly@loganima.com.br';
    const kellyCheck = await client.query('SELECT id FROM users WHERE email = $1', [kellyEmail]);

    let kellyUserId;
    if (kellyCheck.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const kellyHash = await bcrypt.hash('kelly123', salt);
      const resKelly = await client.query(
        `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id`,
        ['Dra. Kelly Bruzeguini Eira', kellyEmail, kellyHash, 'client']
      );
      kellyUserId = resKelly.rows[0].id;
      console.log('✅ Usuário da Kelly criado: kelly@loganima.com.br (Senha: kelly123)');
    } else {
      kellyUserId = kellyCheck.rows[0].id;
    }

    // Vincular acesso da Kelly à estratégia dela
    await client.query(`
      INSERT INTO strategy_access (user_id, strategy_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, strategy_id) DO NOTHING
    `, [kellyUserId, strategyId]);

    await client.query('COMMIT');
    console.log('🎉 Banco de Dados Neon PostgreSQL inicializado com sucesso total!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao inicializar banco de dados:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

initDB();
