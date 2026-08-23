import { Card } from "@/components/ui/card";
import { formatDate, formatTime } from "@/lib/utils/date";

interface NextMatchCardProps {
  match: {
    date: string;
    start_time: string;
    opponent: string;
    location: string | null;
    home_away: "home" | "away";
  } | null;
}

export function NextMatchCard({ match }: NextMatchCardProps) {
  if (!match) {
    return (
      <Card>
        <h2 className="text-xl text-foreground">Nästa match</h2>
        <p className="mt-2 text-sm text-muted">Ingen kommande match planerad.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl text-foreground">Nästa match</h2>
      <p className="mt-2 text-sm text-muted">{formatDate(match.date)}</p>
      <p className="text-2xl text-foreground">vs {match.opponent}</p>
      <p className="mt-1 text-sm text-muted">
        {match.home_away === "home" ? "Hemma" : "Borta"} · {formatTime(match.start_time)}
      </p>
      <p className="text-sm text-muted">{match.location ?? "Plats saknas"}</p>
    </Card>
  );
}
