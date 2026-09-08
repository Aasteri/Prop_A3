import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const planning = path.join(__dirname, '..');
const ext = (f) => fs.readFileSync(path.join(planning, 'extractions', f), 'utf8');
const guzapeTasks = fs.readFileSync(path.join(planning, 'extractions/GUZAPE_LUXURY_DUPLEX_WORK_SCHEDULE_FULL.md'), 'utf8')
  .replace(/^# Guzape Luxury Duplex — Full Work Schedule\n\n\*\*Source:\*\*[^\n]+\n\n/, '');

const body = fs.readFileSync(path.join(planning, 'scripts/master-spec-body.md'), 'utf8');
const doc = body.replace('{{GUZAPE_TASKS}}', guzapeTasks);

fs.writeFileSync(path.join(planning, 'ABRAHAM_MASTER_SYSTEM_SPEC.md'), doc);
console.log('Written', doc.split('\n').length, 'lines,', doc.length, 'chars');
