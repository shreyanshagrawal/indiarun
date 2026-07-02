/**
 * Reusable error + retry banner for SSE-driven stages.
 * Shows a red card with the error message and a "Try Again" button.
 */
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}

export function SseErrorBanner({ message, onRetry, retrying }: Props) {
  return (
    <Card className="border-destructive/50 bg-destructive/5 mt-4">
      <CardContent className="p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-destructive">Generation failed</p>
          <p className="text-xs text-muted-foreground mt-0.5 break-words">{message}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          disabled={retrying}
          className="shrink-0 border-destructive/40 hover:bg-destructive/10"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Retrying…" : "Try Again"}
        </Button>
      </CardContent>
    </Card>
  );
}
