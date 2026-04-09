import { Plus, Minus } from "lucide-react";

interface TournamentPlayersProps {
  players: string[];
  onPlayersChange: (players: string[]) => void;
}

const MIN_PLAYERS = 5;
const MAX_PLAYERS = 7;

const TournamentPlayers = ({ players, onPlayersChange }: TournamentPlayersProps) => {
  const updatePlayer = (index: number, value: string) => {
    const updated = [...players];
    updated[index] = value;
    onPlayersChange(updated);
  };

  const addPlayer = () => {
    if (players.length < MAX_PLAYERS) onPlayersChange([...players, ""]);
  };

  const removePlayer = () => {
    if (players.length > MIN_PLAYERS) onPlayersChange(players.slice(0, -1));
  };

  return (
    <div className="animate-fade-in space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          الاسم رباعي باللغة العربية — من {MIN_PLAYERS} إلى {MAX_PLAYERS} لاعبين
        </p>
        <span className="text-xs font-bold text-primary">
          {players.length} / {MAX_PLAYERS}
        </span>
      </div>

      <div className="space-y-2">
        {players.map((player, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-5 text-center shrink-0 font-bold">
              {index + 1}
            </span>
            <input
              type="text"
              value={player}
              onChange={(e) => updatePlayer(index, e.target.value)}
              placeholder={`اسم اللاعب ${index + 1}`}
              className="gform-input text-right text-sm flex-1"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 pt-1">
        <button
          type="button"
          onClick={removePlayer}
          disabled={players.length <= MIN_PLAYERS}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
          حذف لاعب
        </button>
        <button
          type="button"
          onClick={addPlayer}
          disabled={players.length >= MAX_PLAYERS}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 disabled:opacity-30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          إضافة لاعب
        </button>
      </div>

      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between text-lg font-bold text-primary">
          <span>الإجمالي المطلوب:</span>
          <span>600 جنيه</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">سعر الاشتراك للفريق كامل</p>
      </div>
    </div>
  );
};

export default TournamentPlayers;
