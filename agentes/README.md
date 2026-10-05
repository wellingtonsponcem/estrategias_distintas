# ECOSSISTEMA DE AGENTES ESTRATÉGICOS 10P (METODOLOGIA DO INSTITUTO)

Este repositório contém a arquitetura completa dos **23 Agentes Especialistas + Agente Maestro + Integrador Notion + Pipeline Vercel**, projetados para construir estratégias digitais de ponta a ponta com alto rigor analítico e execução ágil.

---

## 👥 Hierarquia de Papéis & Comunicação

| Papel | Quem é | Como se comunica |
| :--- | :--- | :--- |
| **O Estrategista (Você)** | O profissional/diretor da **Agência Distinto** que pilota o sistema, valida os dados e toma as decisões estratégicas. | É o líder a quem todos os agentes se reportam. Tratado como parceiro sênior de estratégia (*"Estrategista"*). |
| **O Cliente / Marca** | O cliente final atendido pela Distinto (médico, especialista, clínica ou empresa). | **Sempre tratado em 3ª pessoa** (*"o cliente"*, *"a clínica da Dra. Kelly"*, *"o projeto do Dr. Rafael"*). O agente **nunca** confunde o estrategista com o cliente. |
| **Agente Maestro & Especialistas** | A esteira de inteligência artificial da Distinto (copilotos e consultores analíticos). | Trabalham como braço direito do Estrategista para estruturar, auditar e formatar o plano. |

---

## 🗺️ Mapa Completo do Pipeline

| # | Agente | Função Central | Arquivo |
| :-: | :--- | :--- | :--- |
| **00** | **Maestro Orquestrador** | Diretor de Estratégia, controle de estado, memoria central e quality gates | [`00_agente_maestro.md`](./00_agente_maestro.md) |
| **01** | **Objetivos & Negócio** | Conecta conteúdo a metas de faturamento, vendas e prazos (SMART) | [`01_agente_objetivos.md`](./01_agente_objetivos.md) |
| **02** | **DNA Estratégico** | DNA Especialista + DNA Empresa + DNA Conteúdo (Posicionamento, UVP, Big Idea) | [`02_agente_dna_estrategico.md`](./02_agente_dna_estrategico.md) |
| **03** | **Tom de Voz Estratégico** | Diagnóstico real vs. Tom desejado, matriz de oposições e regras de estilo | [`03_agente_tom_de_voz.md`](./03_agente_tom_de_voz.md) |
| **04** | **Palavras-Chave & Universo Temático** | Hierarquia semântica: Termos Raiz -> Derivados -> Cauda Longa | [`04_agente_palavras_chave.md`](./04_agente_palavras_chave.md) |
| **05** | **Critérios de Inteligência Competitiva** | Sistema de rubricas para classificar Diretos, Indiretos e Por Atenção | [`05_agente_inteligencia_competitiva.md`](./05_agente_inteligencia_competitiva.md) |
| **06** | **Mapeamento de Concorrentes** | Deep Research multicanal mapeando 30 a 50 players com links e evidências | [`06_agente_mapeamento_concorrentes.md`](./06_agente_mapeamento_concorrentes.md) |
| **07** | **Auditoria de Concorrente Individual** | Raio-x completo em 10 tópicos + 4 quadrantes executivos | [`07_agente_auditoria_concorrente_individual.md`](./07_agente_auditoria_concorrente_individual.md) |
| **08** | **Matriz SWOT Digital** | Diagnóstico FOFA focado em Marketing/Conteúdo cruzado com as metas | [`08_agente_swot_estrategico.md`](./08_agente_swot_estrategico.md) |
| **09** | **Pesquisa de Personas** | Dossiê sociodemográfico, comportamental, dores, desejos e objeções | [`09_agente_pesquisa_personas.md`](./09_agente_pesquisa_personas.md) |
| **10** | **Jornada de Concorrentes** | Engenharia reversa dos funis de conversão dos concorrentes | [`10_agente_jornada_compra_concorrentes.md`](./10_agente_jornada_compra_concorrentes.md) |
| **11** | **Jornada de Compra Proprietária** | Desenho do funil em 5 fases (Descoberta -> Reconhecimento -> Consideração -> Avaliação -> Decisão) | [`11_agente_jornada_compra_propria.md`](./11_agente_jornada_compra_propria.md) |
| **12** | **Arquitetura de Canais Digitais** | Mix de canais viáveis + Manual de execução e perfis por plataforma | [`12_agente_estrategia_canais.md`](./12_agente_estrategia_canais.md) |
| **13** | **Iniciativas Digitais & Campanhas** | Planos táticos de Landing Pages, Lead Magnets, Ads, Lives e Automações | [`13_agente_iniciativas_digitais.md`](./13_agente_iniciativas_digitais.md) |
| **14** | **Análise de Conteúdo Viral** | Padrões de alta performance: Tema, Narrativa, Formato e Copy | [`14_agente_analise_conteudo_viral.md`](./14_agente_analise_conteudo_viral.md) |
| **15** | **Estratégia Editorial & Matriz** | Linhas Editoriais (4-12) -> Assuntos -> Tópicos acionáveis | [`15_agente_estrategia_editorial.md`](./15_agente_estrategia_editorial.md) |
| **16** | **Distribuição no Funil 5D** | Mapeamento da matriz em TOFU, MOFU, FOFU, COFU e REFU | [`16_agente_distribuicao_funil.md`](./16_agente_distribuicao_funil.md) |
| **17** | **Identidade Visual & Branding** | Tipografia, paleta cromática, fotografia, grids e prompts generativos | [`17_agente_identidade_visual_branding.md`](./17_agente_identidade_visual_branding.md) |
| **18** | **Performance & Fórmulas Explosivas** | Auditoria pós-publicação e mineração de templates de alta conversão | [`18_agente_analise_performance_conteudo.md`](./18_agente_analise_performance_conteudo.md) |
| **19** | **Calendário Editorial Mensal** | Grade cronológica com headlines e ganchos prontos por formato e dia | [`19_agente_calendario_editorial.md`](./19_agente_calendario_editorial.md) |
| **20** | **Roadmap de Sprints Ágeis** | Macroimplementações fatiadas em sprints semanais de 5 dias úteis | [`20_agente_roadmap_implementacao_sprints.md`](./20_agente_roadmap_implementacao_sprints.md) |
| **21** | **Revisor Técnico de Qualidade** | Auditoria em 4 critérios (Gramática, Lógica, Imagens e Layout) | [`21_agente_revisor_tecnico_qualidade.md`](./21_agente_revisor_tecnico_qualidade.md) |
| **22** | **Publicador Notion (via MCP)** | Injeção e sincronização estruturada no Notion do cliente | [`22_agente_publicador_notion.md`](./22_agente_publicador_notion.md) |
| **23** | **Gerador de Slide-Doc Web** | Criação de apresentações interativas executivas (Padrão Apple Style) | [`23_agente_gerador_slide_doc.md`](./23_agente_gerador_slide_doc.md) |
