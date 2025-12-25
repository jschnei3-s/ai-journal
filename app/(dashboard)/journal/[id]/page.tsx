import { JournalEditor } from "@/components/journal/JournalEditor";

interface EditJournalPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditJournalPage({ params }: EditJournalPageProps) {
  const { id } = await params;
  
  return (
    <div className="max-w-4xl mx-auto p-6 min-h-[calc(100vh-4rem)]">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 min-h-[600px]">
        <JournalEditor entryId={id} />
      </div>
    </div>
  );
}

