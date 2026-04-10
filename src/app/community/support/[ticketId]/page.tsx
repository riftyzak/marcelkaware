import { TicketDetail } from "@/components/tickets/ticket-detail";

export default async function CommunityTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;

  return <TicketDetail ticketId={ticketId} />;
}
