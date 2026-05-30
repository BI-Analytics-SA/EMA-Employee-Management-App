import { useMemo } from "react";
import { cn } from "@/lib/utils";

type TrendPoint = {
  label: string;
  trialOrgsAtPeriodEnd: number;
  paidOrgsAtPeriodEnd: number;
  signups: number;
  paidActivations: number;
};

type PlatformTrendChartProps = {
  data: TrendPoint[];
  className?: string;
};

const COLORS = {
  trial: "hsl(200 80% 55%)",
  paid: "hsl(145 55% 42%)",
  signups: "hsl(38 92% 50%)",
  activations: "hsl(220 70% 45%)",
};

type BarRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  key: string;
};

/** Integer ticks from 0..yMax with no duplicate labels. */
function buildYTicks(yMax: number): number[] {
  const cap = Math.max(1, Math.ceil(yMax));
  if (cap <= 6) {
    return Array.from({ length: cap + 1 }, (_, i) => i);
  }
  const step = Math.max(1, Math.ceil(cap / 5));
  const ticks: number[] = [0];
  for (let v = step; v < cap; v += step) {
    ticks.push(v);
  }
  if (ticks[ticks.length - 1] !== cap) {
    ticks.push(cap);
  }
  return ticks;
}

export function PlatformTrendChart({ data, className }: PlatformTrendChartProps) {
  const chart = useMemo(() => {
    const width = 800;
    const height = 280;
    const padding = { top: 16, right: 16, bottom: 48, left: 48 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    if (data.length === 0) {
      return {
        paths: null,
        bars: [] as BarRect[],
        yMax: 1,
        yTicks: [0, 1],
        width,
        height,
        padding,
        centerX: (_i: number) => 0,
      };
    }

    const dataMax = Math.max(
      1,
      ...data.flatMap((d) => [
        d.trialOrgsAtPeriodEnd,
        d.paidOrgsAtPeriodEnd,
        d.signups,
        d.paidActivations,
      ])
    );
    const yMax = Math.max(1, Math.ceil(dataMax));
    const yTicks = buildYTicks(yMax);

    const bandWidth = innerW / data.length;
    const centerX = (i: number) => padding.left + bandWidth * (i + 0.5);

    const barGap = 4;
    const pairBarWidth = Math.min(20, Math.max(8, (bandWidth * 0.92 - barGap) / 2));
    const singleBarWidth = Math.min(20, Math.max(10, bandWidth * 0.5));

    const valueToY = (value: number) =>
      padding.top + innerH - (value / yMax) * innerH;

    const line = (accessor: (d: TrendPoint) => number) => {
      const points = data.map((d, i) => {
        const x = centerX(i);
        const y = valueToY(accessor(d));
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      });
      return points.join(" ");
    };

    const bars: BarRect[] = [];
    data.forEach((d, i) => {
      const cx = centerX(i);
      const hasSignup = d.signups > 0;
      const hasPaid = d.paidActivations > 0;

      if (hasSignup && hasPaid) {
        const groupW = pairBarWidth * 2 + barGap;
        const left = cx - groupW / 2;
        bars.push({
          key: `signup-${i}`,
          x: left,
          y: valueToY(d.signups),
          width: pairBarWidth,
          height: (d.signups / yMax) * innerH,
          fill: COLORS.signups,
        });
        bars.push({
          key: `paid-${i}`,
          x: left + pairBarWidth + barGap,
          y: valueToY(d.paidActivations),
          width: pairBarWidth,
          height: (d.paidActivations / yMax) * innerH,
          fill: COLORS.activations,
        });
      } else if (hasSignup) {
        bars.push({
          key: `signup-${i}`,
          x: cx - singleBarWidth / 2,
          y: valueToY(d.signups),
          width: singleBarWidth,
          height: (d.signups / yMax) * innerH,
          fill: COLORS.signups,
        });
      } else if (hasPaid) {
        bars.push({
          key: `paid-${i}`,
          x: cx - singleBarWidth / 2,
          y: valueToY(d.paidActivations),
          width: singleBarWidth,
          height: (d.paidActivations / yMax) * innerH,
          fill: COLORS.activations,
        });
      }
    });

    return {
      width,
      height,
      padding,
      yMax,
      yTicks,
      bars,
      centerX,
      paths: {
        trial: line((d) => d.trialOrgsAtPeriodEnd),
        paid: line((d) => d.paidOrgsAtPeriodEnd),
      },
    };
  }, [data]);

  if (!data.length) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No data for the selected period.
      </p>
    );
  }

  const { paths, bars, yMax, yTicks, width, height, padding, centerX } = chart;
  const innerH = height - padding.top - padding.bottom;

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[320px] max-h-[320px]"
        role="img"
        aria-label="Organisation trends chart"
      >
        {yTicks.map((tick) => {
          const y = padding.top + innerH - (tick / yMax) * innerH;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.08}
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {bars.map((bar) => (
          <rect
            key={bar.key}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            fill={bar.fill}
            rx={3}
            opacity={0.9}
          />
        ))}

        {paths && (
          <>
            <path d={paths.trial} fill="none" stroke={COLORS.trial} strokeWidth={2} />
            <path d={paths.paid} fill="none" stroke={COLORS.paid} strokeWidth={2} />
          </>
        )}

        {data.map((d, i) => {
          const showLabel =
            data.length <= 12 || i % Math.ceil(data.length / 12) === 0 || i === data.length - 1;
          return showLabel ? (
            <text
              key={d.label}
              x={centerX(i)}
              y={height - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {d.label}
            </text>
          ) : null;
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 justify-center text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: COLORS.trial }} />
          Trial orgs (at period end)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: COLORS.paid }} />
          Paid orgs (at period end)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-2.5 rounded-sm" style={{ background: COLORS.signups }} />
          New sign-ups
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-2.5 rounded-sm" style={{ background: COLORS.activations }} />
          New paid
        </span>
      </div>
    </div>
  );
}
