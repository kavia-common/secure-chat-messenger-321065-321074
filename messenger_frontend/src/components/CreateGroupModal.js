import React, { useState } from "react";
import { Modal } from "./Modal";

// PUBLIC_INTERFACE
export function CreateGroupModal({ onClose, onCreate }) {
  /** Modal to create a new group chat. */
  const [name, setName] = useState("");
  const [membersRaw, setMembersRaw] = useState("");
  const [error, setError] = useState("");

  function parseEmails(raw) {
    return raw
      .split(/[,\n]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return (
    <Modal
      title="Create group"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btnPrimary"
            onClick={async () => {
              setError("");
              try {
                const memberEmails = parseEmails(membersRaw);
                await onCreate?.({ name: name.trim(), memberEmails });
                onClose?.();
              } catch (e) {
                setError(e?.message || "Failed to create group.");
              }
            }}
            disabled={!name.trim()}
          >
            Create
          </button>
        </>
      }
    >
      <div className="formGrid">
        <div>
          <div className="label">Group name</div>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project Phoenix"
            autoFocus
          />
        </div>

        <div>
          <div className="label">Invite members (emails)</div>
          <textarea
            className="textarea"
            value={membersRaw}
            onChange={(e) => setMembersRaw(e.target.value)}
            placeholder={"alex@company.com, sam@company.com\n(optional)"}
          />
        </div>

        {error ? <div className="alert" role="alert">{error}</div> : null}
      </div>
    </Modal>
  );
}
