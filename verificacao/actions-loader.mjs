// Loader de teste: permite executar src/lib/actions/events.ts (código REAL) em Node puro.
//  - resolve o alias "@/..." para src/...
//  - substitui por stubs: next/cache, next/navigation, o cliente Supabase e o Zod (validations).
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stub = (code) => "data:text/javascript," + encodeURIComponent(code);

const STUBS = {
  "next/cache": stub("export const revalidatePath = () => {};"),
  "next/navigation": stub("export const redirect = () => { throw new Error('redirect'); };"),
  "@/lib/supabase/server": stub("export async function createClient() { return globalThis.__fakeSupabase; }"),
  // O Zod não está instalado neste ambiente: a validação de formulário é substituída por "aceita tudo".
  "@/lib/validations": stub("export const eventSchema = { safeParse: (value) => ({ success: true, data: value }) };"),
};

export async function resolve(specifier, context, nextResolve) {
  if (STUBS[specifier]) return { url: STUBS[specifier], shortCircuit: true };
  if (specifier.startsWith("@/")) {
    const file = path.join(root, "src", specifier.slice(2) + ".ts");
    return nextResolve(pathToFileURL(file).href, context);
  }
  return nextResolve(specifier, context);
}
