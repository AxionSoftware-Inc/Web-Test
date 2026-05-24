type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  copy?: string;
  light?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  copy,
  light = false,
}: SectionHeadingProps) {
  return (
    <div>
      <p
        className={`text-sm font-semibold uppercase tracking-[0.16em] ${
          light ? "text-accent" : "text-brand"
        }`}
      >
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
      {copy ? (
        <p className={`mt-4 max-w-xl text-sm leading-6 ${light ? "text-white/62" : "text-black/60"}`}>
          {copy}
        </p>
      ) : null}
    </div>
  );
}
