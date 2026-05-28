import React from 'react';
import { Film, Star, Calendar, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface MovieData {
  id: string;
  title: string;
  rating: number;
  year: number;
  description: string;
  genre: string;
}

const movies: MovieData[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    title: "Gunslinger of the West",
    rating: 8.2,
    year: 2023,
    genre: "Western",
    description: "In the lawless Wild West, a mysterious gunslinger with a hidden past takes on a corrupt sheriff and his band of outlaws to bring justice to a small town."
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    title: "Stellar Hearts",
    rating: 7.5,
    year: 2024,
    genre: "Romance/Sci-Fi",
    description: "Two astronauts, stationed on a remote space station, fall in love amidst the isolation of deep space. But when a mysterious signal disrupts their communication, they must find a way to reconnect and survive."
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440006",
    title: "The Prophecy of Eclipse",
    rating: 8.1,
    year: 2026,
    genre: "Fantasy/Action",
    description: "In a kingdom on the brink of war, a prophecy speaks of an eclipse that will grant power to the rightful ruler. As factions vie for control, a young warrior must decide where his true loyalty lies."
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440007",
    title: "Heart of Silicon",
    rating: 7.7,
    year: 2023,
    genre: "Sci-Fi/Drama",
    description: "A brilliant scientist creates a robot with a human heart. As the robot struggles to understand emotions, it becomes entangled in a plot that could change the fate of humanity."
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440008",
    title: "The Empire's Fall",
    rating: 8.4,
    year: 2025,
    genre: "Epic/Adventure",
    description: "A legendary warrior rises to challenge the tyrannical rule of a powerful empire. As rebellion brews, the warrior must unite different factions to lead an uprising."
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440012",
    title: "Neon Shadows",
    rating: 7.9,
    year: 2022,
    genre: "Cyberpunk/Mystery",
    description: "A young detective with a dark past investigates a series of mysterious murders in a city plagued by corruption. As she digs deeper, she realizes nothing is as it seems."
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440013",
    title: "The Final Symphony",
    rating: 8.0,
    year: 2024,
    genre: "Musical/Drama",
    description: "An aging composer struggling with memory loss attempts to complete his final symphony. With the help of a young prodigy, he embarks on an emotional journey through his memories and legacy."
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440014",
    title: "Lunar Knight",
    rating: 8.3,
    year: 2025,
    genre: "Medieval/Fantasy",
    description: "A knight is chosen by an ancient order to embark on a quest under the light of the full moon. Facing mythical beasts and treacherous landscapes, he seeks a relic that could save his kingdom."
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440015",
    title: "The Abyss Awakens",
    rating: 7.2,
    year: 2023,
    genre: "Horror/Sci-Fi",
    description: "When a group of marine biologists descends into the unexplored depths of the ocean, they encounter a terrifying and ancient force. Now, they must survive as the abyss comes alive."
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440017",
    title: "Echoes of Eternity",
    rating: 7.4,
    year: 2026,
    genre: "Supernatural/Drama",
    description: "Two souls destined to meet across multiple lifetimes struggle to find each other in a chaotic world. With each incarnation, they get closer, but time itself becomes their greatest obstacle."
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440019",
    title: "Veil of Deceit",
    rating: 7.8,
    year: 2022,
    genre: "Mystery/Thriller",
    description: "A magician-turned-detective uses his skills in illusion to solve crimes. When a series of murders leaves the city in fear, he must reveal the truth hidden behind a veil of deceit."
  }
];

const MoviePortal: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-4">
        <div className="bg-indigo-600 p-2 rounded-lg text-white">
          <Film size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Movie Portal</h1>
          <p className="text-sm text-slate-500 font-medium">Educational Media Library</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {movies.map((movie) => (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col"
          >
            <div className="h-48 bg-slate-200 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <div className="absolute bottom-4 left-4 z-20">
                <span className="px-2 py-1 bg-indigo-600 text-white text-xs font-bold rounded uppercase tracking-wider">
                  {movie.genre}
                </span>
              </div>
              <div className="flex items-center justify-center h-full bg-slate-100 text-slate-300">
                <Film size={64} strokeWidth={1} />
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-slate-800 leading-tight">
                  {movie.title}
                </h3>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-full text-xs font-bold border border-amber-100">
                  <Star size={12} fill="currentColor" />
                  {movie.rating}
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-sm mb-4 font-medium">
                <Calendar size={14} />
                <span>{movie.year}</span>
              </div>

              <div className="flex gap-2 items-start text-slate-600 text-sm leading-relaxed flex-1 italic">
                <Info size={16} className="mt-1 shrink-0 text-slate-400" />
                <p>{movie.description}</p>
              </div>

              <button className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2 group">
                View Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MoviePortal;