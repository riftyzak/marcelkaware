import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: ["convex/_generated/**"],
  },
  ...nextVitals,
];

export default config;
