/** Public legal identity must be supplied by the operator, never inferred from a developer account. */
export function PrivacyIdentity(){
  const name=process.env.SOCRA_PRIVACY_CONTROLLER_NAME?.trim() || 'Davide Giangrasso';
  const address=process.env.SOCRA_PRIVACY_CONTROLLER_ADDRESS?.trim();
  return <>
    <p>Il titolare del trattamento è <strong>{name}</strong>, gestore di Socra{address?`, con recapito in ${address}`:''}.</p>
    <p>Per informazioni sui tuoi dati, per esercitare i tuoi diritti o per revocare il consenso alle comunicazioni, scrivi a <a href="mailto:info@socra.it">info@socra.it</a>.</p>
  </>;
}
