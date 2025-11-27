import React, { useState, useEffect } from "react";
import "./Page.css";
import "./Events.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

function Events() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    loadEvents();
    loadStats();
  }, [limit, filter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: limit.toString() });
      if (filter) {
        params.append("event", filter);
      }

      const response = await fetch(`${API_BASE}/events?${params}`);
      const data = await response.json();
      setEvents(data.events || data);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/events/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const deleteAllEvents = async () => {
    if (
      !window.confirm(
        "Tem certeza que deseja apagar TODOS os eventos? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/events`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        alert(
          `Todos os eventos foram apagados (${data.deletedCount} eventos removidos)`
        );
        // Recarrega os eventos e estatísticas
        loadEvents();
        loadStats();
      }
    } catch (error) {
      console.error("Erro ao apagar eventos:", error);
      alert("Erro ao apagar eventos. Tente novamente.");
    }
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleString("pt-BR");
  };

  const formatPayload = (payload) => {
    if (!payload) return "-";
    return JSON.stringify(payload, null, 2);
  };

  return (
    <div className="Page">
      <h1>Event Log</h1>

      <div className="Events-controls">
        <div className="Events-filter">
          <label>Filtrar por evento:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="GAME_START">GAME_START</option>
            <option value="GAME_STARTED">GAME_STARTED</option>
            <option value="USER_CLICK">USER_CLICK</option>
            <option value="USER_NAVIGATE">USER_NAVIGATE</option>
            <option value="USER_TRY_EXIT">USER_TRY_EXIT</option>
            <option value="CLIPPY_APPEAR">CLIPPY_APPEAR</option>
            <option value="CLIPPY_INTERRUPT">CLIPPY_INTERRUPT</option>
          </select>
        </div>

        <div className="Events-limit">
          <label>Limite:</label>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
            min="1"
            max="1000"
          />
        </div>

        <button onClick={loadEvents}>Atualizar</button>
        <button onClick={deleteAllEvents} className="Events-delete-btn">
          Apagar Todos
        </button>
      </div>

      <div className="Events-stats">
        <h2>Estatísticas</h2>
        <div className="Stats-grid">
          {Object.entries(stats).map(([event, count]) => (
            <div key={event} className="Stat-item">
              <span className="Stat-name">{event}:</span>
              <span className="Stat-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="Events-list">
        <h2>Eventos ({events.length})</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : events.length === 0 ? (
          <p>Nenhum evento encontrado.</p>
        ) : (
          <div className="Events-table-container">
            <table className="Events-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Evento</th>
                  <th>Session ID</th>
                  <th>ID Elemento</th>
                  <th>Payload</th>
                  <th>Timestamp</th>
                  <th>Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.id}</td>
                    <td className="Event-name">{event.event}</td>
                    <td>
                      <code className="Events-session-id">
                        {event.sessionId || "-"}
                      </code>
                    </td>
                    <td>{event.payload?.id || "-"}</td>
                    <td className="Event-payload">
                      <pre>{formatPayload(event.payload)}</pre>
                    </td>
                    <td>{event.ts}</td>
                    <td>{formatTimestamp(event.ts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Events;
