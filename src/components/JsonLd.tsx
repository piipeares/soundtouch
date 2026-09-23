interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Renderiza JSON-LD (schema.org) para SEO (task 6.4). Server-safe: solo
 * serializa el objeto a un <script type="application/ld+json">.
 */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}