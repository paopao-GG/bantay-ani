/**
 * Seed Firestore with default nodes + config.
 *
 * Usage (from webapp/):
 *   npm run seed
 *
 * Requires .env.local with FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
 * FIREBASE_PRIVATE_KEY populated. Idempotent — safe to re-run.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { DEFAULT_CONFIG } from "../lib/types";

function getAdminDb() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing FIREBASE_* env vars in .env.local");
    }
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  return getFirestore();
}

async function main() {
  const db = getAdminDb();

  const nodes = [
    {
      id: "node-001",
      location: "North field — tomato bed",
      install_date: "2026-04-12",
      raw_dry: 3000,
      raw_wet: 1200,
    },
    {
      id: "node-002",
      location: "Greenhouse — pepper row",
      install_date: "2026-05-02",
      raw_dry: 3000,
      raw_wet: 1200,
    },
  ];

  for (const n of nodes) {
    const { id, ...data } = n;
    await db.doc(`nodes/${id}`).set(data, { merge: true });
    console.log(`  ✓ nodes/${id}`);
  }

  await db.doc("config/global").set(DEFAULT_CONFIG, { merge: true });
  console.log("  ✓ config/global");

  console.log("\nSeed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
