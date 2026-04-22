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

export type StudentProfile = {
  id: string;
  rollNumber: string;
  fullName: string;
  email?: string;
  phone?: string;
  batch: number;
  branch: string;
  section?: string;
  tenthPercentage?: number;
  interPercentage?: number;
  currentCgpa?: number;
  backlogsCount?: number;
};

export type DocumentType = {
  id: string;
  name: string;
  isMandatory: boolean;
};

export type Visibility = 'SHARED' | 'PRIVATE';

export type StudentDocument = {
  id: string;
  fileName: string;
  filePath: string;
  visibility: Visibility;
  uploadedAt: string;
  documentType: DocumentType;
};

export type Certification = {
  id: string;
  title: string;
  provider: string;
  category?: string;
  visibility: Visibility;
  createdAt: string;
};
