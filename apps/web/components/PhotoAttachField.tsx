'use client';

import { INPUT, LABEL } from '@/lib/ui';

type Props = {
  label?: string;
  hint?: string;
  required?: boolean;
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
  files: File[];
  onChange: (files: File[]) => void;
  className?: string;
};

/**
 * Shared file picker for photo / PDF evidence.
 * Pair with `uploadPhotos()` from `@/lib/api` before POSTing photoUrls.
 */
export function PhotoAttachField({
  label = 'Photos / attachments',
  hint = 'Images or PDF · max 12MB each',
  required = false,
  multiple = true,
  maxFiles = 8,
  accept = 'image/*,application/pdf',
  files,
  onChange,
  className,
}: Props) {
  return (
    <div className={className}>
      <label className={LABEL}>
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        required={required && files.length === 0}
        className={INPUT}
        onChange={(e) => {
          const next = Array.from(e.target.files ?? []).slice(0, maxFiles);
          onChange(next);
        }}
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {files.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-slate-600">
          {files.map((f) => (
            <li key={`${f.name}-${f.size}`}>
              {f.name} ({Math.round(f.size / 1024)} KB)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
