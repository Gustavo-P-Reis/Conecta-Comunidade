# Conecta Comunidade

**Descubra. Divulgue. Participe.**

Plataforma colaborativa para divulgação e descoberta de eventos comunitários locais — feiras, campeonatos, oficinas, shows, mutirões e outras atividades organizadas pela própria comunidade.

Projeto de TCC (Ciência da Computação) — aplicação full-stack real: o frontend fala diretamente com um banco Postgres (Supabase), com autenticação, upload de imagens e regras de segurança de verdade. Não há dados falsos substituindo o backend em nenhum lugar do app.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend + Backend | Next.js (App Router) + TypeScript |
| Estilização | Tailwind CSS v4 |
| Componentes | Componentes no estilo shadcn/ui (Radix UI + CVA), escritos diretamente no projeto |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Armazenamento de imagens | Supabase Storage |
| Deploy | Vercel |

## Estrutura do projeto

```
src/
  app/                 rotas (App Router) — uma pasta por página
  components/
    ui/                primitivos de interface (botão, input, modal, ...)
    layout/            header e footer
    events/             card, formulário, upload de imagem, botões de interesse/favorito...
    home/               seções da página inicial (hero, estatísticas, categorias, destaques)
    shared/             componentes reaproveitados entre páginas
  lib/
    actions/            Server Actions — as mutações reais (criar evento, favoritar, denunciar...)
    supabase/            clientes Supabase (navegador, servidor, middleware)
    constants.ts         categorias, motivos de denúncia, opções de ordenação
    types.ts              tipos TypeScript do domínio
    validations.ts        schemas de validação (Zod)
    queries.ts             consultas reaproveitadas entre páginas
  middleware.ts           renova a sessão e protege rotas privadas
supabase/
  schema.sql              tabelas, índices e triggers
  policies.sql             Row Level Security, funções administrativas e políticas de Storage
  seed.sql                 ~15 eventos de demonstração
```

---

## 1. Configurar o Supabase

1. Crie uma conta e um projeto em [supabase.com](https://supabase.com) (o plano gratuito é suficiente).
2. No painel do projeto, abra **SQL Editor** e execute, **nesta ordem**, o conteúdo de cada arquivo:
   1. `supabase/schema.sql`
   2. `supabase/policies.sql`
3. Vá até a tela de **cadastro do próprio app** (depois de configurar o passo 2 abaixo) e crie a sua primeira conta — os eventos de demonstração serão atribuídos a ela.
4. Volte ao **SQL Editor** e execute `supabase/seed.sql` para popular a plataforma com eventos de exemplo.

> O bucket de imagens (`event-images`) e as políticas de acesso a ele já são criados automaticamente pelo `policies.sql` — não é preciso configurar nada manualmente na aba Storage.

## 2. Configurar as variáveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

No painel do Supabase, vá em **Project Settings > API** e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

(Em painéis mais recentes do Supabase, essa chave pode aparecer como **"publishable key"** — é o mesmo valor.)

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## 4. Tornar um usuário administrador

Por segurança, a promoção a administrador **não** é feita pelo app — só é possível diretamente no banco (isso é proposital: veja a seção "Decisões de segurança" abaixo). No **SQL Editor** do Supabase:

```sql
update public.profiles set role = 'admin' where email = 'seu-email@exemplo.com';
```

Depois disso, um item "Administração" aparece no menu do usuário, dando acesso a `/admin` e `/admin/denuncias`.

## 5. Publicar na Vercel

1. Suba o projeto para um repositório Git (GitHub, GitLab, etc.) — o `.gitignore` já exclui `node_modules` e `.env.local`.
2. Em [vercel.com](https://vercel.com), importe o repositório.
3. Em **Environment Variables**, adicione as mesmas duas variáveis do `.env.local`.
4. Deploy. Pronto — a Vercel detecta o Next.js automaticamente.

---

## Dicas para a apresentação do TCC

- **Confirmação de e-mail:** por padrão, o Supabase exige que o usuário confirme o e-mail antes de logar. Para uma demonstração ao vivo mais fluida (criar conta e já usar na hora), desative isso temporariamente em **Authentication > Providers > Email > "Confirm email"** no painel do Supabase. Reative depois se for colocar o projeto em produção de verdade.
- **Roteiro sugerido** (funciona de ponta a ponta com o backend real):
  1. Abra a Home no computador — mostre o hero, estatísticas e categorias.
  2. No celular, crie uma conta e publique um evento (ex: "Feira de Tecnologia da Comunidade") com imagem.
  3. No computador, atualize a página Explorar — o evento aparece.
  4. Abra o evento, favorite e marque interesse.
  5. No celular, mostre o contador de interessados atualizado.
- **Categorias com poucos eventos:** o `seed.sql` distribui ~15 eventos entre as 8 categorias — se quiser mais volume para a demonstração, edite o array de eventos no próprio arquivo antes de rodá-lo.

## Decisões de segurança que valem a pena explicar na banca

- **RLS em todas as tabelas**, com uma função `is_admin()` `security definer` para evitar recursão de política.
- **Privilégios por coluna**: mesmo um usuário autenticado só pode alterar as colunas de `events` e `profiles` que fazem sentido para ele — não é possível, por exemplo, inflar o próprio `interest_count` ou se autopromover a `admin` via chamada direta à API, mesmo contornando a interface.
- **Contadores desnormalizados** (`interest_count`, `favorite_count`) mantidos por triggers, para não precisar de uma consulta `COUNT` extra em cada card da listagem.
- **Ações de moderação** (remover evento denunciado, resolver denúncia) passam por funções `security definer` (`admin_remove_event`, `admin_resolve_report`) que verificam `is_admin()` internamente — não dependem de uma policy de UPDATE genérica.
- **Autenticação verificada com `getUser()`**, nunca `getSession()`, em todo código de servidor que decide autorização — `getSession()` só lê o cookie local e não garante que o token ainda é válido.

## Checklist final de funcionamento

- [ ] Cadastro e login funcionam (Supabase Auth)
- [ ] Criar evento salva de verdade no banco (não é mockado)
- [ ] Upload de imagem funciona e a imagem aparece no card e na página do evento
- [ ] Editar e excluir só funcionam no próprio evento
- [ ] Busca, filtros e ordenação em Explorar consultam o backend
- [ ] "Tenho interesse" e "Favoritar" persistem e atualizam o contador
- [ ] Denunciar evento salva no banco
- [ ] Painel `/admin` mostra números reais e só é acessível por administradores
- [ ] `/admin/denuncias` permite marcar como resolvida e remover evento denunciado
- [ ] Layout responsivo em desktop, tablet e celular
- [ ] Loading states (skeletons), estados vazios e mensagens de erro aparecem nos momentos certos

## Possíveis próximos passos

Este projeto cobre as Prioridades 1, 2 e 3 do escopo original de forma completa e real, com a Prioridade 4 (animações/refinamentos) aplicada de forma moderada — hover states e uma única sequência de entrada no hero, via CSS puro, sem biblioteca de animação. Extensões razoáveis a partir daqui: paginação por scroll infinito em Explorar, notificação por e-mail quando um evento favoritado tiver alguma mudança, e testes automatizados (unitários para as Server Actions, E2E para o fluxo de criação de evento).
