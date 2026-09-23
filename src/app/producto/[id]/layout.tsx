// Layout anidado de producto — dark unificado (design D2, spec premium-design:
// "the detail page MUST stop being an isolated light-mode wrapper").
// El wrapper hereda el noir del layout raíz; sin theme switch.
export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-background min-h-screen">{children}</div>;
}