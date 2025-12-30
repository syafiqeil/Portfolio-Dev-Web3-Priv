// app/api/pinata/key/route.ts

import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions } from "@/app/lib/session";

export async function GET() {
  try {
    // 1. Cek Auth (Hanya Owner yang boleh minta kunci)
    const session = await getIronSession(await cookies(), sessionOptions);
    if (!session.address) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uuid = crypto.randomUUID();
    const body = JSON.stringify({
      keyName: `temp_upload_${uuid}`,
      permissions: {
        endpoints: {
          data: {
            pinList: false,
            userPinnedDataTotal: false
          },
          pinning: {
            pinFileToIPFS: true,
            pinJSONToIPFS: true,
            pinJobs: false,
            unpin: false,
            userPinPolicy: false
          }
        }
      },
      maxUses: 5
    });

    const keyRes = await fetch("https://api.pinata.cloud/users/generateApiKey", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Pastikan variabel ini benar-benar ada di .env.local
        Authorization: `Bearer ${process.env.JWT}`, 
      },
      body: body,
    });

    // DEBUGGING 
    if (!keyRes.ok) {
      const errorText = await keyRes.text(); // Ambil pesan error asli dari Pinata
      console.error("❌ Pinata API Error:", keyRes.status, errorText);
      throw new Error(`Pinata Error: ${errorText}`);
    }
   
    const keyData = await keyRes.json();
    return NextResponse.json({ JWT: keyData.JWT });

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}