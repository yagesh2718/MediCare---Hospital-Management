"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import {
  BadgePlus,
  Calendar,
  Coins,
  Pencil,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { Badge } from "./ui/badge";

export default function HeaderAuth() {
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [credits, setCredits] = useState("");
  const [image, setImage] = useState("");
  const dropdownRef = useRef();
  const [_, forceUpdate] = useState(false);
  const { data: session, update } = useSession();

  const toggleDropdown = () => setOpen((prev) => !prev);

  // Sync session name/image once it's available
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setImage(session.user.image || "");
      setCredits(session.user.credits || 0)
    }
  }, [session]);

  const handleUpdate = async () => {
    const res = await fetch("/api/update-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email, name, image }),
    });

    if (res.ok) {
      await update({ name, image }); // 👈 this refreshes session data
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
        <Link href="/login">
          <Button
            className="cursor-pointer w-20 border-1 border-white hover:bg-black hover:border-gray-500"
            variant="secondary"
          >
            Login
          </Button>
        </Link>
        <Link href="/signup">
          <Button
            className="cursor-pointer w-20 border-1 border-white hover:bg-black hover:border-gray-500"
            variant="secondary"
          >
            Signup
          </Button>
        </Link>
      </div>
    );
  }

  return (
  
    <div className="relative" ref={dropdownRef}>
      {console.log("user is",session.user)}
      <div className="flex items-center gap-3">
        {/* Role-based links */}
        {session?.user?.role === "ADMIN" && (
          <Link href="/admin">
            <Button
              variant="outline"
              className="hidden md:inline-flex items-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Dashboard
            </Button>
            <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
              <ShieldCheck className="h-4 w-4" />
            </Button>
          </Link>
        )}

        {session?.user?.role === "DOCTOR" && (
          <Link href="/doctor">
            <Button
              variant="outline"
              className="hidden md:inline-flex items-center gap-2"
            >
              <Stethoscope className="h-4 w-4" />
              Doctor Dashboard
            </Button>
            <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
              <Stethoscope className="h-4 w-4" />
            </Button>
          </Link>
        )}

        {session?.user?.role === "PATIENT" && (
          <>
            <Badge
              variant="outline"
              className="bg-emerald-900/30 border-emerald-700/30 h-8 px-4 py-1 text-emerald-400 text-sm font-medium md:inline-flex items-center gap-2"
            >
               <Coins className="w-5 h-5 text-emerald-500" />
              
               {console.log("credits" , session.user)}
              {session.user.credits} Credits
            </Badge>
            <Link href="/appointments">
              <Button
                variant="outline"
                className="hidden md:inline-flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                My Appointments
              </Button>
              <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                <Calendar className="h-4 w-4" />
              </Button>
            </Link>
          </>
        )}

        {session?.user?.role === "UNASSIGNED" && (
          <Link href="/onboarding">
            <Button
              variant="outline"
              className="hidden md:inline-flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Complete Profile
            </Button>
            <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
              <User className="h-4 w-4" />
            </Button>
          </Link>
        )}

        {/* Profile Image with Dropdown */}
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
                        <Pencil
                          size={14}
                          className="text-zinc-400 hover:text-white"
                        />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-zinc-400 truncate">
                    {session.user.email}
                  </p>
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
      </div>
    </div>
  );
}
