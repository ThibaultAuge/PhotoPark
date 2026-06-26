import { BodyProvider } from "@/components/body/BodyProvider";
import { listBodies, listBodyReferenceData } from "@/lib/db/body-repository";

export default function BodiesLayout({ children }: { children: React.ReactNode }) {
  return <BodyProvider initialBodies={listBodies()} referenceData={listBodyReferenceData()}>{children}</BodyProvider>;
}
