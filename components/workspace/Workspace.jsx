"use client";
import { useState } from "react";
import NotebookList from "./NotebookList";
import NotebookEditor from "./NotebookEditor";

export default function Workspace() {
  const [openId, setOpenId] = useState(null);

  if (openId) {
    return <NotebookEditor notebookId={openId} onBack={() => setOpenId(null)} />;
  }
  return <NotebookList onOpen={setOpenId} />;
}
