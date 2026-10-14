# Protótipo visual do Portal Safenet

## Objetivo
Criar um protótipo navegável, em português, para apresentação do novo hub corporativo. O protótipo demonstrará os fluxos e a separação de responsabilidades, sem autenticação real, banco de dados ou SSO funcional.

## Telas e navegação
- **Visão geral:** saudação, busca, atalhos recentes, aplicações autorizadas por categoria e indicadores de disponibilidade.
- **Aplicações:** catálogo completo com filtros e estados de acesso; detalhes explicam se a abertura usa SSO corporativo ou link externo.
- **Colaboradores:** lista demonstrativa, solicitações pendentes, estado ativo/bloqueado e ações de aprovação, edição e bloqueio.
- **Acessos:** matriz visual para conceder ou remover a visibilidade das ferramentas no portal, com aviso claro de que perfis internos permanecem em cada sistema.
- **Gestão de aplicações:** cadastro e edição visual de ferramentas, incluindo escolha entre “SSO integrado” e “Link externo”, vínculo por e-mail corporativo e disponibilidade.
- **Entrada:** uma tela de login demonstrativa acessível pelo menu do perfil, sem validar credenciais.

## Direção visual
- Evoluir a identidade observada nos prints: verde institucional profundo, verde-lima para estados positivos, superfícies claras e tipografia robusta.
- Usar uma estrutura compacta de portal operacional, com menu lateral, cabeçalho de contexto e cartões de aplicação claros.
- Preservar os nomes e agrupamentos visíveis nos prints, incluindo Ponto, Webmail, Relatório de Frota, Monitoramento, Comercial, Licitações, Treinamentos e RH.
- Adaptar a navegação e as tabelas para telas menores sem perder legibilidade.

## Interações de apresentação
- Busca e filtros do catálogo funcionam localmente.
- Troca entre telas ocorre sem recarregar a página.
- Modais demonstram detalhes de uma aplicação, inclusão de ferramenta, aprovação e bloqueio de colaborador.
- Alternadores da matriz atualizam apenas o estado temporário do protótipo.
- Avisos identificam ações simuladas para não sugerir integrações já prontas.

## Limites desta etapa
- Nenhuma credencial será armazenada ou validada.
- Nenhum dado será persistido e nenhum colaborador real será utilizado.
- Os botões de abertura de sistemas e encerramento de sessões serão demonstrações visuais.
- A futura implementação de SSO e bloqueio global será especificada depois da validação deste protótipo.
