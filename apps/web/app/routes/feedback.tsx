import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { SITE } from "@aihot/site";
import { Presence } from "../components/ui/Presence";
import { edgeTtl } from "../lib/api.server";
import { pageMeta } from "../lib/seo";
import { KEYS, lastPage, readJson, writeRaw } from "../lib/local-state";
import { IconCheck, IconClose, IconImage } from "../components/icons";
import { RingMark } from "@aihot/site/brand/Logo.tsx";
import { AsideCard, ReadingLayout } from "../components/ui/Page";
import { PhoneBar } from "../components/shell/PhoneBar";
import type { Screen } from "../components/shell/screens";
import { isHydrated } from "../lib/hydration";
import type { WebModule } from "../modules";
import { webModules } from "../site-modules";

export const handle: Screen = { tab: "me", name: "Feedback" };

export function headers() {
  return edgeTtl(300);
}

export function meta() {
  return pageMeta({ title: "Feedback", description: `Diga ao ${SITE.name} o que pode melhorar: conteúdo, recursos, integração, ou pedidos de correção e remoção de fontes.`, path: "/feedback", image: "/og/pages/feedback.png", noindex: true });
}

interface Draft {
  content: string;
  email: string;
  pageUrl: string;
}

function parseDraft(value: unknown): Draft | null {
  if (!value || typeof value !== "object") return null;
  const d = value as Record<string, unknown>;
  return { content: String(d.content ?? ""), email: String(d.email ?? ""), pageUrl: String(d.pageUrl ?? "") };
}

/** Drafts the site's modules keep elsewhere in this browser. */
const otherDrafts = () => webModules().flatMap((m) => (m.feedbackDraft ? [m.feedbackDraft] : []));

function readDraft(): Draft | null {
  let draft = parseDraft(readJson(KEYS.feedbackDraft));
  for (const other of otherDrafts()) draft ??= parseDraft(other.read());
  return draft;
}

/** Saves the draft in this browser, or clears it (null); false when the browser refused. */
function writeDraft(d: Draft | null): boolean {
  const saved = writeRaw(KEYS.feedbackDraft, d && JSON.stringify({ ...d, savedAt: new Date().toISOString() }));
  // Another draft is kept until this one is saved; a submitted draft clears them all.
  if (saved || d === null) for (const other of otherDrafts()) other.clear();
  return saved;
}

const TIPS = ["O link da página ou matéria com problema", "O que você viu e o que queria fazer", "Uma captura de tela ajuda; esconda antes as informações sensíveis"];

type Guide = NonNullable<WebModule["feedbackGuide"]>;

/** The guide of the module whose button opened this page (WebModule.feedbackGuide), if any. */
function guideFor(state: unknown): Guide | null {
  const name = state && typeof state === "object" ? (state as { feedbackFor?: unknown }).feedbackFor : null;
  return webModules().find((m) => m.name === name)?.feedbackGuide ?? null;
}

/** What the reader had already typed where the button was (the link's `state.content`), if anything. */
function carriedText(state: unknown): string | null {
  const text = state && typeof state === "object" ? (state as { content?: unknown }).content : null;
  return typeof text === "string" && text.trim() ? text : null;
}

function FeedbackAside({ tips }: { tips: string[] }) {
  return (
    <>
      <AsideCard title="Com estes pontos, resolvemos mais rápido">
        <ol className="space-y-2.5">
          {tips.map((t, i) => (
            <li key={t} className="flex gap-2.5 text-[13px] leading-[1.6] text-ink-3">
              <span className="mono mt-px text-[11px] font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
              {t}
            </li>
          ))}
        </ol>
      </AsideCard>
      <AsideCard title="Para fontes">
        <p className="text-[13px] leading-[1.75] text-ink-3">Se você é a fonte e quer corrigir, remover ou mudar a forma de exibição, basta informar o link da matéria e o que você precisa.</p>
      </AsideCard>
    </>
  );
}

/**
 * Some phones report a JPEG as image/jpg, or give no type at all: the file name decides then. The
 * server checks the picture's real bytes either way.
 */
function screenshotType(file: File): string {
  const type = file.type.trim().toLowerCase();
  if (type === "image/jpg") return "image/jpeg";
  if (type && type !== "application/octet-stream") return type;
  if (/\.png$/i.test(file.name)) return "image/png";
  if (/\.jpe?g$/i.test(file.name)) return "image/jpeg";
  if (/\.webp$/i.test(file.name)) return "image/webp";
  return type;
}

const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_TEXT = 2000;

export default function FeedbackPage() {
  const [params] = useSearchParams();
  // The guide comes with the button's navigation, which the server never sees: a page the server drew starts with
  // the site's own words, and turns to the guide once hydrated.
  const { state: navigation, pathname, search } = useLocation();
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(isHydrated);
  useEffect(() => setHydrated(true), []);
  const guide = hydrated ? guideFor(navigation) : null;
  const [draft, setDraft] = useState<Draft>({ content: "", email: "", pageUrl: params.get("from") ?? "" });
  const [shot, setShot] = useState<{ file: File; url: string } | null>(null);
  const [state, setState] = useState<{ kind: "idle" | "sending" | "done" | "error"; message?: string; id?: number }>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = readDraft();
    // The page the reader was on before coming here (tracked across in-site navigation, "Mais" skipped);
    // a document the browser opened fresh falls back to its referrer.
    const before = params.get("from") ? null : (lastPage() ?? (document.referrer.startsWith(location.origin) ? document.referrer : null));
    const from = before ? new URL(before, location.origin).href : null;
    // What was just typed comes before an older draft; the email kept with that draft stays. It is taken once:
    // from here it is this page's draft, and a reload brings back what the reader has written since.
    const carried = carriedText(navigation);
    if (carried) {
      setDraft((d) => ({ content: carried, email: saved?.email ?? "", pageUrl: d.pageUrl || from || saved?.pageUrl || "" }));
      navigate(pathname + search, { replace: true, state: { ...(navigation as object), content: undefined } });
    } else if (saved) setDraft((d) => ({ ...saved, pageUrl: d.pageUrl || from || saved.pageUrl }));
    else if (from) setDraft((d) => ({ ...d, pageUrl: from }));
  }, []);
  useEffect(() => {
    const t = setTimeout(() => writeDraft(draft.content || draft.email ? draft : null), 400);
    return () => clearTimeout(t);
  }, [draft]);

  useEffect(() => {
    if (!shot) return;
    return () => URL.revokeObjectURL(shot.url);
  }, [shot]);

  const pick = (picked: File | null | undefined) => {
    if (!picked) return;
    const type = screenshotType(picked);
    if (!/^image\/(png|jpeg|webp)$/.test(type)) return setState({ kind: "error", message: "A captura precisa ser PNG, JPEG ou WebP." });
    const file = type === picked.type ? picked : new File([picked], picked.name, { type });
    if (file.size > MAX_IMAGE) return setState({ kind: "error", message: "A captura pode ter no máximo 5 MB." });
    setShot({ file, url: URL.createObjectURL(file) });
    setState({ kind: "idle" });
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (file) pick(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.content.trim().length < 2) return setState({ kind: "error", message: "Escreva o seu feedback." });
    setState({ kind: "sending" });
    try {
      const form = new FormData();
      form.set("content", draft.content);
      form.set("email", draft.email);
      form.set("pageUrl", draft.pageUrl);
      if (shot) form.set("screenshot", shot.file);
      const res = await fetch("/api/site/feedback", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setState({ kind: "error", message: body.detail ?? "Não foi possível enviar; tente de novo daqui a pouco." });
      writeDraft(null);
      setState({ kind: "done", id: body.id });
      setDraft({ content: "", email: "", pageUrl: "" });
      setShot(null);
    } catch {
      setState({ kind: "error", message: "A conexão está instável; o rascunho ficou salvo neste aparelho, envie mais tarde." });
    }
  };

  if (state.kind === "done") {
    return (
      <ReadingLayout>
        <div className="card px-6 py-14 text-center">
          <div className="anim-pop-in mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-accent-contrast">
            <IconCheck size={26} />
          </div>
          <h1 className="mt-6 text-[22px] font-semibold text-ink">Recebemos, obrigado!</h1>
          <p className="mt-2 text-[14px] text-ink-3">
            Número do feedback: <span className="mono font-semibold text-ink">#{state.id}</span>. Se precisarmos responder, vamos citar este número.
          </p>
          <Link to="/" className="mt-8 inline-flex h-10 items-center rounded-full bg-ink px-6 text-[14px] font-medium text-bg transition-opacity hover:opacity-90">
            Voltar aos destaques
          </Link>
        </div>
      </ReadingLayout>
    );
  }

  const field = "w-full rounded-card bg-well text-ink outline-none ring-1 ring-inset ring-line-soft transition-[background-color,box-shadow] placeholder:text-ink-4 hover:ring-line-strong focus:bg-surface focus:shadow-[0_0_0_3px_var(--accent-soft)] focus:ring-accent";
  const label = "mb-2 block text-[13px] font-semibold text-ink";
  const canSend = draft.content.trim().length >= 2 && state.kind !== "sending";
  return (
    <>
    <PhoneBar back={{ to: "/more", label: "Meu" }} title="Feedback" />
    <ReadingLayout aside={<FeedbackAside tips={guide?.tips ?? TIPS} />}>
      <header>
        <h1 data-page-title="" className="text-[24px] font-semibold leading-[1.3] text-ink">{guide?.title ?? "Conte o que você acha"}</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-3">{guide?.lead ?? SITE.feedbackLead}</p>
      </header>

      <form
        onSubmit={submit}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files[0]);
        }}
        className={`card mt-6 overflow-hidden transition-shadow ${dragging ? "shadow-[0_0_0_3px_var(--accent-soft)] ring-1 ring-accent" : ""}`}
      >
        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <label htmlFor="fb-content" className={label}>
              O que você quer dizer?
            </label>
            <div className="relative">
              <textarea
                id="fb-content"
                required
                rows={9}
                maxLength={MAX_TEXT}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                placeholder={guide?.example ?? SITE.feedbackExample}
                className={`${field} block resize-y px-4 pb-8 pt-3.5 text-[16px] leading-relaxed sm:text-[14.5px]`}
              />
              <span className="mono pointer-events-none absolute bottom-3 right-4 text-[11px] text-ink-4">
                {draft.content.length} / {MAX_TEXT}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="fb-email" className={label}>
              E-mail <span className="font-normal text-ink-4">(opcional)</span>
            </label>
            <input id="fb-email" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder={SITE.feedbackEmailHint} className={`${field} h-11 px-4 text-[16px] sm:text-[14.5px]`} />
          </div>

          <div>
            <span className={label}>
              Captura de tela <span className="font-normal text-ink-4">(opcional)</span>
            </span>
            {shot ? (
              <div className="flex items-center gap-4 well rounded-card p-3">
                <img src={shot.url} alt="Prévia da captura" className="h-16 w-24 shrink-0 rounded-control border border-line bg-surface object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-ink-2">{shot.file.name}</div>
                  <div className="mono mt-0.5 text-[11.5px] text-ink-4">{(shot.file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <button type="button" aria-label="Remover captura" onClick={() => setShot(null)} className="grid size-8 shrink-0 place-items-center rounded-full text-ink-4 transition-colors hover:bg-surface hover:text-ink">
                  <IconClose size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`group flex w-full items-center gap-3.5 rounded-card border border-dashed px-4 py-3.5 text-left transition-colors ${dragging ? "border-accent bg-accent-softer" : "border-line-strong hover:border-ink-4 hover:bg-bg-sunk/60"}`}
              >
                <span className="grid size-10 shrink-0 place-items-center well rounded-tile text-ink-3 transition-colors group-hover:text-accent">
                  <IconImage size={19} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-ink-2">Adicionar uma captura do problema</span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-4">Também dá para colar ou arrastar aqui · esconda antes as informações sensíveis; PNG, JPEG ou WebP, até 5 MB</span>
                </span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </div>

          <Presence show={state.kind === "error"} enter="anim-notice-in" exit="anim-fade-out" duration={160}>
            <p role="alert" className="rounded-tile bg-hot-soft px-3.5 py-2.5 text-[13px] text-hot">
              {state.kind === "error" ? state.message : ""}
            </p>
          </Presence>
        </div>

        <div className="flex flex-col-reverse gap-4 border-t border-line-soft bg-bg-sunk/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:bg-bg-muted/30">
          <p className="text-[12px] leading-relaxed text-ink-4 sm:max-w-[400px]">
            Não envie chaves, documentos pessoais ou informações sensíveis sem relação com o problema. Ao enviar, você declara estar ciente de que o feedback, o e-mail opcional, as informações da página e a captura serão tratados conforme a
            <Link viewTransition to="/privacy" className="text-accent hover:underline">
              política de privacidade
            </Link>
            .
          </p>
          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-accent px-6 text-[14px] font-medium text-accent-contrast transition-[background-color,opacity] hover:bg-accent-ink disabled:bg-line-strong disabled:text-ink-4 sm:self-auto"
          >
            {state.kind === "sending" && <RingMark className="size-4" spinning />}
            Enviar feedback
          </button>
        </div>
      </form>
    </ReadingLayout>
    </>
  );
}
