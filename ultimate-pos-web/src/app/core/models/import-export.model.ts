export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

export interface ExportConfig {
  type: 'products' | 'contacts';
  label: string;
  icon: string;
  description: string;
}
