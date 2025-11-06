import { useState, useRef, useEffect, type ComponentType } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BadgeConfig {
  type: 'tag' | 'author';
  placeholder: string;
  invalidMessage: string;
  duplicateMessage: string;
  BadgeComponent: ComponentType<{ value: string; onRemove: () => void }>;
}

interface BadgeEditorProps {
  config: BadgeConfig;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

const VALUE_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

export function BadgeEditor({ config, values, onChange, disabled }: BadgeEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  function handleAdd() {
    const trimmedValue = newValue.trim();

    if (!trimmedValue) {
      setIsAdding(false);
      setNewValue("");
      return;
    }

    if (!VALUE_REGEX.test(trimmedValue)) {
      toast.error(config.invalidMessage);
      return;
    }

    if (values.includes(trimmedValue)) {
      toast.error(config.duplicateMessage);
      setNewValue("");
      return;
    }

    onChange([...values, trimmedValue]);
    setNewValue("");
    setIsAdding(false);
  }

  function handleRemove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    } else if (e.key === "Escape") {
      setNewValue("");
      setIsAdding(false);
    }
  }

  function handleBlur() {
    handleAdd();
  }

  const { BadgeComponent } = config;

  return (
    <>
      {values.map((value, index) => (
        <BadgeComponent
          key={`${config.type}-${value}-${index}`}
          value={value}
          onRemove={() => handleRemove(index)}
        />
      ))}
      {isAdding ? (
        <Input
          ref={inputRef}
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={config.placeholder}
          disabled={disabled}
          className="w-32 h-6 text-xs px-2"
        />
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={disabled}
          className="h-6 w-6 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      )}
    </>
  );
}
