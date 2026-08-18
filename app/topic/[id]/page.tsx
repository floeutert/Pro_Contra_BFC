"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ThumbsUp, ThumbsDown, FileSpreadsheet, FileText } from "lucide-react";
import {
  subscribeToPoints,
  subscribeToTopics,
  addPoint,
  deletePoint,
  type Topic,
  type Point,
} from "@/lib/firebase";

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [points, setPoints] = useState<Point[]>([]);

  const [proText, setProText] = useState("");
  const [contraText, setContraText] = useState("");
  const [savingPro, setSavingPro] = useState(false);
  const [savingContra, setSavingContra] = useState(false);

  useEffect(() => {
    const unsub = subscribeToTopics((topics) => {
      const found = topics.find((t) => t.id === id);
      if (found) setTopic(found);
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    const unsub = subscribeToPoints(id, setPoints);
    return () => unsub();
  }, [id]);

  const pros = points.filter((p) => p.type === "pro");
  const contras = points.filter((p) => p.type === "contra");

  async function handleAdd(type: "pro" | "contra") {
    const text = type === "pro" ? proText : contraText;
    if (!text.trim()) return;
    if (type === "pro") setSavingPro(true);
    else setSavingContra(true);
    await addPoint(id, type, text.trim());
    if (type === "pro") { setProText(""); setSavingPro(false); }
    else { setContraText(""); setSavingContra(false); }
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const maxLen = Math.max(pros.length, contras.length, 1);
    const rows = Array.from({ length: maxLen }, (_, i) => ({
      Pro: pros[i]?.text ?? "",
      Contra: contras[i]?.text ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    // Column widths
    ws["!cols"] = [{ wch: 50 }, { wch: 50 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pro Contra");
    XLSX.writeFile(wb, `BFC_${topic?.title ?? "export"}.xlsx`);
  }

  function exportPDF() {
    window.print();
  }

  return (
    <div>
      {/* Print header (hidden on screen) */}
      <div className="print-header hidden">
        <h1 className="text-2xl font-bold">Buchholzer FC – Pro &amp; Contra</h1>
        <h2 className="text-xl mt-1">{topic?.title}</h2>
        {topic?.description && <p className="text-gray-600 mt-1">{topic.description}</p>}
        <p className="text-sm text-gray-400 mt-1">Stand: {new Date().toLocaleDateString("de-DE")}</p>
        <hr className="mt-3" />
      </div>

      {/* Navigation + Export */}
      <div className="flex items-center gap-2 mb-6 no-print">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-gray-500 hover:text-brand-green text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Alle Themen
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-colors"
            title="Als Excel exportieren"
          >
            <FileSpreadsheet size={15} />
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-colors"
            title="Als PDF drucken"
          >
            <FileText size={15} />
            PDF
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">{topic?.title ?? "…"}</h2>
        {topic?.description && (
          <p className="text-gray-500 mt-1">{topic.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PRO */}
        <Column
          type="pro"
          points={pros}
          inputValue={proText}
          onInputChange={setProText}
          onAdd={() => handleAdd("pro")}
          saving={savingPro}
          topicId={id}
        />

        {/* CONTRA */}
        <Column
          type="contra"
          points={contras}
          inputValue={contraText}
          onInputChange={setContraText}
          onAdd={() => handleAdd("contra")}
          saving={savingContra}
          topicId={id}
        />
      </div>
    </div>
  );
}

// ─── Column ──────────────────────────────────────────────────────────────────

function Column({
  type,
  points,
  inputValue,
  onInputChange,
  onAdd,
  saving,
  topicId,
}: {
  type: "pro" | "contra";
  points: Point[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  saving: boolean;
  topicId: string;
}) {
  const isPro = type === "pro";
  const colorBg = isPro ? "bg-green-50" : "bg-red-50";
  const colorBorder = isPro ? "border-green-200" : "border-red-200";
  const colorHeader = isPro ? "text-green-700" : "text-red-700";
  const colorBtn = isPro
    ? "bg-green-600 hover:bg-green-700"
    : "bg-red-500 hover:bg-red-600";
  const colorRing = isPro ? "focus:ring-green-400" : "focus:ring-red-400";
  const Icon = isPro ? ThumbsUp : ThumbsDown;
  const label = isPro ? "Pro" : "Contra";

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onAdd();
    }
  }

  return (
    <div className={`rounded-xl border ${colorBorder} ${colorBg} p-5 flex flex-col gap-4`}>
      <div className="flex items-center gap-2">
        <Icon size={18} className={colorHeader} />
        <h3 className={`font-bold text-lg ${colorHeader}`}>
          {label} <span className="font-normal text-sm opacity-70">({points.length})</span>
        </h3>
      </div>

      {/* Add form */}
      <div className="flex gap-2 no-print">
        <textarea
          placeholder={`${label}-Punkt eingeben… (Enter zum Speichern)`}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKey}
          rows={2}
          className={`flex-1 border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colorRing} resize-none`}
        />
        <button
          onClick={onAdd}
          disabled={saving || !inputValue.trim()}
          className={`${colorBtn} text-white rounded-lg px-3 py-2 transition-colors disabled:opacity-40 flex-shrink-0 no-print`}
          title="Hinzufügen"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* List */}
      {points.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Noch keine {label}-Punkte</p>
      ) : (
        <ul className="space-y-2">
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
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
