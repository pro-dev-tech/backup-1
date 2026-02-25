/**
 * Converts markdown text to sanitized HTML for rendering.
 * Handles common patterns: headers, bold, italic, code, lists, links.
 */
export function renderMarkdown(text: string): string {
  if (!text) return "";

  let html = text
    // Escape HTML entities first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

    // Code blocks (``` ... ```)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) =>
      `<pre class="bg-secondary/80 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono border border-border"><code>${code.trim()}</code></pre>`
    )

    // Headers
    .replace(/^#### (.+)$/gm, '<h5 class="text-xs font-semibold text-foreground mt-3 mb-1">$1</h5>')
    .replace(/^### (.+)$/gm, '<h4 class="text-sm font-semibold text-foreground mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-base font-semibold text-foreground mt-3 mb-1">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="text-lg font-bold text-foreground mt-4 mb-2">$1</h2>')

    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')

    // Italic (single asterisk, not already part of bold)
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>')

    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono text-primary">$1</code>')

    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-border my-3" />')

    // Unordered list items
    .replace(/^[\s]*[-•] (.+)$/gm, '<li class="ml-4 text-sm leading-relaxed flex items-start gap-1.5"><span class="text-primary mt-1.5 text-[6px]">●</span><span>$1</span></li>')

    // Ordered list items
    .replace(/^[\s]*(\d+)\. (.+)$/gm, '<li class="ml-4 text-sm leading-relaxed"><span class="text-primary font-medium mr-1.5">$1.</span>$2</li>')

    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')

    // Double newlines → paragraph breaks
    .replace(/\n\n/g, '</p><p class="my-1.5">')

    // Single newlines → line breaks
    .replace(/\n/g, "<br/>");

  // Wrap in paragraph
  html = `<p class="my-1.5">${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p class="my-1.5"><\/p>/g, "");

  return html;
}
