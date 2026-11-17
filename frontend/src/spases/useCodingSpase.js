
import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import * as Y from "yjs";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";

const socketUrl = import.meta.env.VITE_SPASE_SOCKET_URL ||
  (import.meta.env.DEV ? "http://localhost:8080" : "https://leetspase.onrender.com");

export const remoteSpaseUpdate = Symbol("remote spase update");
const terminalCodes = ["SESSION_REPLACED", "SPASE_FORBIDDEN", "SPASE_UNAVAILABLE", "SPASE_LEFT"];
const sameDocument = (workspace, target) => workspace && target && workspace.spase.revision === target.revision &&
  workspace.spase.problemId === target.problemId && workspace.spase.language === target.language;

export const participantColorClass = (index) => Number.isInteger(index) && index >= 0 && index < 5
  ? `spase-color-${index}` : "";

export const byteArray = (value) => value instanceof Uint8Array ? value : new Uint8Array(value);

export function useCodingSpase(spaseId) {
  const userId = useAuthStore((state) => state.authUser?.id);
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [cursors, setCursors] = useState({});
  const [initialAccess, setInitialAccess] = useState(null);
  const ownRole = members.find((member) => member.id === userId)?.role;
  const access = ownRole ? { isHost: ownRole === "HOST", canEdit: ownRole !== "VIEWER" } : initialAccess;
  const [connection, setConnection] = useState("connecting");
  const [ended, setEnded] = useState("");
  const [notice, setNotice] = useState("");
  const socketRef = useRef(null);
  const sessionRef = useRef(null);
  const activeWorkspace = useRef(null);
  const edits = useRef(Promise.resolve());
  const unsynced = useRef(false);

  const send = useCallback(async (event, payload = {}) => {
    const socket = socketRef.current;
    if (!socket?.connected) throw new Error("The spase is reconnecting. Try again when it is live.");
    const reply = await socket.timeout(8_000).emitWithAck(event, payload);
    if (!reply?.ok) throw Object.assign(new Error(reply?.message || "The spase request failed."), { code: reply?.code });
    return reply;
  }, []);

  const applyWorkspace = useCallback(({ spase, document }, replace = false) => {
    const current = activeWorkspace.current;
    if (current?.spase.revision > spase.revision) return;
    if (!replace && sameDocument(current, spase)) {
      if (document && current.doc) Y.applyUpdate(current.doc, byteArray(document), remoteSpaseUpdate);
      if (current.spase.hostId !== spase.hostId) {
        const next = { ...current, spase };
        activeWorkspace.current = next;
        setWorkspace(next);
      }
      return;
    }
    const doc = document ? new Y.Doc() : null;
    if (doc) Y.applyUpdate(doc, byteArray(document), remoteSpaseUpdate);
    const next = { spase, doc };
    activeWorkspace.current = next;
    current?.doc?.destroy();
    setWorkspace(next);
    setCursors({});
  }, []);

  useEffect(() => {
    let active = true;
    let terminal = false;
    const end = ({ message }) => {
      terminal = true;
      setEnded(message);
      socket.disconnect();
    };
    const requestTicket = () => {
      if (!sessionRef.current) {
        sessionRef.current = axiosInstance.post(`/spases/${spaseId}/session`).then(({ data }) => data);
        return sessionRef.current;
      }
      return sessionRef.current.then(({ sessionId }) =>
        axiosInstance.post(`/spases/${spaseId}/session`, { sessionId }).then(({ data }) => data));
    };

    const socket = io(socketUrl, {
      autoConnect: false,
      transports: ["websocket"],
      auth: (callback) => {
        void requestTicket().then(({ ticket }) => {
          if (active && !terminal) callback({ ticket });
        }).catch((error) => {
          if (!active) return;
          const data = error.response?.data;
          if (terminalCodes.includes(data?.code)) end(data);
          else {
            sessionRef.current = null;
            setNotice(data?.message || "Could not start the spase session.");
            setConnection("unavailable");
            socket.disconnect();
          }
        });
      },
    });
    socketRef.current = socket;

    const sync = async () => {
      const state = await send("spase:sync");
      if (!active || terminal) return;
      applyWorkspace(state, unsynced.current);
      unsynced.current = false;
      setJobs(state.jobs);
      setInitialAccess({ canEdit: state.canEdit, isHost: state.isHost });
      setConnection("live");
    };

    socket.on("spase:ready", () => {
      void sync().catch((error) => {
        if (active && !terminal) {
          if (terminalCodes.includes(error.code)) end(error);
          else {
            setNotice(error.message);
            setConnection("unavailable");
            socket.disconnect();
          }
        }
      });
    });
    socket.on("spase:workspace", applyWorkspace);
    socket.on("spase:members", setMembers);
    socket.on("spase:jobs", setJobs);
    socket.on("spase:edit", (target) => {
      const current = activeWorkspace.current;
      if (sameDocument(current, target) && current.doc) {
        Y.applyUpdate(current.doc, byteArray(target.update), remoteSpaseUpdate);
      }
    });
    socket.on("spase:cursor", (cursor) => {
      if (sameDocument(activeWorkspace.current, cursor)) {
        setCursors((previous) => ({ ...previous, [cursor.userId]: cursor }));
      }
    });
    socket.on("spase:cursor-left", (userId) => {
      setCursors((previous) => {
        const next = { ...previous };
        delete next[userId];
        return next;
      });
    });
    socket.on("spase:ended", end);
    socket.on("disconnect", () => {
      if (active && !terminal) {
        setConnection("connecting");
        setCursors({});
      }
    });
    socket.on("connect_error", (error) => {
      if (terminalCodes.includes(error.data?.code)) end(error);
      else if (!socket.active) {
        setConnection("unavailable");
        setNotice(error.message);
      }
    });
    socket.connect();

    return () => {
      active = false;
      socket.disconnect();
      activeWorkspace.current?.doc?.destroy();
      activeWorkspace.current = null;
      socketRef.current = null;
    };
  }, [applyWorkspace, spaseId, send]);

  const updateDocument = useCallback((target, update) => {
    const task = edits.current.then(() => send("spase:edit", { ...target, update }));
    edits.current = task.catch(async (error) => {
      unsynced.current = true;
      setNotice(error.message || "An edit could not be synced.");
      try {
        const state = await send("spase:sync");
        applyWorkspace(state, true);
        unsynced.current = false;
      } catch {
        // The next authorized connection will restore the shared draft.
      }
    });
    return task;
  }, [applyWorkspace, send]);

  const sendCursor = useCallback((payload) => {
    socketRef.current?.volatile.emit("spase:cursor", payload);
  }, []);

  const action = async (event, payload) => {
    await edits.current;
    try {
      setNotice("");
      await send(event, payload);
      return true;
    } catch (error) {
      setNotice(error.message);
      return false;
    }
  };

  const reconnect = () => {
    setConnection("connecting");
    setNotice("");
    socketRef.current?.connect();
  };

  return {
    workspace, members, jobs, cursors, access, connection, ended, notice,
    action, updateDocument, sendCursor, reconnect,
  };
}
