// Deploy-time route for F.R.I.D.A.Y. (Vercel Node function: /api/friday).
// Set GROQ_API_KEY (and optionally GROQ_MODEL) in the host's environment settings, never in code.
import { handleFriday } from '../server/friday.js';

export default function handler(req, res) {
  return handleFriday(req, res, process.env);
}
