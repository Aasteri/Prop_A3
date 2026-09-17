import * as fs from 'fs';
import * as path from 'path';
import { Injectable, NotFoundException } from '@nestjs/common';
import { buildFilledMarkdownPdf } from './legal-template.pdf';

export const LEGAL_TEMPLATE_KEYS = [
  'TENANCY_AGREEMENT',
  'FM_LANDLORD_AGREEMENT',
  'FITNESS_CERTIFICATE',
  'MAINTENANCE_PAYOR_MATRIX',
  'REMITTANCE_STATEMENT',
  'JV_SUBMISSION',
  'COMMISSION_ARRANGEMENT',
  'TENANT_EVALUATION_SCORES',
  'LANDLORD_REMITTANCE',
] as const;

export type LegalTemplateKey = (typeof LEGAL_TEMPLATE_KEYS)[number];

export type TenancyAgreementFill = {
  landlord: string;
  tenant: string;
  property: string;
  rent: string;
  start: string;
  end: string;
  caution: string;
};

@Injectable()
export class LegalTemplatesService {
  private resolveRoot(): string {
    const candidates = [
      path.join(process.cwd(), 'planning', 'templates', 'provisional'),
      path.join(process.cwd(), '..', '..', 'planning', 'templates', 'provisional'),
      path.join(process.cwd(), '..', 'planning', 'templates', 'provisional'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return candidates[0];
  }

  list() {
    const root = this.resolveRoot();
    return LEGAL_TEMPLATE_KEYS.map((key) => {
      const file = path.join(root, `${key}.md`);
      return {
        key,
        filename: `${key}.md`,
        available: fs.existsSync(file),
        title: key.replace(/_/g, ' '),
      };
    });
  }

  getMarkdown(key: string): { key: string; markdown: string } {
    const normalised = key.toUpperCase().replace(/\.MD$/i, '');
    if (!(LEGAL_TEMPLATE_KEYS as readonly string[]).includes(normalised)) {
      throw new NotFoundException(`Unknown legal template: ${key}`);
    }
    const file = path.join(this.resolveRoot(), `${normalised}.md`);
    if (!fs.existsSync(file)) {
      throw new NotFoundException(`Template file missing: ${normalised}.md`);
    }
    return { key: normalised, markdown: fs.readFileSync(file, 'utf8') };
  }

  fillPlaceholders(markdown: string, values: Record<string, string>): string {
    return markdown.replace(/\{\{(\w+)\}\}/g, (_, name: string) => values[name] ?? `{{${name}}}`);
  }

  async buildTenancyAgreementPdf(fill: TenancyAgreementFill): Promise<Buffer> {
    const { markdown } = this.getMarkdown('TENANCY_AGREEMENT');
    const filled = this.fillPlaceholders(markdown, fill);
    return buildFilledMarkdownPdf({
      title: 'Tenancy Agreement',
      subtitle: 'Triple A Realty Projects Ltd — production default',
      body: filled,
    });
  }
}
