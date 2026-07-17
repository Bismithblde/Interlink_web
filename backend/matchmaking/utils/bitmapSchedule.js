const BLOCK_MINUTES = 30;
const BLOCKS_PER_WEEK = 7 * 24 * (60 / BLOCK_MINUTES);
const CAMPUS_TIME_ZONE = "America/New_York";
const ALLOWED_MINIMUMS = new Set([30, 60, 90, 120]);

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CAMPUS_TIME_ZONE,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const DAY_INDEX = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

const localBlockIndex = (instant) => {
  const parts = Object.fromEntries(
    formatter.formatToParts(instant).map(({ type, value }) => [type, value])
  );
  const day = DAY_INDEX[parts.weekday];
  const hour = Number(parts.hour) % 24;
  const minute = Number(parts.minute);
  return day * 48 + hour * 2 + Math.floor(minute / BLOCK_MINUTES);
};

const normalizeMinimumOverlap = (value) => {
  const minutes = value === undefined || value === null ? 30 : Number(value);
  if (!ALLOWED_MINIMUMS.has(minutes)) {
    const error = new Error("minOverlapMinutes must be one of 30, 60, 90, or 120");
    error.status = 400;
    throw error;
  }
  return minutes;
};

const scheduleToBitmap = (slots = []) => {
  let bitmap = 0n;
  slots.forEach((slot) => {
    const start = new Date(slot?.start || slot?.start_time);
    const end = new Date(slot?.end || slot?.end_time);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      throw new Error("Availability slots require valid start and end values");
    }
    const firstFullBlock = Math.ceil(start.getTime() / 1800000) * 1800000;
    const lastBoundary = Math.floor(end.getTime() / 1800000) * 1800000;
    for (let cursor = firstFullBlock; cursor < lastBoundary; cursor += 1800000) {
      bitmap |= 1n << BigInt(localBlockIndex(new Date(cursor)));
    }
  });
  return bitmap;
};

const bitmapAnd = (...bitmaps) => bitmaps.reduce((result, bitmap) => result & bitmap);

const countBits = (bitmap) => {
  let value = bitmap;
  let count = 0;
  while (value) {
    value &= value - 1n;
    count += 1;
  }
  return count;
};

const longestConsecutiveBlocks = (bitmap) => {
  let longest = 0;
  let current = 0;
  for (let index = 0; index < BLOCKS_PER_WEEK; index += 1) {
    if ((bitmap & (1n << BigInt(index))) !== 0n) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
};

const compareSchedules = (schedules) => {
  const bitmaps = schedules.map(scheduleToBitmap);
  const overlapBitmap = bitmapAnd(...bitmaps);
  return {
    bitmaps,
    overlapBitmap,
    overlapMinutes: countBits(overlapBitmap) * BLOCK_MINUTES,
    longestOverlapMinutes: longestConsecutiveBlocks(overlapBitmap) * BLOCK_MINUTES,
  };
};

module.exports = {
  BLOCKS_PER_WEEK,
  BLOCK_MINUTES,
  CAMPUS_TIME_ZONE,
  normalizeMinimumOverlap,
  scheduleToBitmap,
  bitmapAnd,
  countBits,
  longestConsecutiveBlocks,
  compareSchedules,
};
