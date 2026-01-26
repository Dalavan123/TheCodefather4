import { useState } from "react";

// Strikta typer för API
interface ChatRequestBody {
  fileContent: string;
  userMessage: string;
}

interface ChatResponseBody {
  answer: string;
  error?: string;
}

export default function GeminiChat() {
  const [file, setFile] = useState<File | null>(null);
  const [userMessage, setUserMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!file || !userMessage) return;
    setLoading(true);
    setResponse(null);
    setError(null);
    try {
      const fileContent = await file.text();
      const body: ChatRequestBody = { fileContent, userMessage };
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: ChatResponseBody = await res.json();
      if (data.error) setError(data.error);
      else setResponse(data.answer);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-gray-900 rounded shadow mt-8">
      <h2 className="text-xl mb-4">Gemini AI Chat (.txt)</h2>
      <input
        type="file"
        accept=".txt"
        onChange={e => setFile(e.target.files?.[0] ?? null)}
        className="mb-2 block w-full text-sm"
      />
      <input
        type="text"
        value={userMessage}
        onChange={e => setUserMessage(e.target.value)}
        placeholder="Ställ en fråga eller skriv 'Summarize this'"
        className="mb-2 block w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white"
      />
      <button
        onClick={handleSend}
        disabled={loading || !file || !userMessage}
        className={`w-full rounded px-4 py-2 font-semibold ${
          loading || !file || !userMessage
            ? "bg-gray-700 text-gray-300 cursor-not-allowed"
            : "bg-cyan-500 text-black hover:bg-cyan-400"
        }`}
      >
        {loading ? "Laddar..." : "Skicka"}
      </button>
      {response && <div className="mt-4 p-2 bg-gray-800 rounded">AI: {response}</div>}
      {error && <div className="mt-2 text-red-400">{error}</div>}
    </div>
  );
}
