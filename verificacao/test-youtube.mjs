// Testes da funcionalidade "vídeo de apresentação do YouTube" (sem dependências externas).
//
// Como rodar, na RAIZ do projeto (Node 22.6 ou mais novo):
//   node --experimental-strip-types verificacao/test-youtube.mjs
//
// Cobre: extração/validação do ID (formatos válidos, lookalikes, esquemas perigosos, fuzz),
// a semântica de edição (campo intacto = não mexe; vazio = remove; link válido = atualiza),
// as URLs montadas a partir do ID, a migração 003 (idempotente, aditiva, sem comandos
// destrutivos, regex igual ao do código) e verificações ESTÁTICAS do código-fonte (atributos
// de segurança do iframe, uso da mesma validação no servidor, regra de data e classificação
// regional intactas). NÃO executa SQL de verdade nem renderiza React/Zod: veja o roteiro.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const yt = await import(new URL("../src/lib/youtube.ts", import.meta.url).href);
const {
  YOUTUBE_ID_PATTERN,
  YOUTUBE_URL_MAX_LENGTH,
  YOUTUBE_EMBED_ORIGIN,
  isValidYouTubeId,
  extractYouTubeId,
  parseYouTubeInput,
  resolveVideoChange,
  videoColumnsForInsert,
  videoColumnsForUpdate,
  videoUrlForSubmit,
  youTubeEmbedUrl,
  youTubeWatchUrl,
} = yt;

const ID = "dQw4w9WgXcQ";
const ID2 = "a-B_c1D2e3F";
const WATCH = `https://www.youtube.com/watch?v=${ID}`;

/* ------------------------------ ID de vídeo ------------------------------- */

test("isValidYouTubeId: exatamente 11 caracteres [A-Za-z0-9_-]", () => {
  for (const ok of [ID, ID2, "AAAAAAAAAAA", "-_-_-_-_-_-", "00000000000"]) {
    assert.equal(isValidYouTubeId(ok), true, ok);
  }
  const bad = ["", "short", "a".repeat(10), "a".repeat(12), "dQw4w9WgXc.", "dQw4w9WgXc!", "dQw4w9 WgXc",
    `${ID}\n`, `\n${ID}`, "ééééééééééé", "dQw4w9WgXc/", "dQw4w9WgXc%", "<script>aa"];
  for (const b of bad) assert.equal(isValidYouTubeId(b), false, JSON.stringify(b));
  for (const b of [null, undefined, 123, {}, [], true]) assert.equal(isValidYouTubeId(b), false);
});

/* ------------------------- extração: formatos válidos --------------------- */

const VALID = [
  `https://www.youtube.com/watch?v=${ID}`,
  `http://www.youtube.com/watch?v=${ID}`,
  `https://youtube.com/watch?v=${ID}`,
  `https://m.youtube.com/watch?v=${ID}`,
  `https://www.youtube.com/watch?v=${ID}&t=42s&list=PLabcdefghijk&index=2`,
  `https://www.youtube.com/watch?feature=share&v=${ID}`,
  `https://www.youtube.com/watch/?v=${ID}`,
  `https://youtu.be/${ID}`,
  `https://youtu.be/${ID}?si=AbCdEf&t=10`,
  `https://youtu.be/${ID}/`,
  `https://www.youtube.com/embed/${ID}`,
  `https://www.youtube.com/embed/${ID}?start=5&autoplay=1`,
  `https://www.youtube-nocookie.com/embed/${ID}?rel=0`,
  `https://youtube-nocookie.com/embed/${ID}`,
  `https://www.youtube.com/shorts/${ID}`,
  `https://www.youtube.com/shorts/${ID}?feature=share`,
  `https://www.youtube.com/live/${ID}?si=x`,
  `https://www.youtube.com/v/${ID}`,
  `youtu.be/${ID}`,
  `youtube.com/watch?v=${ID}`,
  `www.youtube.com/shorts/${ID}`,
  `HTTPS://WWW.YOUTUBE.COM/watch?v=${ID}`,
  `  https://youtu.be/${ID} \n`,
  `https://www.youtube.com/watch?v=${ID}#t=1m`,
  `https://youtu.be:443/${ID}`,
];

test("extractYouTubeId: aceita os formatos comuns e devolve só o ID", () => {
  for (const url of VALID) assert.equal(extractYouTubeId(url), ID, url);
  assert.equal(extractYouTubeId(`https://youtu.be/${ID2}`), ID2);
  assert.equal(extractYouTubeId(`https://www.youtube.com/watch?v=${ID2}`), ID2);
});

/* ------------------------ extração: o que deve falhar --------------------- */

const INVALID = [
  // outros sites e domínios parecidos
  "https://vimeo.com/123456789",
  `https://example.com/watch?v=${ID}`,
  `https://evil.com/?v=${ID}`,
  `https://youtube.com.evil.com/watch?v=${ID}`,
  `https://evilyoutube.com/watch?v=${ID}`,
  `https://notyoutu.be/${ID}`,
  `https://youtu.be.evil.com/${ID}`,
  `https://www.youtube.com.br/watch?v=${ID}`,
  `https://music.youtube.com/watch?v=${ID}`,
  `https://studio.youtube.com/watch?v=${ID}`,
  `https://gaming.youtube.com/watch?v=${ID}`,
  // usuário, senha, porta
  `https://youtube.com@evil.com/watch?v=${ID}`,
  `https://evil.com@youtube.com/watch?v=${ID}`,
  `https://user:pass@www.youtube.com/watch?v=${ID}`,
  `https://www.youtube.com:8080/watch?v=${ID}`,
  // esquemas
  "javascript:alert(1)",
  "JaVaScRiPt:alert(document.cookie)",
  "data:text/html,<script>alert(1)</script>",
  `ftp://youtu.be/${ID}`,
  "file:///etc/passwd",
  "vbscript:msgbox(1)",
  "mailto:alguem@youtube.com",
  // ID com tamanho/caracteres errados
  "https://youtu.be/short",
  `https://youtu.be/${ID}X`,
  `https://youtu.be/${ID.slice(0, 10)}`,
  `https://www.youtube.com/watch?v=${ID}%20x`,
  "https://www.youtube.com/watch?v=<script>alert(1)",
  "https://www.youtube.com/watch?v=dQw4w9WgXc!",
  "https://youtu.be/dQw4w9WgXcé",
  `https://www.youtube.com/watch?v=${ID}&v=outro`.replace(ID, "curto"),
  // caminhos que não são um vídeo
  "https://www.youtube.com/",
  "https://www.youtube.com/@canal",
  "https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv",
  "https://www.youtube.com/playlist?list=PLabcdefghijklmnop",
  "https://www.youtube.com/results?search_query=evento",
  "https://www.youtube.com/watch",
  "https://www.youtube.com/watch?list=PLabcdefghijk",
  `https://www.youtube.com/watch/${ID}`,
  "https://www.youtube.com/embed",
  `https://www.youtube.com/embed/${ID}/extra`,
  `https://www.youtube.com/shorts/${ID}/extra`,
  "https://www.youtube.com/user/nome",
  "https://www.youtube.com/c/nome",
  "https://youtu.be/",
  `https://www.youtube-nocookie.com/watch?v=${ID}`,
  `https://www.youtube-nocookie.com/shorts/${ID}`,
  // texto solto
  ID, // ID sem link: o campo pede um link
  "youtube",
  "https://",
  "não é um link",
  // espaços/controles no meio
  `https://youtu.be/${ID} extra`,
  `https://youtu.be/dQw4w9\nWgXcQ`,
  `https://youtu.be/dQw4w9\tWgXcQ`,
  `https://youtu.be/dQw4w9\u00a0WgXcQ`,
  `https://youtu.be/${ID}\u0000`,
];

test("extractYouTubeId: rejeita outros sites, esquemas perigosos, IDs ruins e caminhos que não são vídeo", () => {
  for (const input of INVALID) assert.equal(extractYouTubeId(input), null, input);
});

test("extractYouTubeId: vazio e entradas que não são texto", () => {
  for (const v of ["", " ", "\n\t "]) assert.equal(extractYouTubeId(v), null);
  for (const v of [null, undefined, 123, {}, [], true, () => {}]) assert.equal(extractYouTubeId(v), null);
});

test("extractYouTubeId: limite de tamanho do link", () => {
  const base = `https://youtu.be/${ID}?x=`;
  const at = base + "a".repeat(YOUTUBE_URL_MAX_LENGTH - base.length);
  assert.equal(at.length, YOUTUBE_URL_MAX_LENGTH);
  assert.equal(extractYouTubeId(at), ID); // no limite
  assert.equal(extractYouTubeId(at + "a"), null); // um caractere acima
  assert.equal(extractYouTubeId(`https://youtu.be/${ID}?x=${"a".repeat(5000)}`), null);
});

test("hosts parecidos com os permitidos são sempre rejeitados (todos os formatos)", () => {
  const allowed = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com", "www.youtube-nocookie.com"];
  const paths = [`/watch?v=${ID}`, `/embed/${ID}`, `/${ID}`, `/shorts/${ID}`, `/live/${ID}`];
  for (const h of allowed) {
    for (const bad of [`x${h}`, `${h}x`, `${h}.evil.com`, `${h}.`, `evil.com.${h}`, `a.${h}`, `${h}.br`, h.replace(".", "-")]) {
      for (const p of paths) assert.equal(extractYouTubeId(`https://${bad}${p}`), null, `https://${bad}${p}`);
    }
  }
});

test("ida e volta: extrair(montar(ID)) = ID para todos os formatos, com IDs aleatórios", () => {
  let seed = 424242;
  const rnd = (n) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const formats = [
    (id) => `https://www.youtube.com/watch?v=${id}`,
    (id) => `https://youtu.be/${id}`,
    (id) => `https://www.youtube.com/embed/${id}`,
    (id) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
    (id) => `https://www.youtube.com/shorts/${id}`,
    (id) => `https://www.youtube.com/live/${id}`,
    (id) => `youtu.be/${id}`,
  ];
  for (let i = 0; i < 300; i++) {
    const id = Array.from({ length: 11 }, () => chars[rnd(chars.length)]).join("");
    for (const f of formats) assert.equal(extractYouTubeId(f(id)), id, f(id));
    assert.equal(extractYouTubeId(youTubeWatchUrl(id)), id);
    assert.equal(extractYouTubeId(youTubeEmbedUrl(id)), id);
  }
});

test("fuzz: nunca devolve algo fora do padrão; se devolve, o host é permitido e o ID está no texto", () => {
  let seed = 987654321;
  const rnd = (n) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n);
  const alphabet = "abcXYZ019-_./:?=&%#@ \t\n\\'\"<>()[]{}!$*+,;~^`|éü";
  const allowedHosts = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com", "www.youtube-nocookie.com"]);
  const check = (input) => {
    const r = extractYouTubeId(input);
    if (r === null) return;
    assert.match(r, /^[A-Za-z0-9_-]{11}$/, JSON.stringify(input));
    assert.ok(input.includes(r), `ID fora do texto: ${JSON.stringify(input)}`);
    const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(input.trim()) ? input.trim() : `https://${input.trim()}`;
    assert.ok(allowedHosts.has(new URL(withScheme).hostname.toLowerCase()), JSON.stringify(input));
  };
  for (let i = 0; i < 20000; i++) {
    check(Array.from({ length: rnd(80) }, () => alphabet[rnd(alphabet.length)]).join(""));
  }
  const seeds = [...VALID, ...INVALID];
  for (let i = 0; i < 20000; i++) {
    let s = seeds[rnd(seeds.length)];
    for (let k = 0; k < 1 + rnd(3); k++) {
      const pos = rnd(s.length + 1);
      const op = rnd(3);
      const ch = alphabet[rnd(alphabet.length)];
      s = op === 0 ? s.slice(0, pos) + ch + s.slice(pos) : op === 1 ? s.slice(0, pos) + s.slice(pos + 1) : s.slice(0, pos) + ch + s.slice(pos + 1);
    }
    check(s);
  }
});

/* ------------------- estado do campo e semântica de edição ---------------- */

test("parseYouTubeInput: vazio, válido, inválido", () => {
  for (const v of ["", "   ", "\n", null, undefined]) assert.deepEqual(parseYouTubeInput(v), { status: "empty" }, String(v));
  assert.deepEqual(parseYouTubeInput(WATCH), { status: "valid", id: ID });
  assert.deepEqual(parseYouTubeInput(`  youtu.be/${ID2}  `), { status: "valid", id: ID2 });
  for (const v of ["https://vimeo.com/1", "abc", `https://youtu.be/curto`, 123, {}]) {
    assert.deepEqual(parseYouTubeInput(v), { status: "invalid" }, String(v));
  }
});

test("servidor: undefined = manter; vazio = remover; link válido = atualizar; inválido = rejeitar", () => {
  assert.deepEqual(resolveVideoChange(undefined), { action: "keep" });
  assert.deepEqual(resolveVideoChange(null), { action: "keep" });
  assert.deepEqual(resolveVideoChange(""), { action: "clear" });
  assert.deepEqual(resolveVideoChange("   "), { action: "clear" });
  assert.deepEqual(resolveVideoChange(WATCH), { action: "set", id: ID });
  assert.deepEqual(resolveVideoChange("https://vimeo.com/1"), { action: "invalid" });
  assert.deepEqual(resolveVideoChange("javascript:alert(1)"), { action: "invalid" });
});

test("colunas gravadas: UPDATE (manter/remover/atualizar) e INSERT (só quando há vídeo)", () => {
  assert.deepEqual(videoColumnsForUpdate({ action: "keep" }), {}); // não toca na coluna
  assert.ok(!("youtube_video_id" in videoColumnsForUpdate({ action: "keep" })));
  assert.deepEqual(videoColumnsForUpdate({ action: "clear" }), { youtube_video_id: null });
  assert.deepEqual(videoColumnsForUpdate({ action: "set", id: ID }), { youtube_video_id: ID });
  assert.deepEqual(videoColumnsForUpdate({ action: "invalid" }), {}); // nunca grava lixo
  assert.deepEqual(videoColumnsForInsert({ action: "keep" }), {});
  assert.deepEqual(videoColumnsForInsert({ action: "clear" }), {});
  assert.deepEqual(videoColumnsForInsert({ action: "set", id: ID }), { youtube_video_id: ID });
  assert.deepEqual(videoColumnsForInsert({ action: "invalid" }), {});
});

test("formulário: só envia video_url quando o campo foi alterado", () => {
  assert.equal(videoUrlForSubmit(WATCH, WATCH), undefined); // intacto
  assert.equal(videoUrlForSubmit(`  ${WATCH} `, WATCH), undefined); // só espaços
  assert.equal(videoUrlForSubmit("", ""), undefined); // evento sem vídeo, campo vazio
  assert.equal(videoUrlForSubmit(undefined, ""), undefined);
  assert.equal(videoUrlForSubmit("", WATCH), ""); // apagou: remover
  assert.equal(videoUrlForSubmit("   ", WATCH), "");
  assert.equal(videoUrlForSubmit(`https://youtu.be/${ID2}`, WATCH), `https://youtu.be/${ID2}`); // trocou
  assert.equal(videoUrlForSubmit(`https://youtu.be/${ID}`, ""), `https://youtu.be/${ID}`); // adicionou
});

test("cadeia completa da EDIÇÃO (formulário -> servidor -> coluna)", () => {
  const edit = (current, initial) => videoColumnsForUpdate(resolveVideoChange(videoUrlForSubmit(current, initial)));
  assert.deepEqual(edit(WATCH, WATCH), {}); // campo não alterado NÃO modifica o vídeo
  assert.deepEqual(edit(`  ${WATCH}  `, WATCH), {});
  assert.deepEqual(edit("", ""), {}); // evento antigo sem vídeo, editado sem tocar no campo
  assert.deepEqual(edit("", WATCH), { youtube_video_id: null }); // campo vazio REMOVE o vídeo
  assert.deepEqual(edit("   ", WATCH), { youtube_video_id: null });
  assert.deepEqual(edit(`https://youtu.be/${ID2}`, WATCH), { youtube_video_id: ID2 }); // link válido ATUALIZA
  assert.deepEqual(edit(`https://youtu.be/${ID}`, ""), { youtube_video_id: ID }); // adiciona a um evento sem vídeo
  assert.deepEqual(edit(`https://youtu.be/${ID}`, WATCH), { youtube_video_id: ID }); // mesmo vídeo, outro formato
  assert.deepEqual(edit("https://vimeo.com/1", WATCH), {}); // inválido: nada é gravado (e o servidor rejeita)
  assert.equal(resolveVideoChange(videoUrlForSubmit("https://vimeo.com/1", WATCH)).action, "invalid");
});

test("cadeia completa da CRIAÇÃO", () => {
  const create = (current) => videoColumnsForInsert(resolveVideoChange(videoUrlForSubmit(current, "")));
  assert.deepEqual(create(""), {}); // sem vídeo: evento normal, coluna fica NULL
  assert.deepEqual(create(undefined), {});
  assert.deepEqual(create(`https://youtu.be/${ID}`), { youtube_video_id: ID });
});

/* --------------------------- URLs montadas do ID -------------------------- */

test("youTubeEmbedUrl/youTubeWatchUrl: só com ID válido, sempre host fixo", () => {
  assert.equal(youTubeEmbedUrl(ID), `https://www.youtube-nocookie.com/embed/${ID}?rel=0&playsinline=1&hl=pt-BR`);
  assert.equal(youTubeWatchUrl(ID), `https://www.youtube.com/watch?v=${ID}`);
  assert.equal(YOUTUBE_EMBED_ORIGIN, "https://www.youtube-nocookie.com");
  const bad = ["", "short", "a".repeat(12), "abc/../../x", "a?b=c&d=e", "a#b", `${ID}"onload="x`, `${ID}'`, `${ID}<`, "dQw4w9WgXc ", `${ID}\n`, null, undefined, 123, {}];
  for (const b of bad) {
    assert.equal(youTubeEmbedUrl(b), null, JSON.stringify(b));
    assert.equal(youTubeWatchUrl(b), null, JSON.stringify(b));
  }
  const url = new URL(youTubeEmbedUrl(ID2));
  assert.equal(url.origin, "https://www.youtube-nocookie.com");
  assert.equal(url.pathname, `/embed/${ID2}`);
});

/* ------------------------------ migração 003 ------------------------------ */

const strip = (sql) => sql.split("\n").map((l) => l.replace(/--.*$/, "")).join("\n");
const sql003 = readFileSync(new URL("../supabase/migrations/003_video_youtube.sql", import.meta.url), "utf8");
const code003 = strip(sql003);

test("SQL 003: o regex do CHECK é idêntico ao do código e a lógica do CHECK está correta", () => {
  const m = /youtube_video_id\s*~\s*'([^']+)'/.exec(code003);
  assert.ok(m, "regex do CHECK não encontrado");
  assert.equal(m[1], YOUTUBE_ID_PATTERN.source);
  // espelha: check (youtube_video_id is null or youtube_video_id ~ '<regex>')
  const checkPasses = (v) => v === null || new RegExp(m[1]).test(v);
  assert.equal(checkPasses(null), true); // eventos antigos
  assert.equal(checkPasses(ID), true);
  for (const bad of ["", "curto", "a".repeat(12), "dQw4w9WgXc.", `${ID}\n`]) assert.equal(checkPasses(bad), false, JSON.stringify(bad));
  assert.match(code003, /check\s*\(\s*youtube_video_id\s+is\s+null\s+or\s+youtube_video_id\s*~/i);
});

test("SQL 003: aditiva, idempotente e sem comandos destrutivos", () => {
  assert.doesNotMatch(code003, /\b(drop\s+table|drop\s+column|drop\s+schema|drop\s+constraint|drop\s+policy|truncate|delete\s+from|insert\s+into)\b/i);
  assert.doesNotMatch(code003, /\bupdate\s+public\./i);
  assert.doesNotMatch(code003, /\b(create|alter|drop)\s+policy\b/i); // não mexe em policies (nem nas da região)
  assert.doesNotMatch(code003, /\b(enable|disable|force)\s+row\s+level\s+security\b/i);
  assert.doesNotMatch(code003, /\brevoke\b/i);
  assert.equal((code003.match(/add\s+column/gi) ?? []).length, 1);
  assert.match(code003, /add\s+column\s+if\s+not\s+exists\s+youtube_video_id\s+text\s*;/i);
  // a constraint só é criada depois de checar pg_constraint
  assert.ok(code003.indexOf("pg_constraint") !== -1 && code003.indexOf("pg_constraint") < code003.indexOf("add constraint"));
  assert.equal((code003.match(/add\s+constraint/gi) ?? []).length, 1);
  assert.match(code003, /add\s+constraint\s+events_youtube_video_id_check/i);
  // coluna anulável (sem NOT NULL nem DEFAULT): eventos antigos ficam NULL
  assert.doesNotMatch(code003, /youtube_video_id\s+text\s+(not\s+null|default)/i);
});

test("SQL 003: um único grant, só de UPDATE na coluna nova, para authenticated", () => {
  const grants = code003.match(/\bgrant\b[^;]*;/gi) ?? [];
  assert.equal(grants.length, 1);
  assert.match(grants[0], /grant\s+update\s*\(\s*youtube_video_id\s*\)\s+on\s+public\.events\s+to\s+authenticated\s*;/i);
  assert.doesNotMatch(code003, /grant\s+all/i);
  assert.doesNotMatch(code003, /\bto\s+(anon|public)\b/i);
});

/* ---------------------- verificações estáticas do código ------------------ */

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
// Os testes estáticos olham o CÓDIGO, não os comentários (que explicam decisões e citam termos proibidos).
const stripComments = (text) =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");
const readCode = (rel) => stripComments(read(rel));
const countOf = (text, re) => (text.match(re) ?? []).length;

test("player: atributos de segurança, host fixo e sem HTML do usuário", () => {
  const embed = readCode("src/components/events/youtube-embed.tsx");
  assert.match(embed, /referrerPolicy="strict-origin-when-cross-origin"/);
  assert.equal(countOf(embed, /referrerPolicy=/g), 1); // um único atributo, com o valor aprovado
  assert.doesNotMatch(embed, /referrerPolicy="(?!strict-origin-when-cross-origin")/);
  assert.doesNotMatch(embed, /no-referrer/); // nenhum no-referrer no código
  assert.match(embed, /loading="lazy"/);
  assert.match(embed, /allowFullScreen/);
  assert.match(embed, /youTubeEmbedUrl\(videoId\)/); // o src vem do ID validado
  assert.doesNotMatch(embed, /src=\{(?!embedUrl\})/); // nenhum outro src
  assert.doesNotMatch(embed, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(embed, /\bsandbox\b/); // decisão aprovada: sem sandbox
  assert.doesNotMatch(embed, /allow="[^"]*autoplay/);
  assert.match(embed, /rel="noopener noreferrer"/);
  assert.match(embed, /target="_blank"/);
  assert.match(embed, /title=\{`Vídeo de apresentação: \$\{title\}`\}/);
  assert.match(embed, /aspect-video/);
  assert.match(embed, /if \(!embedUrl \|\| !watchUrl\) return null;/); // sem vídeo: nada é renderizado
});

test("sem requisições ao YouTube, sem chave de API e sem dangerouslySetInnerHTML no projeto", () => {
  for (const rel of ["src/lib/youtube.ts", "src/components/events/youtube-embed.tsx"]) {
    const text = readCode(rel);
    assert.doesNotMatch(text, /\bfetch\s*\(|XMLHttpRequest|googleapis|api[_-]?key|oembed|process\.env/i, rel);
  }
  assert.doesNotMatch(readCode("src/lib/youtube.ts"), /^\s*import\s/m); // módulo puro, sem dependências
  const root = new URL("../src/", import.meta.url);
  const files = readdirSync(root, { recursive: true }).filter((f) => /\.(ts|tsx)$/.test(String(f)));
  assert.ok(files.length > 50);
  for (const f of files) {
    assert.doesNotMatch(stripComments(readFileSync(new URL(String(f), root), "utf8")), /dangerouslySetInnerHTML/, String(f));
  }
});

test("servidor valida de novo: criação e edição usam a mesma validação e as colunas por ação", () => {
  const actions = read("src/lib/actions/events.ts");
  assert.equal(countOf(actions, /resolveVideoChange\(parsed\.data\.video_url\)/g), 2);
  assert.equal(countOf(actions, /if \(videoChange\.action === "invalid"\) \{/g), 2); // guarda ativa, sem condição extra
  assert.equal(countOf(actions, /\.\.\.videoColumnsForInsert\(videoChange\)/g), 1);
  assert.equal(countOf(actions, /\.\.\.videoColumnsForUpdate\(videoChange\)/g), 1);
  assert.doesNotMatch(actions, /youtube_video_id\s*:/); // a coluna só é montada pelo módulo puro
  // o ID nunca vem pronto do navegador: a action só lê video_url (texto) e extrai
  assert.doesNotMatch(actions, /parsed\.data\.youtube_video_id|values\.youtube_video_id/);
});

test("Zod: campo opcional com a mesma validação; regra de data e classificação regional intactas", () => {
  const v = read("src/lib/validations.ts");
  assert.match(v, /video_url:\s*z\s*\.string\(\)\s*\.trim\(\)\s*\.max\(YOUTUBE_URL_MAX_LENGTH/);
  assert.match(v, /parseYouTubeInput\(value\)\.status !== "invalid"/);
  assert.match(v, /\.optional\(\),\s*\}\)/); // video_url é opcional dentro do objeto
  // regra existente de data de eventos (não alterada)
  assert.match(v, /A data precisa ser hoje ou no futuro\./);
  assert.match(v, /new Date\(`\$\{value\}T00:00:00`\) >= today/);
  // classificação regional preservada
  assert.match(v, /city: z\.enum\(CITY_VALUES/);
  assert.match(v, /region: z\s*\.enum\(REGION_VALUES/);
  assert.match(v, /\.superRefine\(\(data, ctx\) => \{\s*if \(cityUsesRegions\(data\.city\) && !data\.region\)/);
});

test("formulário e edição: rótulo, envio só quando alterado e valor inicial normalizado", () => {
  const form = read("src/components/events/event-form.tsx");
  assert.match(form, /Vídeo de apresentação \(link do YouTube\)/);
  assert.match(form, /videoUrlForSubmit\(video_url, initialVideoUrl\)/);
  assert.match(form, /videoField === undefined \? rest : \{ \.\.\.rest, video_url: videoField \}/);
  assert.match(form, /initialVideoUrl = defaultValues\?\.video_url \?\? ""/);
  assert.doesNotMatch(form, /type="url"/); // type="url" bloquearia links sem protocolo
  assert.doesNotMatch(form, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(form, /<iframe/); // sem pré-visualização com iframe no formulário
  // classificação regional preservada no formulário
  assert.match(form, /<Label htmlFor="city">Cidade<\/Label>/);
  assert.match(form, /<Label htmlFor="region">Região<\/Label>/);
  const edit = read("src/app/meus-eventos/[id]/editar/page.tsx");
  assert.match(edit, /video_url: youTubeWatchUrl\(event\.youtube_video_id\) \?\? ""/);
  assert.match(edit, /city: event\.city \?\? undefined/);
  assert.match(edit, /region: event\.region \?\? undefined/);
});

test("ações: classificação regional preservada e página do evento usa o componente", () => {
  const actions = read("src/lib/actions/events.ts");
  assert.equal(countOf(actions, /normalizeRegion\(parsed\.data\.city, parsed\.data\.region\)/g), 2);
  assert.equal(countOf(actions, /city: parsed\.data\.city,/g), 2);
  const page = read("src/app/eventos/[id]/page.tsx");
  assert.match(page, /<YouTubeEmbed videoId=\{event\.youtube_video_id\} title=\{event\.title\} \/>/);
  const types = read("src/lib/types.ts");
  assert.match(types, /youtube_video_id: string \| null;/);
  assert.match(types, /video_url\?: string;/);
});
