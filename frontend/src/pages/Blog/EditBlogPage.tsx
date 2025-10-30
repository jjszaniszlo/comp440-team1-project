import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { MarkdownEditor } from "./components/MarkdownEditor";
import { TagEditor } from "@/components/TagEditor";
import { useBlog } from "@/hooks/queries";
import { useUpdateBlog } from "@/hooks/mutations";
import { ApiErrorCard } from "@/components/ApiErrorCard";
import { PublishBadge } from "@/components/PublishBadge";
import { Heading, Tags, UserPen, Save, FileText } from "lucide-react";

function EditBlogPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="min-h-[500px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditBlogPage() {
  const { blogId } = useParams<{ blogId: string }>();
  const navigate = useNavigate();
  const { data: blog, isLoading, error } = useBlog(Number(blogId));
  const { mutate: updateBlog, isPending } = useUpdateBlog(Number(blogId));

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (blog) {
      setSubject(blog.subject ?? "");
      setDescription(blog.description ?? "");
      setTags(blog.tags);
      setContent(blog.content ?? "");
    }
  }, [blog]);

  if (isLoading) {
    return <EditBlogPageSkeleton />;
  }

  if (error || !blog) {
    return (
      <ApiErrorCard
        error={error ?? new Error("Blog not found")}
        errorMessages={{
          404: {
            title: "Blog Not Found",
            description:
              "The blog you're trying to edit doesn't exist or has been deleted.",
          },
          403: {
            title: "Access Denied",
            description:
              "You don't have permission to edit this blog. Only the author can edit their posts.",
          },
        }}
        defaultTitle="Error"
        defaultDescription="An error occurred while loading the blog"
      />
    );
  }

  const handleSave = () => {
    updateBlog(
      {
        subject: subject || undefined,
        description: description || undefined,
        tags: tags.length > 0 ? tags : undefined,
        content: content || undefined,
      },
      {
        onSuccess: () => {
          navigate(`/blog/${blogId}`);
        },
      }
    );
  };

  const canSave = subject.trim().length > 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <UserPen className="h-6 w-6" />
                Edit Blog Post
              </h1>
              <PublishBadge status={blog.status} />
            </div>
            <Button onClick={handleSave} disabled={isPending || !canSave}>
              <Save className="h-4 w-4 mr-2" />
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Heading className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="text"
                placeholder="Enter a subject (required)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={100}
                required
              />
              <InputGroupAddon align="inline-end">{subject.length}/100</InputGroupAddon>
            </InputGroup>
            {!canSave && (
              <p className="text-xs text-destructive mt-1">Subject is required to save</p>
            )}
          </div>

          <InputGroup>
            <InputGroupAddon>
              <Tags className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupAddon>
              <TagEditor tags={tags} onChange={setTags} />
            </InputGroupAddon>
          </InputGroup>

          <InputGroup>
            <InputGroupAddon align="block-start">
              <FileText className="h-4 w-4" />
              Description
            </InputGroupAddon>
            <InputGroupTextarea
              placeholder="Add a brief description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </InputGroup>

          <MarkdownEditor
            value={content || blog.content || ""}
            onChange={setContent}
          />
        </CardContent>
      </Card>
    </div>
  );
}
