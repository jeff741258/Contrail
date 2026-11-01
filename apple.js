// iCloud storage.
// Sign-in and storage: CloudKit JS. The user signs in with their Apple ID using Apple's own
// button, and the log is one record in their private iCloud database. Only that user can read it.
// Needs an Apple Developer account, an iCloud container, and a record type (see README).
(function(){
  "use strict";
  const U = window.ContrailUtil;
  const RECORD_NAME = "contrail-log";
  const RECORD_TYPE = "FlightLog";

  let cfg, hooks, container, db, changeTag = null;

  function ckError(e){
    const c = e && e.ckErrorCode;
    const code = c === "CONFLICT" ? "conflict"
      : (c === "AUTHENTICATION_REQUIRED" || c === "AUTHENTICATION_FAILED") ? "auth" : "http";
    return U.err(code, "iCloud returned an error (" + ((e && (e.reason || c)) || "unknown") + ").");
  }

  function signedIn(identity, auto){
    const n = identity && identity.nameComponents;
    const user = { name: n ? [n.givenName, n.familyName].filter(Boolean).join(" ") : "", email: "" };
    hooks.onSignedIn("apple", user, { auto });
    container.whenUserSignsOut().then(()=>{
      changeTag = null;
      hooks.onSignedOut("apple");
      waitForSignIn();
    });
  }
  function waitForSignIn(){ container.whenUserSignsIn().then(id => signedIn(id, false)).catch(()=>{}); }

  const Apple = {
    id: "apple",
    label: "iCloud",
    usesOwnButtons: true, // Apple draws the sign-in and sign-out buttons itself
    configured: c => !!(c && c.containerId && c.apiToken),

    async init(c, h){
      cfg = c; hooks = h;
      await U.loadScript("https://cdn.apple-cloudkit.com/ck/2/cloudkit.js");
      CloudKit.configure({
        containers: [{
          containerIdentifier: cfg.containerId,
          apiTokenAuth: {
            apiToken: cfg.apiToken,
            persist: true,
            signInButton: { id: "apple-sign-in-button", theme: "black" },
            signOutButton: { id: "apple-sign-out-button", theme: "black" }
          },
          environment: cfg.environment || "development"
        }]
      });
      container = CloudKit.getDefaultContainer();
      db = container.privateCloudDatabase;
      const identity = await container.setUpAuth();
      identity ? signedIn(identity, true) : waitForSignIn();
    },

    signIn(){ /* Apple's button in #apple-sign-in-button starts sign-in */ },
    signOut(){ /* Apple's button in #apple-sign-out-button signs out */ },

    async load(){
      const r = await db.fetchRecords([RECORD_NAME]);
      if(r.hasErrors){
        const e = r.errors[0];
        if(e.ckErrorCode === "NOT_FOUND"){ changeTag = null; return null; }
        throw ckError(e);
      }
      const rec = r.records[0];
      changeTag = rec.recordChangeTag;
      return JSON.parse(rec.fields.data.value);
    },

    async save(doc){
      const rec = { recordType: RECORD_TYPE, recordName: RECORD_NAME, fields: { data: { value: JSON.stringify(doc) } } };
      if(changeTag) rec.recordChangeTag = changeTag; // CloudKit refuses the save if another device wrote first
      const r = await db.saveRecords([rec]);
      if(r.hasErrors) throw ckError(r.errors[0]);
      changeTag = r.records[0].recordChangeTag;
    }
  };

  window.ContrailProviders.apple = Apple;
})();
