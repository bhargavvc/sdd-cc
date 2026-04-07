# Guia do Usuário do SDD

Referência detalhada de workflows, troubleshooting e configuração. Para setup rápido, veja o [README](../../README.pt-BR.md).

---

## Sumário

- [Fluxo de trabalho](#fluxo-de-trabalho)
- [Contrato de UI](#contrato-de-ui)
- [Backlog e Threads](#backlog-e-threads)
- [Workstreams](#workstreams)
- [Segurança](#segurança)
- [Referência de comandos](#referência-de-comandos)
- [Configuração](#configuração)
- [Exemplos de uso](#exemplos-de-uso)
- [Troubleshooting](#troubleshooting)
- [Recuperação rápida](#recuperação-rápida)

---

## Fluxo de trabalho

Fluxo recomendado por fase:

1. `/sdd:discuss-phase [N]` — trava preferências de implementação
2. `/sdd:ui-phase [N]` — contrato visual para fases frontend
3. `/sdd:plan-phase [N]` — pesquisa + plano + validação
4. `/sdd:execute-phase [N]` — execução em ondas paralelas
5. `/sdd:verify-work [N]` — UAT manual com diagnóstico
6. `/sdd:ship [N]` — cria PR (opcional)

Para iniciar projeto novo:

```bash
/sdd:new-project
```

Para seguir automaticamente o próximo passo:

```bash
/sdd:next
```

### Nyquist Validation

Durante `plan-phase`, o SDD pode mapear requisitos para comandos de teste automáticos antes da implementação. Isso gera `{phase}-VALIDATION.md` e aumenta a confiabilidade de verificação pós-execução.

Desativar:

```json
{
  "workflow": {
    "nyquist_validation": false
  }
}
```

### Modo de discussão por suposições

Com `workflow.discuss_mode: "assumptions"`, o SDD analisa o código antes de perguntar, apresenta suposições estruturadas e pede apenas correções.

---

## Contrato de UI

### Comandos

| Comando | Descrição |
|---------|-----------|
| `/sdd:ui-phase [N]` | Gera contrato de design `UI-SPEC.md` para a fase |
| `/sdd:ui-review [N]` | Auditoria visual retroativa em 6 pilares |

### Quando usar

- Rode `/sdd:ui-phase` depois de `/sdd:discuss-phase` e antes de `/sdd:plan-phase`.
- Rode `/sdd:ui-review` após execução/validação para avaliar qualidade visual e consistência.

### Configurações relacionadas

| Setting | Padrão | O que controla |
|---------|--------|----------------|
| `workflow.ui_phase` | `true` | Gera contratos de UI para fases frontend |
| `workflow.ui_safety_gate` | `true` | Ativa gate de segurança para componentes de registry |

---

## Backlog e Threads

### Backlog (999.x)

Ideias fora da sequência ativa vão para backlog:

```bash
/sdd:add-backlog "Camada GraphQL"
/sdd:add-backlog "Responsividade mobile"
```

Promover/revisar:

```bash
/sdd:review-backlog
```

### Seeds

Seeds guardam ideias futuras com condição de gatilho:

```bash
/sdd:plant-seed "Adicionar colaboração real-time quando infra de WebSocket estiver pronta"
```

### Threads persistentes

Threads são contexto leve entre sessões:

```bash
/sdd:thread
/sdd:thread fix-deploy-key-auth
/sdd:thread "Investigar timeout TCP"
```

---

## Workstreams

Workstreams permitem trabalho paralelo sem colisão de estado de planejamento.

| Comando | Função |
|---------|--------|
| `/sdd:workstreams create <name>` | Cria workstream isolado |
| `/sdd:workstreams switch <name>` | Troca workstream ativo |
| `/sdd:workstreams list` | Lista workstreams |
| `/sdd:workstreams complete <name>` | Finaliza e arquiva workstream |

`workstreams` compartilham o mesmo código/git, mas isolam artefatos de `.planning/`.

---

## Segurança

O SDD aplica defesa em profundidade:

- prevenção de path traversal em entradas de arquivo
- detecção de prompt injection em texto do usuário
- hooks de proteção para escrita em `.planning/`
- scanner CI para padrões de injeção em agentes/workflows/comandos

Para arquivos sensíveis, use deny list no Claude Code.

---

## Referência de comandos

### Fluxo principal

| Comando | Quando usar |
|---------|-------------|
| `/sdd:new-project` | Início de projeto |
| `/sdd:discuss-phase [N]` | Definir preferências antes do plano |
| `/sdd:plan-phase [N]` | Criar e validar planos |
| `/sdd:execute-phase [N]` | Executar planos em ondas |
| `/sdd:verify-work [N]` | UAT manual |
| `/sdd:ship [N]` | Gerar PR da fase |
| `/sdd:next` | Próximo passo automático |

### Gestão e utilidades

| Comando | Quando usar |
|---------|-------------|
| `/sdd:progress` | Ver status atual |
| `/sdd:resume-work` | Retomar sessão |
| `/sdd:pause-work` | Pausar com handoff |
| `/sdd:session-report` | Resumo da sessão |
| `/sdd:quick` | Tarefa ad-hoc com garantias SDD |
| `/sdd:debug [desc]` | Debug sistemático |
| `/sdd:forensics` | Diagnóstico de workflow quebrado |
| `/sdd:settings` | Ajustar workflow/modelos |
| `/sdd:set-profile <profile>` | Troca rápida de perfil |

Para lista completa e flags avançadas, consulte [Command Reference](../COMMANDS.md).

---

## Configuração

Arquivo de configuração: `.planning/config.json`

### Núcleo

| Setting | Opções | Padrão |
|---------|--------|--------|
| `mode` | `interactive`, `yolo` | `interactive` |
| `granularity` | `coarse`, `standard`, `fine` | `standard` |
| `model_profile` | `quality`, `balanced`, `budget`, `inherit` | `balanced` |

### Workflow

| Setting | Padrão |
|---------|--------|
| `workflow.research` | `true` |
| `workflow.plan_check` | `true` |
| `workflow.verifier` | `true` |
| `workflow.nyquist_validation` | `true` |
| `workflow.ui_phase` | `true` |
| `workflow.ui_safety_gate` | `true` |

### Perfis de modelo

| Perfil | Uso recomendado |
|--------|------------------|
| `quality` | trabalho crítico, maior qualidade |
| `balanced` | padrão recomendado |
| `budget` | reduzir custo de tokens |
| `inherit` | seguir modelo da sessão/runtime |

Detalhes completos: [Configuration Reference](../CONFIGURATION.md).

---

## Exemplos de uso

### Projeto novo

```bash
claude --dangerously-skip-permissions
/sdd:new-project
/sdd:discuss-phase 1
/sdd:ui-phase 1
/sdd:plan-phase 1
/sdd:execute-phase 1
/sdd:verify-work 1
/sdd:ship 1
```

### Código já existente

```bash
/sdd:map-codebase
/sdd:new-project
```

### Correção rápida

```bash
/sdd:quick
> "Corrigir botão de login no mobile Safari"
```

### Preparação para release

```bash
/sdd:audit-milestone
/sdd:plan-milestone-gaps
/sdd:complete-milestone
```

---

## Troubleshooting

### "Project already initialized"

`.planning/PROJECT.md` já existe. Apague `.planning/` se quiser reiniciar do zero.

### Sessão longa degradando contexto

Use `/clear` entre etapas grandes e retome com `/sdd:resume-work` ou `/sdd:progress`.

### Plano desalinhado

Rode `/sdd:discuss-phase [N]` antes do plano e valide suposições com `/sdd:list-phase-assumptions [N]`.

### Execução falhou ou saiu com stubs

Replaneje com escopo menor (tarefas menores por plano).

### Custo alto

Use perfil budget:

```bash
/sdd:set-profile budget
```

### Runtime não-Claude (Codex/OpenCode/Gemini)

Use `resolve_model_ids: "omit"` para deixar o runtime resolver modelos padrão.

---

## Recuperação rápida

| Problema | Solução |
|---------|---------|
| Perdeu contexto | `/sdd:resume-work` ou `/sdd:progress` |
| Fase deu errado | `git revert` + replanejar |
| Precisa alterar escopo | `/sdd:add-phase`, `/sdd:insert-phase`, `/sdd:remove-phase` |
| Bug em workflow | `/sdd:forensics` |
| Correção pontual | `/sdd:quick` |
| Custo alto | `/sdd:set-profile budget` |
| Não sabe próximo passo | `/sdd:next` |

---

## Estrutura de arquivos do projeto

```text
.planning/
  PROJECT.md
  REQUIREMENTS.md
  ROADMAP.md
  STATE.md
  config.json
  MILESTONES.md
  HANDOFF.json
  research/
  reports/
  todos/
  debug/
  codebase/
  phases/
    XX-phase-name/
      XX-YY-PLAN.md
      XX-YY-SUMMARY.md
      CONTEXT.md
      RESEARCH.md
      VERIFICATION.md
      XX-UI-SPEC.md
      XX-UI-REVIEW.md
  ui-reviews/
```

> [!NOTE]
> Esta é a versão pt-BR do guia para uso diário. Para detalhes técnicos exatos e cobertura completa de parâmetros avançados, consulte também o [guia original em inglês](../USER-GUIDE.md).
