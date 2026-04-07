import Link from "next/link";

type PolicyBlock =
  | {
      type: "paragraph";
      content: string;
    }
  | {
      type: "list";
      items: readonly string[];
    };

type PolicySection = {
  title: string;
  blocks: readonly PolicyBlock[];
};

type PolicyPageProps = {
  eyebrow?: string;
  title: string;
  effectiveDate: string;
  intro?: readonly string[];
  sections: readonly PolicySection[];
};

export function PolicyPage({ eyebrow, title, effectiveDate, intro = [], sections }: PolicyPageProps) {
  function renderInlineContent(content: string) {
    const parts = content.split(
      /(https?:\/\/[^\s]+|(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi
    );

    return parts.map((part, index) => {
      if (!part) {
        return null;
      }

      const isUrl = /^https?:\/\/[^\s]+$/i.test(part);
      const isEmail = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(part);
      const isDomain = /^(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}$/i.test(part) && !isEmail;

      if (!isUrl && !isDomain && !isEmail) {
        return <span key={`${part}-${index}`}>{part}</span>;
      }

      const href = isUrl ? part : isEmail ? `mailto:${part}` : `https://${part.replace(/^www\./i, "www.")}`;

      return (
        <Link
          className="font-medium !text-[#8fb0d8] underline underline-offset-4 transition-colors visited:!text-[#8fb0d8] hover:!text-white"
          href={href}
          key={`${part}-${index}`}
          rel="noreferrer"
          target={isEmail ? undefined : "_blank"}
        >
          {part}
        </Link>
      );
    });
  }

  return (
    <div className="mx-auto max-w-[980px] space-y-8">
      <header className="space-y-3">
        {eyebrow ? (
          <p className="text-sm font-medium tracking-[0.18em] text-[#8fb0d8]/90 uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{title}</h1>
        <p className="text-sm text-slate-400">Effective date: {effectiveDate}</p>
      </header>

      <div className="space-y-6 border-t border-[color:var(--border)] pt-6">
        {intro.length > 0 ? (
          <section className="space-y-3">
            {intro.map((paragraph) => (
              <p className="text-sm leading-7 text-[color:var(--text-muted)] sm:text-[0.95rem]" key={paragraph}>
                {renderInlineContent(paragraph)}
              </p>
            ))}
          </section>
        ) : null}

        {sections.map((section, index) => (
          <section className="space-y-4 pt-4 sm:space-y-5" key={section.title}>
            {index > 0 || intro.length > 0 ? <div className="h-2" /> : null}
            <h2 className="pt-1 text-center text-xl font-semibold text-white sm:text-2xl">{section.title}</h2>
            <div className="space-y-3">
              {section.blocks.map((block, blockIndex) => {
                if (block.type === "paragraph") {
                  return (
                    <p
                      className="text-sm leading-7 text-[color:var(--text-muted)] sm:text-[0.95rem]"
                      key={`${section.title}-${blockIndex}`}
                    >
                      {renderInlineContent(block.content)}
                    </p>
                  );
                }

                return (
                  <ul
                    className="list-disc space-y-2 pl-5 text-sm leading-7 text-[color:var(--text-muted)] sm:text-[0.95rem]"
                    key={`${section.title}-${blockIndex}`}
                  >
                    {block.items.map((item) => (
                      <li key={item}>{renderInlineContent(item)}</li>
                    ))}
                  </ul>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
