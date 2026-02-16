import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";

// PUBLIC_INTERFACE
export function MembersModal({
  chat,
  loadMembers,
  onAddMember,
  onRemoveMember,
  onClose
}) {
  /** Modal for viewing/adding/removing group members. */
  const [members, setMembers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");

  const isGroup = useMemo(() => Boolean(chat?.isGroup ?? true), [chat]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!chat) return;
      setBusy(true);
      setError("");
      try {
        const data = await loadMembers?.(chat.id);
        const list = data?.members || data || [];
        if (!cancelled) setMembers(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load members.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [chat, loadMembers]);

  return (
    <Modal
      title="Group members"
      onClose={onClose}
      footer={<button className="btn" onClick={onClose}>Close</button>}
    >
      {!isGroup ? (
        <div className="alert">This conversation is not a group.</div>
      ) : null}

      <div className="formGrid">
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <div className="label">Add member by email</div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="new.member@company.com"
            />
          </div>
          <button
            className="btn btnPrimary"
            onClick={async () => {
              setError("");
              try {
                await onAddMember?.(chat.id, { email: email.trim() });
                setEmail("");
                const data = await loadMembers?.(chat.id);
                const list = data?.members || data || [];
                setMembers(Array.isArray(list) ? list : []);
              } catch (e) {
                setError(e?.message || "Failed to add member.");
              }
            }}
            disabled={!email.trim()}
          >
            Add
          </button>
        </div>

        {busy ? <div className="kbdHint">Loading members…</div> : null}
        {error ? <div className="alert" role="alert">{error}</div> : null}

        <div>
          <div className="label">Current members</div>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            {members.length === 0 ? (
              <div className="kbdHint">No members found.</div>
            ) : members.map((m, idx) => {
              const id = m.id || m.userId || m.email || idx;
              const name = m.displayName || m.name || m.email || "Member";
              const secondary = m.email ? `(${m.email})` : "";
              return (
                <div
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    background: "var(--surface-2)"
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {name} <span style={{ color: "var(--muted)", fontWeight: 800, fontSize: 12 }}>{secondary}</span>
                    </div>
                  </div>
                  <button
                    className="btn btnSmall btnDanger"
                    onClick={async () => {
                      setError("");
                      try {
                        const userId = m.id || m.userId;
                        if (!userId) throw new Error("Member id missing from API response.");
                        await onRemoveMember?.(chat.id, userId);
                        const data = await loadMembers?.(chat.id);
                        const list = data?.members || data || [];
                        setMembers(Array.isArray(list) ? list : []);
                      } catch (e) {
                        setError(e?.message || "Failed to remove member.");
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
