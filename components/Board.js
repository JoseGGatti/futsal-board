import { Stage, Layer, Rect, Circle, RegularPolygon, Group, Image as KonvaImage } from "react-konva";
import { useState, useRef, useEffect } from "react";

// --- Constantes de Dimensiones Reales del Campo (En Metros) ---
const REAL_FIELD_WIDTH = 40; 
const REAL_FIELD_HEIGHT = 20; // Asumiendo una proporción típica de 2:1 para futsal 
const REAL_GOAL_WIDTH = 3;
const REAL_GOAL_HEIGHT = 2; // Altura de los postes, usada para calcular la altura de la Rect

export default function Board() {
  const containerRef = useRef(null); // Referencia al div contenedor para medir su ancho
  
  // Estado para las dimensiones dinámicas del Stage (Píxeles)
  const [boardDimensions, setBoardDimensions] = useState({
    width: 600, // Ancho inicial de escritorio
    height: 300, // Alto inicial (600/2)
    pixelsPerMeter: 15, // Píxeles por metro inicial (600/40)
  });

  const [objects, setObjects] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [image, setImage] = useState(null);
  const [selectedId, selectShape] = useState(null); 
  const shapeRefs = useRef({}); 
  
  // Usar las dimensiones del estado
  const { width: BOARD_WIDTH, height: BOARD_HEIGHT, pixelsPerMeter: PIXELS_PER_METER } = boardDimensions;

  // Recalcular dimensiones dependientes de PIXELS_PER_METER
  const GOAL_WIDTH_PX = REAL_GOAL_WIDTH * PIXELS_PER_METER;
  // Usamos una medida pequeña para la altura del poste del arco simple
  const GOAL_POST_THICKNESS_PX = 5; 


  // --- Efecto para Cargar Imagen y Calcular Dimensiones ---
  useEffect(() => {
    // Carga de la imagen de fondo
    const img = new window.Image();
    img.src = "/futsal_field.png";
    img.onload = () => {
      setImage(img);
    };

    // Función para calcular las dimensiones responsivas
    const calculateDimensions = () => {
      if (containerRef.current) {
        // Obtenemos el ancho del contenedor padre
        const containerWidth = containerRef.current.offsetWidth;
        
        // Máximo ancho de 600px para pantallas grandes, en móvil usamos casi todo el ancho.
        // Restamos un poco (e.g., 20px) para el padding/margen en pantallas pequeñas.
        const maxStageWidth = 600; 
        const newWidth = Math.min(containerWidth - 20, maxStageWidth);
        
        // Calculamos el alto manteniendo la proporción (ancho real / alto real = 40 / 20 = 2)
        const aspectRatio = REAL_FIELD_WIDTH / REAL_FIELD_HEIGHT;
        const newHeight = newWidth / aspectRatio;
        
        const newPixelsPerMeter = newWidth / REAL_FIELD_WIDTH;

        setBoardDimensions({
          width: newWidth,
          height: newHeight,
          pixelsPerMeter: newPixelsPerMeter,
        });
      }
    };

    // Calcular al montar y al cargar la imagen
    calculateDimensions(); 

    // Escuchar el evento de redimensionamiento de la ventana
    window.addEventListener('resize', calculateDimensions);

    // Limpieza del listener al desmontar el componente
    return () => {
      window.removeEventListener('resize', calculateDimensions);
    };
  }, []); 
  
  // --- Funciones de Historia y Manipulación (Sin Cambios) ---

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

    // Ajustar el radio de las figuras para que se adapten al tamaño dinámico del tablero
    // Asumiendo que el radio del jugador es 0.3 metros (30cm)
    const PLAYER_RADIUS_PX = 0.3 * PIXELS_PER_METER;
    // Asumiendo que el radio de la pelota es 0.1 metros (10cm)
    const BALL_RADIUS_PX = 0.1 * PIXELS_PER_METER;
    // Asumiendo que el radio del cono es 0.2 metros (20cm)
    const CONE_RADIUS_PX = 0.2 * PIXELS_PER_METER;


    if (selectedTool === "blue") {
      newObj = { id: Date.now(), type: "player", color: "blue", ...pointerPos, rotation: 0, radius: PLAYER_RADIUS_PX };
    } else if (selectedTool === "red") {
      newObj = { id: Date.now(), type: "player", color: "red", ...pointerPos, rotation: 0, radius: PLAYER_RADIUS_PX };
    } else if (selectedTool === "ball") {
      newObj = { id: Date.now(), type: "ball", ...pointerPos, rotation: 0, radius: BALL_RADIUS_PX };
    } else if (selectedTool === "cone") {
      newObj = { id: Date.now(), type: "cone", ...pointerPos, rotation: 0, radius: CONE_RADIUS_PX };
    } else if (selectedTool === "simple-goal") {
      newObj = {
        id: Date.now(),
        type: "simple-goal",
        x: pointerPos.x,
        y: pointerPos.y,
        width: GOAL_WIDTH_PX, 
        height: GOAL_POST_THICKNESS_PX,
        color: "white",
      };
    }

    if (newObj) {
      saveHistory([...objects, newObj]);
      selectShape(newObj.id);
    }
  };

  return (
    // Agregamos la referencia al contenedor para medir su ancho
    <div className="flex flex-col items-center w-full" ref={containerRef}>
      
      {/* --- Controles de Herramientas (Botones Compactos para Móvil) --- */}
      <div className="flex gap-1 mb-3 flex-wrap justify-center p-2 bg-gray-100 rounded-lg shadow-md w-full max-w-lg">
        {/* Usamos clases `px-3 py-1 text-sm` para hacerlo más compacto en móvil */}
        <button className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded" onClick={() => (window.selectedTool = "blue")}>Azul</button>
        <button className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded" onClick={() => (window.selectedTool = "red")}>Rojo</button>
        <button className="px-3 py-1 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded" onClick={() => (window.selectedTool = "ball")}>Pelota</button>
        <button className="px-3 py-1 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded" onClick={() => (window.selectedTool = "cone")}>Cono</button>
        <button className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-800 text-white rounded" onClick={() => (window.selectedTool = "simple-goal")}>Arco</button>
      </div>

      {/* --- Controles de Historia (Botones Compactos para Móvil) --- */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-1 text-sm rounded ${historyStep > 0 ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          onClick={undo}
          disabled={historyStep === 0}
        >
          Deshacer
        </button>
        <button
          className={`px-3 py-1 text-sm rounded ${historyStep < history.length - 1 ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          onClick={redo}
          disabled={historyStep === history.length - 1}
        >
          Rehacer
        </button>
        <button
          className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded"
          onClick={clearBoard}
        >
          Limpiar
        </button>
      </div>

      {/* --- Stage de Konva (Dimensiones Dinámicas) --- */}
      <Stage
        width={BOARD_WIDTH} // Usar ancho dinámico
        height={BOARD_HEIGHT} // Usar alto dinámico
        className="rounded-lg shadow-xl border-2 border-gray-400"
        onClick={handleClick}
        onMouseDown={checkDeselect} 
        onTouchStart={checkDeselect} // Importante para móvil
      >
        <Layer>
          {/* Imagen de fondo */}
          {image && (
            <KonvaImage
              image={image}
              x={0}
              y={0}
              width={BOARD_WIDTH} // Usar ancho dinámico
              height={BOARD_HEIGHT} // Usar alto dinámico
              name="background"
            />
          )}

          {/* Mapeo de Objetos */}
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
                onTouchStart: (e) => { // Importante para la selección táctil
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
                  radius={obj.radius} // Usar radio dinámico
                  fill={obj.color}
                />
              );
            } else if (obj.type === "ball") {
              return (
                <Circle
                  {...commonProps}
                  radius={obj.radius} // Usar radio dinámico
                  fill="white"
                  stroke="black"
                />
              );
            } else if (obj.type === "cone") {
              return (
                <RegularPolygon
                  {...commonProps}
                  sides={3}
                  radius={obj.radius} // Usar radio dinámico
                  fill="orange"
                />
              );
            } else if (obj.type === "simple-goal") {
              const { width, height, color } = obj; 

              return (
                <Rect
                  {...commonProps}
                  width={width} // Usar ancho dinámico (GOAL_WIDTH_PX)
                  height={height} // Usar altura fija pequeña (GOAL_POST_THICKNESS_PX)
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
      
      <footer className="mt-6 p-3 text-sm text-gray-600 border-t border-gray-300 w-full text-center">
        &copy; {new Date().getFullYear()} Creado por <strong>José Gatti</strong>. Todos los derechos reservados.
      </footer>
      
    </div>
  );
}