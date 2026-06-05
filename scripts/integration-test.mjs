/**
 * CardioScan AI — webplatform integration test suite
 * Run: node scripts/integration-test.mjs
 */
const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";
const TEST_EMAIL = `test-${Date.now()}@cardioscan.test`;
const SAMPLE_IMAGE = process.env.SAMPLE_IMAGE || "D:/FYP/model/rest/rest001.jpg";

const results = [];
let passed = 0;
let failed = 0;

function log(status, name, detail = "") {
  const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "•";
  const line = `[${icon}] ${name}${detail ? ` — ${detail}` : ""}`;
  console.log(line);
  results.push({ status, name, detail });
  if (status === "PASS") passed++;
  if (status === "FAIL") failed++;
}

async function readImageBlob() {
  const fs = await import("fs");
  if (!fs.existsSync(SAMPLE_IMAGE)) {
    throw new Error(`Sample image not found: ${SAMPLE_IMAGE}`);
  }
  return fs.readFileSync(SAMPLE_IMAGE);
}

async function testPageRoutes() {
  const routes = ["/", "/login", "/signup", "/dashboard", "/results?id=test"];
  for (const route of routes) {
    try {
      const res = await fetch(`${BASE}${route}`);
      log(res.ok || res.status === 200 ? "PASS" : "FAIL", `GET ${route}`, `status ${res.status}`);
    } catch (e) {
      log("FAIL", `GET ${route}`, e.message);
    }
  }
}

async function testPredictEdgeCases() {
  // No file
  {
    const fd = new FormData();
    const res = await fetch(`${BASE}/api/predict`, { method: "POST", body: fd });
    const data = await res.json();
    log(res.status === 400 && data.error ? "PASS" : "FAIL", "POST /api/predict — no file", `status ${res.status}`);
  }

  // Filename starting with "1" should NOT bypass backend (must include ensemble + scan_id or backend response)
  {
    const buf = await readImageBlob();
    const fd = new FormData();
    fd.append("file", new Blob([buf], { type: "image/jpeg" }), "1001_test_scan.jpg");
    fd.append("user_email", TEST_EMAIL);
    fd.append("patient_info", JSON.stringify({ patient_name: "Edge Case Patient" }));

    const res = await fetch(`${BASE}/api/predict`, { method: "POST", body: fd });
    const data = await res.json();

    const hasModels = data.VGG16 && data.ResNet50 && data.DenseNet121 && data.ensemble;
    const notBareCalibration =
      data.scan_id !== undefined || data.source !== undefined || hasModels;
    log(
      res.ok && hasModels && notBareCalibration ? "PASS" : "FAIL",
      "POST /api/predict — filename starts with 1 (no calibration shortcut)",
      `status ${res.status}, models=${!!hasModels}, scan_id=${data.scan_id ?? "none"}`
    );
    return data;
  }
}

async function testPredictValid() {
  const buf = await readImageBlob();
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type: "image/jpeg" }), "mpi_scan_test.jpg");
  fd.append("user_email", TEST_EMAIL);
  fd.append(
    "patient_info",
    JSON.stringify({
      patient_name: "Integration Test Patient",
      imaging_protocol: "Tc-99m Gated SPECT",
      stress_protocol: "Pharmacologic (Adenosine)",
      history: "Hypertension",
      indications: "Chest pain",
    })
  );

  const res = await fetch(`${BASE}/api/predict`, { method: "POST", body: fd });
  const data = await res.json();

  const ok =
    res.ok &&
    data.ensemble &&
    typeof data.ensemble.probability === "number" &&
    data.ensemble.vessels &&
    ["VGG16", "ResNet50", "DenseNet121"].every((m) => data[m]);

  log(ok ? "PASS" : "FAIL", "POST /api/predict — valid upload", `status ${res.status}, scan_id=${data.scan_id ?? "none"}`);
  if (!ok) console.log("  Response:", JSON.stringify(data).slice(0, 300));
  return data;
}

async function testAnalyzeEdgeCases() {
  {
    const res = await fetch(`${BASE}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    log(res.status === 400 && data.error ? "PASS" : "FAIL", "POST /api/analyze — no predictions", `status ${res.status}`);
  }

  {
    const res = await fetch(`${BASE}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        predictions: {
          ensemble: {
            probability: 0.72,
            prediction: "Abnormal",
            risk_level: "Critical",
            confidence: 44,
            vessels: { LAD: 0.65, LCX: 0.48, RCA: 0.72 },
          },
        },
        patient_info: { patient_name: "Test", history: "None", indications: "None" },
      }),
    });
    const data = await res.json();
    const hasSections =
      data.report &&
      data.report.includes("NUCLEAR IMAGING PROTOCOL") &&
      data.report.includes("IMPRESSION") &&
      (data.report.includes("LAD") || data.report.includes("LAD Territory"));
    log(res.ok && hasSections ? "PASS" : "FAIL", "POST /api/analyze — valid predictions", `status ${res.status}, report_len=${data.report?.length ?? 0}`);
    if (!hasSections) console.log("  Report preview:", data.report?.slice(0, 200));
    return data.report;
  }
}

async function testProfile() {
  {
    const res = await fetch(`${BASE}/api/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    log(res.status === 400 ? "PASS" : "FAIL", "POST /api/profile — no email", `status ${res.status}`);
  }

  {
    const res = await fetch(`${BASE}/api/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        name: "Integration Tester",
        provider: "local",
      }),
    });
    const data = await res.json();
    log(res.ok && data.success ? "PASS" : "FAIL", "POST /api/profile — upsert", `status ${res.status}`);
  }
}

async function testScansListEmpty() {
  const res = await fetch(`${BASE}/api/scans?email=${encodeURIComponent(TEST_EMAIL)}`);
  const data = await res.json();
  log(res.ok && Array.isArray(data) ? "PASS" : "FAIL", "GET /api/scans — list for test user", `count=${Array.isArray(data) ? data.length : "n/a"}`);
  return data;
}

async function testScansEdgeCases() {
  {
    const res = await fetch(`${BASE}/api/scans`);
    const data = await res.json();
    log(res.status === 400 ? "PASS" : "FAIL", "GET /api/scans — missing email", `status ${res.status}`);
  }

  {
    const res = await fetch(`${BASE}/api/scans?id=x&email=${encodeURIComponent(TEST_EMAIL)}`, { method: "DELETE" });
    log(res.status === 404 || res.status === 400 ? "PASS" : "FAIL", "DELETE /api/scans — non-existent scan", `status ${res.status}`);
  }

  {
    const res = await fetch(`${BASE}/api/scans`, { method: "DELETE" });
    log(res.status === 400 ? "PASS" : "FAIL", "DELETE /api/scans — missing params", `status ${res.status}`);
  }
}

async function testResultsEdgeCases() {
  {
    const res = await fetch(`${BASE}/api/results`);
    const data = await res.json();
    log(res.status === 400 ? "PASS" : "FAIL", "GET /api/results — missing id", `status ${res.status}`);
  }

  {
    const res = await fetch(`${BASE}/api/results?id=00000000-0000-0000-0000-000000000000`);
    log(res.status === 404 ? "PASS" : "FAIL", "GET /api/results — invalid uuid", `status ${res.status}`);
  }
}

async function testMigrate() {
  {
    const res = await fetch(`${BASE}/api/migrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: "not-array" }),
    });
    log(res.status === 400 ? "PASS" : "FAIL", "POST /api/migrate — invalid payload", `status ${res.status}`);
  }
}

async function testFullFlow() {
  const predictData = await testPredictValid();
  if (!predictData?.ensemble) {
    log("FAIL", "Full flow — predict step failed", "skipped remaining");
    return;
  }

  const { scan_id, ...predictions } = predictData;

  const analyzeRes = await fetch(`${BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      predictions,
      filename: "mpi_scan_test.jpg",
      scan_id,
      user_email: TEST_EMAIL,
      patient_info: {
        patient_name: "Full Flow Patient",
        imaging_protocol: "Tc-99m Gated SPECT",
        stress_protocol: "Exercise (Bruce Protocol)",
        history: "Diabetes",
        indications: "Dyspnea",
      },
    }),
  });
  const analyzeData = await analyzeRes.json();
  log(analyzeRes.ok && analyzeData.report ? "PASS" : "FAIL", "Full flow — analyze + save report", `scan_id=${scan_id}`);

  if (scan_id) {
    const resultRes = await fetch(`${BASE}/api/results?id=${scan_id}`);
    const resultData = await resultRes.json();
    log(
      resultRes.ok && resultData.predictions?.ensemble && resultData.report
        ? "PASS"
        : "FAIL",
      "Full flow — GET /api/results",
      `report_len=${resultData.report?.length ?? 0}`
    );

    const listRes = await fetch(`${BASE}/api/scans?email=${encodeURIComponent(TEST_EMAIL)}`);
    const list = await listRes.json();
    const found = Array.isArray(list) && list.some((s) => s.id === scan_id);
    log(found ? "PASS" : "FAIL", "Full flow — scan appears in history", `total=${list?.length ?? 0}`);

    const delRes = await fetch(
      `${BASE}/api/scans?id=${encodeURIComponent(scan_id)}&email=${encodeURIComponent(TEST_EMAIL)}`,
      { method: "DELETE" }
    );
    const delData = await delRes.json();
    log(delRes.ok && delData.success ? "PASS" : "FAIL", "Full flow — DELETE scan", `status ${delRes.status}`);

    const afterDel = await fetch(`${BASE}/api/results?id=${scan_id}`);
    log(afterDel.status === 404 ? "PASS" : "FAIL", "Full flow — scan gone after delete", `status ${afterDel.status}`);
  } else {
    log("FAIL", "Full flow — no scan_id returned from predict", "DB save may have failed");
  }
}

async function testGoogleOAuthConfig() {
  const fs = await import("fs");
  const path = await import("path");
  const envPath = path.join(process.cwd(), ".env.local");
  let hasGoogleId = false;
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, "utf8");
    hasGoogleId = /NEXT_PUBLIC_GOOGLE_CLIENT_ID=.+/.test(env) && !/NEXT_PUBLIC_GOOGLE_CLIENT_ID=\s*$/.test(env);
  }
  log(hasGoogleId ? "PASS" : "FAIL", "Google OAuth — NEXT_PUBLIC_GOOGLE_CLIENT_ID configured", hasGoogleId ? "present" : "missing");
}

async function testEnvConfig() {
  const fs = await import("fs");
  const path = await import("path");
  const envPath = path.join(process.cwd(), ".env.local");
  const checks = {
    GROQ_API_KEY: false,
    PYTHON_BACKEND_URL: false,
    NEXT_PUBLIC_SUPABASE_URL: false,
    SUPABASE_SERVICE_ROLE_KEY: false,
  };
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, "utf8");
    for (const key of Object.keys(checks)) {
      checks[key] = new RegExp(`${key}=.+`).test(env);
    }
  }
  for (const [key, ok] of Object.entries(checks)) {
    log(ok ? "PASS" : "FAIL", `Env — ${key}`, ok ? "configured" : "missing");
  }
}

async function main() {
  console.log("\n========================================");
  console.log(" CardioScan AI — Integration Tests");
  console.log(` Base URL: ${BASE}`);
  console.log(` Test email: ${TEST_EMAIL}`);
  console.log("========================================\n");

  try {
    await fetch(BASE);
  } catch {
    console.error(`\nERROR: Cannot reach ${BASE}. Start dev server with: npm run dev\n`);
    process.exit(1);
  }

  console.log("--- Environment ---");
  await testEnvConfig();
  await testGoogleOAuthConfig();

  console.log("\n--- Page Routes ---");
  await testPageRoutes();

  console.log("\n--- API Edge Cases ---");
  await testPredictEdgeCases();
  await testAnalyzeEdgeCases();
  await testProfile();
  await testScansEdgeCases();
  await testResultsEdgeCases();
  await testMigrate();

  console.log("\n--- Full E2E Flow ---");
  await testFullFlow();

  console.log("\n========================================");
  console.log(` Results: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log("========================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Test runner crashed:", e);
  process.exit(1);
});
