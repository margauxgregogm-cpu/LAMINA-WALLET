// @ts-nocheck
import "server-only";
import { NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const forge = require("node-forge");

// TEMPORARY diagnostic route -- not part of the app, remove after debugging
// the invalid-signature issue on Preview. Returns only non-secret fingerprints
// (modulus hashes), never the raw key/cert material.
export async function GET() {
  try {
    const certPem = process.env.APPLE_WALLET_SIGNER_CERT!.replace(/\\n/g, "\n");
    const keyPem = process.env.APPLE_WALLET_SIGNER_KEY!.replace(/\\n/g, "\n");

    const cert = forge.pki.certificateFromPem(certPem);
    const key = forge.pki.decryptRsaPrivateKey(keyPem, undefined);

    return NextResponse.json({
      certLength: certPem.length,
      keyLength: keyPem.length,
      certFirst20: JSON.stringify(certPem.slice(0, 20)),
      keyFirst20: JSON.stringify(keyPem.slice(0, 20)),
      certModulus: cert.publicKey.n.toString(16),
      keyModulusNull: key === null,
      keyModulus: key ? key.n.toString(16) : null,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
