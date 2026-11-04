# zamanadil.com

Faculty site for Dr. Adil Zaman, political scientist at the University of Gujrat. The public site, publication archive, writing, contact form and private desk run as one Node.js application: MongoDB, Express, React and Vite.

For how the system behaves, see [SYSTEM.md](SYSTEM.md).

## Local development

```bash
npm install
npm run dev
```

Install from the repository root. The root package is an npm workspace, so that one install covers the React app and the Express server. The site opens at http://localhost:5173 and Vite proxies `/api`, `/robots.txt` and `/sitemap.xml` to the API on port 5000.

If `MONGO_URI` is not set and MongoDB is not running locally, the API starts a development database and loads the publication and article archive. Copy `server/.env.example` to `server/.env` for local settings. Production does not read that file.

```bash
npm run build
npm start
```

`npm run build` writes the frontend to `client/dist`. `npm start` runs `server.js`, which starts the existing Express application. Express serves the API and, when the build exists, the React app. The browser calls `/api` on the same origin.

## Archive desk

Sign in at http://localhost:5173/admin/login during development, or at `/admin/login` on the deployed site.

The local default account is created only outside production, and the first sign-in asks for a new password before the desk opens:

 Username: `admin`
 Password: `AdilZaman-Admin-2026`

Production will not create this account. Set `ADMIN_USERNAME` and a unique `ADMIN_PASSWORD` of at least 10 characters before the first production start. The first sign-in still requires a new password.

## Hostinger deployment

Deploy one Node.js Web App from this repository. Hostinger serves the site through its proxy and starts the Express process. Express serves both the API and the built React app. Do not deploy the frontend and the API as two apps.

These settings were checked against Hostinger's Node.js documentation (build settings and Express guide, current as of September 2026; the deployment walkthrough was updated 3 November 2026). The dashboard steps themselves have to be done in hPanel.

Node.js Web Apps are available on Business Web Hosting and the Cloud hosting plans (Cloud Startup, Cloud Professional, Cloud Enterprise and Cloud Enterprise Plus). A cheaper plan has to be upgraded first. Hostinger does not provide MongoDB on these plans. Use MongoDB Atlas, or another persistent MongoDB host, and put the connection string in the environment.

### Dashboard settings

1. In hPanel, open Websites and choose Create site, then Web App.
2. Import the GitHub repository. Install the Hostinger GitHub App when asked and grant it this repository. One hosting plan can be connected to one GitHub account.
3. If detection chooses React or Vite, change the application type to **Express**. A React or Vite preset serves static files and does not run the API, the database, or the desk. Express is the correct type for this repository. Other also works when the entry file below is set; with an entry file, Hostinger deploys the whole repository root rather than only a static output folder.
4. Use these values:

| Setting | Value |
| --- | --- |
| Branch | `main` |
| Root directory | `/` (leave the field empty if the form treats that as the repository root) |
| Node.js version | `22` |
| Package manager | `npm` |
| Build script | `build` |
| Output directory | Leave empty |
| Entry file | `server.js` |

The Express preset hides the build script and output directory. Hostinger still runs the `build` script from the root `package.json`, then starts `server.js`. If a form instead asks for full commands, use `npm run build` and `npm start`. Both commands call the same build and the same `server.js` entry. Do not set the output directory to `client/dist`: that directory is the frontend build, and Express serves it. Selecting it as Hostinger's output can drop the server from the deployment.

Node.js 22 is Hostinger's default LTS and the version to select. Use 22.12 or newer when the list shows a specific release. The root `package.json` also allows Node 20.19 or newer.

### Environment variables

The **Build and output settings** screen, including which fields to change when the form detects React, and the file to use with **Import .env**, are in [HOSTINGER.md](HOSTINGER.md). Import [`hostinger.env.example`](hostinger.env.example) and replace the placeholders. Do not import `server/.env`.

`NODE_ENV=production` does not skip the frontend build. Vite is a dependency of the client workspace, so `npm install` still installs it. `mongodb-memory-server` is a development dependency and is not used in production. The server loads it only when a development or test process actually needs an in-memory database.

### MongoDB

1. Create a MongoDB Atlas cluster and a database user with a strong password.
2. Put the `mongodb+srv://` connection string in `MONGO_URI`. A database name such as `zamanadil` in the path is appropriate.
3. Atlas must allow the host to connect. Shared hosting does not give this app a stable outbound address, so Atlas Network Access usually needs `0.0.0.0/0`. The database user and `JWT_SECRET` are what protect the database; do not use a weak password to compensate.
4. Hostinger's Database Connect Wizard can attach an Atlas database from the Node.js dashboard. If it writes a variable other than `MONGO_URI` or `MONGODB_URI`, copy the connection string into `MONGO_URI`. The application does not create, drop or reset collections on its own. An empty database receives the publication and article archive once, and creates the admin user once.

### Domain and HTTPS

Add the domain or subdomain as this Web App. An existing WordPress or PHP site on the same host cannot be switched in place; Hostinger's guide is to back it up, remove that website, and create the Web App on the domain. Leave email accounts in place if the removal form offers that choice. A subdomain has to be its own website, not a folder inside another site.

Turn on the free SSL certificate for the domain and open the site over HTTPS. In production the session cookie is `Secure`, `HttpOnly` and `SameSite=Lax`, and responses include HSTS. The desk cookie will not be stored on a plain HTTP origin.

The canonical host should be the one visitors use. The cookie is host-only, so `www` and the apex host do not share a sign-in.

### Same-origin API

Pages request `/api/...` on the site's own host. Credentials are included so the desk cookie is sent. There is no separate API domain and no browser call to `localhost` in the production build.

### Deploy and redeploy

Click Deploy. Hostinger installs dependencies from the root lockfile, runs `npm run build`, and starts `server.js`. The first boot creates the archive and the admin user when the database is empty.

After that:

- `admin`
- `AdilZaman-Admin-2026`

## Publications

Each publication title opens the journal, DOI or full text stored for that record. Links can be edited from the archive desk.
