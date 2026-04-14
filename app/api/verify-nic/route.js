import { NextResponse } from "next/server";

import { findEligibleVoterByNic } from "@/lib/firebase";

export async function POST(request) {
  try {
    const body = await request.json();
    const nic = String(body?.nic || "").trim();

    if (!nic) {
      return NextResponse.json(
        {
          error: "NIC number is required.",
        },
        { status: 400 },
      );
    }

    const voter = await findEligibleVoterByNic(nic);

    if (!voter) {
      return NextResponse.json(
        {
          error: "NIC not found in the eligible voter list.",
        },
        { status: 404 },
      );
    }

    if (!voter.isEligible) {
      return NextResponse.json(
        {
          error: "NIC exists, but this voter is marked ineligible.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      exists: true,
      isEligible: true,
      walletAddress: voter.walletAddress,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify the NIC number.",
      },
      { status: 500 },
    );
  }
}
