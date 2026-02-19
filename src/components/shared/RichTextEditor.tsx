import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  content: string;
  onChange: (html: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  /** When true, editor container and content area fill all available height (e.g. full-screen). */
  fillHeight?: boolean;
};

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/50 px-2 py-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9", editor.isActive("bold") && "bg-accent/15 text-accent")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9", editor.isActive("italic") && "bg-accent/15 text-accent")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9", editor.isActive("underline") && "bg-accent/15 text-accent")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <span className="mx-1 w-px h-5 bg-border" aria-hidden />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9", editor.isActive("heading", { level: 1 }) && "bg-accent/15 text-accent")}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9", editor.isActive("heading", { level: 2 }) && "bg-accent/15 text-accent")}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9", editor.isActive("bulletList") && "bg-accent/15 text-accent")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9", editor.isActive("orderedList") && "bg-accent/15 text-accent")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </div>
  );
}

const defaultEditorClass =
  "min-h-[120px] max-h-[320px] overflow-y-auto px-3 py-2 text-sm focus:outline-none prose prose-sm dark:prose-invert max-w-none";
const fillHeightEditorClass =
  "min-h-0 flex-1 overflow-y-auto px-3 py-2 text-sm focus:outline-none prose prose-sm dark:prose-invert max-w-none";

export function RichTextEditor({
  content,
  onChange,
  label,
  placeholder = "Write here…",
  className,
  fillHeight = false,
}: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: content || "",
    editorProps: {
      attributes: {
        class: fillHeight ? fillHeightEditorClass : defaultEditorClass,
        "data-placeholder": placeholder,
      },
      handleDOMEvents: {},
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  useEffect(() => {
    const e = editor;
    if (!e) return;
    e.on("update", () => onChange(e.getHTML()));
    return () => {
      e.off("update");
    };
  }, [editor, onChange]);

  return (
    <div
      className={cn(
        "space-y-1",
        fillHeight && "flex flex-col h-full min-h-0",
        className
      )}
    >
      {label && (
        <Label className="text-xs">{label}</Label>
      )}
      <div
        className={cn(
          "rounded-lg border bg-card overflow-hidden",
          fillHeight && "flex flex-col flex-1 min-h-0"
        )}
      >
        <Toolbar editor={editor} />
        <div
          className={cn(fillHeight && "flex flex-col flex-1 min-h-0 overflow-hidden")}
          {...(fillHeight && { "data-fill-height": true })}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        [data-fill-height] > div {
          display: flex;
          flex-direction: column;
          flex: 1 1 0;
          min-height: 0;
        }
        [data-fill-height] .ProseMirror {
          flex: 1 1 0;
          min-height: 0;
        }
      `}</style>
    </div>
  );
}
