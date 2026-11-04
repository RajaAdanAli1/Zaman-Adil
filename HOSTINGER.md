# Hostinger: build screen and environment file

Use this when the dashboard is on **Build and output settings**. The form in that step often detects React and fills an output directory of `build`. This repository is one Express app that also serves the React build, so those two defaults have to be changed before Continue.

Production reads variables from this screen only. It does not read `server/.env`. That file is for local development and must not be imported here: it sets `PORT`, points `SITE_URL` at localhost, and uses the development admin password, which production refuses.

## Build configuration

| Field | Set it to |
| --- | --- |
| Framework preset | **Express**. If the list has no Express, choose Other and set the entry file to `server.js`. |
| Branch | `main` |
| Node version | `22.x` |
| Root directory | `/` |

A React or Vite preset publishes static files and never starts the API, the database, or the desk.

## Build and output settings

| Field | Set it to |
| --- | --- |
| Build command | `npm run build` |
| Package manager | `npm` |
| Output directory | Empty. Delete `build` if the form filled it in. |
| Entry file | `server.js`, when the form shows this field |

`npm run build` writes the frontend to `client/dist`. Express serves that folder. An output directory of `build` or `client/dist` can drop the server from the deployment.

If the Express preset hides the build command and the output directory, leave them hidden. Hostinger still runs the root `build` script and then starts `server.js`.

## Environment variables

On the same screen, choose **Import .env** and select [`hostinger.env.example`](hostinger.env.example). Then replace the placeholders in the imported rows. You can also choose **Add more** and type the same keys.

| Key | Value to enter |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGO_URI` | The Atlas `mongodb+srv://` string, with a database name such as `zamanadil` in the path. |
| `JWT_SECRET` | A unique secret of at least 32 characters. The placeholder in the example file is too short on purpose, so a forgotten edit stops startup. |
| `ADMIN_USERNAME` | `admin`, or another name. Used only when the database has no admin user yet. |
| `ADMIN_PASSWORD` | A unique password of at least 10 characters. Required only for that first account. The desk asks for a replacement at the first sign-in. Do not reuse `AdilZaman-Admin-2026`. |
| `SITE_URL` | `https://zamanadil.com`, or the `https://` origin visitors actually use. |
| `MAIL_TO` | Inbox for contact messages. `zamanuog@gmail.com` is the default when this is empty. FormSubmit may send that inbox one activation email before delivery works. |
| `IP_HASH_SALT` | Optional. A long random value, so address hashes survive a restart. Leave it out to generate a new salt on every start. |

Do not add these. The process already has the right behaviour when they are absent:

| Key | Why it stays unset |
| --- | --- |
| `PORT` | Hostinger sets it. The process reads `process.env.PORT` and listens on `0.0.0.0`. |
| `HOST` | Defaults to `0.0.0.0`. |
| `TRUST_PROXY` | Production trusts one proxy hop, which matches Hostinger. |
| `CLIENT_ORIGIN` | The site and the API share one origin. `*` is ignored. |

`MONGODB_URI` is read only when `MONGO_URI` is empty. If the Database Connect Wizard writes a different name, copy the connection string into `MONGO_URI`.

After the values are saved, continue the deploy. Changing a variable later needs a restart from the Running control. A restart does not rebuild the frontend; use Redeploy when the client build must change.

The rest of the Hostinger path — Atlas network access, the domain, HTTPS, logs, and the usual startup errors — is in [README.md](README.md#hostinger-deployment).
