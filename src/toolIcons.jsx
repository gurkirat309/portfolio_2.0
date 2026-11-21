import {
  siDjango,
  siDocker,
  siFastapi,
  siFlask,
  siGithub,
  siGithubactions,
  siGooglegemini,
  siHuggingface,
  siJavascript,
  siLangchain,
  siLanggraph,
  siMlflow,
  siModelcontextprotocol,
  siMongodb,
  siPostgresql,
  siPytest,
  siPython,
  siPytorch,
  siReact,
  siRedis,
  siScikitlearn,
  siSqlite,
  siStreamlit,
  siTensorflow,
} from 'simple-icons';
import {
  BrainCircuit,
  Braces,
  Cable,
  Container,
  Database,
  FileSearch,
  Gauge,
  GitFork,
  Languages,
  Layers,
  ListOrdered,
  MessageSquareText,
  Network,
  Route,
  ScanSearch,
  Server,
  SlidersHorizontal,
  SquareTerminal,
  Zap,
} from 'lucide-react';

// An icon for each tool in the Stack section, drawn in one colour (currentColor) so it sits in
// the site palette: brand marks from Simple Icons (CC0) where the tool has one, and a Lucide
// symbol for concepts and for brands Simple Icons doesn't carry (AWS asked for its logos to be
// removed; LlamaIndex, ChromaDB, Groq, Sarvam AI, BullMQ and DagsHub aren't in the set).

const BRAND = {
  PyTorch: siPytorch,
  TensorFlow: siTensorflow,
  'Scikit-Learn': siScikitlearn,
  'Hugging Face Transformers': siHuggingface,
  LangChain: siLangchain,
  Gemini: siGooglegemini,
  LangGraph: siLanggraph,
  MCP: siModelcontextprotocol,
  Redis: siRedis,
  Python: siPython,
  FastAPI: siFastapi,
  Flask: siFlask,
  Django: siDjango,
  PostgreSQL: siPostgresql,
  MongoDB: siMongodb,
  SQLite: siSqlite,
  Pytest: siPytest,
  React: siReact,
  JavaScript: siJavascript,
  Streamlit: siStreamlit,
  Docker: siDocker,
  'CI/CD': siGithubactions,
  'Git & GitHub': siGithub,
  MLflow: siMlflow,
};

const SYMBOL = {
  NLP: MessageSquareText,
  'Deep Learning': BrainCircuit,
  'Fine-tuning': SlidersHorizontal,
  'Model evaluation': Gauge,
  LlamaIndex: Layers,
  RAG: FileSearch,
  'Prompt engineering': SquareTerminal,
  ChromaDB: Database,
  FAISS: ScanSearch,
  Groq: Zap,
  'Sarvam AI': Languages,
  'Multi-agent orchestration': Network,
  'Tool routing': Route,
  BullMQ: ListOrdered,
  'REST APIs': Braces,
  WebSockets: Cable,
  'AWS EC2': Server,
  'AWS ECS': Container,
  DagsHub: GitFork,
};

export default function ToolIcon({ name, size = 16 }) {
  const brand = BRAND[name];
  if (brand) {
    return (
      <svg className="tool-icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
        <path d={brand.path} fill="currentColor" />
      </svg>
    );
  }
  const Symbol = SYMBOL[name] || Braces;
  return <Symbol className="tool-icon" size={size} strokeWidth={1.75} aria-hidden="true" focusable="false" />;
}
