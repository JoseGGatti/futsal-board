import { Stage, Layer, Rect, Circle, RegularPolygon, Group, Image as KonvaImage } from "react-konva";
import { useState, useRef, useEffect } from "react";

const BOARD_WIDTH = 600;
const BOARD_HEIGHT = 400;

// ... (Constantes de dimensiones) ...
const REAL_FIELD_WIDTH = 40;
const REAL_GOAL_WIDTH = 3;
const REAL_GOAL_HEIGHT = 2;

const PIXELS_PER_METER = BOARD_WIDTH / REAL_FIELD_WIDTH;
const GOAL_WIDTH_PX = REAL_GOAL_WIDTH * PIXELS_PER_METER;
const GOAL_HEIGHT_PX = REAL_GOAL_HEIGHT * PIXELS_PER_METER;


export default function Board() {
  const [objects, setObjects] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [image, setImage] = useState(null);
  const [selectedId, selectShape] = useState(null); 

  const shapeRefs = useRef({}); 

  useEffect(() => {
    const img = new window.Image();
    img.src = "/futsal_field.png";
    img.onload = () => {
      setImage(img);
    };
  }, []);
  
  const saveHistory = (newObjects) => {
    const newHistory = history.slice(0, historyStep + 1);
    if (JSON.stringify(newHistory[newHistory.length - 1]) !== JSON.stringify(newObjects)) {
      setHistory([...newHistory, newObjects]);
      setHistoryStep(newHistory.length);
    }
    setObjects(newObjects);
  };

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      setObjects(history[newStep]);
      selectShape(null);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      setObjects(history[newStep]);
      selectShape(null);
    }
  };

  const clearBoard = () => {
    if (objects.length > 0) {
      saveHistory([]);
      selectShape(null);
    }
  };

  const handleDragEnd = (id, e) => {
    const node = e.target;
    const { x, y } = node.position();
    const newObjects = objects.map((o) => (o.id === id ? { ...o, x, y } : o));
    saveHistory(newObjects);
  };

  const handleDragStart = () => { 
    // Mantenemos la definición
  };

  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  const handleClick = (e) => {
    const selectedTool = window.selectedTool;
    
    // Si el clic fue en un objeto, no creamos nada.
    if (e.target.attrs.id) return;

    // Si no hay herramienta activa, salimos.
    if (!selectedTool) return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    let newObj = null;

    if (selectedTool === "blue") {
      newObj = { id: Date.now(), type: "player", color: "blue", ...pointerPos, rotation: 0 };
    } else if (selectedTool === "red") {
      newObj = { id: Date.now(), type: "player", color: "red", ...pointerPos, rotation: 0 };
    } else if (selectedTool === "ball") {
      newObj = { id: Date.now(), type: "ball", ...pointerPos, rotation: 0 };
    } else if (selectedTool === "cone") {
      newObj = { id: Date.now(), type: "cone", ...pointerPos, rotation: 0 };
    } else if (selectedTool === "simple-goal") {
      const postThickness = 5;
      newObj = {
        id: Date.now(),
        type: "simple-goal",
        x: pointerPos.x,
        y: pointerPos.y,
        width: GOAL_WIDTH_PX, 
        height: postThickness,
        color: "white",
      };
    }

    if (newObj) {
      saveHistory([...objects, newObj]);
      selectShape(newObj.id);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* <h1>Tablero Táctico - Futsal</h1> - Asumiendo que está en el componente padre */}

      <div className="flex gap-2 mb-3 flex-wrap justify-center p-2 bg-gray-100 rounded-lg shadow-md">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => (window.selectedTool = "blue")}>Jugador Azul</button>
        <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => (window.selectedTool = "red")}>Jugador Rojo</button>
        <button className="px-4 py-2 bg-yellow-500 text-white rounded" onClick={() => (window.selectedTool = "ball")}>Pelota</button>
        <button className="px-4 py-2 bg-orange-500 text-white rounded" onClick={() => (window.selectedTool = "cone")}>Cono</button>
        <button className="px-4 py-2 bg-gray-700 text-white rounded" onClick={() => (window.selectedTool = "simple-goal")}>Arco</button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded ${historyStep > 0 ? 'bg-indigo-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          onClick={undo}
          disabled={historyStep === 0}
        >
          Deshacer Anterior
        </button>
        <button
          className={`px-4 py-2 rounded ${historyStep < history.length - 1 ? 'bg-indigo-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          onClick={redo}
          disabled={historyStep === history.length - 1}
        >
          Rehacer Anterior
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded"
          onClick={clearBoard}
        >
          Limpiar
        </button>
      </div>

      <Stage
        width={BOARD_WIDTH}
        height={BOARD_HEIGHT}
        className="rounded-lg shadow-lg"
        onClick={handleClick}
        onMouseDown={checkDeselect} 
        onTouchStart={checkDeselect}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              x={0}
              y={0}
              width={BOARD_WIDTH}
              height={BOARD_HEIGHT}
              name="background"
            />
          )}

          {objects.map((obj) => {
            const commonProps = {
                key: obj.id,
                id: obj.id.toString(),
                x: obj.x,
                y: obj.y,
                draggable: true,
                onDragEnd: (e) => handleDragEnd(obj.id, e),
                onDragStart: handleDragStart,
                onMouseDown: (e) => {
                    if(window.selectedTool) {
                        window.selectedTool = null;
                    }
                    selectShape(obj.id);
                    e.cancelBubble = true; 
                },
                onTouchStart: (e) => {
                    if(window.selectedTool) {
                        window.selectedTool = null;
                    }
                    selectShape(obj.id);
                    e.cancelBubble = true;
                },
                ref: node => shapeRefs.current[obj.id] = node
            };

            if (obj.type === "player") {
              return (
                <Circle
                  {...commonProps}
                  radius={15}
                  fill={obj.color}
                />
              );
            } else if (obj.type === "ball") {
              return (
                <Circle
                  {...commonProps}
                  radius={8}
                  fill="white"
                  stroke="black"
                />
              );
            } else if (obj.type === "cone") {
              return (
                <RegularPolygon
                  {...commonProps}
                  sides={3}
                  radius={12}
                  fill="orange"
                />
              );
            } else if (obj.type === "simple-goal") {
              const { width, height, color } = obj; 

              return (
                <Rect
                  {...commonProps}
                  width={width}
                  height={height}
                  fill={color}
                  offsetX={width / 2} 
                  offsetY={height / 2} 
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
      
      {/* 💡 PIE DE PÁGINA ACTUALIZADO con etiqueta <strong> */}
      <footer className="mt-6 p-3 text-sm text-gray-600 border-t border-gray-300 w-full text-center">
        &copy; {new Date().getFullYear()} Creado por <strong>José Gatti</strong>. Todos los derechos reservados.
      </footer>
      
    </div>
  );
}