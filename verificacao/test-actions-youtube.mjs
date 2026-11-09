// Executa as Server Actions REAIS (src/lib/actions/events.ts) com um Supabase falso e o Zod
// substituído, para verificar o que cada ação grava quanto ao vídeo do YouTube.
//
//   node --experimental-strip-types verificacao/test-actions-youtube.mjs
//
// Limites: o Supabase é um duplo de teste (nenhum banco real é consultado) e a validação Zod do
// formulário NÃO roda aqui (o pacote zod não está instalado neste ambiente); a validação do vídeo
// feita pela própria Server Action (resolveVideoChange) roda de verdade.
import test from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./actions-loader.mjs", import.meta.url);
const actions = await import(new URL("../src/lib/actions/events.ts", import.meta.url).href);
const { createEvent, updateEvent } = actions;

const ID = "dQw4w9WgXcQ";
const ID2 = "a-B_c1D2e3F";

let calls;
function installFakeSupabase({ user = { id: "user-1" }, dbError = null } = {}) {
  calls = [];
  const record = (kind, payload) => {
    const call = { kind, payload, filters: [] };
    calls.push(call);
    const q = {
      eq(col, val) { call.filters.push([col, val]); return q; },
      select() { return q; },
      single: async () => (dbError ? { data: null, error: dbError } : { data: { id: "evento-1" }, error: null }),
    };
    return q;
  };
  globalThis.__fakeSupabase = {
    auth: { getUser: async () => ({ data: { user } }) },
    from: (table) => {
      assert.equal(table, "events");
      return { insert: (p) => record("insert", p), update: (p) => record("update", p) };
    },
  };
}

// valores já "validados" (o Zod do formulário é substituído por um stub que aceita tudo)
const base = (extra = {}) => ({
  title: "Feira de Tecnologia",
  description: "Descrição de teste válida",
  category: "educacao",
  event_date: "2099-01-01",
  event_time: "10:00",
  city: "sao_paulo",
  region: "zona_norte",
  location: "Praça Central",
  neighborhood: "Santana",
  address: "",
  is_free: true,
  organizer_name: "Organização",
  contact: "",
  image_url: "",
  ...extra,
});

/* ------------------------------- EDIÇÃO ----------------------------------- */

test("edição: campo NÃO enviado (undefined) não mexe no vídeo salvo", async () => {
  installFakeSupabase();
  const r = await updateEvent("evento-1", base());
  assert.equal(r.success, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].kind, "update");
  assert.ok(!("youtube_video_id" in calls[0].payload), "a coluna não pode aparecer no UPDATE");
  assert.equal(calls[0].payload.title, "Feira de Tecnologia"); // os demais campos seguem sendo gravados
  assert.deepEqual(calls[0].filters, [["id", "evento-1"], ["user_id", "user-1"]]);
});

test("edição: campo vazio REMOVE o vídeo (youtube_video_id = null)", async () => {
  for (const vazio of ["", "   "]) {
    installFakeSupabase();
    const r = await updateEvent("evento-1", base({ video_url: vazio }));
    assert.equal(r.success, true);
    assert.ok("youtube_video_id" in calls[0].payload);
    assert.equal(calls[0].payload.youtube_video_id, null);
  }
});

test("edição: link válido ATUALIZA o ID (qualquer formato, só o ID é gravado)", async () => {
  const formatos = [
    [`https://www.youtube.com/watch?v=${ID}&t=9s&list=PLabcdefghijk`, ID],
    [`https://youtu.be/${ID2}?si=abc`, ID2],
    [`https://www.youtube.com/shorts/${ID}`, ID],
    [`youtube.com/embed/${ID2}`, ID2],
  ];
  for (const [link, esperado] of formatos) {
    installFakeSupabase();
    const r = await updateEvent("evento-1", base({ video_url: link }));
    assert.equal(r.success, true, link);
    assert.equal(calls[0].payload.youtube_video_id, esperado, link);
    // o valor gravado é EXATAMENTE um ID (nunca uma URL) e nenhum outro valor do payload carrega link do YouTube
    assert.match(calls[0].payload.youtube_video_id, /^[A-Za-z0-9_-]{11}$/, link);
    for (const value of Object.values(calls[0].payload)) {
      if (typeof value === "string") assert.ok(!/youtu|https?:/i.test(value), `valor com link: ${value}`);
    }
  }
});

test("edição: link inválido é REJEITADO no servidor e nada vai ao banco", async () => {
  for (const ruim of ["https://vimeo.com/123", "javascript:alert(1)", `https://youtube.com.evil.com/watch?v=${ID}`, "abc", `https://youtu.be/${ID}x`]) {
    installFakeSupabase();
    const r = await updateEvent("evento-1", base({ video_url: ruim }));
    assert.equal(r.success, false, ruim);
    assert.match(r.message, /YouTube/);
    assert.equal(calls.length, 0, `nada pode ser gravado: ${ruim}`);
  }
});

test("edição: classificação regional continua sendo gravada junto", async () => {
  installFakeSupabase();
  await updateEvent("evento-1", base({ city: "sao_paulo", region: "zona_sul" }));
  assert.equal(calls[0].payload.city, "sao_paulo");
  assert.equal(calls[0].payload.region, "zona_sul");
  installFakeSupabase();
  await updateEvent("evento-1", base({ city: "outra", region: "zona_norte" })); // região nunca vale fora de SP
  assert.equal(calls[0].payload.city, "outra");
  assert.equal(calls[0].payload.region, null);
});

/* ------------------------------- CRIAÇÃO ---------------------------------- */

test("criação: sem vídeo, o INSERT não inclui a coluna (evento normal, NULL no banco)", async () => {
  for (const extra of [{}, { video_url: "" }, { video_url: "   " }]) {
    installFakeSupabase();
    const r = await createEvent(base(extra));
    assert.equal(r.success, true);
    assert.equal(calls[0].kind, "insert");
    assert.ok(!("youtube_video_id" in calls[0].payload));
    assert.equal(calls[0].payload.user_id, "user-1");
  }
});

test("criação: link válido grava só o ID", async () => {
  installFakeSupabase();
  const r = await createEvent(base({ video_url: `https://youtu.be/${ID}?si=x` }));
  assert.equal(r.success, true);
  assert.equal(calls[0].payload.youtube_video_id, ID);
});

test("criação: link inválido é rejeitado no servidor e nada vai ao banco", async () => {
  for (const ruim of ["https://vimeo.com/123", "data:text/html,<script>alert(1)</script>", `https://evilyoutube.com/watch?v=${ID}`, "https://www.youtube.com/@canal"]) {
    installFakeSupabase();
    const r = await createEvent(base({ video_url: ruim }));
    assert.equal(r.success, false, ruim);
    assert.match(r.message, /YouTube/);
    assert.equal(calls.length, 0, ruim);
  }
});

test("criação/edição: classificação regional e demais campos intactos no INSERT", async () => {
  installFakeSupabase();
  await createEvent(base({ city: "sao_paulo", region: "centro", video_url: `https://youtu.be/${ID}` }));
  const p = calls[0].payload;
  assert.equal(p.city, "sao_paulo");
  assert.equal(p.region, "centro");
  assert.equal(p.title, "Feira de Tecnologia");
  assert.equal(p.neighborhood, "Santana");
  assert.equal(p.youtube_video_id, ID);
});

/* ----------------------- autenticação e erros preservados ----------------- */

test("sem usuário logado nada é gravado (comportamento existente preservado)", async () => {
  installFakeSupabase({ user: null });
  const a = await createEvent(base({ video_url: `https://youtu.be/${ID}` }));
  const b = await updateEvent("evento-1", base({ video_url: "" }));
  assert.equal(a.success, false);
  assert.equal(b.success, false);
  assert.equal(calls.length, 0);
});

test("erro do banco continua devolvendo a mensagem genérica existente", async () => {
  installFakeSupabase({ dbError: { code: "42703", message: "column does not exist" } });
  const a = await createEvent(base({ video_url: `https://youtu.be/${ID}` }));
  const b = await updateEvent("evento-1", base({ video_url: "" }));
  assert.equal(a.success, false);
  assert.equal(b.success, false);
  assert.match(a.message, /Não foi possível/);
  assert.match(b.message, /Não foi possível/);
});
