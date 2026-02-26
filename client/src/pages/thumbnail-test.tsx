import { useState } from "react";

export default function ThumbnailTest() {
  const [pastorImageUrl, setPastorImageUrl] = useState("");
  const [title, setTitle] = useState("Delivered Daily");
  const [subtitle, setSubtitle] = useState("");
  const [layout, setLayout] = useState<"left" | "right">("right");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleUploadPastor = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/recordings/test/upload-pastor", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
      const { url } = await res.json();
      setPastorImageUrl(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!pastorImageUrl || !title) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/recordings/test/generate-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "pastor-title", pastorImageUrl, layout, title, subtitle: subtitle || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Generation failed");
      const { url } = await res.json();
      setPreviews((prev) => [url, ...prev]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleBatchGenerate = async (count: number) => {
    if (!pastorImageUrl || !title) return;
    setGenerating(true);
    setError("");
    try {
      for (let i = 0; i < count; i++) {
        const res = await fetch("/api/recordings/test/generate-thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "pastor-title", pastorImageUrl, layout, title, subtitle: subtitle || undefined }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Generation failed");
        const { url } = await res.json();
        setPreviews((prev) => [url, ...prev]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: "0 20px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Thumbnail Test</h1>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>Pastor Image</label>
          <input type="file" accept="image/*" onChange={handleUploadPastor} disabled={uploading} />
          {uploading && <span style={{ fontSize: 12, color: "#888" }}> Uploading...</span>}
          {pastorImageUrl && (
            <div style={{ marginTop: 8 }}>
              <img src={pastorImageUrl} alt="Pastor" style={{ height: 80, borderRadius: 4 }} />
            </div>
          )}
        </div>

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
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={handleGenerate}
          disabled={generating || !pastorImageUrl || !title}
          style={{
            padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            background: generating ? "#999" : "#2563eb", color: "#fff", border: "none", borderRadius: 6,
          }}
        >
          {generating ? "Generating..." : "Generate 1"}
        </button>
        <button
          onClick={() => handleBatchGenerate(4)}
          disabled={generating || !pastorImageUrl || !title}
          style={{
            padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            background: generating ? "#999" : "#7c3aed", color: "#fff", border: "none", borderRadius: 6,
          }}
        >
          {generating ? "Generating..." : "Generate 4"}
        </button>
        <button
          onClick={() => handleBatchGenerate(8)}
          disabled={generating || !pastorImageUrl || !title}
          style={{
            padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            background: generating ? "#999" : "#059669", color: "#fff", border: "none", borderRadius: 6,
          }}
        >
          {generating ? "Generating..." : "Generate 8"}
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 16 }}>
        {previews.map((url, i) => (
          <div key={`${url}-${i}`} style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
            <img src={url} alt={`Thumbnail ${i + 1}`} style={{ width: "100%", display: "block" }} />
            <div style={{ padding: "6px 10px", fontSize: 12, color: "#888", background: "#fafafa" }}>
              #{previews.length - i}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
