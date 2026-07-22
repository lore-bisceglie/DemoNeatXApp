import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  return <ResetPasswordForm slug={slug} token={query.token || ""} />;
}
