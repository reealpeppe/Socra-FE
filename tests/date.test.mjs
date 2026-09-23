import assert from "node:assert/strict";
import { after, test } from "node:test";
import { parseApiDate } from "../lib/date.ts";

const originalTimezone = process.env.TZ;
after(() => { process.env.TZ = originalTimezone; });

test("UTC-naive API dates mean UTC in Europe/Rome", () => {
  process.env.TZ = "Europe/Rome";
  assert.equal(new Date("2026-09-23T12:00:00").getTimezoneOffset(), -120);
  assert.equal(parseApiDate("2026-09-23T12:00:00").toISOString(), "2026-09-23T12:00:00.000Z");
  assert.equal(parseApiDate("2026-09-23T12:00:00.123456").toISOString(), "2026-09-23T12:00:00.123Z");
});

test("UTC-naive API dates mean UTC in a negative-offset timezone", () => {
  process.env.TZ = "America/New_York";
  assert.equal(new Date("2026-09-23T12:00:00").getTimezoneOffset(), 240);
  assert.equal(parseApiDate("2026-09-23T12:00:00").toISOString(), "2026-09-23T12:00:00.000Z");
});

test("explicit Z and numeric offsets keep their stated instant", () => {
  process.env.TZ = "Europe/Rome";
  assert.equal(parseApiDate("2026-09-23T12:00:00Z").toISOString(), "2026-09-23T12:00:00.000Z");
  assert.equal(parseApiDate("2026-09-23T12:00:00+02:00").toISOString(), "2026-09-23T10:00:00.000Z");
  assert.equal(parseApiDate("2026-09-23T12:00:00-04:00").toISOString(), "2026-09-23T16:00:00.000Z");
});
