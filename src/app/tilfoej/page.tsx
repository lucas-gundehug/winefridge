import { AddWineForm } from "@/components/wine/add-wine-form";

export default function AddPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[0.7rem] uppercase tracking-[0.22em] text-[var(--brass-dim)]">
          Ny gæst
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brass)]">
          Tilføj flaske
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Foto → genkendelse via WineAPI → bekræft → gem.
        </p>
      </div>
      <AddWineForm />
    </div>
  );
}
