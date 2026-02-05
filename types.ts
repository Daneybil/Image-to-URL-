
export interface UploadedImage {
  id: string;
  dataUrl: string;
  name: string;
  timestamp: number;
  aiDescription?: string;
  size: number;
}

export interface ShareData {
  v: string; // version
  d: string; // dataUrl
  n: string; // name
  a?: string; // aiDescription
}
