"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { SignOutButton } from "../src/components/auth/sign-out-button";
import { riskOrder, type RiskLevel } from "../src/core/detection/types.ts";

type Finding = {
  type: string;
  risk: string;
  count: number;
  maskedExample: string;
};

type ScanResponse = {
  fileName: string;
  fileRisk: string;
  findings: Finding[];
};

type ScanRecord = ScanResponse & {
  id: string;
  scannedAt: string;
  totalFindings: number;
};

const detectorLabels: Record<string, string> = {
  email: "Email",
  phone: "UK phone",
  nino: "National Insurance number",
  card: "Payment card"
};

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const totalFindings = scans.reduce((total, scan) => total + scan.totalFindings, 0);
  const filesWithFindings = scans.filter((scan) => scan.totalFindings > 0).length;
  const highestRisk = scans.reduce<RiskLevel>((highest, scan) => {
    return riskOrder.indexOf(scan.fileRisk as RiskLevel) > riskOrder.indexOf(highest)
      ? scan.fileRisk as RiskLevel
      : highest;
  }, "None");
  const selectedScan = scans.find((scan) => scan.id === selectedScanId) ?? scans[0] ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || isScanning) {
      return;
    }

    const formElement = event.currentTarget;
    setError(null);
    setScanNotice(null);
    setIsScanning(true);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/scan", { method: "POST", body: formData });
      const data = (await response.json()) as ScanResponse | { error: string };

      if (!response.ok) {
        setError("error" in data ? data.error : "The file could not be scanned.");
        return;
      }

      const scanResult = data as ScanResponse;
      const scanRecord: ScanRecord = {
        ...scanResult,
        id: crypto.randomUUID(),
        scannedAt: new Date().toISOString(),
        totalFindings: scanResult.findings.reduce((total, finding) => total + finding.count, 0)
      };
      setScans((currentScans) => [scanRecord, ...currentScans]);
      setSelectedScanId(scanRecord.id);
      setScanNotice(`${scanRecord.fileName} has been scanned. Open Findings to review its masked results.`);
      setFile(null);
      formElement.reset();
    } catch {
      setError("The scan could not be completed. Check your connection and try again.");
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <Link className="wordmark" href="/" aria-label="MiniDSP home">MINIDSP</Link>
        <div className="header-actions">
          <span className="environment-label">TRAINING WORKSPACE · SESSION ONLY</span>
          <SignOutButton />
        </div>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">DATA DISCOVERY</p>
        <h1 id="page-title">Workspace</h1>
        <p className="intro-copy">Review session metrics, scan synthetic CSV or TXT files, and inspect masked findings.</p>
      </section>

      <div className="lp-tabs" role="tablist" aria-label="Workspace views" data-lp-tabs>
        <button
          className="lp-tabs__tab lp-tabs__tab--active"
          id="workspace-tab-overview"
          type="button"
          role="tab"
          aria-selected="true"
          aria-controls="workspace-panel-overview"
        >
          Overview
        </button>
        <button
          className="lp-tabs__tab"
          id="workspace-tab-scan"
          type="button"
          role="tab"
          aria-selected="false"
          aria-controls="workspace-panel-scan"
          tabIndex={-1}
        >
          Scan file
        </button>
        <button
          className="lp-tabs__tab"
          id="workspace-tab-findings"
          type="button"
          role="tab"
          aria-selected="false"
          aria-controls="workspace-panel-findings"
          tabIndex={-1}
        >
          Findings
        </button>
      </div>

      <div
        className="workspace-panel"
        id="workspace-panel-overview"
        role="tabpanel"
        aria-labelledby="workspace-tab-overview"
        tabIndex={0}
      >
        <section aria-labelledby="overview-title">
          <div className="section-heading">
            <div>
              <p className="section-index">SESSION DASHBOARD</p>
              <h2 id="overview-title">Overview</h2>
            </div>
            <p className="size-note">Metrics reset when this session ends</p>
          </div>

          <div className="dashboard-grid">
            <div className="lp-card">
              <div className="lp-card__header"><div className="lp-card__title">Files scanned</div></div>
              <div className="lp-card__body">
                <p className="metric-value">{scans.length}</p>
                <p className="metric-help">Completed in this session</p>
              </div>
            </div>

            <div className="lp-card">
              <div className="lp-card__header"><div className="lp-card__title">Files with findings</div></div>
              <div className="lp-card__body">
                <p className="metric-value">{filesWithFindings}</p>
                <p className="metric-help">Files with detected patterns</p>
              </div>
            </div>

            <div className="lp-card">
              <div className="lp-card__header"><div className="lp-card__title">Total findings</div></div>
              <div className="lp-card__body">
                <p className="metric-value">{totalFindings}</p>
                <p className="metric-help">Aggregated occurrences</p>
              </div>
            </div>

            <div className="lp-card">
              <div className="lp-card__header"><div className="lp-card__title">Highest risk</div></div>
              <div className="lp-card__body">
                <p className="metric-value metric-value--risk">{highestRisk}</p>
                <p className="metric-help">Across this session</p>
              </div>
            </div>
          </div>

          {scans.length === 0 && (
            <p className="dashboard-empty">No scans have been completed in this session.</p>
          )}
        </section>
      </div>

      <div
        className="workspace-panel"
        id="workspace-panel-scan"
        role="tabpanel"
        aria-labelledby="workspace-tab-scan"
        tabIndex={0}
        hidden
      >
        <section className="upload-section" aria-labelledby="upload-title">
          <div className="section-heading">
            <div>
              <p className="section-index">FILE ANALYSIS</p>
              <h2 id="upload-title">Scan a file</h2>
            </div>
            <p className="size-note">CSV or TXT · up to 1 MiB</p>
          </div>

          <form className="upload-form" onSubmit={handleSubmit}>
            <div className="lp-input lp-input--full-width">
              <div className="lp-input__row lp-input__row--label-top">
                <label className="lp-input__label" htmlFor="upload-file">File</label>
                <div className="lp-input__field">
                  <input
                    className="lp-input__input"
                    id="upload-file"
                    name="file"
                    type="file"
                    accept=".csv,.txt,text/csv,text/plain"
                    aria-describedby="upload-help"
                    onChange={(event) => {
                      setFile(event.currentTarget.files?.[0] ?? null);
                      setError(null);
                      setScanNotice(null);
                    }}
                  />
                </div>
              </div>
              <p className="lp-input__message" id="upload-help">Synthetic data only. Original file contents are not saved.</p>
            </div>
            <button
              className="lp-button lp-button--primary lp-button--md"
              type="submit"
              disabled={!file || isScanning}
            >
              {isScanning ? "Scanning file" : "Scan file"}
            </button>
          </form>

          {error && <p className="error-message" role="alert">{error}</p>}
          {scanNotice && <p className="scan-notice" role="status">{scanNotice}</p>}
        </section>
      </div>

      <div
        className="workspace-panel"
        id="workspace-panel-findings"
        role="tabpanel"
        aria-labelledby="workspace-tab-findings"
        tabIndex={0}
        hidden
      >
        <section className="results-section" aria-labelledby="findings-title">
          <div className="section-heading">
            <div>
              <p className="section-index">SESSION RESULTS</p>
              <h2 id="findings-title">Findings</h2>
            </div>
            <p className="size-note">{scans.length} {scans.length === 1 ? "file" : "files"} scanned</p>
          </div>

          {scans.length === 0 ? (
            <p className="empty-copy">Scanned files and masked details will appear here.</p>
          ) : (
            <>
              <h3 className="subsection-title">Scanned files</h3>
              <div className="lp-table result-table">
                <table className="lp-table__table">
                  <caption className="visually-hidden">Files scanned in this session</caption>
                  <thead>
                    <tr>
                      <th className="lp-table__th" scope="col"><div className="lp-table__header-inner"><span className="lp-table__header-label">File</span></div></th>
                      <th className="lp-table__th" scope="col"><div className="lp-table__header-inner"><span className="lp-table__header-label">Risk</span></div></th>
                      <th className="lp-table__th" scope="col"><div className="lp-table__header-inner"><span className="lp-table__header-label">Findings</span></div></th>
                      <th className="lp-table__th" scope="col"><div className="lp-table__header-inner"><span className="lp-table__header-label">Scanned</span></div></th>
                      <th className="lp-table__th" scope="col"><span className="visually-hidden">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.map((scan) => (
                      <tr key={scan.id} className={selectedScan?.id === scan.id ? "lp-table__row--selected" : undefined}>
                        <td className="lp-table__td"><div className="lp-table__cell-inner"><span className="lp-table__cell-text result-filename">{scan.fileName}</span></div></td>
                        <td className="lp-table__td"><div className="lp-table__cell-inner"><span className="lp-table__cell-text">{scan.fileRisk}</span></div></td>
                        <td className="lp-table__td"><div className="lp-table__cell-inner"><span className="lp-table__cell-text">{scan.totalFindings}</span></div></td>
                        <td className="lp-table__td"><div className="lp-table__cell-inner"><span className="lp-table__cell-text">{formatScanDate(scan.scannedAt)}</span></div></td>
                        <td className="lp-table__td">
                          <div className="lp-table__cell-inner">
                            <button
                              className="lp-button lp-button--secondary lp-button--sm"
                              type="button"
                              aria-pressed={selectedScan?.id === scan.id}
                              aria-label={`View findings for ${scan.fileName}`}
                              onClick={() => setSelectedScanId(scan.id)}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedScan && (
                <section className="file-details" aria-labelledby="file-details-title" aria-live="polite">
                  <div className="section-heading">
                    <div>
                      <p className="section-index">SELECTED FILE</p>
                      <h3 id="file-details-title">File details</h3>
                    </div>
                    <span className="risk-value">{selectedScan.fileRisk}</span>
                  </div>

                  <dl className="file-details-grid">
                    <div><dt>File name</dt><dd>{selectedScan.fileName}</dd></div>
                    <div><dt>Scanned</dt><dd>{formatScanDate(selectedScan.scannedAt)}</dd></div>
                    <div><dt>Total findings</dt><dd>{selectedScan.totalFindings}</dd></div>
                  </dl>

                  {selectedScan.findings.length === 0 ? (
                    <p className="empty-copy">No sensitive-data patterns were detected.</p>
                  ) : (
                    <div className="lp-table result-table">
                      <table className="lp-table__table">
                        <caption className="visually-hidden">Masked findings from {selectedScan.fileName}</caption>
                        <thead>
                          <tr>
                            <th className="lp-table__th" scope="col"><div className="lp-table__header-inner"><span className="lp-table__header-label">Type</span></div></th>
                            <th className="lp-table__th" scope="col"><div className="lp-table__header-inner"><span className="lp-table__header-label">Risk</span></div></th>
                            <th className="lp-table__th" scope="col"><div className="lp-table__header-inner"><span className="lp-table__header-label">Count</span></div></th>
                            <th className="lp-table__th" scope="col"><div className="lp-table__header-inner"><span className="lp-table__header-label">Masked example</span></div></th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedScan.findings.map((finding) => (
                            <tr key={finding.type}>
                              <td className="lp-table__td"><div className="lp-table__cell-inner"><span className="lp-table__cell-text">{detectorLabels[finding.type] ?? finding.type}</span></div></td>
                              <td className="lp-table__td"><div className="lp-table__cell-inner"><span className="lp-table__cell-text">{finding.risk}</span></div></td>
                              <td className="lp-table__td"><div className="lp-table__cell-inner"><span className="lp-table__cell-text">{finding.count}</span></div></td>
                              <td className="lp-table__td"><div className="lp-table__cell-inner"><span className="lp-table__cell-text masked-example">{finding.maskedExample}</span></div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </section>
      </div>

      <footer className="page-footer">
        <span>MINIDSP · TRAINING BUILD</span>
        <span>Uploads are analyzed in memory; only masked findings remain for this session.</span>
      </footer>
    </main>
  );
}

function formatScanDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
