/**
 * Script unificado para extrair objetos Genexus do arquivo COPEL.xml
 * Executa uma vez e extrai: procedimentos + telas + WorkWithPlus + transações + domínios + atributos + subtipos + sdts + designSystem
 * Saída: pasta Genexus/
 *   - procedimentos/   (fullyQualifiedName.gx)
 *   - telas/          (telas + WorkWithPlus - baseNameWorkWithPlus.xml para ordenar junto)
 *   - transacoes/     (fullyQualifiedName.xml)
 *   - dominios/       (fullyQualifiedName.xml)
 *   - atributos/      (fullyQualifiedName.xml)
 *   - subtipos/       (fullyQualifiedName.xml)
 *   - sdts/           (fullyQualifiedName.xml)
 *   - designSystem/   (fullyQualifiedName.xml)
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
require('dotenv').config();

const INPUT_XML = 'ERP.xpz';
const INPUT_FILE = path.join(__dirname, '..', INPUT_XML);
const BASE_OUTPUT_DIR = path.join(__dirname, '..', 'Genexus');

const EXTRACTORS = [
  {
    name: 'procedimentos',
    type: '84a12160-f59b-4ad7-a683-ea4481ac23e9',
    extension: '.xml',
  },
  {
    name: 'telas',
    type: 'c9584656-94b6-4ccd-890f-332d11fc2c25',
    extension: '.xml',
  },
  {
    name: 'WorkWithPlus',
    type: '07135890-56fc-489b-b408-063722fa9f7d',
    extension: '.xml',
    outputFolder: 'telas',
    transformName: (fqn) => {
      if (fqn.startsWith('WorkWithPlus')) {
        const base = fqn.slice('WorkWithPlus'.length);
        return base + 'WorkWithPlus';
      }
      return fqn;
    },
  },
  {
    name: 'transacoes',
    type: '1db606f2-af09-4cf9-a3b5-b481519d28f6',
    extension: '.xml',
  },
  {
    name: 'dominios',
    type: '00972a17-9975-449e-aab1-d26165d51393',
    extension: '.xml',
  },
  {
    name: 'atributos',
    tagName: 'Attribute',
    extension: '.xml',
  },
  {
    name: 'subtipos',
    type: '87313f43-5eb2-41d7-9b8c-e8d9f5bf9588',
    extension: '.xml',
  },
  {
    name: 'sdts',
    type: '447527b5-9210-4523-898b-5dccb17be60a',
    extension: '.xml',
  },
  {
    name: 'designSystem',
    type: '78b3fa0e-174c-4b2b-8716-718167a428b5',
    extension: '.xml',
  },
];

function sanitizeFileName(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_');
}

function extractObjects(xmlContent, objectType) {
  const objects = [];
  const fqnPattern = /fullyQualifiedName="([^"]*)"/;

  let searchStart = 0;
  const typeStr = `type="${objectType}"`;

  while (true) {
    const typeMatch = xmlContent.indexOf(typeStr, searchStart);
    if (typeMatch === -1) break;

    const objectStart = xmlContent.lastIndexOf('<Object', typeMatch);
    if (objectStart === -1) {
      searchStart = typeMatch + 1;
      continue;
    }

    const tagContent = xmlContent.substring(objectStart, typeMatch + 100);
    if (/\/\s*>/.test(tagContent) && !/>\s*</.test(tagContent)) {
      const selfCloseEnd = xmlContent.indexOf('/>', objectStart);
      const fullMatch = fqnPattern.exec(xmlContent.substring(objectStart, selfCloseEnd));
      if (fullMatch) {
        const fullyQualifiedName = sanitizeFileName(fullMatch[1]);
        const objectXml = xmlContent.substring(objectStart, selfCloseEnd + 2);
        objects.push({ fullyQualifiedName, xml: objectXml });
      }
      searchStart = typeMatch + 1;
      continue;
    }

    const contentStart = xmlContent.indexOf('>', objectStart);
    const closeTag = xmlContent.indexOf('</Object>', contentStart);
    if (closeTag === -1) {
      searchStart = typeMatch + 1;
      continue;
    }

    const fullMatch = fqnPattern.exec(xmlContent.substring(objectStart, contentStart + 1));
    if (fullMatch) {
      const fullyQualifiedName = sanitizeFileName(fullMatch[1]);
      const objectXml = xmlContent.substring(objectStart, closeTag + '</Object>'.length);
      objects.push({ fullyQualifiedName, xml: objectXml });
    }

    searchStart = closeTag + 1;
  }

  return objects;
}

function extractByTag(xmlContent, tagName) {
  const objects = [];
  const fqnPattern = /fullyQualifiedName="([^"]*)"/;
  const openTag = `<${tagName}`;
  const closeTag = `</${tagName}>`;

  let searchStart = 0;

  while (true) {
    const tagStart = xmlContent.indexOf(openTag, searchStart);
    if (tagStart === -1) break;

    const contentStart = xmlContent.indexOf('>', tagStart);
    const closeTagPos = xmlContent.indexOf(closeTag, contentStart);
    if (closeTagPos === -1) {
      searchStart = tagStart + 1;
      continue;
    }

    const fullMatch = fqnPattern.exec(xmlContent.substring(tagStart, contentStart + 1));
    if (fullMatch) {
      const fullyQualifiedName = sanitizeFileName(fullMatch[1]);
      const tagXml = xmlContent.substring(tagStart, closeTagPos + closeTag.length);
      objects.push({ fullyQualifiedName, xml: tagXml });
    }

    searchStart = closeTagPos + closeTag.length;
  }

  return objects;
}

function saveExtracted(objects, outputDir, extension) {
  let saved = 0;
  const duplicates = new Map();

  for (const obj of objects) {
    let filename = `${obj.fullyQualifiedName}${extension}`;

    if (duplicates.has(filename)) {
      duplicates.set(filename, duplicates.get(filename) + 1);
      filename = `${obj.fullyQualifiedName}_${duplicates.get(filename)}${extension}`;
    } else {
      duplicates.set(filename, 1);
    }

    const outputPath = path.join(outputDir, filename);
    const xmlDecl = '<?xml version="1.0" encoding="utf-8"?>\n';
    fs.writeFileSync(outputPath, xmlDecl + obj.xml, 'utf-8');
    saved++;
  }

  return saved;
}

function main() {
  console.log(`Verificando arquivo: ${INPUT_XML}...`);

  let xmlContent = '';

  if (INPUT_XML.toLowerCase().endsWith('.xpz')) {
    console.log(`  → Detectado arquivo XPZ. Extraindo conteúdo...`);
    try {
      const zip = new AdmZip(INPUT_FILE);
      const zipEntries = zip.getEntries();
      const xmlEntry = zipEntries.find((entry) => entry.entryName.toLowerCase().endsWith('.xml'));

      if (!xmlEntry) {
        throw new Error('Nenhum arquivo XML encontrado dentro do XPZ.');
      }

      xmlContent = xmlEntry.getData().toString('utf-8');
      console.log(`  → Conteúdo extraído com sucesso.`);
    } catch (err) {
      console.error(`Erro ao processar XPZ: ${err.message}`);
      process.exit(1);
    }
  } else {
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`Arquivo não encontrado: ${INPUT_FILE}`);
      process.exit(1);
    }
    xmlContent = fs.readFileSync(INPUT_FILE, 'utf-8');
  }

  console.log(`  → Limpando conteúdos base64Binary...`);
  const initialSize = xmlContent.length;
  xmlContent = xmlContent.replace(/<base64Binary>[\s\S]*?<\/base64Binary>/g, '');
  const finalSize = xmlContent.length;
  console.log(`  → Limpeza concluída. Redução de ${(initialSize - finalSize).toLocaleString()} caracteres.`);

  if (!fs.existsSync(BASE_OUTPUT_DIR)) {
    fs.mkdirSync(BASE_OUTPUT_DIR, { recursive: true });
    console.log(`Pasta base criada: ${BASE_OUTPUT_DIR}\n`);
  }

  let totalSaved = 0;

  for (const extractor of EXTRACTORS) {
    const outputDir = path.join(BASE_OUTPUT_DIR, extractor.outputFolder || extractor.name);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Extraindo ${extractor.name}...`);
    let objects = extractor.tagName
      ? extractByTag(xmlContent, extractor.tagName)
      : extractObjects(xmlContent, extractor.type);
    if (extractor.transformName) {
      objects = objects.map((obj) => ({
        ...obj,
        fullyQualifiedName: sanitizeFileName(extractor.transformName(obj.fullyQualifiedName)),
      }));
    }
    const saved = saveExtracted(objects, outputDir, extractor.extension);
    totalSaved += saved;
    console.log(`  → ${saved} extraídos em ${outputDir}\n`);
  }

  console.log(`Concluído! ${totalSaved} objetos no total em ${BASE_OUTPUT_DIR}`);
}

main();
