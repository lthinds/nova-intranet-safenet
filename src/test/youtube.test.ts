import { describe, expect, it } from "vitest";
import { youtubeId } from "@/components/portal-communications";

describe("youtubeId", () => {
  it("reads watch links", () => expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ"));
  it("reads short links", () => expect(youtubeId("https://youtu.be/dQw4w9WgXcQ?t=10")).toBe("dQw4w9WgXcQ"));
  it("rejects non-YouTube links", () => expect(youtubeId("https://vimeo.com/123")).toBeNull());
});
