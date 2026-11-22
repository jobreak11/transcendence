import PublicProfilePage from
  "../../components/profile/PublicProfilePage";

type PageProps = {
  params: Promise<{
    tagId: string;
  }>;
};

export default async function Page({
  params,
}: PageProps) {
  const { tagId } = await params;

  return (
    <PublicProfilePage
      tagId={tagId}
    />
  );
}


// type PageProps = {
//   params: Promise<{
//     tagId: string;
//   }>;
// };

// export default async function Page({
//   params,
// }: PageProps) {
//   const { tagId } = await params;

//   return (
//     <main className="min-h-screen bg-black p-10 text-white">
//       <h1>Public Profile Route</h1>

//       <p>
//         Tag ID from URL: {tagId}
//       </p>
//     </main>
//   );
// }