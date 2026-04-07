"use client";

import { api } from "../../../convex/_generated/api";
import { useMutation, useConvexAuth } from "convex/react";
import { useEffect, useRef } from "react";

export function AuthBootstrap() {
  const { isAuthenticated } = useConvexAuth();
  const ensureViewerDefaults = useMutation(api.users.ensureViewerDefaults);
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || hasBootstrapped.current) {
      return;
    }
    hasBootstrapped.current = true;
    void ensureViewerDefaults({});
  }, [ensureViewerDefaults, isAuthenticated]);

  return null;
}
