const personalPages = new Set(["/dashboard", "/onboarding", "/competenze", "/goal", "/settings", "/prelancio/prepara", "/prelancio/profilo-pronto"]);
const entryPages = new Set(["/login", "/register", "/prelancio", "/prelancio/grazie", "/prelancio/dati"]);

export function prelaunchPrivateDestination(pathname: string) {
  return personalPages.has(pathname) ? pathname : "/dashboard";
}

export function isPrelaunchEntryPage(pathname: string) {
  return entryPages.has(pathname);
}
