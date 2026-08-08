import type { JSX } from "react";

/**
 * Rende un blocco JSON-LD (dati strutturati per Google) in modo sicuro.
 *
 * I caratteri `<`, `>` e `&` vengono convertiti nei loro equivalenti Unicode
 * (`<`, `>`, `&`) PRIMA di passare a React. In questo modo:
 *  - nessun `</script>` può chiudere il tag prima del tempo (niente injection),
 *  - React non ha caratteri da escaperare come testo,
 *  - i parser JSON decodificano correttamente i valori originali.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }): JSX.Element {
  const html = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return <script type="application/ld+json">{html}</script>;
}
