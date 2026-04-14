// @vitest-environment node
import { vi, test, expect, beforeEach } from "vitest";
import { jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const { createSession } = await import("@/lib/auth");

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession sets a cookie named auth-token", async () => {
  await createSession("user-1", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  expect(mockCookieStore.set.mock.calls[0][0]).toBe("auth-token");
});

test("createSession sets cookie with correct security options", async () => {
  await createSession("user-1", "test@example.com");

  const options = mockCookieStore.set.mock.calls[0][2];
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.secure).toBe(false); // NODE_ENV is not "production" in tests
  expect(options.path).toBe("/");
});

test("createSession sets cookie that expires in approximately 7 days", async () => {
  const before = Date.now();
  await createSession("user-1", "test@example.com");
  const after = Date.now();

  const expires: Date = mockCookieStore.set.mock.calls[0][2].expires;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession cookie value is a valid JWT containing userId and email", async () => {
  await createSession("user-42", "bruno@example.com");

  const token = mockCookieStore.set.mock.calls[0][1];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("bruno@example.com");
});
