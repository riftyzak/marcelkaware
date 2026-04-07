/* eslint-disable @next/next/no-img-element */

type LogoProps = {
  className?: string;
};

export function LogoFull({ className = "" }: LogoProps) {
  return (
    <img
      alt="marcelkaware"
      className={`block w-auto ${className}`.trim()}
      style={{ aspectRatio: "527.82 / 122.13" }}
      src="/branding/logo-full.svg"
      width={528}
      height={122}
    />
  );
}

export function LogoIcon({ className = "" }: LogoProps) {
  return (
    <img
      alt="marcelkaware"
      className={`block w-auto ${className}`.trim()}
      style={{ aspectRatio: "162 / 88" }}
      src="/branding/logo-icon.svg"
      width={162}
      height={88}
    />
  );
}
