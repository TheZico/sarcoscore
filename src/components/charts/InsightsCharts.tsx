"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  LabelList,
} from "recharts";
import model from "@/data/model.json";

export function MostFrequentChart() {
  const top10 = model.stats.most_frequent.slice(0, 10).map((item) => ({
    ...item,
    displayLabel: `${item.count} of ${item.out_of}`,
  }));

  return (
    <div className="h-[390px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={top10}
          layout="vertical"
          margin={{ top: 8, right: 68, left: 16, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#DFD9C8" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, model.stats.sarcoidosis_cases]}
            tick={{ fill: "#6B7876", fontSize: 12 }}
            stroke="#DFD9C8"
          />
          <YAxis
            type="category"
            dataKey="label"
            width={195}
            tick={{ fill: "#22302E", fontSize: 12 }}
            stroke="#DFD9C8"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#F7F4EC",
              borderColor: "#DFD9C8",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#22302E",
            }}
            formatter={(value: number, _name: string, props: { payload?: { out_of: number } }) => [
              `${value} of ${props?.payload?.out_of ?? 19} cases`,
              "Frequency",
            ]}
          />
          <Bar dataKey="count" fill="hsl(158, 30%, 27%)" radius={[0, 6, 6, 0]} barSize={22}>
            <LabelList
              dataKey="displayLabel"
              position="right"
              style={{ fill: "hsl(174, 22%, 12%)", fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PointsPerFindingChart() {
  const sortedFeatures = [...model.features]
    .sort((a, b) => b.points - a.points)
    .map((f) => ({
      ...f,
      pointLabel: f.points > 0 ? `+${f.points}` : `${f.points}`,
    }));

  return (
    <div className="h-[720px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedFeatures}
          layout="vertical"
          margin={{ top: 8, right: 48, left: 16, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#DFD9C8" horizontal={false} />
          <XAxis
            type="number"
            domain={[-3, 4]}
            ticks={[-2, -1, 0, 1, 2, 3]}
            tick={{ fill: "#6B7876", fontSize: 12 }}
            stroke="#DFD9C8"
          />
          <YAxis
            type="category"
            dataKey="label"
            width={215}
            tick={{ fill: "#22302E", fontSize: 12 }}
            stroke="#DFD9C8"
          />
          <ReferenceLine x={0} stroke="#6B7876" strokeWidth={1.2} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#F7F4EC",
              borderColor: "#DFD9C8",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#22302E",
            }}
            formatter={(value: number) => [
              `${value > 0 ? `+${value}` : value} pts`,
              "Score Weight",
            ]}
          />
          <Bar dataKey="points" radius={[4, 4, 4, 4]} barSize={18}>
            {sortedFeatures.map((entry) => (
              <Cell
                key={entry.id}
                fill={
                  entry.points > 0
                    ? "hsl(158, 30%, 27%)"
                    : entry.points < 0
                    ? "#C0504D"
                    : "#B5B0A1"
                }
              />
            ))}
            <LabelList
              dataKey="pointLabel"
              position="right"
              style={{ fill: "hsl(174, 22%, 12%)", fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AgeGroupsChart() {
  const ageData = Object.entries(model.stats.age_groups).map(([group, count]) => ({
    group,
    count,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={ageData} margin={{ top: 20, right: 20, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#DFD9C8" vertical={false} />
          <XAxis
            dataKey="group"
            tick={{ fill: "#22302E", fontSize: 13 }}
            stroke="#DFD9C8"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#6B7876", fontSize: 12 }}
            stroke="#DFD9C8"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#F7F4EC",
              borderColor: "#DFD9C8",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#22302E",
            }}
            formatter={(value: number) => [`${value} patients`, "Sarcoidosis Cases"]}
          />
          <Bar dataKey="count" fill="hsl(158, 30%, 27%)" radius={[6, 6, 0, 0]} barSize={44}>
            <LabelList
              dataKey="count"
              position="top"
              style={{ fill: "hsl(174, 22%, 12%)", fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DiagnosticTimeChart() {
  const values = model.stats.diagnostic_time_months.values;
  const median = model.stats.diagnostic_time_months.median;

  const data = values.map((months, idx) => ({
    patient: `P${idx + 1}`,
    months,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 24, left: 4, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#DFD9C8" vertical={false} />
          <XAxis
            dataKey="patient"
            tick={{ fill: "#22302E", fontSize: 12 }}
            stroke="#DFD9C8"
          />
          <YAxis
            tick={{ fill: "#6B7876", fontSize: 12 }}
            stroke="#DFD9C8"
            unit=" mo"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#F7F4EC",
              borderColor: "#DFD9C8",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#22302E",
            }}
            formatter={(value: number) => [
              `${value} months (${(value / 12).toFixed(1)} yrs)`,
              "Time to Diagnosis",
            ]}
          />
          <ReferenceLine
            y={median}
            stroke="#C0504D"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `Median: ${median} mo`,
              position: "insideTopLeft",
              fill: "#C0504D",
              fontSize: 12,
              fontWeight: 600,
            }}
          />
          <Bar dataKey="months" fill="hsl(158, 30%, 27%)" radius={[5, 5, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.patient}
                fill={entry.months >= 36 ? "#C0504D" : "hsl(158, 30%, 27%)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

