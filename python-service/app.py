import os
import sqlite3
import bcrypt
from datetime import timedelta
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
import yfinance as yf
import pandas as pd
import numpy as np
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=[r"http://localhost:\d+", "https://stock-scanner-beta.vercel.app"], supports_credentials=True)

# ── JWT Config ────────────────────────────────────────────────────────────────
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "stockscanner_secret_change_me")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)
jwt = JWTManager(app)

# ── SQLite Setup ──────────────────────────────────────────────────────────────
DB_PATH = os.path.join(os.path.dirname(__file__), "stockscanner.db")

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    db = sqlite3.connect(DB_PATH)
    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db.commit()
    db.close()

# ── RSI Calculation ───────────────────────────────────────────────────────────
def calculate_rsi(prices, period=14):
    delta = prices.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = gain.rolling(window=period, min_periods=period).mean()
    avg_loss = loss.rolling(window=period, min_periods=period).mean()
    for i in range(period, len(avg_gain)):
        avg_gain.iloc[i] = (avg_gain.iloc[i - 1] * (period - 1) + gain.iloc[i]) / period
        avg_loss.iloc[i] = (avg_loss.iloc[i - 1] * (period - 1) + loss.iloc[i]) / period
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


# ── Signal Logic ──────────────────────────────────────────────────────────────
def generate_signal(rsi, current_price, ma50, ma200, golden_cross):
    signals, reasons = [], []
    if rsi is not None:
        if rsi < 30:
            signals.append("bullish"); reasons.append(f"RSI oversold ({rsi:.1f})")
        elif rsi > 70:
            signals.append("bearish"); reasons.append(f"RSI overbought ({rsi:.1f})")
        else:
            reasons.append(f"RSI neutral ({rsi:.1f})")
    if current_price and ma50:
        if current_price > ma50:
            signals.append("bullish"); reasons.append("Price above 50 MA")
        else:
            signals.append("bearish"); reasons.append("Price below 50 MA")
    if current_price and ma200:
        if current_price > ma200:
            signals.append("bullish"); reasons.append("Price above 200 MA")
        else:
            signals.append("bearish"); reasons.append("Price below 200 MA")
    if golden_cross is not None:
        if golden_cross:
            signals.append("bullish"); reasons.append("Golden Cross detected")
        else:
            signals.append("bearish"); reasons.append("Death Cross detected")
    bullish = signals.count("bullish")
    bearish = signals.count("bearish")
    overall = "Bullish" if bullish > bearish else ("Bearish" if bearish > bullish else "Neutral")
    return overall, " + ".join(reasons) if reasons else "Insufficient data"


# ════════════════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ════════════════════════════════════════════════════════════════════════════

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    username = (data or {}).get("username", "").strip()
    email    = (data or {}).get("email", "").strip().lower()
    password = (data or {}).get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    db = get_db()
    existing = db.execute(
        "SELECT id FROM users WHERE email=? OR username=?", (email, username)
    ).fetchone()
    if existing:
        return jsonify({"error": "A user with that email or username already exists."}), 409

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    cur = db.execute(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        (username, email, password_hash)
    )
    db.commit()
    user_id = cur.lastrowid

    token = create_access_token(identity=str(user_id), additional_claims={"username": username, "email": email})
    return jsonify({
        "message": "Account created successfully!",
        "token": token,
        "user": {"id": user_id, "username": username, "email": email}
    }), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    email    = (data or {}).get("email", "").strip().lower()
    password = (data or {}).get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not user or not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return jsonify({"error": "Invalid email or password."}), 401

    token = create_access_token(
        identity=str(user["id"]),
        additional_claims={"username": user["username"], "email": user["email"]}
    )
    return jsonify({
        "message": "Login successful!",
        "token": token,
        "user": {"id": user["id"], "username": user["username"], "email": user["email"]}
    })


@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def me():
    identity = get_jwt_identity()
    return jsonify({"userId": identity})


# ════════════════════════════════════════════════════════════════════════════
# STOCK ROUTES
# ════════════════════════════════════════════════════════════════════════════

import urllib.request
import json
import urllib.parse

# ... existing imports ...

@app.route("/api/stocks/search", methods=["GET"])
@jwt_required()
def search_stocks():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify([])

    try:
        # Yahoo Finance Search API
        encoded_query = urllib.parse.quote(query)
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={encoded_query}&quotesCount=7&newsCount=0"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            
            results = []
            for item in data.get("quotes", []):
                # Filter for stocks and ETFs only, prioritize NSE, BSE, NYSE, NASDAQ
                results.append({
                    "symbol": item.get("symbol"),
                    "name":   item.get("shortname") or item.get("longname"),
                    "exch":   item.get("exchange"),
                    "type":   item.get("quoteType")
                })
            
            return jsonify(results)

    except Exception as e:
        print(f"🔍 Search error for '{query}': {e}")
        return jsonify([])

@app.route("/api/stocks/analyze", methods=["POST"])
@jwt_required()
def analyze():
    data   = request.get_json()
    symbol = (data or {}).get("symbol", "").upper().strip()
    period = (data or {}).get("period", "1y")

    if not symbol:
        return jsonify({"error": "Missing 'symbol' in request body."}), 400

    try:
        ticker = yf.Ticker(symbol)
        hist   = ticker.history(period=period)

        if hist.empty or len(hist) < 20:
            return jsonify({"error": f"No data found for symbol '{symbol}'. Check the ticker."}), 404

        close  = hist["Close"]
        volume = hist["Volume"]

        rsi_series = calculate_rsi(close)
        rsi  = round(float(rsi_series.dropna().iloc[-1]), 2) if not rsi_series.dropna().empty else None
        ma50  = round(float(close.rolling(50).mean().iloc[-1]), 2) if len(close) >= 50  else None
        ma200 = round(float(close.rolling(200).mean().iloc[-1]), 2) if len(close) >= 200 else None

        golden_cross = None
        if len(close) >= 200:
            m50  = close.rolling(50).mean()
            m200 = close.rolling(200).mean()
            prev = m50.iloc[-2] - m200.iloc[-2]
            curr = m50.iloc[-1] - m200.iloc[-1]
            golden_cross = bool(curr > 0) if (prev < 0 and curr >= 0) or (prev > 0 and curr <= 0) else bool(curr > 0)

        current_price  = round(float(close.iloc[-1]), 2)
        current_volume = int(volume.iloc[-1])
        signal, reason = generate_signal(rsi, current_price, ma50, ma200, golden_cross)

        chart_data = [
            {
                "date":   str(idx.date()),
                "close":  round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
                "open":   round(float(row["Open"]), 2),
                "high":   round(float(row["High"]), 2),
                "low":    round(float(row["Low"]), 2),
            }
            for idx, row in hist.tail(30).iterrows()
        ]

        info = {}
        try:
            info = ticker.info
        except Exception as e:
            print(f"⚠️ Error fetching ticker.info for {symbol}: {e}")
            pass

        def safe_float(key, fallback_val=None):
            v = info.get(key) if info else None
            if v is None: v = fallback_val
            try:
                return round(float(v), 2) if v is not None else None
            except Exception:
                return None

        # Fallback to fast_info for some basics
        fast = getattr(ticker, "fast_info", None)
        
        market_cap    = (info.get("marketCap") if info else None) or (fast.get("market_cap") if fast else None)
        trailing_pe   = safe_float("trailingPE")
        div_yield     = safe_float("dividendYield")
        avg_volume    = (info.get("averageVolume") if info else None) or (fast.get("three_month_avg_volume") if fast else None)
        week52_high   = safe_float("fiftyTwoWeekHigh", fast.get("year_high") if fast else None)
        week52_low    = safe_float("fiftyTwoWeekLow", fast.get("year_low") if fast else None)

        print(f"📊 Fundamentals for {symbol}: MCap={market_cap}, PE={trailing_pe}, Div={div_yield}, Vol={avg_volume}")

        return jsonify({
            "symbol":          symbol,
            "name":            (info.get("longName") or info.get("shortName") or symbol) if info else symbol,
            "currency":        (info.get("currency") or "USD") if info else "USD",
            "exchange":        (info.get("exchange") or "") if info else "",
            "currentPrice":    current_price,
            "volume":          current_volume,
            "averageVolume":   avg_volume,
            "marketCap":       market_cap,
            "trailingPE":      trailing_pe,
            "dividendYield":   round(div_yield * 100, 4) if div_yield is not None else None,
            "fiftyTwoWeekHigh": week52_high,
            "fiftyTwoWeekLow":  week52_low,
            "rsi":             rsi,
            "ma50":            ma50,
            "ma200":           ma200,
            "goldenCross":     golden_cross,
            "signal":          signal,
            "reason":          reason,
            "chartData":       chart_data,
        })

    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


# ── Health ────────────────────────────────────────────────────────────────────
@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "StockScanner Flask Backend"})


# ── Boot ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    port  = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    print(f"🚀 StockScanner Flask Backend → http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
