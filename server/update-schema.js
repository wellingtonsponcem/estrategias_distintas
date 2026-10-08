import { pool } from './db.js';

async function updateSchema() {
  console.log('🔄 Atualizando schema no Neon PostgreSQL...');
  const client = await pool.connect();
  try {
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
    console.log('✅ Tabela password_resets verificada/criada com sucesso!');

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
    console.log('✅ Tabela briefings criada com sucesso!');

    await client.query(`ALTER TABLE briefings ADD COLUMN IF NOT EXISTS edit_token VARCHAR(64) UNIQUE;`);
    console.log('✅ Coluna briefings.edit_token verificada/criada com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao atualizar schema:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

updateSchema();
