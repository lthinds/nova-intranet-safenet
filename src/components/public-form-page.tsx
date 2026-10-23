import { useState } from "react";
import safenetMarkUrl from "@/assets/safenet-mark.png.asset.json";
import { Button } from "@/components/ui/button";

type Field = { label: string; type?: string; textarea?: boolean };

export function PublicFormPage({ title, description, fields, submitLabel }: { title: string; description: string; fields: Field[]; submitLabel: string }) {
  const [sent, setSent] = useState(false);
  const logo = (safenetMarkUrl as unknown as { url?: string }).url ?? (safenetMarkUrl as unknown as string);
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-xl rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <img src={logo} alt="Safenet" className="size-10 object-contain" />
          <div><strong className="font-display block tracking-[0.25em]">SAFENET</strong><small className="text-xs text-muted-foreground">Página pública · sem login</small></div>
        </div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {sent ? (
          <p className="mt-6 rounded-md bg-success-soft p-4 text-sm text-success">Enviado com sucesso (demonstração).</p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            {fields.map((f) => (
              <label key={f.label} className="block text-xs font-semibold">{f.label}
                {f.textarea ? <textarea required rows={4} className="mt-1 w-full rounded-md border bg-background p-2 text-sm" /> : <input required type={f.type ?? "text"} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" />}
              </label>
            ))}
            <Button type="submit" className="w-full">{submitLabel}</Button>
          </form>
        )}
      </div>
    </main>
  );
}
