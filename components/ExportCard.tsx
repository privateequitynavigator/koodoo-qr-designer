"use client";

/* eslint-disable @next/next/no-img-element */

import type { ElementType } from "react";
import { CakeSlice, Coffee, Utensils, Wine } from "lucide-react";
import {
  Be_Vietnam_Pro,
  Cormorant_Garamond,
  DM_Sans,
  Inter,
  Nunito,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from "next/font/google";
import type { TemplateId } from "@/data/templates";

// ─── Font loading ────────────────────────────────────────────────────────────
const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400","500","600","700"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400","500","600","700"] });
const space = Space_Grotesk({ subsets: ["latin"], weight: ["400","500","600","700"] });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400","500","600","700","800"] });
const vietnam = Be_Vietnam_Pro({ subsets: ["latin"], weight: ["400","500","600","700","800"] });
const nunito = Nunito({ subsets: ["latin"], weight: ["400","500","600","700","800"] });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400","500","600","700"] });

// ─── Canvas dimensions ───────────────────────────────────────────────────────
export const EXPORT_WIDTH = 420;
export const EXPORT_HEIGHT = 680;

// ─── Types ───────────────────────────────────────────────────────────────────
export type LogoStyle  = "square" | "horizontal";
export type LogoIconId = "utensils" | "coffee" | "wine" | "cake-slice";
export type LogoShape  = "circle" | "square" | "wide" | "none";
export type FontFamily =
  | "playfair" | "cormorant" | "space" | "jakarta"
  | "vietnam"  | "inter"    | "nunito"| "dmsans";

export type CardData = {
  merchantName:     string;
  tagline:          string;
  tablePrefix:      string;
  tableNumber:      string;
  qrImage:          string;
  scanLabel:        string;       // customisable "Scan to Order" text
  logoStyle:        LogoStyle;
  logoIcon:         LogoIconId;
  accentColor:      string;
  bgColor:          string;
  textColorPrimary: string;
  textColorTable:   string;
  fontFamily:       FontFamily;
  logoUpload:       string | null;
  logoShape:        LogoShape;
  showQr:           boolean;
  cardOutlineColor: string;       // ← NEW: colour of the thin border around the WHOLE card. Empty string = auto (tracks accent colour, old default look)
  actionRow:        string;       // editable "View Menu • Place Order • Pay Online • Earn Rewards" text
};

type ExportCardProps = {
  templateId: TemplateId;
  data:       CardData;
};

const iconMap: Record<LogoIconId, ElementType> = {
  utensils:    Utensils,
  coffee:      Coffee,
  wine:        Wine,
  "cake-slice": CakeSlice,
};

// ─── Font class resolver ─────────────────────────────────────────────────────
export function getFontClass(family: FontFamily): string {
  switch (family) {
    case "playfair":  return playfair.className;
    case "cormorant": return cormorant.className;
    case "space":     return space.className;
    case "jakarta":   return jakarta.className;
    case "vietnam":   return vietnam.className;
    case "nunito":    return nunito.className;
    case "dmsans":    return dmSans.className;
    case "inter":
    default:          return inter.className;
  }
}

export default function ExportCard({ data }: ExportCardProps) {
  return <SpecialtyCafeCard data={data} />;
}

// ─── Card base ───────────────────────────────────────────────────────────────
function CardBase({
  children, data, border, className = "",
}: {
  children:  React.ReactNode;
  data:      CardData;
  border?:   string;
  className?: string;
}) {
  return (
    <div
      className={`${getFontClass(data.fontFamily)} relative overflow-hidden ${className}`}
      style={{
        width:      EXPORT_WIDTH,
        height:     EXPORT_HEIGHT,
        background: data.bgColor          || "#F5EDE3",
        color:      data.textColorPrimary || "#3D2B1F",
      }}
    >
      {border && (
        <div className="absolute rounded-[22px] pointer-events-none" style={{ inset: 14, border }} />
      )}
      {children}
    </div>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer({ data }: { data: CardData }) {
  const color  = data.textColorPrimary || "#A9895E";
  const accent = data.accentColor      || "#C9A96E";
  return (
    <>
      <div className="absolute left-[52px] right-[52px] h-px" style={{ top: 636, backgroundColor: `${accent}33` }} />
      <div className="absolute bottom-[11px] left-0 right-0 flex justify-center">
        <div className="flex items-center gap-[7px]">
          <span className="text-[8px] font-medium tracking-[0.03em]" style={{ color: `${color}88` }}>
            Powered by
          </span>
          <img src="/koodoo-logo.png" alt="KooDoo" className="h-[15px] w-auto object-contain opacity-90" />
        </div>
      </div>
    </>
  );
}

// ─── Action row ──────────────────────────────────────────────────────────────
// Text is now fully editable via data.actionRow. Items are separated by "•" —
// e.g. "View Menu • Place Order • Pay Online • Earn Rewards" — and rendered
// with the same bullet-separator styling as before, however many items there are.
function ActionRow({ data, top }: { data: CardData; top: number }) {
  const accent = data.accentColor || "#C9A96E";
  const raw = data.actionRow?.trim() || "View Menu • Place Order • Pay Online • Earn Rewards";
  const items = raw.split("•").map((s) => s.trim()).filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div
      className="absolute left-0 right-0 flex justify-center items-center flex-wrap px-[16px] text-[8px] tracking-[0.13em] font-semibold"
      style={{ top, color: accent }}
    >
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="flex items-center">
          {i > 0 && <span className="mx-[6px] opacity-50">•</span>}
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}

// ─── Logo box ────────────────────────────────────────────────────────────────
// `width` is only used for the "wide" logo shape — when provided, the logo
// container is forced to that exact width (used to match the QR box width,
// including its outline) and centred the same way the QR box is centred.
function LogoBox({ data, top = 36, width }: { data: CardData; top?: number; width?: number }) {
  const accent = data.accentColor || "#C9A96E";

  if (data.logoUpload) {
    if (data.logoShape === "wide") {
      const boxWidth = width ?? EXPORT_WIDTH - 56; // fallback: old left/right-28px behaviour
      return (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center overflow-hidden"
          style={{ top, width: boxWidth, height: 72 }}
        >
          <img
            src={data.logoUpload}
            alt="Logo"
            style={{ maxWidth: "100%", maxHeight: 72, objectFit: "contain", display: "block" }}
          />
        </div>
      );
    }
    const isCircle = data.logoShape === "circle";
    return (
      <div
        className="absolute left-1/2 -translate-x-1/2 overflow-hidden flex items-center justify-center"
        style={{
          top,
          width: 68, height: 68,
          borderRadius:  isCircle ? 9999 : 14,
          border:        `1.5px solid ${accent}44`,
          background:    "#fff",
        }}
      >
        <img src={data.logoUpload} alt="Logo" style={{ width: 60, height: 60, objectFit: "contain" }} />
      </div>
    );
  }

  if (data.logoShape === "none") return null;

  const Icon  = iconMap[data.logoIcon] || Utensils;
  const style = data.logoStyle === "horizontal"
    ? { width: 74, height: 42, borderRadius: 14 }
    : { width: 58, height: 58, borderRadius: 999 };

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
      style={{ top, ...style, background: `${accent}12`, border: `1.5px solid ${accent}55` }}
    >
      <Icon size={26} strokeWidth={1.6} color={accent} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALTY CAFÉ
// Layout maths: all anchors are calculated to fill all 680px with no dead space.
//
// Compact logo (58px):  logoBottom = 36+58+14 = 108
// Wide logo    (72px):  logoBottom = 36+72+14 = 122
//
// nameTop   = logoBottom
// tableTop  = nameTop  + 62
// qrTop     = tableTop + 120   (96px number + ~24px label)
// LAYOUT STRATEGY:
// Top zone (logo → name → table): dynamic, grows with logo height
// Bottom zone: FIXED from bottom of 680px canvas — no dead space ever
//
// Fixed anchors (px from top of 680px card):
//   actionTop = 608   → "View Menu • Place Order…"
//   scanTop   = 568   → "Scan to Order" label
//   footer rule = 636
//
// QR box fills the gap between tableBottom and scanTop dynamically.
//
// Wide logo width: matched to qrBoxSize (QR image + its outline/padding) so the
// logo banner and the QR frame share the same left/right edges on the card.
// ═══════════════════════════════════════════════════════════════════════════════
function SpecialtyCafeCard({ data }: { data: CardData }) {
  const accent      = data.accentColor      || "#C9A96E";
  const textPrimary = data.textColorPrimary || "#3D2B1F";
  const textTable   = data.textColorTable   || "#3D2B1F";
  const fontClass   = getFontClass(data.fontFamily);
  const scanLabel   = data.scanLabel?.trim() || "Scan to Order";
  const cardOutline = data.cardOutlineColor?.trim() || `${accent}22`;

  const isWide     = data.logoUpload && data.logoShape === "wide";
  const logoTop    = 36;
  const logoHeight = isWide ? 72 : 58;
  const afterLogo  = logoTop + logoHeight + 14;   // bottom of logo zone

  // Top zone anchors
  const nameTop  = afterLogo;         // merchant name block
  const tableTop = nameTop + 62;      // TABLE label + big number

  // Bottom zone — FIXED regardless of logo size
  const scanTop    = 568;    // "Scan to Order"
  const actionTop  = 606;    // action row

  // QR box: sits between tableBottom and scanTop
  // tableBottom = tableTop + 14(label line-height) + 96(number) + 2(mt) = tableTop + 112
  const tableBottom  = tableTop + 112;
  const qrGapTop     = tableBottom + 10;   // 10px gap below number
  const qrGapBottom  = scanTop - 14;       // 14px gap above scan label
  const qrAvailable  = qrGapBottom - qrGapTop;
  // Container is square: image + 11px padding each side = image + 22
  // So image size = available - 22, capped at 234 so box is max 256px
  const qrSize = Math.max(160, Math.min(234, qrAvailable - 22));
  const qrBoxSize = qrSize + 22;
  // Centre QR box vertically in the gap
  const qrTop  = qrGapTop + Math.floor((qrAvailable - qrBoxSize) / 2);

  return (
    <CardBase data={data} border={`1px solid ${cardOutline}`}>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_18%_0%,rgba(201,169,110,0.09)_0%,transparent_56%),radial-gradient(ellipse_at_80%_100%,rgba(201,169,110,0.06)_0%,transparent_58%)]" />

      {/* Top rule */}
      <div className="absolute top-[18px] left-[38px] right-[38px] flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${accent}44)` }} />
        <div className="text-[7px] tracking-[0.5em]" style={{ color: `${accent}77` }}>— —</div>
        <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${accent}44, transparent)` }} />
      </div>

      <LogoBox data={data} top={logoTop} width={isWide ? qrBoxSize : undefined} />

      {/* Merchant name + tagline */}
      <div className="absolute left-[28px] right-[28px] text-center" style={{ top: nameTop }}>
        <h2
          className={`${fontClass} text-[15px] font-semibold tracking-[0.18em] leading-[1.3]`}
          style={{ color: textPrimary }}
        >
          {data.merchantName || "The Garden Kitchen"}
        </h2>
        <p
          className={`${fontClass} text-[9px] tracking-[0.32em] mt-[7px] font-medium`}
          style={{ color: accent }}
        >
          {data.tagline || "Fresh Daily"}
        </p>
      </div>

      {/* TABLE + number */}
      <div className="absolute left-0 right-0 text-center" style={{ top: tableTop }}>
        <p className={`${fontClass} text-[13px] tracking-[0.4em] font-medium`} style={{ color: textTable }}>
          {data.tablePrefix || "TABLE"}
        </p>
        <p
          className={`${space.className} text-[96px] font-bold leading-none mt-[2px] tracking-[-0.04em]`}
          style={{ color: textTable }}
        >
          {data.tableNumber || "01"}
        </p>
      </div>

      {/* QR code — hidden when showQr is false */}
      {data.showQr !== false && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bg-white rounded-[20px] shadow-[0_8px_28px_rgba(61,43,31,0.12)]"
          style={{
            top:      qrTop,
            width:    qrBoxSize,
            height:   qrBoxSize,
            padding:  11,
            overflow: "hidden",   // clips anything that tries to escape
          }}
        >
          {/* 
            Force the image to exactly qrSize × qrSize regardless of format.
            SVGs ignore objectFit, so we use width + height + minWidth + minHeight
            to override any intrinsic dimensions the SVG carries.
          */}
          <img
            src={data.qrImage || "/sample-qr.png"}
            alt="QR Code"
            width={qrSize}
            height={qrSize}
            className="block rounded-[7px]"
            style={{
              width:     qrSize,
              height:    qrSize,
              minWidth:  qrSize,
              minHeight: qrSize,
              maxWidth:  qrSize,
              maxHeight: qrSize,
              objectFit: "fill",
              display:   "block",
              flexShrink: 0,
            }}
          />
        </div>
      )}

      {/* Scan label — centres in QR zone when QR is hidden */}
      <p
        className={`${fontClass} absolute left-[20px] right-[20px] text-center text-[24px] font-bold tracking-[0.24em]`}
        style={{
          top: data.showQr !== false
            ? scanTop
            : Math.floor((tableBottom + scanTop) / 2) - 16,
          color: textPrimary,
        }}
      >
        {scanLabel}
      </p>

      <ActionRow data={data} top={actionTop} />
      <Footer data={data} />
    </CardBase>
  );
}