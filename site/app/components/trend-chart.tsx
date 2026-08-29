'use client';

import { useEffect, useRef, useState } from 'react';

type TrendPoint = {
  date: string;
  waiting_over_60: number;
};

type TrendChartProps = {
  points: TrendPoint[];
  status: 'improving' | 'stable' | 'worsening' | 'insufficient';
};

const number = { format: (value: number) => Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') };
const shortDate = new Intl.DateTimeFormat('hu-HU', { month: 'short', day: 'numeric' });

export function TrendChart({ points, status }: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hovered, setHovered] = useState<number | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const element = shellRef.current;
    if (!element) return;
    const resize = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    resize.observe(element);
    return () => resize.disconnect();
  }, []);

  useEffect(() => {
    const updateTheme = () => setDark(document.documentElement.dataset.theme === 'dark');
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !points.length) return;
    const height = width < 430 ? 210 : 250;
    const scale = window.devicePixelRatio || 1;
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(scale, scale);

    const padding = { top: 25, right: 18, bottom: 38, left: width < 430 ? 45 : 58 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const values = points.map((point) => point.waiting_over_60);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const spread = Math.max(rawMax - rawMin, rawMax * .015, 1);
    const min = Math.max(0, rawMin - spread * .35);
    const max = rawMax + spread * .35;
    const x = (index: number) => padding.left + (points.length === 1 ? chartWidth / 2 : index / (points.length - 1) * chartWidth);
    const y = (value: number) => padding.top + (max - value) / (max - min) * chartHeight;

    const ink = dark ? '#dff5ef' : '#16332d';
    const muted = dark ? '#82a49b' : '#6b827b';
    const grid = dark ? 'rgba(164, 211, 200, .12)' : 'rgba(30, 84, 72, .11)';
    const colour = status === 'improving' ? '#27b783' : status === 'worsening' ? '#dc675c' : '#32a893';

    context.clearRect(0, 0, width, height);
    context.font = '11px system-ui, sans-serif';
    context.textBaseline = 'middle';
    for (let line = 0; line < 4; line += 1) {
      const lineY = padding.top + chartHeight / 3 * line;
      context.beginPath();
      context.strokeStyle = grid;
      context.lineWidth = 1;
      context.moveTo(padding.left, lineY);
      context.lineTo(width - padding.right, lineY);
      context.stroke();
    }

    const gradient = context.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, `${colour}42`);
    gradient.addColorStop(1, `${colour}00`);
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) context.moveTo(x(index), y(point.waiting_over_60));
      else context.lineTo(x(index), y(point.waiting_over_60));
    });
    context.lineTo(x(points.length - 1), height - padding.bottom);
    context.lineTo(x(0), height - padding.bottom);
    context.closePath();
    context.fillStyle = gradient;
    context.fill();

    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) context.moveTo(x(index), y(point.waiting_over_60));
      else context.lineTo(x(index), y(point.waiting_over_60));
    });
    context.strokeStyle = colour;
    context.lineWidth = 3;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.stroke();

    points.forEach((point, index) => {
      const selected = hovered === index;
      context.beginPath();
      context.arc(x(index), y(point.waiting_over_60), selected ? 6 : 3.5, 0, Math.PI * 2);
      context.fillStyle = selected ? ink : colour;
      context.fill();
      context.strokeStyle = dark ? '#102923' : '#ffffff';
      context.lineWidth = 2;
      context.stroke();
    });

    context.fillStyle = muted;
    context.textAlign = 'right';
    context.fillText(number.format(Math.round(max)), padding.left - 9, padding.top);
    context.fillText(number.format(Math.round(min)), padding.left - 9, padding.top + chartHeight);
    context.textBaseline = 'alphabetic';
    points.forEach((point, index) => {
      if (points.length > 7 && index !== 0 && index !== points.length - 1) return;
      context.textAlign = index === 0 ? 'left' : index === points.length - 1 ? 'right' : 'center';
      context.fillText(shortDate.format(new Date(`${point.date}T12:00:00Z`)), x(index), height - 12);
    });
  }, [dark, hovered, points, status, width]);

  const activePoint = hovered === null ? null : points[hovered];
  const position = hovered === null || points.length < 2 ? 50 : hovered / (points.length - 1) * 100;

  return (
    <div className="trend-chart-shell" ref={shellRef}>
      <canvas
        ref={canvasRef}
        className="trend-canvas"
        role="img"
        aria-label={`A 60 napnál régebben várakozók ${points.length} napi alakulása`}
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const relative = Math.min(1, Math.max(0, (event.clientX - bounds.left - 58) / Math.max(1, bounds.width - 76)));
          setHovered(Math.round(relative * Math.max(0, points.length - 1)));
        }}
        onPointerLeave={() => setHovered(null)}
      />
      {activePoint && (
        <div className="trend-tooltip" style={{ left: `${Math.min(88, Math.max(12, position))}%` }}>
          <span>{shortDate.format(new Date(`${activePoint.date}T12:00:00Z`))}</span>
          <strong>{number.format(activePoint.waiting_over_60)}</strong>
          <small>60+ napja vár</small>
        </div>
      )}
    </div>
  );
}
