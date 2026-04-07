import Link from "next/link";

import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { Button } from "@/components/ui/button";
import { authConfig } from "@/lib/config/auth";

export default function RegisterPage() {
  return (
    <AuthPageShell title="Register">
      <div className="max-w-[640px] space-y-6">
        <AuthAlert message={authConfig.registrationDisabledMessage} />
        <p className="text-[color:var(--text-muted)]">
          Registration will be re-enabled once the forum is ready for production.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/login">
            <Button className="border-0 bg-[#8fb0d8] text-[#0b1015] hover:bg-[#a3bee0]" variant="primary">
              Login
            </Button>
          </Link>
          <Button
            className="border-0 bg-[#8fb0d8]/45 text-[#dbe7f5] hover:bg-[#8fb0d8]/45"
            disabled
            variant="primary"
          >
            Register
          </Button>
        </div>
      </div>
    </AuthPageShell>
  );
}
