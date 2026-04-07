import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "expire overdue subscriptions",
  { hours: 1 },
  internal.subscriptions.expireOverdueSubscriptions,
);

export default crons;
