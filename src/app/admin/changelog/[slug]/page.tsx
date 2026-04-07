import { AdminChangelogEditor } from "@/components/content/admin-changelog-editor";

export default async function AdminChangelogEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AdminChangelogEditor slug={slug} />;
}
