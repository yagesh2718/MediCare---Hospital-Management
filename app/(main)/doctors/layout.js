export const metadata = {
  title: "Find Doctors - MediCare",
  description: "Browse and book appointments with top healthcare providers",
};

export default async function DoctorsLayout({ children }) {
  return (
    <div className="container mx-auto px-4 py-12 mt-20">
      <div className="max-w-6xl mx-auto">{children}</div>
    </div>
  );
}