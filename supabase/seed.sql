-- ============================================================================
-- CONECTA COMUNIDADE — DADOS DE DEMONSTRAÇÃO
-- Execute por último, depois de schema.sql e policies.sql.
--
-- IMPORTANTE: crie uma conta pelo próprio app (tela de cadastro) ANTES de
-- rodar este script. Os eventos de demonstração são atribuídos ao primeiro
-- usuário cadastrado (o mais antigo em public.profiles), para não precisar
-- inserir usuários falsos diretamente em auth.users.
--
-- As datas são calculadas a partir de CURRENT_DATE, então os eventos sempre
-- aparecem como "próximos", não importa quando você rode o script.
-- As imagens usam picsum.photos (serviço público de imagens de placeholder).
-- ============================================================================

insert into public.events (
  user_id, title, description, category, event_date, event_time,
  location, neighborhood, address, is_free, price, image_url, capacity,
  organizer_name, contact
)
select
  (select id from public.profiles order by created_at asc limit 1),
  v.title, v.description, v.category, (current_date + v.days_ahead)::date, v.event_time::time,
  v.location, v.neighborhood, v.address, v.is_free, v.price, v.image_url, v.capacity,
  v.organizer_name, v.contact
from (
  values
    ('Feira Comunitária de Artesanato', 'Barraquinhas de artesãos locais com peças em cerâmica, tecido e madeira, além de comidas típicas da região. Uma tarde para conhecer o trabalho de quem faz a mão perto de você.', 'cultura', 6, '10:00:00', 'Praça Central', 'Vila Esperança', 'Praça Central, s/n', true, null::numeric, 'https://picsum.photos/seed/feira-artesanato/900/650', null::int, 'Associação de Moradores Vila Esperança', 'contato@vilaesperanca.org'),
    ('Campeonato de Futebol Society do Bairro', 'Disputa entre 8 times de moradores do bairro, com premiação simbólica para os três primeiros colocados. Traga sua torcida!', 'esportes', 12, '14:00:00', 'Quadra Poliesportiva Municipal', 'Jardim das Flores', 'Rua das Palmeiras, 250', true, null::numeric, 'https://picsum.photos/seed/futebol-society/900/650', 96, 'Liga Comunitária de Esportes', '(11) 98888-1234'),
    ('Oficina de Fotografia com Celular', 'Workshop prático de 3 horas sobre composição, luz natural e edição básica usando apenas o celular. Vagas limitadas, traga o seu aparelho carregado.', 'educacao', 9, '09:00:00', 'Centro Cultural Popular', 'Centro', 'Av. Brasil, 480', false, 15.00, 'https://picsum.photos/seed/oficina-fotografia/900/650', 25, 'Coletivo Olhar de Bairro', 'oficinas.olhardebairro@gmail.com'),
    ('Festival de Música na Praça', 'Uma tarde inteira com bandas e artistas independentes da região, do samba ao rock. Programação para todas as idades.', 'musica', 20, '16:00:00', 'Praça da Matriz', 'Vila Nova', null, true, null::numeric, 'https://picsum.photos/seed/festival-musica-praca/900/650', null::int, 'Coletivo Som da Vila', 'somdavila@gmail.com'),
    ('Mutirão de Plantio de Árvores', 'Ação de reflorestamento urbano nas margens do córrego local. Mudas, luvas e ferramentas fornecidas — é só aparecer disposto a colocar a mão na terra.', 'meio_ambiente', 15, '08:00:00', 'Margens do Córrego Verde', 'Jardim Primavera', null, true, null::numeric, 'https://picsum.photos/seed/mutirao-plantio/900/650', 60, 'Coletivo Bairro Verde', 'bairroverde@gmail.com'),
    ('Roda de Capoeira Aberta', 'Roda aberta à comunidade, com mestres e alunos locais. Quem quiser participar da roda é bem-vindo, e quem quiser só assistir também.', 'cultura', 4, '17:00:00', 'Praça do Trabalhador', 'Vila Esperança', null, true, null::numeric, 'https://picsum.photos/seed/roda-capoeira/900/650', null::int, 'Grupo Capoeira Raiz', '(11) 97777-4321'),
    ('Torneio de Xadrez da Praça', 'Torneio aberto no formato eliminatório simples, tabuleiros fornecidos pela organização. Inscrição no local a partir das 13h.', 'esportes', 18, '14:00:00', 'Praça Central', 'Centro', 'Praça Central, s/n', false, 10.00, 'https://picsum.photos/seed/torneio-xadrez/900/650', 32, 'Clube de Xadrez do Centro', 'xadrezcentro@gmail.com'),
    ('Palestra: Educação Financeira para Iniciantes', 'Uma introdução prática a orçamento pessoal, reserva de emergência e como sair do vermelho, com linguagem simples e exemplos do dia a dia.', 'educacao', 11, '19:00:00', 'Biblioteca Comunitária', 'Vila Nova', 'Rua dos Ipês, 120', true, null::numeric, 'https://picsum.photos/seed/palestra-financas/900/650', 50, 'ONG Educação Para Todos', 'contato@educacaoparatodos.org'),
    ('Encontro Cultural de Culinária Regional', 'Moradores dividem receitas de família em um almoço coletivo — cada participante contribui com um prato para compartilhar.', 'cultura', 25, '12:00:00', 'Salão Comunitário', 'Jardim das Flores', 'Rua das Palmeiras, 90', true, null::numeric, 'https://picsum.photos/seed/culinaria-regional/900/650', 80, 'Associação de Moradores Jardim das Flores', 'amjardimdasflores@gmail.com'),
    ('Campanha do Agasalho', 'Ponto de coleta de roupas de frio para famílias em situação de vulnerabilidade. Doações podem ser entregues durante todo o evento.', 'acoes_sociais', 7, '09:00:00', 'Igreja Matriz', 'Centro', 'Av. Brasil, 300', true, null::numeric, 'https://picsum.photos/seed/campanha-agasalho/900/650', null::int, 'Pastoral Social', 'pastoralsocial@gmail.com'),
    ('Feira de Trocas Sustentáveis', 'Traga o que não usa mais — roupas, livros, brinquedos — e troque com outros moradores. Nada de dinheiro, só troca direta.', 'meio_ambiente', 22, '10:00:00', 'Praça do Trabalhador', 'Vila Esperança', null, true, null::numeric, 'https://picsum.photos/seed/feira-trocas/900/650', null::int, 'Coletivo Bairro Verde', 'bairroverde@gmail.com'),
    ('Aula Aberta de Dança de Salão', 'Aula gratuita de forró e salsa para iniciantes, sem necessidade de par ou experiência prévia.', 'lazer', 8, '19:30:00', 'Centro Cultural Popular', 'Centro', 'Av. Brasil, 480', true, null::numeric, 'https://picsum.photos/seed/danca-salao/900/650', 40, 'Estúdio Passo Comunitário', 'passocomunitario@gmail.com'),
    ('Piquenique Comunitário no Parque', 'Encontro descontraído para famílias e vizinhos, com música ao vivo, jogos para crianças e espaço para trazer sua própria comida.', 'lazer', 27, '11:00:00', 'Parque Municipal', 'Jardim Primavera', null, true, null::numeric, 'https://picsum.photos/seed/piquenique-parque/900/650', null::int, 'Associação de Moradores Jardim Primavera', 'amjardimprimavera@gmail.com'),
    ('Bazar Beneficente de Fim de Semana', 'Venda de itens doados por moradores, com toda a renda revertida para reformas do centro comunitário do bairro.', 'outros', 13, '10:00:00', 'Centro Comunitário', 'Vila Nova', 'Rua dos Ipês, 45', false, 5.00, 'https://picsum.photos/seed/bazar-beneficente/900/650', null::int, 'Amigos do Centro Comunitário', 'amigoscentrocomunitario@gmail.com'),
    ('Show de Violão e Vozes', 'Noite acústica com músicos amadores do bairro, num formato de microfone aberto — quem quiser se apresentar, é só chegar cedo e se inscrever.', 'musica', 30, '19:00:00', 'Café Cultural da Praça', 'Centro', 'Praça Central, 12', false, 20.00, 'https://picsum.photos/seed/show-violao-vozes/900/650', 60, 'Café Cultural da Praça', 'shows@cafeculturaldapraca.com')
) as v (
  title, description, category, days_ahead, event_time,
  location, neighborhood, address, is_free, price, image_url, capacity,
  organizer_name, contact
)
where exists (select 1 from public.profiles);
