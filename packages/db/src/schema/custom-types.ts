import { customType } from "drizzle-orm/pg-core";

/**
 * Custom Drizzle mapping for PostgreSQL pgvector extension type: vector(1536).
 */
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value.replace(/[\][]/g, "").split(",").map(Number);
      }
    }
    return value;
  },
});

/**
 * Custom Drizzle mapping for PostgreSQL tsvector type.
 */
export const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tsvector";
  },
});
