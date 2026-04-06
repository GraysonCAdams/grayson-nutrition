import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { WeekDot } from "./WeekDot";

interface ActivityCardProps {
  id: string;
  name: string;
  icon?: string | null;
  color: string;
  category: string;
  baselineWeek?: number | null;
  maxPerDay?: number;
  isDragOverlay?: boolean;
  isInCalendar?: boolean;
  onRemove?: () => void;
}

export function ActivityCard({
  id,
  name,
  icon,
  color,
  category,
  baselineWeek,
  maxPerDay,
  isDragOverlay,
  isInCalendar,
  onRemove,
}: ActivityCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { name, icon, color, category },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={style}
      {...(!isDragOverlay ? { ...listeners, ...attributes } : {})}
      className={`
        group relative flex items-center gap-2 px-3 py-2 rounded-xl cursor-grab active:cursor-grabbing
        transition-all select-none touch-none
        ${isDragging ? "opacity-30 scale-95" : ""}
        ${isDragOverlay ? "shadow-2xl scale-105 rotate-2" : "shadow-sm hover:shadow-md"}
        ${isInCalendar ? "text-sm" : "text-sm sm:text-base"}
      `}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-20"
        style={{ backgroundColor: color }}
      />
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: color }}
      />
      <span className="relative text-base sm:text-lg">{icon || "✨"}</span>
      <span className="relative font-semibold text-gray-800 truncate flex-1">{name}</span>
      {maxPerDay !== undefined && maxPerDay > 1 && (
        <span className="relative text-[10px] font-semibold text-gray-400 tabular-nums" title={`Ideal: ${maxPerDay}× per day`}>
          {maxPerDay >= 99 ? "∞×" : `${maxPerDay}×`}
        </span>
      )}
      {baselineWeek && <WeekDot week={baselineWeek} />}
      {isInCalendar && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="relative opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity text-xs p-1"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function ActivityCardStatic({
  name,
  icon,
  color,
}: {
  name: string;
  icon?: string | null;
  color: string;
}) {
  return (
    <div className="relative flex items-center gap-2 px-3 py-2 rounded-xl shadow-2xl scale-105 rotate-2 select-none">
      <div
        className="absolute inset-0 rounded-xl opacity-20"
        style={{ backgroundColor: color }}
      />
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: color }}
      />
      <span className="relative text-lg">{icon || "✨"}</span>
      <span className="relative font-semibold text-gray-800 truncate">{name}</span>
    </div>
  );
}
