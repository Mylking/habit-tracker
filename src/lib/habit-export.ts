import { AppData, Habit } from "./habit-types";
import { daysInMonthKey } from "./habit-calc";

function download(content: string | Blob, name: string, type: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCSV(habits: Habit[], mk: string) {
  const dim = daysInMonthKey(mk);
  const headers = ["Habit", ...Array.from({ length: dim }, (_, i) => String(i + 1))];
  const rows = habits.map((h) => {
    const c = h.completions[mk] || [];
    const r = [h.name];
    for (let d = 1; d <= dim; d++) r.push(c.includes(d) ? "✓" : "");
    return r;
  });
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  download(csv, `habit-tracker-${mk}.csv`, "text/csv");
}

export function exportJSON(data: AppData) {
  download(JSON.stringify(data, null, 2), `habit-tracker-backup-${Date.now()}.json`, "application/json");
}

export async function exportPDF(mk: string) {
  const el = document.querySelector(".habit-grid-container") as HTMLElement | null;
  if (!el) return;
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#000" });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
  pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(`habit-tracker-${mk}.pdf`);
}

export function importJSON(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        resolve(JSON.parse(String(r.result)));
      } catch (e) {
        reject(e);
      }
    };
    r.onerror = reject;
    r.readAsText(file);
  });
}
