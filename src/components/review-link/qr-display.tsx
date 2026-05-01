"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";

export function QRCodeDisplay({
  url,
  businessName,
}: {
  url: string;
  businessName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 240,
        margin: 2,
        color: { dark: "#111827", light: "#ffffff" },
      });
    }
  }, [url]);

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${businessName.replace(/\s+/g, "-").toLowerCase()}-review-qr.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">QR Code</h2>
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl">
          <canvas ref={canvasRef} />
        </div>
        <p className="text-xs text-gray-500 text-center max-w-xs">
          Print this and place it at your counter, table, or receipt. Customers
          scan to leave a review.
        </p>
        <button
          onClick={downloadQR}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download QR Code (PNG)
        </button>
      </div>
    </div>
  );
}
