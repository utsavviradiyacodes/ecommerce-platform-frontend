import { useMemo } from "react";
import Chart from "react-apexcharts";

import useDashboardChartTheme from "./useDashboardChartTheme.js";

const ORDER_STATUS_ITEMS = [
  {
    key: "placed",
    label: "Placed",
  },
  {
    key: "confirmed",
    label: "Confirmed",
  },
  {
    key: "processing",
    label: "Processing",
  },
  {
    key: "shipped",
    label: "Shipped",
  },
  {
    key: "delivered",
    label: "Delivered",
  },
  {
    key: "cancelled",
    label: "Cancelled",
  },
];

function getNonNegativeInteger(value) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? Math.trunc(number) : 0;
}

function OrdersByStatusChart({ orders = null, isLoading = false }) {
  const { textColor, gridColor, tooltipTheme } = useDashboardChartTheme();

  const chartData = ORDER_STATUS_ITEMS.map((statusItem) =>
    getNonNegativeInteger(orders?.[statusItem.key])
  );

  const options = useMemo(
    () => ({
      chart: {
        type: "bar",
        fontFamily: "Outfit, sans-serif",
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          speed: 450,
        },
      },

      colors: ["#465FFF"],

      plotOptions: {
        bar: {
          borderRadius: 5,
          columnWidth: "48%",
        },
      },

      dataLabels: {
        enabled: false,
      },

      stroke: {
        show: false,
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
        categories: ORDER_STATUS_ITEMS.map((statusItem) => statusItem.label),
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          rotate: 0,
          trim: false,
          style: {
            colors: ORDER_STATUS_ITEMS.map(() => textColor),
            fontSize: "12px",
            fontWeight: 400,
          },
        },
      },

      yaxis: {
        min: 0,
        forceNiceScale: true,
        labels: {
          formatter: (value) =>
            Number.isFinite(value)
              ? Math.max(0, Math.round(value)).toLocaleString("en-IN")
              : "0",
          style: {
            colors: [textColor],
            fontSize: "12px",
          },
        },
      },

      tooltip: {
        theme: tooltipTheme,
        y: {
          formatter: (value) => {
            const orderCount = getNonNegativeInteger(value);
            const label = orderCount === 1 ? "order" : "orders";

            return `${orderCount.toLocaleString("en-IN")} ${label}`;
          },
        },
      },

      fill: {
        opacity: 1,
      },

      states: {
        hover: {
          filter: {
            type: "darken",
            value: 0.05,
          },
        },
      },

      responsive: [
        {
          breakpoint: 640,

          options: {
            plotOptions: {
              bar: {
                borderRadius: 4,
                columnWidth: "55%",
              },
            },

            xaxis: {
              labels: {
                rotate: -35,
                rotateAlways: true,
                hideOverlappingLabels: false,
                trim: false,

                style: {
                  colors: ORDER_STATUS_ITEMS.map(() => textColor),
                  fontSize: "10px",
                  fontWeight: 400,
                },
              },
            },
          },
        },
      ],
    }),
    [gridColor, textColor, tooltipTheme]
  );

  const series = [
    {
      name: "Orders",
      data: chartData,
    },
  ];

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-4 shadow-theme-xs sm:px-6 sm:pt-6 dark:border-gray-800 dark:bg-white/3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Orders by Status
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Current order distribution across the fulfillment lifecycle.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-6 min-h-75 flex-1 animate-pulse rounded-xl bg-gray-100 sm:min-h-87.5 xl:min-h-105 dark:bg-gray-800" />
      ) : (
        <div className="mt-4 h-75 min-w-0 sm:h-87.5 xl:h-105">
          <Chart
            options={options}
            series={series}
            type="bar"
            width="100%"
            height="100%"
          />
        </div>
      )}
    </section>
  );
}

export default OrdersByStatusChart;
