export function formatJobCount(count: number) {
  return `${count} ${count === 1 ? "job" : "jobs"}`;
}

export function formatAnalyticsPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}
