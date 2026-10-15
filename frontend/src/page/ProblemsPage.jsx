import { useEffect, useMemo, useState } from "react";
import { Loader } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ProblemTable from "../components/ProblemTable";
import PlaylistSidebar from "../components/PlaylistSidebar";
import { useAuthStore } from "../store/useAuthStore";
import { usePlaylistStore } from "../store/usePlaylistStore";
import { useProblemStore } from "../store/useProblemStore";

const trackIds = new Set(["python", "java", "javascript"]);

const getProblemTrack = (problem) => {
  const track = problem.track || problem.languageTrack || problem.collection;
  return typeof track === "string" ? track.toLowerCase() : "";
};

const ProblemsPage = () => {
  const { authUser } = useAuthStore();
  const { getAllProblems, problems, isProblemsLoading } = useProblemStore();
  const { getAllPlaylists, playlists, isLoading: isPlaylistsLoading } = usePlaylistStore();
  const [selectedCollection, setSelectedCollection] = useState({
    type: "all",
    id: "all",
    name: "All Problems",
  });
  const [selectedTag, setSelectedTag] = useState("ALL");
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const playlistParam = searchParams.get("playlist");

  const handleProblemSearch = (event) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    const value = event.target.value;

    if (value) {
      nextSearchParams.set("search", value);
    } else {
      nextSearchParams.delete("search");
    }

    setSearchParams(nextSearchParams, { replace: true });
  };

  useEffect(() => {
    getAllProblems();
  }, [getAllProblems]);

  useEffect(() => {
    if (authUser) getAllPlaylists();
  }, [authUser, getAllPlaylists]);

  const generalProblems = useMemo(
    () => problems.filter((problem) => !trackIds.has(getProblemTrack(problem))),
    [problems]
  );

  const linkedPlaylist = useMemo(
    () => playlistParam ? playlists.find((playlist) => playlist.id === playlistParam) : null,
    [playlistParam, playlists]
  );

  const activeCollection = linkedPlaylist
    ? { type: "playlist", id: linkedPlaylist.id, name: linkedPlaylist.name }
    : selectedCollection;

  const selectedPlaylist = useMemo(() => {
    if (activeCollection.type !== "playlist") return null;
    return playlists.find((playlist) => playlist.id === activeCollection.id) || null;
  }, [activeCollection.id, activeCollection.type, playlists]);

  const displayedProblems = useMemo(() => {
    if (activeCollection.type === "track") {
      return problems.filter(
        (problem) => getProblemTrack(problem) === activeCollection.id
      );
    }

    if (activeCollection.type === "playlist") {
      return (selectedPlaylist?.problems || [])
        .map((playlistProblem) => playlistProblem.problem)
        .filter(Boolean);
    }

    return generalProblems;
  }, [activeCollection.id, activeCollection.type, generalProblems, problems, selectedPlaylist]);

  const tags = useMemo(() => {
    const counts = new Map();

    displayedProblems.forEach((problem) => {
      (problem.tags || []).forEach((tag) => {
        const normalizedTag = tag.trim();
        if (!normalizedTag) return;

        const key = normalizedTag.toLowerCase();
        const existingTag = counts.get(key);
        counts.set(key, {
          name: existingTag?.name || normalizedTag,
          count: (existingTag?.count || 0) + 1,
        });
      });
    });

    return Array.from(counts.values()).sort(
      (firstTag, secondTag) =>
        secondTag.count - firstTag.count || firstTag.name.localeCompare(secondTag.name)
    );
  }, [displayedProblems]);

  const handleSelectCollection = (collection) => {
    setSelectedCollection(collection);
    setSelectedTag("ALL");
    const nextSearchParams = new URLSearchParams(searchParams);

    if (collection.type === "playlist") {
      nextSearchParams.set("playlist", collection.id);
    } else {
      nextSearchParams.delete("playlist");
    }

    setSearchParams(nextSearchParams, { replace: true });
  };

  const emptyMessage = activeCollection.type === "track"
    ? `${activeCollection.name} questions have not been added yet.`
    : activeCollection.type === "playlist"
      ? "This playlist does not contain any problems yet."
      : "No problems found.";

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1500px] overflow-x-clip px-4 pb-24 pt-10 text-white sm:px-6">
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          {isProblemsLoading ? (
            <div className="grid min-h-80 place-items-center">
              <Loader className="h-8 w-8 animate-spin text-white/60" />
            </div>
          ) : (
            <ProblemTable
              problems={displayedProblems}
              numberingProblems={activeCollection.type === "track" ? displayedProblems : generalProblems}
              searchQuery={searchQuery}
              onSearchChange={handleProblemSearch}
              selectedTag={selectedTag}
              title={activeCollection.name}
              emptyMessage={emptyMessage}
            />
          )}
        </section>

        <PlaylistSidebar
          playlists={playlists}
          selectedCollection={activeCollection}
          onSelectCollection={handleSelectCollection}
          allProblemCount={generalProblems.length}
          problemCount={displayedProblems.length}
          isAuthenticated={Boolean(authUser)}
          isLoading={isPlaylistsLoading}
          tags={tags}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
        />
      </div>
    </main>
  );
};

export default ProblemsPage;
