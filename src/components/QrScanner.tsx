"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

const ELEMENT_ID = "qr-scanner-region";

export function QrScanner({
  onScan,
  paused = false,
}: {
  onScan: (decodedText: string) => void;
  paused?: boolean;
}) {
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
      // stop() while not actually running throws.
      try {
        const state = scanner.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          scanner.stop().catch(() => {});
        }
      } catch {
        // ignore
      }
    };
  }, []);

  // Stop decoding new frames while a scan result is being shown, so the
  // still-visible QR code doesn't immediately re-trigger onScan.
  useEffect(() => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      const state = scanner.getState();
      if (paused && state === Html5QrcodeScannerState.SCANNING) {
        scanner.pause(true);
      } else if (!paused && state === Html5QrcodeScannerState.PAUSED) {
        scanner.resume();
      }
    } catch {
      // ignore — scanner may not be ready yet (e.g. camera denied)
    }
  }, [paused]);

  return (
    <div
      id={ELEMENT_ID}
      className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-black"
    />
  );
}
