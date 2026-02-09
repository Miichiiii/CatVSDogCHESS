import ChessGame from "@/components/chess-game";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <div className="space-y-4 mb-8 text-center">
        <h1 className="text-lg md:text-xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
          Cats vs Dogs Chess
        </h1>
        <p className="text-base md:text-lg text-gray-700 max-w-2xl">
          A modern twist on classic chess with special abilities, crazy mode,
          and AI challenges
        </p>
      </div>
      <ChessGame />
    </main>
  );
}
