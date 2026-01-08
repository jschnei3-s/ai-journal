import { JournalEditor } from "@/components/journal/JournalEditor";

interface EditJournalPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditJournalPage({ params }: EditJournalPageProps) {
  const { id } = await params;
  
  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 lg:p-10 min-h-[calc(100vh-4rem)]">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/60 p-8 md:p-10 lg:p-12 min-h-[600px]">
        <JournalEditor entryId={id} />
      </div>
    </div>
  );
}

