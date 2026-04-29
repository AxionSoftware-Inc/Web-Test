import Link from "next/link";

import { subjectTracks } from "@/features/landing/model/landing-content";
import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";

export function SubjectMapSection() {
  return (
    <section id="subjects" className="bg-white">
      <Container className="py-14">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Subject map"
            title="Har bir fan skill graphga ulanadi."
            copy="Savollar alohida turmaydi. Har biri subject, topic, skill va prerequisite bilan bog'lanadi."
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {subjectTracks.map((track) => (
            <article key={track.title} className="rounded-lg border border-black/10 bg-[#f7f7f2] p-5">
              <h3 className="text-xl font-semibold">{track.title}</h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {track.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-black/68"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              {track.href ? (
                <Link
                  href={track.href}
                  className="mt-5 inline-block rounded-md bg-[#151713] px-4 py-2 text-sm font-semibold text-white"
                >
                  Open module
                </Link>
              ) : (
                <span className="mt-5 inline-block rounded-md border border-black/10 px-4 py-2 text-sm text-black/45">
                  Coming soon
                </span>
              )}
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
