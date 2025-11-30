import { Stage, Layer, Rect, Circle, RegularPolygon } from "react-konva";
import { useState } from "react";

export default function Board() {
  const [objects, setObjects] = useState([]);

  const handleClick = (e) => {
    const selectedTool = window.selectedTool;
    if (!selectedTool) return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    let newObj = null;

    if (selectedTool === "blue")
      newObj = { id: Date.now(), type: "player", color: "blue", ...pointerPos };
    else if (selectedTool === "red")
      newObj = { id: Date.now(), type: "player", color: "red", ...pointerPos };
    else if (selectedTool === "ball")
      newObj = { id: Date.now(), type: "ball", ...pointerPos };
    else if (selectedTool === "cone")
      newObj = { id: Date.now(), type: "cone", ...pointerPos };

    if (newObj) setObjects([...objects, newObj]);
  };

  const handleDragMove = (id, e) => {
    const { x, y } = e.target.position();
    setObjects(objects.map((o) => (o.id === id ? { ...o, x, y } : o)));
  };

  return (
    <div className="flex flex-col items-center">
      {/* Menú de herramientas */}
      <div className="flex gap-2 mb-3">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => (window.selectedTool = "blue")}>
          Jugador Azul
        </button>
        <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => (window.selectedTool = "red")}>
          Jugador Rojo
        </button>
        <button className="px-4 py-2 bg-yellow-500 text-white rounded" onClick={() => (window.selectedTool = "ball")}>
          Pelota
        </button>
        <button className="px-4 py-2 bg-orange-500 text-white rounded" onClick={() => (window.selectedTool = "cone")}>
          Cono
        </button>
      </div>

      {/* Cancha */}
      <Stage width={600} height={400} className="bg-green-600 rounded-lg shadow-lg" onClick={handleClick}>
        <Layer>
          <Rect x={0} y={0} width={600} height={400} stroke="white" strokeWidth={4} />
          <Rect x={200} y={0} width={200} height={400} stroke="white" strokeWidth={2} />
          <Circle x={300} y={200} radius={40} stroke="white" strokeWidth={2} />

          {/* Objetos */}
          {objects.map((obj) => {
            if (obj.type === "player") {
              return (
                <Circle
                  key={obj.id}
                  x={obj.x}
                  y={obj.y}
                  radius={15}
                  fill={obj.color}
                  draggable
                  onDragMove={(e) => handleDragMove(obj.id, e)}
                />
              );
            } else if (obj.type === "ball") {
              return (
                <Circle
                  key={obj.id}
                  x={obj.x}
                  y={obj.y}
                  radius={8}
                  fill="white"
                  stroke="black"
                  draggable
                  onDragMove={(e) => handleDragMove(obj.id, e)}
                />
              );
            } else if (obj.type === "cone") {
              return (
                <RegularPolygon
                  key={obj.id}
                  x={obj.x}
                  y={obj.y}
                  sides={3}
                  radius={12}
                  fill="orange"
                  draggable
                  onDragMove={(e) => handleDragMove(obj.id, e)}
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
}
