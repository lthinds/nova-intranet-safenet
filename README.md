# Central de Segurança Integrada

Olá! Estou criando o novo Portal da Intranet da nossa empresa (empresa de segurança privada e monitoramento).

Este portal será o ponto de entrada único (Hub/Launchpad) para todos os colaboradores acessarem as ferramentas internas (como o sistema de monitoramento de alarmes/CFTV "Safenet", o sistema de controle de frotas e outras ferramentas futuras).

A partir dos prints da intranet atual, prepare um protótipo visual navegável para apresentação. Vamos por etapas, primeiro entender viabilidade, depois um protótipo visual para que eu possa apresentar e por último construímos o hub com SSO em versão para implementação.

O login da intranet é universal para todos os sites agregados, mas as permissões da intranet são só para o hub e as permissões são diferentes dentro de cada aplicação agregada. O SSO será híbrido: ao cadastrar uma aplicação, deve ser possível escolher criar só o módulo com hyperlink para a aplicação ou incluir o processo de autenticação caso seja uma aplicação nossa. Algumas aplicações são de terceiros, e está tudo bem o SSO não contemplar essas aplicações.

Cada aplicação dentro da intranet já tem um cadastro próprio, então é preciso vincular esse cadastro SSO com os cadastros existentes, sem mexer nas permissões que cada perfil tem dentro dos sites agregados à intranet. As aplicações próprias podem ser alteradas e terão login somente pelo hub, sem login local independente. Os usuários têm e-mail corporativo único cadastrado nos sistemas próprios. As permissões e perfis internos de cada aplicação permanecem administrados localmente; o portal controla estritamente a visualização e o acesso às ferramentas.

O hub usará senha própria. O cadastro do colaborador será feito com aprovação de um coordenador. Todos os coordenadores poderão administrar as contas e permissões de todos os colaboradores. Um bloqueio pelo coordenador deve impedir imediatamente o login e encerrar as sessões abertas em todos os sistemas próprios integrados; não haverá integração com o RH. Aplicações de terceiros sem suporte ao SSO serão links externos.

Por se tratar da etapa de protótipo visual para apresentação, não implemente autenticação real, backend ou SSO funcional ainda. Represente visualmente o hub e os fluxos/telas necessários para apresentar o catálogo de aplicações e a gestão de usuários e acessos, preservando a separação entre permissões do portal e permissões internas dos sistemas. Use os prints como referência visual. O HTML enviado é apenas o carregador da tela e depende de arquivos assets não anexados, portanto use os prints como base de conteúdo e estrutura.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f085b1be-a053-4b9d-90b5-49b8e3c8397f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
