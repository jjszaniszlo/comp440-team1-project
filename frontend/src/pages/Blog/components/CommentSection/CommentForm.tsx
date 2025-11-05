import { useState } from "react";
import { useCreateComment } from "@/hooks";
import { Sentiment } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, ThumbsDown, Send } from "lucide-react";

interface CommentFormProps {
  blogId: number;
  onCommentAdded?: () => void;
}

export function CommentFormSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[100px] w-full" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32 ml-auto" />
      </div>
    </div>
  );
}

export function CommentForm({ blogId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const { mutate: createComment, isPending } = useCreateComment(blogId);

  const handleSubmit = () => {
    if (!content.trim() || !sentiment) return;

    createComment(
      { content: content.trim(), sentiment },
      {
        onSuccess: () => {
          setContent("");
          setSentiment(null);
          onCommentAdded?.();
        },
      }
    );
  };

  const canSubmit = content.trim() && sentiment && !isPending;

  if (isPending) {
    return <CommentFormSkeleton />;
  }

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Write your comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isPending}
        className="min-h-[100px]"
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={sentiment === Sentiment.POSITIVE ? "default" : "outline"}
          size="sm"
          onClick={() => setSentiment(Sentiment.POSITIVE)}
          disabled={isPending}
        >
          <ThumbsUp className="h-4 w-4 mr-1" />
          Positive
        </Button>
        <Button
          type="button"
          variant={sentiment === Sentiment.NEGATIVE ? "default" : "outline"}
          size="sm"
          onClick={() => setSentiment(Sentiment.NEGATIVE)}
          disabled={isPending}
        >
          <ThumbsDown className="h-4 w-4 mr-1" />
          Negative
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="ml-auto"
        >
          <Send className="h-4 w-4 mr-1" />
          {isPending ? "Sending..." : "Send Comment"}
        </Button>
      </div>
    </div>
  );
}
