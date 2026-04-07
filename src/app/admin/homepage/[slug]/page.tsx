import { AdminHomepageBlockEditor } from "@/components/content/admin-homepage-block-editor";

export default async function AdminHomepageBlockEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { slug } = await params;
  const { type } = await searchParams;

  return <AdminHomepageBlockEditor slug={slug} initialType={type as any} />;
}
