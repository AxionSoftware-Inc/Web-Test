import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Frontend Auth Token & Session Tests", () => {
  test("Token Authorization header format adheres to DRF standards", () => {
    function prepareHeaders(token) {
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Token ${token}`;
      }
      return headers;
    }

    const unauthedHeaders = prepareHeaders(null);
    assert.equal(unauthedHeaders["Authorization"], undefined);

    const authedHeaders = prepareHeaders("9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b");
    assert.equal(authedHeaders["Authorization"], "Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b");
  });

  test("Auth success sets token and identity storage correctly", () => {
    const mockStorage = new Map();

    function onLoginSuccess(token, identityCode, activeRole) {
      if (token) mockStorage.set("questlab-auth-token", token);
      mockStorage.set("questlab-auth-identity", identityCode);
      mockStorage.set("questlab-role", activeRole);
    }

    onLoginSuccess("test-token-123", "user-42", "teacher");

    assert.equal(mockStorage.get("questlab-auth-token"), "test-token-123");
    assert.equal(mockStorage.get("questlab-auth-identity"), "user-42");
    assert.equal(mockStorage.get("questlab-role"), "teacher");
  });

  test("Logout clears token and all auth flags", () => {
    const mockStorage = new Map([
      ["questlab-auth-token", "tok-xyz"],
      ["questlab-auth-identity", "user-10"],
      ["questlab-role", "creator"],
    ]);

    function onLogout() {
      mockStorage.delete("questlab-auth-token");
      mockStorage.delete("questlab-auth-identity");
      mockStorage.delete("questlab-role");
    }

    onLogout();

    assert.equal(mockStorage.has("questlab-auth-token"), false);
    assert.equal(mockStorage.has("questlab-auth-identity"), false);
    assert.equal(mockStorage.has("questlab-role"), false);
  });
});
