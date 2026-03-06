import { useState, useEffect } from "react";
import { Users, ClipboardList, Calendar, Dumbbell, ChevronRight, ChevronLeft, Plus, Trash2, Search, X, Menu, Activity, TrendingUp, BookOpen, Filter } from "lucide-react";

const MODALITIES = ["Muay Thai", "Boxe", "Muay Thai + Boxe", "Infantil", "Personal", "Funcional"];
const STORAGE_KEY = "sportfightclub-v2";
const BOOKINGS_KEY = "sportfightclub-bookings";
const IS_BOOKING_PAGE = typeof window !== "undefined" && window.location.search.includes("booking");

async function loadBookings() {
  try {
    const r = await window.storage.get(BOOKINGS_KEY, true);
    return r ? JSON.parse(r.value) : [];
  } catch { return []; }
}
async function saveBooking(booking) {
  try {
    const existing = await loadBookings();
    await window.storage.set(BOOKINGS_KEY, JSON.stringify([booking, ...existing]), true);
  } catch {}
}
async function updateBookings(list) {
  try { await window.storage.set(BOOKINGS_KEY, JSON.stringify(list), true); } catch {}
}

// ── Pollock 7-site formula ──────────────────────────────────────────
function pollockBodyFat({ gender, age, chest, midaxillary, tricep, subscapular, abdomen, suprailiac, thigh }) {
  const vals = [chest, midaxillary, tricep, subscapular, abdomen, suprailiac, thigh].map(Number);
  if (vals.some(v => !v || isNaN(v))) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  const a = Number(age);
  let bd;
  if (gender === "M") {
    bd = 1.112 - (0.00043499 * sum) + (0.00000055 * sum * sum) - (0.00028826 * a);
  } else {
    bd = 1.097 - (0.00046971 * sum) + (0.00000056 * sum * sum) - (0.00012828 * a);
  }
  return ((4.95 / bd) - 4.50) * 100;
}

function fatCategory(pct, gender) {
  if (gender === "M") {
    if (pct < 6) return { label: "Essencial", color: "#3498db" };
    if (pct < 14) return { label: "Atlético", color: "#2ecc71" };
    if (pct < 18) return { label: "Forma", color: "#27ae60" };
    if (pct < 25) return { label: "Aceitável", color: "#f39c12" };
    return { label: "Obesidade", color: "#e74c3c" };
  } else {
    if (pct < 14) return { label: "Essencial", color: "#3498db" };
    if (pct < 21) return { label: "Atlético", color: "#2ecc71" };
    if (pct < 25) return { label: "Forma", color: "#27ae60" };
    if (pct < 32) return { label: "Aceitável", color: "#f39c12" };
    return { label: "Obesidade", color: "#e74c3c" };
  }
}

// ── Exercise library ─────────────────────────────────────────────────
const EXERCISES = [
  // Musculação - Peito
  { id: 1, name: "Supino Reto", category: "Musculação", muscle: "Peito", equipment: "Barra", level: "Intermediário", description: "Deite no banco, desça a barra até o peito e empurre verticalmente. Cotovelos a 45–75° do corpo." },
  { id: 2, name: "Supino Inclinado", category: "Musculação", muscle: "Peito", equipment: "Halteres", level: "Intermediário", description: "Banco inclinado a 30–45°. Enfatiza a porção superior do peitoral." },
  { id: 3, name: "Crucifixo", category: "Musculação", muscle: "Peito", equipment: "Halteres", level: "Iniciante", description: "Abra os braços em arco amplo com leve flexão nos cotovelos. Foco no alongamento do peitoral." },
  // Musculação - Costas
  { id: 4, name: "Remada Curvada", category: "Musculação", muscle: "Costas", equipment: "Barra", level: "Intermediário", description: "Tronco a 45°, puxe a barra em direção ao umbigo. Ativa romboides, dorsais e bíceps." },
  { id: 5, name: "Puxada Frontal", category: "Musculação", muscle: "Costas", equipment: "Polia", level: "Iniciante", description: "Puxe a barra até a altura do queixo. Pegada pronada ativa mais o dorsal." },
  { id: 6, name: "Barra Fixa", category: "Musculação", muscle: "Costas", equipment: "Barra fixa", level: "Avançado", description: "Suspensão completa, puxe até o queixo passar a barra. Excelente para força funcional." },
  // Musculação - Pernas
  { id: 7, name: "Agachamento Livre", category: "Musculação", muscle: "Pernas", equipment: "Barra", level: "Intermediário", description: "Barra sobre os trapézios, desça até as coxas paralelas ao chão. Joelhos alinhados com os pés." },
  { id: 8, name: "Leg Press", category: "Musculação", muscle: "Pernas", equipment: "Máquina", level: "Iniciante", description: "Empurre a plataforma com os pés afastados na largura dos ombros. Não trave os joelhos." },
  { id: 9, name: "Cadeira Extensora", category: "Musculação", muscle: "Quadríceps", equipment: "Máquina", level: "Iniciante", description: "Extensão completa da perna. Isole o quadríceps com movimento controlado." },
  { id: 10, name: "Mesa Flexora", category: "Musculação", muscle: "Posterior", equipment: "Máquina", level: "Iniciante", description: "Flexão do joelho contra resistência. Foco nos isquiotibiais." },
  // Musculação - Ombro
  { id: 11, name: "Desenvolvimento", category: "Musculação", muscle: "Ombro", equipment: "Barra", level: "Intermediário", description: "Empurre a barra verticalmente acima da cabeça. Ativa deltoides anterior e médio." },
  { id: 12, name: "Elevação Lateral", category: "Musculação", muscle: "Ombro", equipment: "Halteres", level: "Iniciante", description: "Eleve os braços lateralmente até a altura dos ombros. Foco no deltoide médio." },
  // Musculação - Braços
  { id: 13, name: "Rosca Direta", category: "Musculação", muscle: "Bíceps", equipment: "Barra", level: "Iniciante", description: "Flexão do cotovelo com pegada supinada. Mantenha os cotovelos fixos ao corpo." },
  { id: 14, name: "Tríceps Corda", category: "Musculação", muscle: "Tríceps", equipment: "Polia", level: "Iniciante", description: "Extensão do cotovelo com corda na polia alta. Separe as pontas no final do movimento." },
  // Funcional
  { id: 15, name: "Burpee", category: "Funcional", muscle: "Corpo todo", equipment: "Nenhum", level: "Intermediário", description: "Agachamento + prancha + flexão + salto com palmas. Excelente para condicionamento." },
  { id: 16, name: "Kettlebell Swing", category: "Funcional", muscle: "Posterior/Glúteos", equipment: "Kettlebell", level: "Intermediário", description: "Impulso do quadril para balançar o kettlebell até a altura dos ombros. Potência explosiva." },
  { id: 17, name: "Box Jump", category: "Funcional", muscle: "Pernas", equipment: "Caixote", level: "Intermediário", description: "Salto sobre o caixote com aterrissagem suave. Desenvolve potência nos membros inferiores." },
  { id: 18, name: "Slam Ball", category: "Funcional", muscle: "Corpo todo", equipment: "Medicine Ball", level: "Iniciante", description: "Eleve a bola acima da cabeça e arremesse contra o chão com força. Condicionamento e potência." },
  { id: 19, name: "Turkish Get-Up", category: "Funcional", muscle: "Corpo todo", equipment: "Kettlebell", level: "Avançado", description: "Movimento complexo do chão até em pé mantendo o KB elevado. Estabilidade e força funcional." },
  { id: 20, name: "Prancha", category: "Funcional", muscle: "Core", equipment: "Nenhum", level: "Iniciante", description: "Isometria abdominal em posição de apoio. Mantenha o corpo reto sem elevar o quadril." },
  { id: 21, name: "Mountain Climber", category: "Funcional", muscle: "Core/Cardio", equipment: "Nenhum", level: "Iniciante", description: "Em posição de prancha, alterne as pernas trazendo os joelhos ao peito em ritmo acelerado." },
  { id: 22, name: "Battle Rope", category: "Funcional", muscle: "Ombros/Core", equipment: "Corda", level: "Intermediário", description: "Ondule as cordas alternando os braços. Alta demanda cardiovascular e de ombros." },
  { id: 23, name: "Agachamento com Salto", category: "Funcional", muscle: "Pernas", equipment: "Nenhum", level: "Intermediário", description: "Agache e salte verticalmente com força. Desenvolve potência e resistência." },
  { id: 24, name: "Afundo com Halteres", category: "Funcional", muscle: "Pernas/Glúteos", equipment: "Halteres", level: "Iniciante", description: "Passo à frente com flexão dos joelhos a 90°. Equilíbrio e força unilateral." },
  { id: 25, name: "Dead Ball Over Shoulder", category: "Funcional", muscle: "Corpo todo", equipment: "Dead Ball", level: "Avançado", description: "Levante a bola do chão e arremesse por cima do ombro. Força, potência e explosão total." },
];

const MUSCLE_GROUPS = ["Todos", "Peito", "Costas", "Pernas", "Ombro", "Bíceps", "Tríceps", "Quadríceps", "Posterior", "Core", "Glúteos", "Corpo todo", "Core/Cardio", "Ombros/Core", "Pernas/Glúteos"];
const EX_CATEGORIES = ["Todos", "Musculação", "Funcional"];
const EX_LEVELS = ["Todos", "Iniciante", "Intermediário", "Avançado"];

// ── Storage ───────────────────────────────────────────────────────────
async function loadData() {
  try {
    const r = await window.storage.get(STORAGE_KEY);
    return r ? JSON.parse(r.value) : { students: [] };
  } catch { return { students: [] }; }
}
async function saveData(data) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ── Styles ────────────────────────────────────────────────────────────
const inp = { background: "#141414", border: "1px solid #2a2a2a", borderRadius: 6, color: "#e8e8e8", padding: "9px 13px", fontSize: 13, width: "100%", boxSizing: "border-box", outline: "none" };
const lbl = { color: "#666", fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 5, display: "block", textTransform: "uppercase" };
const btnR = { background: "#c0392b", color: "#fff", border: "none", borderRadius: 6, padding: "9px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6 };
const btnG = { background: "#1e1e1e", color: "#aaa", border: "1px solid #2a2a2a", borderRadius: 6, padding: "9px 16px", fontWeight: 600, cursor: "pointer", fontSize: 13 };

const SKINFOLD_FIELDS = [
  { key: "chest", label: "Peitoral" },
  { key: "midaxillary", label: "Axilar Médio" },
  { key: "tricep", label: "Tríceps" },
  { key: "subscapular", label: "Subescapular" },
  { key: "abdomen", label: "Abdominal" },
  { key: "suprailiac", label: "Suprailíaca" },
  { key: "thigh", label: "Coxa" },
];

const emptyAssessment = { date: "", weight: "", height: "", waist: "", hip: "", chest: "", midaxillary: "", tricep: "", subscapular: "", abdomen: "", suprailiac: "", thigh: "", notes: "" };

// ── Booking Page (public) ─────────────────────────────────────────────
const SCHEDULE_OPTIONS = [
  { time: "06:00", days: ["Seg","Ter","Qua","Qui","Sex"], modality: "Muay Thai" },
  { time: "07:00", days: ["Seg","Ter","Qua","Qui","Sex"], modality: "Muay Thai" },
  { time: "08:00", days: ["Seg","Ter","Qua","Qui","Sex"], modality: "Boxe" },
  { time: "09:00", days: ["Seg","Ter","Qua","Qui","Sex"], modality: "Infantil" },
  { time: "15:00", days: ["Seg","Ter","Qua","Qui","Sex"], modality: "Infantil" },
  { time: "16:00", days: ["Seg","Ter","Qua","Qui","Sex","Sáb"], modality: "Personal/Funcional" },
  { time: "17:00", days: ["Seg","Ter","Qua","Qui","Sex"], modality: "Muay Thai" },
  { time: "18:30", days: ["Seg","Ter","Qua","Qui","Sex"], modality: "Muay Thai" },
  { time: "19:30", days: ["Seg","Ter","Qui","Sex"], modality: "Boxe" },
  { time: "20:30", days: ["Qua"], modality: "Boxe" },
];

function BookingPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", phone: "", age: "", modality: "", day: "", time: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const inpB = { background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, color: "#111", padding: "12px 16px", fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none" };
  const lblB = { color: "#666", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, marginBottom: 6, display: "block" };

  async function submit() {
    setLoading(true);
    await saveBooking({ id: Date.now(), ...form, status: "pendente", createdAt: new Date().toLocaleDateString("pt-BR") });
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 4px 32px #0001" }}>
        <div style={{ width: 64, height: 64, background: "#c0392b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: "#111" }}>Agendamento Confirmado!</h2>
        <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>Olá, <strong>{form.name}</strong>! Seu agendamento foi recebido.</p>
        <div style={{ background: "#f7f7f7", borderRadius: 10, padding: 16, marginBottom: 20, textAlign: "left" }}>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}><strong>Modalidade:</strong> {form.modality}</div>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}><strong>Dia:</strong> {form.day}</div>
          <div style={{ fontSize: 13, color: "#555" }}><strong>Horário:</strong> {form.time}</div>
        </div>
        <p style={{ color: "#999", fontSize: 12 }}>Em breve entraremos em contato pelo número {form.phone} para confirmar.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#c0392b", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 16, height: 16, border: "2.5px solid #fff", borderRadius: "50%" }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", letterSpacing: 0.5 }}>Sport Fight Club</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", letterSpacing: 1 }}>AULA EXPERIMENTAL GRATUITA</div>
        </div>
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "32px 20px" }}>
        {/* Steps indicator */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
          {[1, 2, 3].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: step >= s ? "#c0392b" : "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: step >= s ? "#fff" : "#aaa", transition: "all 0.2s" }}>{s}</div>
              {i < 2 && <div style={{ flex: 1, height: 2, background: step > s ? "#c0392b" : "#e0e0e0", margin: "0 8px", transition: "all 0.2s" }} />}
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 16px #0001" }}>
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "#111" }}>Seus dados</h2>
              <p style={{ color: "#999", fontSize: 13, marginBottom: 22 }}>Preencha suas informações para continuar</p>
              <div style={{ display: "grid", gap: 14 }}>
                <div><label style={lblB}>Nome completo *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Seu nome" style={inpB} /></div>
                <div><label style={lblB}>WhatsApp *</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(73) 99999-9999" style={inpB} /></div>
                <div><label style={lblB}>Idade *</label><input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} placeholder="Ex: 25" style={inpB} /></div>
              </div>
              <button onClick={() => { if (form.name && form.phone && form.age) setStep(2); }}
                style={{ marginTop: 22, width: "100%", background: "#c0392b", color: "#fff", border: "none", borderRadius: 8, padding: "13px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Continuar
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "#111" }}>Escolha a modalidade</h2>
              <p style={{ color: "#999", fontSize: 13, marginBottom: 20 }}>Qual aula você quer experimentar?</p>
              <div style={{ display: "grid", gap: 10 }}>
                {["Muay Thai", "Boxe", "Infantil (Muay Thai/Boxe)", "Personal", "Funcional"].map(m => (
                  <div key={m} onClick={() => setForm({...form, modality: m})}
                    style={{ padding: "14px 18px", borderRadius: 10, border: `2px solid ${form.modality === m ? "#c0392b" : "#e8e8e8"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: form.modality === m ? "#fff5f5" : "#fff", transition: "all 0.15s" }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: form.modality === m ? "#c0392b" : "#333" }}>{m}</span>
                    {form.modality === m && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, background: "#f5f5f5", color: "#888", border: "none", borderRadius: 8, padding: 13, fontWeight: 600, cursor: "pointer" }}>Voltar</button>
                <button onClick={() => { if (form.modality) setStep(3); }}
                  style={{ flex: 2, background: "#c0392b", color: "#fff", border: "none", borderRadius: 8, padding: 13, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "#111" }}>Escolha o horário</h2>
              <p style={{ color: "#999", fontSize: 13, marginBottom: 20 }}>Quando você quer vir?</p>
              <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                {SCHEDULE_OPTIONS.map((opt, i) => (
                  <div key={i}>
                    {opt.days.map(day => {
                      const key = `${opt.time}-${day}`;
                      const selected = form.time === opt.time && form.day === day;
                      return (
                        <div key={key} onClick={() => setForm({...form, time: opt.time, day})}
                          style={{ padding: "12px 16px", borderRadius: 8, border: `2px solid ${selected ? "#c0392b" : "#e8e8e8"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: selected ? "#fff5f5" : "#fff", marginBottom: 6, transition: "all 0.15s" }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 14, color: selected ? "#c0392b" : "#333" }}>{opt.time}</span>
                            <span style={{ color: "#aaa", fontSize: 13, marginLeft: 10 }}>{day}</span>
                          </div>
                          <span style={{ fontSize: 11, color: selected ? "#c0392b" : "#bbb", background: selected ? "#fde8e8" : "#f5f5f5", padding: "2px 8px", borderRadius: 4 }}>{opt.modality}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div><label style={lblB}>Observações (opcional)</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} placeholder="Alguma observação?" style={{ ...inpB, resize: "none" }} /></div>
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, background: "#f5f5f5", color: "#888", border: "none", borderRadius: 8, padding: 13, fontWeight: 600, cursor: "pointer" }}>Voltar</button>
                <button onClick={() => { if (form.time && form.day) submit(); }}
                  disabled={loading}
                  style={{ flex: 2, background: "#c0392b", color: "#fff", border: "none", borderRadius: 8, padding: 13, fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Enviando..." : "Confirmar Agendamento"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  if (IS_BOOKING_PAGE) return <BookingPage />;
  return <AdminApp />;
}

function AdminApp() {
  const [view, setView] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showAssessForm, setShowAssessForm] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [exSearch, setExSearch] = useState("");
  const [exCat, setExCat] = useState("Todos");
  const [exMuscle, setExMuscle] = useState("Todos");
  const [exLevel, setExLevel] = useState("Todos");
  const [expandedEx, setExpandedEx] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: "", age: "", gender: "M", phone: "", modality: "Muay Thai", since: "" });
  const [assessForm, setAssessForm] = useState(emptyAssessment);

  useEffect(() => {
    Promise.all([loadData(), loadBookings()]).then(([d, b]) => {
      setStudents(d.students || []);
      setBookings(b || []);
      setLoading(false);
    });
    // Poll bookings every 15s
    const interval = setInterval(() => loadBookings().then(b => setBookings(b || [])), 15000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => { if (!loading) saveData({ students }); }, [students, loading]);

  const toast_ = (m) => { setToast(m); setTimeout(() => setToast(null), 2500); };
  const student = students.find(s => s.id === selectedId);
  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.modality.toLowerCase().includes(search.toLowerCase()));

  function addStudent() {
    if (!studentForm.name.trim()) return;
    setStudents(p => [...p, { id: Date.now(), ...studentForm, age: Number(studentForm.age), assessments: [] }]);
    setStudentForm({ name: "", age: "", gender: "M", phone: "", modality: "Muay Thai", since: "" });
    setShowStudentForm(false);
    toast_("Aluno cadastrado com sucesso.");
  }

  function deleteStudent(id) { setStudents(p => p.filter(s => s.id !== id)); setSelectedId(null); toast_("Aluno removido."); }

  function addAssessment() {
    if (!assessForm.date || !assessForm.weight) return;
    const a = { id: Date.now(), ...assessForm };
    setStudents(p => p.map(s => s.id === selectedId ? { ...s, assessments: [a, ...s.assessments] } : s));
    setAssessForm(emptyAssessment);
    setShowAssessForm(false);
    toast_("Avaliação registrada.");
  }

  function deleteAssessment(aid) {
    setStudents(p => p.map(s => s.id === selectedId ? { ...s, assessments: s.assessments.filter(a => a.id !== aid) } : s));
    toast_("Avaliação removida.");
  }

  const filteredEx = EXERCISES.filter(e =>
    (exCat === "Todos" || e.category === exCat) &&
    (exMuscle === "Todos" || e.muscle === exMuscle) &&
    (exLevel === "Todos" || e.level === exLevel) &&
    (e.name.toLowerCase().includes(exSearch.toLowerCase()) || e.muscle.toLowerCase().includes(exSearch.toLowerCase()))
  );

  const navItems = [
    { id: "dashboard", icon: Activity, label: "Dashboard" },
    { id: "students", icon: Users, label: "Alunos" },
    { id: "bookings", icon: ClipboardList, label: "Agendamentos", badge: bookings.filter(b => b.status === "pendente").length },
    { id: "exercises", icon: Dumbbell, label: "Exercícios" },
    { id: "schedule", icon: Calendar, label: "Grade de Aulas" },
  ];

  if (loading) return (
    <div style={{ background: "#0c0c0c", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={{ width: 48, height: 48, border: "3px solid #c0392b", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
        <div style={{ color: "#555", fontSize: 12, letterSpacing: 2 }}>CARREGANDO</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", background: "#0c0c0c", minHeight: "100vh", color: "#e0e0e0", display: "flex" }}>
      <style>{`
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        input::placeholder{color:#444}
        select option{background:#1a1a1a}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#111}
        ::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:2px}
        button:hover{opacity:0.88}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, background: "#181818", border: "1px solid #2a2a2a", borderLeft: "3px solid #c0392b", borderRadius: 8, padding: "11px 18px", zIndex: 999, fontSize: 13, color: "#ccc", boxShadow: "0 8px 32px #000a" }}>
          {toast}
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: 210, background: "#111", borderRight: "1px solid #1a1a1a", display: "flex", flexDirection: "column", position: "fixed", height: "100vh", zIndex: 10 }}>
        <div style={{ padding: "24px 18px 20px", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "#c0392b", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 14, height: 14, border: "2.5px solid #fff", borderRadius: "50%", position: "relative" }}>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 5, height: 5, background: "#fff", borderRadius: "50%" }} />
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.5, color: "#fff", lineHeight: 1.2 }}>Sport Fight</div>
              <div style={{ fontSize: 10, color: "#c0392b", letterSpacing: 2, fontWeight: 600 }}>CLUB</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {navItems.map(({ id, icon: Icon, label, badge }) => (
            <button key={id} onClick={() => { setView(id); setSelectedId(null); setShowStudentForm(false); setShowAssessForm(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 6, border: "none", cursor: "pointer", marginBottom: 2, fontWeight: 500, fontSize: 13, background: view === id ? "#1e1e1e" : "transparent", color: view === id ? "#fff" : "#555", borderLeft: view === id ? "2px solid #c0392b" : "2px solid transparent", position: "relative" }}>
              <Icon size={15} strokeWidth={1.8} />
              {label}
              {badge > 0 && <span style={{ marginLeft: "auto", background: "#c0392b", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{badge}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px 14px", borderTop: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#2ecc71" }} />
            <span style={{ fontSize: 11, color: "#444" }}>{students.length} aluno(s) · online</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 210, flex: 1, padding: "28px 32px", overflowY: "auto", minHeight: "100vh" }}>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Painel de Controle</h1>
              <p style={{ color: "#444", fontSize: 13 }}>Sport Fight Club — Eunápolis, BA</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Alunos Ativos", value: students.length, icon: Users, color: "#c0392b" },
                { label: "Avaliações", value: students.reduce((a, s) => a + s.assessments.length, 0), icon: ClipboardList, color: "#e67e22" },
                { label: "Agend. Pendentes", value: bookings.filter(b => b.status === "pendente").length, icon: Calendar, color: "#3498db" },
                { label: "Exercícios", value: EXERCISES.length, icon: Dumbbell, color: "#8e44ad" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#141414", borderRadius: 10, padding: "20px 22px", border: "1px solid #1e1e1e", cursor: i === 2 ? "pointer" : "default" }} onClick={() => i === 2 && setView("bookings")}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ color: "#444", fontSize: 12 }}>{s.label}</span>
                    <s.icon size={16} color={s.color} strokeWidth={1.8} />
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Pending bookings preview */}
            {bookings.filter(b => b.status === "pendente").length > 0 && (
              <div style={{ background: "#141414", borderRadius: 10, border: "1px solid #3498db33", marginBottom: 20, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3498db", animation: "pulse 1.5s infinite" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#3498db" }}>NOVOS AGENDAMENTOS</span>
                  </div>
                  <button onClick={() => setView("bookings")} style={{ background: "none", border: "none", color: "#3498db", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Ver todos</button>
                </div>
                {bookings.filter(b => b.status === "pendente").slice(0, 3).map(b => (
                  <div key={b.id} style={{ padding: "12px 20px", borderBottom: "1px solid #181818", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#ddd" }}>{b.name}</div>
                      <div style={{ color: "#555", fontSize: 11 }}>{b.modality} · {b.day} às {b.time} · {b.phone}</div>
                    </div>
                    <span style={{ background: "#3498db22", color: "#3498db", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>PENDENTE</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: "#141414", borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e1e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#888" }}>ALUNOS RECENTES</span>
                <button onClick={() => setView("students")} style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Ver todos</button>
              </div>
              {students.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center", color: "#333", fontSize: 13 }}>
                  Nenhum aluno cadastrado. Vá em <span style={{ color: "#c0392b", cursor: "pointer" }} onClick={() => setView("students")}>Alunos</span> para começar.
                </div>
              ) : students.slice(0, 5).map(s => (
                <div key={s.id} onClick={() => { setSelectedId(s.id); setView("students"); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: "1px solid #181818", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#181818"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 34, height: 34, background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#c0392b" }}>{s.name[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#ddd" }}>{s.name}</div>
                      <div style={{ color: "#444", fontSize: 11 }}>{s.modality}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "#444" }}>{s.assessments.length} aval.</span>
                    <ChevronRight size={14} color="#333" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STUDENTS LIST */}
        {view === "students" && !selectedId && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Alunos</h1>
                <p style={{ color: "#444", fontSize: 13 }}>{students.length} cadastrado(s)</p>
              </div>
              <button onClick={() => setShowStudentForm(v => !v)} style={btnR}>
                <Plus size={14} /> Novo Aluno
              </button>
            </div>

            <div style={{ position: "relative", marginBottom: 16, maxWidth: 300 }}>
              <Search size={13} color="#444" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, paddingLeft: 34 }} />
            </div>

            {showStudentForm && (
              <div style={{ background: "#141414", borderRadius: 10, padding: 22, marginBottom: 18, border: "1px solid #2a2a2a" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#888", letterSpacing: 1 }}>NOVO ALUNO</span>
                  <button onClick={() => setShowStudentForm(false)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer" }}><X size={16} /></button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={lbl}>Nome completo</label>
                    <input value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Sexo</label>
                    <select value={studentForm.gender} onChange={e => setStudentForm({ ...studentForm, gender: e.target.value })} style={inp}>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Idade</label>
                    <input type="number" value={studentForm.age} onChange={e => setStudentForm({ ...studentForm, age: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Telefone</label>
                    <input value={studentForm.phone} onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Membro desde</label>
                    <input type="date" value={studentForm.since} onChange={e => setStudentForm({ ...studentForm, since: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Modalidade</label>
                    <select value={studentForm.modality} onChange={e => setStudentForm({ ...studentForm, modality: e.target.value })} style={inp}>
                      {MODALITIES.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button onClick={addStudent} style={btnR}><Plus size={13} /> Salvar</button>
                  <button onClick={() => setShowStudentForm(false)} style={btnG}>Cancelar</button>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gap: 8 }}>
              {filtered.map(s => (
                <div key={s.id} onClick={() => setSelectedId(s.id)}
                  style={{ background: "#141414", borderRadius: 8, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", border: "1px solid #1e1e1e", transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#c0392b44"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e1e"}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 40, height: 40, background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, color: "#c0392b" }}>
                      {s.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#ddd" }}>{s.name}</div>
                      <div style={{ color: "#444", fontSize: 11 }}>{s.age} anos · {s.phone} · {s.gender === "M" ? "Masculino" : "Feminino"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#777", padding: "2px 10px", borderRadius: 4, fontSize: 11 }}>{s.modality}</span>
                    <span style={{ color: "#333", fontSize: 11 }}>{s.assessments.length} aval.</span>
                    <ChevronRight size={14} color="#333" />
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div style={{ color: "#333", padding: "20px 0", fontSize: 13 }}>Nenhum aluno encontrado.</div>}
            </div>
          </div>
        )}

        {/* STUDENT PROFILE */}
        {view === "students" && student && (
          <div>
            <button onClick={() => { setSelectedId(null); setShowAssessForm(false); }}
              style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
              <ChevronLeft size={14} /> Voltar
            </button>

            <div style={{ background: "#141414", borderRadius: 10, padding: 22, marginBottom: 18, border: "1px solid #1e1e1e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 56, height: 56, background: "#1e1e1e", border: "2px solid #c0392b44", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 22, color: "#c0392b" }}>
                  {student.name[0].toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{student.name}</h2>
                  <div style={{ color: "#555", fontSize: 12 }}>{student.age} anos · {student.gender === "M" ? "Masculino" : "Feminino"} · {student.phone} · Desde {student.since || "—"}</div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{ background: "#1e1e1e", border: "1px solid #c0392b44", color: "#c0392b", padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{student.modality}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => deleteStudent(student.id)} style={{ background: "none", border: "1px solid #2a2a2a", color: "#555", borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Trash2 size={13} /> Excluir
              </button>
            </div>

            {/* Assessments */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#888", letterSpacing: 1 }}>AVALIAÇÕES FÍSICAS</span>
                <span style={{ marginLeft: 8, background: "#1e1e1e", color: "#555", padding: "1px 8px", borderRadius: 10, fontSize: 11 }}>{student.assessments.length}</span>
              </div>
              <button onClick={() => setShowAssessForm(v => !v)} style={btnR}>
                {showAssessForm ? <><X size={13} /> Cancelar</> : <><Plus size={13} /> Nova Avaliação</>}
              </button>
            </div>

            {showAssessForm && (
              <div style={{ background: "#141414", borderRadius: 10, padding: 22, marginBottom: 18, border: "1px solid #2a2a2a" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#888", letterSpacing: 1, marginBottom: 16 }}>NOVA AVALIAÇÃO FÍSICA — 7 DOBRAS DE POLLOCK</div>

                {/* Basic */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                  {[{ label: "Data", key: "date", type: "date" }, { label: "Peso (kg)", key: "weight", type: "number" }, { label: "Altura (cm)", key: "height", type: "number" }, { label: "Cintura (cm)", key: "waist", type: "number" }].map(f => (
                    <div key={f.key}><label style={lbl}>{f.label}</label><input type={f.type} value={assessForm[f.key]} onChange={e => setAssessForm({ ...assessForm, [f.key]: e.target.value })} style={inp} /></div>
                  ))}
                </div>

                {/* Skinfolds */}
                <div style={{ background: "#0f0f0f", borderRadius: 8, padding: 16, marginBottom: 14, border: "1px solid #1e1e1e" }}>
                  <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, marginBottom: 12, fontWeight: 600 }}>7 DOBRAS CUTÂNEAS (mm)</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                    {SKINFOLD_FIELDS.map(f => (
                      <div key={f.key}>
                        <label style={lbl}>{f.label}</label>
                        <input type="number" value={assessForm[f.key]} onChange={e => setAssessForm({ ...assessForm, [f.key]: e.target.value })} style={inp} />
                      </div>
                    ))}
                    {/* Live preview */}
                    {(() => {
                      const pct = pollockBodyFat({ gender: student.gender, age: student.age, ...assessForm });
                      if (!pct) return null;
                      const cat = fatCategory(pct, student.gender);
                      return (
                        <div style={{ background: "#141414", borderRadius: 8, padding: "12px 14px", border: "1px solid #2a2a2a", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <div style={{ fontSize: 10, color: "#555", letterSpacing: 1, marginBottom: 4 }}>% GORDURA</div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: cat.color }}>{pct.toFixed(1)}%</div>
                          <div style={{ fontSize: 10, color: cat.color, marginTop: 2 }}>{cat.label}</div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Observações</label>
                  <textarea value={assessForm.notes} onChange={e => setAssessForm({ ...assessForm, notes: e.target.value })} rows={2} style={{ ...inp, resize: "vertical" }} />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={addAssessment} style={btnR}>Salvar Avaliação</button>
                  <button onClick={() => setShowAssessForm(false)} style={btnG}>Cancelar</button>
                </div>
              </div>
            )}

            {student.assessments.length === 0 ? (
              <div style={{ background: "#141414", borderRadius: 10, padding: 40, textAlign: "center", color: "#333", border: "1px solid #1e1e1e", fontSize: 13 }}>
                Nenhuma avaliação registrada ainda.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {student.assessments.map((a, i) => {
                  const pct = pollockBodyFat({ gender: student.gender, age: student.age, ...a });
                  const cat = pct ? fatCategory(pct, student.gender) : null;
                  const imc = a.weight && a.height ? (Number(a.weight) / ((Number(a.height) / 100) ** 2)) : null;
                  return (
                    <div key={a.id} style={{ background: "#141414", borderRadius: 10, border: i === 0 ? "1px solid #c0392b33" : "1px solid #1e1e1e", overflow: "hidden" }}>
                      <div style={{ padding: "13px 18px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>{a.date}</span>
                          {i === 0 && <span style={{ background: "#c0392b22", color: "#c0392b", padding: "1px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>RECENTE</span>}
                        </div>
                        <button onClick={() => deleteAssessment(a.id)} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div style={{ padding: 18 }}>
                        {/* Main metrics */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                          {[
                            { label: "Peso", value: a.weight ? `${a.weight} kg` : "—" },
                            { label: "Altura", value: a.height ? `${a.height} cm` : "—" },
                            { label: "IMC", value: imc ? imc.toFixed(1) : "—", sub: imc ? (imc < 18.5 ? "Abaixo" : imc < 25 ? "Normal" : imc < 30 ? "Sobrepeso" : "Obesidade") : "" },
                            { label: "Cintura", value: a.waist ? `${a.waist} cm` : "—" },
                          ].map((m, j) => (
                            <div key={j} style={{ background: "#0f0f0f", borderRadius: 6, padding: "11px 14px" }}>
                              <div style={{ color: "#444", fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>{m.label.toUpperCase()}</div>
                              <div style={{ fontWeight: 700, fontSize: 16, color: "#ddd" }}>{m.value}</div>
                              {m.sub && <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{m.sub}</div>}
                            </div>
                          ))}
                        </div>

                        {/* Pollock result */}
                        {pct && (
                          <div style={{ background: "#0f0f0f", borderRadius: 6, padding: "14px 16px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                              <div style={{ fontSize: 10, color: "#555", letterSpacing: 1, marginBottom: 4 }}>% GORDURA CORPORAL — 7 DOBRAS POLLOCK</div>
                              <div style={{ fontSize: 28, fontWeight: 700, color: cat.color }}>{pct.toFixed(1)}<span style={{ fontSize: 14 }}>%</span></div>
                              <div style={{ fontSize: 11, color: cat.color, marginTop: 2 }}>{cat.label}</div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                              {SKINFOLD_FIELDS.map(f => (
                                <div key={f.key} style={{ textAlign: "center" }}>
                                  <div style={{ fontSize: 9, color: "#444", marginBottom: 2 }}>{f.label}</div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: "#777" }}>{a[f.key] ? `${a[f.key]}mm` : "—"}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {a.notes && (
                          <div style={{ background: "#0f0f0f", borderRadius: 6, padding: "10px 14px", color: "#555", fontSize: 12, fontStyle: "italic" }}>
                            {a.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS */}
        {view === "bookings" && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Agendamentos de Aula Experimental</h1>
              <p style={{ color: "#444", fontSize: 13 }}>Solicitações recebidas pelo link público · atualiza a cada 15s</p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 22 }}>
              {[
                { label: "Pendentes", value: bookings.filter(b => b.status === "pendente").length, color: "#3498db" },
                { label: "Confirmados", value: bookings.filter(b => b.status === "confirmado").length, color: "#2ecc71" },
                { label: "Cancelados", value: bookings.filter(b => b.status === "cancelado").length, color: "#e74c3c" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#141414", borderRadius: 8, padding: "16px 20px", border: "1px solid #1e1e1e" }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ color: "#444", fontSize: 12 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {bookings.length === 0 ? (
              <div style={{ background: "#141414", borderRadius: 10, padding: 48, textAlign: "center", color: "#333", border: "1px solid #1e1e1e", fontSize: 13 }}>
                Nenhum agendamento ainda. Compartilhe o link de agendamento com seus clientes!
                <div style={{ marginTop: 16, background: "#1e1e1e", borderRadius: 8, padding: "10px 16px", display: "inline-block", color: "#555", fontSize: 12, fontFamily: "monospace" }}>
                  seusite.vercel.app?booking
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {bookings.map((b) => (
                  <div key={b.id} style={{ background: "#141414", borderRadius: 10, border: `1px solid ${b.status === "pendente" ? "#3498db33" : b.status === "confirmado" ? "#2ecc7133" : "#e74c3c33"}`, overflow: "hidden" }}>
                    <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 40, height: 40, background: "#1e1e1e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#c0392b", fontSize: 16 }}>
                          {b.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#ddd" }}>{b.name}</div>
                          <div style={{ color: "#555", fontSize: 11 }}>{b.age} anos · {b.phone}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 1,
                          background: b.status === "pendente" ? "#3498db22" : b.status === "confirmado" ? "#2ecc7122" : "#e74c3c22",
                          color: b.status === "pendente" ? "#3498db" : b.status === "confirmado" ? "#2ecc71" : "#e74c3c",
                        }}>{b.status.toUpperCase()}</span>
                      </div>
                    </div>
                    <div style={{ padding: "0 18px 14px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                      {[
                        { label: "Modalidade", value: b.modality },
                        { label: "Dia", value: b.day },
                        { label: "Horário", value: b.time },
                      ].map((item, j) => (
                        <div key={j} style={{ background: "#0f0f0f", borderRadius: 6, padding: "9px 12px" }}>
                          <div style={{ color: "#444", fontSize: 10, letterSpacing: 1, marginBottom: 3 }}>{item.label.toUpperCase()}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {b.notes && <div style={{ margin: "0 18px 14px", background: "#0f0f0f", borderRadius: 6, padding: "9px 12px", color: "#555", fontSize: 12, fontStyle: "italic" }}>{b.notes}</div>}
                    {/* Actions */}
                    <div style={{ padding: "10px 18px", borderTop: "1px solid #1a1a1a", display: "flex", gap: 8 }}>
                      {b.status !== "confirmado" && (
                        <button onClick={async () => {
                          const updated = bookings.map(x => x.id === b.id ? {...x, status: "confirmado"} : x);
                          setBookings(updated); await updateBookings(updated); toast_("Agendamento confirmado.");
                        }} style={{ background: "#2ecc7122", color: "#2ecc71", border: "1px solid #2ecc7133", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          Confirmar
                        </button>
                      )}
                      {b.status !== "cancelado" && (
                        <button onClick={async () => {
                          const updated = bookings.map(x => x.id === b.id ? {...x, status: "cancelado"} : x);
                          setBookings(updated); await updateBookings(updated); toast_("Agendamento cancelado.");
                        }} style={{ background: "#e74c3c22", color: "#e74c3c", border: "1px solid #e74c3c33", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          Cancelar
                        </button>
                      )}
                      <button onClick={async () => {
                        const updated = bookings.filter(x => x.id !== b.id);
                        setBookings(updated); await updateBookings(updated); toast_("Removido.");
                      }} style={{ background: "none", color: "#444", border: "1px solid #2a2a2a", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                        <Trash2 size={11} /> Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EXERCISES */}
        {view === "exercises" && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Biblioteca de Exercícios</h1>
              <p style={{ color: "#444", fontSize: 13 }}>{EXERCISES.length} exercícios cadastrados</p>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Search size={12} color="#444" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input placeholder="Buscar exercício..." value={exSearch} onChange={e => setExSearch(e.target.value)} style={{ ...inp, width: 200, paddingLeft: 30, fontSize: 12 }} />
              </div>
              {[
                { val: exCat, set: setExCat, options: EX_CATEGORIES, label: "Categoria" },
                { val: exLevel, set: setExLevel, options: EX_LEVELS, label: "Nível" },
              ].map((f, i) => (
                <select key={i} value={f.val} onChange={e => f.set(e.target.value)} style={{ ...inp, width: "auto", fontSize: 12, cursor: "pointer" }}>
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </select>
              ))}
              <span style={{ color: "#444", fontSize: 12, marginLeft: 4 }}>{filteredEx.length} resultado(s)</span>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {filteredEx.map(ex => (
                <div key={ex.id}
                  style={{ background: "#141414", borderRadius: 8, border: "1px solid #1e1e1e", overflow: "hidden", cursor: "pointer" }}
                  onClick={() => setExpandedEx(expandedEx === ex.id ? null : ex.id)}>
                  <div style={{ padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                    onMouseEnter={e => e.currentTarget.parentElement.style.borderColor = "#2a2a2a"}
                    onMouseLeave={e => e.currentTarget.parentElement.style.borderColor = "#1e1e1e"}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 36, height: 36, background: ex.category === "Funcional" ? "#1a2a1a" : "#1a1a2a", border: `1px solid ${ex.category === "Funcional" ? "#2d4a2d" : "#2d2d4a"}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Dumbbell size={15} color={ex.category === "Funcional" ? "#2ecc71" : "#3498db"} strokeWidth={1.8} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#ddd" }}>{ex.name}</div>
                        <div style={{ color: "#444", fontSize: 11 }}>{ex.muscle} · {ex.equipment}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ background: "#1e1e1e", color: ex.category === "Funcional" ? "#2ecc71" : "#3498db", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{ex.category}</span>
                      <span style={{ background: "#1e1e1e", color: ex.level === "Iniciante" ? "#2ecc71" : ex.level === "Intermediário" ? "#f39c12" : "#e74c3c", padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>{ex.level}</span>
                      <ChevronRight size={13} color="#333" style={{ transform: expandedEx === ex.id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                    </div>
                  </div>
                  {expandedEx === ex.id && (
                    <div style={{ padding: "0 18px 16px", borderTop: "1px solid #1a1a1a" }}>
                      <p style={{ color: "#666", fontSize: 13, lineHeight: 1.6, margin: "12px 0 0" }}>{ex.description}</p>
                    </div>
                  )}
                </div>
              ))}
              {filteredEx.length === 0 && <div style={{ color: "#333", padding: "20px 0", fontSize: 13 }}>Nenhum exercício encontrado.</div>}
            </div>
          </div>
        )}

        {/* SCHEDULE */}
        {view === "schedule" && (() => {
          const CLASS_COLORS = {
            "Muay Thai": { bg: "#1a1500", border: "#c0392b44", text: "#c0392b" },
            "Boxe":      { bg: "#0f1a22", border: "#2980b944", text: "#3498db" },
            "Infantil":  { bg: "#0f1a10", border: "#27ae6044", text: "#2ecc71" },
            "Personal":  { bg: "#1a1a0f", border: "#f39c1244", text: "#f39c12" },
            "Funcional": { bg: "#1a0f1a", border: "#8e44ad44", text: "#9b59b6" },
          };

          const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
          // [horário, seg, ter, qua, qui, sex, sab]
          const SCHEDULE = [
            ["06:00", "Muay Thai", "Muay Thai", "Muay Thai", "Muay Thai", "Muay Thai", ""],
            ["07:00", "Muay Thai", "Muay Thai", "Muay Thai", "Muay Thai", "Muay Thai", ""],
            ["08:00", "Boxe",      "Boxe",      "Boxe",      "Boxe",      "Boxe",      ""],
            ["09:00", "Infantil",  "Infantil",  "Infantil",  "Infantil",  "Infantil",  ""],
            ["15:00", "Infantil",  "Infantil",  "Infantil",  "Infantil",  "Infantil",  ""],
            ["16:00", "Personal",  "Personal",  "Personal",  "Personal",  "Personal",  "Funcional"],
            ["17:00", "Muay Thai", "Muay Thai", "Muay Thai", "Muay Thai", "Muay Thai", ""],
            ["18:30", "Muay Thai", "Muay Thai", "Muay Thai", "Muay Thai", "Muay Thai", ""],
            ["19:30", "Boxe",      "Boxe",      "",          "Boxe",      "Boxe",      ""],
            ["20:30", "",          "",          "Boxe",      "",          "",          ""],
          ];

          return (
            <div>
              <div style={{ marginBottom: 22 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Agendamentos</h1>
                <p style={{ color: "#444", fontSize: 13 }}>Horário de Aulas 2026</p>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
                {Object.entries(CLASS_COLORS).map(([name, c]) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, background: "#141414", border: `1px solid ${c.border}`, borderRadius: 6, padding: "4px 12px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.text }} />
                    <span style={{ fontSize: 11, color: c.text, fontWeight: 600 }}>{name}</span>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div style={{ background: "#141414", borderRadius: 10, border: "1px solid #1e1e1e", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ display: "grid", gridTemplateColumns: "80px repeat(6, 1fr)", borderBottom: "1px solid #1e1e1e" }}>
                  <div style={{ padding: "11px 14px", fontSize: 11, color: "#444", fontWeight: 600, letterSpacing: 1 }}>HORÁRIO</div>
                  {DAYS.map(d => (
                    <div key={d} style={{ padding: "11px 10px", fontSize: 11, color: "#c0392b", fontWeight: 700, letterSpacing: 2, textAlign: "center", borderLeft: "1px solid #1a1a1a" }}>{d}</div>
                  ))}
                </div>
                {/* Rows */}
                {SCHEDULE.map((row, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "80px repeat(6, 1fr)", borderBottom: i < SCHEDULE.length - 1 ? "1px solid #181818" : "none" }}>
                    <div style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#555", display: "flex", alignItems: "center" }}>{row[0]}</div>
                    {row.slice(1).map((cls, j) => {
                      const c = CLASS_COLORS[cls];
                      return (
                        <div key={j} style={{ padding: "8px 8px", borderLeft: "1px solid #181818", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {cls ? (
                            <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 5, padding: "5px 8px", width: "100%", textAlign: "center" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: c.text, letterSpacing: 0.5 }}>{cls.toUpperCase()}</div>
                            </div>
                          ) : (
                            <div style={{ width: "100%", height: 28 }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}