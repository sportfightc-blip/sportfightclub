import { useState, useEffect } from "react";

const MODALITIES = ["Muay Thai", "Boxe", "Muay Thai + Boxe"];
const STORAGE_KEY = "sportfightclub-students";

async function loadStudents() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

async function saveStudents(students) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function Badge({ text }) {
  return <span style={{ background: "#c0392b", color: "#fff", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>{text}</span>;
}

function IMC({ weight, height }) {
  const imc = weight / ((height / 100) ** 2);
  let label = "", color = "#aaa";
  if (imc < 18.5) { label = "Abaixo do peso"; color = "#3498db"; }
  else if (imc < 25) { label = "Normal"; color = "#2ecc71"; }
  else if (imc < 30) { label = "Sobrepeso"; color = "#f39c12"; }
  else { label = "Obesidade"; color = "#e74c3c"; }
  return <span style={{ color, fontWeight: 700 }}>{imc.toFixed(1)} <span style={{ fontWeight: 400, fontSize: 12 }}>({label})</span></span>;
}

const inputStyle = { background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#fff", padding: "10px 14px", fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none" };
const labelStyle = { color: "#aaa", fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 4, display: "block" };
const btnPrimary = { background: "#c0392b", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14 };
const btnSecondary = { background: "#222", color: "#888", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 14 };

export default function App() {
  const [view, setView] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: "", age: "", phone: "", modality: "Muay Thai", since: "" });
  const [assessmentForm, setAssessmentForm] = useState({ date: "", weight: "", height: "", chest: "", waist: "", hip: "", bicep: "", bodyfat: "", notes: "" });

  useEffect(() => { loadStudents().then(data => { setStudents(data); setLoading(false); }); }, []);
  useEffect(() => { if (!loading) saveStudents(students); }, [students, loading]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  const selectedStudent = students.find(s => s.id === selectedId);
  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.modality.toLowerCase().includes(search.toLowerCase()));

  function addStudent() {
    if (!studentForm.name.trim()) return;
    setStudents(prev => [...prev, { id: Date.now(), ...studentForm, age: Number(studentForm.age), assessments: [] }]);
    setStudentForm({ name: "", age: "", phone: "", modality: "Muay Thai", since: "" });
    setShowStudentForm(false);
    showToast("✅ Aluno cadastrado e salvo!");
  }

  function deleteStudent(id) { setStudents(prev => prev.filter(s => s.id !== id)); setSelectedId(null); showToast("🗑️ Aluno removido."); }

  function addAssessment() {
    if (!assessmentForm.date || !assessmentForm.weight) return;
    setStudents(prev => prev.map(s => s.id === selectedId ? { ...s, assessments: [{ id: Date.now(), ...assessmentForm }, ...s.assessments] } : s));
    setAssessmentForm({ date: "", weight: "", height: "", chest: "", waist: "", hip: "", bicep: "", bodyfat: "", notes: "" });
    setShowAssessmentForm(false);
    showToast("📋 Avaliação salva!");
  }

  function deleteAssessment(aid) { setStudents(prev => prev.map(s => s.id === selectedId ? { ...s, assessments: s.assessments.filter(a => a.id !== aid) } : s)); showToast("🗑️ Avaliação removida."); }

  const navItems = [{ id: "dashboard", icon: "⚡", label: "Dashboard" }, { id: "students", icon: "🥊", label: "Alunos" }, { id: "schedule", icon: "📅", label: "Agendamentos" }];

  if (loading) return <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 48, marginBottom: 16 }}>🥊</div><div style={{ color: "#c0392b", fontWeight: 700, letterSpacing: 2 }}>CARREGANDO...</div></div></div>;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#0d0d0d", minHeight: "100vh", color: "#fff", display: "flex" }}>
      {toast && <div style={{ position: "fixed", top: 20, right: 20, background: "#1e1e1e", border: "1px solid #c0392b66", borderRadius: 10, padding: "12px 20px", zIndex: 999, fontWeight: 600, fontSize: 14, boxShadow: "0 4px 20px #0009" }}>{toast}</div>}
      <div style={{ width: 220, background: "#111", borderRight: "1px solid #1e1e1e", display: "flex", flexDirection: "column", position: "fixed", height: "100vh", zIndex: 10 }}>
        <div style={{ padding: "28px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, background: "#c0392b", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🥊</div>
            <div><div style={{ fontWeight: 900, fontSize: 13, letterSpacing: 1 }}>SPORT</div><div style={{ fontWeight: 900, fontSize: 13, letterSpacing: 1, color: "#c0392b" }}>FIGHT CLUB</div></div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "0 12px" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setView(item.id); setSelectedId(null); setShowStudentForm(false); setShowAssessmentForm(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 4, fontWeight: 600, fontSize: 14, background: view === item.id ? "#c0392b" : "transparent", color: view === item.id ? "#fff" : "#888" }}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: 16, borderTop: "1px solid #1e1e1e" }}>
          <div style={{ background: "#0d0d0d", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ color: "#555", fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>BANCO DE DADOS</div>
            <div style={{ color: "#2ecc71", fontSize: 12, fontWeight: 700 }}>● Conectado</div>
            <div style={{ color: "#444", fontSize: 11, marginTop: 2 }}>{students.length} aluno(s) salvos</div>
          </div>
        </div>
      </div>

      <div style={{ marginLeft: 220, flex: 1, padding: "32px 36px", overflowY: "auto" }}>
        {view === "dashboard" && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: 2, marginBottom: 4 }}>BEM-VINDO, <span style={{ color: "#c0392b" }}>TREINADOR</span></h1>
            <p style={{ color: "#555", marginBottom: 32 }}>Sport Fight Club — Painel de controle</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
              {[{ label: "Total de Alunos", value: students.length, icon: "🥊", color: "#c0392b" }, { label: "Avaliações Realizadas", value: students.reduce((acc, s) => acc + s.assessments.length, 0), icon: "📋", color: "#e67e22" }, { label: "Modalidades Ativas", value: 2, icon: "🏆", color: "#8e44ad" }].map((stat, i) => (
                <div key={i} style={{ background: "#151515", borderRadius: 16, padding: 24, borderLeft: `4px solid ${stat.color}` }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: stat.color }}>{stat.value}</div>
                  <div style={{ color: "#666", fontSize: 13 }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#151515", borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, letterSpacing: 1 }}>ALUNOS CADASTRADOS</h2>
              {students.length === 0 ? <p style={{ color: "#444", padding: "20px 0" }}>Nenhum aluno ainda. Vá em <strong style={{ color: "#c0392b" }}>Alunos</strong> para cadastrar!</p>
                : students.slice(0, 6).map(s => (
                  <div key={s.id} onClick={() => { setSelectedId(s.id); setView("students"); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1e1e1e", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 40, height: 40, background: "#c0392b22", border: "2px solid #c0392b44", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#c0392b" }}>{s.name[0].toUpperCase()}</div>
                      <div><div style={{ fontWeight: 700 }}>{s.name}</div><div style={{ color: "#555", fontSize: 12 }}>{s.assessments.length} avaliação(ões)</div></div>
                    </div>
                    <Badge text={s.modality} />
                  </div>
                ))}
            </div>
          </div>
        )}

        {view === "students" && !selectedId && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <div><h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: 2 }}>ALUNOS</h1><p style={{ color: "#555", fontSize: 13 }}>{students.length} cadastrado(s) · dados salvos automaticamente 💾</p></div>
              <button onClick={() => setShowStudentForm(true)} style={btnPrimary}>+ NOVO ALUNO</button>
            </div>
            <input placeholder="🔍  Buscar aluno ou modalidade..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, marginBottom: 20, width: 320 }} />
            {showStudentForm && (
              <div style={{ background: "#151515", borderRadius: 16, padding: 24, marginBottom: 24, border: "1px solid #c0392b44" }}>
                <h3 style={{ marginBottom: 20, fontWeight: 800, letterSpacing: 1, color: "#c0392b" }}>NOVO ALUNO</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[{ label: "NOME COMPLETO", key: "name", type: "text" }, { label: "IDADE", key: "age", type: "number" }, { label: "TELEFONE", key: "phone", type: "text" }, { label: "MEMBRO DESDE", key: "since", type: "date" }].map(f => (
                    <div key={f.key}><label style={labelStyle}>{f.label}</label><input type={f.type} value={studentForm[f.key]} onChange={e => setStudentForm({ ...studentForm, [f.key]: e.target.value })} style={inputStyle} /></div>
                  ))}
                  <div><label style={labelStyle}>MODALIDADE</label><select value={studentForm.modality} onChange={e => setStudentForm({ ...studentForm, modality: e.target.value })} style={inputStyle}>{MODALITIES.map(m => <option key={m}>{m}</option>)}</select></div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}><button onClick={addStudent} style={btnPrimary}>SALVAR</button><button onClick={() => setShowStudentForm(false)} style={btnSecondary}>Cancelar</button></div>
              </div>
            )}
            <div style={{ display: "grid", gap: 12 }}>
              {filtered.map(s => (
                <div key={s.id} onClick={() => setSelectedId(s.id)} style={{ background: "#151515", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", border: "1px solid #1e1e1e" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#c0392b55"} onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e1e"}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 48, height: 48, background: "#c0392b22", border: "2px solid #c0392b66", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: "#c0392b" }}>{s.name[0].toUpperCase()}</div>
                    <div><div style={{ fontWeight: 700, fontSize: 16 }}>{s.name}</div><div style={{ color: "#555", fontSize: 12 }}>{s.age} anos · {s.phone}</div></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}><span style={{ color: "#555", fontSize: 12 }}>{s.assessments.length} avaliação(ões)</span><Badge text={s.modality} /><span style={{ color: "#444" }}>›</span></div>
                </div>
              ))}
              {filtered.length === 0 && students.length > 0 && <div style={{ color: "#444", padding: 20 }}>Nenhum aluno encontrado.</div>}
            </div>
          </div>
        )}

        {view === "students" && selectedStudent && (
          <div>
            <button onClick={() => { setSelectedId(null); setShowAssessmentForm(false); }} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14, marginBottom: 20 }}>← Voltar para alunos</button>
            <div style={{ background: "#151515", borderRadius: 20, padding: 28, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 72, height: 72, background: "#c0392b33", border: "3px solid #c0392b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 30, color: "#c0392b" }}>{selectedStudent.name[0].toUpperCase()}</div>
                <div><h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{selectedStudent.name}</h2><div style={{ color: "#666", fontSize: 13, marginBottom: 8 }}>{selectedStudent.age} anos · {selectedStudent.phone} · Desde {selectedStudent.since || "—"}</div><Badge text={selectedStudent.modality} /></div>
              </div>
              <button onClick={() => deleteStudent(selectedStudent.id)} style={{ background: "#1a1a1a", color: "#e74c3c", border: "1px solid #e74c3c44", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>🗑️ Excluir Aluno</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18, letterSpacing: 1 }}>📋 AVALIAÇÕES FÍSICAS ({selectedStudent.assessments.length})</h3>
              <button onClick={() => setShowAssessmentForm(v => !v)} style={btnPrimary}>{showAssessmentForm ? "✕ Cancelar" : "+ NOVA AVALIAÇÃO"}</button>
            </div>
            {showAssessmentForm && (
              <div style={{ background: "#151515", borderRadius: 16, padding: 24, marginBottom: 20, border: "1px solid #c0392b44" }}>
                <h4 style={{ marginBottom: 18, color: "#c0392b", fontWeight: 800, letterSpacing: 1 }}>NOVA AVALIAÇÃO FÍSICA</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {[{ label: "DATA *", key: "date", type: "date" }, { label: "PESO (kg) *", key: "weight", type: "number" }, { label: "ALTURA (cm)", key: "height", type: "number" }, { label: "TÓRAX (cm)", key: "chest", type: "number" }, { label: "CINTURA (cm)", key: "waist", type: "number" }, { label: "QUADRIL (cm)", key: "hip", type: "number" }, { label: "BÍCEPS (cm)", key: "bicep", type: "number" }, { label: "% GORDURA", key: "bodyfat", type: "number" }].map(f => (
                    <div key={f.key}><label style={labelStyle}>{f.label}</label><input type={f.type} value={assessmentForm[f.key]} onChange={e => setAssessmentForm({ ...assessmentForm, [f.key]: e.target.value })} style={inputStyle} /></div>
                  ))}
                  <div style={{ gridColumn: "span 3" }}><label style={labelStyle}>OBSERVAÇÕES</label><textarea value={assessmentForm.notes} onChange={e => setAssessmentForm({ ...assessmentForm, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}><button onClick={addAssessment} style={btnPrimary}>💾 SALVAR AVALIAÇÃO</button><button onClick={() => setShowAssessmentForm(false)} style={btnSecondary}>Cancelar</button></div>
              </div>
            )}
            {selectedStudent.assessments.length === 0 ? (
              <div style={{ background: "#151515", borderRadius: 16, padding: 48, textAlign: "center", color: "#444" }}>Nenhuma avaliação registrada ainda.</div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {selectedStudent.assessments.map((a, i) => (
                  <div key={a.id} style={{ background: "#151515", borderRadius: 16, padding: 24, border: i === 0 ? "1px solid #c0392b44" : "1px solid #1e1e1e" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>📅 {a.date}</span>
                      <button onClick={() => deleteAssessment(a.id)} style={{ background: "none", border: "1px solid #e74c3c33", borderRadius: 6, color: "#e74c3c88", cursor: "pointer", padding: "4px 10px", fontSize: 13 }}>🗑️ Remover</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                      {[{ label: "Peso", value: a.weight ? `${a.weight} kg` : "—" }, { label: "Altura", value: a.height ? `${a.height} cm` : "—" }, { label: "IMC", value: a.weight && a.height ? <IMC weight={Number(a.weight)} height={Number(a.height)} /> : "—" }, { label: "% Gordura", value: a.bodyfat ? `${a.bodyfat}%` : "—" }, { label: "Tórax", value: a.chest ? `${a.chest} cm` : "—" }, { label: "Cintura", value: a.waist ? `${a.waist} cm` : "—" }, { label: "Quadril", value: a.hip ? `${a.hip} cm` : "—" }, { label: "Bíceps", value: a.bicep ? `${a.bicep} cm` : "—" }].map((item, j) => (
                        <div key={j} style={{ background: "#0d0d0d", borderRadius: 10, padding: "12px 16px" }}>
                          <div style={{ color: "#555", fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>{item.label.toUpperCase()}</div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {a.notes && <div style={{ marginTop: 14, background: "#0d0d0d", borderRadius: 10, padding: "12px 16px", color: "#777", fontSize: 13, fontStyle: "italic" }}>📝 {a.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "schedule" && (
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: 2, marginBottom: 4 }}>AGENDAMENTOS</h1>
            <p style={{ color: "#555", marginBottom: 28 }}>Grade semanal de aulas</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
              {["SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((day, i) => (
                <div key={i} style={{ background: "#151515", borderRadius: 14, padding: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#c0392b", letterSpacing: 1, marginBottom: 14 }}>{day}</div>
                  {[{ time: "07:00", type: "Boxe" }, { time: "18:30", type: "Muay Thai" }, { time: "20:00", type: "Boxe" }].filter((_, j) => !(i === 5 && j === 2)).map((aula, j) => (
                    <div key={j} style={{ background: "#0d0d0d", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: "#c0392b", fontWeight: 700 }}>{aula.time}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{aula.type}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}