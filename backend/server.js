import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { loadBackendEnv } from "./env.js";

const env = loadBackendEnv();

// 1. Database Connection
mongoose.connect('mongodb+srv://MohitKumar:t4dASmyBlUXAQhDf@cluster0.buzokvu.mongodb.net/taskdb?retryWrites=true&w=majority')
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// 2. Define Schema and Model
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  status: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
});
``
const Item = mongoose.model("Item", itemSchema);

const clients = new Set();
const corsHeaders = {
  "Access-Control-Allow-Origin": env.corsOrigin,
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    ...corsHeaders
  });
  res.end(JSON.stringify(payload));
}

function broadcast(event) {
  const message = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    client.write(message);
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } 
      catch { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // SSE Events Endpoint
  if (req.method === "GET" && pathname === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      ...corsHeaders
    });
    
    const allItems = await Item.find().sort({ updatedAt: -1 });
    res.write(`data: ${JSON.stringify({ type: "snapshot", payload: allItems })}\n\n`);

    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  // GET All Items
  if (req.method === "GET" && pathname === "/items") {
    const items = await Item.find().sort({ updatedAt: -1 });
    sendJson(res, 200, items);
    return;
  }

  // POST Create Item
if (req.method === "POST" && pathname === "/items") {
  try {
    // 1. Read body safely
    const payload = await readBody(req);

    console.log("Incoming Data:", payload); // 🔥 debug

    // 2. Validate input (VERY IMPORTANT)
    if (!payload || !payload.name) {
      return sendJson(res, 400, { message: "Name is required" });
    }

    // 3. Create item
    const item = await Item.create({
      name: payload.name,
      description: payload.description || "",
      status: payload.status || "pending"
    });

    // 4. Broadcast (optional safety)
    if (typeof broadcast === "function") {
      broadcast({ type: "created", payload: item });
    }

    // 5. Send success response
    sendJson(res, 201, item);

  } catch (error) {
    // 🔥 Proper error logging
    console.error("POST /items ERROR:", error);

    // 6. Better error response
    sendJson(res, 500, {
      message: "Internal Server Error",
      error: error.message
    });
  }

  return;
}

  // PUT / DELETE by ID
  if (pathname.startsWith("/items/")) {
    const id = pathname.split("/")[2];

    if (req.method === "PUT") {
      try {
        const payload = await readBody(req);
        const updatedItem = await Item.findByIdAndUpdate(
          id, 
          { ...payload, updatedAt: new Date() }, 
          { new: true }
        );
        if (!updatedItem) return sendJson(res, 404, { message: "Not found" });
        
        broadcast({ type: "updated", payload: updatedItem });
        sendJson(res, 200, updatedItem);
      } catch (error) {
        sendJson(res, 400, { message: error.message });
      }
      return;
    }

    if (req.method === "DELETE") {
      const deletedItem = await Item.findByIdAndDelete(id);
      if (!deletedItem) return sendJson(res, 404, { message: "Not found" });
      
      broadcast({ type: "deleted", payload: deletedItem });
      sendJson(res, 200, deletedItem);
      return;
    }
  }

  sendJson(res, 404, { message: "Resource not found" });
});

server.listen(env.port, () => {
  console.log(`API server listening on http://localhost:${env.port}`);
});