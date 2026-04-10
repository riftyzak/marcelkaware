"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StateCard } from "@/components/ui/state-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buildCommunityProfilePath } from "../../../shared/forum";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type EditableLink = {
  label: string;
  url: string;
};

const emptyLinks: EditableLink[] = [
  { label: "", url: "" },
  { label: "", url: "" },
  { label: "", url: "" },
  { label: "", url: "" },
];

export function CommunityProfileSettings() {
  const profile = useQuery(api.users.viewerCommunityProfileEditor, {});
  const updateProfile = useMutation(api.users.updateViewerCommunityProfile);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [links, setLinks] = useState<EditableLink[]>(emptyLinks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setBio(profile.bio ?? "");
    setLocation(profile.location ?? "");
    setLinks(
      [...(profile.links ?? []), ...emptyLinks].slice(0, 4).map((item) => ({
        label: item.label ?? "",
        url: item.url ?? "",
      })),
    );
  }, [profile]);

  const publicProfilePath = useMemo(() => {
    if (!profile?.publicUserNumber) {
      return null;
    }

    return buildCommunityProfilePath({
      handle: profile.handle ?? null,
      displayName: profile.displayName,
      publicUserNumber: profile.publicUserNumber,
    });
  }, [profile]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile({
        bio,
        location,
        links: links.filter((item) => item.label.trim() || item.url.trim()),
      });
      setSuccess("Profile updated.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (profile === undefined) {
    return <p className="text-sm text-[color:var(--text-muted)]">Loading profile settings...</p>;
  }

  if (!profile) {
    return (
      <StateCard
        actionHref="/login"
        actionLabel="Open login"
        description="Sign in to manage your profile."
        title="Authentication required"
      />
    );
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Community", href: "/community" }, { label: "Edit profile" }]} />

      <div className="space-y-2 border-b border-[color:var(--border)] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">Profile settings</h1>
          {publicProfilePath ? (
            <Link href={publicProfilePath}>
              <Button variant="secondary">View public profile</Button>
            </Link>
          ) : null}
        </div>
        <p className="max-w-2xl text-sm leading-7 text-[color:var(--text-muted)]">
          Update the public profile shown inside the community. Changes apply to your forum-facing profile only.
        </p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--text)]" htmlFor="profile-bio">
            Bio
          </label>
          <Textarea
            id="profile-bio"
            maxLength={280}
            onChange={(event) => setBio(event.target.value)}
            placeholder="A short profile bio shown on your community profile."
            rows={5}
            value={bio}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--text)]" htmlFor="profile-location">
            Location
          </label>
          <Input
            id="profile-location"
            maxLength={80}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="City, country, or timezone"
            value={location}
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-[color:var(--text)]">Links</h2>
            <p className="text-xs text-[color:var(--text-dim)]">Up to 4 links. Use full https:// URLs.</p>
          </div>
          <div className="space-y-3">
            {links.map((item, index) => (
              <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]" key={`profile-link-${index}`}>
                <Input
                  maxLength={40}
                  onChange={(event) =>
                    setLinks((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, label: event.target.value } : entry,
                      ),
                    )
                  }
                  placeholder="Label"
                  value={item.label}
                />
                <Input
                  onChange={(event) =>
                    setLinks((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, url: event.target.value } : entry,
                      ),
                    )
                  }
                  placeholder="https://..."
                  value={item.url}
                />
              </div>
            ))}
          </div>
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

        <Button disabled={saving} type="submit">
          {saving ? "Saving..." : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
