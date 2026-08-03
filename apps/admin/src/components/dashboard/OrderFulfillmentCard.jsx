import { useMemo } from "react";
import Chart from "react-apexcharts";

import useDashboardChartTheme from "./useDashboardChartTheme.js";

const integerFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

function getNonNegativeInteger(value) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? Math.trunc(number) : 0;
}

function formatCount(value) {
  return integerFormatter.format(getNonNegativeInteger(value));
}

function OrderFulfillmentCard({ orders = null, isLoading = false }) {
  const { textColor, headingColor, trackColor, tooltipTheme } =
    useDashboardChartTheme();

  const totalOrders = getNonNegativeInteger(orders?.total);
  const deliveredOrders = getNonNegativeInteger(orders?.delivered);

  const inProgressOrders =
    getNonNegativeInteger(orders?.placed) +
    getNonNegativeInteger(orders?.confirmed) +
    getNonNegativeInteger(orders?.processing) +
    getNonNegativeInteger(orders?.shipped);

  const fulfillmentPercentage =
    totalOrders > 0
      ? Math.min(
          100,
          Number(((deliveredOrders / totalOrders) * 100).toFixed(1))
        )
      : 0;

  const options = useMemo(
    () => ({
      chart: {
        type: "radialBar",
        fontFamily: "Outfit, sans-serif",
        sparkline: {
          enabled: true,
        },
        animations: {
          enabled: true,
          speed: 500,
        },
      },

      colors: ["#465FFF"],

      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 90,

          hollow: {
            size: "64%",
          },

          track: {
            background: trackColor,
            strokeWidth: "100%",
            margin: 5,
          },

          dataLabels: {
            name: {
              show: true,
              offsetY: 35,
              color: textColor,
              fontSize: "13px",
              fontWeight: 500,
            },

            value: {
              show: true,
              offsetY: -5,
              color: headingColor,
              fontSize: "30px",
              fontWeight: 700,
              formatter: (value) => `${Number(value).toFixed(1)}%`,
            },
          },
        },
      },

      stroke: {
        lineCap: "round",
      },

      labels: ["Delivered"],

      tooltip: {
        enabled: true,
        theme: tooltipTheme,
        y: {
          formatter: (value) => `${Number(value).toFixed(1)}%`,
        },
      },
    }),
    [headingColor, textColor, tooltipTheme, trackColor]
  );

  return (
    <section className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/3">
      <div className="min-w-0 px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Order Fulfillment
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Delivered orders as a percentage of all orders.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-3 py-1">
        {isLoading ? (
          <div className="size-40 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
        ) : (
          <div className="w-full max-w-72">
            <Chart
              options={options}
              series={[fulfillmentPercentage]}
              type="radialBar"
              height={195}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 border-t border-gray-100 dark:border-gray-800">
        <div className="min-w-0 px-3 py-4 text-center sm:px-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>

          {isLoading ? (
            <div className="mx-auto mt-2 h-5 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          ) : (
            <p className="mt-1 wrap-break-word text-sm font-semibold text-gray-800 dark:text-white/90">
              {formatCount(totalOrders)}
            </p>
          )}
        </div>

        <div className="min-w-0 border-x border-gray-100 px-3 py-4 text-center sm:px-4 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Delivered</p>

          {isLoading ? (
            <div className="mx-auto mt-2 h-5 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          ) : (
            <p className="mt-1 wrap-break-word text-sm font-semibold text-success-600 dark:text-success-400">
              {formatCount(deliveredOrders)}
            </p>
          )}
        </div>

        <div className="min-w-0 px-3 py-4 text-center sm:px-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            In progress
          </p>

          {isLoading ? (
            <div className="mx-auto mt-2 h-5 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          ) : (
            <p className="mt-1 wrap-break-word text-sm font-semibold text-warning-600 dark:text-warning-400">
              {formatCount(inProgressOrders)}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default OrderFulfillmentCard;
