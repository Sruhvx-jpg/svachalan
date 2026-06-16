type Props = {
  toolName: string;
};

export function AiToolView({
  toolName,
}: Props) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8">
      <div className="flex min-h-[450px] items-center justify-center">
        <h2 className="text-2xl font-semibold">
          {toolName}
        </h2>
      </div>
    </div>
  );
}