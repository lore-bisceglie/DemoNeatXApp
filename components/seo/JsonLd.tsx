import type { JSX } from "react";

/**
 * Rende un blocco JSON-LD (dati strutturati per Google).
 *
 * Il contenuto JSON viene escaperato (`<` → `<`) PRIMA di essere
 * serializzato, in modo che nessun `</script>` possa chiudere il tag
 * prematuramente (protezione da injection tramite i campi del negozio).
 *
 * `suppressHydrationWarning` è necessario perché gli script JSON-LD
 * sono renderizzati dal server e non devono essere ri-verificati dal
 * client durante l'idratazione (evita falsi warning di mismatch).
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }): JSX.Element {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
