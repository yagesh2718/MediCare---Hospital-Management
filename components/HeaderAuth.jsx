"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { Pencil } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

export default function HeaderAuth() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const dropdownRef = useRef();
  const [_, forceUpdate] = useState(false);

  const toggleDropdown = () => setOpen((prev) => !prev);

  // Sync session name/image once it's available
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setImage(session.user.image || "");
    }
  }, [session]);

 const handleUpdate = async () => {
  const res = await fetch("/api/update-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: session.user.email, name, image }),
  });

  if (res.ok) {
    session.user.name = name;
    session.user.image = image;
    forceUpdate(v => !v); // trigger rerender
    setEditingName(false);
    setOpen(false);
  } else {
    alert("Update failed");
  }
};

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setEditingName(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!session?.user) {
    return (
      <div className="flex gap-4">
        <Link href="/login" >
          <Button className="cursor-pointer w-20 border-1 border-white hover:bg-black hover:border-gray-500" variant="secondary">Login</Button>
        </Link>
        <Link href="/signup" >
          <Button className="cursor-pointer w-20 border-1 border-white hover:bg-black hover:border-gray-500"  variant="secondary">Signup</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
  <img
    src={session.user.image || "/default-avatar.png"}
    alt="User"
    className="h-10 w-10 rounded-full cursor-pointer border border-blue-500"
    onClick={toggleDropdown}
  />

  {open && (
    <div className="absolute right-0 mt-2 w-72 p-4 bg-zinc-900 text-white shadow-xl border border-zinc-700 rounded-xl z-50">
      {/* User Profile Row */}
      <div className="flex items-center gap-3">
        <img
          src={image || "/default-avatar.png"}
          alt="Avatar"
          className="h-12 w-12 rounded-full object-cover border border-zinc-700"
        />
        <div className="flex-1">
          {editingName ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-800 border-b border-zinc-600 px-2 py-1 text-sm w-full text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
              autoFocus
            />
          ) : (
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm truncate">{name}</p>
              <button onClick={() => setEditingName(true)}>
                <Pencil size={14} className="text-zinc-400 hover:text-white" />
              </button>
            </div>
          )}
          <p className="text-xs text-zinc-400 truncate">{session.user.email}</p>
        </div>
      </div>

      {/* Image URL Input */}
      <input
        type="text"
        placeholder="Profile photo URL"
        value={image}
        onChange={(e) => setImage(e.target.value)}
        className="mt-3 bg-zinc-800 text-white border border-zinc-600 px-2 py-1 w-full rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {/* Action Buttons */}
      <div className="flex justify-between mt-4">
        <button
          onClick={handleUpdate}
          className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded transition"
        >
          Save
        </button>
        <Button
          onClick={() => signOut()}
          className="text-sm bg-red-600 text-white "
        >
          Logout
        </Button>
      </div>
    </div>
  )}
</div>

  );
}
