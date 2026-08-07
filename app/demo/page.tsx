import { redirect } from "next/navigation";

// La vecchia pagina demo (codice duplicato) ora punta alla pagina di prenotazione
// moderna del negozio demo. Il redirect evita link rotti mantenendo /demo raggiungibile.
export default function DemoPage() {
  redirect("/t/demo-neatx");
}
