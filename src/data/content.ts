// Single source of truth for the portfolio's content.
// From Sitong Hao's résumé (October 2026) and his previous portfolio.
//
// Company and school marks are each organisation's own published icon (see
// public/LOGOS.md for where each came from). Technology marks are simple-icons
// (CC0, see public/logos/LICENSE.txt).

export type Social = {
  name: string
  url: string
  handle: string
}

export type WorkItem = {
  company: string
  href: string
  title: string
  logoUrl: string
  start: string
  end: string
  current?: boolean
  location: string
  highlights: string[]
  tags: string[]
}

export type EducationItem = {
  school: string
  href: string
  degree: string
  logoUrl: string
  start: string
  end: string
  highlights: string[]
}

export type ProjectLink = { label: string; href: string }

export type Project = {
  title: string
  category: 'Proprietary' | 'Open Source' | 'Personal'
  tagline: string
  description: string
  tech: string[]
  links: ProjectLink[]
  accent: string // hex used for the card glow
  image?: string // preview screenshot
  featured?: boolean
}

export const PROFILE = {
  name: 'Sitong Hao',
  initials: 'SH',
  role: 'Software Engineer at Qanvast',
  location: 'Singapore',
  email: 'hao_si_tong@outlook.com',
} as const

export const SOCIALS: Social[] = [
  { name: 'GitHub', url: 'https://github.com/o-ohst', handle: '@o-ohst' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/haositong', handle: 'in/haositong' },
  { name: 'Email', url: 'mailto:hao_si_tong@outlook.com', handle: 'hao_si_tong@outlook.com' },
]

export const SKILL_GROUPS: { label: string; items: string[] }[] = [
  {
    label: 'Languages',
    items: ['TypeScript', 'Python', 'Go', 'Java', 'Rust', 'Elixir', 'C++', 'C#', 'C', 'JavaScript'],
  },
  {
    label: 'Backend & Data',
    items: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'RabbitMQ', 'Elasticsearch', 'Microservices'],
  },
  {
    label: 'Product',
    items: ['Next.js', 'React', 'React Native', 'FastAPI', 'Flask', 'Django', 'Apache Airflow'],
  },
  {
    label: 'AI & Delivery',
    items: ['Claude Code', 'MCP', 'TensorFlow', 'Pandas', 'Docker', 'AWS', 'Linux', 'Git', 'CI/CD'],
  },
]

export const WORK: WorkItem[] = [
  {
    company: 'Qanvast',
    href: 'https://qanvast.com',
    title: 'Software Engineer',
    logoUrl: '/qanvast.png',
    start: 'Oct 2025',
    end: 'Present',
    current: true,
    location: 'Singapore',
    highlights: [
      'Architected an AI-powered ERP platform with Next.js, TypeScript and PostgreSQL, leading the leads and finance modules.',
      'Built multimodal AI tools that automate business workflows: an embedded agent, a quote digitiser and drafter, and a call and screenshot processing pipeline.',
      'Developed the website and mobile apps with Next.js, React Native and TypeScript, and backend services and REST APIs with Node.js, Express, MongoDB, Redis, RabbitMQ and Elasticsearch.',
      'Established AI spec-driven development with Claude Code, agent skills and MCP integrations.',
    ],
    tags: ['Next.js', 'TypeScript', 'PostgreSQL', 'React Native', 'Node.js', 'MongoDB', 'Redis', 'RabbitMQ'],
  },
  {
    company: 'Continental AG',
    href: 'https://www.continental.com/',
    title: 'Software Engineer Intern',
    logoUrl: '/continental.svg',
    start: 'May 2024',
    end: 'Aug 2024',
    location: 'Singapore',
    highlights: [
      'Architected a real-time distributed tracking system for automated guided vehicles, building Python and Rust microservices for industrial automation.',
      'Developed REST services with Python and FastAPI, MongoDB for persistence, and Docker and AWS for containerised deployment.',
    ],
    tags: ['Python', 'Rust', 'FastAPI', 'MongoDB', 'Docker', 'AWS'],
  },
  {
    company: 'GIC',
    href: 'https://www.gic.com.sg/',
    title: 'Software Engineer Intern',
    logoUrl: '/gic.png',
    start: 'May 2023',
    end: 'Nov 2023',
    location: 'Singapore',
    highlights: [
      'Engineered a market data pipeline orchestration platform with Python, Apache Airflow, Flask and Redis, and a React and TypeScript front end for managing data workflows.',
      'Developed an investment analytics dashboard with Python, Django and SQL, processing investment position datasets for portfolio analysis.',
    ],
    tags: ['Python', 'Apache Airflow', 'Flask', 'Redis', 'React', 'Django'],
  },
]

export const EDUCATION: EducationItem[] = [
  {
    school: 'National University of Singapore',
    href: 'https://www.comp.nus.edu.sg/',
    degree: 'Bachelor of Computing (Honours), Computer Science',
    logoUrl: '/nus.jpg',
    start: '2021',
    end: '2025',
    highlights: ['Specialisation in Networking & Distributed Systems.'],
  },
]

export const PROJECTS: Project[] = [
  {
    title: 'Convosense',
    category: 'Proprietary',
    tagline: 'Natural AI video and voice calls',
    description:
      'AI agents you can call and talk to naturally, sharing your camera or screen as you speak, on an audio- and video-native model.',
    tech: ['Cloudflare Workers', 'Durable Objects', 'Web Audio', 'React', 'three.js'],
    links: [{ label: 'convosense.net', href: 'https://convosense.net' }],
    accent: '#1f7a6e',
    image: '/projects/convosense.jpg',
    featured: true,
  },
  {
    title: 'MCP Charts',
    category: 'Proprietary',
    tagline: 'The MCP for MCPs',
    description:
      'An AI tool discovery platform and remote MCP server that helps agents find relevant and trending MCP servers, skills, plugins and prompts.',
    tech: ['React', 'TypeScript', 'MCP', 'PostgreSQL'],
    links: [{ label: 'mcpcharts.com', href: 'https://mcpcharts.com' }],
    accent: '#9bd31f',
    image: '/projects/mcpcharts.jpg',
    featured: true,
  },
  {
    title: 'TypeBattle',
    category: 'Proprietary',
    tagline: 'Real-time multiplayer typing battles',
    description:
      'Head-to-head typing races with authoritative realtime state on Cloudflare Workers + Durable Objects, and bot opponents. Sub-100ms rooms.',
    tech: ['Cloudflare Workers', 'Durable Objects', 'Vite', 'TypeScript'],
    links: [{ label: 'typebattle.kiasubot.com', href: 'https://typebattle.kiasubot.com' }],
    accent: '#22d3ee',
    image: '/projects/typebattle.jpg',
  },
  {
    title: 'Signposts',
    category: 'Proprietary',
    tagline: 'Photo map for travellers',
    description:
      "Drop a photo where you've been and follow trails left by others. Clustered Leaflet map, verified spots, realtime feed.",
    tech: ['React', 'Vite', 'Leaflet', 'Supabase'],
    links: [{ label: 'signposts.kiasubot.com', href: 'https://signposts.kiasubot.com' }],
    accent: '#ec5f3b',
    image: '/projects/signposts.jpg',
  },
  {
    title: 'Quant Backtesting Framework',
    category: 'Personal',
    tagline: 'Agentic strategy research, 24/7',
    description:
      'Modular backtester — interchangeable alpha models, portfolio construction and execution across SGX, NASDAQ, HKEX, NYSE and crypto. Agents research and iterate on their own.',
    tech: ['Python', 'Celery', 'PostgreSQL', 'Pandas'],
    links: [],
    accent: '#3b82f6',
    image: '/projects/backtest.jpg',
  },
  {
    title: 'TeaTalk',
    category: 'Personal',
    tagline: 'Anonymous social, live',
    description:
      'A social platform and messenger for students on the web, iOS and Android. A Python FastAPI and PostgreSQL API behind React Native apps built with Expo.',
    tech: ['React Native', 'FastAPI', 'Python', 'PostgreSQL', 'Expo'],
    links: [{ label: 'teatalk.app', href: 'https://teatalk.app' }],
    accent: '#00b5b5',
    image: '/projects/teatalk.jpg',
  },
  {
    title: 'Mordle',
    category: 'Personal',
    tagline: 'Wordle, except someone is racing you',
    description:
      'Live multiplayer Wordle. An Elixir and Phoenix backend holds the game state and pushes every move over WebSockets to a React front end, with PostgreSQL behind it.',
    tech: ['Elixir', 'Phoenix', 'React', 'PostgreSQL'],
    links: [{ label: 'mordle0.vercel.app', href: 'https://mordle0.vercel.app' }],
    accent: '#f062b8',
    image: '/projects/mordle.jpg',
  },
]
