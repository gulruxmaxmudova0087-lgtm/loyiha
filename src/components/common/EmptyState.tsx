import React from 'react';
import { LucideIcon, Plus, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Plus,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 cursor-pointer"
        >
          <ActionIcon className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
