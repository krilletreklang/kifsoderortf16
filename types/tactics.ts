export type BoardType = "7v7" | "9v9" | "training" | "custom";
export type PieceKind = "player" | "opponent" | "ball" | "cone";
export type ArrowType = "arrow" | "pass" | "run" | "press";

export interface TacticsPiece {
  id: string;
  kind: PieceKind;
  label: string;
  number?: number;
  x: number;
  y: number;
  color?: string;
}

export interface TacticsArrow {
  id: string;
  type: ArrowType;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export interface TacticsZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface TacticsBoardData {
  version: 1;
  formation: string;
  pieces: TacticsPiece[];
  arrows: TacticsArrow[];
  zones: TacticsZone[];
}

export interface TacticsBoardRecord {
  id: string;
  name: string;
  board_type: BoardType;
  data: TacticsBoardData;
  created_at: string;
  updated_at: string;
}

export interface TacticsRosterPlayer {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
}
