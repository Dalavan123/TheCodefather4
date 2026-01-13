import { isMyDocument } from "@/lib/docLogic";

describe("isMyDocument", () => {
  it("returnerar true när anvndare äger dokumentet", () => {
    expect(isMyDocument(1, 1)).toBe(true);
  });

  it("returnerar false när dokumentet ägs av annan", () => {
    expect(isMyDocument(1, 2)).toBe(false);
  });

  it("returnerar false när ingen är inloggad", () => {
    expect(isMyDocument(null, 2)).toBe(false);
  });
});
