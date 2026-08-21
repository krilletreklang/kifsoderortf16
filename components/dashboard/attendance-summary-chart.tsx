"use client";

import { Card } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface AttendanceSummaryChartProps {
  data: Array<{
    week: string;
    attendanceRate: number;
  }>;
}

export function AttendanceSummaryChart({ data }: AttendanceSummaryChartProps) {
  return (
    <Card className="h-80">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl text-foreground">Narvaro senaste passen</h2>
        <span className="text-sm text-muted">30 dagar</span>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c8a443" stopOpacity={0.55} />
              <stop offset="95%" stopColor="#c8a443" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
          <XAxis dataKey="week" tick={{ fill: "#a5a5a5", fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "#a5a5a5", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#151515",
              borderColor: "#2f2f2f",
              borderRadius: 8,
              color: "#f8f8f8",
            }}
          />
          <Area type="monotone" dataKey="attendanceRate" stroke="#c8a443" strokeWidth={2} fill="url(#attendanceGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
