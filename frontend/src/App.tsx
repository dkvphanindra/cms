import { ReactNode, useEffect, useMemo, useState } from 'react';
import LoginPage from './pages/auth/LoginPage';
import { api } from './lib/api';
import {
  AuthUser,
  Certification,
  DocumentType,
  LoginResponse,
  StudentDocument,
  StudentProfile,
  Visibility,
} from './types';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });
  const [globalMessage, setGlobalMessage] = useState('');

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedDocTypeId, setSelectedDocTypeId] = useState('');
  const [docVisibility, setDocVisibility] = useState<Visibility>('SHARED');
  const [docFile, setDocFile] = useState<File | null>(null);

  const [certTitle, setCertTitle] = useState('');
  const [certProvider, setCertProvider] = useState('');
  const [certCategory, setCertCategory] = useState('');
  const [certVisibility, setCertVisibility] = useState<Visibility>('SHARED');
  const [certFile, setCertFile] = useState<File | null>(null);

  const [filterBatch, setFilterBatch] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterMinTenth, setFilterMinTenth] = useState('');
  const [filterCertification, setFilterCertification] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const [newStudent, setNewStudent] = useState({
    rollNumber: '',
    fullName: '',
    email: '',
    phone: '',
    batch: '',
    branch: '',
    section: '',
    defaultPassword: 'Student@123',
  });

  const mandatorySummary = useMemo(() => {
    const mandatory = docTypes.filter((d) => d.isMandatory);
    const uploadedMandatory = new Set(
      documents
        .filter((d) => d.documentType.isMandatory)
        .map((d) => d.documentType.id),
    );
    const missing = mandatory.filter((d) => !uploadedMandatory.has(d.id));
    return { mandatory, missing };
  }, [docTypes, documents]);

  async function loadStudentData(activeToken: string) {
    setLoading(true);
    try {
      const [myProfile, allDocTypes, myDocs, myCerts] = await Promise.all([
        api.getMyProfile(activeToken),
        api.getDocumentTypes(activeToken),
        api.getMyDocuments(activeToken),
        api.getMyCertifications(activeToken),
      ]);
      setProfile(myProfile as StudentProfile);
      setDocTypes(allDocTypes as DocumentType[]);
      setDocuments(myDocs as StudentDocument[]);
      setCertifications(myCerts as Certification[]);
      if ((allDocTypes as DocumentType[]).length > 0 && !selectedDocTypeId) {
        setSelectedDocTypeId((allDocTypes as DocumentType[])[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token || !user) return;
    if (user.role === 'STUDENT') {
      loadStudentData(token).catch((e) => setGlobalMessage((e as Error).message));
    }
  }, [token, user]);

  function handleLoginSuccess(data: LoginResponse) {
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.accessToken);
    setUser(data.user);
    setGlobalMessage(`Welcome ${data.user.username}`);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setGlobalMessage('Logged out successfully.');
  }

  async function uploadDocument() {
    if (!token || !docFile || !selectedDocTypeId) return;
    const form = new FormData();
    form.append('documentTypeId', selectedDocTypeId);
    form.append('visibility', docVisibility);
    form.append('file', docFile);
    await api.uploadDocument(token, form);
    setDocFile(null);
    await loadStudentData(token);
    setGlobalMessage('Document uploaded.');
  }

  async function uploadCertification() {
    if (!token || !certFile || !certTitle || !certProvider) return;
    const form = new FormData();
    form.append('title', certTitle);
    form.append('provider', certProvider);
    form.append('category', certCategory);
    form.append('visibility', certVisibility);
    form.append('file', certFile);
    await api.uploadCertification(token, form);
    setCertFile(null);
    setCertTitle('');
    setCertProvider('');
    setCertCategory('');
    await loadStudentData(token);
    setGlobalMessage('Certification uploaded.');
  }

  async function toggleDocVisibility(id: string, visibility: Visibility) {
    if (!token) return;
    const next = visibility === 'SHARED' ? 'PRIVATE' : 'SHARED';
    await api.updateDocumentVisibility(token, id, next);
    await loadStudentData(token);
  }

  async function toggleCertVisibility(id: string, visibility: Visibility) {
    if (!token) return;
    const next = visibility === 'SHARED' ? 'PRIVATE' : 'SHARED';
    await api.updateCertificationVisibility(token, id, next);
    await loadStudentData(token);
  }

  async function runStudentFilters() {
    if (!token) return;
    const params = new URLSearchParams();
    if (filterBatch) params.set('batch', filterBatch);
    if (filterBranch) params.set('branch', filterBranch);
    if (filterMinTenth) params.set('minTenth', filterMinTenth);
    if (filterCertification) params.set('certification', filterCertification);

    const data = (await api.getStudents(token, `?${params.toString()}`)) as any[];
    setStudents(data);
    setSelectedStudent(null);
  }

  async function viewStudentDetails(id: string) {
    if (!token) return;
    const data = await api.getStudentById(token, id);
    setSelectedStudent(data);
  }

  async function createStudent() {
    if (!token) return;
    await api.createStudent(token, {
      ...newStudent,
      batch: Number(newStudent.batch),
    });
    setGlobalMessage(`Student ${newStudent.rollNumber} created successfully.`);
    setNewStudent({
      rollNumber: '',
      fullName: '',
      email: '',
      phone: '',
      batch: '',
      branch: '',
      section: '',
      defaultPassword: 'Student@123',
    });
  }

  if (!token || !user) {
    return (
      <div className="page">
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Campus Credential Portal</h1>
          <p className="muted">
            Logged in as {user.username} ({user.role})
          </p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>
      {globalMessage && <p className="message">{globalMessage}</p>}

      {user.role === 'STUDENT' && (
        <main className="grid">
          <section className="card">
            <h3>Profile</h3>
            {loading ? <p>Loading...</p> : null}
            {profile ? (
              <ul>
                <li>Roll Number: {profile.rollNumber}</li>
                <li>Name: {profile.fullName}</li>
                <li>Batch: {profile.batch}</li>
                <li>Branch: {profile.branch}</li>
                <li>10th %: {profile.tenthPercentage ?? 'N/A'}</li>
              </ul>
            ) : null}
          </section>

          <section className="card">
            <h3>Mandatory Document Status</h3>
            <p>
              Uploaded {mandatorySummary.mandatory.length - mandatorySummary.missing.length} /{' '}
              {mandatorySummary.mandatory.length}
            </p>
            {mandatorySummary.missing.length > 0 ? (
              <ul>
                {mandatorySummary.missing.map((d) => (
                  <li key={d.id}>{d.name} (missing)</li>
                ))}
              </ul>
            ) : (
              <p>All mandatory documents uploaded.</p>
            )}
          </section>

          <section className="card">
            <h3>Upload Document</h3>
            <div className="stack">
              <Field label="Document Type">
                <select
                  value={selectedDocTypeId}
                  onChange={(e) => setSelectedDocTypeId(e.target.value)}
                >
                  {docTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.name} {dt.isMandatory ? '(Mandatory)' : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Visibility">
                <select value={docVisibility} onChange={(e) => setDocVisibility(e.target.value as Visibility)}>
                  <option value="SHARED">Shared with College</option>
                  <option value="PRIVATE">Private (only student)</option>
                </select>
              </Field>
              <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
              <button onClick={uploadDocument}>Upload Document</button>
            </div>
          </section>

          <section className="card">
            <h3>My Documents</h3>
            <ul className="list">
              {documents.map((d) => (
                <li key={d.id}>
                  <b>{d.documentType.name}</b> - {d.fileName} - {d.visibility}
                  <button onClick={() => toggleDocVisibility(d.id, d.visibility)}>
                    Make {d.visibility === 'SHARED' ? 'Private' : 'Shared'}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h3>Upload Certification</h3>
            <div className="stack">
              <input
                placeholder="Certification Title (e.g. AWS Cloud Practitioner)"
                value={certTitle}
                onChange={(e) => setCertTitle(e.target.value)}
              />
              <input
                placeholder="Provider (e.g. AWS)"
                value={certProvider}
                onChange={(e) => setCertProvider(e.target.value)}
              />
              <input
                placeholder="Category (Optional)"
                value={certCategory}
                onChange={(e) => setCertCategory(e.target.value)}
              />
              <select value={certVisibility} onChange={(e) => setCertVisibility(e.target.value as Visibility)}>
                <option value="SHARED">Shared with College</option>
                <option value="PRIVATE">Private (only student)</option>
              </select>
              <input type="file" onChange={(e) => setCertFile(e.target.files?.[0] || null)} />
              <button onClick={uploadCertification}>Upload Certification</button>
            </div>
          </section>

          <section className="card">
            <h3>My Certifications</h3>
            <ul className="list">
              {certifications.map((c) => (
                <li key={c.id}>
                  <b>{c.title}</b> - {c.provider} - {c.visibility}
                  <button onClick={() => toggleCertVisibility(c.id, c.visibility)}>
                    Make {c.visibility === 'SHARED' ? 'Private' : 'Shared'}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </main>
      )}

      {user.role === 'ADMIN' && (
        <main className="grid">
          <section className="card">
            <h3>Create Student Account</h3>
            <div className="stack">
              <input
                placeholder="Roll Number"
                value={newStudent.rollNumber}
                onChange={(e) => setNewStudent((p) => ({ ...p, rollNumber: e.target.value }))}
              />
              <input
                placeholder="Full Name"
                value={newStudent.fullName}
                onChange={(e) => setNewStudent((p) => ({ ...p, fullName: e.target.value }))}
              />
              <input
                placeholder="Batch (e.g. 2026)"
                value={newStudent.batch}
                onChange={(e) => setNewStudent((p) => ({ ...p, batch: e.target.value }))}
              />
              <input
                placeholder="Branch (e.g. CSE)"
                value={newStudent.branch}
                onChange={(e) => setNewStudent((p) => ({ ...p, branch: e.target.value }))}
              />
              <input
                placeholder="Section"
                value={newStudent.section}
                onChange={(e) => setNewStudent((p) => ({ ...p, section: e.target.value }))}
              />
              <input
                placeholder="Email"
                value={newStudent.email}
                onChange={(e) => setNewStudent((p) => ({ ...p, email: e.target.value }))}
              />
              <input
                placeholder="Phone"
                value={newStudent.phone}
                onChange={(e) => setNewStudent((p) => ({ ...p, phone: e.target.value }))}
              />
              <input
                placeholder="Default Password"
                value={newStudent.defaultPassword}
                onChange={(e) => setNewStudent((p) => ({ ...p, defaultPassword: e.target.value }))}
              />
              <button onClick={createStudent}>Create Student</button>
            </div>
          </section>

          <section className="card">
            <h3>Student Filters</h3>
            <div className="stack">
              <input
                placeholder="Batch (e.g. 2026)"
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
              />
              <input
                placeholder="Branch (e.g. CSE)"
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
              />
              <input
                placeholder="10th % minimum (e.g. 80)"
                value={filterMinTenth}
                onChange={(e) => setFilterMinTenth(e.target.value)}
              />
              <input
                placeholder="Certification keyword (e.g. AWS)"
                value={filterCertification}
                onChange={(e) => setFilterCertification(e.target.value)}
              />
              <button onClick={runStudentFilters}>Apply Filters</button>
            </div>
            <ul className="list">
              {students.map((s) => (
                <li key={s.id}>
                  <b>{s.rollNumber}</b> - {s.fullName} ({s.branch})
                  <button onClick={() => viewStudentDetails(s.id)}>View Details</button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h3>Selected Student Details</h3>
            {!selectedStudent ? <p>Select a student from filter results.</p> : null}
            {selectedStudent ? (
              <>
                <p>
                  <b>{selectedStudent.rollNumber}</b> - {selectedStudent.fullName}
                </p>
                <p>Shared Documents</p>
                <ul className="list">
                  {selectedStudent.documents.map((d: any) => (
                    <li key={d.id}>
                      {d.documentType.name} - {d.fileName}
                    </li>
                  ))}
                </ul>
                <p>Shared Certifications</p>
                <ul className="list">
                  {selectedStudent.certifications.map((c: any) => (
                    <li key={c.id}>
                      {c.title} - {c.provider}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        </main>
      )}
    </div>
  );
}
