"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { DndContext, type DragEndEvent, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  ArrowType,
  BoardType,
  TacticsArrow,
  TacticsBoardData,
  TacticsBoardRecord,
  TacticsPiece,
  TacticsRosterPlayer,
  TacticsZone,
} from "@/types/tactics";

type ToolMode = "move" | "arrow" | "pass" | "run" | "press" | "zone";

interface TacticalBoardClientProps {
  boards: TacticsBoardRecord[];
  roster: TacticsRosterPlayer[];
  selectedBoardId?: string;
  onCreateBoard: (formData: FormData) => Promise<void>;
  onRenameBoard: (formData: FormData) => Promise<void>;
  onSaveBoard: (formData: FormData) => Promise<void>;
  onDuplicateBoard: (formData: FormData) => Promise<void>;
  onClearBoard: (formData: FormData) => Promise<void>;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function pieceStyle(piece: TacticsPiece) {
  if (piece.kind === "opponent") return "bg-white text-black border-white";
  if (piece.kind === "ball") return "bg-amber-200 text-black border-amber-200";
  if (piece.kind === "cone") return "bg-orange-500 text-white border-orange-400";
  return "bg-accent text-black border-accent";
}

function arrowColor(type: ArrowType) {
  if (type === "pass") return "#facc15";
  if (type === "run") return "#22c55e";
  if (type === "press") return "#ef4444";
  return "#f8f8f8";
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function DraggablePiece({ piece, selected, onSelect }: { piece: TacticsPiece; selected: boolean; onSelect: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: piece.id });

  const style = {
    left: `${piece.x}%`,
    top: `${piece.y}%`,
    transform: `${CSS.Translate.toString(transform)} translate(-50%, -50%)`,
    zIndex: isDragging ? 60 : selected ? 55 : 40,
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      onClick={() => onSelect(piece.id)}
      className={`absolute h-9 min-w-9 rounded-full border px-2 text-xs font-bold shadow-sm ${pieceStyle(piece)} ${
        selected ? "ring-2 ring-white" : ""
      }`}
      {...listeners}
      {...attributes}
    >
      {piece.number ?? piece.label}
    </button>
  );
}

export function TacticalBoardClient({
  boards,
  roster,
  selectedBoardId,
  onCreateBoard,
  onRenameBoard,
  onSaveBoard,
  onDuplicateBoard,
  onClearBoard,
}: TacticalBoardClientProps) {
  const selectedBoard = useMemo(() => {
    if (selectedBoardId) {
      return boards.find((board) => board.id === selectedBoardId) ?? boards[0] ?? null;
    }
    return boards[0] ?? null;
  }, [boards, selectedBoardId]);

  const [boardName, setBoardName] = useState(selectedBoard?.name ?? "");
  const [boardType, setBoardType] = useState<BoardType>(selectedBoard?.board_type ?? "7v7");
  const [data, setData] = useState<TacticsBoardData>(
    selectedBoard?.data ?? {
      version: 1,
      formation: "2-3-1",
      pieces: [],
      arrows: [],
      zones: [],
    },
  );
  const [toolMode, setToolMode] = useState<ToolMode>("move");
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [rosterPlayerId, setRosterPlayerId] = useState<string>(roster[0]?.id ?? "");

  const boardRef = useRef<HTMLDivElement | null>(null);

  if (!selectedBoard) {
    return (
      <Card>
        <h2 className="text-2xl text-foreground">Taktiktavla</h2>
        <p className="mt-2 text-sm text-muted">Skapa första tavlan för att komma igång.</p>
        <form action={onCreateBoard} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            name="name"
            placeholder="T.ex. Matchplan 7v7"
            required
            className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent md:col-span-2"
          />
          <select
            name="boardType"
            className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent"
          >
            <option value="7v7">7v7</option>
            <option value="9v9">9v9</option>
            <option value="training">Träningsövning</option>
            <option value="custom">Fri</option>
          </select>
          <Button type="submit">Skapa tavla</Button>
        </form>
      </Card>
    );
  }

  const serializedData = JSON.stringify(data);

  function getPointFromMouse(event: React.MouseEvent<HTMLDivElement>) {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100),
    };
  }

  function handleBoardClick(event: React.MouseEvent<HTMLDivElement>) {
    if (toolMode === "move") {
      setSelectedArrowId(null);
      setSelectedZoneId(null);
      return;
    }

    const point = getPointFromMouse(event);
    if (!point) return;

    if (!anchorPoint) {
      setAnchorPoint(point);
      return;
    }

    if (toolMode === "zone") {
      const zone: TacticsZone = {
        id: uid("zone"),
        x: Math.min(anchorPoint.x, point.x),
        y: Math.min(anchorPoint.y, point.y),
        width: Math.abs(point.x - anchorPoint.x),
        height: Math.abs(point.y - anchorPoint.y),
      };
      setData((current) => ({ ...current, zones: [...current.zones, zone] }));
    } else {
      const type = toolMode as ArrowType;
      const arrow: TacticsArrow = {
        id: uid("arrow"),
        type,
        from: anchorPoint,
        to: point,
      };
      setData((current) => ({ ...current, arrows: [...current.arrows, arrow] }));
    }

    setAnchorPoint(null);
  }

  function onDragEnd(event: DragEndEvent) {
    if (!boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const dx = (event.delta.x / rect.width) * 100;
    const dy = (event.delta.y / rect.height) * 100;

    setData((current) => ({
      ...current,
      pieces: current.pieces.map((piece) =>
        piece.id === String(event.active.id)
          ? { ...piece, x: clamp(piece.x + dx), y: clamp(piece.y + dy) }
          : piece,
      ),
    }));
  }

  function addPiece(kind: TacticsPiece["kind"]) {
    const id = uid(kind);
    const color = kind === "opponent" ? "#f8f8f8" : kind === "player" ? "#c8a443" : undefined;

    const piece: TacticsPiece = {
      id,
      kind,
      label: kind === "ball" ? "B" : kind === "cone" ? "K" : kind === "opponent" ? "M" : "S",
      x: 50,
      y: 50,
      color,
    };

    setData((current) => ({ ...current, pieces: [...current.pieces, piece] }));
  }

  function addRosterPlayer() {
    const selectedPlayer = roster.find((player) => player.id === rosterPlayerId);
    if (!selectedPlayer) return;

    const piece: TacticsPiece = {
      id: uid("player"),
      kind: "player",
      label: selectedPlayer.first_name.slice(0, 2).toUpperCase(),
      number: selectedPlayer.jersey_number ?? undefined,
      x: 50,
      y: 50,
      color: "#c8a443",
    };

    setData((current) => ({ ...current, pieces: [...current.pieces, piece] }));
  }

  function removeSelected() {
    if (selectedPieceId) {
      setData((current) => ({
        ...current,
        pieces: current.pieces.filter((piece) => piece.id !== selectedPieceId),
      }));
      setSelectedPieceId(null);
      return;
    }

    if (selectedArrowId) {
      setData((current) => ({
        ...current,
        arrows: current.arrows.filter((arrow) => arrow.id !== selectedArrowId),
      }));
      setSelectedArrowId(null);
      return;
    }

    if (selectedZoneId) {
      setData((current) => ({
        ...current,
        zones: current.zones.filter((zone) => zone.id !== selectedZoneId),
      }));
      setSelectedZoneId(null);
    }
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/tactics?boardId=${board.id}`}
              className={`rounded-md border px-3 py-2 text-sm ${
                board.id === selectedBoard.id
                  ? "border-accent bg-accent text-black"
                  : "border-border bg-panel-elevated text-foreground"
              }`}
            >
              {board.name}
            </Link>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
          <form action={onCreateBoard} className="contents">
            <input
              name="name"
              placeholder="Ny tavla"
              required
              className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent md:col-span-2"
            />
            <select
              name="boardType"
              className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent"
              defaultValue="7v7"
            >
              <option value="7v7">7v7</option>
              <option value="9v9">9v9</option>
              <option value="training">Träningsövning</option>
              <option value="custom">Fri</option>
            </select>
            <Button type="submit" className="md:col-span-1">Skapa</Button>
          </form>

          <form action={onRenameBoard} className="contents">
            <input type="hidden" name="boardId" value={selectedBoard.id} />
            <input
              name="name"
              value={boardName}
              onChange={(event) => setBoardName(event.target.value)}
              className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent md:col-span-2"
            />
            <Button type="submit" variant="secondary">Byt namn</Button>
          </form>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
        <Card className="space-y-4">
          <div>
            <h3 className="text-xl text-foreground">Verktyg</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["move", "arrow", "pass", "run", "press", "zone"] as ToolMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setToolMode(mode);
                    setAnchorPoint(null);
                  }}
                  className={`h-9 rounded-md border text-xs ${
                    toolMode === mode ? "border-accent bg-accent text-black" : "border-border bg-panel-elevated text-foreground"
                  }`}
                >
                  {mode === "move" ? "Flytta" : mode === "zone" ? "Zon" : mode.toUpperCase()}
                </button>
              ))}
            </div>
            {anchorPoint ? <p className="mt-2 text-xs text-muted">Punkt A vald. Klicka för punkt B.</p> : null}
          </div>

          <div>
            <h3 className="text-xl text-foreground">Lägg till objekt</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" className="h-9 text-xs" onClick={() => addPiece("player")}>Spelare</Button>
              <Button type="button" variant="secondary" className="h-9 text-xs" onClick={() => addPiece("opponent")}>Motståndare</Button>
              <Button type="button" variant="secondary" className="h-9 text-xs" onClick={() => addPiece("ball")}>Boll</Button>
              <Button type="button" variant="secondary" className="h-9 text-xs" onClick={() => addPiece("cone")}>Kona</Button>
            </div>

            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted">Lägg till från trupp</p>
              <select
                value={rosterPlayerId}
                onChange={(event) => setRosterPlayerId(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-panel-elevated px-2 text-sm text-foreground"
              >
                {roster.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.first_name} {player.last_name} {player.jersey_number ? `#${player.jersey_number}` : ""}
                  </option>
                ))}
              </select>
              <Button type="button" variant="secondary" className="h-9 w-full text-xs" onClick={addRosterPlayer}>
                Lägg till vald spelare
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-xl text-foreground">Tavla</h3>
            <div className="mt-2 space-y-2">
              <div>
                <label className="mb-1 block text-xs text-muted">Typ</label>
                <select
                  value={boardType}
                  onChange={(event) => setBoardType(event.target.value as BoardType)}
                  className="h-10 w-full rounded-lg border border-border bg-panel-elevated px-2 text-sm text-foreground"
                >
                  <option value="7v7">7v7</option>
                  <option value="9v9">9v9</option>
                  <option value="training">Träningsövning</option>
                  <option value="custom">Fri</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Formation / Rubrik</label>
                <input
                  value={data.formation}
                  onChange={(event) => setData((current) => ({ ...current, formation: event.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-panel-elevated px-2 text-sm text-foreground"
                />
              </div>
            </div>
          </div>

          <Button type="button" variant="ghost" className="w-full" onClick={removeSelected}>
            Ta bort markerat objekt
          </Button>

          <form action={onSaveBoard} className="space-y-2">
            <input type="hidden" name="boardId" value={selectedBoard.id} />
            <input type="hidden" name="boardType" value={boardType} />
            <textarea name="data" value={serializedData} readOnly className="hidden" />
            <Button type="submit" className="w-full">Spara tavla</Button>
          </form>

          <form action={onDuplicateBoard}>
            <input type="hidden" name="boardId" value={selectedBoard.id} />
            <Button type="submit" variant="secondary" className="w-full">Duplicera tavla</Button>
          </form>

          <form action={onClearBoard}>
            <input type="hidden" name="boardId" value={selectedBoard.id} />
            <input type="hidden" name="boardType" value={boardType} />
            <Button type="submit" variant="secondary" className="w-full">Rensa till template</Button>
          </form>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-2xl text-foreground">{boardName}</h3>
            <p className="text-sm text-muted">{data.formation}</p>
          </div>

          <DndContext onDragEnd={onDragEnd}>
            <div
              ref={boardRef}
              onClick={handleBoardClick}
              className="relative aspect-[10/6] w-full overflow-hidden rounded-xl border border-white/20 bg-[linear-gradient(180deg,#2f6f3a_0%,#245a30_100%)]"
            >
              <div className="absolute inset-2 rounded-lg border border-white/80" />
              <div className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-white/70" />
              <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70" />
              <div className="absolute left-2 top-1/2 h-24 w-12 -translate-y-1/2 border border-white/70" />
              <div className="absolute right-2 top-1/2 h-24 w-12 -translate-y-1/2 border border-white/70" />

              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 60" preserveAspectRatio="none">
                <defs>
                  <marker id="arrowHead" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                    <path d="M0,0 L4,2 L0,4 z" fill="#f8f8f8" />
                  </marker>
                  <marker id="arrowPass" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                    <path d="M0,0 L4,2 L0,4 z" fill="#facc15" />
                  </marker>
                  <marker id="arrowRun" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                    <path d="M0,0 L4,2 L0,4 z" fill="#22c55e" />
                  </marker>
                  <marker id="arrowPress" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                    <path d="M0,0 L4,2 L0,4 z" fill="#ef4444" />
                  </marker>
                </defs>

                {data.zones.map((zone) => (
                  <rect
                    key={zone.id}
                    x={(zone.x / 100) * 100}
                    y={(zone.y / 100) * 60}
                    width={(zone.width / 100) * 100}
                    height={(zone.height / 100) * 60}
                    fill={selectedZoneId === zone.id ? "rgba(250, 204, 21, 0.35)" : "rgba(250, 204, 21, 0.2)"}
                    stroke={selectedZoneId === zone.id ? "#fde047" : "#facc15"}
                    strokeDasharray="3 2"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedZoneId(zone.id);
                      setSelectedArrowId(null);
                      setSelectedPieceId(null);
                    }}
                  />
                ))}

                {data.arrows.map((arrow) => {
                  const marker = arrow.type === "pass" ? "arrowPass" : arrow.type === "run" ? "arrowRun" : arrow.type === "press" ? "arrowPress" : "arrowHead";
                  return (
                    <line
                      key={arrow.id}
                      x1={arrow.from.x}
                      y1={(arrow.from.y / 100) * 60}
                      x2={arrow.to.x}
                      y2={(arrow.to.y / 100) * 60}
                      stroke={selectedArrowId === arrow.id ? "#ffffff" : arrowColor(arrow.type)}
                      strokeWidth={selectedArrowId === arrow.id ? 1.1 : 0.8}
                      strokeDasharray={arrow.type === "pass" ? "1.4 1" : arrow.type === "press" ? "0.6 0.8" : undefined}
                      markerEnd={`url(#${marker})`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedArrowId(arrow.id);
                        setSelectedZoneId(null);
                        setSelectedPieceId(null);
                      }}
                    />
                  );
                })}
              </svg>

              {data.pieces.map((piece) => (
                <DraggablePiece
                  key={piece.id}
                  piece={piece}
                  selected={selectedPieceId === piece.id}
                  onSelect={(id) => {
                    setSelectedPieceId(id);
                    setSelectedArrowId(null);
                    setSelectedZoneId(null);
                  }}
                />
              ))}

              {anchorPoint ? (
                <div
                  className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-accent"
                  style={{ left: `${anchorPoint.x}%`, top: `${anchorPoint.y}%` }}
                />
              ) : null}
            </div>
          </DndContext>
        </Card>
      </section>

      <Card>
        <h3 className="text-xl text-foreground">Användning</h3>
        <p className="mt-2 text-sm text-muted">
          Den här tavlan fungerar både för matchplaner och träningsövningar. Välj template via tavlans typ,
          bygg scenen med spelare/objekt, lägg pilar eller zoner och spara.
        </p>
      </Card>
    </div>
  );
}
