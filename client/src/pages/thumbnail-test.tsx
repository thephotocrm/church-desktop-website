import { useState } from "react";

type Mode = "pastor-title" | "title-background" | "service-overlay";

interface StyleInfo {
  index: number;
  name: string;
  fontFamily: string;
  subtitleFontFamily: string;
}

interface Preview {
  url: string;
  label: string;
}

const MODE_LABELS: Record<Mode, string> = {
  "pastor-title": "Pastor + Title",
  "title-background": "Title + Background",
  "service-overlay": "Service Overlay",
};

export default function ThumbnailTest() {
  const [mode, setMode] = useState<Mode>("pastor-title");
  const [pastorImageId, setPastorImageId] = useState("");
  const [pastorPreviewUrl, setPastorPreviewUrl] = useState("");
  const [snapshotImageId, setSnapshotImageId] = useState("");
  const [snapshotPreviewUrl, setSnapshotPreviewUrl] = useState("");
  const [title, setTitle] = useState("Delivered Daily");
  const [subtitle, setSubtitle] = useState("Pastor James Pacholek");
  const [layout, setLayout] = useState<"left" | "right">("right");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const handleUploadPastor = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/recordings/test/upload-pastor", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      const id = data.id || data.url?.split("/").pop() || "";
      setPastorImageId(id);
      setPastorPreviewUrl(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadSnapshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/recordings/test/upload-snapshot", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      const id = data.id || data.url?.split("/").pop() || "";
      setSnapshotImageId(id);
      setSnapshotPreviewUrl(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const canGenerate = (): boolean => {
    if (!title) return false;
    if (mode === "pastor-title" && !pastorImageId) return false;
    if (mode === "service-overlay" && !snapshotImageId) return false;
    return true;
  };

  const generateOne = async (styleIndex?: number): Promise<Preview> => {
    const payload: any = { mode, title, subtitle: subtitle || undefined };
    if (styleIndex != null) payload.styleIndex = styleIndex;

    if (mode === "pastor-title") {
      payload.pastorImageId = pastorImageId;
      payload.layout = layout;
    } else if (mode === "service-overlay") {
      payload.snapshotImageId = snapshotImageId;
    }

    const res = await fetch("/api/recordings/test/generate-thumbnail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || `Generation failed (${res.status})`);
    }
    const { url } = await res.json();
    return { url, label: styleIndex != null ? `Style #${styleIndex}` : "Random" };
  };

  const handleGenerate = async () => {
    if (!canGenerate()) return;
    setGenerating(true);
    setError("");
    try {
      const preview = await generateOne();
      setPreviews((prev) => [preview, ...prev]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleBatchGenerate = async (count: number) => {
    if (!canGenerate()) return;
    setGenerating(true);
    setError("");
    try {
      for (let i = 0; i < count; i++) {
        setProgress(`${i + 1}/${count}`);
        const preview = await generateOne();
        setPreviews((prev) => [preview, ...prev]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
      setProgress("");
    }
  };

  const handleGenerateAllFonts = async () => {
    if (!canGenerate()) return;
    setGenerating(true);
    setError("");
    try {
      const stylesRes = await fetch("/api/recordings/test/styles");
      if (!stylesRes.ok) throw new Error("Failed to fetch styles");
      const { styles } = await stylesRes.json() as { styles: StyleInfo[] };

      for (let i = 0; i < styles.length; i++) {
        const s = styles[i];
        setProgress(`${i + 1}/${styles.length} — ${s.fontFamily}`);
        const preview = await generateOne(s.index);
        setPreviews((prev) => [{ ...preview, label: `${s.fontFamily} / ${s.subtitleFontFamily}` }, ...prev]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
      setProgress("");
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto", padding: "0 20px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Thumbnail Test</h1>

      {/* Mode Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #e5e7eb" }}>
        {(["pastor-title", "title-background", "service-overlay"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: mode === m ? 700 : 400,
              cursor: "pointer",
              border: "none",
              borderBottom: mode === m ? "3px solid #2563eb" : "3px solid transparent",
              background: mode === m ? "#eff6ff" : "transparent",
              color: mode === m ? "#2563eb" : "#6b7280",
              marginBottom: -2,
            }}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Mode-specific inputs */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        {mode === "pastor-title" && (
          <div>
            <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>Pastor Image</label>
            <input type="file" accept="image/*" onChange={handleUploadPastor} disabled={uploading} />
            {uploading && <span style={{ fontSize: 12, color: "#888" }}> Uploading...</span>}
            {pastorPreviewUrl && (
              <div style={{ marginTop: 8 }}>
                <img src={pastorPreviewUrl} alt="Pastor" style={{ height: 80, borderRadius: 4 }} />
              </div>
            )}
          </div>
        )}

        {mode === "service-overlay" && (
          <div>
            <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>Snapshot Image</label>
            <input type="file" accept="image/*" onChange={handleUploadSnapshot} disabled={uploading} />
            {uploading && <span style={{ fontSize: 12, color: "#888" }}> Uploading...</span>}
            {snapshotPreviewUrl && (
              <div style={{ marginTop: 8 }}>
                <img src={snapshotPreviewUrl} alt="Snapshot" style={{ height: 80, borderRadius: 4 }} />
              </div>
            )}
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 14, width: 220, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>Subtitle (optional)</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 14, width: 220, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </div>

        {mode === "pastor-title" && (
          <div>
            <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>Layout</label>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as "left" | "right")}
              style={{ padding: "6px 10px", fontSize: 14, border: "1px solid #ccc", borderRadius: 4 }}
            >
              <option value="right">Pastor Right</option>
              <option value="left">Pastor Left</option>
            </select>
          </div>
        )}
      </div>

      {/* Generate buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <button
          onClick={handleGenerate}
          disabled={generating || !canGenerate()}
          style={{
            padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            background: generating ? "#999" : "#2563eb", color: "#fff", border: "none", borderRadius: 6,
          }}
        >
          {generating ? `Generating${progress ? ` (${progress})` : "..."}` : "Generate 1"}
        </button>
        <button
          onClick={() => handleBatchGenerate(4)}
          disabled={generating || !canGenerate()}
          style={{
            padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            background: generating ? "#999" : "#7c3aed", color: "#fff", border: "none", borderRadius: 6,
          }}
        >
          {generating ? `Generating${progress ? ` (${progress})` : "..."}` : "Generate 4"}
        </button>
        <button
          onClick={() => handleBatchGenerate(8)}
          disabled={generating || !canGenerate()}
          style={{
            padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            background: generating ? "#999" : "#059669", color: "#fff", border: "none", borderRadius: 6,
          }}
        >
          {generating ? `Generating${progress ? ` (${progress})` : "..."}` : "Generate 8"}
        </button>
        <button
          onClick={handleGenerateAllFonts}
          disabled={generating || !canGenerate()}
          style={{
            padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            background: generating ? "#999" : "#d97706", color: "#fff", border: "none", borderRadius: 6,
          }}
        >
          {generating && progress ? `Generating (${progress})` : "Generate All Fonts"}
        </button>
        {previews.length > 0 && (
          <button
            onClick={() => setPreviews([])}
            style={{
              padding: "8px 20px", fontSize: 14, cursor: "pointer",
              background: "#ef4444", color: "#fff", border: "none", borderRadius: 6,
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {error && <div style={{ color: "#ef4444", marginBottom: 16, fontSize: 14 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {previews.map((p, i) => (
          <div key={`${i}-${p.label}`} style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
            <img src={p.url} alt={p.label} style={{ width: "100%", display: "block" }} />
            <div style={{ padding: "6px 10px", fontSize: 12, color: "#888", background: "#fafafa" }}>
              #{previews.length - i} — {p.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
