#!/usr/bin/env npx tsx
// ============================================================
// OCR Spike Runner — Gap E1 Test Harness
// Sprint 4, Task 5
// Last changed: 2026-03-24
//
// PURPOSE:
// Run real receipt images through the OCR pipeline with BOTH Haiku and Sonnet,
// then compare results. This is NOT a vitest file — it's a standalone script
// for manual spike testing with real API calls.
//
// HOW TO USE:
// 1. Add receipt images (JPEG, PNG, or WebP) to:
//    frontend/src/lib/ocr/__tests__/fixtures/
//
// 2. (Optional) Add ground truth data for accuracy measurement:
//    frontend/src/lib/ocr/__tests__/fixtures/ground-truth.json
//    See ground-truth-example.json for the expected format.
//
// 3. Run the spike:
//    cd frontend
//    ANTHROPIC_API_KEY=sk-ant-xxx npx tsx src/lib/ocr/__tests__/spike-runner.ts
//
//    Or on Windows:
//    cd frontend
//    set ANTHROPIC_API_KEY=sk-ant-xxx && npx tsx src/lib/ocr/__tests__/spike-runner.ts
//
// 4. Results are saved to:
//    frontend/src/lib/ocr/__tests__/spike-results.json
//
// OUTPUT:
// - Comparison table: image, model, fields extracted, confidence, time, tokens, cost
// - Per-receipt accuracy (if ground truth is provided)
// - Overall accuracy summary
// - JSON results file for detailed analysis
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { parseReceipt, calculateOcrCost } from '../parse-receipt';
import type { ReceiptParseResult, GroundTruth, OcrSpikeResult } from '../types';

// --- Config ---

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const RESULTS_FILE = path.resolve(__dirname, 'spike-results.json');
const GROUND_TRUTH_FILE = path.resolve(FIXTURES_DIR, 'ground-truth.json');
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// --- Types ---

interface SpikeComparisonRow {
  receiptId: string;
  imagePath: string;
  haikuResult: ReceiptParseResult | null;
  sonnetResult: ReceiptParseResult | null;
  haikuCostUsd: number;
  sonnetCostUsd: number;
  accuracy?: {
    haiku: AccuracyDetail;
    sonnet: AccuracyDetail;
  };
}

interface AccuracyDetail {
  merchant: boolean | null;
  date: boolean | null;
  total: boolean | null;
  vat: boolean | null;
  tin: boolean | null;
  overallScore: number;
}

interface SpikeSummary {
  totalReceipts: number;
  haikuSuccessCount: number;
  sonnetSuccessCount: number;
  haikuAvgTimeMs: number;
  sonnetAvgTimeMs: number;
  haikuTotalCostUsd: number;
  sonnetTotalCostUsd: number;
  haikuAvgConfidence: number;
  sonnetAvgConfidence: number;
  haikuAccuracy: number | null;
  sonnetAccuracy: number | null;
  recommendation: string;
}

// --- Helpers ---

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

function getReceiptId(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

function loadGroundTruth(): GroundTruth[] | null {
  if (!fs.existsSync(GROUND_TRUTH_FILE)) {
    console.log('  No ground-truth.json found — accuracy will not be measured.\n');
    return null;
  }

  const raw = fs.readFileSync(GROUND_TRUTH_FILE, 'utf-8');
  return JSON.parse(raw) as GroundTruth[];
}

function calculateAccuracy(
  result: ReceiptParseResult,
  truth: GroundTruth
): AccuracyDetail {
  let correctCount = 0;
  let totalFields = 0;

  const merchantCorrect =
    truth.merchant === null
      ? null
      : result.fields.merchant.value === truth.merchant;
  if (merchantCorrect !== null) {
    totalFields++;
    if (merchantCorrect) correctCount++;
  }

  const dateCorrect =
    truth.date === null
      ? null
      : result.fields.date.value === truth.date;
  if (dateCorrect !== null) {
    totalFields++;
    if (dateCorrect) correctCount++;
  }

  const totalCorrect =
    truth.totalCentavos === null
      ? null
      : result.fields.total.value === truth.totalCentavos;
  if (totalCorrect !== null) {
    totalFields++;
    if (totalCorrect) correctCount++;
  }

  const vatCorrect =
    truth.vatCentavos === null || !result.fields.vat
      ? null
      : result.fields.vat.value === truth.vatCentavos;
  if (vatCorrect !== null) {
    totalFields++;
    if (vatCorrect) correctCount++;
  }

  const tinCorrect =
    truth.tin === null || !result.fields.tin
      ? null
      : result.fields.tin.value === truth.tin;
  if (tinCorrect !== null) {
    totalFields++;
    if (tinCorrect) correctCount++;
  }

  const overallScore = totalFields > 0 ? (correctCount / totalFields) * 100 : 0;

  return {
    merchant: merchantCorrect,
    date: dateCorrect,
    total: totalCorrect,
    vat: vatCorrect,
    tin: tinCorrect,
    overallScore,
  };
}

// --- Display ---

function printDivider(): void {
  console.log('─'.repeat(90));
}

function printReceiptResult(
  receiptId: string,
  model: string,
  result: ReceiptParseResult | null,
  costUsd: number,
  accuracy: AccuracyDetail | null
): void {
  if (!result) {
    console.log(`  ${model.toUpperCase().padEnd(8)} │ FAILED — no result`);
    return;
  }

  const conf = result.fields.merchant.confidence === 'high' ? 'H' :
    result.fields.merchant.confidence === 'medium' ? 'M' : 'L';
  const totalConf = result.fields.total.confidence === 'high' ? 'H' :
    result.fields.total.confidence === 'medium' ? 'M' : 'L';

  const merchant = (result.fields.merchant.value ?? '(null)').toString().slice(0, 25).padEnd(25);
  const total = `₱${((result.fields.total.value as number ?? 0) / 100).toFixed(2)}`.padEnd(12);
  const date = (result.fields.date.value ?? '(null)').toString().padEnd(12);
  const time = `${result.processingTimeMs}ms`.padEnd(8);
  const tokens = `${result.tokenUsage.input}/${result.tokenUsage.output}`.padEnd(12);
  const cost = `$${costUsd.toFixed(4)}`.padEnd(8);
  const acc = accuracy ? `${accuracy.overallScore.toFixed(0)}%` : 'N/A';

  console.log(
    `  ${model.toUpperCase().padEnd(8)} │ ${merchant} │ ${total} │ ${date} │ ${conf}/${totalConf} │ ${time} │ ${tokens} │ ${cost} │ ${acc}`
  );
}

function printSummary(summary: SpikeSummary): void {
  console.log('\n');
  printDivider();
  console.log('  SPIKE SUMMARY');
  printDivider();
  console.log(`  Total receipts tested: ${summary.totalReceipts}`);
  console.log(`  Haiku success rate:    ${summary.haikuSuccessCount}/${summary.totalReceipts}`);
  console.log(`  Sonnet success rate:   ${summary.sonnetSuccessCount}/${summary.totalReceipts}`);
  console.log(`  Haiku avg time:        ${summary.haikuAvgTimeMs.toFixed(0)}ms`);
  console.log(`  Sonnet avg time:       ${summary.sonnetAvgTimeMs.toFixed(0)}ms`);
  console.log(`  Haiku total cost:      $${summary.haikuTotalCostUsd.toFixed(4)}`);
  console.log(`  Sonnet total cost:     $${summary.sonnetTotalCostUsd.toFixed(4)}`);

  if (summary.haikuAccuracy !== null) {
    console.log(`  Haiku avg accuracy:    ${summary.haikuAccuracy.toFixed(1)}%`);
    console.log(`  Sonnet avg accuracy:   ${summary.sonnetAccuracy?.toFixed(1)}%`);

    const target = 85;
    const haikuPasses = (summary.haikuAccuracy ?? 0) >= target;
    const sonnetPasses = (summary.sonnetAccuracy ?? 0) >= target;

    console.log('');
    console.log(`  Gap E1 target: ${target}% field accuracy`);
    console.log(`  Haiku:  ${haikuPasses ? 'PASS' : 'FAIL'} (${summary.haikuAccuracy?.toFixed(1)}%)`);
    console.log(`  Sonnet: ${sonnetPasses ? 'PASS' : 'FAIL'} (${summary.sonnetAccuracy?.toFixed(1)}%)`);
  }

  console.log('');
  console.log(`  Recommendation: ${summary.recommendation}`);
  printDivider();
}

// --- Main Runner ---

async function runSpike(): Promise<void> {
  console.log('');
  console.log('  AKBai OCR Spike — Gap E1 Test Runner');
  console.log('  =====================================\n');

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('  ERROR: ANTHROPIC_API_KEY environment variable not set.');
    console.error('  Usage: ANTHROPIC_API_KEY=sk-ant-xxx npx tsx src/lib/ocr/__tests__/spike-runner.ts');
    process.exit(1);
  }

  // Find receipt images
  if (!fs.existsSync(FIXTURES_DIR)) {
    console.error(`  ERROR: Fixtures directory not found: ${FIXTURES_DIR}`);
    console.error('  Create it and add receipt images (JPEG, PNG, WebP).');
    process.exit(1);
  }

  const allFiles = fs.readdirSync(FIXTURES_DIR);
  const imageFiles = allFiles.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
  });

  if (imageFiles.length === 0) {
    console.log('  No receipt images found in fixtures/ directory.');
    console.log('  Add JPEG, PNG, or WebP receipt images to:');
    console.log(`  ${FIXTURES_DIR}`);
    console.log('');
    console.log('  Then run again.');
    process.exit(0);
  }

  console.log(`  Found ${imageFiles.length} receipt image(s)\n`);

  // Load ground truth (optional)
  const groundTruth = loadGroundTruth();
  const truthMap = new Map<string, GroundTruth>();
  if (groundTruth) {
    for (const gt of groundTruth) {
      truthMap.set(gt.receiptId, gt);
    }
    console.log(`  Ground truth loaded for ${groundTruth.length} receipt(s)\n`);
  }

  // Print header
  printDivider();
  console.log(
    `  ${'MODEL'.padEnd(8)} │ ${'MERCHANT'.padEnd(25)} │ ${'TOTAL'.padEnd(12)} │ ${'DATE'.padEnd(12)} │ CONF  │ ${'TIME'.padEnd(8)} │ ${'TOKENS'.padEnd(12)} │ ${'COST'.padEnd(8)} │ ACC`
  );
  printDivider();

  // Process each image
  const rows: SpikeComparisonRow[] = [];
  const spikeResults: OcrSpikeResult[] = [];

  for (const imageFile of imageFiles) {
    const imagePath = path.resolve(FIXTURES_DIR, imageFile);
    const receiptId = getReceiptId(imageFile);
    const mimeType = getMimeType(imageFile);
    const imageBuffer = fs.readFileSync(imagePath);

    console.log(`\n  Receipt: ${receiptId}`);

    // Run Haiku
    let haikuResult: ReceiptParseResult | null = null;
    let haikuCost = 0;
    try {
      haikuResult = await parseReceipt(imageBuffer, mimeType, { forceModel: 'haiku' });
      if (haikuResult.success) {
        haikuCost = calculateOcrCost('haiku', haikuResult.tokenUsage);
      }
    } catch (err) {
      console.error(`  Haiku error: ${err instanceof Error ? err.message : err}`);
    }

    // Run Sonnet
    let sonnetResult: ReceiptParseResult | null = null;
    let sonnetCost = 0;
    try {
      sonnetResult = await parseReceipt(imageBuffer, mimeType, { forceModel: 'sonnet' });
      if (sonnetResult.success) {
        sonnetCost = calculateOcrCost('sonnet', sonnetResult.tokenUsage);
      }
    } catch (err) {
      console.error(`  Sonnet error: ${err instanceof Error ? err.message : err}`);
    }

    // Calculate accuracy
    const truth = truthMap.get(receiptId);
    let haikuAccuracy: AccuracyDetail | null = null;
    let sonnetAccuracy: AccuracyDetail | null = null;

    if (truth && haikuResult?.success) {
      haikuAccuracy = calculateAccuracy(haikuResult, truth);
    }
    if (truth && sonnetResult?.success) {
      sonnetAccuracy = calculateAccuracy(sonnetResult, truth);
    }

    // Print results
    printReceiptResult(receiptId, 'haiku', haikuResult, haikuCost, haikuAccuracy);
    printReceiptResult(receiptId, 'sonnet', sonnetResult, sonnetCost, sonnetAccuracy);

    // Store row
    rows.push({
      receiptId,
      imagePath,
      haikuResult,
      sonnetResult,
      haikuCostUsd: haikuCost,
      sonnetCostUsd: sonnetCost,
      accuracy:
        haikuAccuracy || sonnetAccuracy
          ? {
              haiku: haikuAccuracy ?? { merchant: null, date: null, total: null, vat: null, tin: null, overallScore: 0 },
              sonnet: sonnetAccuracy ?? { merchant: null, date: null, total: null, vat: null, tin: null, overallScore: 0 },
            }
          : undefined,
    });

    // Store spike results
    if (haikuResult) {
      spikeResults.push({
        receiptId: `${receiptId}-haiku`,
        imagePath,
        result: haikuResult,
        accuracy: haikuAccuracy
          ? {
              merchant: haikuAccuracy.merchant ?? false,
              date: haikuAccuracy.date ?? false,
              total: haikuAccuracy.total ?? false,
              vat: haikuAccuracy.vat ?? false,
              tin: haikuAccuracy.tin ?? false,
              overallScore: haikuAccuracy.overallScore,
            }
          : undefined,
      });
    }
    if (sonnetResult) {
      spikeResults.push({
        receiptId: `${receiptId}-sonnet`,
        imagePath,
        result: sonnetResult,
        accuracy: sonnetAccuracy
          ? {
              merchant: sonnetAccuracy.merchant ?? false,
              date: sonnetAccuracy.date ?? false,
              total: sonnetAccuracy.total ?? false,
              vat: sonnetAccuracy.vat ?? false,
              tin: sonnetAccuracy.tin ?? false,
              overallScore: sonnetAccuracy.overallScore,
            }
          : undefined,
      });
    }
  }

  // --- Summary ---

  const haikuSuccessful = rows.filter((r) => r.haikuResult?.success);
  const sonnetSuccessful = rows.filter((r) => r.sonnetResult?.success);

  const haikuAvgTime =
    haikuSuccessful.length > 0
      ? haikuSuccessful.reduce((sum, r) => sum + (r.haikuResult?.processingTimeMs ?? 0), 0) /
        haikuSuccessful.length
      : 0;

  const sonnetAvgTime =
    sonnetSuccessful.length > 0
      ? sonnetSuccessful.reduce((sum, r) => sum + (r.sonnetResult?.processingTimeMs ?? 0), 0) /
        sonnetSuccessful.length
      : 0;

  const haikuTotalCost = rows.reduce((sum, r) => sum + r.haikuCostUsd, 0);
  const sonnetTotalCost = rows.reduce((sum, r) => sum + r.sonnetCostUsd, 0);

  const haikuAccuracyScores = rows
    .filter((r) => r.accuracy?.haiku)
    .map((r) => r.accuracy!.haiku.overallScore);
  const sonnetAccuracyScores = rows
    .filter((r) => r.accuracy?.sonnet)
    .map((r) => r.accuracy!.sonnet.overallScore);

  const haikuAvgAccuracy =
    haikuAccuracyScores.length > 0
      ? haikuAccuracyScores.reduce((a, b) => a + b, 0) / haikuAccuracyScores.length
      : null;
  const sonnetAvgAccuracy =
    sonnetAccuracyScores.length > 0
      ? sonnetAccuracyScores.reduce((a, b) => a + b, 0) / sonnetAccuracyScores.length
      : null;

  // Determine recommendation
  let recommendation: string;
  if (haikuAvgAccuracy !== null && haikuAvgAccuracy >= 85) {
    recommendation =
      'Haiku meets the 85% accuracy target. Use Haiku for OCR (cost-optimized).';
  } else if (sonnetAvgAccuracy !== null && sonnetAvgAccuracy >= 85) {
    recommendation =
      'Haiku does NOT meet 85% target. Sonnet does. Consider Sonnet for OCR or improve prompts for Haiku.';
  } else if (haikuAvgAccuracy !== null) {
    recommendation =
      'Neither model meets 85% target. Review prompts and test with more/better images.';
  } else {
    recommendation =
      'No ground truth provided — add ground-truth.json to measure accuracy.';
  }

  const summary: SpikeSummary = {
    totalReceipts: rows.length,
    haikuSuccessCount: haikuSuccessful.length,
    sonnetSuccessCount: sonnetSuccessful.length,
    haikuAvgTimeMs: haikuAvgTime,
    sonnetAvgTimeMs: sonnetAvgTime,
    haikuTotalCostUsd: haikuTotalCost,
    sonnetTotalCostUsd: sonnetTotalCost,
    haikuAvgConfidence: 0,
    sonnetAvgConfidence: 0,
    haikuAccuracy: haikuAvgAccuracy,
    sonnetAccuracy: sonnetAvgAccuracy,
    recommendation,
  };

  printSummary(summary);

  // --- Save Results ---

  const output = {
    runDate: new Date().toISOString(),
    summary,
    results: spikeResults,
    rows,
  };

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(output, null, 2));
  console.log(`\n  Results saved to: ${RESULTS_FILE}\n`);
}

// --- Entry Point ---

runSpike().catch((err) => {
  console.error('Spike runner failed:', err);
  process.exit(1);
});
