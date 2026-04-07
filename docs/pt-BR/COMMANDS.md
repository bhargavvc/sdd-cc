# Referência de Comandos do SDD

Este documento descreve os comandos principais do SDD em Português.  
Para detalhes completos de flags avançadas e mudanças recentes, consulte também a [versão em inglês](../COMMANDS.md).

---

## Fluxo Principal

| Comando | Finalidade | Quando usar |
|---------|------------|-------------|
| `/sdd:new-project` | Inicialização completa: perguntas, pesquisa, requisitos e roadmap | Início de projeto |
| `/sdd:discuss-phase [N]` | Captura decisões de implementação | Antes do planejamento |
| `/sdd:ui-phase [N]` | Gera contrato de UI (`UI-SPEC.md`) | Fases com frontend |
| `/sdd:plan-phase [N]` | Pesquisa + planejamento + verificação | Antes de executar uma fase |
| `/sdd:execute-phase <N>` | Executa planos em ondas paralelas | Após planejamento aprovado |
| `/sdd:verify-work [N]` | UAT manual com diagnóstico automático | Após execução |
| `/sdd:ship [N]` | Cria PR da fase validada | Ao concluir a fase |
| `/sdd:next` | Detecta e executa o próximo passo lógico | Qualquer momento |
| `/sdd:fast <texto>` | Tarefa curta sem planejamento completo | Ajustes triviais |

## Navegação e Sessão

| Comando | Finalidade |
|---------|------------|
| `/sdd:progress` | Mostra status atual e próximos passos |
| `/sdd:resume-work` | Retoma contexto da sessão anterior |
| `/sdd:pause-work` | Salva handoff estruturado |
| `/sdd:session-report` | Gera resumo da sessão |
| `/sdd:help` | Lista comandos e uso |
| `/sdd:update` | Atualiza o SDD |

## Gestão de Fases

| Comando | Finalidade |
|---------|------------|
| `/sdd:add-phase` | Adiciona fase no roadmap |
| `/sdd:insert-phase [N]` | Insere trabalho urgente entre fases |
| `/sdd:remove-phase [N]` | Remove fase futura e reenumera |
| `/sdd:list-phase-assumptions [N]` | Mostra abordagem assumida pelo Claude |
| `/sdd:plan-milestone-gaps` | Cria fases para fechar lacunas de auditoria |

## Brownfield e Utilidades

| Comando | Finalidade |
|---------|------------|
| `/sdd:map-codebase` | Mapeia base existente antes de novo projeto |
| `/sdd:quick` | Tarefas ad-hoc com garantias do SDD |
| `/sdd:debug [desc]` | Debug sistemático com estado persistente |
| `/sdd:forensics` | Diagnóstico de falhas no workflow |
| `/sdd:settings` | Configuração de agentes, perfil e toggles |
| `/sdd:set-profile <perfil>` | Troca rápida de perfil de modelo |

## Qualidade de Código

| Comando | Finalidade |
|---------|------------|
| `/sdd:review` | Peer review com múltiplas IAs |
| `/sdd:pr-branch` | Cria branch limpa sem commits de planejamento |
| `/sdd:audit-uat` | Audita dívida de validação/UAT |

## Backlog e Threads

| Comando | Finalidade |
|---------|------------|
| `/sdd:add-backlog <desc>` | Adiciona item no backlog (999.x) |
| `/sdd:review-backlog` | Promove, mantém ou remove itens |
| `/sdd:plant-seed <ideia>` | Registra ideia com gatilho futuro |
| `/sdd:thread [nome]` | Gerencia threads persistentes |

---

## Exemplo rápido

```bash
/sdd:new-project
/sdd:discuss-phase 1
/sdd:plan-phase 1
/sdd:execute-phase 1
/sdd:verify-work 1
/sdd:ship 1
```
