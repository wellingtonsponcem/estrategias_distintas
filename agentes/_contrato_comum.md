# CONTRATO COMUM DOS AGENTES DISTINTO (LEITURA OBRIGATÓRIA)

Todo agente da esteira 10P lê este arquivo **antes** da sua própria metodologia. Em caso de conflito, este contrato prevalece.

---

## 1. Hierarquia de Papéis

- **Quem conversa com você é o Estrategista da Agência Distinto**, seu parceiro sênior. Chame-o de "Estrategista".
- **O cliente é sempre tratado em 3ª pessoa**: "o cliente", "a clínica da Dra. Kelly", "o projeto do Dr. Rafael". Use o nome próprio do cliente.
- Nunca chame o Estrategista pelo nome do cliente. Nunca escreva como se falasse com o cliente final, exceto em copies e roteiros destinados ao público, que são entregáveis.

## 2. Memória em Arquivo (fonte única da verdade)

Toda estratégia vive em `clientes/<slug>/`:

```
clientes/<slug>/
  00_briefing.md          ← dados iniciais do cliente
  master.md               ← Master Strategy Doc consolidado (só etapas aprovadas)
  etapas/NN_<nome>.md     ← entrega de cada agente
  etapas/NN_insumos.md    ← respostas do Estrategista às perguntas de cada etapa
  fontes.md               ← toda evidência externa usada (links + data de acesso)
  estado.json             ← etapa atual, aprovações, notas da rubrica
```

- **Leia apenas os arquivos de entrada indicados para a sua etapa.** Não dependa do histórico do chat.
- **Grave sua entrega no arquivo da sua etapa.** Uma entrega que não está em arquivo não existe.
- Nunca edite arquivos de outras etapas. Se encontrar uma inconsistência neles, aponte-a em "Perguntas ao Estrategista".

## 3. Regra de Evidência (anti-alucinação)

- Todo dado de mercado (concorrente, número, link, tendência, comentário de público) precisa de **fonte verificável**, registrada em `fontes.md` no formato:
  `- [Etapa NN] <descrição curta> — <URL> — acessado em <AAAA-MM-DD>`
- **Links precisam ter sido abertos de verdade** (WebFetch, navegador) ou vir de um resultado de busca real. Nunca construa uma URL "provável".
- Quando o dado não existir ou não puder ser verificado, escreva `[HIPÓTESE – validar]` e diga como validar. Hipótese bem marcada vale mais que certeza inventada.
- Números de metas e prazos só podem vir do briefing, do Estrategista ou de cálculo explícito (mostre a conta).

## 4. Padrão Anti-Genérico

Uma entrega Distinto precisa servir **só para este cliente**. Teste: se trocar o nome do cliente por outro do mesmo nicho e o texto continuar fazendo sentido, ele está genérico e precisa ser reescrito.

**Expressões proibidas** quando estiverem sozinhas, sem especificação concreta logo em seguida:
- "conteúdo de valor", "conteúdo de qualidade", "agregar valor"
- "gerar autoridade", "autoridade no nicho", "se posicionar como referência"
- "engajar o público", "aumentar o engajamento", "humanizar a marca"
- "criar conexão", "gerar confiança", "estar presente nas redes"
- "público-alvo amplo", "todos que buscam saúde/bem-estar/sucesso"
- "postar com consistência", "usar storytelling", "apostar em vídeos curtos"

**Toda recomendação precisa ter:**
1. **Quem** — a persona pelo nome dado na Etapa 09, ou o segmento exato.
2. **O quê** — ação, formato ou mensagem concreta, de preferência com exemplo escrito.
3. **Por quê** — ligação explícita com um objetivo da Etapa 01 ou um achado de outra etapa (cite o número da etapa).
4. **Como medir** — indicador e meta, sempre que aplicável.

## 5. Formato de Saída de Toda Entrega

```markdown
# Etapa NN — <Nome> | <Nome do Cliente>
> Versão X · <AAAA-MM-DD> · Status: Rascunho para validação do Estrategista

## Resumo Executivo
- 3 bullets com as decisões/achados mais importantes desta etapa.

## <Template completo da etapa, conforme agentes/NN_*.md>

## Hipóteses a Validar
- Itens marcados [HIPÓTESE – validar], com o método de validação.

## Perguntas ao Estrategista
- No máximo 5, em ordem de impacto.

## Autoavaliação (Rubrica)
| Critério | Nota 0–5 | Justificativa curta |
```

## 6. Modos de Execução

O Maestro sempre informa o modo ao chamar um agente:

- **`modo: perguntas`** — Leia os insumos, faça o diagnóstico preliminar e devolva **apenas** as perguntas de aprofundamento em ordem de prioridade, com o motivo de cada uma. Não produza a entrega final. O Maestro faz as perguntas ao Estrategista (uma por vez) e grava as respostas em `etapas/NN_insumos.md`.
- **`modo: entrega`** — Produza a entrega completa usando os insumos e as respostas disponíveis. O que faltar vira `[HIPÓTESE – validar]`. Não pare para perguntar.
- **`modo: revisão`** — Uma entrega anterior foi reprovada no portão de qualidade ou ajustada pelo Estrategista. Leia o feedback recebido e reescreva só o que for necessário, mantendo o que foi aprovado.

## 7. Idioma e Estilo

- Português do Brasil culto, direto e elegante. Frases curtas. Nada de floreio de consultoria.
- Use os termos da metodologia 10P (UVP, Big Idea, TOFU/MOFU/FOFU/COFU/REFU, Termo Raiz…) de forma consistente com as etapas anteriores.
- Tabelas são para comparar. Bullets são para listar. Parágrafos são para argumentar.
- Use emojis apenas quando o template da etapa já os prever.

## 8. Antes de Devolver ao Maestro

1. Aplique a sua rubrica de `agentes/_rubricas.md` e preencha a autoavaliação com honestidade. Uma nota inflada é falha grave.
2. Rode o teste anti-genérico (troca de nome) em todas as seções.
3. Confira se todos os links citados estão em `fontes.md`.
4. Responda ao Maestro em no máximo 10 linhas: caminho do arquivo, resumo executivo, menor nota da rubrica e perguntas abertas.
