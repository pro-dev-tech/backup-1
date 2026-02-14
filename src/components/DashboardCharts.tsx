import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

const riskTrend = [
  { month: "Jul", score: 65 }, { month: "Aug", score: 72 }, { month: "Sep", score: 68 },
  { month: "Oct", score: 75 }, { month: "Nov", score: 80 }, { month: "Dec", score: 78 },
  { month: "Jan", score: 82 }, { month: "Feb", score: 85 },
];

const filingStatus = [
  { name: "Filed", value: 42, color: "hsl(142 71% 45%)" },
  { name: "Pending", value: 12, color: "hsl(38 92% 50%)" },
  { name: "Overdue", value: 5, color: "hsl(0 72% 51%)" },
];

const stateData = [
  { state: "MH", score: 92 }, { state: "KA", score: 85 }, { state: "DL", score: 78 },
  { state: "TN", score: 88 }, { state: "GJ", score: 70 }, { state: "UP", score: 65 },
];

const monthlyActivity = [
  { month: "Sep", filings: 12, alerts: 3 }, { month: "Oct", filings: 18, alerts: 5 },
  { month: "Nov", filings: 15, alerts: 2 }, { month: "Dec", filings: 22, alerts: 4 },
  { month: "Jan", filings: 20, alerts: 6 }, { month: "Feb", filings: 16, alerts: 2 },
];

const chartTooltipStyle = {
  contentStyle: {
    background: "hsl(222 20% 10%)",
    border: "1px solid hsl(222 15% 18%)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(210 20% 92%)",
  },
  itemStyle: {
    color: "hsl(210 20% 92%)",
  },
  labelStyle: {
    color: "hsl(210 20% 92%)",
  },
};

export function RiskTrendChart() {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Compliance Risk Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={riskTrend}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 15% 15%)" />
          <XAxis dataKey="month" tick={{ fill: "hsl(215 15% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} domain={[50, 100]} />
          <Tooltip {...chartTooltipStyle} />
          <Line type="monotone" dataKey="score" stroke="hsl(220 90% 56%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(220 90% 56%)" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FilingStatusChart() {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Filing Status Distribution</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={filingStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value"
            label={({ name, value, x, y, textAnchor }) => (
              <text x={x} y={y} textAnchor={textAnchor} fill="hsl(210 20% 82%)" fontSize={11}>
                {`${name}: ${value}`}
              </text>
            )}
            labelLine={{ stroke: "hsl(215 15% 55%)" }}
          >
            {filingStatus.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip {...chartTooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2">
        {filingStatus.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            {item.name} ({item.value})
          </div>
        ))}
      </div>
    </div>
  );
}

export function StateComplianceChart() {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">State-wise Compliance</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={stateData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 15% 15%)" />
          <XAxis dataKey="state" tick={{ fill: "hsl(215 15% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip {...chartTooltipStyle} />
          <Bar dataKey="score" radius={[4, 4, 0, 0]} fill="hsl(250 80% 62%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyActivityChart() {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Compliance Activity</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={monthlyActivity}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 15% 15%)" />
          <XAxis dataKey="month" tick={{ fill: "hsl(215 15% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip {...chartTooltipStyle} />
          <Area type="monotone" dataKey="filings" stroke="hsl(220 90% 56%)" fill="hsl(220 90% 56% / 0.15)" strokeWidth={2} />
          <Area type="monotone" dataKey="alerts" stroke="hsl(0 72% 51%)" fill="hsl(0 72% 51% / 0.1)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
