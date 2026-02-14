import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface CalEvent {
  day: number;
  month: number;
  year: number;
  title: string;
  status: "completed" | "upcoming" | "overdue";
}

const allEvents: CalEvent[] = [
  // Jan 2026
  { day: 7, month: 0, year: 2026, title: "TDS Payment", status: "completed" },
  { day: 10, month: 0, year: 2026, title: "GST-1 Filing", status: "completed" },
  { day: 15, month: 0, year: 2026, title: "PF Return", status: "completed" },
  { day: 20, month: 0, year: 2026, title: "GST-3B Filing", status: "completed" },
  { day: 25, month: 0, year: 2026, title: "ESI Return", status: "completed" },
  // Feb 2026
  { day: 7, month: 1, year: 2026, title: "TDS Payment", status: "completed" },
  { day: 10, month: 1, year: 2026, title: "GST-1 Filing", status: "completed" },
  { day: 15, month: 1, year: 2026, title: "PF Return", status: "overdue" },
  { day: 20, month: 1, year: 2026, title: "GST-3B Filing", status: "upcoming" },
  { day: 25, month: 1, year: 2026, title: "ESI Return", status: "upcoming" },
  { day: 28, month: 1, year: 2026, title: "Professional Tax", status: "upcoming" },
  // Mar 2026
  { day: 7, month: 2, year: 2026, title: "TDS Payment", status: "upcoming" },
  { day: 10, month: 2, year: 2026, title: "GST-1 Filing", status: "upcoming" },
  { day: 15, month: 2, year: 2026, title: "PF Return", status: "upcoming" },
  { day: 20, month: 2, year: 2026, title: "GST-3B Filing", status: "upcoming" },
  { day: 25, month: 2, year: 2026, title: "ESI Return", status: "upcoming" },
  { day: 31, month: 2, year: 2026, title: "TDS Return Q3", status: "upcoming" },
  // Apr 2026
  { day: 1, month: 3, year: 2026, title: "Annual Return Filing", status: "upcoming" },
  { day: 7, month: 3, year: 2026, title: "TDS Payment", status: "upcoming" },
  { day: 15, month: 3, year: 2026, title: "Advance Tax Q4", status: "upcoming" },
  { day: 20, month: 3, year: 2026, title: "GST-3B Filing", status: "upcoming" },
  { day: 30, month: 3, year: 2026, title: "GSTR-9 Annual", status: "upcoming" },
];

const statusColors = {
  completed: "bg-success",
  upcoming: "bg-warning",
  overdue: "bg-destructive",
};

export default function ComplianceCalendar() {
  const [month, setMonth] = useState(1); // Feb
  const [year, setYear] = useState(2026);
  const today = new Date();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const monthEvents = useMemo(() =>
    allEvents.filter((e) => e.month === month && e.year === year),
    [month, year]
  );

  const getEvents = (day: number) => monthEvents.filter((e) => e.day === day);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Compliance Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">Auto-generated deadlines based on your company profile</p>
      </div>

      {/* Legend */}
      <div className="flex gap-4">
        {(["completed", "upcoming", "overdue"] as const).map((s) => (
          <div key={s} className="flex items-center gap-2 text-xs text-muted-foreground capitalize">
            <div className={`h-2.5 w-2.5 rounded-full ${statusColors[s]}`} /> {s}
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        {/* Month header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">{MONTH_NAMES[month]} {year}</h2>
          <button onClick={nextMonth} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <motion.div key={`${month}-${year}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-7 gap-1">
          {blanks.map((i) => (
            <div key={`b-${i}`} className="aspect-square" />
          ))}
          {days.map((day) => {
            const dayEvents = getEvents(day);
            const todayFlag = isToday(day);
            return (
              <div
                key={day}
                className={`aspect-square rounded-lg p-1.5 text-sm transition-colors cursor-pointer hover:bg-secondary/80 ${
                  todayFlag ? "border border-primary bg-primary/10" : "bg-secondary/30"
                }`}
              >
                <span className={`text-xs font-medium ${todayFlag ? "text-primary" : "text-foreground"}`}>{day}</span>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.map((ev, i) => (
                    <div
                      key={i}
                      className={`rounded px-1 py-0.5 text-[9px] font-medium truncate ${
                        ev.status === "completed" ? "bg-success/15 text-success" :
                        ev.status === "overdue" ? "bg-destructive/15 text-destructive" :
                        "bg-warning/15 text-warning"
                      }`}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Upcoming list */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">{MONTH_NAMES[month]} {year} Deadlines</h3>
        {monthEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deadlines for this month.</p>
        ) : (
          <div className="space-y-2">
            {monthEvents.map((ev, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${statusColors[ev.status]}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{MONTH_NAMES[month]} {ev.day}, {year}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                  ev.status === "completed" ? "status-green" : ev.status === "overdue" ? "status-red" : "status-yellow"
                }`}>{ev.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
