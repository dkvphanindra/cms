import { ReactNode, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, FileText, Award, Bell, GraduationCap, Settings, 
  LogOut, Upload, Download, Trash2, Edit, Check, X, 
  Search, Filter, Plus, Users, LayoutDashboard, ChevronRight,
  Shield, ShieldOff, Eye, FilePlus, UserPlus, AlertCircle, Mail, Phone
} from 'lucide-react';
import LoginPage from './pages/auth/LoginPage';
import { api } from './lib/api';
import { AuthUser, Certification, DocumentType, LoginResponse, StudentDocument, StudentProfile, Visibility } from './types';

function Field({ label, icon: Icon, children }: { label: string; icon?: any; children: ReactNode }) {
  return (
    <label className="field">
      <span>
        {Icon && <Icon size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
        {label}
      </span>
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
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [studentView, setStudentView] = useState<'dashboard' | 'documents' | 'certifications' | 'academic' | 'announcements' | 'settings'>('dashboard');
  const [adminView, setAdminView] = useState<'dashboard' | 'students' | 'requirements' | 'announcements' | 'settings'>('dashboard');
  const [manageStudentsTab, setManageStudentsTab] = useState<'list' | 'add' | 'bulk' | 'review'>('list');

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
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [selectedDocTypeId, setSelectedDocTypeId] = useState('');
  const [selectedCertTypeId, setSelectedCertTypeId] = useState('');
  const [docRequirement, setDocRequirement] = useState('');
  const [certRequirement, setCertRequirement] = useState('');
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
  const [filterSearch, setFilterSearch] = useState('');
  const [filterMinTenth, setFilterMinTenth] = useState('');
  const [filterMinInter, setFilterMinInter] = useState('');
  const [filterMinBtechCgpa, setFilterMinBtechCgpa] = useState('');
  const [filterMaxBacklogs, setFilterMaxBacklogs] = useState('');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState<Record<string, string>>({});

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    description: '',
    type: 'OTHER',
    link: '',
  });

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

  const groupedDocuments = useMemo(() => {
    return documents.reduce((acc, doc) => {
      const req = doc.requirement || 'General';
      if (!acc[req]) acc[req] = [];
      acc[req].push(doc);
      return acc;
    }, {} as Record<string, StudentDocument[]>);
  }, [documents]);

  const groupedCertifications = useMemo(() => {
    return certifications.reduce((acc, cert) => {
      const req = cert.requirement || 'General';
      if (!acc[req]) acc[req] = [];
      acc[req].push(cert);
      return acc;
    }, {} as Record<string, Certification[]>);
  }, [certifications]);

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
    if (!user || user.role !== 'STUDENT') return;
    setLoading(true);
    try {
      const [myProfile, allDocTypes, allCertTypes, myDocs, myCerts, allAnnouncements] = await Promise.all([
        api.getMyProfile(activeToken),
        api.getDocumentTypes(activeToken),
        api.getCertificationTypes(activeToken),
        api.getMyDocuments(activeToken),
        api.getMyCertifications(activeToken),
        api.getAnnouncements(activeToken),
      ]);
      const docTypeData = allDocTypes as DocumentType[];
      const certTypeData = allCertTypes as DocumentType[];
      const profileData = myProfile as StudentProfile;
      setProfile(profileData);
      setDocTypes(docTypeData);
      setCertTypes(certTypeData);
      setDocuments(myDocs as StudentDocument[]);
      setCertifications(myCerts as Certification[]);
      setAnnouncements(allAnnouncements as any[]);
      setStudentAcademic({
        tenthMarks: String(profileData.tenthMarks ?? ''),
        tenthPercentage: String(profileData.tenthPercentage ?? ''),
        interMarks: String(profileData.interMarks ?? ''),
        interPercentage: String(profileData.interPercentage ?? ''),
        btechCgpa: String(profileData.btechCgpa ?? profileData.currentCgpa ?? ''),
        btechPercentage: String(profileData.btechPercentage ?? ''),
        backlogsCount: String(profileData.backlogsCount ?? ''),
      });
      if (!selectedDocTypeId && docTypeData.length) setSelectedDocTypeId(docTypeData[0].id);
      if (!selectedCertTypeId && certTypeData.length) setSelectedCertTypeId(certTypeData[0].id);
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAdminData(activeToken: string) {
    if (!user || user.role !== 'ADMIN') return;
    setLoading(true);
    try {
      const [allDocTypes, allCertTypes, allAnnouncements] = await Promise.all([
        api.getDocumentTypes(activeToken),
        api.getCertificationTypes(activeToken),
        api.getAnnouncements(activeToken),
      ]);
      setDocTypes(allDocTypes as DocumentType[]);
      setCertTypes(allCertTypes as DocumentType[]);
      setAnnouncements(allAnnouncements as any[]);
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAnnouncementsOnly() {
    if (!token) return;
    try {
      const data = await api.getAnnouncements(token);
      setAnnouncements(data as any[]);
    } catch (e) {
      setErrorMessage((e as Error).message);
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!token || !user || mustChangePassword) return;
    if (user.role === 'STUDENT') {
      loadStudentData(token);
    } else {
      loadAdminData(token);
    }
  }, [token, user?.role, mustChangePassword, studentView, adminView]);

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
    try {
      setErrorMessage('');
      const data = await api.changePassword(token, oldPassword, newPassword);
      setAuth(data);
      setGlobalMessage('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
    } catch (e) {
      setErrorMessage((e as Error).message);
    }
  }

  async function saveAcademicProfile() {
    if (!token) return;
    setLoading(true);
    setErrorMessage('');
    try {
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
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function uploadDocument() {
    if (!token || !docFile || !selectedDocTypeId) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('documentTypeId', selectedDocTypeId);
      if (docRequirement) formData.append('requirement', docRequirement);
      formData.append('visibility', docVisibility);
      formData.append('file', docFile);
      await api.uploadDocument(token, formData);
      setDocFile(null);
      setDocRequirement('');
      await loadStudentData(token);
      setGlobalMessage('Document uploaded.');
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function replaceDocument(document: StudentDocument) {
    if (!token || !replaceDocFile[document.id]) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('documentTypeId', document.documentType.id);
      formData.append('visibility', document.visibility);
      formData.append('file', replaceDocFile[document.id] as File);
      await api.replaceDocument(token, document.id, formData);
      setReplaceDocFile((p) => ({ ...p, [document.id]: null }));
      await loadStudentData(token);
      setGlobalMessage('Document replaced and moved to review.');
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteDocument(id: string) {
    if (!token || !window.confirm('Delete this document?')) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await api.deleteDocument(token, id);
      await loadStudentData(token);
      setGlobalMessage('Document deleted.');
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleDocVisibility(id: string, visibility: Visibility) {
    if (!token) return;
    setLoading(true);
    try {
      const next = visibility === 'SHARED' ? 'PRIVATE' : 'SHARED';
      await api.updateDocumentVisibility(token, id, next);
      await loadStudentData(token);
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function uploadCertification() {
    if (!token || !certFile || !certTitle || !certProvider) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const formData = new FormData();
      if (selectedCertTypeId) formData.append('certificationTypeId', selectedCertTypeId);
      if (certRequirement) formData.append('requirement', certRequirement);
      formData.append('title', certTitle);
      formData.append('provider', certProvider);
      formData.append('category', certCategory);
      formData.append('visibility', certVisibility);
      formData.append('file', certFile);
      await api.uploadCertification(token, formData);
      setCertFile(null);
      setCertRequirement('');
      setCertTitle('');
      setCertProvider('');
      setCertCategory('');
      await loadStudentData(token);
      setGlobalMessage('Certification uploaded.');
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function replaceCertification(cert: Certification) {
    if (!token || !replaceCertFile[cert.id]) return;
    setLoading(true);
    setErrorMessage('');
    try {
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
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCertification(id: string) {
    if (!token || !window.confirm('Delete this certification?')) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await api.deleteCertification(token, id);
      await loadStudentData(token);
      setGlobalMessage('Certification deleted.');
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCertVisibility(id: string, visibility: Visibility) {
    if (!token) return;
    setLoading(true);
    try {
      const next = visibility === 'SHARED' ? 'PRIVATE' : 'SHARED';
      await api.updateCertificationVisibility(token, id, next);
      await loadStudentData(token);
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function createDocumentRequirement() {
    if (!token || !newDocType.trim()) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await api.createDocumentType(token, { name: newDocType.trim(), isMandatory: true });
      setNewDocType('');
      if (user?.role === 'STUDENT') await loadStudentData(token);
      else await loadAdminData(token);
      setGlobalMessage('Document field created.');
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function createCertificationRequirement() {
    if (!token || !newCertType.trim()) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await api.createCertificationType(token, { name: newCertType.trim(), isMandatory: true });
      setNewCertType('');
      if (user?.role === 'STUDENT') await loadStudentData(token);
      else await loadAdminData(token);
      setGlobalMessage('Certification field created.');
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function runStudentFilters() {
    if (!token) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const params = new URLSearchParams();
      if (filterSearch) params.append('search', filterSearch);
      if (filterBatch) params.append('batch', filterBatch);
      if (filterBranch) params.append('branch', filterBranch);
      if (filterMinTenth) params.set('minTenth', filterMinTenth);
      if (filterMinInter) params.set('minInter', filterMinInter);
      if (filterMinBtechCgpa) params.set('minBtechCgpa', filterMinBtechCgpa);
      if (filterMaxBacklogs) params.set('maxBacklogs', filterMaxBacklogs);
      const data = (await api.getStudents(token, `?${params.toString()}`)) as StudentProfile[];
      setStudents(data);
      setSelectedStudent(null);
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function viewStudent(id: string) {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getStudentById(token, id);
      setSelectedStudent(data);
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function reviewDocument(id: string, status: 'APPROVED' | 'REJECTED') {
    if (!token) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await api.reviewDocument(token, id, { status, remarks: reviewRemarks[id] });
      if (selectedStudent) await viewStudent(selectedStudent.id);
      setGlobalMessage(`Document ${status.toLowerCase()} successfully.`);
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function reviewCertification(id: string, status: 'APPROVED' | 'REJECTED') {
    if (!token) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await api.reviewCertification(token, id, { status, remarks: reviewRemarks[id] });
      if (selectedStudent) await viewStudent(selectedStudent.id);
      setGlobalMessage(`Certification ${status.toLowerCase()} successfully.`);
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function createStudent() {
    if (!token) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await api.createStudent(token, {
        ...newStudent,
        batch: Number(newStudent.batch),
      });
      setGlobalMessage('Student created.');
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
      await runStudentFilters();
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function createBulkStudents() {
    if (!token || !bulkInput.trim()) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const studentsPayload = bulkInput
        .split('\n')
        .map((line) => line.trim())
        .filter((line, index) => {
          if (index === 0 && (line.toLowerCase().includes('roll') || line.toLowerCase().includes('full name'))) return false;
          return Boolean(line);
        })
        .map((line) => {
          const parts = line.split(',');
          const [rollNumber, fullName, batch, branch, section, email, phone, defaultPassword] = parts.map((p) => p?.trim());
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
      const result = await api.createStudentsBulk(token, studentsPayload);
      setGlobalMessage(`Bulk complete: ${(result as any).createdCount} created, ${(result as any).failedCount} failed.`);
      setBulkInput('');
      await runStudentFilters();
    } catch (e) {
      setErrorMessage(`Bulk failed: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteStudent(id: string) {
    if (!token || !window.confirm('Are you sure you want to delete this student and all their records?')) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await api.deleteStudent(token, id);
      setStudents((p) => p.filter((s) => s.id !== id));
      if (selectedStudent?.id === id) setSelectedStudent(null);
      setGlobalMessage('Student deleted successfully.');
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function updateStudent() {
    if (!token || !editingStudent) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await api.updateStudent(token, editingStudent.id, {
        fullName: editingStudent.fullName,
        email: editingStudent.email,
        phone: editingStudent.phone,
        batch: Number(editingStudent.batch),
        branch: editingStudent.branch,
        section: editingStudent.section,
      });
      setEditingStudent(null);
      await runStudentFilters();
      setGlobalMessage('Student updated successfully.');
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function createAnnouncement() {
    if (!token || !newAnnouncement.title) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await api.createAnnouncement(token, newAnnouncement);
      setNewAnnouncement({ title: '', description: '', type: 'OTHER', link: '' });
      setGlobalMessage('Announcement posted.');
      await loadAnnouncementsOnly();
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAnnouncement(id: string) {
    if (!token || !window.confirm('Delete this announcement?')) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await api.deleteAnnouncement(token, id);
      setAnnouncements((p) => p.filter((a) => a.id !== id));
      setGlobalMessage('Announcement deleted.');
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function exportFilteredStudents() {
    const baseUrl = window.location.origin;
    downloadCsv(
      'complete_student_details.csv',
      students.map((s) => ({
        rollNumber: s.rollNumber,
        fullName: s.fullName,
        email: s.email || 'N/A',
        phone: s.phone || 'N/A',
        batch: s.batch,
        branch: s.branch,
        section: s.section || 'N/A',
        tenthMarks: s.tenthMarks ?? 'N/A',
        tenthPercentage: s.tenthPercentage ?? 'N/A',
        interMarks: s.interMarks ?? 'N/A',
        interPercentage: s.interPercentage ?? 'N/A',
        btechCgpa: s.btechCgpa ?? s.currentCgpa ?? 'N/A',
        btechPercentage: s.btechPercentage ?? 'N/A',
        backlogsCount: s.backlogsCount ?? 0,
        certificatesCount: (s as any).certifications?.length || 0,
        documentsCount: (s as any).documents?.length || 0,
        certificates: (s as any).certifications?.map((c: any) => `${c.title} (${c.provider})`).join('; ') || 'None',
        certificateLinks: (s as any).certifications?.map((c: any) => `${baseUrl}${getFileUrl(c.filePath)}`).join(' ; ') || 'None',
        documents: (s as any).documents?.map((d: any) => d.documentType?.name).join('; ') || 'None',
        documentLinks: (s as any).documents?.map((d: any) => `${baseUrl}${getFileUrl(d.filePath)}`).join(' ; ') || 'None',
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
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="header"
      >
        <div>
          <h1>Certificates Management Portal</h1>
          <p className="muted">Digital Student Locker | Documents & Certifications</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '0.85rem' }}>
            <span className="badge badge-approved" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={12} /> {user.username}
            </span>
            <span className="badge secondary" style={{ textTransform: 'capitalize' }}>{user.role}</span>
          </div>
        </div>
        <button className="danger" onClick={logout}>
          <LogOut size={18} /> Logout
        </button>
      </motion.header>
      {globalMessage && (
        <motion.p 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="message"
          style={{ marginBottom: '20px' }}
        >
          <Check size={18} /> {globalMessage}
        </motion.p>
      )}

      {errorMessage && (
        <motion.p 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="message danger"
          style={{ marginBottom: '20px', background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}
        >
          <X size={18} /> {errorMessage}
        </motion.p>
      )}

      {mustChangePassword && (
        <div className="auth-page">
          <motion.section 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card auth-card"
          >
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={20} /> Password Change Required</h3>
            <p className="muted" style={{ fontSize: '0.85rem', margin: '15px 0' }}>
              For security, please change your password before proceeding.
              <br />• Min 8 characters
              <br />• Uppercase & lowercase
              <br />• Number or special char
            </p>
            <div className="stack">
              <Field label="Current Password" icon={Shield}><input type="password" placeholder="••••••••" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} /></Field>
              <Field label="New Password" icon={Plus}><input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></Field>
              <button onClick={changePasswordFirstTime} style={{ marginTop: '10px' }}><Check size={18} /> Update & Continue</button>
            </div>
          </motion.section>
        </div>
      )}

      {!mustChangePassword && user.role === 'STUDENT' && (
        <>
          <nav className="card section-nav">
            <button className={studentView === 'dashboard' ? 'active' : ''} onClick={() => setStudentView('dashboard')}>Dashboard</button>
            <button className={studentView === 'documents' ? 'active' : ''} onClick={() => setStudentView('documents')}>Mandatory Documents</button>
            <button className={studentView === 'certifications' ? 'active' : ''} onClick={() => setStudentView('certifications')}>Certifications</button>
            <button className={studentView === 'announcements' ? 'active' : ''} onClick={() => setStudentView('announcements')}>Updates & News</button>
            <button className={studentView === 'academic' ? 'active' : ''} onClick={() => setStudentView('academic')}>Academic Scores</button>
            <button className={studentView === 'settings' ? 'active' : ''} onClick={() => setStudentView('settings')}>Settings</button>
          </nav>
          <main className="grid">
            {studentView === 'dashboard' && (
              <motion.section 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="dashboard-grid"
              >
                <div className="card dashboard-card" onClick={() => setStudentView('documents')}>
                  <div className="icon-wrapper"><FileText /></div>
                  <h3>Mandatory Documents</h3>
                  <p>Uploaded {mandatorySummary.mandatory.length - mandatorySummary.missing.length}/{mandatorySummary.mandatory.length}</p>
                  <div className="progress-bar" style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', width: '100%', margin: '10px 0' }}>
                    <div style={{ height: '100%', background: 'var(--primary)', width: `${((mandatorySummary.mandatory.length - mandatorySummary.missing.length) / (mandatorySummary.mandatory.length || 1)) * 100}%` }}></div>
                  </div>
                  <button className="secondary">View Section <ChevronRight size={14} /></button>
                </div>
                <div className="card dashboard-card" onClick={() => setStudentView('certifications')}>
                  <div className="icon-wrapper"><Award /></div>
                  <h3>Certifications</h3>
                  <p>{certifications.length} certificates uploaded</p>
                  <p className="muted" style={{ fontSize: '0.8rem' }}>Internships, Courses, etc.</p>
                  <button className="secondary">View Section <ChevronRight size={14} /></button>
                </div>
                <div className="card dashboard-card" onClick={() => setStudentView('announcements')}>
                  <div className="icon-wrapper"><Bell /></div>
                  <h3>Updates & News</h3>
                  <p>{announcements.length} new updates available</p>
                  <button className="secondary">View Section <ChevronRight size={14} /></button>
                </div>
                <div className="card dashboard-card" onClick={() => setStudentView('academic')}>
                  <div className="icon-wrapper"><GraduationCap /></div>
                  <h3>Academic Scores</h3>
                  <p>Current CGPA: {profile?.currentCgpa || 'N/A'}</p>
                  <button className="secondary">View Section <ChevronRight size={14} /></button>
                </div>
              </motion.section>
            )}

            {studentView === 'documents' && (
              <motion.section 
                key="documents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Mandatory Documents</h3>
                  {loading && <p className="muted pulse">Refreshing...</p>}
                </div>
                
                <div className="stack" style={{ marginBottom: '30px', padding: '20px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: '#f8fafc' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Upload size={18} /> Upload New Document</h4>
                  <div className="grid cols-2">
                    <Field label="Document Type" icon={FileText}>
                      <select value={selectedDocTypeId} onChange={(e) => setSelectedDocTypeId(e.target.value)}>
                        {docTypes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Visibility" icon={docVisibility === 'SHARED' ? Eye : ShieldOff}>
                      <select value={docVisibility} onChange={(e) => setDocVisibility(e.target.value as Visibility)}>
                        <option value="SHARED">Shared (Admin can see)</option>
                        <option value="PRIVATE">Private (Only you)</option>
                      </select>
                    </Field>
                    <Field label="Custom Requirement (Optional)" icon={Filter}>
                      <input placeholder="e.g. TCS Recruitment 2024" value={docRequirement} onChange={(e) => setDocRequirement(e.target.value)} />
                    </Field>
                    <Field label="File" icon={Plus}>
                      <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
                    </Field>
                  </div>
                  <button onClick={uploadDocument} disabled={!docFile}><Upload size={18} /> Upload Document</button>
                </div>

                <h4>Your Uploads</h4>
                <div className="stack">
                  {Object.entries(groupedDocuments).length === 0 ? <p className="muted" style={{ textAlign: 'center', padding: '20px' }}>No documents uploaded yet.</p> : null}
                  {Object.entries(groupedDocuments).map(([req, docs]) => (
                    <div key={req} className="card" style={{ background: '#ffffff', boxShadow: 'none', border: '1px solid var(--border)' }}>
                      <h5 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '15px', color: 'var(--primary)' }}>{req}</h5>
                      <div className="stack">
                        {docs.map((d) => (
                          <div key={d.id} className="review-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={16} className="muted" />
                                <b>{d.documentType.name}</b>
                              </div>
                              <div className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                                {d.fileName} | Status: <span className={`badge badge-${d.status.toLowerCase()}`}>{d.status}</span>
                                {d.visibility === 'PRIVATE' && <span className="badge danger" style={{ marginLeft: '8px' }}><ShieldOff size={10} /> Private</span>}
                              </div>
                              {d.remarks && <p style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '4px' }}><b>Remark:</b> {d.remarks}</p>}
                            </div>
                            <div className="row-actions">
                              <a href={getFileUrl(d.filePath)} target="_blank" rel="noreferrer"><button className="secondary"><Eye size={14} /> View</button></a>
                              <button className={d.visibility === 'SHARED' ? 'secondary' : ''} onClick={() => toggleDocVisibility(d.id, d.visibility)}>
                                {d.visibility === 'SHARED' ? <Shield size={14} /> : <ShieldOff size={14} />} 
                                {d.visibility === 'SHARED' ? 'Make Private' : 'Make Shared'}
                              </button>
                              <button className="danger" onClick={() => deleteDocument(d.id)}><Trash2 size={14} /> Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {studentView === 'certifications' && (
              <motion.div 
                key="certifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="stack"
              >
                <section className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3>Upload New Certification</h3>
                    {loading && <p className="muted pulse">Refreshing...</p>}
                  </div>
                  <div className="grid cols-2">
                    <Field label="Requirement Field" icon={Award}>
                      <select value={selectedCertTypeId} onChange={(e) => setSelectedCertTypeId(e.target.value)}>
                        <option value="">Select field</option>
                        {certTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Custom Requirement (Optional)" icon={Filter}>
                      <input placeholder="e.g. Google Internship" value={certRequirement} onChange={(e) => setCertRequirement(e.target.value)} />
                    </Field>
                    <Field label="Title" icon={FileText}>
                      <input placeholder="Title" value={certTitle} onChange={(e) => setCertTitle(e.target.value)} />
                    </Field>
                    <Field label="Provider" icon={Users}>
                      <input placeholder="Provider" value={certProvider} onChange={(e) => setCertProvider(e.target.value)} />
                    </Field>
                    <Field label="Category" icon={Filter}>
                      <input placeholder="Internship/Course/etc" value={certCategory} onChange={(e) => setCertCategory(e.target.value)} />
                    </Field>
                    <Field label="Visibility" icon={certVisibility === 'SHARED' ? Eye : ShieldOff}>
                      <select value={certVisibility} onChange={(e) => setCertVisibility(e.target.value as Visibility)}>
                        <option value="SHARED">Shared</option>
                        <option value="PRIVATE">Private</option>
                      </select>
                    </Field>
                    <Field label="File" icon={Plus}>
                      <input type="file" onChange={(e) => setCertFile(e.target.files?.[0] || null)} />
                    </Field>
                  </div>
                  <button onClick={uploadCertification} style={{ marginTop: '20px' }} disabled={!certFile || !certTitle || !certProvider}><Upload size={18} /> Upload Certification</button>
                </section>

                <section className="card">
                  <h3>Uploaded Certifications</h3>
                  {Object.entries(groupedCertifications).length === 0 ? <p className="muted" style={{ textAlign: 'center', padding: '20px' }}>No certifications uploaded yet.</p> : null}
                  {Object.entries(groupedCertifications).map(([req, certs]) => (
                    <div key={req} style={{ marginBottom: '20px' }}>
                      <h5 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '15px', color: 'var(--primary)' }}>{req}</h5>
                      <div className="stack">
                        {certs.map((c) => (
                          <div key={c.id} className="review-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Award size={16} className="muted" />
                                <b>{c.title}</b>
                              </div>
                              <div className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                                {c.provider} | Field: {c.certificationType?.name || 'General'} | Status: <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                                {c.visibility === 'PRIVATE' && <span className="badge danger" style={{ marginLeft: '8px' }}><ShieldOff size={10} /> Private</span>}
                              </div>
                            </div>
                            <div className="row-actions">
                              <a href={getFileUrl(c.filePath)} target="_blank" rel="noreferrer"><button className="secondary"><Eye size={14} /> View</button></a>
                              <button className={c.visibility === 'SHARED' ? 'secondary' : ''} onClick={() => toggleCertVisibility(c.id, c.visibility)}>
                                {c.visibility === 'SHARED' ? <Shield size={14} /> : <ShieldOff size={14} />} 
                                {c.visibility === 'SHARED' ? 'Make Private' : 'Make Shared'}
                              </button>
                              <button className="danger" onClick={() => deleteCertification(c.id)}><Trash2 size={14} /> Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              </motion.div>
            )}

            {studentView === 'announcements' && (
              <motion.section 
                key="announcements"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Internships, Workshops & Updates</h3>
                  {loading && <p className="muted pulse">Refreshing...</p>}
                </div>
                {selectedAnnouncement ? (
                  <div className="card" style={{ borderLeft: '4px solid var(--primary)', marginBottom: '20px', background: '#f8fafc' }}>
                    <button className="secondary" style={{ marginBottom: '20px' }} onClick={() => setSelectedAnnouncement(null)}>← Back to all updates</button>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <span className="badge badge-approved">{selectedAnnouncement.type}</span>
                      <span className="muted" style={{ fontSize: '0.85rem' }}>Posted on {new Date(selectedAnnouncement.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h2>{selectedAnnouncement.title}</h2>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: '20px 0' }}>{selectedAnnouncement.description}</p>
                    {selectedAnnouncement.link && (
                      <a href={selectedAnnouncement.link} target="_blank" rel="noreferrer">
                        <button style={{ padding: '12px 24px' }}>Apply / View Details <ChevronRight size={16} /></button>
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="stack">
                    {announcements.length === 0 ? <p className="muted" style={{ textAlign: 'center', padding: '40px' }}>No updates available at the moment.</p> : null}
                    {announcements.map((a) => (
                      <div key={a.id} className="review-item announcement-card" onClick={() => setSelectedAnnouncement(a)} style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <span className="badge badge-approved">{a.type}</span>
                            <h4 style={{ margin: '12px 0 8px 0' }}>{a.title}</h4>
                            <p className="muted" style={{ margin: 0, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {a.description}
                            </p>
                          </div>
                          <ChevronRight size={20} className="muted" style={{ marginLeft: '15px', alignSelf: 'center' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {studentView === 'academic' && (
              <motion.section 
                key="academic"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Academic Scores</h3>
                  {loading && <p className="muted pulse">Saving...</p>}
                </div>
                {profile && <p className="muted" style={{ marginBottom: '20px' }}><User size={14} /> {profile.rollNumber} - {profile.fullName}</p>}
                <div className="grid cols-2">
                  <Field label="10th Marks" icon={GraduationCap}><input value={studentAcademic.tenthMarks} onChange={(e) => setStudentAcademic((p) => ({ ...p, tenthMarks: e.target.value }))} /></Field>
                  <Field label="10th %" icon={GraduationCap}><input value={studentAcademic.tenthPercentage} onChange={(e) => setStudentAcademic((p) => ({ ...p, tenthPercentage: e.target.value }))} /></Field>
                  <Field label="Inter Marks" icon={GraduationCap}><input value={studentAcademic.interMarks} onChange={(e) => setStudentAcademic((p) => ({ ...p, interMarks: e.target.value }))} /></Field>
                  <Field label="Inter %" icon={GraduationCap}><input value={studentAcademic.interPercentage} onChange={(e) => setStudentAcademic((p) => ({ ...p, interPercentage: e.target.value }))} /></Field>
                  <Field label="B.Tech CGPA" icon={GraduationCap}><input value={studentAcademic.btechCgpa} onChange={(e) => setStudentAcademic((p) => ({ ...p, btechCgpa: e.target.value }))} /></Field>
                  <Field label="B.Tech %" icon={GraduationCap}><input value={studentAcademic.btechPercentage} onChange={(e) => setStudentAcademic((p) => ({ ...p, btechPercentage: e.target.value }))} /></Field>
                  <Field label="Backlogs" icon={AlertCircle}><input value={studentAcademic.backlogsCount} onChange={(e) => setStudentAcademic((p) => ({ ...p, backlogsCount: e.target.value }))} /></Field>
                </div>
                <button onClick={saveAcademicProfile} style={{ marginTop: '20px', width: '100%' }}><Check size={18} /> Save Academic Details</button>
              </motion.section>
            )}

            {studentView === 'settings' && (
              <motion.section 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="stack"
              >
                <section className="card">
                  <h3>Account Settings</h3>
                  <div className="stack" style={{ marginTop: '20px' }}>
                    <h4>Change Password</h4>
                    <p className="muted" style={{ fontSize: '0.85rem' }}>
                      Password must be at least 8 characters long and contain uppercase, lowercase, and a number/special char.
                    </p>
                    <div className="grid cols-2">
                      <Field label="Current Password" icon={Shield}><input type="password" placeholder="••••••••" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} /></Field>
                      <Field label="New Password" icon={Plus}><input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></Field>
                    </div>
                    <button onClick={changePasswordFirstTime} style={{ width: 'fit-content' }}>Update Password</button>
                  </div>
                </section>

                <section className="card">
                  <h3>Profile Information</h3>
                  {profile && (
                    <div className="grid cols-2" style={{ marginTop: '20px' }}>
                      <Field label="Full Name" icon={User}><input value={profile.fullName} readOnly /></Field>
                      <Field label="Roll Number" icon={FileText}><input value={profile.rollNumber} readOnly /></Field>
                      <Field label="Email" icon={Mail}><input value={profile.email || ''} readOnly /></Field>
                      <Field label="Phone" icon={Phone}><input value={profile.phone || ''} readOnly /></Field>
                    </div>
                  )}
                </section>
              </motion.section>
            )}
          </main>
        </>
      )}

      {user.role === 'ADMIN' && (
        <>
          <nav className="card section-nav">
            <button className={adminView === 'dashboard' ? 'active' : ''} onClick={() => setAdminView('dashboard')}>
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button className={adminView === 'students' ? 'active' : ''} onClick={() => setAdminView('students')}>
              <Users size={18} /> Manage Students
            </button>
            <button className={adminView === 'requirements' ? 'active' : ''} onClick={() => setAdminView('requirements')}>
              <FilePlus size={18} /> Requirement Fields
            </button>
            <button className={adminView === 'announcements' ? 'active' : ''} onClick={() => setAdminView('announcements')}>
              <Bell size={18} /> Post Updates
            </button>
            <button className={adminView === 'settings' ? 'active' : ''} onClick={() => setAdminView('settings')}>
              <Settings size={18} /> Settings
            </button>
          </nav>
          <main className="grid">
            <AnimatePresence mode="wait">
              {adminView === 'dashboard' && (
                <motion.section 
                  key="admin-dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="dashboard-grid"
                >
                  <div className="card dashboard-card" onClick={() => setAdminView('students')}>
                    <div className="icon-wrapper"><Users /></div>
                    <h3>Manage Students</h3>
                    <p>View, filter, edit & delete students</p>
                    <button className="secondary">View Section <ChevronRight size={14} /></button>
                  </div>
                  <div className="card dashboard-card" onClick={() => setAdminView('requirements')}>
                    <div className="icon-wrapper"><FilePlus /></div>
                    <h3>Requirement Fields</h3>
                    <p>Create document/certification fields</p>
                    <button className="secondary">View Section <ChevronRight size={14} /></button>
                  </div>
                  <div className="card dashboard-card" onClick={() => setAdminView('announcements')}>
                    <div className="icon-wrapper"><Bell /></div>
                    <h3>Post Updates</h3>
                    <p>Post internships & workshops</p>
                    <button className="secondary">View Section <ChevronRight size={14} /></button>
                  </div>
                </motion.section>
              )}

            {adminView === 'requirements' && (
              <motion.section 
                key="requirements"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Create Requirement Fields</h3>
                  {loading && <p className="muted pulse">Processing...</p>}
                </div>
                <div className="stack">
                  <div className="grid cols-2">
                    <Field label="New Document Field" icon={FilePlus}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input style={{ flex: 1 }} placeholder="e.g. 10th Memo" value={newDocType} onChange={(e) => setNewDocType(e.target.value)} />
                        <button onClick={createDocumentRequirement}><Plus size={16} /> Add</button>
                      </div>
                    </Field>
                    <Field label="New Certification Field" icon={Award}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input style={{ flex: 1 }} placeholder="e.g. Python Course" value={newCertType} onChange={(e) => setNewCertType(e.target.value)} />
                        <button onClick={createCertificationRequirement}><Plus size={16} /> Add</button>
                      </div>
                    </Field>
                  </div>
                </div>
                
                <div className="grid cols-2" style={{ marginTop: '30px' }}>
                  <div className="card" style={{ background: '#f8fafc', boxShadow: 'none', border: '1px solid var(--border)' }}>
                    <h4>Active Document Types</h4>
                    <div className="stack" style={{ marginTop: '15px' }}>
                      {docTypes.map(dt => (
                        <div key={dt.id} className="badge secondary" style={{ justifyContent: 'space-between', padding: '8px 12px' }}>
                          {dt.name} {dt.isMandatory && <span className="badge badge-approved" style={{ fontSize: '0.6rem' }}>Mandatory</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card" style={{ background: '#f8fafc', boxShadow: 'none', border: '1px solid var(--border)' }}>
                    <h4>Active Certification Types</h4>
                    <div className="stack" style={{ marginTop: '15px' }}>
                      {certTypes.map(ct => (
                        <div key={ct.id} className="badge secondary" style={{ justifyContent: 'space-between', padding: '8px 12px' }}>
                          {ct.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {adminView === 'announcements' && (
              <motion.section 
                key="admin-announcements"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Post Internships, Workshops & Updates</h3>
                  {loading && <p className="muted pulse">Posting...</p>}
                </div>
                
                <div className="stack" style={{ marginBottom: '30px', padding: '20px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: '#f8fafc' }}>
                  <div className="grid cols-2">
                    <Field label="Title" icon={FileText}>
                      <input placeholder="Announcement title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement((p) => ({ ...p, title: e.target.value }))} />
                    </Field>
                    <Field label="Category" icon={Filter}>
                      <select value={newAnnouncement.type} onChange={(e) => setNewAnnouncement((p) => ({ ...p, type: e.target.value }))}>
                        <option value="INTERNSHIP">Internship</option>
                        <option value="WORKSHOP">Workshop</option>
                        <option value="TRAINING">Training</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="Description" icon={FileText}>
                    <textarea placeholder="Detailed description..." value={newAnnouncement.description} onChange={(e) => setNewAnnouncement((p) => ({ ...p, description: e.target.value }))} />
                  </Field>
                  <Field label="Link (Optional)" icon={Eye}>
                    <input placeholder="https://..." value={newAnnouncement.link} onChange={(e) => setNewAnnouncement((p) => ({ ...p, link: e.target.value }))} />
                  </Field>
                  <button onClick={createAnnouncement} disabled={!newAnnouncement.title}><Plus size={18} /> Post Announcement</button>
                </div>

                <h4>Recent Posts</h4>
                <div className="stack">
                  {announcements.length === 0 ? <p className="muted" style={{ textAlign: 'center', padding: '20px' }}>No announcements posted yet.</p> : null}
                  {announcements.map((a) => (
                    <div key={a.id} className="review-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="badge badge-approved" style={{ marginBottom: '4px' }}>{a.type}</span>
                        <h4 style={{ margin: 0 }}>{a.title}</h4>
                        <p className="muted" style={{ fontSize: '0.85rem' }}>{new Date(a.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button className="danger" onClick={() => deleteAnnouncement(a.id)}><Trash2 size={16} /> Delete</button>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {adminView === 'students' && (
              <motion.div 
                key="manage-students"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="stack"
              >
                <nav className="card section-nav sub-nav">
                  <button className={manageStudentsTab === 'list' ? 'active' : ''} onClick={() => setManageStudentsTab('list')}>
                    <Users size={18} /> Student List & Filters
                  </button>
                  <button className={manageStudentsTab === 'add' ? 'active' : ''} onClick={() => setManageStudentsTab('add')}>
                    <UserPlus size={18} /> Add New Student
                  </button>
                  <button className={manageStudentsTab === 'bulk' ? 'active' : ''} onClick={() => setManageStudentsTab('bulk')}>
                    <Upload size={18} /> Bulk Upload
                  </button>
                  <button className={manageStudentsTab === 'review' ? 'active' : ''} onClick={() => setManageStudentsTab('review')}>
                    <Eye size={18} /> Review Uploads
                  </button>
                </nav>

                <AnimatePresence mode="wait">
                  {manageStudentsTab === 'add' && (
                    <motion.section 
                      key="add-student"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>Create Single Student</h3>
                        <button className="secondary" onClick={() => setManageStudentsTab('list')}>Back to List</button>
                      </div>
                      <div className="grid cols-2">
                        <Field label="Roll Number" icon={FileText}><input placeholder="e.g. 21B91A0501" value={newStudent.rollNumber} onChange={(e) => setNewStudent((p) => ({ ...p, rollNumber: e.target.value }))} /></Field>
                        <Field label="Full Name" icon={User}><input placeholder="Full Name" value={newStudent.fullName} onChange={(e) => setNewStudent((p) => ({ ...p, fullName: e.target.value }))} /></Field>
                        <Field label="Batch" icon={Filter}><input placeholder="e.g. 2024" value={newStudent.batch} onChange={(e) => setNewStudent((p) => ({ ...p, batch: e.target.value }))} /></Field>
                        <Field label="Branch" icon={Filter}><input placeholder="e.g. CSE" value={newStudent.branch} onChange={(e) => setNewStudent((p) => ({ ...p, branch: e.target.value }))} /></Field>
                        <Field label="Section" icon={Filter}><input placeholder="e.g. A" value={newStudent.section} onChange={(e) => setNewStudent((p) => ({ ...p, section: e.target.value }))} /></Field>
                        <Field label="Email" icon={Mail}><input placeholder="Email" value={newStudent.email} onChange={(e) => setNewStudent((p) => ({ ...p, email: e.target.value }))} /></Field>
                        <Field label="Phone" icon={Phone}><input placeholder="Phone" value={newStudent.phone} onChange={(e) => setNewStudent((p) => ({ ...p, phone: e.target.value }))} /></Field>
                        <Field label="Default Password" icon={Shield}><input placeholder="Default Password" value={newStudent.defaultPassword} onChange={(e) => setNewStudent((p) => ({ ...p, defaultPassword: e.target.value }))} /></Field>
                      </div>
                      <button onClick={createStudent} style={{ marginTop: '20px', width: '100%' }}><Plus size={18} /> Create Student</button>
                    </motion.section>
                  )}

                  {manageStudentsTab === 'bulk' && (
                    <motion.section 
                      key="bulk-student"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>Bulk Student Creation</h3>
                        <button className="secondary" onClick={() => setManageStudentsTab('list')}>Back to List</button>
                      </div>
                      <p className="muted" style={{ marginBottom: '15px' }}>Format: roll,fullName,batch,branch,section,email,phone,password</p>
                      <textarea rows={8} value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} placeholder="Paste CSV data here..." />
                      <div className="row-actions" style={{ marginTop: '15px' }}>
                        <button onClick={createBulkStudents} style={{ flex: 2 }}><Upload size={18} /> Create Bulk Students</button>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <input type="file" accept=".csv" style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const text = await file.text();
                              setBulkInput(text);
                            }
                          }} />
                          <button className="secondary" style={{ width: '100%' }}><FilePlus size={18} /> Upload CSV</button>
                        </div>
                      </div>
                    </motion.section>
                  )}

                  {manageStudentsTab === 'list' && (
                    <motion.div 
                      key="student-list"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="stack"
                    >
                      <section className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Filter size={18} /> Filter Students</h3>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={exportFilteredStudents} style={{ background: '#059669' }}><Download size={18} /> Export All Details</button>
                          </div>
                        </div>
                        <div className="grid cols-3">
                          <Field label="Search" icon={Search}><input placeholder="Roll or Name" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} /></Field>
                          <Field label="Batch" icon={Filter}><input placeholder="e.g. 2024" value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} /></Field>
                          <Field label="Branch" icon={Filter}><input placeholder="e.g. CSE" value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} /></Field>
                          <Field label="Min 10th %" icon={GraduationCap}><input type="number" value={filterMinTenth} onChange={(e) => setFilterMinTenth(e.target.value)} /></Field>
                          <Field label="Min Inter %" icon={GraduationCap}><input type="number" value={filterMinInter} onChange={(e) => setFilterMinInter(e.target.value)} /></Field>
                          <Field label="Min B.Tech CGPA" icon={GraduationCap}><input type="number" step="0.01" value={filterMinBtechCgpa} onChange={(e) => setFilterMinBtechCgpa(e.target.value)} /></Field>
                          <Field label="Max Backlogs" icon={AlertCircle}><input type="number" value={filterMaxBacklogs} onChange={(e) => setFilterMaxBacklogs(e.target.value)} /></Field>
                        </div>
                        <button onClick={runStudentFilters} style={{ marginTop: '20px', width: '100%' }}><Search size={18} /> Apply Filters</button>
                      </section>

                      <section className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <h3>Student List ({students.length})</h3>
                        </div>
                        <div className="stack">
                          {students.length === 0 ? <p className="muted" style={{ textAlign: 'center', padding: '20px' }}>No students found. Try applying filters.</p> : null}
                          <div className="table-container">
                            <table>
                              <thead>
                                <tr>
                                  <th>Roll No</th>
                                  <th>Full Name</th>
                                  <th>Branch</th>
                                  <th>CGPA</th>
                                  <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {students.map((s) => (
                                  <tr key={s.id}>
                                    <td>{s.rollNumber}</td>
                                    <td><b>{s.fullName}</b></td>
                                    <td>{s.branch}</td>
                                    <td><span className="badge badge-approved">{s.btechCgpa || s.currentCgpa || 'N/A'}</span></td>
                                    <td style={{ textAlign: 'right' }}>
                                      <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                                        <button className="secondary" onClick={() => { viewStudent(s.id); setManageStudentsTab('review'); }}><Eye size={14} /> Review</button>
                                        <button className="warning" onClick={() => setEditingStudent(s)}><Edit size={14} /> Edit</button>
                                        <button className="danger" onClick={() => deleteStudent(s.id)}><Trash2 size={14} /></button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {manageStudentsTab === 'review' && (
                    <motion.section 
                      key="review-student"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>Admin Review</h3>
                        <button className="secondary" onClick={() => setManageStudentsTab('list')}>Back to List</button>
                      </div>
                      {!selectedStudent ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                          <p className="muted">No student selected for review.</p>
                          <button onClick={() => setManageStudentsTab('list')} style={{ marginTop: '15px' }}>Go to Student List</button>
                        </div>
                      ) : (
                        <div className="stack">
                          <div className="card" style={{ background: '#f8fafc', boxShadow: 'none', border: '1px solid var(--border)' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}><User size={18} /> Student Information</h4>
                            <div className="grid cols-3" style={{ fontSize: '0.9rem', marginTop: '15px' }}>
                              <div><span className="muted">Name:</span> <b>{selectedStudent.fullName}</b></div>
                              <div><span className="muted">Roll No:</span> <b>{selectedStudent.rollNumber}</b></div>
                              <div><span className="muted">Branch:</span> <b>{selectedStudent.branch}</b></div>
                              <div><span className="muted">Batch:</span> <b>{selectedStudent.batch}</b></div>
                              <div><span className="muted">CGPA:</span> <b className="badge badge-approved">{selectedStudent.btechCgpa || selectedStudent.currentCgpa || 'N/A'}</b></div>
                              <div><span className="muted">Backlogs:</span> <b className="badge danger">{selectedStudent.backlogsCount || 0}</b></div>
                            </div>
                          </div>

                          <div style={{ marginTop: '25px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18} /> Mandatory Documents</h4>
                            {selectedStudent.documents.length === 0 ? <p className="muted" style={{ padding: '15px' }}>No documents uploaded.</p> : (
                              <div className="stack" style={{ marginTop: '15px' }}>
                                {selectedStudent.documents.map((d: StudentDocument) => (
                                  <div key={d.id} className="review-item">
                                    <div className="review-info">
                                      <div style={{ flex: 1 }}>
                                        <b>{d.documentType.name}</b>
                                        <div className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                                          {d.fileName} | Status: <span className={`badge badge-${d.status.toLowerCase()}`}>{d.status}</span>
                                          {d.requirement && <span> | Req: {d.requirement}</span>}
                                        </div>
                                      </div>
                                      <a href={getFileUrl(d.filePath)} target="_blank" rel="noreferrer"><button className="secondary"><Eye size={14} /> View Document</button></a>
                                    </div>
                                    <div className="review-controls">
                                      <input 
                                        placeholder="Add evaluation remarks..." 
                                        style={{ flex: 1, background: '#ffffff' }} 
                                        value={reviewRemarks[d.id] || ''} 
                                        onChange={(e) => setReviewRemarks((p) => ({ ...p, [d.id]: e.target.value }))} 
                                      />
                                      <button className="success" onClick={() => reviewDocument(d.id, 'APPROVED')}><Check size={14} /> Approve</button>
                                      <button className="danger" onClick={() => reviewDocument(d.id, 'REJECTED')}><X size={14} /> Reject</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div style={{ marginTop: '25px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={18} /> Certifications</h4>
                            {selectedStudent.certifications.length === 0 ? <p className="muted" style={{ padding: '15px' }}>No certifications uploaded.</p> : (
                              <div className="stack" style={{ marginTop: '15px' }}>
                                {selectedStudent.certifications.map((c: Certification) => (
                                  <div key={c.id} className="review-item">
                                    <div className="review-info">
                                      <div style={{ flex: 1 }}>
                                        <b>{c.title}</b>
                                        <div className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                                          {c.provider} | Field: {c.certificationType?.name || 'General'} | Status: <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                                        </div>
                                      </div>
                                      <a href={getFileUrl(c.filePath)} target="_blank" rel="noreferrer"><button className="secondary"><Eye size={14} /> View Certificate</button></a>
                                    </div>
                                    <div className="review-controls">
                                      <input 
                                        placeholder="Add evaluation remarks..." 
                                        style={{ flex: 1, background: '#ffffff' }} 
                                        value={reviewRemarks[c.id] || ''} 
                                        onChange={(e) => setReviewRemarks((p) => ({ ...p, [c.id]: e.target.value }))} 
                                      />
                                      <button className="success" onClick={() => reviewCertification(c.id, 'APPROVED')}><Check size={14} /> Approve</button>
                                      <button className="danger" onClick={() => reviewCertification(c.id, 'REJECTED')}><X size={14} /> Reject</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.section>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {adminView === 'settings' && (
              <motion.section 
                key="admin-settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card"
              >
                <h3>Admin Settings</h3>
                <div className="stack" style={{ marginTop: '20px' }}>
                  <h4>Change Admin Password</h4>
                  <div className="grid cols-2">
                    <Field label="Current Password" icon={Shield}><input type="password" placeholder="••••••••" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} /></Field>
                    <Field label="New Password" icon={Plus}><input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></Field>
                  </div>
                  <button onClick={changePasswordFirstTime} style={{ width: 'fit-content' }}>Update Password</button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
          </main>
        </>
      )}
    </div>
  );
}
