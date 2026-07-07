type CinematicOrbitSceneProps = {
  children: React.ReactNode;
  className?: string;
};

export default function CinematicOrbitScene({
  children,
  className = "",
}: CinematicOrbitSceneProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
