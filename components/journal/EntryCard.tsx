"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { JournalEntry } from "@/lib/types";

interface EntryCardProps {
  entry: JournalEntry;
  onDelete?: (id: string) => void;
}

export function EntryCard({ entry, onDelete }: EntryCardProps) {
  const preview = entry.content.slice(0, 150);
  const wordCount = entry.content.trim().split(/\s+/).filter(Boolean).length;
  const createdDate = new Date(entry.created_at);
  const updatedDate = new Date(entry.updated_at);
  const isRecentlyUpdated = updatedDate.getTime() > createdDate.getTime() + 1000;

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <time
              className="text-sm font-medium text-gray-900"
              dateTime={entry.created_at}
            >
              {format(createdDate, "MMMM d, yyyy")}
            </time>
            {isRecentlyUpdated && (
              <span className="text-xs text-gray-500">
                (updated {formatDistanceToNow(updatedDate, { addSuffix: true })})
              </span>
            )}
          </div>
          <p className="text-gray-600 line-clamp-3 mb-3">
            {preview}
            {entry.content.length > 150 && "..."}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{wordCount} words</span>
            <span>{entry.content.length} characters</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <Link href={`/journal/${entry.id}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(entry.id)}
            aria-label="Delete entry"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}



