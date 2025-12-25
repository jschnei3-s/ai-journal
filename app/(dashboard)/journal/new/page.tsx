import { JournalEditor } from "@/components/journal/JournalEditor";

export default function NewJournalPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 min-h-[calc(100vh-4rem)]">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 min-h-[600px]">
        <JournalEditor />
      </div>
    </div>
  );
}

