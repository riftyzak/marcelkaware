import Link from "next/link";

export function RecaptchaDisclosure() {
  return (
    <p className="text-xs leading-5 text-[color:var(--text-dim)]">
      This site is protected by reCAPTCHA and the Google{" "}
      <Link
        className="text-[#8fb0d8] transition-colors hover:text-white"
        href="https://policies.google.com/privacy"
        rel="noreferrer"
        target="_blank"
      >
        Privacy Policy
      </Link>{" "}
      and{" "}
      <Link
        className="text-[#8fb0d8] transition-colors hover:text-white"
        href="https://policies.google.com/terms"
        rel="noreferrer"
        target="_blank"
      >
        Terms of Service
      </Link>{" "}
      apply.
    </p>
  );
}
