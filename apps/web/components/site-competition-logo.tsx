import Image from "next/image";

type SiteCompetitionLogoProps = {
  className?: string;
  height: number;
  width: number;
  priority?: boolean;
};

export function SiteCompetitionLogo({
  className,
  height,
  width,
  priority = false,
}: SiteCompetitionLogoProps) {
  return (
    <Image
      src="/branding/cdcc-logo.png"
      alt="中国大学生计算机设计大赛标识"
      width={width}
      height={height}
      priority={priority}
      className={className}
      style={{ height: "auto" }}
    />
  );
}
