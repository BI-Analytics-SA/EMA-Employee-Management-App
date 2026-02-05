import { Button } from "@/components/ui/button";
import { X, FileText, ImageIcon } from "lucide-react";

const isPdf = (type: string) =>
  type === "application/pdf" || type?.toLowerCase().includes("pdf");

export type SelectedFileCardProps = {
  file: File;
  onRemove: () => void;
};

export function SelectedFileCard({ file, onRemove }: SelectedFileCardProps) {
  const isPdfType = isPdf(file.type);
  const Icon = isPdfType ? FileText : ImageIcon;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
      <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded bg-green-100 dark:bg-green-900/30">
        <Icon className="h-5 w-5 text-green-700 dark:text-green-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {(file.size / 1024).toFixed(1)} KB
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        aria-label="Remove file"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
