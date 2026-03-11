import { ArrowLeft } from "lucide-react";

export default function Legal({ section = "impressum", onBack }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-10">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-500 dark:hover:text-violet-400 transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Zurück
      </button>

      {/* ── Impressum ───────────────────────────────────────────── */}
      <section id="impressum">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-6">
          Impressum
        </h1>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 flex flex-col gap-4">
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Angaben gemäß § 5 TMG
            </p>
            <p className="mt-1 leading-relaxed">
              Edgar-Niklas Heinz
              <br />
              Weißenburger Str. 26
              <br />
              85072 Eichstätt
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Kontakt
            </p>
            <p className="mt-1 leading-relaxed">
              E-Mail:{" "}
              <a
                href="mailto:contact@eddy.rip"
                className="text-violet-600 dark:text-violet-400 underline hover:opacity-80"
              >
                contact@eddy.rip
              </a>
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </p>
            <p className="mt-1 leading-relaxed">
              Edgar-Niklas Heinz
              <br />
              Weißenburger Str. 26
              <br />
              85072 Eichstätt
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Haftungsausschluss
            </p>
            <p className="mt-1 leading-relaxed">
              Die Inhalte dieser Seite wurden mit größtmöglicher Sorgfalt
              erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der
              Inhalte kann jedoch keine Gewähr übernommen werden. Der Anbieter
              ist nicht verpflichtet, übermittelte oder gespeicherte fremde
              Informationen zu überwachen.
            </p>
          </div>
        </div>
      </section>

      <hr className="border-slate-200 dark:border-slate-800" />

      {/* ── Datenschutzerklärung ────────────────────────────────── */}
      <section id="datenschutz">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-6">
          Datenschutzerklärung
        </h1>
        <div className="flex flex-col gap-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              1. Verantwortliche Stelle
            </h2>
            <p>
              Verantwortlich im Sinne der DSGVO ist die unter „Impressum"
              genannte natürliche Person.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              2. Erhebung und Verarbeitung personenbezogener Daten
            </h2>
            <p>
              HexLearn erhebt, verarbeitet oder übermittelt{" "}
              <strong>keine personenbezogenen Daten</strong>. Alle Lernkataloge,
              Statistiken und Einstellungen werden ausschließlich lokal auf
              deinem Gerät gespeichert.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              3. Lokale Datenspeicherung (localStorage)
            </h2>
            <p>
              Zur Bereitstellung der App-Funktionen (Fragenkataloge,
              Lernstatistiken, Lern-Streak, Farbschema) werden Daten
              ausschließlich im <code>localStorage</code> deines Browsers
              gespeichert. Diese Daten verbleiben lokal auf deinem Gerät, werden
              nicht an Dritte übertragen und sind nur für dich zugänglich.
            </p>
            <p className="mt-2">
              Du kannst alle gespeicherten Daten jederzeit über{" "}
              <em>Einstellungen → Alle Daten löschen</em> vollständig entfernen.
              Alternativ kannst du den localStorage deines Browsers über die
              Browser-Einstellungen leeren.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              4. Katalog-Sharing via QR-Code (HexShare)
            </h2>
            <p>
              Die optionale Teilen-Funktion überträgt den ausgewählten Katalog
              temporär an einen Server, um einen QR-Code zu ermöglichen. Die
              Daten werden ausschließlich für die gewählte Dauer (maximal{" "}
              <strong>10 Minuten</strong>) gespeichert und danach{" "}
              <strong>automatisch und unwiderruflich gelöscht</strong>. Es wird
              kein Account benötigt. Der Zugriff ist nur über die zufällig
              generierte Kurz-ID möglich. Die Übertragung erfolgt verschlüsselt
              (HTTPS). Es findet keine dauerhafte Speicherung oder
              Nutzerprofilierung statt.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              5. Cookies
            </h2>
            <p>
              Diese Website verwendet keine Cookies. Die App-Daten werden
              ausschließlich über <code>localStorage</code> gespeichert, nicht
              über Cookies.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              6. Externe Dienste &amp; Drittanbieter
            </h2>
            <p>
              Es werden keine externen Dienste, Analyse-Tools, Tracking-Skripte
              oder Content-Delivery-Networks eingebunden. Es findet kein
              Datenaustausch mit Drittanbietern statt.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              7. Hosting
            </h2>
            <p>
              Diese App wird über <strong>Vercel</strong> (Vercel Inc., 340 Pine
              Street, Suite 700, San Francisco, CA 94104, USA) bereitgestellt.
              Vercel erhebt beim Aufruf der Seite serverseitige Zugriffsdaten
              (z. B. IP-Adresse, Zeitstempel). Diese Verarbeitung erfolgt auf
              Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
              am sicheren Betrieb). Weitere Informationen findest du in der{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 dark:text-violet-400 underline hover:opacity-80"
              >
                Datenschutzerklärung von Vercel
              </a>
              .
            </p>
            <p className="mt-2">
              Die HexShare-Funktion nutzt <strong>Upstash Redis</strong>{" "}
              (Upstash Inc.) zur temporären Zwischenspeicherung von
              Katalogdaten. Daten werden ausschließlich für die gewählte Dauer
              gespeichert und danach automatisch gelöscht. Weitere Informationen
              unter{" "}
              <a
                href="https://upstash.com/trust/privacy.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 dark:text-violet-400 underline hover:opacity-80"
              >
                Upstash Privacy Policy
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              8. Deine Rechte
            </h2>
            <p>
              Du hast das Recht auf Auskunft, Berichtigung, Löschung und
              Einschränkung der Verarbeitung deiner personenbezogenen Daten
              (Art. 15–18 DSGVO) sowie das Recht auf Datenübertragbarkeit (Art.
              20 DSGVO) und Widerspruch (Art. 21 DSGVO). Da diese App keine
              personenbezogenen Daten serverseitig verarbeitet, sind diese
              Rechte in der Regel durch das selbstständige Löschen der lokalen
              Daten vollständig ausübbar.
            </p>
            <p className="mt-2">
              Bei Fragen wende dich an die im Impressum genannte Kontaktadresse.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              9. Beschwerderecht
            </h2>
            <p>
              Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu
              beschweren. Die zuständige Behörde richtet sich nach deinem
              Wohnort.
            </p>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-600 pt-2">
            Stand: März 2026
          </p>
        </div>
      </section>
    </div>
  );
}
