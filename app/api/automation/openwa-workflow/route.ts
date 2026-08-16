import workflow from "../../../../n8n/neatx-reminder-openwa.json";

export const dynamic = "force-static";

export function GET() {
  return Response.json(workflow);
}
