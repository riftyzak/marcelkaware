import { cn } from "@/lib/utils/cn";

export function TicketRichTextRenderer({
  body,
  bodyHtml,
  className,
}: {
  body: string;
  bodyHtml?: string | null;
  className?: string;
}) {
  if (!bodyHtml) {
    return <p className={cn("whitespace-pre-wrap text-sm leading-7 text-[color:var(--text)]", className)}>{body}</p>;
  }

  return (
    <div
      className={cn(
        "ticket-rich-text text-sm leading-7 text-[color:var(--text)] [&_a]:!text-[#8fb0d8] [&_a]:underline [&_a]:underline-offset-4",
        "[&_blockquote]:border-l [&_blockquote]:border-[color:var(--border)] [&_blockquote]:pl-4 [&_blockquote]:text-[color:var(--text-muted)]",
        "[&_code]:rounded [&_code]:bg-white/6 [&_code]:px-1.5 [&_code]:py-0.5 [&_pre]:overflow-x-auto [&_pre]:rounded-[10px] [&_pre]:bg-black/20 [&_pre]:p-3",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-0 [&_ul]:list-disc [&_ul]:pl-5",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: bodyHtml }}
    />
  );
}
