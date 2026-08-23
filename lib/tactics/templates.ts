import type { BoardType, TacticsBoardData } from "@/types/tactics";

function baseBoard(formation: string, pieces: TacticsBoardData["pieces"]): TacticsBoardData {
  return {
    version: 1,
    formation,
    pieces,
    arrows: [],
    zones: [],
  };
}

export function createBoardTemplate(boardType: BoardType): TacticsBoardData {
  if (boardType === "7v7") {
    return baseBoard("2-3-1", [
      { id: "p-gk", kind: "player", label: "MV", x: 8, y: 50, color: "#c8a443" },
      { id: "p-b1", kind: "player", label: "B1", x: 24, y: 32, color: "#c8a443" },
      { id: "p-b2", kind: "player", label: "B2", x: 24, y: 68, color: "#c8a443" },
      { id: "p-mf1", kind: "player", label: "MF1", x: 45, y: 22, color: "#c8a443" },
      { id: "p-mf2", kind: "player", label: "MF2", x: 45, y: 50, color: "#c8a443" },
      { id: "p-mf3", kind: "player", label: "MF3", x: 45, y: 78, color: "#c8a443" },
      { id: "p-fw", kind: "player", label: "FW", x: 70, y: 50, color: "#c8a443" },
    ]);
  }

  if (boardType === "9v9") {
    return baseBoard("3-2-3", [
      { id: "p-gk", kind: "player", label: "MV", x: 8, y: 50, color: "#c8a443" },
      { id: "p-b1", kind: "player", label: "B1", x: 22, y: 25, color: "#c8a443" },
      { id: "p-b2", kind: "player", label: "B2", x: 22, y: 50, color: "#c8a443" },
      { id: "p-b3", kind: "player", label: "B3", x: 22, y: 75, color: "#c8a443" },
      { id: "p-mf1", kind: "player", label: "MF1", x: 42, y: 35, color: "#c8a443" },
      { id: "p-mf2", kind: "player", label: "MF2", x: 42, y: 65, color: "#c8a443" },
      { id: "p-at1", kind: "player", label: "AT1", x: 62, y: 20, color: "#c8a443" },
      { id: "p-at2", kind: "player", label: "AT2", x: 62, y: 50, color: "#c8a443" },
      { id: "p-at3", kind: "player", label: "AT3", x: 62, y: 80, color: "#c8a443" },
    ]);
  }

  if (boardType === "training") {
    return baseBoard("Träningsövning", [
      { id: "cone-1", kind: "cone", label: "K1", x: 20, y: 35 },
      { id: "cone-2", kind: "cone", label: "K2", x: 20, y: 65 },
      { id: "cone-3", kind: "cone", label: "K3", x: 42, y: 35 },
      { id: "cone-4", kind: "cone", label: "K4", x: 42, y: 65 },
      { id: "ball-1", kind: "ball", label: "B", x: 16, y: 50 },
      { id: "player-1", kind: "player", label: "A", x: 10, y: 50, color: "#c8a443" },
      { id: "player-2", kind: "player", label: "B", x: 50, y: 50, color: "#c8a443" },
    ]);
  }

  return baseBoard("Fri", []);
}
