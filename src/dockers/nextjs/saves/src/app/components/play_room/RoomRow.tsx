import Image from "next/image";
import type { JoinRole, Room } from "../../../lib/types";
import defaultProfilePic from "../../../public/defaultProfilePic.svg"

type RoomRowProps = {
  room: Room;
  onJoin: (room: Room, role: JoinRole) => void;
};

export default function RoomRow({ room, onJoin }: RoomRowProps) {
  return (
    <div className="flex items-center gap-4 border-b border-[#aaa] py-[1%] max-[800px]:items-start max-[520px]:flex-col">
      <div className="relative size-[7vw] min-h-19 min-w-19 overflow-hidden max-[800px]:size-16 max-[800px]:min-h-16 max-[800px]:min-w-16 max-[520px]:self-center">
        <Image
          src={defaultProfilePic}
          alt="Host profile"
          fill
          sizes="100px"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="grid grid-cols-[1fr_2fr] gap-4 max-[800px]:grid-cols-1">
          <span>Host: {room.host}</span>
          <span>Catchphrase: {room.catchphrase}</span>
        </div>
        <div className="grid grid-cols-[1fr_2fr_2fr] gap-4 max-[800px]:grid-cols-1">
          <span>Private: {room.isPrivate ? "Yes" : "No"}</span>
          <JoinGroup
            label={`Players: ${room.players}/${room.maxPlayers}`}
            onClick={() => onJoin(room, "player")}
          />
          <JoinGroup
            label={`Spectators: ${room.spectators}/${room.maxSpectators}`}
            onClick={() => onJoin(room, "spectator")}
          />
        </div>
      </div>
    </div>
  );
}

function JoinGroup({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <span className="flex items-center gap-4 max-[800px]:justify-between">
      <span>{label}</span>
      <button
        type="button"
        className="inline-flex cursor-pointer items-center justify-center rounded-lg border-0 bg-red-600 px-2.5 py-2 text-[clamp(14px,calc(6px+2vw),20px)] font-bold text-white hover:bg-red-700 focus-visible:bg-red-700"
        onClick={onClick}
      >
        Join
      </button>
    </span>
  );
}
