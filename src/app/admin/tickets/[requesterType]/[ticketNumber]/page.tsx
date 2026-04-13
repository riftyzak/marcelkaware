import { StaffTicketDetail } from "@/components/tickets/staff-ticket-detail";
import { notFound } from "next/navigation";

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ requesterType: string; ticketNumber: string }>;
}) {
  const { requesterType, ticketNumber } = await params;
  const parsedTicketNumber = Number(ticketNumber);

  if (
    (requesterType !== "user" && requesterType !== "guest") ||
    !Number.isInteger(parsedTicketNumber) ||
    parsedTicketNumber < 1
  ) {
    notFound();
  }

  return (
    <StaffTicketDetail
      requesterType={requesterType}
      ticketNumber={parsedTicketNumber}
    />
  );
}
