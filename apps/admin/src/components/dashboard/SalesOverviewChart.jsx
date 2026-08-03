import { useMemo } from "react";
import Chart from "react-apexcharts";

import useDashboardChartTheme from "./useDashboardChartTheme.js";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const ILLUSTRATIVE_REVENUE = [
  280000, 315000, 302000, 365000, 410000, 398000, 455000, 492000, 470000,
  528000, 565000, 610000,
];

const ILLUSTRATIVE_ORDERS = [
  118, 132, 127, 151, 169, 164, 188, 203, 194, 216, 231, 249,
];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

function formatCurrency(value) {
  const number = Number(value);

  return Number.isFinite(number) ? currencyFormatter.format(number) : "—";
}

function formatCompactCurrency(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? compactCurrencyFormatter.format(number)
    : "—";
}

function formatInteger(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? integerFormatter.format(Math.max(0, Math.round(number)))
    : "0";
}

function SalesOverviewChart() {
  const { textColor, gridColor, tooltipTheme } = useDashboardChartTheme();

  const options = useMemo(
    () => ({
      chart: {
        type: "area",
        fontFamily: "Outfit, sans-serif",
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
        animations: {
          enabled: true,
          speed: 500,
        },
      },

      colors: ["#465FFF", "#12B76A"],

      dataLabels: {
        enabled: false,
      },

      stroke: {
        curve: "smooth",
        width: [3, 3],
      },

      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.28,
          opacityTo: 0.03,
          stops: [0, 90, 100],
        },
      },

      markers: {
        size: 0,
        hover: {
          size: 5,
        },
      },

      grid: {
        borderColor: gridColor,
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },

      xaxis: {
        categories: MONTH_LABELS,
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          style: {
            colors: MONTH_LABELS.map(() => textColor),
            fontSize: "12px",
          },
        },
      },

      yaxis: [
        {
          seriesName: "Revenue",
          min: 0,
          forceNiceScale: true,
          labels: {
            formatter: formatCompactCurrency,
            style: {
              colors: [textColor],
              fontSize: "12px",
            },
          },
        },
        {
          seriesName: "Orders",
          opposite: true,
          min: 0,
          forceNiceScale: true,
          labels: {
            formatter: formatInteger,
            style: {
              colors: [textColor],
              fontSize: "12px",
            },
          },
        },
      ],

      legend: {
        show: true,
        position: "top",
        horizontalAlign: "right",
        fontSize: "13px",
        labels: {
          colors: textColor,
        },
        markers: {
          size: 6,
          shape: "circle",
        },
        itemMargin: {
          horizontal: 12,
        },
      },

      tooltip: {
        shared: true,
        intersect: false,
        theme: tooltipTheme,
        y: [
          {
            formatter: (value) => formatCurrency(value),
          },
          {
            formatter: (value) => {
              const count = Number(value);
              const normalizedCount = Number.isFinite(count)
                ? Math.max(0, Math.round(count))
                : 0;
              const label = normalizedCount === 1 ? "order" : "orders";

              return `${formatInteger(normalizedCount)} ${label}`;
            },
          },
        ],
      },
    }),
    [gridColor, textColor, tooltipTheme]
  );

  const series = [
    {
      name: "Revenue",
      data: ILLUSTRATIVE_REVENUE,
    },
    {
      name: "Orders",
      data: ILLUSTRATIVE_ORDERS,
    },
  ];

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-4 shadow-theme-xs sm:px-6 sm:pt-6 dark:border-gray-800 dark:bg-white/3">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Sales Overview
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monthly revenue and order-volume visualization.
          </p>
        </div>

        <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          Illustrative trend
        </span>
      </div>

      <div className="custom-scrollbar mt-4 min-w-0 overflow-x-auto overflow-y-hidden">
        <div className="min-w-190">
          <Chart options={options} series={series} type="area" height={360} />
        </div>
      </div>

      <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
        This chart uses representative monthly data because the current backend
        does not provide date-bucketed revenue or order statistics.
      </p>
    </section>
  );
}

export default SalesOverviewChart;
