import { CommunityCategoryView } from "@/components/community/community-category-view";

export default async function CommunityCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CommunityCategoryView slug={slug} />;
}
