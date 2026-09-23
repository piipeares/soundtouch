interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Renderiza JSON-LD (schema.org) para SEO (task 6.4). Server-safe: solo
 * serializa el objeto a un <script type="application/ld+json">. El scrub de
 * "<" previene XSS cuando el contenido proviene del admin (task 6.5).
 */
export default function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}