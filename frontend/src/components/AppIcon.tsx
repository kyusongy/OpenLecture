export default function AppIcon({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/app-icon.png"
      alt="OpenLecture"
      width={size}
      height={size}
      className="rounded-lg"
    />
  );
}
