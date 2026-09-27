# ScrapSetu Backend

Tiny Express server with one job: keep your Gemini API key off the frontend and
turn an uploaded e-waste photo into `{ itemType, material, category }`.

## Run it locally (to test before deploying)

1. `npm install`
2. Copy `.env.example` to `.env` and paste in your **regenerated** Gemini API key
   (regenerate it in Google AI Studio first if you ever pasted the old one anywhere public).
3. `npm start`
4. It runs on `http://localhost:3001`. Test it with:
   ```
   curl -F "image=@/path/to/some/photo.jpg" http://localhost:3001/classify
   ```

## Deploy it for free (Render.com)

1. Push this folder to a new GitHub repo (just this backend folder, not your website).
2. Go to render.com → sign up with GitHub (free, no card needed for this tier).
3. New → Web Service → connect your repo.
4. Settings:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
5. Under **Environment**, add a variable: `GEMINI_API_KEY` = your real key.
6. Deploy. Render gives you a live URL like `https://scrapsetu-backend.onrender.com`.

⚠️ Free Render services **spin down after inactivity** and take ~30-50 seconds to
wake back up on the next request. Fine for a hackathon demo — just don't panic if
the first classification after a break feels slow.

## Connect it to your website

In your website's HTML/JS, set:
```js
const BACKEND_URL = "https://scrapsetu-backend.onrender.com";
```
and call `POST ${BACKEND_URL}/classify` with the photo as `multipart/form-data`
under the field name `image`.

## Locking down CORS (do this before you actually launch)

Right now `cors()` allows any website to call your backend. Before this is
public, restrict it to just your site:
```js
app.use(cors({ origin: "https://your-website-domain.com" }));
```
