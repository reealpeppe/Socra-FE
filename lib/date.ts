// The API serializes UTC datetimes without an offset. Native Date parsing
// treats those strings as local time, so make the implicit UTC explicit.
const ISO_WITHOUT_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?$/;

export function parseApiDate(value: string): Date {
  return new Date(ISO_WITHOUT_OFFSET.test(value) ? `${value}Z` : value);
}
