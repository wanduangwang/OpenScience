import { useChatStore } from "../../stores/chatStore";

export function FloatingButton() {
  const { isOpen, toggle } = useChatStore();

  if (isOpen) return null;

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 w-14 h-14 bg-[#013243] text-white rounded-full shadow-lg hover:bg-[#024a63] transition-all z-50 flex items-center justify-center cursor-pointer"
      title="AI Assistant"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M8.5 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM11 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM13.5 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
        <path d="M20 2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4l4 4 4-4h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
      </svg>
    </button>
  );
}
