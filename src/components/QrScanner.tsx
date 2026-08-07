"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

const ELEMENT_ID = "qr-scanner-region";

export function QrScanner({ onScan }: { onScan: (decodedText: string) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const scanner = new Html5Qrcode(ELEMENT_ID);
    scannerRef.current = scanner;
    let stopped = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (!stopped) onScanRef.current(decodedText);
        },
        () => {
          // ignore per-frame "no QR found" errors
        }
      )
      .catch(() => {
        // camera unavailable (permissions denied, no camera, etc.) — manual entry still works
      });

    return () => {
      stopped = true;
      // Check the live state rather than trusting the start() promise: under
      // React Strict Mode's mount/cleanup/remount dev cycle, start() can
      // resolve after the scanner has already been torn down, and calling
      // stop() while not actually SCANNING throws.
      try {
        if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
          scanner.stop().catch(() => {});
        }
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <div
      id={ELEMENT_ID}
      className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-black"
    />
  );
}
