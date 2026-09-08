import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { CycloneData, ForecastMetricTab } from '../types';

interface ForecastSummaryCardProps {
  cyclones: CycloneData[];
  onViewAll: () => void;
}

export const ForecastSummaryCard: React.FC<ForecastSummaryCardProps> = ({
  cyclones,
  onViewAll,
}) => {
  const [activeTab, setActiveTab] = useState<ForecastMetricTab>('Intensity');
  const [hoveredPoint, setHoveredPoint] = useState<{
    cycloneId: string;
    dayIndex: number;
    val: number;
    unit: string;
    x: number;
    y: number;
  } | null>(null);

  const days = ['Today', '+1 Day', '+2 Day', '+3 Day', '+4 Day', '+5 Day'];

  const cyc1 = cyclones[0];
  const cyc2 = cyclones[1];

  // Helper to extract values and y-axis range based on the active tab
  const getMetricConfig = () => {
    switch (activeTab) {
      case 'Pressure':
        return {
          unit: 'hPa',
          minY: 940,
          maxY: 1020,
          yLabels: [940, 960, 980, 1000, 1020],
          cyc1Vals: cyc1?.forecast5Days.map((f) => f.pressureHpa) || [980, 968, 958, 972, 985, 998],
          cyc2Vals: cyc2?.forecast5Days.map((f) => f.pressureHpa) || [996, 990, 998, 1004, 1008, 1012],
        };
      case 'Wind Speed':
        return {
          unit: 'km/h',
          minY: 0,
          maxY: 240,
          yLabels: [0, 60, 120, 180, 240],
          cyc1Vals: cyc1?.forecast5Days.map((f) => f.windSpeedKmh) || [175, 195, 205, 185, 155, 120],
          cyc2Vals: cyc2?.forecast5Days.map((f) => f.windSpeedKmh) || [120, 130, 110, 90, 75, 55],
        };
      case 'Rainfall':
        return {
          unit: 'mm',
          minY: 0,
          maxY: 320,
          yLabels: [0, 80, 160, 240, 320],
          cyc1Vals: cyc1?.forecast5Days.map((f) => f.rainfallMm) || [210, 260, 290, 230, 170, 110],
          cyc2Vals: cyc2?.forecast5Days.map((f) => f.rainfallMm) || [130, 150, 120, 90, 60, 35],
        };
      case 'Intensity':
      default:
        return {
          unit: 'kt',
          minY: 0,
          maxY: 120,
          yLabels: [0, 30, 60, 90, 120],
          cyc1Vals: [95, 105, 110, 100, 85, 65],
          cyc2Vals: [65, 70, 60, 50, 40, 30],
        };
    }
  };

  const { unit, minY, maxY, yLabels, cyc1Vals, cyc2Vals } = getMetricConfig();

  // SVG Chart dimensions
  const svgWidth = 460;
  const svgHeight = 170;
  const paddingLeft = 32;
  const paddingRight = 20;
  const paddingTop = 24;
  const paddingBottom = 26;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (index: number) => paddingLeft + (index / (days.length - 1)) * chartWidth;
  const getY = (val: number) =>
    paddingTop + chartHeight - ((val - minY) / (maxY - minY)) * chartHeight;

  // Build SVG path strings
  const getPathString = (vals: number[]) => {
    return vals.reduce((acc, val, i) => {
      const x = getX(i);
      const y = getY(val);
      if (i === 0) return `M ${x} ${y}`;
      // Smooth cubic bezier curve
      const prevX = getX(i - 1);
      const prevY = getY(vals[i - 1]);
      const cpX1 = prevX + (x - prevX) / 2;
      const cpX2 = prevX + (x - prevX) / 2;
      return `${acc} C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
    }, '');
  };

  const cyc1Path = getPathString(cyc1Vals);
  const cyc2Path = getPathString(cyc2Vals);

  return (
    <div 
      id="forecast-summary-panel"
      className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-4 sm:p-5 shadow-lg flex flex-col justify-between"
    >
      <div>
        {/* Header and Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Forecast Summary (Next 5 Days)
          </h2>
          <button
            onClick={onViewAll}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] mb-2">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rotate-45 bg-[#f87171] inline-block"></span>
            <span>CYC-01A {activeTab} ({unit})</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rotate-45 bg-[#34d399] inline-block"></span>
            <span>CYC-02B {activeTab} ({unit})</span>
          </div>
        </div>

        {/* Chart SVG */}
        <div className="relative w-full overflow-hidden select-none">
          <svg
            className="w-full h-[175px] overflow-visible"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
          >
            {/* Horizontal Grid lines and Y-axis labels */}
            {yLabels.map((lbl) => {
              const y = getY(lbl);
              return (
                <g key={lbl}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="rgba(148, 163, 184, 0.08)"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={paddingLeft - 6}
                    y={y + 3}
                    textAnchor="end"
                    fill="rgba(148, 163, 184, 0.45)"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {lbl}
                  </text>
                </g>
              );
            })}

            {/* CYC-01A Red Line */}
            <path
              d={cyc1Path}
              fill="none"
              stroke="#f87171"
              strokeWidth="2.2"
              className="transition-all duration-300"
            />

            {/* CYC-02B Green Line */}
            <path
              d={cyc2Path}
              fill="none"
              stroke="#34d399"
              strokeWidth="2.2"
              className="transition-all duration-300"
            />

            {/* CYC-01A Data Points & Value Badges */}
            {cyc1Vals.map((val, i) => {
              const x = getX(i);
              const y = getY(val);
              return (
                <g 
                  key={`c1-${i}`}
                  onMouseEnter={() => setHoveredPoint({ cycloneId: 'CYC-01A', dayIndex: i, val, unit, x, y })}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="cursor-pointer"
                >
                  <circle cx={x} cy={y} r="3.5" fill="#f87171" stroke="#0b1120" strokeWidth="1.5" />
                  <text
                    x={x}
                    y={y - 7}
                    textAnchor="middle"
                    fill="#fca5a5"
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* CYC-02B Data Points & Value Badges */}
            {cyc2Vals.map((val, i) => {
              const x = getX(i);
              const y = getY(val);
              return (
                <g 
                  key={`c2-${i}`}
                  onMouseEnter={() => setHoveredPoint({ cycloneId: 'CYC-02B', dayIndex: i, val, unit, x, y })}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="cursor-pointer"
                >
                  <circle cx={x} cy={y} r="3.5" fill="#34d399" stroke="#0b1120" strokeWidth="1.5" />
                  <text
                    x={x}
                    y={y - 7}
                    textAnchor="middle"
                    fill="#86efac"
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Day Labels */}
            {days.map((day, i) => {
              const x = getX(i);
              return (
                <text
                  key={day}
                  x={x}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  fill="rgba(148, 163, 184, 0.65)"
                  fontSize="10"
                  fontFamily="sans-serif"
                >
                  {day}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Metric Tabs: [ Intensity ] [ Pressure ] [ Wind Speed ] [ Rainfall ] */}
      <div 
        id="forecast-metric-tabs"
        className="mt-3 grid grid-cols-4 gap-1.5 rounded-xl bg-slate-950/80 border border-slate-800 p-1"
      >
        {(['Intensity', 'Pressure', 'Wind Speed', 'Rainfall'] as ForecastMetricTab[]).map((tab) => (
          <button
            key={tab}
            id={`forecast-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => setActiveTab(tab)}
            className={`py-1.5 rounded-lg text-center text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};
