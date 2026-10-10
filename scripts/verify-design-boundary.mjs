import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const baseline = '455b5a2';
const changed = execFileSync('git', ['diff', '--name-only', baseline], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const printer = ts.createPrinter({ removeComments: true });
const visualAttributes = new Set(['style', 'className', 'fontFamily', 'fontWeight', 'fill']);
function parse(file, source) { return ts.createSourceFile(file, source.replaceAll('\r\n', '\n'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX); }
function semantics(file, source) {
  const tree = parse(file, source);
  const result = ts.transform(tree, [context => {
    function visit(node) {
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(tree) === 'style') return ts.factory.createNull();
      if (ts.isJsxAttribute(node) && visualAttributes.has(node.name.text)) return undefined;
      if (ts.isImportDeclaration(node) && (/\.css$/.test(node.moduleSpecifier.text) || node.moduleSpecifier.text === 'next/font/local')) return undefined;
      if (ts.isVariableStatement(node) && node.declarationList.declarations.some(d => ['manrope', 'textColor'].includes(d.name.getText(tree)))) return undefined;
      return ts.visitEachChild(node, visit, context);
    }
    return node => ts.visitNode(node, visit);
  }]);
  const value = printer.printFile(result.transformed[0]);
  result.dispose();
  return value;
}
function homeContract(source) {
  const tree = parse('app/page.tsx', source);
  const texts = [], links = [], data = [];
  function visit(node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(tree) === 'style') return;
    if (ts.isJsxText(node)) { const value = node.text.replace(/\s+/g, ' ').trim(); if (value) texts.push(value); }
    if (ts.isJsxAttribute(node) && node.name.text === 'href') links.push(node.initializer.getText(tree));
    if (ts.isVariableDeclaration(node) && ['steps', 'operatingPillars', 'pathRules', 'metadata'].includes(node.name.getText(tree))) data.push(printer.printNode(ts.EmitHint.Unspecified, node, tree));
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return { texts: texts.sort(), links: links.sort(), data: data.sort() };
}
function dashboardContract(source) {
  const tree = parse('dashboard.tsx', source);
  const page = tree.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'DashboardPage');
  const dataflow = page.body.statements.filter(node => !ts.isReturnStatement(node)).map(node => printer.printNode(ts.EmitHint.Unspecified, node, tree));
  const actions = [], texts = [];
  function visit(node) {
    if (ts.isJsxAttribute(node) && ['href', 'onClick', 'disabled', 'primaryAction'].includes(node.name.text)) actions.push(printer.printNode(ts.EmitHint.Unspecified, node, tree));
    if (ts.isJsxText(node)) { const value = node.text.replace(/\s+/g, ' ').trim(); if (value && value !== 'Cos’è un ETF?') texts.push(value); }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return { dataflow, actions: actions.sort(), texts: texts.sort() };
}
for (const file of changed) {
  assert.ok(file.endsWith('.css') || file.endsWith('.tsx') || file === 'DESIGN.md' || file.startsWith('.impeccable/') || file.startsWith('docs/') || file.startsWith('scripts/verify-design') || file === 'scripts/verify-dashboard-design.mjs' || file.startsWith('scripts/capture-design') || file.startsWith('public/fonts/') || file.startsWith('public/images/'), `Unexpected non-presentation change: ${file}`);
  if (!file.endsWith('.tsx')) continue;
  const before = execFileSync('git', ['show', `${baseline}:${file}`], { encoding: 'utf8' });
  const after = readFileSync(file, 'utf8');
  if (file === 'app/page.tsx') assert.deepEqual(homeContract(after), homeContract(before), 'Homepage copy, actions or product data changed');
  else if (file === 'app/(community)/dashboard/page.tsx') assert.deepEqual(dashboardContract(after), dashboardContract(before), 'Dashboard dataflow, actions or existing copy changed');
  else assert.equal(semantics(file, after), semantics(file, before), `Behavior or copy changed in ${file}`);
}
console.log(`PASS: ${changed.length} tracked files reviewed; behavior/copy unchanged outside approved dashboard layout and ETF disclosure. Dashboard dataflow, actions and existing copy match baseline.`);
