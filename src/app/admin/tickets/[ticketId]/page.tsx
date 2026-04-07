import { StaffTicketDetail } from "@/components/tickets/staff-ticket-detail";

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  return <StaffTicketDetail ticketId={ticketId} />;
}
