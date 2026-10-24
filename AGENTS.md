<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the presentation prototype as one client-side experience with local mock state, because this phase explicitly excludes persistence and real authentication.
- Authentication is delegated entirely to Keycloak behind an OIDC proxy: the portal reads /oauth2/userinfo, signs out via /oauth2/sign_out, has no login screen, and filters app cards by GS_App_<id> groups (src/lib/keycloak.ts), because production login already exists.
- /candidatura and /autoavaliacao are public routes without login, because HR uses them externally.
- Trainings are a manually maintained list in src/data/trainings.ts, because the old spreadsheet feed is frozen.
