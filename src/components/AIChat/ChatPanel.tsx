import { useTranslation } from "react-i18next";
import { useChatStore } from "../../stores/chatStore";
import { useState, useRef, useEffect } from "react";

export function ChatPanel() {
  const { t, i18n } = useTranslation();
  const { isOpen, messages, isLoading, close, addMessage, setLoading } = useChatStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { id: crypto.randomUUID(), role: "user" as const, content: input.trim() };
    addMessage(userMsg);
    setInput("");
    setLoading(true);

    const apiUrl = import.meta.env.VITE_LLM_API_URL;

    if (apiUrl) {
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_LLM_API_KEY ?? ""}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content ?? "No response";
        addMessage({ id: crypto.randomUUID(), role: "assistant", content: reply });
      } catch {
        addMessage({ id: crypto.randomUUID(), role: "assistant", content: "Error: Failed to get response from LLM API." });
      }
    } else {
      // Demo mode: simulate response
      const demoResponse = i18n.language === "zh"
        ? t("chat.demoResponseZh")
        : t("chat.demoResponse");
      setTimeout(() => {
        addMessage({ id: crypto.randomUUID(), role: "assistant", content: demoResponse });
        setLoading(false);
      }, 1000);
      return;
    }

    setLoading(false);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={close}
      />
      <div className="fixed bottom-0 right-0 w-full sm:w-96 h-[70vh] sm:h-[80vh] bg-white shadow-2xl z-50 rounded-t-xl sm:rounded-l-xl sm:rounded-tl-xl sm:rounded-tr-none flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[#013243] text-white rounded-t-xl sm:rounded-tl-xl sm:rounded-tr-none">
          <h3 className="text-sm font-semibold">{t("chat.title")}</h3>
          <button onClick={close} className="text-white/80 hover:text-white cursor-pointer">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-gray-400 text-sm text-center mt-8">{t("chat.placeholder")}</p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  msg.role === "user"
                    ? "bg-[#013243] text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm rounded-bl-none">
                <span className="inline-block animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-gray-200 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("chat.placeholder")}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#013243]"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-[#013243] text-white rounded-lg text-sm font-medium hover:bg-[#024a63] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {t("chat.send")}
          </button>
        </div>
      </div>
    </>
  );
}
