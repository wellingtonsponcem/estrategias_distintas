// Exporta um briefing do Neon para clientes/<slug>/00_briefing.md (insumo do Maestro /nova-estrategia).
// Uso: npm run briefing -- <id|email> <slug>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SECOES = [
  ['1. Dados do Cliente & Marca', {
    company_name: 'Marca / Empresa', client_name: 'Especialista / Cliente', client_role: 'Cargo',
    email: 'E-mail', whatsapp: 'WhatsApp', niche: 'Nicho', market_time: 'Tempo de mercado',
    website_url: 'Site', social_links: 'Redes sociais',
  }],
  ['2. Objetivos & Negócio', {
    primary_goal: 'Objetivo principal', current_revenue: 'Situação atual', target_goal: 'Meta',
    deadline: 'Prazo', main_bottleneck: 'Principal gargalo', past_failures: 'O que já tentou e não funcionou',
  }],
  ['3. Posicionamento & Tom', {
    uvp_description: 'Proposta de valor', brand_story: 'História da marca', tone_traits: 'Traços de tom',
    non_negotiables: 'Não-negociáveis',
  }],
  ['4. Público', {
    icp_profile: 'Perfil do cliente ideal', persona_pains: 'Dores', persona_desires: 'Desejos',
    persona_objections: 'Objeções',
  }],
  ['5. Oferta & Concorrência', {
    core_product: 'Produto/serviço principal', sales_channel: 'Canal de venda', competitors: 'Concorrentes conhecidos',
    benchmarks: 'Referências / benchmarks',
  }],
  ['6. Canais, Identidade & Operação', {
    focus_channels: 'Canais de foco', preferred_formats: 'Formatos preferidos', brand_colors: 'Cores da marca',
    drive_link: 'Pasta de materiais', team_structure: 'Estrutura de equipe', ads_budget: 'Verba de anúncios',
    additional_notes: 'Observações adicionais',
  }],
];

const formatar = (v) => (Array.isArray(v) ? v.join(', ') : String(v ?? '').trim());

const [chave, slug] = process.argv.slice(2);
if (!chave || !slug) {
  console.error('Uso: npm run briefing -- <id|email> <slug>');
  process.exit(1);
}

try {
  const porId = /^\d+$/.test(chave);
  const { rows } = await pool.query(
    `SELECT * FROM briefings WHERE ${porId ? 'id = $1' : 'LOWER(email) = LOWER($1)'} ORDER BY created_at DESC LIMIT 1`,
    [chave],
  );
  if (!rows.length) {
    console.error(`Briefing não encontrado para "${chave}".`);
    process.exit(1);
  }
  const b = rows[0];
  const dados = { ...b.data, company_name: b.company_name, client_name: b.client_name, email: b.email, whatsapp: b.whatsapp, niche: b.niche };
  const usados = new Set();

  let md = `# Briefing — ${b.client_name} (${b.company_name})\n\n> Briefing #${b.id} · recebido em ${new Date(b.created_at).toISOString().slice(0, 10)} · exportado do Neon\n`;
  for (const [titulo, campos] of SECOES) {
    md += `\n## ${titulo}\n`;
    for (const [campo, rotulo] of Object.entries(campos)) {
      usados.add(campo);
      const valor = formatar(dados[campo]);
      md += `- **${rotulo}:** ${valor || '_(não informado)_'}\n`;
    }
  }
  const extras = Object.keys(dados).filter((k) => !usados.has(k) && formatar(dados[k]));
  if (extras.length) {
    md += `\n## 7. Outros campos\n`;
    for (const k of extras) md += `- **${k}:** ${formatar(dados[k])}\n`;
  }

  const destino = path.join(rootDir, 'clientes', slug);
  fs.mkdirSync(path.join(destino, 'etapas'), { recursive: true });
  fs.writeFileSync(path.join(destino, '00_briefing.md'), md);
  console.log(`✅ Briefing gravado em clientes/${slug}/00_briefing.md`);
} finally {
  await pool.end();
}
