// Every fact below comes from Gurkirat_Singh_Resume.pdf, public/genai_resume.pdf,
// the certificate PDFs in public/ or the project screenshots. Nothing here is invented.

export const person = {
  name: 'Gurkirat Singh',
  role: 'AI Engineer',
  city: 'Bangalore, India',
  email: 'jaggigs309@gmail.com',
  linkedin: 'https://www.linkedin.com/in/gurkirat-singh-70916a2b8',
  github: 'https://github.com/gurkirat309',
  site: 'https://gurkirat.live',
  resume: '/Gurkirat_Singh_Resume.pdf',
  certificates: 'https://drive.google.com/drive/folders/1McPoQdmLHMJ5yev_ScPpsxqH0OocJAp3',
};

export const about = {
  heading: 'AI engineer building multi-agent systems',
  body: [
    'I’m an AI/ML engineer in Bangalore and a Generative AI intern at TensorHub Technologies. Most of my work is multi-agent systems, LLM orchestration and RAG pipelines, built with LangGraph, LangChain and MCP.',
    'I’m in the final year of a B.E. in Computer Science (AI & ML) at JSS Academy of Technical Education, graduating in June 2027.',
  ],
  facts: [
    { value: '50+', label: 'pull requests merged without human edits by a 12-agent GitHub system' },
    { value: '92%', label: 'weighted F1 on legal clauses with a fine-tuned DistilBERT' },
    { value: '20.5%', label: 'more net recovery than the best rule-based chargeback baseline' },
  ],
};

export const projects = [
  {
    id: 'rokdadaav',
    name: 'RokdaDaav',
    kind: 'AI chargeback risk manager',
    image: '/img/rokdadaav.webp',
    imageH: 710,
    summary:
      'Ranks card disputes by expected rupee recovery and writes evidence-cited rebuttal letters. Trained on 590K+ transactions, it beat the strongest rule-based baseline by 20.5% on held-out data (Rs. 24.4L vs Rs. 20.3L).',
    points: [
      'Calibrated winnability model on a temporal split: AUC 0.78, Brier 0.185',
      'Generator-plus-verifier letters with 100% citation coverage; a prompt-injection guard cut leak rate from 60% to 0%',
      'Exposed as MCP tools for Claude Desktop and Cursor, with signed Razorpay webhooks',
    ],
    stack: ['Python', 'Scikit-Learn', 'FastAPI', 'MCP', 'Groq', 'Razorpay API'],
    github: 'https://github.com/gurkirat309/RokdaDaav',
    live: 'https://rokda.gurkirat.live',
  },
  {
    id: 'lexiscan',
    name: 'LexiScan',
    kind: 'AI contract analysis',
    image: '/img/lexiscan.webp',
    imageH: 711,
    summary:
      'Sorts contract clauses into 16 categories with DistilBERT fine-tuned on 53,000+ clauses. It reaches 92% weighted F1, 11 points above zero-shot GPT-4, and parses a 50-page contract in under 3 seconds.',
    stack: ['DistilBERT', 'PyTorch', 'FastAPI', 'Docker', 'PyMuPDF'],
    github: 'https://github.com/gurkirat309/contract-analysis-ai',
    live: 'https://legalai.gurkirat.live',
  },
  {
    id: 'deceiver',
    name: 'Deceiver',
    kind: 'Multi-agent social deduction game',
    image: '/img/deceiver.webp',
    imageH: 723,
    summary:
      'A detective-noir game where 6+ LangGraph agents play the suspects and replace the human game master. FastAPI WebSockets cut turn latency by 40% compared with polling.',
    stack: ['LangGraph', 'LangChain', 'Groq', 'FastAPI', 'React'],
    github: 'https://github.com/gurkirat309/Deceiver',
    live: 'https://deceiver.gurkirat.live',
  },
  {
    id: 'legal-ai',
    name: 'Legal AI',
    kind: 'EU AI regulations chatbot',
    image: '/img/legalai.webp',
    imageH: 891,
    summary:
      'Answers plain-English questions about EU AI rules with cited sources. Retrieval runs on LangChain and ChromaDB with Gemini 2.5 Flash, and answers return in under 2 seconds on a free-tier deployment.',
    stack: ['LangChain', 'ChromaDB', 'Gemini 2.5 Flash', 'Streamlit'],
    github: 'https://github.com/gurkirat309/legal-AI',
  },
  {
    id: 'swasthya',
    name: 'Swasthya',
    kind: 'Emotion and voice analytics',
    image: '/img/swasthya.webp',
    imageH: 894,
    // Written from the app screenshot only. Stack and links still to come from Gurkirat.
    summary:
      'Reads emotion from three signals: the face on camera, a recorded voice with its stress level, and the sentiment of the transcript.',
    stack: [],
  },
];

export const experience = [
  {
    org: 'TensorHub Technologies Pvt. Ltd.',
    role: 'Generative AI Intern',
    period: 'Mar 2026 – Present',
    points: [
      'Built a multi-agent system on the GitHub MCP server: 12 agents read issues, write fixes and open pull requests. It has resolved 70+ issues, with 50+ PRs merged without human edits.',
      'Designed THriveX Clinical, where 5 specialist agents (prescription, medication and endocrinology among them) work a case together, with multilingual speech intake through Sarvam AI and separate patient and doctor portals.',
      'Run 10–15 agents in parallel per workflow on Redis and BullMQ.',
      'Wrote LLM, MCP and tool routing in Python that picks the model and tool server for each request from the user’s intent.',
    ],
  },
  {
    org: 'JSS Academy of Technical Education, Bangalore',
    role: 'B.E. Computer Science & Engineering (AI & ML)',
    period: 'Aug 2023 – Jun 2027',
    points: [
      'CGPA 8.1/10. Coursework in data structures and algorithms, machine learning, deep learning, NLP, DBMS, operating systems and computer networks.',
    ],
  },
];

export const stack = [
  { group: 'AI / ML', items: ['PyTorch', 'TensorFlow', 'Scikit-Learn', 'Hugging Face Transformers', 'NLP', 'Deep Learning', 'Fine-tuning', 'Model evaluation'] },
  { group: 'Generative AI', items: ['LangChain', 'LlamaIndex', 'RAG', 'Prompt engineering', 'ChromaDB', 'FAISS', 'Groq', 'Gemini', 'Sarvam AI'] },
  { group: 'Agentic AI', items: ['LangGraph', 'MCP', 'Multi-agent orchestration', 'Tool routing', 'Redis', 'BullMQ'] },
  { group: 'Backend', items: ['Python', 'FastAPI', 'Flask', 'Django', 'REST APIs', 'WebSockets', 'PostgreSQL', 'MongoDB', 'SQLite', 'Pytest'] },
  { group: 'Frontend', items: ['React', 'JavaScript', 'Streamlit'] },
  { group: 'Cloud & deployment', items: ['AWS EC2', 'AWS ECS', 'Docker', 'CI/CD', 'Git & GitHub', 'MLflow', 'DagsHub'] },
];

export const hackathons = [
  { event: 'AXIOM Hackathon', host: 'SJBIT', place: 'Winner', prize: 'Rs. 50,000', image: '/img/axiom.webp' },
  { event: 'Nexathon 2025', place: 'Winner', prize: 'Rs. 25,000', image: '/img/nexathon.webp' },
  { event: 'IDEATHON', host: 'GAT', place: 'Runner-up', prize: 'Rs. 15,000', image: '/img/ideathon.webp' },
  { event: 'AIKYAM 2025', place: 'Runner-up', prize: 'Rs. 5,000', image: '/img/aikyam.webp' },
];

export const certifications = [
  { name: 'Claude Certified Architect – Foundations', issuer: 'Anthropic', date: 'Mar 2026', href: 'https://www.credly.com/badges/a031fba6-692c-4243-9b21-ef768302aee2', image: '/img/claude-architect.webp' },
  { name: 'Claude Certified Developer – Foundations', issuer: 'Anthropic', date: 'Oct 2026', href: 'https://www.credly.com/badges/bca77f25-c5ca-48d6-b514-885b63ac7fa8', image: '/img/claude-developer.webp' },
  { name: 'Generative AI', issuer: 'Oracle', href: '/img/oracle.webp' },
  { name: 'Data Science, ML, DL and NLP', issuer: 'Udemy', href: '/img/udemy.webp' },
];

// Where each tool shows up in the work above, taken only from the project and experience
// text in this file. Tools not listed here have no named use on the site yet.
export const stackUsage = {
  PyTorch: ['LexiScan'],
  'Scikit-Learn': ['RokdaDaav'],
  NLP: ['LexiScan'],
  'Deep Learning': ['LexiScan'],
  'Fine-tuning': ['LexiScan'],
  'Model evaluation': ['RokdaDaav', 'LexiScan'],
  LangChain: ['Deceiver', 'Legal AI'],
  RAG: ['Legal AI'],
  ChromaDB: ['Legal AI'],
  Groq: ['RokdaDaav', 'Deceiver'],
  Gemini: ['Legal AI'],
  'Sarvam AI': ['TensorHub'],
  LangGraph: ['Deceiver'],
  MCP: ['RokdaDaav', 'TensorHub'],
  'Multi-agent orchestration': ['Deceiver', 'TensorHub'],
  'Tool routing': ['TensorHub'],
  Redis: ['TensorHub'],
  BullMQ: ['TensorHub'],
  Python: ['RokdaDaav', 'TensorHub'],
  FastAPI: ['RokdaDaav', 'LexiScan', 'Deceiver'],
  WebSockets: ['Deceiver'],
  React: ['Deceiver'],
  Streamlit: ['Legal AI'],
  Docker: ['LexiScan'],
  'Git & GitHub': ['TensorHub'],
};

// "I can ..." list near the end of the page. The technical lines point at work shown above
// (agents at TensorHub, LexiScan's fine-tuning, Legal AI's retrieval, the FastAPI services,
// AWS and Docker, the hackathon wins); the last lines are how Gurkirat works with people.
export const strengths = [
  'design AI agents.',
  'fine-tune models.',
  'build RAG systems.',
  'ship APIs.',
  'deploy to the cloud.',
  'win hackathons.',
  'lead a team.',
  'pitch an idea.',
  'learn fast.',
  'own the outcome.',
  'build with you.',
];
