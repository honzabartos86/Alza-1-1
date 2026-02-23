
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Upload, Mic, Square, FileText, Download, AlertCircle, User, Activity, CheckCircle, Bold, Italic, Underline, List, Palette, Highlighter } from 'lucide-react';
import { EmployeeMetrics, ValidationError } from './types';
import { generateFeedback } from './services/geminiService';
import * as docx from 'docx';
import saveAs from 'file-saver';

declare const XLSX: any;
declare const html2pdf: any;

const REQUIRED_HEADERS = [
  "Full name",
  "ASR/Hrs Target",
  "ASR/Hrs",
  "ASR/Hrs Fill",
  "ASR Services/Hrs Target",
  "ASR_Services/Hrs",
  "ASR Services/Hrs Fill"
];

const translations: any = {
  cs: {
    title: "Alza Feedback Tool",
    uploadLabel: "Vlož Finall report (.xlsx)",
    uploadHint: "Klikni nebo přetáhni soubor",
    errorHeader: "Chyba validace souboru",
    missingHeaders: "Chybějící hlavičky",
    expected: "Očekávané",
    foundInRow: "Nalezené v řádku",
    selectEmployee: "Vyber zaměstnance",
    searchPlaceholder: "Hledat jméno...",
    voiceLabel: "Hlasový záznam (Doplňující kontext)",
    recordStart: "Nahrát záznam",
    recordStop: "Zastavit nahrávání",
    recordOk: "ZÁZNAM OK",
    notesLabel: "Poznámky pro AI zpětnou vazbu",
    notesPlaceholder: "Zadejte doplňující postřehy k výkonu...",
    generateBtn: "Vytvořit záznam (AI)",
    generating: "Generuji...",
    emptyState: "Vyber zaměstnance pro zobrazení metrik a generování reportu",
    perfReport: "Výkonnostní report",
    hardware: "Produkty (Železo)",
    services: "Služby",
    target: "Cíl",
    actual: "Plnění",
    fill: "Fill %",
    aiFeedbackTitle: "AI Zpětná vazba (NVC)",
    editHint: "MŮŽETE TEXT LIBOVOLNĚ UPRAVIT",
    genInProgress: "Gemini analyzuje data a hlasový záznam...",
    noFeedback: "Zpětná vazba zatím nebyla vygenerována",
    months: ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec']
  },
  sk: {
    title: "Alza Feedback Tool",
    uploadLabel: "Vlož Finall report (.xlsx)",
    uploadHint: "Klikni alebo pretiahni súbor",
    errorHeader: "Chyba validácie súboru",
    missingHeaders: "Chýbajúce hlavičky",
    expected: "Očakávané",
    foundInRow: "Nájdené v riadku",
    selectEmployee: "Vyber zamestnanca",
    searchPlaceholder: "Hľadať meno...",
    voiceLabel: "Hlasový záznam (Doplňujúci kontext)",
    recordStart: "Nahrať záznam",
    recordStop: "Zastaviť nahrávanie",
    recordOk: "ZÁZNAM OK",
    notesLabel: "Poznámky pre AI spätnú väzbu",
    notesPlaceholder: "Zadajte doplňujúce postrehy k výkonu...",
    generateBtn: "Vytvoriť záznam (AI)",
    generating: "Generujem...",
    emptyState: "Vyber zamestnanca pre zobrazenie metrík a generovanie reportu",
    perfReport: "Výkonnostný report",
    hardware: "Produkty (Železo)",
    services: "Služby",
    target: "Cieľ",
    actual: "Plnenie",
    fill: "Fill %",
    aiFeedbackTitle: "AI Spätná väzba (NVC)",
    editHint: "MÔŽETE TEXT LIBOVOĽNE UPRAVIŤ",
    genInProgress: "Gemini analyzuje dáta a hlasový záznam...",
    noFeedback: "Spätná väzba zatiaľ nebola vygenerovaná",
    months: ['január', 'február', 'marec', 'apríl', 'máj', 'jún', 'júl', 'august', 'september', 'október', 'november', 'december']
  },
  hu: {
    title: "Alza Feedback Tool",
    uploadLabel: "Finall report (.xlsx) feltöltése",
    uploadHint: "Kattintson vagy húzza ide a fájlt",
    errorHeader: "Fájl érvényesítési hiba",
    missingHeaders: "Hiányzó fejlécek",
    expected: "Elvárt",
    foundInRow: "Sorban található",
    selectEmployee: "Válasszon munkatársat",
    searchPlaceholder: "Név keresése...",
    voiceLabel: "Hangfelvétel (Kiegészítő kontextus)",
    recordStart: "Felvétel indítása",
    recordStop: "Felvétel leállítása",
    recordOk: "FELVÉTEL OK",
    notesLabel: "Megjegyzések az AI visszajelzéshez",
    notesPlaceholder: "Adja meg a teljesítménnyel kapcsolatos észrevételeit...",
    generateBtn: "Rekord létrehozása (AI)",
    generating: "Generálás...",
    emptyState: "Válasszon munkatársat a metrikák és a jelentés megtekintéséhez",
    perfReport: "Teljesítmény jelentés",
    hardware: "Termékek (Hardver)",
    services: "Szolgáltatások",
    target: "Cél",
    actual: "Teljesítés",
    fill: "Fill %",
    aiFeedbackTitle: "AI Visszajelzés (NVC)",
    editHint: "A SZÖVEG SZABADON SZERKESZTHETŐ",
    genInProgress: "A Gemini elemzi az adatokat és a hangfelvételt...",
    noFeedback: "Még nem készült visszajelzés",
    months: ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december']
  }
};

const getPreviousMonthDateString = (lang: string) => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  const locale = lang === 'hu' ? 'hu-HU' : lang === 'sk' ? 'sk-SK' : 'cs-CZ';
  return date.toLocaleString(locale, { month: 'long', year: 'numeric' });
};

const App: React.FC = () => {
  const [lang, setLang] = useState('cs');
  const [employees, setEmployees] = useState<EmployeeMetrics[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeMetrics[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeMetrics | null>(null);
  const [error, setError] = useState<ValidationError | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [processDate, setProcessDate] = useState<string>(getPreviousMonthDateString('cs'));

  const t = translations[lang];

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);

  // Filtering logic
  useEffect(() => {
    const filtered = employees.filter(emp => 
      emp["Full name"]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  // Update process date when language changes if it was the default
  useEffect(() => {
    setProcessDate(getPreviousMonthDateString(lang));
  }, [lang]);

  const extractDateFromSheet = (data: any[][]): string => {
    const months = t.months;
    
    // Scan first 15 rows for anything that looks like a date or period
    for (let i = 0; i < Math.min(data.length, 15); i++) {
      for (let j = 0; j < data[i].length; j++) {
        const cellValue = String(data[i][j]).trim();
        if (!cellValue) continue;

        // Pattern 1: Search for specific month and year (e.g., "leden 2025")
        for (const month of months) {
          if (cellValue.toLowerCase().includes(month)) {
            const yearMatch = cellValue.match(/\d{4}/);
            return yearMatch ? `${month} ${yearMatch[0]}` : month;
          }
        }

        // Pattern 2: Search for date range (e.g., "01.01.2025 - 31.01.2025")
        const dateRangeRegex = /(\d{1,2}\.\s*\d{1,2}\.\s*\d{4})/;
        const match = cellValue.match(dateRangeRegex);
        if (match) return match[0];
      }
    }
    // Fallback if nothing found in the sheet is the previous month
    return getPreviousMonthDateString(lang);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = "User Performance";
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
          alert(`List "${sheetName}" nebyl nalezen v souboru.`);
          return;
        }

        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        
        if (jsonData.length === 0) {
          alert("Soubor je prázdný.");
          return;
        }

        // Extract date from report
        const extractedDate = extractDateFromSheet(jsonData);
        setProcessDate(extractedDate);

        let headerRowIndex = -1;
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row && row.some(cell => String(cell).trim() === "Full name")) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          const firstNonEmptyRow = jsonData.find(row => row.some(cell => cell !== "")) || [];
          setError({
            missing: [lang === 'hu' ? "'Full name' fejléc nem található." : lang === 'sk' ? "Povinná hlavička 'Full name' nebola nájdená." : "Povinná hlavička 'Full name' nebyla nalezena."],
            expected: REQUIRED_HEADERS,
            found: firstNonEmptyRow.map(String)
          });
          setEmployees([]);
          return;
        }

        const headers = jsonData[headerRowIndex].map(h => String(h).trim());
        const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));

        if (missing.length > 0) {
          setError({
            missing,
            expected: REQUIRED_HEADERS,
            found: headers
          });
          setEmployees([]);
          return;
        }

        setError(null);

        const dataRows = jsonData.slice(headerRowIndex + 1);
        const nameIdx = headers.indexOf("Full name");
        
        const employeesData = dataRows
          .filter(row => row[nameIdx] && String(row[nameIdx]).trim() !== "")
          .map(row => {
            const emp: any = {};
            REQUIRED_HEADERS.forEach(h => {
              const idx = headers.indexOf(h);
              let val = row[idx] !== undefined ? row[idx] : "";
              
              if ((h === "ASR/Hrs" || h === "ASR_Services/Hrs") && typeof val === 'number') {
                val = Math.round(val);
              }

              if ((h === "ASR/Hrs Fill" || h === "ASR Services/Hrs Fill") && typeof val === 'number') {
                val = Math.round(val * 100);
              }
              
              emp[h] = val;
            });
            return emp as EmployeeMetrics;
          });

        setEmployees(employeesData);
      } catch (err) {
        console.error("Error reading file:", err);
        alert("Chyba při čtení souboru Excel.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Nepodařilo se přistoupit k mikrofonu", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleGenerateFeedback = async () => {
    if (!selectedEmployee) return;
    setIsGenerating(true);
    setFeedback('');

    try {
      let audioBase64 = null;
      if (audioBlob) {
        audioBase64 = await blobToBase64(audioBlob);
      }

      const result = await generateFeedback(selectedEmployee, audioBase64, notes, processDate, lang);
      // Convert newlines to breaks for HTML editor initially
      setFeedback(result.replace(/\n/g, '<br>'));
    } catch (err) {
      console.error(err);
      alert("Chyba při generování zpětné vazby.");
    } finally {
      setIsGenerating(false);
    }
  };

  const applyStyle = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setFeedback(editorRef.current.innerHTML);
    }
  };

  const exportToDocx = async () => {
    if (!feedback || !selectedEmployee) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = feedback;
    const paragraphs = tempDiv.innerHTML.split(/<br>|<\/p>|<p>/).filter(p => p.trim() !== "");

    const docContent = paragraphs.map(p => {
      const text = p.replace(/<[^>]*>/g, '').trim();
      return new docx.Paragraph({
        children: [new docx.TextRun(text)],
        spacing: { after: 200 }
      });
    });

    const doc = new docx.Document({
      sections: [{
        properties: {},
        children: [
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: `${lang === 'hu' ? 'Visszajelzés' : lang === 'sk' ? 'Spätná väzba' : 'Zpětná vazba'}: ${selectedEmployee["Full name"]}`,
                bold: true,
                size: 32,
              }),
            ],
            spacing: { after: 400 },
          }),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: `${lang === 'hu' ? 'Időszak' : 'Období'}: ${processDate}`,
                italics: true,
                size: 24,
              }),
            ],
            spacing: { after: 400 },
          }),
          ...docContent
        ],
      }],
    });

    const blob = await docx.Packer.toBlob(doc);
    saveAs(blob, `Zpetna_vazba_${selectedEmployee["Full name"]}_${processDate}.docx`);
  };

  const exportToPdf = () => {
    if (!feedback || !editorRef.current || !selectedEmployee) return;

    const element = document.createElement('div');
    element.style.width = '750px';
    element.style.padding = '40px';
    element.style.backgroundColor = '#ffffff';
    element.style.fontFamily = 'Arial, sans-serif';
    
    const feedbackContent = editorRef.current.innerHTML;

    element.innerHTML = `
      <div style="color: #1f2937;">
        <h1 style="color: #166534; margin-bottom: 5px; font-size: 24px;">${lang === 'hu' ? 'Visszajelzés' : lang === 'sk' ? 'Spätná väzba' : 'Zpětná vazba'}: ${selectedEmployee["Full name"]}</h1>
        <p style="color: #6b7280; font-weight: bold; margin-bottom: 30px; font-size: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">
          ${lang === 'hu' ? 'Időszak' : 'Období'}: ${processDate}
        </p>
        <div style="line-height: 1.6; font-size: 14px; color: #111827;">
          ${feedbackContent}
        </div>
      </div>
    `;

    const opt = {
      margin: 0.5,
      filename: `Zpetna_vazba_${selectedEmployee["Full name"]}_${processDate}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left Panel: Inputs */}
      <div className="w-full md:w-1/3 bg-white border-r border-gray-200 p-6 overflow-y-auto space-y-8 sticky top-0 h-screen">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Activity className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-800">{t.title}</h1>
          </div>
          <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
            <button 
              onClick={() => setLang('cs')} 
              className={`p-1 rounded text-lg hover:bg-white hover:shadow-sm transition-all ${lang === 'cs' ? 'bg-white shadow-sm scale-110' : 'grayscale opacity-60'}`} 
              title="Česko"
            >🇨🇿</button>
            <button 
              onClick={() => setLang('sk')} 
              className={`p-1 rounded text-lg hover:bg-white hover:shadow-sm transition-all ${lang === 'sk' ? 'bg-white shadow-sm scale-110' : 'grayscale opacity-60'}`} 
              title="Slovensko"
            >🇸🇰</button>
            <button 
              onClick={() => setLang('hu')} 
              className={`p-1 rounded text-lg hover:bg-white hover:shadow-sm transition-all ${lang === 'hu' ? 'bg-white shadow-sm scale-110' : 'grayscale opacity-60'}`} 
              title="Magyarország"
            >🇭🇺</button>
          </div>
        </div>

        {/* File Upload */}
        <section className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">{t.uploadLabel}</label>
          <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-green-500 transition-colors bg-gray-50 group">
            <input 
              type="file" 
              accept=".xlsx" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-2 py-4">
              <Upload className="text-gray-400 group-hover:text-green-500" size={32} />
              <span className="text-sm text-gray-500 font-medium">{t.uploadHint}</span>
            </div>
          </div>
        </section>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <AlertCircle size={16} />
              <span>{t.errorHeader}</span>
            </div>
            <p><strong>{t.missingHeaders}:</strong> {error.missing.join(', ')}</p>
            <p className="text-xs"><strong>{t.expected}:</strong> {error.expected.join(', ')}</p>
            <p className="text-xs"><strong>{t.foundInRow}:</strong> {error.found.slice(0, 10).join(', ')}...</p>
          </div>
        )}

        {/* Employee Search & List */}
        {employees.length > 0 && (
          <section className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">{t.selectEmployee}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 scrollbar-thin">
              {filteredEmployees.map((emp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedEmployee(emp);
                    setFeedback('');
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-green-50 transition-colors flex items-center justify-between ${selectedEmployee?.["Full name"] === emp["Full name"] ? 'bg-green-50 text-green-700' : 'text-gray-700'}`}
                >
                  <span className="font-medium">{emp["Full name"]}</span>
                  {selectedEmployee?.["Full name"] === emp["Full name"] && <CheckCircle size={16} />}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Voice Recording */}
        <section className="space-y-3 pt-4 border-t border-gray-100">
          <label className="block text-sm font-semibold text-gray-700">{t.voiceLabel}</label>
          <div className="flex items-center space-x-3">
            {!isRecording ? (
              <button 
                onClick={startRecording}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-transform active:scale-95"
              >
                <Mic size={18} />
                <span>{t.recordStart}</span>
              </button>
            ) : (
              <button 
                onClick={stopRecording}
                className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2 animate-pulse"
              >
                <Square size={18} />
                <span>{t.recordStop}</span>
              </button>
            )}
            {audioBlob && !isRecording && (
              <div className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-xs font-bold">
                {t.recordOk}
              </div>
            )}
          </div>
        </section>

        {/* Text Notes */}
        <section className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">{t.notesLabel}</label>
          <textarea
            placeholder={t.notesPlaceholder}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none min-h-[100px] text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>

        {/* Generate Button */}
        <button
          disabled={!selectedEmployee || isGenerating}
          onClick={handleGenerateFeedback}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
            !selectedEmployee || isGenerating 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 hover:shadow-green-200 active:scale-95'
          }`}
        >
          {isGenerating ? t.generating : t.generateBtn}
        </button>
      </div>

      {/* Right Panel: Output */}
      <div className="w-full md:w-2/3 p-8 overflow-y-auto bg-gray-50 min-h-screen">
        {!selectedEmployee ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <User size={40} />
            </div>
            <p className="text-lg font-medium">{t.emptyState}</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedEmployee["Full name"]}</h2>
                <p className="text-gray-500 font-medium">{t.perfReport} • {processDate}</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={exportToDocx}
                  disabled={!feedback}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 transition-colors" 
                  title="Export DOCX"
                >
                  <FileText size={24} />
                </button>
                <button 
                  onClick={exportToPdf}
                  disabled={!feedback}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-colors" 
                  title="Export PDF (UTF-8)"
                >
                  <Download size={24} />
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hardware Metrics */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-blue-500 space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">{t.hardware}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <MetricCard label={t.target} value={selectedEmployee["ASR/Hrs Target"]} />
                  <MetricCard label={t.actual} value={selectedEmployee["ASR/Hrs"]} />
                  <MetricCard label={t.fill} value={selectedEmployee["ASR/Hrs Fill"]} highlighted />
                </div>
              </div>

              {/* Services Metrics */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-purple-500 space-y-4">
                <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider">{t.services}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <MetricCard label={t.target} value={selectedEmployee["ASR Services/Hrs Target"]} />
                  <MetricCard label={t.actual} value={selectedEmployee["ASR_Services/Hrs"]} />
                  <MetricCard label={t.fill} value={selectedEmployee["ASR Services/Hrs Fill"]} highlighted />
                </div>
              </div>
            </div>

            {/* Generated Feedback */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
              <div className="bg-white px-6 py-4 flex flex-col gap-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText size={18} className="text-green-600" />
                    <span className="font-bold text-gray-700">{t.aiFeedbackTitle}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.editHint}</span>
                </div>

                {/* Toolbar */}
                <div className="border border-gray-200 rounded-xl p-2 flex items-center space-x-4 bg-white shadow-sm overflow-x-auto">
                  <div className="flex items-center space-x-1 shrink-0">
                    <button onClick={() => applyStyle('bold')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><Bold size={20} /></button>
                    <button onClick={() => applyStyle('italic')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><Italic size={20} /></button>
                    <button onClick={() => applyStyle('underline')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><Underline size={20} /></button>
                  </div>
                  <div className="w-px h-6 bg-gray-200 shrink-0"></div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <button onClick={() => applyStyle('insertUnorderedList')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><List size={20} /></button>
                  </div>
                  <div className="w-px h-6 bg-gray-200 shrink-0"></div>
                  <div className="flex items-center space-x-4 shrink-0">
                    <label className="flex items-center space-x-1.5 p-1.5 hover:bg-gray-100 rounded cursor-pointer text-gray-600">
                      <Palette size={20} />
                      <div className="w-4 h-3 bg-black border border-gray-300 rounded-[1px]"></div>
                      <input type="color" className="sr-only" onChange={(e) => applyStyle('foreColor', e.target.value)} />
                    </label>
                    <label className="flex items-center space-x-1.5 p-1.5 hover:bg-gray-100 rounded cursor-pointer text-gray-600">
                      <Highlighter size={20} />
                      <div className="w-4 h-3 bg-yellow-400 border border-gray-300 rounded-[1px]"></div>
                      <input type="color" className="sr-only" onChange={(e) => applyStyle('hiliteColor', e.target.value)} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-8 grow flex flex-col">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center space-y-4 h-64 grow">
                    <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">{t.genInProgress}</p>
                  </div>
                ) : feedback ? (
                  <div
                    ref={editorRef}
                    id="feedback-editor"
                    contentEditable
                    className="w-full grow p-4 prose prose-green max-w-none font-serif text-gray-800 leading-relaxed text-lg focus:ring-0 outline-none overflow-y-auto min-h-[300px]"
                    onInput={(e) => setFeedback(e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: feedback }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-300 italic grow">
                    <p>{t.noFeedback}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string | number;
  highlighted?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, highlighted }) => (
  <div className={`p-3 rounded-xl flex flex-col items-center ${highlighted ? 'bg-green-50' : 'bg-gray-50'}`}>
    <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
    <span className={`text-lg font-bold ${highlighted ? 'text-green-700' : 'text-gray-700'}`}>{value}</span>
  </div>
);

export default App;
