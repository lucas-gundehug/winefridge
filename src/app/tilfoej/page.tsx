import { AddWineForm } from "@/components/wine/add-wine-form";

export default function AddPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Tilføj flaske</h1>
        <p className="text-sm text-muted-foreground">
          Foto → genkendelse via WineAPI → bekræft → gem.
        </p>
      </div>
      <AddWineForm />
    </div>
  );
}
