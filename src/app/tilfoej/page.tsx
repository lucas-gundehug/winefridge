import { AddWineForm } from "@/components/wine/add-wine-form";

export default function AddPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brass)]">
          Tilføj flaske
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tag et foto eller søg, og gem med navn, type og antal.
        </p>
      </div>
      <AddWineForm />
    </div>
  );
}
