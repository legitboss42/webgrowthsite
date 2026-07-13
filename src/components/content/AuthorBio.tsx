import Image from "next/image";
import Link from "next/link";
import type { AuthorProfile } from "@/lib/authors";

type AuthorBioProps = {
  author: AuthorProfile;
};

export default function AuthorBio({ author }: AuthorBioProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="text-xs uppercase tracking-[0.18em] text-blue-700">Author</p>
      <div className="mt-4 flex items-start gap-4">
        {author.image ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200">
            <Image src={author.image} alt={author.name} fill className="object-cover" sizes="64px" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {author.profileUrl ? (
            <Link
              href={author.profileUrl}
              className="text-lg font-semibold text-slate-950 transition hover:text-blue-700"
            >
              {author.name}
            </Link>
          ) : (
            <p className="text-lg font-semibold text-slate-950">{author.name}</p>
          )}
          <p className="text-sm text-blue-700">{author.role}</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">{author.bio}</p>
          {author.expertise.length ? (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {author.expertise.map((item) => (
                <li key={item} className="flex gap-2 text-xs text-slate-500">
                  <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-blue-500/80" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {author.profileUrl ? (
              <Link
                href={author.profileUrl}
                className="inline-flex text-sm font-medium text-blue-700 transition hover:text-blue-800"
              >
                View founder profile
              </Link>
            ) : null}
            <Link
              href="/editorial-policy/"
              className="inline-flex text-sm font-medium text-blue-700 transition hover:text-blue-800"
            >
              Read our editorial and review standards
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
