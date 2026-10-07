import SurfaceCard from "./SurfaceCard";

export default function LoadingCard({ message = "Loading…" }: { message?: string }) {
  return <SurfaceCard className="animate-pulse text-center text-zinc-300">{message}</SurfaceCard>;
}
