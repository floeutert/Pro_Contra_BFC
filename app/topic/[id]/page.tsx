"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, ThumbsUp, ThumbsDown,
  FileSpreadsheet, FileText, Tag, X, MessageSquare, Settings,
} from "lucide-react";
import {
  subscribeToPoints,
  subscribeToTopics,
  subscribeToClusters,
  initDefaultClusters,
  addPoint,
  deletePoint,
  addCluster,
  deleteCluster,
  type Topic,
  type Point,
  type Cluster,
} from "@/lib/firebase";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [showClusterManager, setShowClusterManager] = useState(false);

  const [proText, setProText] = useState("");
  const [contraText, setContraText] = useState("");
  const [anmerkungText, setAnmerkungText] = useState("");
  const [proCluster, setProCluster] = useState("");
  const [contraCluster, setContraCluster] = useState("");
  const [savingPro, setSavingPro] = useState(false);
  const [savingContra, setSavingContra] = useState(false);
  const [savingAnmerkung, setSavingAnmerkung] = useState(false);

  useEffect(() => {
    initDefaultClusters();
    const unsubTopics = subscribeToTopics((topics) => {
      const found = topics.find((t) => t.id === id);
      if (found) setTopic(found);
    });
    const unsubPoints = subscribeToPoints(id, setPoints);
    const unsubClusters = subscribeToClusters(setClusters);
    return () => { unsubTopics(); unsubPoints(); unsubClusters(); };
  }, [id]);

  const pros = points.filter((p) => p.type === "pro");
  const contras = points.filter((p) => p.type === "contra");
  const anmerkungen = points.filter((p) => p.type === "anmerkung");

  async function handleAdd(type: "pro" | "contra" | "anmerkung") {
    const text = type === "pro" ? proText : type === "contra" ? contraText : anmerkungText;
    const clusterId = type === "pro" ? proCluster : type === "contra" ? contraCluster : null;
    if (!text.trim()) return;
    if (type === "pro") setSavingPro(true);
    else if (type === "contra") setSavingContra(true);
    else setSavingAnmerkung(true);

    await addPoint(id, type, text.trim(), clusterId || null);

    if (type === "pro") { setProText(""); setSavingPro(false); }
    else if (type === "contra") { setContraText(""); setSavingContra(false); }
    else { setAnmerkungText(""); setSavingAnmerkung(false); }
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    // Helper: get cluster name
    const clusterName = (id?: string | null) =>
      clusters.find((c) => c.id === id)?.name ?? "–";

    // Pro sheet
    const proRows = pros.map((p) => ({ Cluster: clusterName(p.clusterId), "Pro-Punkt": p.text }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(proRows), "Pro");

    // Contra sheet
    const contraRows = contras.map((p) => ({ Cluster: clusterName(p.clusterId), "Contra-Punkt": p.text }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(contraRows), "Contra");

    // Anmerkungen sheet
    const anmRows = anmerkungen.map((p) => ({ Anmerkung: p.text }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(anmRows), "Anmerkungen");

    XLSX.writeFile(wb, `BFC_${topic?.title ?? "export"}.xlsx`);
  }

  async function exportPDF() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape" });
    const title = topic?.title ?? "Pro & Contra";
    const date = new Date().toLocaleDateString("de-DE");
    const clusterName = (cid?: string | null) =>
      clusters.find((c) => c.id === cid)?.name ?? "Sonstige";

    // Header bar
    doc.setFillColor(12, 76, 122);
    doc.rect(0, 0, 297, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Buchholzer FC – Pro & Contra", 10, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Stand: ${date}`, 255, 12);

    // Topic title
    doc.setTextColor(12, 76, 122);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, 10, 28);
    if (topic?.description) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(topic.description, 10, 35);
    }

    const startY = topic?.description ? 42 : 35;
    const colW = 85;
    const anmW = 85;
    const margin = 10;
    const col2X = margin + colW + 6;
    const col3X = col2X + colW + 6;
    const lineH = 6;

    // Column headers
    const drawColHeader = (x: number, w: number, label: string, r: number, g: number, b: number) => {
      doc.setFillColor(r, g, b);
      doc.rect(x, startY, w, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(label, x + 3, startY + 5.5);
    };
    drawColHeader(margin, colW, `Pro (${pros.length})`, 21, 128, 61);
    drawColHeader(col2X, colW, `Contra (${contras.length})`, 220, 38, 38);
    drawColHeader(col3X, anmW, `Anmerkungen (${anmerkungen.length})`, 12, 76, 122);

    // Render points grouped by cluster for pro/contra
    const renderGrouped = (points: Point[], x: number, w: number, startY: number) => {
      let y = startY;
      // Group by cluster
      const grouped: Record<string, Point[]> = {};
      const clusterOrder = [...clusters.map((c) => c.id), "__none__"];
      for (const p of points) {
        const key = p.clusterId && clusters.find((c) => c.id === p.clusterId) ? p.clusterId : "__none__";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(p);
      }
      for (const cid of clusterOrder) {
        const group = grouped[cid];
        if (!group?.length) continue;
        if (y > 185) break;
        const label = cid === "__none__" ? "Sonstige" : clusterName(cid);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(80, 80, 80);
        doc.text(label.toUpperCase(), x + 2, y + 3);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);
        for (const p of group) {
          if (y > 188) break;
          const lines = doc.splitTextToSize(`• ${p.text}`, w - 4);
          doc.setFontSize(8);
          doc.text(lines, x + 2, y + 3);
          y += lines.length * lineH;
        }
        y += 2;
      }
      return y;
    };

    const contentY = startY + 10;
    renderGrouped(pros, margin, colW, contentY);
    renderGrouped(contras, col2X, colW, contentY);

    // Anmerkungen (simple list)
    let ay = contentY;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    for (const p of anmerkungen) {
      if (ay > 188) break;
      const lines = doc.splitTextToSize(`• ${p.text}`, anmW - 4);
      doc.text(lines, col3X + 2, ay + 3);
      ay += lines.length * lineH;
    }

    doc.save(`BFC_${title}.pdf`);
  }

  return (
    <div>
      {/* Navigation + Export */}
      <div className="flex items-center gap-2 mb-5 no-print flex-wrap">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-gray-500 hover:text-brand-green text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Alle Themen
        </button>
        <button
          onClick={() => setShowClusterManager((v) => !v)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors ml-2"
        >
          <Settings size={14} />
          Cluster verwalten
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-colors"
          >
            <FileSpreadsheet size={15} />
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-colors"
          >
            <FileText size={15} />
            PDF
          </button>
        </div>
      </div>

      {/* Cluster Manager */}
      {showClusterManager && (
        <ClusterManager
          clusters={clusters}
          onAdd={addCluster}
          onDelete={deleteCluster}
          onClose={() => setShowClusterManager(false)}
        />
      )}

      {/* Topic title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{topic?.title ?? "…"}</h2>
        {topic?.description && (
          <p className="text-gray-500 mt-1">{topic.description}</p>
        )}
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ClusteredColumn
          type="pro"
          points={pros}
          clusters={clusters}
          inputValue={proText}
          selectedCluster={proCluster}
          onInputChange={setProText}
          onClusterChange={setProCluster}
          onAdd={() => handleAdd("pro")}
          saving={savingPro}
          topicId={id}
        />
        <ClusteredColumn
          type="contra"
          points={contras}
          clusters={clusters}
          inputValue={contraText}
          selectedCluster={contraCluster}
          onInputChange={setContraText}
          onClusterChange={setContraCluster}
          onAdd={() => handleAdd("contra")}
          saving={savingContra}
          topicId={id}
        />
        <AnmerkungsColumn
          points={anmerkungen}
          inputValue={anmerkungText}
          onInputChange={setAnmerkungText}
          onAdd={() => handleAdd("anmerkung")}
          saving={savingAnmerkung}
          topicId={id}
        />
      </div>
    </div>
  );
}

// ─── Cluster Manager ──────────────────────────────────────────────────────────

function ClusterManager({
  clusters,
  onAdd,
  onDelete,
  onClose,
}: {
  clusters: Cluster[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName("");
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-5 no-print">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <Tag size={15} />
          Cluster verwalten
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {clusters.map((c) => (
          <span
            key={c.id}
            className="flex items-center gap-1.5 bg-brand-green text-white text-xs px-2.5 py-1 rounded-full"
          >
            {c.name}
            <button
              onClick={() => onDelete(c.id)}
              className="hover:text-red-300 transition-colors"
              title="Cluster löschen"
            >
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="Neuer Cluster…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="flex items-center gap-1 bg-brand-green text-white px-3 py-1.5 rounded-lg text-sm hover:bg-brand-lightgreen transition-colors disabled:opacity-40"
        >
          <Plus size={14} />
          Hinzufügen
        </button>
      </form>
    </div>
  );
}

// ─── Clustered Column (Pro / Contra) ─────────────────────────────────────────

function ClusteredColumn({
  type,
  points,
  clusters,
  inputValue,
  selectedCluster,
  onInputChange,
  onClusterChange,
  onAdd,
  saving,
  topicId,
}: {
  type: "pro" | "contra";
  points: Point[];
  clusters: Cluster[];
  inputValue: string;
  selectedCluster: string;
  onInputChange: (v: string) => void;
  onClusterChange: (v: string) => void;
  onAdd: () => void;
  saving: boolean;
  topicId: string;
}) {
  const isPro = type === "pro";
  const colorBg = isPro ? "bg-green-50" : "bg-red-50";
  const colorBorder = isPro ? "border-green-200" : "border-red-200";
  const colorHeader = isPro ? "text-green-700" : "text-red-700";
  const colorBtn = isPro ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600";
  const colorRing = isPro ? "focus:ring-green-400" : "focus:ring-red-400";
  const colorClusterBg = isPro ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  const Icon = isPro ? ThumbsUp : ThumbsDown;
  const label = isPro ? "Pro" : "Contra";

  // Group points by cluster
  const grouped: { cluster: Cluster | null; points: Point[] }[] = [];
  for (const cluster of clusters) {
    const g = points.filter((p) => p.clusterId === cluster.id);
    if (g.length) grouped.push({ cluster, points: g });
  }
  const unclustered = points.filter(
    (p) => !p.clusterId || !clusters.find((c) => c.id === p.clusterId)
  );
  if (unclustered.length) grouped.push({ cluster: null, points: unclustered });

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onAdd();
    }
  }

  return (
    <div className={`rounded-xl border ${colorBorder} ${colorBg} p-4 flex flex-col gap-3`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon size={17} className={colorHeader} />
        <h3 className={`font-bold text-lg ${colorHeader}`}>
          {label} <span className="font-normal text-sm opacity-70">({points.length})</span>
        </h3>
      </div>

      {/* Add form */}
      <div className="flex flex-col gap-2 no-print">
        <div className="flex gap-2">
          <textarea
            placeholder={`${label}-Punkt (Enter zum Speichern)`}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKey}
            rows={2}
            className={`flex-1 border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colorRing} resize-none`}
          />
          <button
            onClick={onAdd}
            disabled={saving || !inputValue.trim()}
            className={`${colorBtn} text-white rounded-lg px-3 py-2 transition-colors disabled:opacity-40 flex-shrink-0`}
          >
            <Plus size={17} />
          </button>
        </div>
        <select
          value={selectedCluster}
          onChange={(e) => onClusterChange(e.target.value)}
          className="border border-gray-300 bg-white rounded-lg px-2 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="">Kein Cluster</option>
          {clusters.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Points grouped by cluster */}
      {points.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Noch keine {label}-Punkte</p>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ cluster, points: gPoints }) => (
            <div key={cluster?.id ?? "__none__"}>
              {/* Cluster label */}
              <div className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded mb-1 inline-block ${colorClusterBg}`}>
                {cluster?.name ?? "Sonstige"}
              </div>
              <ul className="space-y-1.5">
                {gPoints.map((point) => (
                  <li
                    key={point.id}
                    className="flex items-start gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm group"
                  >
                    <p className="flex-1 text-sm text-gray-700 leading-snug">{point.text}</p>
                    <button
                      onClick={() => deletePoint(topicId, point.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 no-print"
                      title="Löschen"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Anmerkungen Column ───────────────────────────────────────────────────────

function AnmerkungsColumn({
  points,
  inputValue,
  onInputChange,
  onAdd,
  saving,
  topicId,
}: {
  points: Point[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  saving: boolean;
  topicId: string;
}) {
  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onAdd();
    }
  }

  return (
    <div className="rounded-xl border border-brand-green border-opacity-30 bg-blue-50 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare size={17} className="text-brand-green" />
        <h3 className="font-bold text-lg text-brand-green">
          Anmerkungen <span className="font-normal text-sm opacity-70">({points.length})</span>
        </h3>
      </div>

      {/* Add form */}
      <div className="flex gap-2 no-print">
        <textarea
          placeholder="Allgemeine Anmerkung… (Enter zum Speichern)"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKey}
          rows={2}
          className="flex-1 border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
        />
        <button
          onClick={onAdd}
          disabled={saving || !inputValue.trim()}
          className="bg-brand-green hover:bg-brand-lightgreen text-white rounded-lg px-3 py-2 transition-colors disabled:opacity-40 flex-shrink-0"
        >
          <Plus size={17} />
        </button>
      </div>

      {/* List */}
      {points.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Noch keine Anmerkungen</p>
      ) : (
        <ul className="space-y-1.5">
          {points.map((point) => (
            <li
              key={point.id}
              className="flex items-start gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm group"
            >
              <p className="flex-1 text-sm text-gray-700 leading-snug">{point.text}</p>
              <button
                onClick={() => deletePoint(topicId, point.id)}
                className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 no-print"
                title="Löschen"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
