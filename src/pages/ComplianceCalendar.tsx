import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getCalendarEvents, addCalendarEvent, deleteCalendarEvent } from "@/lib/firestore";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface CalEvent {
  id?: string;
  day: number;
  month: number;
  year: number;
  title: string;
  status: "completed" | "upcoming" | "overdue";
}

const statusColors = {
  completed: "bg-success",
  upcoming: "bg-warning",
  overdue: "bg-destructive",
};

export default function ComplianceCalendar() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState<CalEvent["status"]>("upcoming");
  const { toast } = useToast();
  const { firebaseUser } = useAuth();
  const today = new Date();

  const fetchEvents = async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const docs = await getCalendarEvents(firebaseUser.uid);
      setEvents(docs as CalEvent[]);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [firebaseUser]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const monthEvents = useMemo(() =>
    events.filter((e) => e.month === month && e.year === year),
    [month, year, events]
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

  const openAddModal = (day?: number) => {
    setSelectedDay(day ?? 1);
    setNewTitle("");
    setNewStatus("upcoming");
    setShowAddModal(true);
  };

  const handleAddEvent = async () => {
    if (!newTitle.trim() || selectedDay === null || !firebaseUser) return;
    try {
      const eventData = { day: selectedDay, month, year, title: newTitle.trim(), status: newStatus };
      const result = await addCalendarEvent(firebaseUser.uid, eventData);
      setEvents(prev => [...prev, { ...eventData, id: result.id } as CalEvent]);
      setShowAddModal(false);
      setNewTitle("");
      toast({ title: "Event added", description: `"${eventData.title}" on ${MONTH_NAMES[month]} ${selectedDay}, ${year}` });
    } catch {
      toast({ title: "Failed to add event", variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (event: CalEvent) => {
    if (!event.id || !firebaseUser) return;
    try {
      await deleteCalendarEvent(firebaseUser.uid, event.id);
      setEvents(prev => prev.filter(e => e.id !== event.id));
      toast({ title: "Event removed", variant: "destructive" });
    } catch {
      toast({ title: "Failed to remove event", variant: "destructive" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compliance Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">Deadlines synced from compliance engine evaluations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchEvents}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button onClick={() => openAddModal()}
            className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" /> Add Event
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4">
        {(["completed", "upcoming", "overdue"] as const).map((s) => (
          <div key={s} className="flex items-center gap-2 text-xs text-muted-foreground capitalize">
            <div className={`h-2.5 w-2.5 rounded-full ${statusColors[s]}`} /> {s}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-foreground">{MONTH_NAMES[month]} {year}</h2>
              <button onClick={nextMonth} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
            </div>

            <motion.div key={`${month}-${year}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-7 gap-1">
              {blanks.map((i) => (<div key={`b-${i}`} className="aspect-square" />))}
              {days.map((day) => {
                const dayEvents = getEvents(day);
                const todayFlag = isToday(day);
                return (
                  <div key={day} onClick={() => openAddModal(day)}
                    className={`aspect-square rounded-lg p-1.5 text-sm transition-colors cursor-pointer hover:bg-secondary/80 group ${todayFlag ? "border border-primary bg-primary/10" : "bg-secondary/30"}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${todayFlag ? "text-primary" : "text-foreground"}`}>{day}</span>
                      <Plus className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-0.5 space-y-0.5">
                      {dayEvents.map((ev, i) => (
                        <div key={i} className={`rounded px-1 py-0.5 text-[9px] font-medium truncate ${
                          ev.status === "completed" ? "bg-success/15 text-success" :
                          ev.status === "overdue" ? "bg-destructive/15 text-destructive" :
                          "bg-warning/15 text-warning"
                        }`}>{ev.title}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {events.length === 0 && (
            <div className="glass-card p-5 text-center">
              <p className="text-sm text-muted-foreground">No calendar events yet. Run a compliance evaluation in <strong>Integrations</strong> and approve the calendar update to see deadlines here.</p>
            </div>
          )}

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">{MONTH_NAMES[month]} {year} Deadlines</h3>
            {monthEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deadlines for this month.</p>
            ) : (
              <div className="space-y-2">
                {monthEvents.map((ev, i) => (
                  <div key={ev.id || i} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${statusColors[ev.status]}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{MONTH_NAMES[month]} {ev.day}, {year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        ev.status === "completed" ? "border-success/30 bg-success/10 text-success" :
                        ev.status === "overdue" ? "border-destructive/30 bg-destructive/10 text-destructive" :
                        "border-warning/30 bg-warning/10 text-warning"
                      }`}>{ev.status}</span>
                      <button onClick={() => handleDeleteEvent(ev)}
                        className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Remove event">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-foreground">Add Event</h3>
                <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Event Title</label>
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. GST Filing, PF Return..."
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus onKeyDown={e => e.key === "Enter" && handleAddEvent()} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
                  <div className="flex gap-3">
                    <select value={selectedDay ?? 1} onChange={e => setSelectedDay(Number(e.target.value))}
                      className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                      {days.map(d => (<option key={d} value={d}>{d}</option>))}
                    </select>
                    <div className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground">
                      {MONTH_NAMES[month]} {year}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                  <div className="flex gap-2">
                    {(["upcoming", "completed", "overdue"] as const).map(s => (
                      <button key={s} onClick={() => setNewStatus(s)}
                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${
                          newStatus === s
                            ? s === "completed" ? "bg-success/20 text-success border border-success/30"
                            : s === "overdue" ? "bg-destructive/20 text-destructive border border-destructive/30"
                            : "bg-warning/20 text-warning border border-warning/30"
                            : "border border-border text-muted-foreground hover:bg-secondary"
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>
                <button onClick={handleAddEvent} disabled={!newTitle.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed">
                  <Plus className="h-4 w-4" /> Add to Calendar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
