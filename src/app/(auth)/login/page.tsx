import { cookies } from "next/headers";
import { LoginPageView } from "@/components/auth/login-page-view";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const initialNotice = cookieStore.get("auth_notice")?.value ?? null;
  const initialNextPath = cookieStore.get("auth_next")?.value ?? null;

  return <LoginPageView initialNextPath={initialNextPath} initialNotice={initialNotice} />;
}
