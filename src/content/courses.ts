import "server-only";

import {
  COURSE_BADGES,
  type Course,
  type CourseSlide,
  type CourseSlug,
  type SlideKind,
} from "@/lib/course-types";

// Paid course material. Import only from server code so it never ships in a
// public bundle; learners receive it through /api/courses/[slug] after an
// access check.

const slide = (
  kind: SlideKind,
  title: string,
  description: string,
  points: string[]
): CourseSlide => ({ kind, title, description, points });

export const courses: Course[] = [
  {
    slug: "beginner",
    programName: "Digital Journey Begins",
    title: "Beginner Students & Freshers",
    tag: "6-Month Curriculum",
    description:
      "From zero to job-ready — digital skills, business foundations and AI fundamentals with hands-on mentorship.",
    accent: COURSE_BADGES.beginner.accent,
    priceLabel: COURSE_BADGES.beginner.price,
    modules: [
      {
        key: "market-mapping",
        title: "Market Mapping",
        summary:
          "Understand who buys, what they need and where the opportunity sits before you build anything.",
        slides: [
          slide(
            "overview",
            "Why Market Mapping Comes First",
            "Most new businesses fail because they build for a market that does not exist. Market mapping replaces guesswork with a clear picture of customers, demand and gaps.",
            [
              "Define the problem you want to solve",
              "Identify who feels that problem most",
              "Estimate how many people share it",
              "Spot where current solutions fall short",
            ]
          ),
          slide(
            "concept",
            "TAM, SAM & SOM in Plain Language",
            "Market size tells you whether an idea can grow into a business. Break it into three layers so the numbers stay realistic.",
            [
              "TAM — everyone who could ever need the product",
              "SAM — the slice you can reach with your channels",
              "SOM — the share you can realistically win in 12–18 months",
              "Estimate each layer with Google Trends and industry reports",
            ]
          ),
          slide(
            "framework",
            "Customer Segments & Personas",
            "Group customers by shared needs, not just demographics, then turn each group into a persona your whole team can picture.",
            [
              "Segment by need, behaviour, budget and location",
              "One persona per segment: goals, frustrations, buying triggers",
              "Map where each persona spends time online",
              "Prioritise the most urgent pain with the ability to pay",
            ]
          ),
          slide(
            "practice",
            "Lab: Build Your First Market Map",
            "Pick a local business idea and map its market on a single page using free tools. Bring the map to your mentor review session.",
            [
              "Pull search demand from Google Trends and Keyword Planner",
              "Interview 5 potential customers with 6 open questions",
              "Plot segments on a 2×2 of urgency vs. ability to pay",
              "Present your map for mentor feedback",
            ]
          ),
          slide(
            "recap",
            "Recap & Deliverable",
            "You now have a repeatable way to size a market and choose who to serve first. Submit your deliverable before moving on.",
            [
              "One-page market map with TAM / SAM / SOM",
              "Two validated customer personas",
              "Top 3 unmet needs backed by interview quotes",
              "Next: decoding what competitors already offer",
            ]
          ),
        ],
      },
      {
        key: "competitor-decoding",
        title: "Competitor Decoding",
        summary:
          "Study competitors systematically to find the positioning gap you can own.",
        slides: [
          slide(
            "overview",
            "Competitors Are Your Free Research Team",
            "Competitors have already tested prices, messages and channels. Decoding them shows what works and where customers are still unhappy.",
            [
              "Direct, indirect and substitute competitors",
              "What to learn: offer, price, channel, message",
              "Where to look: websites, ad libraries, reviews, social pages",
              "Goal: find a gap, not copy a playbook",
            ]
          ),
          slide(
            "concept",
            "Reading a Competitor's Digital Footprint",
            "Every brand leaves public signals online. Learn to read them in under an hour per competitor.",
            [
              "Website structure, offers and calls to action",
              "Meta Ad Library and Google Ads Transparency Center",
              "Social content frequency, formats and engagement",
              "Customer reviews on Google, Justdial and Amazon",
            ]
          ),
          slide(
            "framework",
            "The Competitor Decoding Matrix",
            "Score each competitor on the same criteria so patterns and gaps become obvious at a glance.",
            [
              "Rows: your 5 most relevant competitors",
              "Columns: price, quality, speed, experience, trust",
              "Mark strengths green and weaknesses red",
              "A column that is weak for everyone is your opportunity",
            ]
          ),
          slide(
            "practice",
            "Lab: Review Mining",
            "Customer complaints are the fastest route to a winning position. Collect them, cluster them and turn the biggest one into your promise.",
            [
              "Collect 30 low-star reviews across 3 competitors",
              "Tag each by theme: price, delay, support, quality",
              "Count the themes and rank them by frequency",
              "Write one sentence promising to fix the top complaint",
            ]
          ),
          slide(
            "recap",
            "Recap & Deliverable",
            "You can now decode any competitor in a structured way and back your positioning with real customer evidence.",
            [
              "Completed competitor decoding matrix",
              "Top 3 customer complaints in your market",
              "Draft positioning statement",
              "Next: building a brand people remember",
            ]
          ),
        ],
      },
      {
        key: "brand-dna-creation",
        title: "Brand DNA Creation",
        summary:
          "Define the purpose, personality and visual identity that make your brand recognisable and trusted.",
        slides: [
          slide(
            "overview",
            "What Brand DNA Really Means",
            "A brand is the feeling people get when they hear your name. Brand DNA is the set of decisions that keep that feeling consistent everywhere.",
            [
              "Purpose — why the business exists",
              "Promise — what customers can always expect",
              "Personality — how the brand speaks and behaves",
              "Proof — the evidence behind every claim",
            ]
          ),
          slide(
            "concept",
            "Positioning & Value Proposition",
            "Positioning decides the space you own in a customer's mind. The value proposition explains that space in one clear sentence.",
            [
              "For [customer] who [need], we are the [category] that [benefit]",
              "Lead with outcomes, not features",
              "Clarity test: can a stranger repeat it after one read?",
              "Align it with the gap from Competitor Decoding",
            ]
          ),
          slide(
            "framework",
            "Voice, Visuals & the Brand Kit",
            "Consistency builds trust. A simple brand kit keeps every post, page and pitch looking and sounding like you.",
            [
              "Voice: 3 adjectives and a do / don't word list",
              "Colours: 1 primary, 1 accent, 2 neutrals",
              "Typography: one heading font, one body font",
              "Logo usage, spacing and image style rules",
            ]
          ),
          slide(
            "practice",
            "Lab: Design Your Brand Kit with AI",
            "Use free design and AI tools to produce a starter brand kit in a single session.",
            [
              "Generate name and tagline options with ChatGPT",
              "Build logo concepts and a palette in Canva",
              "Create 3 social post templates using the kit",
              "Present the kit for peer and mentor feedback",
            ]
          ),
          slide(
            "recap",
            "Recap & Deliverable",
            "Your brand now has a clear position and a consistent look and voice that you can apply across every channel.",
            [
              "Brand kit PDF: voice, colours, fonts, logo",
              "Positioning statement and value proposition",
              "3 on-brand social media templates",
              "Next: turning the brand into a growth plan",
            ]
          ),
        ],
      },
      {
        key: "growth-strategy-lab",
        title: "Growth Strategy Lab",
        summary:
          "Choose the channels, content and funnel that will bring your first customers consistently.",
        slides: [
          slide(
            "overview",
            "From Brand to Customers",
            "Growth is a system, not a lucky post. This module connects your audience, channels and offer into one repeatable plan.",
            [
              "Awareness → Interest → Decision → Action",
              "Master 1–2 channels before adding more",
              "Organic vs. paid growth trade-offs",
              "Setting realistic 90-day growth goals",
            ]
          ),
          slide(
            "concept",
            "Digital Marketing Channels 101",
            "Each channel suits a different goal and budget. Match channels to where your persona already spends time.",
            [
              "Instagram & YouTube for discovery and trust",
              "Google Search & Maps for high-intent local demand",
              "WhatsApp & email for follow-up and repeat sales",
              "LinkedIn for B2B and career building",
            ]
          ),
          slide(
            "framework",
            "The Simple Funnel Blueprint",
            "A funnel turns strangers into buyers step by step. Keep it simple enough to run with a phone and a free CRM.",
            [
              "Top: short-form content and reels",
              "Middle: a lead magnet — checklist, free session or demo",
              "Bottom: offer page with clear pricing and WhatsApp CTA",
              "Retention: onboarding, review request, referral",
            ]
          ),
          slide(
            "practice",
            "Lab: 30-Day Content & Growth Calendar",
            "Plan a month of content and outreach tied to your funnel, then track the results every week.",
            [
              "Write 12 post ideas in hook → value → CTA format",
              "Schedule posts with Meta Business Suite",
              "Set up a lead form and a Google Sheet tracker",
              "Review reach, leads and conversions every Friday",
            ]
          ),
          slide(
            "recap",
            "Recap & Deliverable",
            "You have a focused growth plan with a working funnel and a calendar you can execute from day one.",
            [
              "90-day growth plan built on 2 core channels",
              "Funnel diagram from first touch to repeat purchase",
              "30-day content calendar",
              "Next: planning revenue and pricing",
            ]
          ),
        ],
      },
      {
        key: "revenue-planning-system",
        title: "Revenue Planning System",
        summary:
          "Price your offer, forecast revenue and track the numbers that keep a business healthy.",
        slides: [
          slide(
            "overview",
            "Numbers Every Founder Must Know",
            "A business that cannot read its numbers cannot grow. This module makes finance simple and practical.",
            [
              "Revenue, costs and profit",
              "Fixed vs. variable costs",
              "The break-even point",
              "Cash flow vs. profit",
            ]
          ),
          slide(
            "concept",
            "Pricing Strategies That Work",
            "Price shapes perception as much as profit. Learn the main pricing methods and when to use each one.",
            [
              "Cost-plus pricing for predictable margins",
              "Value-based pricing tied to customer outcomes",
              "Tiered packages: basic, standard, premium",
              "Anchoring and bundling to raise order value",
            ]
          ),
          slide(
            "framework",
            "Unit Economics: CAC, LTV & Margin",
            "Unit economics show whether each customer makes or loses money, and decide how much you can spend on growth.",
            [
              "CAC = marketing spend ÷ new customers",
              "LTV = average order × purchases × gross margin",
              "Rule of thumb: LTV should be at least 3× CAC",
              "Payback period: months to recover CAC",
            ]
          ),
          slide(
            "practice",
            "Lab: Build a 12-Month Revenue Model",
            "Turn your growth plan into a spreadsheet forecast you can update every month.",
            [
              "Start from monthly leads and conversion rate",
              "Add pricing tiers and the expected sales mix",
              "Subtract fixed and variable costs to find profit",
              "Compare best, expected and worst-case scenarios",
            ]
          ),
          slide(
            "recap",
            "Recap & Capstone Handoff",
            "All five modules now come together. Your capstone is a complete digital business model reviewed by a mentor.",
            [
              "12-month revenue model in Google Sheets",
              "Pricing page draft with 3 tiers",
              "Break-even and CAC / LTV targets",
              "Capstone: present your digital business model",
            ]
          ),
        ],
      },
    ],
  },
  {
    slug: "professional",
    programName: "One Step to Business",
    title: "Professional Business Owner",
    tag: "For Founders & Owners",
    description:
      "Scale with AI-driven tools, digital marketing mastery and real-world consulting projects.",
    accent: COURSE_BADGES.professional.accent,
    priceLabel: COURSE_BADGES.professional.price,
    modules: [
      {
        key: "content-machine",
        title: "Content Machine",
        summary:
          "Build a content engine that produces consistent, on-brand content across channels with AI support.",
        slides: [
          slide(
            "overview",
            "Content as a Growth Asset",
            "For an established business, content compounds: every useful piece keeps attracting and educating buyers. The goal is a machine, not random posting.",
            [
              "Content pillars aligned to buyer questions",
              "Hero, hub and hygiene content mix",
              "Own your audience: email and WhatsApp lists",
              "Measure content by pipeline, not likes",
            ]
          ),
          slide(
            "concept",
            "Pillars Mapped to the Buyer Journey",
            "Map every content pillar to a stage of the buyer journey so each piece has a clear job.",
            [
              "Awareness: industry insights and myths busted",
              "Consideration: comparisons, case studies, demos",
              "Decision: testimonials, pricing explainers, guarantees",
              "Post-purchase: tutorials and community stories",
            ]
          ),
          slide(
            "framework",
            "Create Once, Publish Everywhere",
            "One long-form asset can fuel a week of content across platforms when you repurpose it deliberately.",
            [
              "Record one 20-minute expert video or podcast weekly",
              "Use AI to draft a blog, newsletter and captions from it",
              "Cut 5–8 short clips for Reels, Shorts and LinkedIn",
              "Approve and schedule everything from one calendar",
            ]
          ),
          slide(
            "practice",
            "Lab: Set Up Your AI Content Workflow",
            "Assemble a working content pipeline for your business using AI and automation tools.",
            [
              "Build brand-voice prompt templates in ChatGPT or Claude",
              "Create a Notion or Trello board with content stages",
              "Connect scheduling via Buffer or Meta Business Suite",
              "Produce and schedule one full week of content",
            ]
          ),
          slide(
            "recap",
            "Recap & Deliverable",
            "Your business now has a documented content engine that the team can run every week without starting from scratch.",
            [
              "Content pillar map and 90-day calendar",
              "Reusable AI prompt library in your brand voice",
              "Documented workflow with owners and deadlines",
              "Next: getting found on search with SEO",
            ]
          ),
        ],
      },
      {
        key: "seo-domination",
        title: "SEO Domination",
        summary:
          "Rank for the searches your buyers make, from local Google Maps results to high-intent keywords.",
        slides: [
          slide(
            "overview",
            "SEO: Your Cheapest Salesperson",
            "Search traffic arrives with intent. Ranking well turns Google into a 24/7 source of qualified leads without paying per click.",
            [
              "How search engines crawl, index and rank",
              "On-page, off-page and technical SEO",
              "Local SEO for location-based businesses",
              "Realistic timelines: 3–6 months",
            ]
          ),
          slide(
            "concept",
            "Keyword Research & Search Intent",
            "The right keywords match what buyers type when they are ready to act. Intent matters more than volume.",
            [
              "Informational, commercial, transactional, navigational",
              "Tools: Keyword Planner, Search Console, Ubersuggest",
              "Target long-tail keywords with buying intent",
              "Group keywords into topic clusters",
            ]
          ),
          slide(
            "framework",
            "On-Page & Technical SEO Checklist",
            "A strong page structure helps Google understand and trust your site, and helps visitors convert.",
            [
              "Title tags, meta descriptions and H1–H3 hierarchy",
              "Fast, mobile-friendly, HTTPS pages",
              "Internal links, schema markup and XML sitemaps",
              "Google Business Profile with reviews and photos",
            ]
          ),
          slide(
            "practice",
            "Lab: SEO Audit of Your Website",
            "Audit your own site, fix the quick wins and publish one cluster-optimised page.",
            [
              "Run PageSpeed Insights and Search Console checks",
              "List your top 10 pages and their target keywords",
              "Fix titles, headings and broken links",
              "Publish one pillar page and track rankings weekly",
            ]
          ),
          slide(
            "recap",
            "Recap & Deliverable",
            "You have a prioritised SEO roadmap and the first improvements already live on your site.",
            [
              "SEO audit report with prioritised fixes",
              "Keyword cluster map for your services",
              "Optimised Google Business Profile",
              "Next: accelerating results with paid ads",
            ]
          ),
        ],
      },
      {
        key: "performance-marketing-lab",
        title: "Performance Marketing Lab",
        summary:
          "Run profitable Google and Meta ad campaigns with clear targeting, creatives and budgets.",
        slides: [
          slide(
            "overview",
            "Paid Growth with Predictable Returns",
            "Performance marketing buys attention and measures every rupee. Done right, it scales what already works.",
            [
              "Search ads (SEM) vs. social ads",
              "Setting ROAS and cost-per-lead targets",
              "Budget allocation: test first, then scale",
              "Tracking with pixels, Conversions API and UTMs",
            ]
          ),
          slide(
            "concept",
            "Google Ads & Meta Ads Essentials",
            "Each platform has different strengths. Use search to capture demand and social to create it.",
            [
              "Google: Search, Performance Max, local campaigns",
              "Meta: awareness, leads and sales objectives",
              "Audiences: interests, lookalikes, retargeting",
              "Bidding strategies and the learning phase",
            ]
          ),
          slide(
            "framework",
            "The Creative Testing Framework",
            "Creative drives most ad performance. Test systematically instead of guessing.",
            [
              "Change one variable at a time: hook, visual, offer",
              "3 creatives × 2 audiences per test cycle",
              "Pause losers after meaningful spend",
              "Use AI tools to generate variations quickly",
            ]
          ),
          slide(
            "practice",
            "Lab: Launch a Lead Generation Campaign",
            "Build, launch and optimise a small-budget lead campaign for your own business.",
            [
              "Set up Meta Pixel and conversion events",
              "Create a lead form campaign with 3 ad variations",
              "Run for 7 days at a fixed daily budget",
              "Report CPL, lead quality and next optimisations",
            ]
          ),
          slide(
            "recap",
            "Recap & Deliverable",
            "You have run a measurable campaign end to end and know exactly how to scale the winners.",
            [
              "Live campaign with verified tracking",
              "Creative testing log and results",
              "Budget scaling plan based on CPL targets",
              "Next: making decisions with data",
            ]
          ),
        ],
      },
      {
        key: "data-intelligence",
        title: "Data Intelligence",
        summary:
          "Turn marketing and sales data into dashboards and AI-powered insights that guide decisions.",
        slides: [
          slide(
            "overview",
            "Decisions Backed by Data",
            "Growing businesses drown in numbers. Data intelligence means tracking the few metrics that matter and acting on them quickly.",
            [
              "A North Star metric and supporting KPIs",
              "Leading vs. lagging indicators",
              "One source of truth for marketing and sales",
              "A weekly review rhythm for leadership",
            ]
          ),
          slide(
            "concept",
            "Analytics Stack: GA4, CRM & Sheets",
            "Connect website, ads and sales data so the full customer journey is visible in one place.",
            [
              "GA4 events, conversions and attribution",
              "CRM pipeline stages and lead source tracking",
              "Google Sheets or BigQuery as the data hub",
              "Consistent UTM naming conventions",
            ]
          ),
          slide(
            "framework",
            "AI-Powered Customer Insights",
            "AI can surface patterns in customer data that manual analysis misses — with privacy kept at the centre.",
            [
              "Segment customers by value and behaviour (RFM)",
              "Summarise reviews and feedback with AI",
              "Predict churn and upsell opportunities",
              "Collect only consented, necessary data",
            ]
          ),
          slide(
            "practice",
            "Lab: Build a Growth Dashboard",
            "Create a live dashboard your team can read in two minutes every Monday.",
            [
              "Connect GA4, ads and CRM data in Looker Studio",
              "Visualise funnel conversion by channel",
              "Add CAC, LTV and revenue trend charts",
              "Write three decisions the dashboard suggests",
            ]
          ),
          slide(
            "recap",
            "Recap & Deliverable",
            "Your team now makes weekly decisions from a shared dashboard instead of gut feeling.",
            [
              "Live Looker Studio growth dashboard",
              "KPI definitions document",
              "AI insight report on customer feedback",
              "Next: scaling with the Growth Accelerator",
            ]
          ),
        ],
      },
      {
        key: "growth-accelerator",
        title: "Growth Accelerator",
        summary:
          "Scale operations, team and funding with systems, leadership and live consulting projects.",
        slides: [
          slide(
            "overview",
            "Scaling Without Breaking",
            "Scaling multiplies both strengths and weaknesses. This module prepares your business, team and finances for sustainable growth.",
            [
              "Signs you are ready to scale",
              "Systems before headcount",
              "Unit economics that survive scale",
              "Leadership shifts from doing to directing",
            ]
          ),
          slide(
            "concept",
            "Customer Acquisition & Funding Options",
            "Choose growth fuel that fits your stage: reinvested profit, partnerships, loans or investors.",
            [
              "Referral, partnership and channel-led acquisition",
              "Bootstrapping vs. debt vs. equity",
              "Government support: Startup India, MSME schemes",
              "What investors look for in a pitch",
            ]
          ),
          slide(
            "framework",
            "Automation & Team Playbooks",
            "Document and automate repeatable work so the team can grow without chaos.",
            [
              "SOPs for sales, delivery and support",
              "Automations with Zapier, Make or WhatsApp Business API",
              "Hiring scorecards and onboarding checklists",
              "AI-assisted decision-making with guardrails",
            ]
          ),
          slide(
            "practice",
            "Lab: Live Consulting Case Study",
            "Work on a real business scenario with mentors and present a scaling plan to a panel.",
            [
              "Diagnose growth bottlenecks from provided data",
              "Propose channel, operations and team changes",
              "Build a 6-month scaling roadmap with milestones",
              "Present to the mentor panel for feedback",
            ]
          ),
          slide(
            "recap",
            "Recap & Program Completion",
            "You leave with a scaling roadmap, automated operations and an investor-ready summary of your business.",
            [
              "6-month scaling roadmap",
              "Automation map of your top 5 processes",
              "Investor-ready one-page business summary",
              "Graduation: present to the WEAZ Tech mentor panel",
            ]
          ),
        ],
      },
    ],
  },
  {
    slug: "ai-hero",
    programName: "AI Hero",
    title: "AI Hero",
    tag: "3-Month Intensive",
    description:
      "Build. Automate. Scale. Cutting-edge AI skills, tools and real-world project experience.",
    accent: COURSE_BADGES["ai-hero"].accent,
    priceLabel: COURSE_BADGES["ai-hero"].price,
    modules: [
      {
        key: "digital-asset-building",
        title: "Digital Asset Building",
        summary:
          "Learn AI foundations and build digital assets — products, data and content — that keep creating value.",
        slides: [
          slide(
            "overview",
            "AI Foundations for Builders",
            "Before building, understand what modern AI can and cannot do. This slide covers the core ideas behind today's AI products.",
            [
              "Machine learning: learning patterns from data",
              "NLP: understanding and generating language",
              "Computer vision: recognising images and video",
              "Large language models and how prompts steer them",
            ]
          ),
          slide(
            "concept",
            "What Is a Digital Asset?",
            "A digital asset keeps producing value after it is built — software, datasets, templates, courses or audiences.",
            [
              "AI-powered micro-SaaS tools and chatbots",
              "Proprietary datasets and knowledge bases",
              "Content libraries and digital products",
              "Communities and email lists as distribution",
            ]
          ),
          slide(
            "framework",
            "From Idea to AI Product",
            "Use a lean product process to go from a real problem to a working AI prototype quickly.",
            [
              "Problem → user → workflow → AI step",
              "Choose a build path: no-code, API or custom model",
              "Define success metrics before building",
              "Ship an MVP in 2 weeks, then iterate",
            ]
          ),
          slide(
            "practice",
            "Lab: Data Strategy & First Prototype",
            "Collect, clean and use a small dataset to power a working AI assistant for a real use case.",
            [
              "Gather domain documents or FAQs into a dataset",
              "Remove duplicates, fix formats, tag sources",
              "Build a retrieval-based assistant via no-code or API",
              "Test with 20 real questions and log the failures",
            ]
          ),
          slide(
            "recap",
            "Recap & Deliverable",
            "You understand the AI building blocks and have shipped your first data-backed prototype.",
            [
              "Working AI prototype with a cleaned dataset",
              "Product one-pager: problem, user, metrics",
              "Data quality checklist",
              "Next: building your AI productivity stack",
            ]
          ),
        ],
      },
      {
        key: "ai-productivity-stack",
        title: "AI Productivity Stack",
        summary:
          "Master the AI tools and automations that multiply your output across research, creation and operations.",
        slides: [
          slide(
            "overview",
            "Working at 10× with AI",
            "AI productivity is about redesigning workflows, not just opening a chatbot. This module builds your personal and team AI stack.",
            [
              "Map tasks: research, writing, design, analysis, ops",
              "Separate repetitive, rules-based and creative work",
              "Pick the right AI tool per task category",
              "Measure time saved per workflow",
            ]
          ),
          slide(
            "concept",
            "Prompt Engineering Essentials",
            "Clear prompts produce reliable outputs. Learn patterns that work across ChatGPT, Claude and Gemini.",
            [
              "Role, context, task, format and constraints",
              "Few-shot examples for consistent style",
              "Chain steps: outline → draft → critique → refine",
              "Save and version your best prompts",
            ]
          ),
          slide(
            "framework",
            "The AI Automation Stack",
            "Connect AI models to everyday apps so work happens without copy-paste.",
            [
              "Automation platforms: Zapier, Make, n8n",
              "AI agents that read email, sheets and forms",
              "Document and meeting summarisation pipelines",
              "Human-in-the-loop review for important outputs",
            ]
          ),
          slide(
            "practice",
            "Lab: Automate a Real Workflow",
            "Pick a weekly task that takes over an hour and automate most of it with AI.",
            [
              "Document the current steps and time taken",
              "Build triggers, AI steps and outputs",
              "Add error handling and a manual approval step",
              "Demo the time saved to your cohort",
            ]
          ),
          slide(
            "recap",
            "Recap & Deliverable",
            "Your AI stack is documented, your prompts are reusable and one real workflow now runs on autopilot.",
            [
              "Personal AI stack map and prompt library",
              "One production-ready automation",
              "Ethics check: bias, privacy and accuracy review",
              "Next: scaling reach with the Social Growth Framework",
            ]
          ),
        ],
      },
      {
        key: "social-growth-framework",
        title: "Social Growth Framework",
        summary:
          "Grow an audience and launch your AI solution responsibly with a repeatable social and leadership framework.",
        slides: [
          slide(
            "overview",
            "Build in Public, Grow in Public",
            "Distribution decides whether great AI products succeed. Sharing your journey builds trust, audience and early users together.",
            [
              "Personal brand vs. product brand",
              "Choosing platforms: LinkedIn, X, YouTube, Instagram",
              "Consistency beats virality",
              "Turning followers into beta users",
            ]
          ),
          slide(
            "concept",
            "AI-Assisted Content & Community",
            "Use AI to research, draft and repurpose content while keeping your own voice and insights at the centre.",
            [
              "Weekly insight posts from your build log",
              "AI-generated drafts with human editing",
              "Short demo videos of your product in action",
              "Community spaces: WhatsApp, Discord, LinkedIn groups",
            ]
          ),
          slide(
            "framework",
            "AI Ethics & Responsible Leadership",
            "Trust is a growth strategy. Responsible AI practices protect users, your brand and your long-term reputation.",
            [
              "Transparency: disclose where AI is used",
              "Fairness: test for bias across user groups",
              "Privacy: minimum data with clear consent",
              "Governance: document decisions, risks and owners",
            ]
          ),
          slide(
            "practice",
            "Lab: Launch Plan for Your Capstone",
            "Prepare the go-to-market plan for the AI solution you will deliver in your capstone project.",
            [
              "Define the launch audience and positioning",
              "Create a 4-week content and outreach calendar",
              "Set up a waitlist page with analytics",
              "Plan feedback loops with your first 50 users",
            ]
          ),
          slide(
            "recap",
            "Recap & Capstone Delivery",
            "Everything comes together in your capstone: a fully functional AI solution, launched responsibly to real users.",
            [
              "Launch plan and first 4 weeks of content",
              "Responsible AI checklist for your product",
              "Capstone: a fully functional AI solution with live demo",
              "Graduation: present outcomes and roadmap to mentors",
            ]
          ),
        ],
      },
    ],
  },
];

export function getCourse(slug: CourseSlug) {
  return courses.find((course) => course.slug === slug) ?? null;
}
