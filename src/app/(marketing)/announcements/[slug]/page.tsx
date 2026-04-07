import { AnnouncementDetail } from "@/components/content/announcement-detail";

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AnnouncementDetail slug={slug} />;
}
