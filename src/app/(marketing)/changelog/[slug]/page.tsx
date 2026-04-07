import { ChangelogDetail } from "@/components/content/changelog-detail";

export default async function ChangelogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ChangelogDetail slug={slug} />;
}
