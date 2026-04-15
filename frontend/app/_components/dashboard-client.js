"use client";

import { useEffect, useMemo, useState } from "react";

const EMPTY_FORM = { name: "", description: "", status: "Todo" };

function upsertItem(list, item) {
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index === -1) {
    return [item, ...list];
  }

  return list.map((entry) => (entry.id === item.id ? item : entry));
}

export default function DashboardClient({ initialItems, appName }) {
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState("Connecting...");

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.onopen = () => setConnection("Live updates connected");
    source.onerror = () => setConnection("Live updates disconnected");
    source.onmessage = (event) => {
      const message = JSON.parse(event.data);

      setItems((current) => {
        if (message.type === "snapshot") {
          return message.payload;
        }

        if (message.type === "created" || message.type === "updated") {
          return upsertItem(current, message.payload);
        }

        if (message.type === "deleted") {
          return current.filter((item) => item.id !== message.payload.id);
        }

        return current;
      });
    };

    return () => {
      source.close();
    };
  }, []);

  const itemCountLabel = useMemo(() => `${items.length} total`, [items.length]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const endpoint = editingId ? `/api/items/${editingId}` : "/api/items";
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const failure = await response.json();
        throw new Error(failure.message || "Request failed");
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      status: item.status
    });
  }

  async function removeItem(id) {
    setError("");

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const failure = await response.json();
        throw new Error(failure.message || "Delete failed");
      }

      if (editingId === id) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Next.js + Node.js</p>
          <h1>{appName}</h1>
          <p className="hero-copy">
            Create, update, and remove records from the UI while the dashboard syncs in real time.
          </p>
        </div>
        <div className="status-card">
          <span className="status-indicator" />
          <div>
            <p className="status-label">Connection</p>
            <strong>{connection}</strong>
          </div>
        </div>
      </section>

      <section className="grid">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <h2>{editingId ? "Edit item" : "Create item"}</h2>
            {editingId ? (
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>

          <label>
            Name
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Add a title"
            />
          </label>

          <label>
            Description
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Add context"
            />
          </label>

          <label>
            Status
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </label>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editingId ? "Update item" : "Create item"}
          </button>

          {error ? <p className="error-text">{error}</p> : null}
        </form>

        <section className="panel list-panel">
          <div className="panel-heading">
            <h2>Items</h2>
            <span>{itemCountLabel}</span>
          </div>

          {items.length === 0 ? (
            <p className="empty-state">No items yet. Create one to see live updates kick in.</p>
          ) : null}

          <div className="item-list">
            {items.map((item) => (
              <article className="item-card" key={item.id}>
                <div className="item-header">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.description || "No description provided."}</p>
                  </div>
                  <span className={`badge badge-${item.status.toLowerCase().replace(/\s+/g, "-")}`}>
                    {item.status}
                  </span>
                </div>

                <div className="item-footer">
                  <small>Updated {new Date(item.updatedAt).toLocaleString()}</small>
                  <div className="actions">
                    <button className="ghost-button" type="button" onClick={() => startEdit(item)}>
                      Edit
                    </button>
                    <button className="danger-button" type="button" onClick={() => removeItem(item.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
