import { Stage, Layer, Rect, Circle } from "react-konva";
import { useState } from "react";

export default function Board() {
  const [players, setPlayers] = useState([
    { id: 1, x: 100, y: 100, color: "blue" },
    { id: 2, x: 200, y: 200, color: "red" },
  ]);

  const handleDragMove = (id, e) => {
    const { x, y } = e.target.position();
    setPlayers(players.map(p => (p.id === id ? { ...p, x, y } : p)));
    localStorage.setItem("players", JSON.stringify(players));
  };

  return (
    <Stage width={600} height={400} className="bg-green-600 rounded-lg shadow-md">
      <Layer>
        {/* Cancha */}
        <Rect x={0} y={0} width={600} height={400} stroke="white" strokeWidth={4} />
        <Rect x={200} y={0} width={200} height={400} stroke="white" strokeWidth={2} />
        <Circle x={300} y={200} radius={40} stroke="white" strokeWidth={2} />

        {/* Jugadores */}
        {players.map(p => (
          <Circle
            key={p.id}
            x={p.x}
            y={p.y}
            radius={15}
            fill={p.color}
            draggable
            onDragMove={(e) => handleDragMove(p.id, e)}
          />
        ))}
      </Layer>
    </Stage>
  );
}
