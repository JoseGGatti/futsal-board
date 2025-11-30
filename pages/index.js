
import Board from "../components/Board";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
       <h1 className="text-2xl font-bold mb-4">Tablero Táctico - Futsal</h1>

      <Board />
    </div>
  );
}
