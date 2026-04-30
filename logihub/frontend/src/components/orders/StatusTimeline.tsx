"use client";

import { StatusEntry } from "@/types/order";
import { STATUS_LABELS_RU } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";

interface StatusTimelineProps {
  entries?: StatusEntry[];
}

export function StatusTimeline({ entries = [] }: StatusTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle2 className="size-5 text-ocean" />;
      case "failed":
        return <AlertCircle className="size-5 text-destructive" />;
      case "in_transit":
        return <Clock className="size-5 text-ocean animate-pulse" />;
      default:
        return <Circle className="size-5 text-beige" fill="currentColor" />;
    }
  };

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-0.5 before:bg-beige/30">
      {entries.map((e, index) => (
        <div 
          key={e.id} 
          className="relative flex items-start gap-6 animate-in fade-in slide-in-from-left-2 duration-500" 
          style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
        >
          <div className="absolute left-0 mt-1.5 flex size-6 items-center justify-center rounded-full bg-cream ring-4 ring-cream">
            {getStatusIcon(e.new_status)}
          </div>
          
          <div className="flex flex-col gap-1.5 ml-10">
            <div className="flex items-center gap-2">
               <span className="font-bold text-ocean">
                {STATUS_LABELS_RU[e.new_status as keyof typeof STATUS_LABELS_RU] || e.new_status}
              </span>
              {e.old_status && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  (из <span className="italic">{STATUS_LABELS_RU[e.old_status as keyof typeof STATUS_LABELS_RU] || e.old_status}</span>)
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
               <span className="bg-beige/20 px-2 py-0.5 rounded text-xs text-ocean/70 font-medium">
                {e.changed_at ? new Date(e.changed_at).toLocaleString('ru-RU') : "—"}
              </span>
              <span className="flex items-center gap-1 italic text-[10px] uppercase tracking-tighter">
                 Системная запись
              </span>
            </div>
          </div>
        </div>
      ))}
      
      {entries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground italic">
          История изменений пуста
        </div>
      )}
    </div>
  );
}
