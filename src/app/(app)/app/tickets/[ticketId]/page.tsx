import { redirect } from "next/navigation";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  redirect(`/community/support/${ticketId}`);
}
