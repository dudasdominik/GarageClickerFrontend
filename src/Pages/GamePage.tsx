import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import "../css/GamePage.css";

type PreserveList<T> = { $id?: string; $values: T[] };

interface Item {
  id: string;
  name: string;
  cost: number; // base cost
  effect: string;
  type: string;
}

interface PlayerItem {
  id: string;
  playerId: string;
  itemId: string;
  item: Item | null; // ⚠️ backenden Include kell, különben null marad
  quantity: number;
}

interface Player {
  id: string;
  name?: string;
  username: string;
  credits: number;
  totalClicks: number;
  clicksPerSecond: number;
  lastSaveAt: string;
  createdAt: string;
}

function toArray<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.$values && Array.isArray(data.$values)) return data.$values;
  return [];
}

function calcPrice(baseCost: number, owned: number): number {
  const price = Math.floor(baseCost * Math.pow(1.15, owned));
  return Math.max(price, 1);
}

const GamePage: React.FC = () => {
  const navigate = useNavigate();

  const [player, setPlayer] = useState<Player | null>(null);
  const [playerItems, setPlayerItems] = useState<PlayerItem[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [totalClicks, setTotalClicks] = useState<number>(0);
  const [clicksPerSecond, setClicksPerSecond] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string>("");

  const creditsRef = useRef(0);
  const clicksRef = useRef(0);
  const cpsRef = useRef(0);

  useEffect(() => {
    creditsRef.current = credits;
  }, [credits]);
  useEffect(() => {
    clicksRef.current = totalClicks;
  }, [totalClicks]);
  useEffect(() => {
    cpsRef.current = clicksPerSecond;
  }, [clicksPerSecond]);

  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const passiveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shopList = useMemo(() => {
    // Shop = PlayerItems list (mert minden itemből 1 sor van a playernél)
    // Ha item null, akkor nem tudjuk renderelni normálisan.
    return playerItems;
  }, [playerItems]);

  const saveGame = async (playerId: string, c: number, clicks: number) => {
    await api.post("/api/Player/save", {
      playerId,
      clientCredits: Math.floor(c),
      clientTotalClicks: Math.floor(clicks),
    });
  };

  const handleManualSave = async () => {
    const playerId = localStorage.getItem("playerId");
    if (!playerId) {
      navigate("/login");
      return;
    }

    try {
      setSaving(true);
      setSaveMsg("");

      await saveGame(playerId, creditsRef.current, clicksRef.current);

      setSaveMsg("✅ Saved!");
      setTimeout(() => setSaveMsg(""), 1500);
    } catch (e) {
      setSaveMsg("❌ Save failed");
    } finally {
      setSaving(false);
    }
  };

  const loadPlayer = async (playerId: string): Promise<Player> => {
    const res = await api.get<Player>(`/api/Player/${playerId}`);
    return res.data;
  };

  const loadPlayerItems = async (playerId: string): Promise<PlayerItem[]> => {
    const res = await api.get<PreserveList<PlayerItem> | PlayerItem[]>(
      `/api/PlayerItems/all/${playerId}`
    );
    return toArray<PlayerItem>(res.data);
  };

  const initializeGame = async (playerId: string) => {
    try {
      setLoading(true);

      const [p, pi] = await Promise.all([
        loadPlayer(playerId),
        loadPlayerItems(playerId),
      ]);

      // offline gain
      const lastSaveAt = new Date(p.lastSaveAt);
      const now = new Date();
      const offlineSeconds = Math.max(
        0,
        (now.getTime() - lastSaveAt.getTime()) / 1000
      );
      const offlineGains = Math.floor(
        offlineSeconds * Number(p.clicksPerSecond ?? 0)
      );

      setPlayer(p);
      setPlayerItems(pi);

      setCredits(Number(p.credits ?? 0) + offlineGains);
      setTotalClicks(Number(p.totalClicks ?? 0));
      setClicksPerSecond(Number(p.clicksPerSecond ?? 0));

      if (offlineGains > 0) {
        alert(
          `Welcome back! You earned ${offlineGains} credits while offline!`
        );
      }

      // Autosave 2 percenként (latest refekkel)
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      saveTimerRef.current = setInterval(async () => {
        try {
          await saveGame(playerId, creditsRef.current, clicksRef.current);
          // console.log("Auto-saved", creditsRef.current, clicksRef.current);
        } catch (e) {
          console.error("Auto-save failed:", e);
        }
      }, 120000);

      // Passzív income 1 mp-enként (latest cpsRef)
      if (passiveTimerRef.current) clearInterval(passiveTimerRef.current);
      passiveTimerRef.current = setInterval(() => {
        setCredits((prev) => prev + cpsRef.current);
      }, 1000);
    } catch (err) {
      console.error("Error initializing game:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const playerId = localStorage.getItem("playerId");
    if (!playerId) {
      navigate("/login");
      return;
    }

    initializeGame(playerId);

    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      if (passiveTimerRef.current) clearInterval(passiveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = () => {
    setCredits((prev) => prev + 1);
    setTotalClicks((prev) => prev + 1);
  };

  const handlePurchase = async (pi: PlayerItem) => {
    try {
      const playerId = localStorage.getItem("playerId");
      if (!playerId) {
        navigate("/login");
        return;
      }

      if (!pi.item) {
        alert(
          "Backend /api/PlayerItems/all nem tölti be az Item-et (item=null). Rakj Include(pi => pi.Item)-et a backendbe!"
        );
        return;
      }

      const owned = pi.quantity ?? 0;
      const price = calcPrice(pi.item.cost, owned);

      if (creditsRef.current < price) {
        alert("Not enough credits");
        return;
      }

      // 1) SYNC: mentjük a jelenlegi kliens állapotot, hogy a backend ne régi creditsből vásároljon
      await saveGame(playerId, creditsRef.current, clicksRef.current);

      // 2) BUY
      await api.patch(`/api/PlayerItems/add/${playerId}/${pi.itemId}`);

      // 3) REFRESH: player + playerItems
      const [freshPlayer, freshItems] = await Promise.all([
        loadPlayer(playerId),
        loadPlayerItems(playerId),
      ]);

      setPlayer(freshPlayer);
      setPlayerItems(freshItems);

      setCredits(Number(freshPlayer.credits ?? 0));
      setTotalClicks(Number(freshPlayer.totalClicks ?? 0));
      setClicksPerSecond(Number(freshPlayer.clicksPerSecond ?? 0));
    } catch (error: any) {
      const msg =
        error?.response?.data ??
        error?.response?.data?.message ??
        error?.message ??
        "Error purchasing item";
      console.error(msg);
      alert(String(msg));
    }
  };

  const handleLogout = async () => {
    const playerId = localStorage.getItem("playerId");
    try {
      if (playerId) {
        await saveGame(playerId, creditsRef.current, clicksRef.current);
      }
    } catch (e) {
      console.error("Logout save failed:", e);
    }

    localStorage.removeItem("playerId");
    localStorage.removeItem("username");
    navigate("/login");
  };

  if (loading) return <div className="loading">Loading game...</div>;

  return (
    <div className="game-container">
      <header className="game-header">
        <h1>Garage Clicker</h1>

        <div className="player-info">
          <p>Player: {localStorage.getItem("username")}</p>
          <p>Credits: {Math.floor(credits).toLocaleString()}</p>
          <p>Total Clicks: {totalClicks.toLocaleString()}</p>
          <p>Credits/sec: {Number(clicksPerSecond).toFixed(2)}</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={handleManualSave}
            className="save-btn"
            disabled={saving}
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Saving..." : "Save"}
          </button>

          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>

          {saveMsg && <span style={{ fontSize: 14 }}>{saveMsg}</span>}
        </div>
      </header>

      <div className="game-content">
        <div className="clicker-section">
          <div className="clicker-wrapper" onClick={handleClick}>
            {/* Vite-nál ez így is mehet, ha nálad működik */}
            <img
              src="/src/assets/clicker.svg"
              alt="Click me!"
              className="clicker-image"
            />
            <p className="click-hint">Click the garage!</p>
          </div>
        </div>

        <div className="shop-section">
          <h2>Shop</h2>

          <div className="items-grid">
            {shopList.map((pi) => {
              const item = pi.item;
              const owned = pi.quantity ?? 0;

              // ha item null, nem tudjuk rendesen megjeleníteni -> backend Include kell
              if (!item) {
                return (
                  <div key={pi.id} className="item-card unavailable">
                    <h3>Item missing (item=null)</h3>
                    <p>itemId: {pi.itemId}</p>
                    <p>Fix: backendben Include(pi =&gt; pi.Item)</p>
                  </div>
                );
              }

              const price = calcPrice(item.cost, owned);
              const canAfford = credits >= price;

              return (
                <div
                  key={pi.id}
                  className={`item-card ${!canAfford ? "unavailable" : ""}`}
                  onClick={() => canAfford && handlePurchase(pi)}
                >
                  <h3>{item.name}</h3>
                  <p className="item-effect">{item.effect}</p>
                  <p className="item-cost">Cost: {price.toLocaleString()}</p>
                  <p className="item-type">Type: {item.type}</p>
                  <p className="item-quantity">Owned: {owned}</p>

                  {!canAfford && (
                    <div className="not-enough-credits">Not enough credits</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
