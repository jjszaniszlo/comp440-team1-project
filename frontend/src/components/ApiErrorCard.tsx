import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";

interface ApiErrorCardProps {
  error: unknown;
  errorMessages?: Record<number, { title: string; description: string }>;
  defaultTitle?: string;
  defaultDescription?: string;
  onBack?: () => void;
}

export function ApiErrorCard({
  error,
  errorMessages = {},
  defaultTitle = "Error",
  defaultDescription = "An error occurred",
  onBack = () => window.history.back(),
}: ApiErrorCardProps) {
  const apiError = error instanceof ApiError ? error : null;
  const status = apiError?.status;

  const errorConfig = status ? errorMessages[status] : undefined;
  const title = errorConfig?.title ?? defaultTitle;

  // Safely extract detail from error data
  let errorDetail = defaultDescription;
  if (apiError?.data && typeof apiError.data === 'object' && 'detail' in apiError.data) {
    const detail = (apiError.data as { detail: unknown }).detail;
    if (typeof detail === 'string') {
      errorDetail = detail;
    }
  }

  const description = errorConfig?.description ?? errorDetail;

  return (
    <div className="container mx-auto px-4 w-full flex items-center justify-center min-h-[50vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={onBack}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
