import { NewTicketForm } from "@/components/tickets/new-ticket-form";
import { requireAuthenticatedPage } from "@/lib/auth/require-auth";

export default async function CommunityNewTicketPage() {
  await requireAuthenticatedPage();
  return <NewTicketForm />;
}
