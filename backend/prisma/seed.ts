/**
 * Seed script — populates the database with demo accounts, 10 companies and
 * 36 realistic job postings (plus a few applications).
 *
 * Idempotent: safe to run repeatedly (`npm run seed`). Seeded jobs are
 * replaced; users/companies/tags are upserted.
 *
 * Demo credentials (dev only):
 *   admin@devhire.dev        / Admin123!     (admin panel)
 *   recruiter@nimbuslabs.io  / Company123!   (company dashboard)
 *   candidate@example.com    / Candidate123! (job seeker)
 */
import { PrismaClient, type WorkplaceType, type JobStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

// ---------------------------------------------------------------------------
// Companies (each gets its own recruiter account so the dashboard is demoable)
// ---------------------------------------------------------------------------
const companies = [
  {
    slug: 'nimbuslabs',
    name: 'Nimbus Labs',
    website: 'https://nimbuslabs.io',
    location: 'San Francisco, CA',
    verified: true,
    description:
      'Nimbus Labs builds cloud cost-observability tooling used by 4,000+ engineering teams to understand and optimize their infrastructure spend.',
  },
  {
    slug: 'northwind',
    name: 'Northwind AI',
    website: 'https://northwind.ai',
    location: 'New York, NY',
    verified: true,
    description:
      'Northwind AI helps enterprises deploy, evaluate and monitor large language models in production — safely and at scale.',
  },
  {
    slug: 'pixelforge',
    name: 'PixelForge Studio',
    website: 'https://pixelforge.gg',
    location: 'Austin, TX',
    verified: false,
    description:
      'PixelForge is the independent game studio behind the critically acclaimed crafting saga “Emberfields”. Small team, big worlds.',
  },
  {
    slug: 'orchid',
    name: 'Orchid Fintech',
    website: 'https://orchid.money',
    location: 'London, UK',
    verified: true,
    description:
      'Orchid builds modern treasury and payments infrastructure for fast-growing marketplaces, processing $2B+ annually.',
  },
  {
    slug: 'lumen',
    name: 'Lumen Health',
    website: 'https://lumenhealth.io',
    location: 'Boston, MA',
    verified: true,
    description:
      'Lumen Health connects patients with chronic conditions to continuous remote care, blending clinical expertise with thoughtful software.',
  },
  {
    slug: 'datacurrent',
    name: 'Datacurrent',
    website: 'https://datacurrent.io',
    location: 'Berlin, Germany',
    verified: false,
    description:
      'Datacurrent is an open-source-first data platform: ingestion, transformation and observability in a single developer-friendly stack.',
  },
  {
    slug: 'trailhead',
    name: 'Trailhead Logistics',
    website: 'https://trailheadlogistics.com',
    location: 'Denver, CO',
    verified: true,
    description:
      'Trailhead orchestrates last-mile delivery for 300+ retailers across North America, routing millions of parcels every week.',
  },
  {
    slug: 'copperleaf',
    name: 'Copperleaf Commerce',
    website: 'https://copperleaf.shop',
    location: 'Toronto, Canada',
    verified: true,
    description:
      'Copperleaf powers storefronts, checkout and analytics for 12,000 independent brands. Shopify-scale infrastructure, small-business soul.',
  },
  {
    slug: 'vertex',
    name: 'Vertex Security',
    website: 'https://vertexsec.com',
    location: 'Remote',
    verified: true,
    description:
      'Vertex Security provides attack-surface management and threat intelligence to some of the largest security-conscious companies in the world.',
  },
  {
    slug: 'atlas',
    name: 'Atlas Remote Co',
    website: 'https://atlasremote.com',
    location: 'Remote',
    verified: false,
    description:
      'Atlas is a distributed software agency of 40 people building products for climate-tech startups across four time zones.',
  },
] as const;

// ---------------------------------------------------------------------------
// Job postings
// ---------------------------------------------------------------------------
type SeedJob = {
  company: (typeof companies)[number]['slug'];
  title: string;
  location: string;
  workplace: WorkplaceType;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  daysAgo: number;
  tags: string[];
  status?: JobStatus;
  flagged?: boolean;
  description: string;
};

const jobs: SeedJob[] = [
  {
    company: 'nimbuslabs',
    title: 'Senior Frontend Engineer',
    location: 'San Francisco, CA',
    workplace: 'HYBRID',
    salaryMin: 150_000,
    salaryMax: 190_000,
    daysAgo: 2,
    tags: ['react', 'typescript', 'next.js'],
    description:
      'Own the customer-facing console that 4,000+ engineering teams use to understand their cloud spend every day.\n\nYou will lead our React/Next.js frontend, drive performance and accessibility, and mentor two mid-level engineers. We are looking for 5+ years of experience with modern React, strong TypeScript skills, and a taste for clean, fast UIs. Experience with data-heavy dashboards is a plus.',
  },
  {
    company: 'nimbuslabs',
    title: 'Platform Engineer',
    location: 'Remote (US)',
    workplace: 'REMOTE',
    salaryMin: 140_000,
    salaryMax: 180_000,
    daysAgo: 5,
    tags: ['go', 'kubernetes', 'terraform', 'aws'],
    description:
      'Design the multi-tenant Kubernetes platform that ingests billions of billing records per day.\n\nYou will write Go services, own our Terraform modules, and set the standard for reliability and on-call. We are looking for 4+ years running production Kubernetes at scale, deep AWS knowledge, and a bias toward automation over toil.',
  },
  {
    company: 'nimbuslabs',
    title: 'DevOps Engineer',
    location: 'Austin, TX',
    workplace: 'HYBRID',
    salaryMin: 120_000,
    salaryMax: 150_000,
    daysAgo: 9,
    tags: ['aws', 'terraform', 'docker', 'ci/cd'],
    description:
      'Make deploys boring. You will own CI/CD pipelines, image builds and environment provisioning for 30+ services.\n\nIdeal background: 3+ years in a DevOps or SRE role, fluent with GitHub Actions, Docker and Terraform, and experience introducing cost and security guardrails in AWS.',
  },
  {
    company: 'northwind',
    title: 'Machine Learning Engineer',
    location: 'New York, NY',
    workplace: 'ONSITE',
    salaryMin: 160_000,
    salaryMax: 220_000,
    daysAgo: 1,
    tags: ['python', 'pytorch', 'machine-learning', 'llm'],
    description:
      'Build the evaluation and monitoring models at the core of our LLM observability product.\n\nYou will train and fine-tune models for hallucination detection and quality scoring, ship them behind low-latency APIs, and work closely with research. Requires strong Python/PyTorch skills and production ML experience; prior LLM work strongly preferred.',
  },
  {
    company: 'northwind',
    title: 'AI Product Engineer',
    location: 'Remote (US)',
    workplace: 'REMOTE',
    salaryMin: 140_000,
    salaryMax: 190_000,
    daysAgo: 7,
    tags: ['typescript', 'python', 'react', 'llm'],
    description:
      'Ship AI features end-to-end: prompt design, APIs, and polished React interfaces.\n\nThis is a rare full-stack role on an AI-native product — you will prototype quickly, measure everything, and turn demos into dependable features. Looking for solid TypeScript + React, working Python, and genuine curiosity about LLM behavior.',
  },
  {
    company: 'northwind',
    title: 'Research Engineer, Evals',
    location: 'New York, NY',
    workplace: 'HYBRID',
    salaryMin: 170_000,
    salaryMax: 230_000,
    daysAgo: 12,
    tags: ['python', 'pytorch', 'machine-learning'],
    description:
      'Define how the industry measures LLM quality. You will design benchmarks, build eval pipelines, and publish our methodology.\n\nWe are looking for a strong engineering background with a research mindset — experience at a lab or in applied research is a plus, but shipped production systems matter more than papers.',
  },
  {
    company: 'pixelforge',
    title: 'Gameplay Programmer (C++)',
    location: 'Austin, TX',
    workplace: 'ONSITE',
    salaryMin: 110_000,
    salaryMax: 145_000,
    daysAgo: 3,
    tags: ['c++', 'unreal-engine'],
    description:
      'Craft the feel of our next unannounced title: player movement, combat systems and world interaction in Unreal Engine 5.\n\nYou will collaborate daily with designers and animators. Requirements: 4+ years of C++ in games, shipped at least one title, and comfort profiling and optimizing gameplay code.',
  },
  {
    company: 'pixelforge',
    title: 'Unity Developer',
    location: 'Remote (US)',
    workplace: 'REMOTE',
    salaryMin: 95_000,
    salaryMax: 125_000,
    daysAgo: 10,
    tags: ['unity', 'c#'],
    description:
      'Build and maintain “Emberfields” companion experiences on mobile using Unity.\n\nYou will own feature delivery from prototype to store submission. Looking for 3+ years with Unity and C#, experience with mobile performance constraints, and a portfolio you are proud of.',
  },
  {
    company: 'pixelforge',
    title: 'Technical Artist',
    location: 'Austin, TX',
    workplace: 'HYBRID',
    salaryMin: 90_000,
    salaryMax: 120_000,
    daysAgo: 18,
    tags: ['unity', 'shaders', 'blender'],
    description:
      'Bridge art and engineering: author shaders, build VFX, and keep the asset pipeline fast and predictable.\n\nIdeal profile: strong HLSL/Shader Graph skills, Blender fluency, and enough C# to automate the tedious parts. A portfolio showing stylized rendering is required.',
  },
  {
    company: 'orchid',
    title: 'Senior Backend Engineer (Go)',
    location: 'London, UK',
    workplace: 'HYBRID',
    salaryMin: 90_000,
    salaryMax: 120_000,
    currency: 'GBP',
    daysAgo: 4,
    tags: ['go', 'postgresql', 'kubernetes', 'grpc'],
    description:
      'Design the ledger services that move $2B+ a year with correctness you can prove.\n\nYou will lead the payments-core team, own data-model decisions in PostgreSQL, and set the bar for testing. Expectations: 5+ years backend experience, strong Go, and comfort with event-driven architectures.',
  },
  {
    company: 'orchid',
    title: 'Full-Stack Engineer',
    location: 'London, UK',
    workplace: 'HYBRID',
    salaryMin: 75_000,
    salaryMax: 95_000,
    currency: 'GBP',
    daysAgo: 8,
    tags: ['react', 'typescript', 'node.js', 'graphql'],
    description:
      'Build the dashboard where marketplaces reconcile payouts, refunds and disputes in minutes instead of days.\n\nFull-stack with React + GraphQL on the front and Node.js services behind. 3+ years of product engineering experience and an eye for data-dense UIs.',
  },
  {
    company: 'orchid',
    title: 'Compliance Engineer',
    location: 'Remote (EU)',
    workplace: 'REMOTE',
    salaryMin: 80_000,
    salaryMax: 105_000,
    currency: 'EUR',
    daysAgo: 15,
    tags: ['python', 'aws', 'security'],
    description:
      'Turn regulatory requirements (PSD2, DORA, SOC 2) into automated, audited controls.\n\nYou will build evidence-collection pipelines in Python, partner with our security team on AWS guardrails, and make audits a non-event. Background in fintech or audit automation preferred.',
  },
  {
    company: 'lumen',
    title: 'Senior Mobile Engineer (React Native)',
    location: 'Boston, MA',
    workplace: 'HYBRID',
    salaryMin: 130_000,
    salaryMax: 165_000,
    daysAgo: 2,
    tags: ['react-native', 'typescript', 'ios', 'android'],
    description:
      'Own the patient app used daily by 40,000 people managing chronic conditions — reliability here changes lives.\n\nYou will lead React Native architecture, own releases on both stores, and work hand-in-hand with clinical staff. 5+ years mobile development, deep React Native experience, and HIPAA-friendly habits.',
  },
  {
    company: 'lumen',
    title: 'Backend Engineer (Node.js)',
    location: 'Remote (US)',
    workplace: 'REMOTE',
    salaryMin: 115_000,
    salaryMax: 150_000,
    daysAgo: 6,
    tags: ['node.js', 'typescript', 'postgresql', 'aws'],
    description:
      'Build the care-coordination APIs that schedule nurses, sync devices and surface risk signals.\n\nModern Node.js/TypeScript services on PostgreSQL and AWS, with a strong testing culture. 3+ years building production APIs; healthcare experience welcome but not required.',
  },
  {
    company: 'lumen',
    title: 'Clinical Data Scientist',
    location: 'Boston, MA',
    workplace: 'ONSITE',
    salaryMin: 120_000,
    salaryMax: 155_000,
    daysAgo: 14,
    tags: ['python', 'sql', 'machine-learning', 'healthcare'],
    description:
      'Develop risk models that flag patient deterioration days earlier, directly with our clinical team.\n\nYou will work with de-identified longitudinal data: Python, SQL and pragmatic ML that survives real-world messiness. Experience in healthcare analytics and clear communication with clinicians required.',
  },
  {
    company: 'datacurrent',
    title: 'Data Engineer',
    location: 'Berlin, Germany',
    workplace: 'HYBRID',
    salaryMin: 75_000,
    salaryMax: 95_000,
    currency: 'EUR',
    daysAgo: 5,
    tags: ['python', 'airflow', 'spark', 'dbt'],
    description:
      'Own ingestion and transformation for our cloud data platform and its open-source connectors.\n\nDeep Python, comfort with Airflow orchestration and dbt modeling, and enough Spark to tune the heavy jobs. You will also review community PRs — open-source enthusiasm is part of the job.',
  },
  {
    company: 'datacurrent',
    title: 'Frontend Engineer (Vue)',
    location: 'Berlin, Germany',
    workplace: 'HYBRID',
    salaryMin: 70_000,
    salaryMax: 90_000,
    currency: 'EUR',
    daysAgo: 11,
    tags: ['vue', 'typescript', 'tailwind'],
    description:
      'Build the observability UI where data teams debug pipelines: query plans, lineage graphs and live logs.\n\nStrong Vue 3 + TypeScript, experience rendering complex interactive visuals, and care for performance on large datasets.',
  },
  {
    company: 'datacurrent',
    title: 'Developer Advocate',
    location: 'Remote (EU)',
    workplace: 'REMOTE',
    salaryMin: 80_000,
    salaryMax: 100_000,
    currency: 'EUR',
    daysAgo: 20,
    tags: ['python', 'sql', 'open-source'],
    description:
      'Be the voice of Datacurrent: write docs and deep-dive posts, speak at meetups, and turn user friction into roadmap items.\n\nYou should love explaining technical ideas, know the modern data stack hands-on, and be comfortable in Python and SQL. Code samples or talks required with your application.',
  },
  {
    company: 'trailhead',
    title: 'Senior Software Engineer (Java)',
    location: 'Denver, CO',
    workplace: 'ONSITE',
    salaryMin: 135_000,
    salaryMax: 170_000,
    daysAgo: 3,
    tags: ['java', 'spring', 'kafka', 'postgresql'],
    description:
      'Evolve the routing engine that decides, in milliseconds, which of 2M daily parcels goes on which van.\n\nJava 21 + Spring Boot services, Kafka pipelines and PostgreSQL. 5+ years experience, strong system-design skills, and excitement for optimization problems with real physical constraints.',
  },
  {
    company: 'trailhead',
    title: 'Engineering Manager, Routing',
    location: 'Denver, CO',
    workplace: 'HYBRID',
    salaryMin: 170_000,
    salaryMax: 210_000,
    daysAgo: 16,
    tags: ['java', 'leadership', 'kafka'],
    description:
      'Lead 8 engineers across two squads building our routing and dispatch systems.\n\nYou will coach, unblock, and keep technical quality high while cutting scope smartly. Prior hands-on experience with distributed systems required; prior management experience strongly preferred.',
  },
  {
    company: 'trailhead',
    title: 'Data Analyst',
    location: 'Remote (US)',
    workplace: 'REMOTE',
    salaryMin: 90_000,
    salaryMax: 115_000,
    daysAgo: 9,
    tags: ['sql', 'python', 'looker', 'analytics'],
    description:
      'Answer the questions that steer the business: delivery performance, carrier economics, and where the next warehouse should be.\n\nExpert SQL, solid Python, and experience building Looker (or similar) models that leaders actually use.',
  },
  {
    company: 'copperleaf',
    title: 'Full-Stack Engineer (Next.js)',
    location: 'Toronto, Canada',
    workplace: 'REMOTE',
    salaryMin: 110_000,
    salaryMax: 140_000,
    currency: 'CAD',
    daysAgo: 4,
    tags: ['next.js', 'react', 'typescript', 'postgresql'],
    description:
      'Own storefront experiences for independent brands: server components, edge caching and a component library used by 12,000 shops.\n\nStrong Next.js/React and TypeScript, pragmatic PostgreSQL, and product instincts — you will talk to merchants directly.',
  },
  {
    company: 'copperleaf',
    title: 'Payments Engineer',
    location: 'Toronto, Canada',
    workplace: 'HYBRID',
    salaryMin: 120_000,
    salaryMax: 155_000,
    currency: 'CAD',
    daysAgo: 13,
    tags: ['node.js', 'postgresql', 'graphql'],
    description:
      'Make checkout work flawlessly across currencies, taxes and payment methods.\n\nYou will build idempotent, well-tested Node.js services around Stripe and banking partners, and own reconciliation tooling. Experience with distributed transactions or ledger design is a big plus.',
  },
  {
    company: 'copperleaf',
    title: 'Senior Product Designer',
    location: 'Remote (North America)',
    workplace: 'REMOTE',
    salaryMin: 100_000,
    salaryMax: 130_000,
    currency: 'CAD',
    daysAgo: 7,
    tags: ['figma', 'design-systems', 'ux'],
    description:
      'Lead design for our merchant dashboard: information-dense flows made calm and clear.\n\nYou own projects end-to-end — research, flows, polished UI in Figma, and partnership with engineers on our design system. Portfolio with complex B2B products required.',
  },
  {
    company: 'vertex',
    title: 'Security Engineer, Detection',
    location: 'Remote (US)',
    workplace: 'REMOTE',
    salaryMin: 150_000,
    salaryMax: 195_000,
    daysAgo: 2,
    tags: ['python', 'security', 'kubernetes', 'aws'],
    description:
      'Build detections that catch real intrusions across cloud and Kubernetes estates at Fortune 500 scale.\n\nYou will write detection logic and tooling in Python, model adversary behavior, and tune signal-to-noise relentlessly. Cloud security experience and a red-team-curious mindset required.',
  },
  {
    company: 'vertex',
    title: 'Application Security Engineer',
    location: 'Remote (EU)',
    workplace: 'REMOTE',
    salaryMin: 90_000,
    salaryMax: 125_000,
    currency: 'EUR',
    daysAgo: 10,
    tags: ['security', 'go', 'python'],
    description:
      'Run our AppSec program from the inside: threat modeling, code review automation, and fixing what matters.\n\nStrong secure-coding fundamentals in Go or Python, experience with SAST/DAST tooling, and a track record of shipping fixes — not just filing findings.',
  },
  {
    company: 'vertex',
    title: 'SOC Analyst II',
    location: 'Remote (US)',
    workplace: 'REMOTE',
    salaryMin: 85_000,
    salaryMax: 110_000,
    daysAgo: 21,
    tags: ['security', 'siem', 'incident-response'],
    description:
      'Triage alerts, lead investigations, and help us turn every incident into better detections.\n\n2+ years in a SOC, fluency with a major SIEM, and calm, written-first incident communication. Growth path into detection engineering is well-trodden here.',
  },
  {
    company: 'atlas',
    title: 'Full-Stack Engineer (React + Node)',
    location: 'Remote (Global)',
    workplace: 'REMOTE',
    salaryMin: 100_000,
    salaryMax: 140_000,
    daysAgo: 1,
    tags: ['react', 'node.js', 'typescript', 'postgresql'],
    description:
      'Work directly with climate-tech founders to take products from blank repo to paying users.\n\nYou will own small product slices end-to-end with React, Node.js and PostgreSQL. Autonomy, async communication and pragmatism matter more than any specific stack tenure.',
  },
  {
    company: 'atlas',
    title: 'Founding DevOps Engineer',
    location: 'Remote (Americas)',
    workplace: 'REMOTE',
    salaryMin: 130_000,
    salaryMax: 160_000,
    daysAgo: 6,
    tags: ['aws', 'terraform', 'kubernetes', 'github-actions'],
    description:
      'Define how 12 client products deploy, scale and stay observable — and make it self-service.\n\nTerraform-first AWS infrastructure, Kubernetes fundamentals, and CI/CD patterns developers love. You will be employee #41 and the reason nobody fears shipping on Friday.',
  },
  {
    company: 'atlas',
    title: 'QA Automation Engineer',
    location: 'Remote (Global)',
    workplace: 'REMOTE',
    salaryMin: 80_000,
    salaryMax: 105_000,
    daysAgo: 12,
    tags: ['playwright', 'typescript', 'qa'],
    description:
      'Build the E2E and integration test suites that let 12 products ship daily without fear.\n\nPlaywright + TypeScript expertise, an instinct for the failure modes humans miss, and empathy for developers — your tests should explain failures, not just report them.',
  },
  {
    company: 'nimbuslabs',
    title: 'Junior Support Engineer',
    location: 'San Francisco, CA',
    workplace: 'ONSITE',
    salaryMin: 70_000,
    salaryMax: 90_000,
    daysAgo: 25,
    tags: ['linux', 'sql', 'debugging'],
    description:
      'Great engineers come from support. Troubleshoot customer issues across our stack, write docs, and feed insights back to product.\n\nBasic Linux fluency, honest SQL skills, and clear written communication. Curiosity and follow-through beat years of experience.',
  },
  {
    company: 'datacurrent',
    title: 'Solutions Architect',
    location: 'New York, NY',
    workplace: 'ONSITE',
    salaryMin: 150_000,
    salaryMax: 185_000,
    daysAgo: 8,
    status: 'PENDING_REVIEW',
    tags: ['python', 'sql', 'aws', 'kafka'],
    description:
      'Partner with enterprise customers to design data platforms on Datacurrent, from PoC to production cutover.\n\nDeep hands-on background in data engineering (Python, SQL, Kafka), presentation skills for the C-room, and 30% travel.',
  },
  {
    company: 'lumen',
    title: 'Healthcare Analyst Intern',
    location: 'Boston, MA',
    workplace: 'ONSITE',
    salaryMin: 55_000,
    salaryMax: 65_000,
    daysAgo: 1,
    status: 'PENDING_REVIEW',
    tags: ['sql', 'python'],
    description:
      'Six-month internship supporting our clinical analytics team: dashboards, cohort studies and data quality checks.\n\nCurrently pursuing a degree in a quantitative field; SQL required, Python a plus. Mentorship-heavy, real-impact-fast environment.',
  },
  {
    company: 'orchid',
    title: 'Rust Engineer, Core Ledger',
    location: 'London, UK',
    workplace: 'HYBRID',
    salaryMin: 100_000,
    salaryMax: 130_000,
    currency: 'GBP',
    daysAgo: 2,
    status: 'PENDING_REVIEW',
    tags: ['rust', 'postgresql'],
    description:
      'Join a new team rewriting our high-throughput reconciliation engine in Rust, with formal correctness guarantees.\n\nProduction Rust experience or deep systems background in C++/Go with a strong motivation to switch. You care about types that make invalid states unrepresentable.',
  },
  {
    company: 'pixelforge',
    title: 'Crypto Ninja Rockstar Developer',
    location: 'Remote',
    workplace: 'REMOTE',
    salaryMin: 1,
    salaryMax: 999_999,
    daysAgo: 1,
    status: 'REJECTED',
    tags: ['crypto', 'nft', 'web3'],
    description:
      'JOIN OUR REVOLUTIONARY WEB3 GAME!! MUST HAVE 10+ YEARS RUST AND SOLIDITY, PAY IN TOKENS, 996 SCHEDULE, EQUITY ONLY.\n\nThis posting is intentionally spammy — it exists so the admin panel has something to reject.',
  },
  {
    company: 'copperleaf',
    title: 'Earn $8000/Week From Home!!!',
    location: 'Remote',
    workplace: 'REMOTE',
    salaryMin: 1,
    salaryMax: 999_999,
    daysAgo: 3,
    status: 'HIDDEN',
    flagged: true,
    tags: ['marketing', 'crypto'],
    description:
      'Limited spots!!! Click the link, buy the course, quit your job today. This is definitely a real engineering job.\n\nAnother intentionally spammy posting — seeded as flagged + hidden so the admin moderation UI has a realistic example.',
  },
];

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------
async function main() {
  // -- Accounts -------------------------------------------------------------
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const companyPassword = await bcrypt.hash('Company123!', 10);
  const userPassword = await bcrypt.hash('Candidate123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@devhire.dev' },
    update: {},
    create: {
      email: 'admin@devhire.dev',
      name: 'Ada Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const candidate = await prisma.user.upsert({
    where: { email: 'candidate@example.com' },
    update: {},
    create: {
      email: 'candidate@example.com',
      name: 'Casey Candidate',
      passwordHash: userPassword,
      role: 'USER',
    },
  });

  const companyIds: Record<string, string> = {};
  for (const c of companies) {
    const email = `recruiter@${c.slug}.io`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name: `${c.name} Recruiter`, passwordHash: companyPassword, role: 'COMPANY' },
    });
    const company = await prisma.company.upsert({
      where: { userId: user.id },
      update: { name: c.name, website: c.website, description: c.description, location: c.location, verified: c.verified },
      create: { userId: user.id, name: c.name, website: c.website, description: c.description, location: c.location, verified: c.verified },
    });
    companyIds[c.slug] = company.id;
  }

  // -- Jobs (replace previously seeded ones, keep everything else) ----------
  await prisma.job.deleteMany({
    where: { company: { user: { email: { in: companies.map((c) => `recruiter@${c.slug}.io`) } } } },
  });

  for (const job of jobs) {
    await prisma.job.create({
      data: {
        companyId: companyIds[job.company],
        title: job.title,
        description: job.description,
        location: job.location,
        workplace: job.workplace,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        currency: job.currency ?? 'USD',
        applyUrl: `${companies.find((c) => c.slug === job.company)!.website}/careers/${job.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')}`,
        status: job.status ?? 'APPROVED',
        flagged: job.flagged ?? false,
        createdAt: daysAgo(job.daysAgo),
        tags: {
          create: job.tags.map((name) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      },
    });
  }

  // -- A few applications so the recruiter dashboard has data ---------------
  await prisma.application.deleteMany({ where: { userId: candidate.id } });
  const demoJobs = await prisma.job.findMany({
    where: { title: { in: ['Senior Frontend Engineer', 'Backend Engineer (Node.js)', 'Full-Stack Engineer (Next.js)'] } },
    select: { id: true, title: true },
  });
  const byTitle = Object.fromEntries(demoJobs.map((j) => [j.title, j.id]));

  const demoApplications = [
    { title: 'Senior Frontend Engineer', status: 'REVIEWING' as const, coverLetter: 'Hi Nimbus team — I have spent five years building React dashboards at a cloud monitoring startup, including the exact kind of cost-explorer UI you have. I would love to help make Nimbus the tool every platform team opens first. — Casey' },
    { title: 'Backend Engineer (Node.js)', status: 'SUBMITTED' as const, coverLetter: 'Hi Lumen team — I built patient-scheduling APIs for a telehealth company (HIPAA, audit logs, the works) and care a lot about reliability in healthcare. Happy to walk through how we handled device sync at scale. — Casey' },
    { title: 'Full-Stack Engineer (Next.js)', status: 'SUBMITTED' as const, coverLetter: 'Hi Copperleaf — I have shipped storefronts for three indie brands on similar stacks and know the merchant pain points firsthand. Excited about the component library work. — Casey' },
  ];
  for (const app of demoApplications) {
    const jobId = byTitle[app.title];
    if (!jobId) continue;
    await prisma.application.create({
      data: {
        jobId,
        userId: candidate.id,
        coverLetter: app.coverLetter,
        resumeUrl: 'https://example.com/casey-candidate-resume.pdf',
        status: app.status,
      },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    companies: await prisma.company.count(),
    jobs: await prisma.job.count(),
    applications: await prisma.application.count(),
  };
  // eslint-disable-next-line no-console
  console.log(`✅ Seed complete: ${counts.users} users, ${counts.companies} companies, ${counts.jobs} jobs, ${counts.applications} applications.`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
