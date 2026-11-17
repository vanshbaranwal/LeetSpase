
import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { byteArray, participantColorClass, remoteSpaseUpdate } from "./useCodingSpase";
import "./SpaseEditor.css";

function bindSpaseModel(text, model, monaco) {
  const origin = {};
  let applyingRemote = false;
  model.setValue(text.toString());
  const document = text.doc;
  const local = model.onDidChangeContent(({ changes }) => {
    if (applyingRemote) return;
    document.transact(() => {
      const ordered = [...changes].sort((first, second) => second.rangeOffset - first.rangeOffset);
      for (const { rangeOffset, rangeLength, text: inserted } of ordered) {
        if (rangeLength) text.delete(rangeOffset, rangeLength);
        if (inserted) text.insert(rangeOffset, inserted);
      }
    }, origin);
  });

  const remote = (event, transaction) => {
    if (transaction.origin === origin) return;
    let offset = 0;
    let start = 0;
    let removed = 0;
    let inserted = "";
    const edits = [];
    const appendEdit = () => {
      if (!removed && !inserted) return;
      const range = monaco.Range.fromPositions(model.getPositionAt(start), model.getPositionAt(start + removed));
      edits.push({ range, text: inserted, forceMoveMarkers: true });
      removed = 0;
      inserted = "";
    };
    for (const operation of event.delta) {
      if (operation.retain) {
        appendEdit();
        offset += operation.retain;
        start = offset;
      } else if (operation.delete) {
        removed += operation.delete;
        offset += operation.delete;
      } else if (typeof operation.insert === "string") {
        inserted += operation.insert;
      }
    }
    appendEdit();
    applyingRemote = true;
    try {
      if (edits.length) model.applyEdits(edits);
    } finally {
      applyingRemote = false;
    }
  };
  text.observe(remote);
  return {
    origin,
    destroy: () => { local.dispose(); text.unobserve(remote); },
  };
}

export default function SpaseEditor({ sharedSpase, onMount, options, ...props }) {
  const { doc, spase, isLive, access, cursors, members, updateDocument, sendCursor } = sharedSpase;
  const { problemId, language, revision } = spase;
  const [view, setView] = useState(null);
  const cursorLayer = useRef(null);

  useEffect(() => {
    if (!view || !doc) return;
    const { editor, monaco } = view;
    const model = editor.getModel();
    const text = doc.getText("code");
    model.setEOL(monaco.editor.EndOfLineSequence.LF);
    const binding = bindSpaseModel(text, model, monaco);
    const undo = new Y.UndoManager(text, { trackedOrigins: new Set([binding.origin]) });
    // Route keyboard undo through Yjs so undo only reverts this editor's changes.
    const undoAction = editor.addAction({
      id: "spase-undo", label: "Undo my spase edit", keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ],
      precondition: "editorTextFocus && !editorReadonly", run: () => undo.undo(),
    });
    const redoAction = editor.addAction({
      id: "spase-redo", label: "Redo my spase edit", keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ,
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY,
      ],
      precondition: "editorTextFocus && !editorReadonly", run: () => undo.redo(),
    });
    const onEdit = (update, origin) => {
      if (origin !== remoteSpaseUpdate && (origin === binding.origin || origin === undo)) {
        void updateDocument({ problemId, language, revision }, update).catch(() => {});
      }
    };
    doc.on("update", onEdit);

    const selectionEvent = editor.onDidChangeCursorSelection(({ selection, source }) => {
      if (source === "model" || !editor.hasTextFocus()) return;
      const position = (point) => {
        const offset = model.getOffsetAt(point);
        return Y.encodeRelativePosition(Y.createRelativePositionFromTypeIndex(text, Math.min(offset, text.length)));
      };
      sendCursor({ problemId, language, revision, anchor: position(selection.getSelectionStart()), head: position(selection.getPosition()) });
    });
    return () => {
      doc.off("update", onEdit);
      selectionEvent.dispose();
      undoAction.dispose();
      redoAction.dispose();
      binding.destroy();
      undo.destroy();
    };
  }, [view, doc, problemId, language, revision, updateDocument, sendCursor]);

  useEffect(() => {
    if (!view || !doc) return;
    const { editor, monaco } = view;
    const model = editor.getModel();
    const code = doc.getText("code");
    const decorations = editor.createDecorationsCollection();
    const labels = new Map();
    let currentCursors = {};

    const position = (bytes) => {
      try {
        return Y.createAbsolutePositionFromRelativePosition(Y.decodeRelativePosition(byteArray(bytes)), doc);
      } catch {
        return null;
      }
    };

    const renderCursors = () => {
      const marks = [];
      const visible = new Set();
      for (const cursor of Object.values(currentCursors)) {
        const anchor = position(cursor.anchor);
        const head = position(cursor.head);
        if (anchor?.type !== code || head?.type !== code) continue;

        const start = model.getPositionAt(Math.min(anchor.index, head.index));
        const end = model.getPositionAt(Math.max(anchor.index, head.index));
        const caret = model.getPositionAt(head.index);
        const colorClass = participantColorClass(cursor.colorIndex);
        marks.push(
          { range: monaco.Range.fromPositions(start, end), options: { className: `spase-editor-selection ${colorClass}` } },
          {
            range: monaco.Range.fromPositions(caret),
            options: {
              before: { content: "\u200b", inlineClassName: `spase-editor-caret ${colorClass}` },
              showIfCollapsed: true,
            },
          },
        );
        visible.add(cursor.userId);
        let label = labels.get(cursor.userId);
        const isNew = !label;
        if (!label) {
          const node = document.createElement("div");
          const widget = {
            getId: () => `spase-participant-${cursor.userId}`,
            getDomNode: () => node,
            getPosition: () => ({
              position: label.caret,
              preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE, monaco.editor.ContentWidgetPositionPreference.BELOW],
            }),
          };
          label = { node, widget, caret };
          labels.set(cursor.userId, label);
        }
        label.node.className = `spase-editor-cursor ${colorClass}`;
        label.node.textContent = cursor.name;
        label.caret = caret;
        if (isNew) editor.addContentWidget(label.widget);
        else editor.layoutContentWidget(label.widget);
      }

      decorations.set(marks);
      for (const [userId, label] of labels) {
        if (visible.has(userId)) continue;
        editor.removeContentWidget(label.widget);
        labels.delete(userId);
      }
    };

    cursorLayer.current = (nextCursors) => {
      currentCursors = nextCursors;
      renderCursors();
    };
    const change = model.onDidChangeContent(renderCursors);
    return () => {
      cursorLayer.current = null;
      change.dispose();
      decorations.clear();
      for (const label of labels.values()) editor.removeContentWidget(label.widget);
    };
  }, [view, doc]);

  useEffect(() => {
    const latestColors = new Map(members.map((member) => [member.id, member.colorIndex]));
    const currentCursors = Object.values(cursors).map((cursor) => ({
      ...cursor,
      colorIndex: latestColors.get(cursor.userId) ?? cursor.colorIndex,
    }));
    cursorLayer.current?.(currentCursors);
  }, [view, doc, cursors, members]);

  return (
    <Editor
      {...props}
      options={{ ...options, readOnly: !isLive || !access.canEdit }}
      onMount={(editor, monaco) => {
        onMount(editor, monaco);
        setView({ editor, monaco });
      }}
    />
  );
}
