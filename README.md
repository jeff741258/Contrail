# Contrail

A flight log for travelers. Contrail finds flights in airline emails, imported straight from Gmail or Outlook or pasted in, then counts them, maps every route and keeps records. People can sign in with Google, Microsoft or Apple to keep their log in their own Google Drive, OneDrive or iCloud and sync it across devices.

It's a static website: plain HTML, CSS and JavaScript, with no server, no build step and no database of your own. Each person's log lives in their own cloud account, never with you.

## What's in the folder

| File | What it does |
|---|---|
| `index.html` | The page, including the sign-in bar at the top |
| `styles.css` | Look and feel, light and dark mode |
| `app.js` | Email parsing, stats, map, flight log, backup files |
| `land.js` | World coastlines (Natural Earth, public domain) |
| `sync.js` | Sign-in bar and the sync engine |
| `mail.js` | Import from Gmail and Outlook |
| `config.js` | **The only file you edit**: your app IDs for each provider |
| `providers/google.js` | Google sign-in + Google Drive |
| `providers/msauth.js` | Microsoft sign-in (shared by OneDrive and Outlook import) |
| `providers/microsoft.js` | OneDrive storage |
| `providers/apple.js` | Apple ID sign-in + iCloud (CloudKit) |

## Run it on your computer

Sign-in only works from a real web address, not from a file you double-click. Start a small local server in this folder:

```
python3 -m http.server 8080
```

Then open http://localhost:8080. Everything except cloud sign-in works right away. The sign-in bar says it isn't set up until you add IDs to `config.js`.

## Put it online

Any static host works. Three free options:

- **GitHub Pages**: push the folder to a repository, then Settings › Pages › deploy from the main branch. Your address is `https://<you>.github.io/<repo>/`.
- **Netlify**: drag the folder onto app.netlify.com/drop.
- **Vercel**: `npx vercel` in the folder.

Use your final address in the provider setup below. You can register both `http://localhost:8080` and your live address so testing and production both work.

## Set up each sign-in provider

You can set up one, two or all three. Any provider left empty in `config.js` doesn't appear on the page.

### Google (Google Drive)

Contrail stores one file, `contrail.json`, in Drive's hidden **app data folder**. Users don't see it in their Drive, and Contrail can't see any of their other files.

1. Go to console.cloud.google.com and create a project (e.g. "Contrail").
2. **APIs & Services › Library**: enable the **Google Drive API**.
3. **APIs & Services › OAuth consent screen** (now called Google Auth Platform › Branding / Audience / Data access):
   - App name, support email, your logo if you have one.
   - Audience: External. While the app is in **Testing**, add your own Google account (and any testers) as test users.
   - Data access: add the scope `.../auth/drive.appdata`, plus `openid`, `email` and `profile`.
   - For Gmail import, also add `.../auth/gmail.readonly` and enable the **Gmail API** in the Library.
4. **APIs & Services › Credentials › Create credentials › OAuth client ID**:
   - Application type: **Web application**.
   - Authorized JavaScript origins: `http://localhost:8080` and your live address's origin, e.g. `https://you.github.io`. Origins have no path and no trailing slash.
   - Redirect URIs are not needed.
5. Copy the **Client ID** into `config.js` → `google.clientId`.
6. Before opening the app to everyone, publish the consent screen (Audience › Publish app). Check whether Google asks you to verify the app for the scopes you chose; until then, unverified apps are limited to 100 users and show a warning screen.

### Microsoft (OneDrive)

Contrail stores `contrail.json` in the app's own OneDrive folder, **Apps › Contrail**. The `Files.ReadWrite.AppFolder` permission can't read or change anything else in the user's OneDrive.

1. Go to entra.microsoft.com › **App registrations › New registration**.
   - Name: Contrail.
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**.
   - Redirect URI: platform **Single-page application (SPA)**, value `http://localhost:8080/`.
2. In the new app, **Authentication**: add your live address as another SPA redirect URI, e.g. `https://you.github.io/contrail/`. It must match the page's address exactly, including the trailing slash.
3. **API permissions › Add a permission › Microsoft Graph › Delegated**: add `Files.ReadWrite.AppFolder`, `User.Read` and `offline_access`, plus `Mail.Read` for Outlook import. No admin consent is needed for personal accounts; some workplaces require an admin to approve apps that read mail.
4. Copy the **Application (client) ID** from Overview into `config.js` → `microsoft.clientId`.
5. Leave `tenant` as `common` so both personal and work/school accounts can sign in. Leave `redirectUri` empty unless the page's address differs from the URI you registered (for example, if it's served as `/index.html`).

Microsoft sign-in leaves the page and comes back. Contrail finishes signing in when the page reloads.

### Apple (iCloud)

Contrail uses **CloudKit JS**: people sign in with their Apple ID using Apple's own button, and the log is one record in their **private** iCloud database. This one needs a paid Apple Developer Program membership.

1. In developer.apple.com › Certificates, Identifiers & Profiles › **Identifiers**, register an **iCloud Container**, e.g. `iCloud.com.yourname.contrail`.
2. Open the CloudKit Console (icloud.developer.apple.com), pick the container, then in the **Development** environment:
   - **Schema › Record Types**: create `FlightLog` with one field, `data`, of type **String**.
   - **Tokens & Keys › API Tokens**: create a token. Sign-in callback: **Post Message**. Allowed origins: your live domain (localhost is allowed in Development).
3. Put the container ID and API token in `config.js` → `apple.containerId` and `apple.apiToken`.
4. When you're ready for real users: **Deploy Schema Changes** to Production, create a Production API token, and set `apple.environment` to `"production"`.

Apple draws its own sign-in and sign-out buttons inside the bar. CloudKit's web sign-in shows the user's name only if they allow it, so the bar may just say "Signed in".

## Importing from Gmail and Outlook

The **Import from Gmail** and **Import from Outlook** buttons in *Add flights* search the inbox for airline emails (boarding passes, itineraries, e-tickets, confirmations and receipts) within the chosen time range, up to 400 emails per scan. Contrail reads them in the browser, runs them through the same parser as pasted emails, and shows the flights it found with the email each came from. Nothing is added until the user checks the list and presses **Add selected**. Flights dated in the future start unchecked, so the count only includes trips already flown.

- Mail access is asked for only when someone starts an import, and it's separate from cloud storage. Signing in to OneDrive doesn't grant mail access, and vice versa.
- Email contents stay in the browser. They're never saved, and they never reach any server of yours.
- Gmail access lasts up to an hour and isn't remembered. Outlook access ends when the browser session does.
- Outlook import leaves the page for Microsoft's permission screen and starts scanning automatically when it comes back.
- iCloud Mail has no web API, so iCloud users paste or upload emails instead.
- To hide either button, set `gmailImport: false` or `mailImport: false` in `config.js`.

### Approval you'll need before launch

- **Gmail:** Google classes `gmail.readonly` as a *restricted* scope. While your app is in Testing, up to 100 test users you add can use Gmail import. To open it to everyone, Google must verify the app, and restricted scopes normally also need an annual third-party security assessment. Google's Gmail scope documentation ties that assessment to apps that store or send Gmail data to servers. Contrail does neither, but Google's other policy pages say every app with restricted scopes needs it, so raise this with Google when you submit for verification. You can launch Drive sync first and add Gmail import later: set `gmailImport: false` until approval comes through.
- **Outlook:** No security assessment. Complete Microsoft's free **publisher verification** (it needs a Microsoft Partner Network ID) so users don't see an "unverified app" warning. Without it, many work and school accounts can't approve the app.

## How syncing works

- One provider is active at a time. Signing in to a second provider switches to it.
- Every sync loads the cloud copy, merges it with the log on this device, and saves the result if anything changed. It runs a moment after each edit, when you press **Sync now**, and when you come back to the tab.
- Each flight records when it was added and each deletion when it happened. A flight stays in the log if it was added after the last time it was deleted on any device. So a flight deleted on your phone stays deleted on your laptop, and a flight you add back later comes back everywhere.
- The first time someone signs in on a device, flights already on that device are combined with their cloud log rather than replaced.
- The log is still kept in the browser, so the app works offline and while signed out.

## Sessions and privacy

- Google hands out one-hour tokens. Within a browser session the token is reused; after that the bar shows **Reconnect**, which is one click for someone who already allowed access.
- Microsoft tokens refresh on their own for about a day of inactivity before **Reconnect** is needed.
- Microsoft tokens are kept in the browser's local storage, which is normal for single-page apps but means any script running on your page could read them. Don't add third-party scripts you don't trust.
- Nothing is sent to any server you run. Each person's data goes directly between their browser and their own Google, Microsoft or Apple account.

## Before you launch

- **Brand rules**: Google, Microsoft and Apple each publish guidelines for sign-in buttons. Apple's button is drawn by Apple. The Google and Microsoft buttons here are plain text buttons; check them against Google's "Sign in with Google" and Microsoft's sign-in branding guidelines before a public launch, and swap in their official button artwork if required.
- **Privacy policy and terms**: Google and Microsoft ask for links to these on the consent screen once the app is public.
- **Your own domain** looks more trustworthy on consent screens than a github.io address.
