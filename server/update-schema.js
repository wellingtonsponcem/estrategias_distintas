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
    console.log('✅ Tabela password_resets criada com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao atualizar schema:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

updateSchema();
