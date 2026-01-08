import { JournalEditor } from "@/components/journal/JournalEditor";

export default function NewJournalPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 lg:p-10 min-h-[calc(100vh-4rem)]">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/60 p-8 md:p-10 lg:p-12 min-h-[600px]">
        <JournalEditor />
      </div>
    </div>
  );
}

