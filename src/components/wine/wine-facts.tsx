import type { WineProfile } from "@/lib/wine-profile";
import { formatDateDa } from "@/lib/drink-window";

export function WineFacts({ profile }: { profile: WineProfile }) {
  const taste = [profile.description, profile.body, profile.acidity].some(Boolean);
  const origin = [profile.appellation, profile.classification, profile.grapes, profile.alcohol].some(
    Boolean,
  );

  return (
    <div className="space-y-4 border-t border-[rgba(196,163,90,0.16)] pt-4">
      <p className="text-xs tracking-wide text-muted-foreground">Fra WineAPI</p>
      {taste ? (
        <section className="space-y-1">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--brass)]">Smag</h2>
          {profile.description ? <p className="text-sm leading-relaxed">{profile.description}</p> : null}
          {profile.body ? <Fact label="Krop" value={profile.body} /> : null}
          {profile.acidity ? <Fact label="Syre" value={profile.acidity} /> : null}
        </section>
      ) : null}
      {profile.pairings?.length ? (
        <section className="space-y-1.5">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--brass)]">
            Passer til
          </h2>
          <ul className="space-y-2">
            {profile.pairings.map((pairing) => (
              <li key={pairing.food} className="text-sm">
                <p>{pairing.food}</p>
                {pairing.notes ? (
                  <p className="text-muted-foreground">{pairing.notes}</p>
                ) : null}
                {typeof pairing.confidence === "number" ? (
                  <p className="text-xs text-muted-foreground">Sikkerhed {pairing.confidence}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {origin ? (
        <section className="space-y-1">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--brass)]">
            Oprindelse
          </h2>
          {profile.appellation ? <Fact label="Appellation" value={profile.appellation} /> : null}
          {profile.classification ? <Fact label="Klassifikation" value={profile.classification} /> : null}
          {profile.grapes ? <Fact label="Druer" value={profile.grapes} /> : null}
          {profile.alcohol ? <Fact label="Alkohol" value={profile.alcohol} /> : null}
        </section>
      ) : null}
      {profile.scores?.length ? (
        <section className="space-y-1.5">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--brass)]">
            Anmeldelser
          </h2>
          <ul className="space-y-1 text-sm">
            {profile.scores.map((score) => (
              <li key={`${score.reviewer}-${score.reviewDate ?? ""}-${score.scoreText ?? ""}`}>
                {[score.reviewer, score.scoreText, score.reviewDate ? formatDateDa(score.reviewDate) : null]
                  .filter(Boolean)
                  .join(" · ")}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {profile.prices?.length ? (
        <section className="space-y-1">
          <h2 className="text-sm text-muted-foreground">Pris da den blev hentet</h2>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {profile.prices.map((price) => (
              <li key={`${price.merchant}-${price.fetchedAt}`}>
                {price.merchant}: {price.price} {price.currency}, {formatDateDa(price.fetchedAt)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm">
      <span className="text-muted-foreground">{label}. </span>
      {value}
    </p>
  );
}
