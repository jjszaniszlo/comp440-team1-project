import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useBlog } from "@/hooks/queries";
import { useUpdateBlog, usePublishBlog, useUnpublishBlog } from "@/hooks/mutations";
import { BlogStatus } from "@/types";

interface UseEditBlogProps {
  blogId: number;
}

export function useEditBlog({ blogId }: UseEditBlogProps) {
  const navigate = useNavigate();
  const { data: blog, isLoading, error } = useBlog(blogId);
  const { mutate: updateBlog, isPending } = useUpdateBlog(blogId);
  const { mutate: publishBlog, isPending: isPublishing } = usePublishBlog(blogId);
  const { mutate: unpublishBlog, isPending: isUnpublishing } = useUnpublishBlog(blogId);

  // Form state
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState("");

  // Initialize form from blog data
  useEffect(() => {
    if (blog) {
      setSubject(blog.subject ?? "");
      setDescription(blog.description ?? "");
      setTags(blog.tags);
      setContent(blog.content ?? "");
    }
  }, [blog]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = blog ? (
    subject !== (blog.subject ?? "") ||
    description !== (blog.description ?? "") ||
    JSON.stringify(tags) !== JSON.stringify(blog.tags) ||
    content !== (blog.content ?? "")
  ) : false;

  // Handlers
  const handleSave = () => {
    updateBlog({
      subject: subject || undefined,
      description: description || undefined,
      tags: tags.length > 0 ? tags : undefined,
      content: content || undefined,
    });
  };

  const handleViewPage = () => {
    navigate(`/blog/${blogId}`);
  };

  const handlePublishToggle = (checked: boolean) => {
    if (checked) {
      publishBlog();
    } else {
      unpublishBlog();
    }
  };

  // Derived state
  const isPublished = blog?.status === BlogStatus.PUBLISHED;
  const isTogglingPublish = isPublishing || isUnpublishing;

  // Validation
  const canSave = subject.trim().length > 0 && hasUnsavedChanges;

  return {
    // Data
    blog,
    isLoading,
    error,

    // Form state
    subject,
    setSubject,
    description,
    setDescription,
    tags,
    setTags,
    content,
    setContent,

    // Actions
    handleSave,
    isPending,
    handleViewPage,
    handlePublishToggle,
    isTogglingPublish,

    // Derived state
    isPublished,
    hasUnsavedChanges,

    // Validation
    canSave,
  };
}
