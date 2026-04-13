import { api } from "../../../../../convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";

export default async function CommunityTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const numericTicketNumber = Number(ticketId);
  if (Number.isInteger(numericTicketNumber) && numericTicketNumber > 0) {
    redirect(`/community/tickets/${numericTicketNumber}`);
  }

  const nextPath = await fetchQuery(api.communitySupport.resolveViewerLegacyTicketPath, {
    ticketId: ticketId as any,
  });

  redirect(nextPath ?? "/community/support");
}
