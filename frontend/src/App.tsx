import { ReactNode, useEffect, useMemo, useState } from 'react';
import LoginPage from './pages/auth/LoginPage';
import { api } from './lib/api';
import { AuthUser, Certification, DocumentType, LoginResponse, StudentDocument, StudentProfile, Visibility } from './types';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });
  const [globalMessage, setGlobalMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [studentView, setStudentView] = useState<'dashboard' | 'documents' | 'certifications' | 'academic' | 'settings'>('dashboard');
  const [adminView, setAdminView] = useState<'dashboard' | 'students' | 'requirements' | 'settings'>('dashboard');

  const getFileUrl = (path: string) => {
    if (!path) return '#';
    // Use the relative path through Vite proxy (/api) to avoid CORS and port issues
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/api${cleanPath}`;
  };

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [certTypes, setCertTypes] = useState<DocumentType[]>([]);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  const [selectedDocTypeId, setSelectedDocTypeId] = useState('');
  const [selectedCertTypeId, setSelectedCertTypeId] = useState('');
  const [docVisibility, setDocVisibility] = useState<Visibility>('SHARED');
  const [certVisibility, setCertVisibility] = useState<Visibility>('SHARED');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [replaceDocFile, setReplaceDocFile] = useState<Record<string, File | null>>({});
  const [replaceCertFile, setReplaceCertFile] = useState<Record<string, File | null>>({});

  const [certTitle, setCertTitle] = useState('');
  const [certProvider, setCertProvider] = useState('');
  const [certCategory, setCertCategory] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [filterBatch, setFilterBatch] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterMinTenth, setFilterMinTenth] = useState('');
  const [filterMinInter, setFilterMinInter] = useState('');
  const [filterMinBtechCgpa, setFilterMinBtechCgpa] = useState('');
  const [filterMaxBacklogs, setFilterMaxBacklogs] = useState('');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState<Record<string, string>>({});

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
  const [bulkInput, setBulkInput] = useState('');
  const [newDocType, setNewDocType] = useState('');
  const [newCertType, setNewCertType] = useState('');
  const [studentAcademic, setStudentAcademic] = useState({
    tenthMarks: '',
    tenthPercentage: '',
    interMarks: '',
    interPercentage: '',
    btechCgpa: '',
    btechPercentage: '',
    backlogsCount: '',
  });

  const mustChangePassword = Boolean(user?.role === 'STUDENT' && user.mustChangePass);

  const mandatorySummary = useMemo(() => {
    const mandatory = docTypes.filter((d) => d.isMandatory);
    const uploadedMandatory = new Set(documents.filter((d) => d.documentType.isMandatory).map((d) => d.documentType.id));
    const missing = mandatory.filter((d) => !uploadedMandatory.has(d.id));
    return { mandatory, missing };
  }, [docTypes, documents]);

  async function loadStudentData(activeToken: string) {
    setLoading(true);
    try {
      const [myProfile, allDocTypes, allCertTypes, myDocs, myCerts] = await Promise.all([
        api.getMyProfile(activeToken),
        api.getDocumentTypes(activeToken),
        api.getCertificationTypes(activeToken),
        api.getMyDocuments(activeToken),
        api.getMyCertifications(activeToken),
      ]);
      const docTypeData = allDocTypes as DocumentType[];
      const certTypeData = allCertTypes as DocumentType[];
      setProfile(myProfile as StudentProfile);
      setDocTypes(docTypeData);
      setCertTypes(certTypeData);
      setDocuments(myDocs as StudentDocument[]);
      setCertifications(myCerts as Certification[]);
      setStudentAcademic({
        tenthMarks: String((myProfile as StudentProfile).tenthMarks ?? ''),
        tenthPercentage: String((myProfile as StudentProfile).tenthPercentage ?? ''),
        interMarks: String((myProfile as StudentProfile).interMarks ?? ''),
        interPercentage: String((myProfile as StudentProfile).interPercentage ?? ''),
        btechCgpa: String((myProfile as StudentProfile).btechCgpa ?? (myProfile as StudentProfile).currentCgpa ?? ''),
        btechPercentage: String((myProfile as StudentProfile).btechPercentage ?? ''),
        backlogsCount: String((myProfile as StudentProfile).backlogsCount ?? ''),
      });
      if (!selectedDocTypeId && docTypeData.length) setSelectedDocTypeId(docTypeData[0].id);
      if (!selectedCertTypeId && certTypeData.length) setSelectedCertTypeId(certTypeData[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token || !user) return;
    if (user.role === 'STUDENT' && !mustChangePassword) {
      loadStudentData(token).catch((e) => setGlobalMessage((e as Error).message));
    }
  }, [token, user, mustChangePassword, studentView]);

  function setAuth(data: LoginResponse) {
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.accessToken);
    setUser(data.user);
  }

  function handleLoginSuccess(data: LoginResponse) {
    setAuth(data);
    setGlobalMessage(`Welcome ${data.user.username}`);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  async function changePasswordFirstTime() {
    if (!token || !oldPassword || !newPassword) return;
    const data = await api.changePassword(token, oldPassword, newPassword);
    setAuth(data);
    setGlobalMessage('Password changed successfully.');
  }

  async function saveAcademicProfile() {
    if (!token) return;
    await api.updateMyProfile(token, {
      tenthMarks: studentAcademic.tenthMarks ? Number(studentAcademic.tenthMarks) : null,
      tenthPercentage: studentAcademic.tenthPercentage ? Number(studentAcademic.tenthPercentage) : null,
      interMarks: studentAcademic.interMarks ? Number(studentAcademic.interMarks) : null,
      interPercentage: studentAcademic.interPercentage ? Number(studentAcademic.interPercentage) : null,
      btechCgpa: studentAcademic.btechCgpa ? Number(studentAcademic.btechCgpa) : null,
      btechPercentage: studentAcademic.btechPercentage ? Number(studentAcademic.btechPercentage) : null,
      backlogsCount: studentAcademic.backlogsCount ? Number(studentAcademic.backlogsCount) : 0,
      currentCgpa: studentAcademic.btechCgpa ? Number(studentAcademic.btechCgpa) : null,
    });
    await loadStudentData(token);
    setGlobalMessage('Academic details saved.');
  }

  async function uploadDocument() {
    if (!token || !docFile || !selectedDocTypeId) return;
    const formData = new FormData();
    formData.append('documentTypeId', selectedDocTypeId);
    formData.append('visibility', docVisibility);
    formData.append('file', docFile);
    await api.uploadDocument(token, formData);
    setDocFile(null);
    await loadStudentData(token);
    setGlobalMessage('Document uploaded.');
  }

  async function replaceDocument(document: StudentDocument) {
    if (!token || !replaceDocFile[document.id]) return;
    const formData = new FormData();
    formData.append('documentTypeId', document.documentType.id);
    formData.append('visibility', document.visibility);
    formData.append('file', replaceDocFile[document.id] as File);
    await api.replaceDocument(token, document.id, formData);
    setReplaceDocFile((p) => ({ ...p, [document.id]: null }));
    await loadStudentData(token);
    setGlobalMessage('Document replaced and moved to review.');
  }

  async function deleteDocument(id: string) {
    if (!token) return;
    await api.deleteDocument(token, id);
    await loadStudentData(token);
    setGlobalMessage('Document deleted.');
  }

  async function toggleDocVisibility(id: string, visibility: Visibility) {
    if (!token) return;
    const next = visibility === 'SHARED' ? 'PRIVATE' : 'SHARED';
    await api.updateDocumentVisibility(token, id, next);
    await loadStudentData(token);
  }

  async function uploadCertification() {
    if (!token || !certFile || !certTitle || !certProvider) return;
    const formData = new FormData();
    if (selectedCertTypeId) formData.append('certificationTypeId', selectedCertTypeId);
    formData.append('title', certTitle);
    formData.append('provider', certProvider);
    formData.append('category', certCategory);
    formData.append('visibility', certVisibility);
    formData.append('file', certFile);
    await api.uploadCertification(token, formData);
    setCertFile(null);
    setCertTitle('');
    setCertProvider('');
    setCertCategory('');
    await loadStudentData(token);
    setGlobalMessage('Certification uploaded.');
  }

  async function replaceCertification(cert: Certification) {
    if (!token || !replaceCertFile[cert.id]) return;
    const formData = new FormData();
    if (cert.certificationTypeId) formData.append('certificationTypeId', cert.certificationTypeId);
    formData.append('title', cert.title);
    formData.append('provider', cert.provider);
    formData.append('category', cert.category || '');
    formData.append('visibility', cert.visibility);
    formData.append('file', replaceCertFile[cert.id] as File);
    await api.replaceCertification(token, cert.id, formData);
    setReplaceCertFile((p) => ({ ...p, [cert.id]: null }));
    await loadStudentData(token);
    setGlobalMessage('Certification replaced and moved to review.');
  }

  async function deleteCertification(id: string) {
    if (!token) return;
    await api.deleteCertification(token, id);
    await loadStudentData(token);
    setGlobalMessage('Certification deleted.');
  }

  async function toggleCertVisibility(id: string, visibility: Visibility) {
    if (!token) return;
    const next = visibility === 'SHARED' ? 'PRIVATE' : 'SHARED';
    await api.updateCertificationVisibility(token, id, next);
    await loadStudentData(token);
  }

  async function createDocumentRequirement() {
    if (!token || !newDocType.trim()) return;
    await api.createDocumentType(token, { name: newDocType.trim(), isMandatory: true });
    setNewDocType('');
    if (user?.role === 'STUDENT') await loadStudentData(token);
    setGlobalMessage('Document field created.');
  }

  async function createCertificationRequirement() {
    if (!token || !newCertType.trim()) return;
    await api.createCertificationType(token, { name: newCertType.trim(), isMandatory: true });
    setNewCertType('');
    setGlobalMessage('Certification field created.');
  }

  async function runStudentFilters() {
    if (!token) return;
    const params = new URLSearchParams();
    if (filterBatch) params.set('batch', filterBatch);
    if (filterBranch) params.set('branch', filterBranch);
    if (filterMinTenth) params.set('minTenth', filterMinTenth);
    if (filterMinInter) params.set('minInter', filterMinInter);
    if (filterMinBtechCgpa) params.set('minBtechCgpa', filterMinBtechCgpa);
    if (filterMaxBacklogs) params.set('maxBacklogs', filterMaxBacklogs);
    const data = (await api.getStudents(token, `?${params.toString()}`)) as StudentProfile[];
    setStudents(data);
    setSelectedStudent(null);
  }

  async function viewStudent(id: string) {
    if (!token) return;
    const data = await api.getStudentById(token, id);
    setSelectedStudent(data);
  }

  async function reviewDocument(id: string, status: 'APPROVED' | 'REJECTED') {
    if (!token) return;
    await api.reviewDocument(token, id, { status, remarks: reviewRemarks[id] });
    if (selectedStudent) await viewStudent(selectedStudent.id);
  }

  async function reviewCertification(id: string, status: 'APPROVED' | 'REJECTED') {
    if (!token) return;
    await api.reviewCertification(token, id, { status, remarks: reviewRemarks[id] });
    if (selectedStudent) await viewStudent(selectedStudent.id);
  }

  async function createStudent() {
    if (!token) return;
    await api.createStudent(token, {
      ...newStudent,
      batch: Number(newStudent.batch),
    });
    setGlobalMessage('Student created.');
  }

  async function createBulkStudents() {
    if (!token || !bulkInput.trim()) return;
    const studentsPayload = bulkInput
      .split('\n')
      .map((line) => line.trim())
      .filter((line, index) => {
        if (index === 0 && (line.toLowerCase().includes('roll') || line.toLowerCase().includes('full name'))) return false;
        return Boolean(line);
      })
      .map((line) => {
        const [rollNumber, fullName, batch, branch, section, email, phone, defaultPassword] = line.split(',').map((p) => p.trim());
        return {
          rollNumber,
          fullName,
          batch: Number(batch),
          branch,
          section: section || undefined,
          email: email || undefined,
          phone: phone || undefined,
          defaultPassword: defaultPassword || 'Student@123',
        };
      });
    try {
      const result = await api.createStudentsBulk(token, studentsPayload);
      setGlobalMessage(`Bulk complete: ${(result as any).createdCount} created, ${(result as any).failedCount} failed.`);
      setBulkInput('');
    } catch (e) {
      setGlobalMessage(`Bulk failed: ${(e as Error).message}`);
    }
  }

  function exportFilteredStudents() {
    downloadCsv(
      'filtered_students.csv',
      students.map((s) => ({
        rollNumber: s.rollNumber,
        fullName: s.fullName,
        batch: s.batch,
        branch: s.branch,
        tenthPercentage: s.tenthPercentage ?? '',
        interPercentage: s.interPercentage ?? '',
        btechCgpa: s.btechCgpa ?? s.currentCgpa ?? '',
        backlogsCount: s.backlogsCount ?? '',
      })),
    );
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
      <header className="header glass slide-in">
        <div>
          <h1>Certificates Management Portal (CMP)</h1>
          <p className="muted">Digital Student Locker | Documents, Internships, Courses</p>
          <p className="muted">Logged in as {user.username} ({user.role})</p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>
      {globalMessage && <p className="message pulse">{globalMessage}</p>}

      {mustChangePassword && (
        <section className="card glow">
          <h3>First Login Password Change</h3>
          <div className="stack">
            <input type="password" placeholder="Current password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <button onClick={changePasswordFirstTime}>Change Password</button>
          </div>
        </section>
      )}

      {!mustChangePassword && user.role === 'STUDENT' && (
        <>
          <nav className="card section-nav">
            <button className={studentView === 'dashboard' ? 'active' : ''} onClick={() => setStudentView('dashboard')}>Dashboard</button>
            <button className={studentView === 'documents' ? 'active' : ''} onClick={() => setStudentView('documents')}>Mandatory Documents</button>
            <button className={studentView === 'certifications' ? 'active' : ''} onClick={() => setStudentView('certifications')}>Certifications</button>
            <button className={studentView === 'academic' ? 'active' : ''} onClick={() => setStudentView('academic')}>Academic Scores</button>
            <button className={studentView === 'settings' ? 'active' : ''} onClick={() => setStudentView('settings')}>Settings</button>
          </nav>
          <main className="grid">
            {studentView === 'dashboard' && (
              <section className="dashboard-grid">
                <div className="card dashboard-card" onClick={() => setStudentView('documents')}>
                  <h3>Mandatory Documents</h3>
                  <p>Uploaded {mandatorySummary.mandatory.length - mandatorySummary.missing.length}/{mandatorySummary.mandatory.length}</p>
                  <button>View Section</button>
                </div>
                <div className="card dashboard-card" onClick={() => setStudentView('certifications')}>
                  <h3>Certifications</h3>
                  <p>{certifications.length} certificates uploaded</p>
                  <button>View Section</button>
                </div>
                <div className="card dashboard-card" onClick={() => setStudentView('academic')}>
                  <h3>Academic Scores</h3>
                  <p>Current CGPA: {profile?.currentCgpa || 'N/A'}</p>
                  <button>View Section</button>
                </div>
                <div className="card dashboard-card" onClick={() => setStudentView('settings')}>
                  <h3>Settings</h3>
                  <p>Edit profile & login details</p>
                  <button>View Section</button>
                </div>
              </section>
            )}

            {studentView === 'documents' && (
              <section className="card fade-in" id="mandatory-docs">
                <h3>Mandatory Documents</h3>
                {loading ? <p>Loading...</p> : null}
                <div className="stack">
                  <select value={selectedDocTypeId} onChange={(e) => setSelectedDocTypeId(e.target.value)}>
                    {docTypes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <select value={docVisibility} onChange={(e) => setDocVisibility(e.target.value as Visibility)}>
                    <option value="SHARED">Shared</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                  <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
                  <button onClick={uploadDocument}>Upload Document</button>
                </div>
                <ul className="list">
                  {documents.map((d) => (
                    <li key={d.id} className="list-item">
                      <div>
                        <b>{d.documentType.name}</b> - {d.fileName}
                        <div className="muted">Status: {d.status} | Remarks: {d.remarks || 'N/A'}</div>
                      </div>
                      <div className="row-actions">
                        <a href={getFileUrl(d.filePath)} target="_blank" rel="noreferrer"><button>View</button></a>
                        <a href={getFileUrl(d.filePath)} download><button>Download</button></a>
                        <div className="replace-action">
                          <input type="file" onChange={(e) => setReplaceDocFile((p) => ({ ...p, [d.id]: e.target.files?.[0] || null }))} />
                          <button onClick={() => replaceDocument(d)}>Edit/Reupload</button>
                        </div>
                        <button className="danger" onClick={() => deleteDocument(d.id)}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {studentView === 'certifications' && (
              <>
                <section className="card fade-in" id="internship-certs">
                  <h3>Upload New Certification</h3>
                  <div className="stack">
                    <select value={selectedCertTypeId} onChange={(e) => setSelectedCertTypeId(e.target.value)}>
                      <option value="">Select requirement field</option>
                      {certTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <input placeholder="Title" value={certTitle} onChange={(e) => setCertTitle(e.target.value)} />
                    <input placeholder="Provider" value={certProvider} onChange={(e) => setCertProvider(e.target.value)} />
                    <input placeholder="Category (Internship/Course/etc)" value={certCategory} onChange={(e) => setCertCategory(e.target.value)} />
                    <select value={certVisibility} onChange={(e) => setCertVisibility(e.target.value as Visibility)}>
                      <option value="SHARED">Shared</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                    <input type="file" onChange={(e) => setCertFile(e.target.files?.[0] || null)} />
                    <button onClick={uploadCertification}>Upload Certification</button>
                  </div>
                </section>

                <section className="card fade-in" id="course-certs">
                  <h3>Uploaded Certifications</h3>
                  <ul className="list">
                    {certifications.map((c) => (
                      <li key={c.id} className="list-item">
                        <div>
                          <b>{c.title}</b> - {c.provider}
                          <div className="muted">Field: {c.certificationType?.name || 'General'} | Status: {c.status} | Remarks: {c.remarks || 'N/A'}</div>
                        </div>
                        <div className="row-actions">
                            <a href={getFileUrl(c.filePath)} target="_blank" rel="noreferrer"><button>View</button></a>
                            <a href={getFileUrl(c.filePath)} download><button>Download</button></a>
                            <div className="replace-action">
                            <input type="file" onChange={(e) => setReplaceCertFile((p) => ({ ...p, [c.id]: e.target.files?.[0] || null }))} />
                            <button onClick={() => replaceCertification(c)}>Edit/Reupload</button>
                          </div>
                          <button className="danger" onClick={() => deleteCertification(c.id)}>Delete</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}

            {studentView === 'academic' && (
              <section className="card fade-in" id="academic-section">
                <h3>Academic Scores (Student Entry)</h3>
                {profile && <p className="muted">{profile.rollNumber} - {profile.fullName}</p>}
                <div className="stack cols-2">
                  <Field label="10th Marks"><input value={studentAcademic.tenthMarks} onChange={(e) => setStudentAcademic((p) => ({ ...p, tenthMarks: e.target.value }))} /></Field>
                  <Field label="10th %"><input value={studentAcademic.tenthPercentage} onChange={(e) => setStudentAcademic((p) => ({ ...p, tenthPercentage: e.target.value }))} /></Field>
                  <Field label="Inter Marks"><input value={studentAcademic.interMarks} onChange={(e) => setStudentAcademic((p) => ({ ...p, interMarks: e.target.value }))} /></Field>
                  <Field label="Inter %"><input value={studentAcademic.interPercentage} onChange={(e) => setStudentAcademic((p) => ({ ...p, interPercentage: e.target.value }))} /></Field>
                  <Field label="B.Tech CGPA"><input value={studentAcademic.btechCgpa} onChange={(e) => setStudentAcademic((p) => ({ ...p, btechCgpa: e.target.value }))} /></Field>
                  <Field label="B.Tech %"><input value={studentAcademic.btechPercentage} onChange={(e) => setStudentAcademic((p) => ({ ...p, btechPercentage: e.target.value }))} /></Field>
                  <Field label="Backlogs"><input value={studentAcademic.backlogsCount} onChange={(e) => setStudentAcademic((p) => ({ ...p, backlogsCount: e.target.value }))} /></Field>
                </div>
                <button onClick={saveAcademicProfile}>Save Academic Details</button>
              </section>
            )}

            {studentView === 'settings' && (
              <section className="card fade-in">
                <h3>Account Settings</h3>
                <div className="stack">
                  <h4>Change Password</h4>
                  <input type="password" placeholder="Current password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                  <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <button onClick={changePasswordFirstTime}>Update Password</button>
                </div>
                <div className="stack" style={{ marginTop: '20px' }}>
                  <h4>Profile Information</h4>
                  {profile && (
                    <div className="stack">
                      <Field label="Full Name"><input value={profile.fullName} readOnly /></Field>
                      <Field label="Roll Number"><input value={profile.rollNumber} readOnly /></Field>
                      <Field label="Email"><input value={profile.email || ''} readOnly /></Field>
                      <Field label="Phone"><input value={profile.phone || ''} readOnly /></Field>
                    </div>
                  )}
                </div>
              </section>
            )}
          </main>
        </>
      )}

      {user.role === 'ADMIN' && (
        <>
          <nav className="card section-nav">
            <button className={adminView === 'dashboard' ? 'active' : ''} onClick={() => setAdminView('dashboard')}>Dashboard</button>
            <button className={adminView === 'students' ? 'active' : ''} onClick={() => setAdminView('students')}>Manage Students</button>
            <button className={adminView === 'requirements' ? 'active' : ''} onClick={() => setAdminView('requirements')}>Requirement Fields</button>
            <button className={adminView === 'settings' ? 'active' : ''} onClick={() => setAdminView('settings')}>Settings</button>
          </nav>
          <main className="grid">
            {adminView === 'dashboard' && (
              <section className="dashboard-grid">
                <div className="card dashboard-card" onClick={() => setAdminView('students')}>
                  <h3>Manage Students</h3>
                  <p>View & filter student profiles</p>
                  <button>View Section</button>
                </div>
                <div className="card dashboard-card" onClick={() => setAdminView('requirements')}>
                  <h3>Requirement Fields</h3>
                  <p>Create document/certification fields</p>
                  <button>View Section</button>
                </div>
                <div className="card dashboard-card" onClick={() => setAdminView('settings')}>
                  <h3>Admin Settings</h3>
                  <p>Manage admin account</p>
                  <button>View Section</button>
                </div>
              </section>
            )}

            {adminView === 'requirements' && (
              <section className="card fade-in">
                <h3>Create Requirement Fields</h3>
                <div className="stack">
                  <input placeholder="New document field" value={newDocType} onChange={(e) => setNewDocType(e.target.value)} />
                  <button onClick={createDocumentRequirement}>Create Document Field</button>
                  <input placeholder="New certification field" value={newCertType} onChange={(e) => setNewCertType(e.target.value)} />
                  <button onClick={createCertificationRequirement}>Create Certification Field</button>
                </div>
              </section>
            )}

            {adminView === 'students' && (
              <>
                <section className="card fade-in">
                  <h3>Create Students</h3>
                  <div className="stack cols-2">
                    <input placeholder="Roll Number" value={newStudent.rollNumber} onChange={(e) => setNewStudent((p) => ({ ...p, rollNumber: e.target.value }))} />
                    <input placeholder="Full Name" value={newStudent.fullName} onChange={(e) => setNewStudent((p) => ({ ...p, fullName: e.target.value }))} />
                    <input placeholder="Batch" value={newStudent.batch} onChange={(e) => setNewStudent((p) => ({ ...p, batch: e.target.value }))} />
                    <input placeholder="Branch" value={newStudent.branch} onChange={(e) => setNewStudent((p) => ({ ...p, branch: e.target.value }))} />
                    <input placeholder="Section" value={newStudent.section} onChange={(e) => setNewStudent((p) => ({ ...p, section: e.target.value }))} />
                    <input placeholder="Email" value={newStudent.email} onChange={(e) => setNewStudent((p) => ({ ...p, email: e.target.value }))} />
                    <input placeholder="Phone" value={newStudent.phone} onChange={(e) => setNewStudent((p) => ({ ...p, phone: e.target.value }))} />
                    <input placeholder="Default Password" value={newStudent.defaultPassword} onChange={(e) => setNewStudent((p) => ({ ...p, defaultPassword: e.target.value }))} />
                  </div>
                  <button onClick={createStudent}>Create Student</button>
                  <hr />
                  <h4>Bulk Student Creation</h4>
                  <p className="muted">Bulk format: roll,fullName,batch,branch,section,email,phone,password</p>
                  <textarea rows={6} value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} placeholder="Paste CSV data here..." />
                  <div className="row-actions">
                    <button onClick={createBulkStudents}>Create Bulk Students from Text</button>
                    <input type="file" accept=".csv" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const text = await file.text();
                        setBulkInput(text);
                      }
                    }} />
                  </div>
                </section>

                <section className="card fade-in">
                  <h3>Filter Students + Export</h3>
                  <div className="stack cols-2">
                    <input placeholder="Batch" value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} />
                    <input placeholder="Branch" value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} />
                    <input placeholder="Min 10th %" value={filterMinTenth} onChange={(e) => setFilterMinTenth(e.target.value)} />
                    <input placeholder="Min Inter %" value={filterMinInter} onChange={(e) => setFilterMinInter(e.target.value)} />
                    <input placeholder="Min B.Tech CGPA" value={filterMinBtechCgpa} onChange={(e) => setFilterMinBtechCgpa(e.target.value)} />
                    <input placeholder="Max Backlogs" value={filterMaxBacklogs} onChange={(e) => setFilterMaxBacklogs(e.target.value)} />
                  </div>
                  <div className="row-actions">
                    <button onClick={runStudentFilters}>Apply Filters</button>
                    <button onClick={exportFilteredStudents}>Download Filtered Data (Excel CSV)</button>
                  </div>
                  <ul className="list">
                    {students.map((s) => (
                      <li key={s.id} className="list-item">
                        <span><b>{s.rollNumber}</b> - {s.fullName}</span>
                        <button onClick={() => viewStudent(s.id)}>View</button>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="card fade-in">
                  <h3>Admin Review</h3>
                  {!selectedStudent ? <p>Select a student to review uploads.</p> : null}
                  {selectedStudent ? (
                    <>
                      <p><b>{selectedStudent.rollNumber}</b> - {selectedStudent.fullName}</p>
                      <h4>Documents</h4>
                      <ul className="list">
                        {selectedStudent.documents.map((d: StudentDocument) => (
                          <li key={d.id} className="list-item">
                            <div>{d.documentType.name} - {d.fileName} ({d.status})</div>
                            <div className="row-actions">
                              <a href={getFileUrl(d.filePath)} target="_blank" rel="noreferrer"><button>View</button></a>
                              <a href={getFileUrl(d.filePath)} download><button>Download</button></a>
                              <input placeholder="Remarks" value={reviewRemarks[d.id] || ''} onChange={(e) => setReviewRemarks((p) => ({ ...p, [d.id]: e.target.value }))} />
                              <button onClick={() => reviewDocument(d.id, 'APPROVED')}>Accept</button>
                              <button className="danger" onClick={() => reviewDocument(d.id, 'REJECTED')}>Reject</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <h4>Certifications</h4>
                      <ul className="list">
                        {selectedStudent.certifications.map((c: Certification) => (
                          <li key={c.id} className="list-item">
                            <div>{c.title} - {c.provider} ({c.status})</div>
                            <div className="row-actions">
                              <a href={getFileUrl(c.filePath)} target="_blank" rel="noreferrer"><button>View</button></a>
                              <a href={getFileUrl(c.filePath)} download><button>Download</button></a>
                              <input placeholder="Remarks" value={reviewRemarks[c.id] || ''} onChange={(e) => setReviewRemarks((p) => ({ ...p, [c.id]: e.target.value }))} />
                              <button onClick={() => reviewCertification(c.id, 'APPROVED')}>Accept</button>
                              <button className="danger" onClick={() => reviewCertification(c.id, 'REJECTED')}>Reject</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </section>
              </>
            )}

            {adminView === 'settings' && (
              <section className="card fade-in">
                <h3>Admin Settings</h3>
                <div className="stack">
                  <h4>Change Admin Password</h4>
                  <input type="password" placeholder="Current password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                  <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <button onClick={changePasswordFirstTime}>Update Password</button>
                </div>
              </section>
            )}
          </main>
        </>
      )}
    </div>
  );
}
