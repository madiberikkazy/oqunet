import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { t } from "../src/utils/i18n.js";

describe("book daysLeft and availability logic", () => {
  it("daysLeftCount never outputs negative numbers for any locale", () => {
    // Default locale (kz)
    assert.equal(t.daysLeftCount(5), "5 күн қалды");
    assert.equal(t.daysLeftCount(0), "0 күн қалды");
    assert.equal(t.daysLeftCount(-17), "0 күн қалды");
    assert.equal(t.daysLeftCount(-1), "0 күн қалды");
  });

  it("resolves effective status to available when loan has expired (daysLeft <= 0)", () => {
    const checkStatus = (status, daysLeft) => {
      const isExpired = daysLeft != null && daysLeft <= 0;
      return isExpired ? "available" : status;
    };

    assert.equal(checkStatus("unavailable", -17), "available");
    assert.equal(checkStatus("unavailable", 0), "available");
    assert.equal(checkStatus("unavailable", 3), "unavailable");
    assert.equal(checkStatus("available", null), "available");
  });

  it("suppresses countdown card when daysLeft <= 0 or isExpired", () => {
    const shouldShowCountdown = (effectiveStatus, isExpired, daysLeft) => {
      return effectiveStatus === "unavailable" && !isExpired && daysLeft != null && daysLeft > 0;
    };

    // When loan is active with days remaining
    assert.equal(shouldShowCountdown("unavailable", false, 4), true);
    assert.equal(shouldShowCountdown("unavailable", false, 1), true);

    // When loan has expired or daysLeft <= 0
    assert.equal(shouldShowCountdown("available", true, 0), false);
    assert.equal(shouldShowCountdown("available", true, -17), false);
    assert.equal(shouldShowCountdown("unavailable", true, 0), false);
    assert.equal(shouldShowCountdown("unavailable", false, 0), false);
    assert.equal(shouldShowCountdown("unavailable", false, -5), false);
  });
});

