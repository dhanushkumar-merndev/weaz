import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Lightbulb,
} from "lucide-react";
import { BlogShell } from "@/components/weaz/BlogShell";
import { blogPosts, getBlogPost } from "@/content/blogs";
import { SITE_URL } from "@/lib/site-details";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  const canonical = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical },
    authors: [{ name: "WEAZ TECH Editorial Team", url: "/about" }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: canonical,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [`${SITE_URL}/about`],
      images: [
        {
          url: post.image,
          alt: post.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.image],
    },
  };
}

function countWords(post: NonNullable<ReturnType<typeof getBlogPost>>) {
  const text = [
    ...post.intro,
    ...post.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.bullets ?? []),
      section.takeaway ?? "",
    ]),
    ...post.conclusion,
  ].join(" ");
  return text.trim().split(/\s+/).length;
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const currentIndex = blogPosts.findIndex((item) => item.slug === post.slug);
  const related = [
    blogPosts[(currentIndex + 1) % blogPosts.length],
    blogPosts[(currentIndex + 2) % blogPosts.length],
  ];
  const articleUrl = `${SITE_URL}/blog/${post.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: `${SITE_URL}${post.image}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: articleUrl,
    wordCount: countWords(post),
    articleSection: post.category,
    author: {
      "@type": "Organization",
      name: "WEAZ TECH",
      url: `${SITE_URL}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: "WEAZ TECH",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/android-chrome-512x512.png`,
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: articleUrl,
      },
    ],
  };

  return (
    <BlogShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c"),
        }}
      />

      <article className="pb-20 pt-28 md:pt-36">
        <header className="px-6">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/45 transition hover:text-white"
            >
              <ArrowLeft size={16} />
              All articles
            </Link>
            <div className="mt-9 text-xs font-bold uppercase tracking-[0.2em] text-[#FBBF24]">
              {post.category}
            </div>
            <h1 className="font-display mt-4 text-4xl font-black leading-[1.04] tracking-tight text-white sm:text-5xl md:text-7xl">
              {post.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/55 md:text-xl">
              {post.excerpt}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-white/40">
              <span>By WEAZ TECH Editorial Team</span>
              <time
                dateTime={post.publishedAt}
                className="inline-flex items-center gap-1.5"
              >
                <CalendarDays size={14} />
                {new Date(post.publishedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} />
                {post.readingTime}
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto mt-12 max-w-6xl px-6">
          <div className="relative aspect-[16/8.5] overflow-hidden rounded-[2rem] border border-white/[0.08]">
            <Image
              src={post.image}
              alt={post.imageAlt}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1152px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0B14]/60 to-transparent" />
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-6 pt-14">
          <div className="space-y-6 text-[17px] leading-8 text-white/70">
            {post.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-14 space-y-14">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {section.heading}
                </h2>
                <div className="mt-6 space-y-5 text-[17px] leading-8 text-white/65">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets && (
                  <ul className="mt-6 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-3 text-[16px] leading-7 text-white/65"
                      >
                        <CheckCircle2
                          size={18}
                          className="mt-1 shrink-0 text-[#9B59D0]"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.takeaway && (
                  <div className="mt-7 flex items-start gap-3 rounded-2xl border border-[#FBBF24]/15 bg-[#FBBF24]/5 p-5">
                    <Lightbulb
                      size={20}
                      className="mt-0.5 shrink-0 text-[#FBBF24]"
                    />
                    <p className="text-sm leading-7 text-white/65">
                      <strong className="text-[#FBBF24]">Key takeaway: </strong>
                      {section.takeaway}
                    </p>
                  </div>
                )}
              </section>
            ))}
          </div>

          <section className="mt-14 rounded-3xl border border-[#9B59D0]/20 bg-[#9B59D0]/7 p-6 sm:p-8">
            <h2 className="font-display text-3xl font-black text-white">
              Put the ideas into practice
            </h2>
            <div className="mt-5 space-y-4 text-[16px] leading-7 text-white/65">
              {post.conclusion.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/programs"
                className="pill-gold inline-flex items-center justify-center gap-2 px-6 py-3 text-sm"
              >
                Explore WEAZ programs <ArrowRight size={16} />
              </Link>
              <Link
                href="/contact"
                className="pill-ghost inline-flex items-center justify-center px-6 py-3 text-sm"
              >
                Talk to our team
              </Link>
            </div>
          </section>
        </div>
      </article>

      <section className="border-t border-white/[0.06] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-black text-white">
            Continue learning
          </h2>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/blog/${item.slug}`}
                className="group rounded-2xl border border-white/[0.07] bg-[#15111D]/55 p-6 transition hover:border-[#9B59D0]/30"
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C990F2]">
                  {item.category}
                </div>
                <h3 className="font-display mt-3 text-xl font-black text-white transition group-hover:text-[#FBBF24]">
                  {item.title}
                </h3>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#FBBF24]">
                  Read next <ArrowRight size={15} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </BlogShell>
  );
}
