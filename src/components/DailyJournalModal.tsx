import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import Modal from "./Modal";
import { JournalEntry } from "../types";

type Draft = {
  studied: string;
  learned: string;
  felt: string;
  mood?: JournalEntry["mood"];
};

const blankDraft = (): Draft => ({ studied: "", learned: "", felt: "", mood: undefined });

export default function DailyJournalModal(props: {
  open: boolean;
  date: string; // YYYY-MM-DD
  entry?: JournalEntry;
  onClose: () => void;
  onSave: (draft: Draft) => void;
  onDelete: () => void;
}) {
  const { open, date, entry, onClose, onSave, onDelete } = props;
  const [draft, setDraft] = useState<Draft>(blankDraft());

  useEffect(() => {
    if (!open) return;
    setDraft({
      studied: entry?.studied ?? "",
      learned: entry?.learned ?? "",
      felt: entry?.felt ?? "",
      mood: entry?.mood,
    });
  }, [open, date, entry]);

  const title = useMemo(() => {
    try {
      return `Daily Journal • ${format(parseISO(date), "EEE, MMM d")}`;
    } catch {
      return "Daily Journal";
    }
  }, [date]);

  const hasContent =
    !!draft.studied.trim() || !!draft.learned.trim() || !!draft.felt.trim() || !!draft.mood;

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Mood</label>
            <select
              className="input"
              value={draft.mood ?? ""}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  mood: e.target.value ? (Number(e.target.value) as JournalEntry["mood"]) : undefined,
                }))
              }
            >
              <option value="">Not set</option>
              <option value="1">1 - Rough</option>
              <option value="2">2 - Low</option>
              <option value="3">3 - Neutral</option>
              <option value="4">4 - Good</option>
              <option value="5">5 - Great</option>
            </select>
          </div>
          <div className="flex items-end">
            <p className="text-xs text-[var(--text-faint)] leading-5">
              One entry per day. Use this as your daily study log: what you studied, what you learned, how you felt.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">What did you study?</label>
            <textarea
              className="input"
              rows={6}
              value={draft.studied}
              onChange={(e) => setDraft((p) => ({ ...p, studied: e.target.value }))}
              placeholder="Topics, chapters, practice sets..."
            />
          </div>
          <div>
            <label className="label">What did you learn?</label>
            <textarea
              className="input"
              rows={6}
              value={draft.learned}
              onChange={(e) => setDraft((p) => ({ ...p, learned: e.target.value }))}
              placeholder="Key ideas, mistakes, breakthroughs..."
            />
          </div>
          <div>
            <label className="label">How did you feel?</label>
            <textarea
              className="input"
              rows={6}
              value={draft.felt}
              onChange={(e) => setDraft((p) => ({ ...p, felt: e.target.value }))}
              placeholder="Energy, stress, motivation..."
            />
          </div>
        </div>

        <div className="flex justify-between gap-2 pt-2">
          <div>
            {entry && (
              <button className="btn-danger" onClick={onDelete}>
                Delete Entry
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => onSave(draft)}
              disabled={!hasContent}
              title={!hasContent ? "Write something first" : "Save"}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
