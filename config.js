// Contrail cloud sign-in settings.
// Fill in the IDs you get when you register the app with each provider (see README.md).
// A provider whose settings are left empty simply doesn't appear in the sign-in bar.
// None of these values are secret: they identify your app, and each provider only
// accepts sign-ins from the web addresses you registered.
window.CONTRAIL_CONFIG = {
  google: {
    // Google Cloud Console > APIs & Services > Credentials > OAuth client ID (Web application)
    clientId: "",
    // Show "Import from Gmail". Needs the gmail.readonly scope on your consent screen (see README).
    gmailImport: true
  },
  microsoft: {
    // Microsoft Entra admin center > App registrations > your app > Application (client) ID
    clientId: "",
    // "common" lets both personal Microsoft accounts and work/school accounts sign in.
    tenant: "common",
    // Leave empty to use the page's own address. It must exactly match a SPA redirect URI you registered.
    redirectUri: "",
    // Show "Import from Outlook". Needs the Mail.Read permission on your app registration (see README).
    mailImport: true
  },
  apple: {
    // CloudKit Console > your container, e.g. "iCloud.com.yourname.contrail"
    containerId: "",
    // CloudKit Console > Tokens & Keys > API Tokens
    apiToken: "",
    // "development" while testing; switch to "production" after deploying the schema.
    environment: "development"
  }
};
