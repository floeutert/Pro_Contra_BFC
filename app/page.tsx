"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { subscribeToTopics, addTopic, deleteTopic, type Topic } from "@/lib/firebase";

export default function HomePage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToTopics(setTopics);
    return () => unsub();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await addTopic(title.trim(), description.trim());
    setTitle("");
    setDescription("");
    setShowForm(false);
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Themen</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-lightgreen transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Neues Thema
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6"
        >
          <h3 className="font-semibold text-gray-700 mb-4">Neues Thema anlegen</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Titel *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              required
              autoFocus
            />
            <textarea
              placeholder="Kurze Beschreibung (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
              rows={2}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-lightgreen transition-colors disabled:opacity-50"
            >
              {saving ? "Speichern…" : "Anlegen"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {topics.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-lg font-medium">Noch keine Themen vorhanden</p>
          <p className="text-sm mt-1">Lege das erste Thema an, um zu starten.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {topics.map((topic) => (
            <li key={topic.id}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-brand-green transition-colors group flex items-center">
                <Link
                  href={`/topic/${topic.id}`}
                  className="flex-1 px-5 py-4 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 group-hover:text-brand-green transition-colors truncate">
                      {topic.title}
                    </p>
                    {topic.description && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">{topic.description}</p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-brand-green flex-shrink-0" />
                </Link>
                <button
                  onClick={() => {
                    if (confirm(`Thema "${topic.title}" wirklich löschen?`)) {
                      deleteTopic(topic.id);
                    }
                  }}
                  className="p-4 text-gray-300 hover:text-red-500 transition-colors"
                  title="Thema löschen"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
