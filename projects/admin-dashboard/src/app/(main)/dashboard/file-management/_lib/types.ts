export interface FileItem {
  name: string;
  path: string;
  relativeDir: string;
  size: string;
  modified: Date;
  type: 'json' | 'md';
}

export interface FileContent {
  path: string;
  content: string;
}
