import { TicketDetail } from "@/components/tickets/ticket-detail";
import { notFound } from "next/navigation";

export default async function CommunityTicketNumberPage({
  params,
}: {
  params: Promise<{ ticketNumber: string }>;
}) {
  const { ticketNumber } = await params;
  const parsedTicketNumber = Number(ticketNumber);

  if (!Number.isInteger(parsedTicketNumber) || parsedTicketNumber < 1) {
    notFound();
  }

  return <TicketDetail ticketNumber={parsedTicketNumber} />;
}
