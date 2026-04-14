import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { hashNic, normalizeWalletAddress } from "@/lib/crypto";

const ELIGIBLE_VOTERS_COLLECTION =
  process.env.FIREBASE_ELIGIBLE_VOTERS_COLLECTION || "eligible_voters";
const VOTE_RECORDS_COLLECTION =
  process.env.FIREBASE_VOTE_RECORDS_COLLECTION || "vote_records";

function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  };
}

function getDb() {
  const firebaseConfig = getFirebaseConfig();

  if (!firebaseConfig) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
    );
  }

  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }

  return getFirestore();
}

export async function findEligibleVoterByNic(nic) {
  const db = getDb();
  const nicHash = hashNic(nic);

  const directMatch = await db.collection(ELIGIBLE_VOTERS_COLLECTION).doc(nicHash).get();

  if (directMatch.exists) {
    const data = directMatch.data();

    return {
      nicHash,
      walletAddress: normalizeWalletAddress(data.walletAddress),
      isEligible: Boolean(data.isEligible),
      fullName: data.fullName || "",
    };
  }

  const querySnapshot = await db
    .collection(ELIGIBLE_VOTERS_COLLECTION)
    .where("nicHash", "==", nicHash)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  const data = querySnapshot.docs[0].data();

  return {
    nicHash,
    walletAddress: normalizeWalletAddress(data.walletAddress),
    isEligible: Boolean(data.isEligible),
    fullName: data.fullName || "",
  };
}

export async function saveVoteRecord(record) {
  const db = getDb();

  await db.collection(VOTE_RECORDS_COLLECTION).add({
    action: record.action,
    candidateId: record.candidateId ?? null,
    createdAt: new Date().toISOString(),
    transactionHash: record.transactionHash,
    walletAddress: normalizeWalletAddress(record.walletAddress),
  });
}
