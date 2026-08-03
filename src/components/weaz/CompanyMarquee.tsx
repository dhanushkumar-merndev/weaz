"use client";
/* Local partner logos can be added to the data list when supplied. */
/* eslint-disable @next/next/no-img-element */

interface Company {
  name: string;
  logo?: string;
}

const companies: Company[] = [
  { name: "Google", logo: "/logos/google.svg" },
  { name: "Microsoft", logo: "/logos/microsoft.svg" },
  { name: "Amazon", logo: "/logos/amazon.svg" },
  { name: "Meta", logo: "/logos/meta.svg" },
  { name: "OpenAI", logo: "/logos/openai.svg" },
  { name: "NVIDIA", logo: "/logos/nvidia.svg" },
  { name: "Adobe", logo: "/logos/adobe.svg" },
  { name: "Salesforce", logo: "/logos/salesforce.svg" },
];

function CompanyItem({ company }: { company: Company }) {
  return (
    <div className="group mx-2 inline-flex h-14 min-w-44 shrink-0 items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-center shadow-md shadow-black/25 transition hover:border-[#9B59D0]/35 hover:bg-[#9B59D0]/7 sm:mx-3 sm:h-20 sm:min-w-60 sm:gap-4 sm:rounded-2xl sm:px-7">
      {company.logo ? (
        <>
          <img
            src={company.logo}
            alt=""
            aria-hidden="true"
            className="h-7 w-8 object-contain opacity-75 brightness-0 invert transition group-hover:opacity-100 sm:h-9 sm:w-10"
            loading="lazy"
            decoding="async"
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-white/60 sm:text-sm sm:tracking-[0.16em]">
            {company.name}
          </span>
        </>
      ) : (
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">
          {company.name}
        </span>
      )}
    </div>
  );
}

export function CompanyMarquee() {
  return (
    <section
      aria-label="Leading technology companies"
      className="relative z-10 overflow-hidden border-y border-white/[0.06] bg-[#0F0B14] py-5 sm:py-10 lg:py-7"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#0F0B14] to-transparent sm:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#0F0B14] to-transparent sm:w-40" />

      <div className="company-marquee-track flex w-max items-center">
        <div className="flex shrink-0 items-center">
          {companies.map((company) => (
            <CompanyItem key={company.name} company={company} />
          ))}
        </div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {companies.map((company) => (
            <CompanyItem key={`copy-${company.name}`} company={company} />
          ))}
        </div>
      </div>
    </section>
  );
}
