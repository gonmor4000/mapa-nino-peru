// Builds the DTG Word report. This module has no React Native imports so it can
// be run and checked with plain Node (see scripts/sample-report.ts).
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

import { REPORT_MODES, type Actor, type Level, type Project } from '@/model/types';

export type LevelWithImage = Level & {
  image: { data: Uint8Array; type: 'jpg' | 'png' } | null;
};

export type ReportInput = {
  project: Project;
  actors: Actor[];
  levels: LevelWithImage[];
  generatedAt: Date;
};

const ACCENT = '1F4E79';
const MUTED = '666666';
const TODO = 'B26B00';
// A4 portrait text width at default margins, in pixels as docx expects for images.
const MAX_IMAGE_WIDTH = 600;
const MAX_IMAGE_HEIGHT = 780;

const text = (value: string, fallback = '—') => (value.trim() ? value : fallback);

function heading(label: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) {
  // Each part starts on a new page; a trailing page-break paragraph could leave a blank page.
  return new Paragraph({
    text: label,
    heading: level,
    pageBreakBefore: level === HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
  });
}

function body(value: string) {
  return new Paragraph({ children: [new TextRun(value)], spacing: { after: 120 } });
}

/** A visible note for sections that the app does not fill yet. */
function toComplete(what: string) {
  return new Paragraph({
    children: [new TextRun({ text: `À compléter : ${what}`, italics: true, color: TODO })],
    spacing: { after: 160 },
  });
}

function cell(value: string, header = false) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: value, bold: header, color: header ? 'FFFFFF' : undefined })],
      }),
    ],
    shading: header ? { type: ShadingType.CLEAR, fill: ACCENT, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

function table(rows: string[][], headerRow = true) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (r, i) => new TableRow({ children: r.map((v) => cell(v, headerRow && i === 0)), tableHeader: headerRow && i === 0 }),
    ),
  });
}

function fitImage(width: number, height: number) {
  const scale = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height, 1);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function formatDate(d: Date) {
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
}

function coverPage(input: ReportInput) {
  const { project, actors } = input;
  const syndic = actors.find((a) => a.role === 'Syndic');
  const authors = actors.filter((a) => a.role === 'Architecte' || a.role === 'BET' || a.role === 'Ingénieur thermicien');
  const centered = (runs: TextRun[], after = 200) =>
    new Paragraph({ children: runs, alignment: AlignmentType.CENTER, spacing: { after } });

  return [
    centered([new TextRun({ text: 'DIAGNOSTIC TECHNIQUE GLOBAL DE COPROPRIÉTÉ', bold: true, size: 36, color: ACCENT })], 400),
    centered([new TextRun({ text: text(project.name, 'Copropriété'), bold: true, size: 30 })]),
    centered([new TextRun({ text: text(project.address, ''), size: 26 })]),
    centered([new TextRun({ text: `RAPPORT — ${formatDate(input.generatedAt)}`, size: 24, color: MUTED })], 600),
    centered([new TextRun({ text: 'MAÎTRISE D’OUVRAGE', bold: true })], 80),
    centered([new TextRun('Syndicat des copropriétaires représenté par son syndic :')], 80),
    centered([new TextRun({ text: syndic ? text(syndic.company || syndic.name) : '—', bold: true })], 300),
    centered([new TextRun(`N° dossier : ${text(project.file_number)}`)], 300),
    centered([new TextRun({ text: 'RAPPORT rédigé par :', bold: true })], 80),
    ...authors.map((a) => centered([new TextRun(`${a.role} : ${text(a.name)}${a.company ? ` — ${a.company}` : ''}`)], 60)),
  ];
}

function partOne(input: ReportInput) {
  const { project, actors } = input;
  const mode = REPORT_MODES.find((m) => m.value === project.report_mode)?.label ?? project.report_mode;
  return [
    heading('PARTIE 1. PRÉSENTATION GÉNÉRALE ET ANALYSE DE LA GESTION TECHNIQUE', HeadingLevel.HEADING_1),
    heading('1. Situation et caractéristiques générales', HeadingLevel.HEADING_2),
    table(
      [
        ['Donnée', 'Valeur'],
        ['Adresse', text(project.address)],
        ['N° dossier', text(project.file_number)],
        ['Année de construction', text(project.construction_year)],
        ['Nombre de lots', text(project.lot_count)],
        ['Type de bâtiment', project.building_type === 'ancien' ? 'Ancien' : 'Moderne'],
        ['Version du rapport', mode],
      ],
      true,
    ),
    heading('2. Intervenants', HeadingLevel.HEADING_2),
    actors.length
      ? table([['Rôle', 'Nom', 'Société', 'Contact'], ...actors.map((a) => [a.role, text(a.name), text(a.company), text(a.contact)])])
      : toComplete('liste des intervenants'),
    heading('3. Situation de la gestion technique par rapport aux obligations légales', HeadingLevel.HEADING_2),
    toComplete('obligations légales (syndic)'),
    heading('4. Analyse des données financières', HeadingLevel.HEADING_2),
    toComplete('données financières (syndic)'),
    heading('5. Analyse succincte du règlement de copropriété', HeadingLevel.HEADING_2),
    toComplete('analyse du règlement de copropriété'),
  ];
}

function partTwo(input: ReportInput) {
  const { project, actors, levels } = input;
  const plans = levels.flatMap((level) => {
    const out: (Paragraph | Table)[] = [heading(`Plan de repérage — ${level.name}`, HeadingLevel.HEADING_3)];
    if (level.image && level.plan_width && level.plan_height) {
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: level.image.type,
              data: level.image.data,
              transformation: fitImage(level.plan_width, level.plan_height),
            }),
          ],
        }),
      );
    } else {
      out.push(toComplete(`plan du niveau ${level.name}`));
    }
    return out;
  });

  return [
    heading('PARTIE 2. DIAGNOSTICS ARCHITECTURAL ET ÉNERGÉTIQUE', HeadingLevel.HEADING_1),
    heading('1. Introduction', HeadingLevel.HEADING_2),
    body(`Date(s) de visite : ${text(project.visit_dates)}`),
    body('Personnes présentes :'),
    ...(actors.length
      ? actors.map((a) => new Paragraph({ text: `${a.role} : ${text(a.name)}`, bullet: { level: 0 } }))
      : [toComplete('personnes présentes lors de la visite')]),
    heading('2. Résultats de l’enquête', HeadingLevel.HEADING_2),
    toComplete('restitution de l’enquête occupants'),
    heading('3. État des lieux technique et architectural', HeadingLevel.HEADING_2),
    ...plans,
    toComplete('fiches de diagnostic par poste (prochaine étape de l’application)'),
    heading('4. Analyse énergétique', HeadingLevel.HEADING_2),
    toComplete('analyse énergétique (ingénieur)'),
  ];
}

function remainingParts() {
  return [
    heading('PARTIE 3. PLANIFICATION DES TRAVAUX', HeadingLevel.HEADING_1),
    heading('1. Projet de Plan Pluriannuel de Travaux (PPT)', HeadingLevel.HEADING_2),
    toComplete('tableau du projet de PPT (prochaine étape de l’application)'),
    heading('2. Scénarii de travaux', HeadingLevel.HEADING_2),
    toComplete('au moins 2 scénarii de travaux (ingénieur)'),
    heading('PARTIE 4. VOLET FINANCIER', HeadingLevel.HEADING_1),
    toComplete('plans de financement sommaires (ingénieur)'),
    heading('PARTIE 5. ANNEXES', HeadingLevel.HEADING_1),
    toComplete('annexes'),
  ];
}

export function buildReport(input: ReportInput) {
  return new Document({
    creator: 'DTG simple',
    title: `DTG — ${input.project.name}`,
    features: { updateFields: true },
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', run: { size: 30, bold: true, color: ACCENT } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', run: { size: 26, bold: true, color: ACCENT } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', run: { size: 22, bold: true } },
      ],
    },
    sections: [
      {
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 4 } },
                children: [
                  new TextRun({ text: `DTG ${input.project.address || input.project.name} — page `, color: MUTED, size: 18 }),
                  new TextRun({ children: [PageNumber.CURRENT], color: MUTED, size: 18 }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...coverPage(input),
          new Paragraph({
            children: [new TextRun({ text: 'Sommaire', bold: true, size: 30, color: ACCENT })],
            pageBreakBefore: true,
            spacing: { after: 200 },
          }),
          new TableOfContents('Sommaire', { hyperlink: true, headingStyleRange: '1-2' }),
                ...partOne(input),
          ...partTwo(input),
          ...remainingParts(),
        ],
      },
    ],
  });
}

export async function renderReport(input: ReportInput): Promise<Uint8Array> {
  const buffer = await Packer.toArrayBuffer(buildReport(input));
  return new Uint8Array(buffer);
}
