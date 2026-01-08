"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { Edit2, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { JournalEntry } from "@/lib/types";

interface EntryCardProps {
  entry: JournalEntry;
  onDelete?: (id: string) => void;
}

export function EntryCard({ entry, onDelete }: EntryCardProps) {
  const wordCount = entry.content.trim().split(/\s+/).filter(Boolean).length;
  const createdDate = new Date(entry.created_at);
  const updatedDate = new Date(entry.updated_at);
  const isRecentlyUpdated = updatedDate.getTime() > createdDate.getTime() + 1000;

  return (
    <div className="group bg-white rounded-xl border border-gray-200/60 hover:border-indigo-300/60 hover:shadow-xl transition-all duration-300 p-6 backdrop-blur-sm bg-gradient-to-br from-white to-gray-50/50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <time
              className="text-sm font-semibold text-gray-900"
              dateTime={entry.created_at}
            >
              {format(createdDate, "MMMM d, yyyy")}
            </time>
            {isRecentlyUpdated && (
              <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                Updated {formatDistanceToNow(updatedDate, { addSuffix: true })}
              </span>
            )}
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words mb-4 text-[15px]">
              {entry.content}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">{wordCount} words</span>
            </div>
            <span className="text-gray-400">•</span>
            <span>{entry.content.length} chars</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100/80">
        <Link href={`/journal/${entry.id}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-200 transition-colors">
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
            className="hover:scale-105 transition-transform"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}



