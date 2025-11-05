import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { useParams } from "react-router";
import { MarkdownEditor } from "./components/MarkdownEditor";
import { TagEditor } from "@/components/TagEditor";
import { ApiErrorCard } from "@/components/ApiErrorCard";
import { PublishBadge } from "@/components/PublishBadge";
import { Heading, Tags, UserPen, Save, FileText } from "lucide-react";
import { useEditBlog } from "./hooks";

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

export function EditBlogPage() {
  const { blogId } = useParams<{ blogId: string }>();
  const {
    blog,
    isLoading,
    error,
    subject,
    setSubject,
    description,
    setDescription,
    tags,
    setTags,
    content,
    setContent,
    handleSave,
    isPending,
    canSave,
    handlePublishToggle,
    isTogglingPublish,
    isPublished,
  } = useEditBlog({ blogId: Number(blogId) });

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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="publish-toggle"
                  checked={isPublished}
                  onCheckedChange={handlePublishToggle}
                  disabled={isTogglingPublish}
                />
                <Label htmlFor="publish-toggle" className="cursor-pointer">
                  {isPublished ? "Published" : "Draft"}
                </Label>
              </div>
              <Button onClick={handleSave} disabled={isPending || !canSave}>
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
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
