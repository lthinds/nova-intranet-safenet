# Portal Safenet — Guia de implantação (para o gestor e para o Claude)

> **Gestor:** abra uma conversa com o Claude, envie o link deste repositório e cole o
> bloco "Prompt para o Claude" abaixo. O Claude vai conduzir o resto com você.

---

## Prompt para o Claude (copiar e colar)

```text
Você vai me ajudar a colocar em produção o Portal da Intranet da Safenet, cujo
código está neste repositório. O frontend já está pronto. Sua tarefa é criar o
backend e implantar tudo na nossa infraestrutura (TrueNAS + Docker), me
explicando cada passo de forma simples, pois vou executar os comandos.

Leia primeiro, nesta ordem:
1. docs/GUIA_CLAUDE_E_GESTOR.md (este arquivo) — arquitetura e contrato da API
2. src/lib/api-client.ts — TODAS as rotas que o portal chama, com os tipos
3. src/lib/keycloak.ts — como o login funciona (Keycloak + proxy OIDC)
4. AGENTS.md — regras de arquitetura do projeto

Regras que não podem mudar:
- O login é 100% do Keycloak atrás de um proxy OIDC (ex.: oauth2-proxy). O
  portal não tem tela de login nem senha própria.
- O portal lê /oauth2/userinfo (nome, email, groups) e sai por /oauth2/sign_out.
- Cards de aplicação são filtrados pelos grupos GS_App_<id> do Keycloak.
- /candidatura e /autoavaliacao são públicas (o proxy deve liberá-las), assim
  como /api/publico/*.
- O backend identifica o usuário pelos cabeçalhos que o proxy repassa
  (X-Forwarded-Email, X-Forwarded-Groups) — nunca por dados enviados pelo navegador.
- Permissões do portal (quem publica aviso, quem vê currículos etc.) são
  checadas NO BACKEND, não só na tela.
- Arquivos (PDFs de manuais, currículos) ficam num volume/dataset do TrueNAS;
  no banco ficam só os metadados e o caminho do arquivo.

Etapas que quero que você conduza comigo, uma de cada vez, esperando eu
confirmar antes de seguir:
1. Me perguntar o que já existe no TrueNAS (Docker/Apps, Keycloak, proxy) e
   propor o banco (sugestão: PostgreSQL em container).
2. Criar o esquema do banco a partir dos tipos de src/lib/api-client.ts.
3. Criar a API REST com exatamente as rotas da seção "Contrato da API".
4. Criar Dockerfile/docker-compose do portal + API + banco, com volumes.
5. Configurar o proxy OIDC (rotas públicas, repasse de cabeçalhos, /api).
6. Ligar o frontend à API: trocar os dados de exemplo em
   src/components/portal-prototype.tsx por chamadas a `api.*`, usando
   `withFallback`. Definir VITE_API_BASE_URL=/api no build.
7. Remover os conteúdos de exemplo e cadastrar os dados reais.
8. Testar de ponta a ponta com um usuário real de cada função.
```

---

## Arquitetura

```text
Navegador ──► Proxy OIDC (oauth2-proxy + Keycloak)
                 │  libera sem login: /candidatura, /autoavaliacao, /api/publico/*
                 ├──► Portal (este repositório, container Node)
                 └──► /api/* ──► API REST (a criar) ──► Banco (PostgreSQL sugerido)
                                       └──► Volume TrueNAS: /arquivos (PDFs, currículos)
```

## Configuração do portal

| Variável | Exemplo | Para quê |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Liga o portal à API. Vazio = modo demonstração com dados de exemplo. |

Build e execução: `bun install && bun run build`, depois servir a saída em container Node.

## Contrato da API

Todas as rotas abaixo são relativas a `VITE_API_BASE_URL`, retornam JSON e
recebem o cookie de sessão do proxy. Os formatos de dados estão nos tipos
importados em `src/lib/api-client.ts`. `401` = sessão expirada; `403` = sem permissão.

| Método | Rota | Quem pode | Observação |
|---|---|---|---|
| GET | `/aplicacoes` | todos | já filtrar por grupos GS_App_* do usuário |
| POST/PUT/DELETE | `/aplicacoes[/:id]` | Coordenação | |
| POST | `/aplicacoes/:id/aberturas` | todos | alimenta "Usadas frequentemente" |
| GET/PUT | `/me/favoritos` | todos | lista de ids |
| GET | `/avisos` | todos | só os que o usuário é destinatário |
| POST/PUT/DELETE | `/avisos[/:id]` | quem publica avisos | |
| GET | `/me/avisos-confirmados` | todos | |
| POST | `/avisos/:id/confirmacoes` | todos | obrigatório: confirmar uma única vez |
| GET | `/vagas` | todos | demais usuários: só abertas |
| POST/PUT/DELETE | `/vagas[/:id]` | RH, DP | |
| GET | `/candidaturas[?vaga=]` | RH, DP | |
| POST | `/vagas/:id/candidaturas` | todos | multipart, campo `curriculo` (PDF/Word/imagem, até 10 MB) |
| PATCH | `/candidaturas/:id` | RH, DP | `status`, `notes` |
| GET | `/candidaturas/:id/curriculo` | RH, DP | download do arquivo |
| GET | `/manuais` | por área/função | |
| POST/PUT/DELETE | `/manuais[/:id]` | Supervisor da área | multipart, campo `pdf` (somente PDF) |
| GET/PUT | `/escala?mes=AAAA-MM` | ler: Monitoramento; editar: Supervisor do Monitoramento | |
| GET | `/colaboradores` | RH, DP, Coordenação | |
| GET/PUT | `/me/perfil` | todos | o próprio perfil |
| PUT | `/colaboradores/:email` | RH/DP (dados), Coordenação (funções) | |
| GET/POST/PUT/DELETE | `/cargos[/:id]` | Coordenação | |
| POST | `/publico/candidaturas` | sem login | form público /candidatura |
| POST | `/publico/autoavaliacoes` | sem login | form público /autoavaliacao |

## Regras de negócio que a API deve respeitar

- E-mail corporativo: `nome.sobrenome@safenettecnologia.com.br`.
- Aviso obrigatório: aparece em tela cheia até o colaborador confirmar; depois nunca mais.
- Aviso com `featured` aparece no carrossel da página inicial até expirar.
- Aniversários e tempo de casa: só RH e DP veem.
- Avatares são iniciais coloridas (sem fotos).
- Cor do ícone da aplicação = primeira função marcada; sem função = "geral".
