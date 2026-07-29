import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { BlogShell } from "@/components/weaz/BlogShell";
import { blogPosts } from "@/content/blogs";

export const metadata: Metadata = {
  title: "AI & Digital Entrepreneurship Blog",
  description:
    "Practical guides from WEAZ TECH on AI skills, digital entrepreneurship, marketing, automation and building an online business in India.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "WEAZ TECH Blog | AI & Digital Entrepreneurship",
    description:
      "Practical, people-first guides for students, founders and business owners building in the AI-first economy.",
    url: "/blog",
    type: "website",
  },
};

export default function BlogPage() {
  const [featured, ...posts] = blogPosts;

  return (
    <BlogShell>
      <section className="px-6 pb-16 pt-32 md:pb-20 md:pt-40">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#9B59D0]/25 bg-[#9B59D0]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#C990F2]">
              <BookOpen size={14} />
              WEAZ TECH Insights
            </div>
            <h1 className="font-display text-5xl font-black tracking-tight text-white sm:text-6xl md:text-7xl">
              Build practical skills for an{" "}
              <span className="text-[#FBBF24]">AI-first economy.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/55">
              Clear, useful guides for students, founders and business owners
              learning to build, market and grow with technology.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <article className="group grid overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#15111D]/70 lg:grid-cols-[1.08fr_0.92fr]">
            <Link
              href={`/blog/${featured.slug}`}
              className="relative min-h-72 overflow-hidden lg:min-h-[460px]"
              aria-label={`Read ${featured.title}`}
            >
              <Image
                src={featured.image}
                alt={featured.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover transition duration-700 group-hover:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#15111D] via-transparent to-transparent lg:bg-gradient-to-r" />
            </Link>
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#FBBF24]">
                Featured · {featured.category}
              </div>
              <h2 className="font-display mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
                <Link
                  href={`/blog/${featured.slug}`}
                  className="transition hover:text-[#FBBF24]"
                >
                  {featured.title}
                </Link>
              </h2>
              <p className="mt-5 text-sm leading-7 text-white/55 sm:text-base">
                {featured.excerpt}
              </p>
              <div className="mt-6 flex items-center gap-4 text-xs text-white/35">
                <time dateTime={featured.publishedAt}>
                  {new Date(featured.publishedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} />
                  {featured.readingTime}
                </span>
              </div>
              <Link
                href={`/blog/${featured.slug}`}
                className="mt-8 inline-flex w-fit items-center gap-2 font-bold text-[#FBBF24] transition hover:gap-3"
              >
                Read the guide <ArrowRight size={17} />
              </Link>
            </div>
          </article>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group overflow-hidden rounded-3xl border border-white/[0.07] bg-[#15111D]/55 transition hover:-translate-y-1 hover:border-[#9B59D0]/30"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="relative block aspect-[16/8.5] overflow-hidden"
                  aria-label={`Read ${post.title}`}
                >
                  <Image
                    src={post.image}
                    alt={post.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#15111D] to-transparent" />
                </Link>
                <div className="p-6 sm:p-8">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C990F2]">
                    {post.category}
                  </div>
                  <h2 className="font-display mt-3 text-2xl font-black leading-tight text-white">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="transition hover:text-[#FBBF24]"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/50">
                    {post.excerpt}
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/35">
                      <Clock size={13} />
                      {post.readingTime}
                    </span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#FBBF24]"
                    >
                      Read <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </BlogShell>
  );
}
