import { AdminAnnouncementEditor } from "@/components/content/admin-announcement-editor";

export default async function AdminAnnouncementEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AdminAnnouncementEditor slug={slug} />;
}
