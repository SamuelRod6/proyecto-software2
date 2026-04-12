import { isValidEmail, isValidPassword } from "./validators";

describe("validators", () => {
  it("validates emails", () => {
    expect(isValidEmail(" test@mail.com ")).toBe(true);
    expect(isValidEmail("invalid-mail")).toBe(false);
  });

  it("validates strong passwords", () => {
    expect(isValidPassword("Abcd1234")).toBe(true);
    expect(isValidPassword("abcd1234")).toBe(false);
    expect(isValidPassword("ABCD1234")).toBe(false);
    expect(isValidPassword("Abcdefgh")).toBe(false);
  });
});
