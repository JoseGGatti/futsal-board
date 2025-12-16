import Board from "../components/Board";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 w-full"> {/* <-- AGREGADO w-full */}
       <h1 className="text-xl font-bold mb-4 md:text-2xl">Tablero Táctico - Futsal</h1> {/* Ajuste de texto para móvil */}

      <Board />
    </div>
  );
}