import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const workspaceRoot = resolve(process.cwd());
const sourcePath = resolve(workspaceRoot, 'bin.json');
const outputPath = resolve(workspaceRoot, 'shared', 'bin-by-bank.json');
const reportPath = resolve(workspaceRoot, 'shared', 'bin-by-bank-report.json');
const logosDirPath = resolve(workspaceRoot, 'public', 'imgs', 'banks_logos');

const logoFiles = readdirSync(logosDirPath);
const logoByIssuerKey = new Map();

logoFiles.forEach((fileName) => {
  const normalized = String(fileName || '').trim();
  if (!normalized) return;

  const dotIndex = normalized.lastIndexOf('.');
  if (dotIndex <= 0) return;

  const baseName = normalized.slice(0, dotIndex);
  const extension = normalized.slice(dotIndex + 1).toLowerCase();
  if (!['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(extension)) return;

  logoByIssuerKey.set(baseName, normalized);
});

const raw = readFileSync(sourcePath, 'utf8');
const records = JSON.parse(raw);

if (!Array.isArray(records)) {
  throw new Error('bin.json root must be an array');
}

const banksMap = new Map();
const binToIssuerKeys = new Map();

const invalidBinLength = [];
const nullCardType = [];
const nanCategory = [];

const canonicalIssuerKeyMap = {
  al_rajhi_banking_and_investment_corp: 'al_rajhi_banking_and_investment_corporation'
};

const getCanonicalIssuerKey = (issuerKey) => {
  return canonicalIssuerKeyMap[issuerKey] || issuerKey;
};

records.forEach((record, index) => {
  const sourceIssuerKey = String(record?.issuerKey ?? '').trim() || 'unknown_issuer';
  const issuerKey = getCanonicalIssuerKey(sourceIssuerKey);
  const issuerEn = record?.issuerEn ?? null;
  const bin = String(record?.bin ?? '');

  if (!banksMap.has(issuerKey)) {
    banksMap.set(issuerKey, {
      issuerKey,
      issuerNamesSet: new Set(),
      records: []
    });
  }

  const bankEntry = banksMap.get(issuerKey);
  if (issuerEn !== null && issuerEn !== undefined && String(issuerEn).trim() !== '') {
    bankEntry.issuerNamesSet.add(String(issuerEn));
  }
  bankEntry.records.push({
    ...record,
    issuerKey
  });

  if (!binToIssuerKeys.has(bin)) {
    binToIssuerKeys.set(bin, new Set());
  }
  binToIssuerKeys.get(bin).add(issuerKey);

  if (bin.length !== 6) {
    invalidBinLength.push({ index, bin, issuerKey, sourceIssuerKey, issuerEn });
  }

  if (record?.cardType === null || record?.cardType === undefined) {
    nullCardType.push({ index, bin, issuerKey, sourceIssuerKey, issuerEn });
  }

  if (String(record?.category ?? '').toLowerCase() === 'nan') {
    nanCategory.push({ index, bin, issuerKey, sourceIssuerKey, issuerEn });
  }
});

const duplicateBinsAcrossBanks = [];
for (const [bin, issuerKeysSet] of binToIssuerKeys.entries()) {
  if (issuerKeysSet.size > 1) {
    duplicateBinsAcrossBanks.push({
      bin,
      issuerKeys: Array.from(issuerKeysSet).sort()
    });
  }
}

const sortedIssuerKeys = Array.from(banksMap.keys()).sort((a, b) => a.localeCompare(b));
const banks = {};
const banksWithoutLogo = [];

for (const issuerKey of sortedIssuerKeys) {
  const item = banksMap.get(issuerKey);
  const issuerNames = Array.from(item.issuerNamesSet).sort((a, b) => a.localeCompare(b));
  const logoFileName = logoByIssuerKey.get(issuerKey) || null;

  if (!logoFileName) {
    banksWithoutLogo.push(issuerKey);
  }

  banks[issuerKey] = {
    issuerKey,
    issuerNames,
    logoFileName,
    logoPath: logoFileName ? `/imgs/banks_logos/${logoFileName}` : null,
    totalRecords: item.records.length,
    records: item.records
  };
}

const banksInDataSet = new Set(sortedIssuerKeys);
const unusedLogoFiles = Array.from(logoByIssuerKey.entries())
  .filter(([issuerKey]) => !banksInDataSet.has(issuerKey))
  .map(([, fileName]) => fileName)
  .sort((a, b) => a.localeCompare(b));

const organized = {
  generatedAt: new Date().toISOString(),
  sourceFile: 'bin.json',
  totalRecords: records.length,
  totalBanks: sortedIssuerKeys.length,
  banks
};

const report = {
  generatedAt: organized.generatedAt,
  sourceFile: 'bin.json',
  totalRecords: records.length,
  totalBanks: sortedIssuerKeys.length,
  recordsPerBank: sortedIssuerKeys.map((issuerKey) => ({
    issuerKey,
    totalRecords: banks[issuerKey].totalRecords,
    issuerNames: banks[issuerKey].issuerNames
  })),
  dataQuality: {
    invalidBinLengthCount: invalidBinLength.length,
    invalidBinLength,
    nullCardTypeCount: nullCardType.length,
    nullCardType,
    nanCategoryCount: nanCategory.length,
    nanCategory,
    duplicateBinsAcrossBanksCount: duplicateBinsAcrossBanks.length,
    duplicateBinsAcrossBanks,
    banksWithoutLogoCount: banksWithoutLogo.length,
    banksWithoutLogo,
    unusedLogoFilesCount: unusedLogoFiles.length,
    unusedLogoFiles
  }
};

writeFileSync(outputPath, JSON.stringify(organized, null, 2) + '\n', 'utf8');
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

console.log(`✅ Organized BIN file written: ${outputPath}`);
console.log(`✅ Report file written: ${reportPath}`);
console.log(`Banks: ${organized.totalBanks} | Records: ${organized.totalRecords}`);
console.log(`Invalid BIN length: ${report.dataQuality.invalidBinLengthCount}`);
console.log(`Null cardType: ${report.dataQuality.nullCardTypeCount}`);
console.log(`'nan' category: ${report.dataQuality.nanCategoryCount}`);
console.log(`Duplicate BINs across banks: ${report.dataQuality.duplicateBinsAcrossBanksCount}`);
console.log(`Banks without logo: ${report.dataQuality.banksWithoutLogoCount}`);
console.log(`Unused logo files: ${report.dataQuality.unusedLogoFilesCount}`);
