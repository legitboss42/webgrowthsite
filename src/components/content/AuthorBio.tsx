import Image from "next/image";
import Link from "next/link";
import type { AuthorProfile } from "@/lib/authors";

type AuthorBioProps = {
  author: AuthorProfile;
};

export default function AuthorBio({ author }: AuthorBioProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/85">Author</p>
      <div className="mt-4 flex items-start gap-4">
        {author.image ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/10">
            <Image src={author.image} alt={author.name} fill className="object-cover" sizes="64px" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-white">{author.name}</p>
          <p className="text-sm text-emerald-200/90">{author.role}</p>
          <p className="mt-3 text-sm leading-7 text-white/74">{author.bio}</p>
          {author.expertise.length ? (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {author.expertise.map((item) => (
                <li key={item} className="flex gap-2 text-xs text-white/68">
                  <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <Link
            href="/editorial-policy/"
            className="mt-4 inline-flex text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
          >
            Read our editorial and review standards
          </Link>
        </div>
      </div>
    </section>
  );
}
