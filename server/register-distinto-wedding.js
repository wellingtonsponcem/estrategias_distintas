import { pool } from './db.js';

async function registerStrategy() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Inserir ou atualizar a estratégia
    const strategyCheck = await client.query('SELECT id FROM strategies WHERE slug = $1', ['distinto-wedding']);
    
    let strategyId;
    if (strategyCheck.rows.length === 0) {
      const insertRes = await client.query(`
        INSERT INTO strategies (
          slug,
          title,
          client_name,
          subtitle,
          description,
          meta_principal,
          territorio,
          prazo,
          approach,
          logo_url,
          notion_url,
          file_path,
          active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
        RETURNING id
      `, [
        'distinto-wedding',
        'Distinto Wedding • Estratégia Digital',
        'Jeane Poncem & Wellington',
        'Guia Estratégico 10P • O Casamento sem Fórmulas',
        'Planejamento Estratégico Digital Completo (10P): Posicionamento editorial, captação documental de casamentos autorais, esteira de produtos e expansão territorial Serra Gaúcha & Grande POA.',
        'R$ 480k faturamento anual • 40 casamentos a R$ 12.000 ticket médio',
        'Serra Gaúcha, Vale dos Sinos e Grande Porto Alegre',
        'Ciclo 2026/2027 (12 meses)',
        'Documental Poético & Direção Invisível',
        '/assets/distinto_logo.svg',
        'https://app.notion.com/p/Distinto-Wedding-Jeane-Poncem-Wellington-40fe104bb1cb81d4815eceb583cd2eef',
        'distinto-wedding.html'
      ]);
      strategyId = insertRes.rows[0].id;
      console.log('✅ Estratégia Distinto Wedding cadastrada com sucesso! ID:', strategyId);
    } else {
      strategyId = strategyCheck.rows[0].id;
      await client.query(`
        UPDATE strategies SET
          title = $1,
          client_name = $2,
          subtitle = $3,
          description = $4,
          meta_principal = $5,
          territorio = $6,
          prazo = $7,
          approach = $8,
          logo_url = $9,
          notion_url = $10,
          file_path = $11,
          active = true,
          updated_at = NOW()
        WHERE id = $12
      `, [
        'Distinto Wedding • Estratégia Digital',
        'Jeane Poncem & Wellington',
        'Guia Estratégico 10P • O Casamento sem Fórmulas',
        'Planejamento Estratégico Digital Completo (10P): Posicionamento editorial, captação documental de casamentos autorais, esteira de produtos e expansão territorial Serra Gaúcha & Grande POA.',
        'R$ 480k faturamento anual • 40 casamentos a R$ 12.000 ticket médio',
        'Serra Gaúcha, Vale dos Sinos e Grande Porto Alegre',
        'Ciclo 2026/2027 (12 meses)',
        'Documental Poético & Direção Invisível',
        '/assets/distinto_logo.svg',
        'https://app.notion.com/p/Distinto-Wedding-Jeane-Poncem-Wellington-40fe104bb1cb81d4815eceb583cd2eef',
        'distinto-wedding.html',
        strategyId
      ]);
      console.log('✅ Estratégia Distinto Wedding atualizada! ID:', strategyId);
    }

    // 2. Vincular aos usuários administradores Wellington (1) e Jeane (3)
    const admins = await client.query("SELECT id, name, email FROM users WHERE role = 'admin' OR id IN (1, 3)");
    for (const admin of admins.rows) {
      await client.query(`
        INSERT INTO strategy_access (user_id, strategy_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, strategy_id) DO NOTHING
      `, [admin.id, strategyId]);
      console.log(`🔗 Acesso vinculado para ${admin.name} (${admin.email})`);
    }

    await client.query('COMMIT');
    console.log('🎉 Finalizado com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao registrar estratégia:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

registerStrategy();
