import { Card } from "@/components/ui/card";
import { formatDate, formatTime } from "@/lib/utils/date";

interface NextTrainingCardProps {
  training: {
    date: string;
    start_time: string;
    location: string | null;
    theme: string | null;
  } | null;
}

export function NextTrainingCard({ training }: NextTrainingCardProps) {
  if (!training) {
    return (
      <Card>
        <h2 className="text-xl text-foreground">Nästa träning</h2>
        <p className="mt-2 text-sm text-muted">Ingen framtida träning planerad.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl text-foreground">Nästa träning</h2>
      <p className="mt-2 text-sm text-muted">{formatDate(training.date)}</p>
      <p className="text-2xl text-foreground">{formatTime(training.start_time)}</p>
      <p className="mt-1 text-sm text-muted">{training.location ?? "Plats saknas"}</p>
      {training.theme ? <p className="mt-3 rounded-md bg-panel-elevated p-2 text-sm text-foreground">Tema: {training.theme}</p> : null}
    </Card>
  );
}
