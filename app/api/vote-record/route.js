import { NextResponse } from "next/server";

import { saveVoteRecord } from "@/lib/data-store";

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body?.transactionHash || !body?.walletAddress || !body?.action) {
      return NextResponse.json(
        {
          error: "action, walletAddress, and transactionHash are required.",
        },
        { status: 400 },
      );
    }

    await saveVoteRecord({
      action: body.action,
      candidateId: body.candidateId,
      transactionHash: body.transactionHash,
      walletAddress: body.walletAddress,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to store vote metadata.",
      },
      { status: 500 },
    );
  }
}
