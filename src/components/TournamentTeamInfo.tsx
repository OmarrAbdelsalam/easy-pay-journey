interface TournamentTeamInfoProps {
  teamInfo: {
    teamName: string;
    captainName: string;
    captainPhone: string;
    year: string;
    players: string[];
  };
  onTeamInfoChange: (info: any) => void;
}

const TournamentTeamInfo = ({ teamInfo, onTeamInfoChange }: TournamentTeamInfoProps) => {
  const years = ["أولى", "تانية", "تالتة", "رابعة", "خريج"];

  return (
    <div className="animate-fade-in space-y-4 md:space-y-5" dir="rtl">
      <div>
        <label className="block text-sm md:text-base font-medium text-foreground mb-1.5 text-right">
          اسم الفريق <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={teamInfo.teamName}
          onChange={(e) => onTeamInfoChange({ ...teamInfo, teamName: e.target.value })}
          placeholder="اسم الفريق"
          className="gform-input text-right text-sm md:text-base"
        />
      </div>

      <div>
        <label className="block text-sm md:text-base font-medium text-foreground mb-1.5 text-right">
          اسم كابتن الفريق (رباعي) <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={teamInfo.captainName}
          onChange={(e) => onTeamInfoChange({ ...teamInfo, captainName: e.target.value })}
          placeholder="مثال: عمر أحمد محمد علي"
          className="gform-input text-right text-sm md:text-base"
        />
      </div>

      <div>
        <label className="block text-sm md:text-base font-medium text-foreground mb-1.5 text-right">
          رقم واتساب الكابتن <span className="text-destructive">*</span>
        </label>
        <input
          type="tel"
          value={teamInfo.captainPhone}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").slice(0, 11);
            onTeamInfoChange({ ...teamInfo, captainPhone: value });
          }}
          placeholder="01xxxxxxxxx"
          maxLength={11}
          className={`gform-input text-sm md:text-base ${
            teamInfo.captainPhone.length > 0 && teamInfo.captainPhone.length < 11
              ? "border-destructive focus:border-destructive"
              : ""
          }`}
          dir="ltr"
        />
        {teamInfo.captainPhone.length > 0 && teamInfo.captainPhone.length < 11 && (
          <p className="text-xs text-destructive mt-1">
            الرقم لازم يكون 11 رقم ({teamInfo.captainPhone.length}/11)
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm md:text-base font-medium text-foreground mb-1.5 text-right">
          السنة الدراسية للكابتن <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => onTeamInfoChange({ ...teamInfo, year })}
              className={`py-2 px-1 rounded-lg border text-sm md:text-base font-medium transition-all ${
                teamInfo.year === year
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted border-border hover:border-primary/50"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TournamentTeamInfo;
