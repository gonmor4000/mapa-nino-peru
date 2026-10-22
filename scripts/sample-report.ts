// Generates a sample report with plain Node, to check the Word output without a device:
//   npx tsx scripts/sample-report.ts [plan.png|plan.jpg] > /dev/null
// Writes sample-report.docx in the current folder.
import { readFileSync, writeFileSync } from 'node:fs';

import { renderReport, type LevelWithImage } from '../src/export/report';

const planPath = process.argv[2];
const plan = planPath ? { data: new Uint8Array(readFileSync(planPath)), type: planPath.endsWith('.png') ? 'png' : 'jpg' } as const : null;
const base = { project_id: 'demo', plan_file: plan ? 'plan' : null, plan_width: 1200, plan_height: 900 };

const levels: LevelWithImage[] = [
  { ...base, id: 'l1', name: 'RDC', position: 0, image: plan },
  { ...base, id: 'l2', name: 'R+1', position: 1, plan_file: null, image: null },
];

renderReport({
  project: {
    id: 'demo',
    name: '7-9 rue du Square Carpeaux',
    address: '7-9 rue du Square Carpeaux, 75018 Paris',
    file_number: '24R396',
    construction_year: '1910',
    lot_count: '32',
    building_type: 'ancien',
    report_mode: 'ancien',
    visit_dates: '12 mars 2025',
    created_at: '',
    updated_at: '',
  },
  actors: [
    { id: 'a1', project_id: 'demo', role: 'Syndic', name: 'M. Dupont', company: 'Cabinet Jourdain', contact: '' },
    { id: 'a2', project_id: 'demo', role: 'Architecte', name: 'Gonzalo Morales', company: '', contact: '' },
    { id: 'a3', project_id: 'demo', role: 'BET', name: 'Damien Barbier', company: 'POUGET Consultants', contact: '' },
  ],
  levels,
  generatedAt: new Date(),
}).then((bytes) => writeFileSync('sample-report.docx', bytes));
