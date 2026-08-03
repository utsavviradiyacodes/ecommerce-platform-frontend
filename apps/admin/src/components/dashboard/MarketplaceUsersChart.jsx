import { useMemo } from "react";
import Chart from "react-apexcharts";

import useDashboardChartTheme from "./useDashboardChartTheme.js";

const integerFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const USER_SEGMENTS = [
  {
    label: "Customers",
    color: "#465FFF",
  },
  {
    label: "Approved sellers",
    color: "#12B76A",
  },
  {
    label: "Pending sellers",
    color: "#F79009",
  },
];

function getNonNegativeInteger(value) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? Math.trunc(number) : 0;
}

function formatCount(value) {
  return integerFormatter.format(getNonNegativeInteger(value));
}

function MarketplaceUsersChart({ users = null, isLoading = false }) {
  const { isDarkMode, textColor, headingColor, tooltipTheme } =
    useDashboardChartTheme();

  const totalCustomers = getNonNegativeInteger(users?.totalCustomers);

  const totalSellers = getNonNegativeInteger(users?.totalSellers);

  const approvedSellers = getNonNegativeInteger(users?.approvedSellers);

  const pendingSellers = getNonNegativeInteger(users?.pendingSellers);

  const series = [totalCustomers, approvedSellers, pendingSellers];

  const totalMarketplaceUsers = series.reduce(
    (total, value) => total + value,
    0
  );

  const hasChartData = totalMarketplaceUsers > 0;

  const options = useMemo(
    () => ({
      chart: {
        type: "donut",
        fontFamily: "Outfit, sans-serif",
        animations: {
          enabled: true,
          speed: 500,
        },
      },

      labels: USER_SEGMENTS.map((segment) => segment.label),

      colors: USER_SEGMENTS.map((segment) => segment.color),

      dataLabels: {
        enabled: false,
      },

      stroke: {
        width: 4,
        colors: [isDarkMode ? "#101828" : "#FFFFFF"],
      },

      plotOptions: {
        pie: {
          expandOnClick: false,

          donut: {
            size: "70%",

            labels: {
              show: true,

              name: {
                show: true,
                offsetY: 18,
                color: textColor,
                fontSize: "13px",
                fontWeight: 500,
              },

              value: {
                show: true,
                offsetY: -18,
                color: headingColor,
                fontSize: "26px",
                fontWeight: 700,
                formatter: (value) => formatCount(value),
              },

              total: {
                show: true,
                showAlways: true,
                label: "Users",
                color: textColor,
                fontSize: "13px",
                fontWeight: 500,
                formatter: (chartContext) => {
                  const total = chartContext.globals.seriesTotals.reduce(
                    (sum, value) => sum + value,
                    0
                  );

                  return formatCount(total);
                },
              },
            },
          },
        },
      },

      legend: {
        show: true,
        position: "bottom",
        horizontalAlign: "center",
        fontSize: "12px",
        labels: {
          colors: textColor,
        },
        markers: {
          size: 6,
          shape: "circle",
        },
        itemMargin: {
          horizontal: 8,
          vertical: 4,
        },
      },

      tooltip: {
        theme: tooltipTheme,
        y: {
          formatter: (value) => {
            const count = getNonNegativeInteger(value);
            const label = count === 1 ? "user" : "users";

            return `${formatCount(count)} ${label}`;
          },
        },
      },

      responsive: [
        {
          breakpoint: 480,

          options: {
            chart: {
              height: 260,
            },

            legend: {
              fontSize: "11px",
            },
          },
        },
      ],
    }),
    [headingColor, isDarkMode, textColor, tooltipTheme]
  );

  return (
    <section className="h-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/3">
      <div className="min-w-0 px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Marketplace Users
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customer and seller distribution across Sellora.
        </p>
      </div>

      <div className="flex min-h-70 items-center justify-center px-3 py-2">
        {isLoading ? (
          <div className="size-48 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
        ) : hasChartData ? (
          <div className="w-full max-w-80">
            <Chart
              options={options}
              series={series}
              type="donut"
              width="100%"
              height={280}
            />
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-8"
                aria-hidden="true"
              >
                <path
                  d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />

                <path
                  d="M3 21V19C3 15.6863 5.68629 13 9 13C12.3137 13 15 15.6863 15 19V21"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />

                <path
                  d="M16 4.1C17.7207 4.54633 19 6.11085 19 8C19 9.88915 17.7207 11.4537 16 11.9"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              No marketplace users yet
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 border-t border-gray-100 dark:border-gray-800">
        <div className="min-w-0 border-r border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Customers</p>

          {isLoading ? (
            <div className="mt-2 h-5 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          ) : (
            <p className="mt-1 wrap-break-word text-sm font-semibold text-gray-800 dark:text-white/90">
              {formatCount(totalCustomers)}
            </p>
          )}
        </div>

        <div className="min-w-0 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total sellers
          </p>

          {isLoading ? (
            <div className="mt-2 h-5 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          ) : (
            <p className="mt-1 wrap-break-word text-sm font-semibold text-gray-800 dark:text-white/90">
              {formatCount(totalSellers)}
            </p>
          )}
        </div>

        <div className="min-w-0 border-r border-gray-100 px-4 py-3 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Approved sellers
          </p>

          {isLoading ? (
            <div className="mt-2 h-5 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          ) : (
            <p className="mt-1 wrap-break-word text-sm font-semibold text-success-600 dark:text-success-400">
              {formatCount(approvedSellers)}
            </p>
          )}
        </div>

        <div className="min-w-0 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Pending sellers
          </p>

          {isLoading ? (
            <div className="mt-2 h-5 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          ) : (
            <p className="mt-1 wrap-break-word text-sm font-semibold text-warning-600 dark:text-warning-400">
              {formatCount(pendingSellers)}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default MarketplaceUsersChart;
