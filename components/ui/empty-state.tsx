import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <h2 className="text-xl text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </Card>
  );
}
