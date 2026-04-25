export type Role = 'STUDENT' | 'ADMIN';

export type AuthUser = {
  id: string;
  username: string;
  role: Role;
  mustChangePass: boolean;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type ChangePasswordResponse = {
  message: string;
  accessToken: string;
  user: AuthUser;
};

export type StudentProfile = {
  id: string;
  rollNumber: string;
  fullName: string;
  email?: string;
  phone?: string;
  batch: number;
  branch: string;
  section?: string;
  tenthMarks?: number;
  tenthPercentage?: number;
  interMarks?: number;
  interPercentage?: number;
  btechCgpa?: number;
  currentCgpa?: number;
  btechPercentage?: number;
  backlogsCount?: number;
};

export type DocumentType = {
  id: string;
  name: string;
  isMandatory: boolean;
};

export type Visibility = 'SHARED' | 'PRIVATE';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type StudentDocument = {
  id: string;
  fileName: string;
  filePath: string;
  visibility: Visibility;
  status: ReviewStatus;
  remarks?: string | null;
  requirement?: string | null;
  uploadedAt: string;
  documentType: DocumentType;
};

export type Certification = {
  id: string;
  certificationTypeId?: string;
  certificationType?: DocumentType;
  title: string;
  provider: string;
  category?: string;
  filePath: string;
  visibility: Visibility;
  status: ReviewStatus;
  remarks?: string | null;
  requirement?: string | null;
  createdAt: string;
};

export type BulkCreateResult = {
  total: number;
  createdCount: number;
  failedCount: number;
  failed: Array<{ rollNumber: string; reason: string }>;
};