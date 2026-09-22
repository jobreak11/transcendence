import ProfileSettingForm from "../components/ProfileSettingForm";
import SiteHeader  from "../components/SiteHeader";

export default function SettingsPage() {
  const profile = {
    id: "260801-0101",
    displayName: "นั่งเทียน789",
    pronoun: "he/him",
    title: "เทพ Poker since 1942",
    signature: "แสงเทียนนี้จะส่องสว่างเมื่ออยู่ในใจเธอ >w<",
    imageUrl: "/images/candle-profile.jpg",
  };

  return (
    <div className="min-h-screen bg-[#252525] text-white">
      <SiteHeader activePage="settings" />

      <main
        className="min-h-[calc(100vh-190px)] px-4 py-16 sm:px-8 lg:px-16"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0 35%, transparent 40%)",
          backgroundSize: "20px 34px",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <h1 className="sr-only">Profile settings</h1>

          <ProfileSettingForm initialProfile={profile} />
        </div>
      </main>
    </div>
  );
}