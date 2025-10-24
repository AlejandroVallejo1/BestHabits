import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const NESSIE = process.env.NESSIE_API_BASE || "https://api.nessieisreal.com";
const KEY = process.env.NESSIE_API_KEY || "";

// Estado en memoria (MVP)
type User = { token: string; customerId?: string };
const users = new Map<string, User>();
const userScore = new Map<string, { value: number; breakdown: any }>();
const userInsights = new Map<string, any[]>();

function auth(req: any, res: any, next: any) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token || !users.has(token)) return res.status(401).json({ error: "unauthorized" });
  (req as any).user = users.get(token);
  next();
}

app.get("/health", (_req, res) => res.json({ ok: true }));

// 1) Bootstrap sin formularios
app.post("/bootstrap", (_req, res) => {
  const token = Math.random().toString(36).slice(2);
  const demoCustomers = ["demoCustomerId1", "demoCustomerId2", "demoCustomerId3"];
  const customerId = demoCustomers[Math.floor(Math.random() * demoCustomers.length)];
  users.set(token, { token, customerId });
  userScore.set(token, { value: 50, breakdown: { mock: true } });
  userInsights.set(token, [{ id: "i1", title: "Bienvenido", body: "Pulsa Sincronizar para crear tu perfil." }]);
  res.json({ token });
});

// 2) Sync: intenta Nessie; si no, usa mock
app.post("/sync", auth, async (req, res) => {
  const token = (req as any).user.token as string;
  const customerId = (req as any).user.customerId as string | undefined;

  let income = 0, spend = 0, txCount = 0;

  if (KEY && customerId) {
    try {
      const accs = await axios.get(`${NESSIE}/customers/${customerId}/accounts?key=${KEY}`).then(r => r.data);
      for (const acc of accs) {
        const id = acc._id;
        const [purchases, deposits, withdrawals] = await Promise.all([
          axios.get(`${NESSIE}/accounts/${id}/purchases?key=${KEY}`).then(r => r.data).catch(() => []),
          axios.get(`${NESSIE}/accounts/${id}/deposits?key=${KEY}`).then(r => r.data).catch(() => []),
          axios.get(`${NESSIE}/accounts/${id}/withdrawals?key=${KEY}`).then(r => r.data).catch(() => []),
        ]);
        income += (deposits as any[]).reduce((s, t: any) => s + (t.amount || 0), 0);
        spend  += (purchases as any[]).reduce((s, t: any) => s + (t.amount || 0), 0);
        spend  += (withdrawals as any[]).reduce((s, t: any) => s + (t.amount || 0), 0);
        txCount += (purchases?.length || 0) + (deposits?.length || 0) + (withdrawals?.length || 0);
      }
    } catch (e: any) {
      console.warn("Nessie fallback:", e.message);
    }
  }

  if (!txCount) { income = 1200; spend = 800; txCount = 20; } // mock

  const sr = income > 0 ? Math.max(0, Math.min(1, (income - spend) / income)) : 0;
  const score = Math.round(100 * (0.6 * sr + 0.4 * 0.5));

  userScore.set(token, { value: score, breakdown: { sr, income, spend } });
  userInsights.set(token, [
    { id: "i1", title: "Tasa de ahorro", body: `${(sr * 100).toFixed(1)}%` },
    { id: "i2", title: "Ingresos", body: `$${income.toFixed(2)}` },
    { id: "i3", title: "Gasto", body: `$${spend.toFixed(2)}` },
  ]);

  res.json({ ok: true, txCount });
});

// 3) Endpoints de lectura
app.get("/score", auth, (req, res) => {
  const token = (req as any).user.token as string;
  res.json(userScore.get(token) || { value: 0, breakdown: {} });
});

app.get("/insights", auth, (req, res) => {
  const token = (req as any).user.token as string;
  res.json(userInsights.get(token) || []);
});

app.listen(PORT, () => console.log(`BFF running on http://localhost:${PORT}`));
